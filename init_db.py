import sqlite3
import bcrypt
import os
import cv2

DB_FILE = "database.db"

def generate_thumbnail(video_path, output_path):
    """
    Genera una thumbnail da un video prendendo un frame significativo
    
    Args:
        video_path (str): Percorso del file video
        output_path (str): Percorso dove salvare la thumbnail
        
    Returns:
        bool: True se la generazione è avvenuta con successo, False altrimenti
    """
    try:
        # Apri il video
        video = cv2.VideoCapture(video_path)
        
        # Verifica che il video sia stato aperto correttamente
        if not video.isOpened():
            print(f"Impossibile aprire il video: {video_path}")
            return False

        # Ottieni il numero totale di frame
        total_frames = int(video.get(cv2.CAP_PROP_FRAME_COUNT))
        if total_frames <= 0:
            print(f"Video non valido: {video_path}")
            return False

        # Prova a prendere un frame a circa 1/3 del video
        target_frame = total_frames // 3
        video.set(cv2.CAP_PROP_POS_FRAMES, target_frame)
        success, frame = video.read()

        # Se il frame non è valido, prova frames successivi
        attempts = 0
        while not success and attempts < 10:
            target_frame += total_frames // 10
            if target_frame >= total_frames:
                target_frame = total_frames - 1
            video.set(cv2.CAP_PROP_POS_FRAMES, target_frame)
            success, frame = video.read()
            attempts += 1

        if not success:
            print(f"Impossibile leggere un frame valido dal video: {video_path}")
            return False

        # Verifica che il frame non sia completamente nero o bianco
        if frame is not None:
            # Calcola la luminosità media del frame
            brightness = cv2.mean(frame)[0]
            
            # Se il frame è troppo scuro o troppo chiaro, prova a trovarne uno migliore
            if brightness < 30 or brightness > 225:  # valori soglia per scuro/chiaro
                for i in range(0, total_frames, total_frames // 10):
                    video.set(cv2.CAP_PROP_POS_FRAMES, i)
                    success, new_frame = video.read()
                    if success:
                        new_brightness = cv2.mean(new_frame)[0]
                        if 30 < new_brightness < 225:
                            frame = new_frame
                            break

        # Salva il frame come immagine
        success = cv2.imwrite(output_path, frame)
        if not success:
            print(f"Impossibile salvare la thumbnail: {output_path}")
            return False
            
        video.release()
        return True
        
    except Exception as e:
        print(f"Errore durante la generazione della thumbnail: {e}")
        return False
    finally:
        if 'video' in locals():
            video.release()


# Se il database non esiste, lo inizializza creando le tabelle basiche
def initialize_db():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()

    # --- OBIETTIVI --- 
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS Obiettivi (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL UNIQUE
        );
    """)

    # --- UTENTI ---
    # is_trainer = TRUE se è un personal trainer
    # varchar in sqlite è TEXT
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS Utenti (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            is_trainer BOOLEAN NOT NULL,
            username TEXT NOT NULL,
            surname TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            phone TEXT NOT NULL UNIQUE,
            date_of_birth DATE NOT NULL, 
            password_hash TEXT NOT NULL,
            password_change_required BOOLEAN DEFAULT FALSE,
            obiettivo_id INTEGER,
            FOREIGN KEY (obiettivo_id) REFERENCES Obiettivi(id)
        );
    """)

    # --- COLLEGAMENTO CLIENTI-TRAINER ---
    # Ogni cliente può avere più trainer e ogni trainer può avere più clienti
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS Clienti_Trainer (
            cliente_id INTEGER NOT NULL,
            trainer_id INTEGER NOT NULL,
            PRIMARY KEY (cliente_id, trainer_id),
            FOREIGN KEY (cliente_id) REFERENCES Utenti(id),
            FOREIGN KEY (trainer_id) REFERENCES Utenti(id)
        );
    """)

    # --- GRUPPO MUSCOLARE --- 
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS Gruppi_Muscolari (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL UNIQUE
        );
    """)

    # --- DIFFICOLTA --- 
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS Difficolta (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            livello TEXT NOT NULL UNIQUE
        );
    """)

    # --- ESERCIZI --- 
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS Esercizi (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            descrizione TEXT,
            video_url TEXT,
            immagine_url TEXT,
            obiettivo_id INTEGER NOT NULL,
            difficolta_id INTEGER NOT NULL,
            FOREIGN KEY (obiettivo_id) REFERENCES Obiettivi(id),
            FOREIGN KEY (difficolta_id) REFERENCES Difficolta(id)
        );
    """)

    # --- ASSOCIAZIONE ESERCIZI --- 
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS Esercizi_Muscoli (
            esercizio_id INTEGER NOT NULL,
            muscolo_id INTEGER NOT NULL,
            tipo TEXT CHECK(tipo IN ('primario', 'secondario')) NOT NULL,
            PRIMARY KEY (esercizio_id, muscolo_id, tipo),
            FOREIGN KEY (esercizio_id) REFERENCES Esercizi(id),
            FOREIGN KEY (muscolo_id) REFERENCES Gruppi_Muscolari(id)
        );
    """)

    # --- MACCHINARI ---
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS Macchinari (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL UNIQUE
        );
    """)    

    # --- SCHEDE ALLENAMETO ---
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS Schede (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cliente_id INTEGER NOT NULL,
            trainer_id INTEGER NOT NULL,
            creato DATETIME DEFAULT CURRENT_TIMESTAMP,
            aggiornato DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (cliente_id) REFERENCES Utenti(id),
            FOREIGN KEY (trainer_id) REFERENCES Utenti(id)
        );
    """)        

    # --- ESERCIZI DELLE SCHEDE ---
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS Schede_Esercizi (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            scheda_id INTEGER NOT NULL,
            esercizio_id INTEGER NOT NULL,
            macchinario_id INTEGER,
            ripetizioni INTEGER,
            serie INTEGER,
            durata_secondi INTEGER,
            recupero_secondi INTEGER,
            peso_kg REAL,
            FOREIGN KEY (scheda_id) REFERENCES Schede(id),
            FOREIGN KEY (esercizio_id) REFERENCES Esercizi(id),
            FOREIGN KEY (macchinario_id) REFERENCES Macchinari(id)
        );
    """)    

    # --- STORICO DELLE SCHEDE ---
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS Storico_Schede (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            scheda_id INTEGER NOT NULL,
            cliente_id INTEGER NOT NULL,
            trainer_id INTEGER NOT NULL,
            data_salvataggio DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (scheda_id) REFERENCES Schede(id),
            FOREIGN KEY (cliente_id) REFERENCES Utenti(id),
            FOREIGN KEY (trainer_id) REFERENCES Utenti(id)
        );    
    """)

    conn.close()

# funzione che inserisce i dati di default nel database
def populate_database():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    try:
        # --- INSERIMENTO GRUPPI MUSCOLARI ---
        muscle_groups = [
            'Spalle',
            'Pettorali',
            'Bicipiti',
            'Avambracci',
            'Addominali',
            'Abduttori',
            'Quadricipiti',
            'Cardio',
            'Stretching',
            'Trapezi',
            'Tricipiti',
            'Dorsali',
            'Glutei',
            'Adduttori',
            'Femorali',
            'Polpacci'
        ]
        
        for i in muscle_groups:
            # Inserisci dentro la tabella Gruppi_Muscolari, nel campo nome, il valore di i
            # ? è il placeholder per i valori da inserire, i con la virgola indica che è una tupla
            cursor.execute("INSERT OR IGNORE INTO Gruppi_Muscolari (nome) VALUES (?)", (i,))

        # --- INSERIMENTO OBIETTIVI ---
        objectives = [
            'Dimagrimento',
            'Tonificazione',
            'Massa muscolare',
            'Mobilità',
            'Propriocezione'
        ]
        
        for i in objectives:
            cursor.execute("INSERT OR IGNORE INTO Obiettivi (nome) VALUES (?)", (i,))

        # --- INSERIMENTO DIFFICOLTÀ ---
        difficulties = [
            'Facile',
            'Medio', 
            'Difficile',
        ]
        
        for diff in difficulties:
            cursor.execute("INSERT OR IGNORE INTO Difficolta (livello) VALUES (?)", (diff,))

        conn.commit()
    except Exception as e:
        print(f"Errore durante il popolamento del database: {e}")
        conn.rollback()
    finally:
        conn.close()
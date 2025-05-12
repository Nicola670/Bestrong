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
    # varchar in sqlite è TEXTclau
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
        # Verifica se il trainer esiste già
        cursor.execute("SELECT id FROM Utenti WHERE username = 'admin' AND is_trainer = 1")
        trainer = cursor.fetchone()
        
        if trainer is None:
            # Se il trainer non esiste, crealo con tutti i campi obbligatori
            hashed_password = bcrypt.hashpw("test123".encode('utf-8'), bcrypt.gensalt())
            cursor.execute("""
                INSERT INTO Utenti (
                    username, 
                    password_hash, 
                    is_trainer,
                    surname,
                    email,
                    phone,
                    date_of_birth
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                'admin',
                hashed_password,
                1,
                'Admin',                    
                'admin@bestrong.com',     
                '1234567890',              
                '2000-01-01'               
            ))
            conn.commit()
            
            # Ora prendi l'ID del trainer appena creato
            cursor.execute("SELECT id FROM Utenti WHERE username = 'admin' AND is_trainer = 1")
            trainer = cursor.fetchone()
            
        trainer_id = trainer[0]

        # Verifica se il cliente esiste già
        cursor.execute("SELECT id FROM Utenti WHERE username = 'cliente'")
        test_user = cursor.fetchone()
        
        if test_user is None:
            # Creazione utente di test con credenziali diverse
            test_password = bcrypt.hashpw("test123".encode('utf-8'), bcrypt.gensalt())
            cursor.execute("""
                INSERT INTO Utenti (
                    username,
                    password_hash,
                    is_trainer,
                    surname,
                    email,
                    phone,
                    date_of_birth
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                'cliente',
                test_password,
                0,                          
                'TestUser',                 
                'cliente@bestrong.com',     # email diversa
                '0987654321',              # telefono diverso
                '1995-05-15'               
            ))
            conn.commit()

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

        # --- INSERIMENTO MACCHINARI ---
        machines = [
            'Panca piana',
            'Lat machine',
            'Leg press',
            'Chest press',
            'Shoulder press',
            'Cyclette',
            'Tapis roulant',
            'Cable machine'
        ]
        
        for machine in machines:
            cursor.execute("INSERT OR IGNORE INTO Macchinari (nome) VALUES (?)", (machine,))

        # --- INSERIMENTO ESERCIZI ---
        exercises = [
            ('Panca Piana', 'Distendersi sulla panca e spingere il bilanciere', 'AffondiBulgari.mp4', 1, 2),
            ('Trazioni', 'Trazione alla sbarra', 'AffondiBulgari.mp4', 1, 3),
            ('Military Press', 'Press sopra la testa', 'AffondiBulgari.mp4', 1, 2),
            ('Squat', 'Piegamenti gambe con bilanciere', 'AffondiBulgari.mp4', 3, 2),
            ('Curl Bicipiti', 'Curl con manubri', 'AffondiBulgari.mp4', 1, 1),
            ('Crunch', 'Addominali a terra', 'AffondiBulgari.mp4', 2, 1)
        ]

        # Definisci i percorsi delle directory
        videos_dir = os.path.join('static', 'videos')
        thumbnails_dir = os.path.join('static', 'thumbnails')
        
        # Crea le directory se non esistono
        os.makedirs(videos_dir, exist_ok=True)
        os.makedirs(thumbnails_dir, exist_ok=True)
        
        for nome, descrizione, video_url, obiettivo_id, difficolta_id in exercises:
            # Genera il percorso del video e della thumbnail
            video_path = os.path.join(videos_dir, video_url)
            thumbnail_name = os.path.splitext(video_url)[0] + '.jpg'
            thumbnail_path = os.path.join(thumbnails_dir, thumbnail_name)
            
            # Genera la thumbnail se il video esiste
            if os.path.exists(video_path):
                generate_thumbnail(video_path, thumbnail_path)
                relative_thumbnail_path = os.path.join('thumbnails', thumbnail_name)
            else:
                relative_thumbnail_path = None

            # Inserisci l'esercizio con il percorso della thumbnail
            cursor.execute("""
                INSERT OR IGNORE INTO Esercizi (
                    nome, descrizione, video_url, immagine_url, obiettivo_id, difficolta_id
                )
                VALUES (?, ?, ?, ?, ?, ?)
            """, (nome, descrizione, video_url, relative_thumbnail_path, obiettivo_id, difficolta_id))

        # --- INSERIMENTO SCHEDE ---
        # Prima otteniamo alcuni ID necessari
        cursor.execute("SELECT id FROM Utenti WHERE is_trainer = TRUE LIMIT 1")
        trainer_id = cursor.fetchone()[0]
        
        cursor.execute("SELECT id FROM Utenti WHERE is_trainer = FALSE AND username != 'admin' LIMIT 2")
        client_ids = [row[0] for row in cursor.fetchall()]

        # Crea solo 3 schede di test per ogni cliente
        for client_id in client_ids:
            for _ in range(3):  # Crea 3 schede invece di tutte quelle duplicate
                cursor.execute("""
                    INSERT INTO Schede (cliente_id, trainer_id, creato, aggiornato)
                    VALUES (?, ?, datetime('now'), datetime('now'))
                """, (client_id, trainer_id))
                
                scheda_id = cursor.lastrowid
                
                # Aggiungi esercizi diversi per ogni scheda
                esercizi_scheda = [
                    (1, 1, 4, 12, 60, None),  # Panca Piana
                    (2, None, 3, 10, 90, None),  # Trazioni
                    (4, 3, 4, 15, 60, 60.0),  # Squat
                    (5, None, 3, 12, 60, None),  # Curl Bicipiti
                    (6, None, 3, 20, 45, None)   # Crunch
                ]
                
                # Prendi solo 3 esercizi casuali per ogni scheda
                import random
                selected_exercises = random.sample(esercizi_scheda, 3)
                
                for es_id, mac_id, serie, reps, rec, peso in selected_exercises:
                    cursor.execute("""
                        INSERT INTO Schede_Esercizi 
                        (scheda_id, esercizio_id, macchinario_id, serie, ripetizioni, recupero_secondi, peso_kg)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    """, (scheda_id, es_id, mac_id, serie, reps, rec, peso))

        # Aggiungi le associazioni esercizi-muscoli
        esercizi_muscoli = [
            (1, 2, 'primario'),   # Panca Piana -> Pettorali
            (2, 12, 'primario'),  # Trazioni -> Dorsali
            (4, 7, 'primario'),   # Squat -> Quadricipiti
            (5, 3, 'primario'),   # Curl Bicipiti -> Bicipiti
            (6, 5, 'primario')    # Crunch -> Addominali
        ]
        
        for es_id, musc_id, tipo in esercizi_muscoli:
            cursor.execute("""
                INSERT INTO Esercizi_Muscoli (esercizio_id, muscolo_id, tipo)
                VALUES (?, ?, ?)
            """, (es_id, musc_id, tipo))

        conn.commit()
    except Exception as e:
        print(f"Errore durante il popolamento del database: {e}")
        conn.rollback()
    finally:
        conn.close()
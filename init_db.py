import sqlite3
import bcrypt

DB_FILE = "database.db"

# Se il database non esiste, lo inizializza creando le tabelle basiche
def initialize_db():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()

    # --- UTENTI ---
    # is_trainer = TRUE se è un personal trainer
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS Utenti (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            is_trainer BOOLEAN NOT NULL,
            username TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL
        );
    """)

    # --- GRUPPO MUSCOLARE --- 
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS Gruppi_Muscolari (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL UNIQUE
        );
    """)

    # --- OBIETTIVI --- 
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS Obiettivi (
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
    
    for i in difficulties:
        cursor.execute("INSERT OR IGNORE INTO Difficolta (livello) VALUES (?)", (i,))

    # personal trainer per test
    # da cancellare
    
    psw = "test123"
    bytes = psw.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(bytes, salt)
    
    cursor.execute("INSERT OR IGNORE INTO Utenti (username, password_hash, is_trainer) VALUES (?, ?, ?)", ('admin', hashed_password, True))
    cursor.execute("INSERT OR IGNORE INTO Utenti (username, password_hash, is_trainer) VALUES (?, ?, ?)", ('cliente1', hashed_password, False))
    
    
    # commit serve per salvare le modifiche nel database quando si fa un INSERT 
    conn.commit()
    conn.close()
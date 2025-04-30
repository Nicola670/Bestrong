import sqlite3
import os
import bcrypt

DB_FILE = "database.db"

# Se il database non esiste, lo inizializza
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

def populate_database():
    # Assicurati che il database sia inizializzato
    initialize_db()
    
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()

    # --- INSERIMENTO TRAINER ---
    trainers = [
        ('paolo ambruoso', '123', True),
    ]
    
    for username, password, is_trainer in trainers:
        hashed_pw = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        cursor.execute("""
            INSERT OR IGNORE INTO Utenti (username, password_hash, is_trainer)
            VALUES (?, ?, ?)
        """, (username, hashed_pw, is_trainer))

    # --- INSERIMENTO CLIENTI ---
    clients = [
        ('matteo martini', '123'),
    ]
    
    for username, password in clients:
        hashed_pw = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        cursor.execute("""
            INSERT OR IGNORE INTO Utenti (username, password_hash, is_trainer)
            VALUES (?, ?, FALSE)
        """, (username, hashed_pw))

    # --- INSERIMENTO GRUPPI MUSCOLARI ---
    muscle_groups = [
        'Pettorali',
        'Dorsali',
        'Spalle',
        'Bicipiti',
        'Tricipiti',
        'Addominali',
        'Quadricipiti',
        'Femorali',
        'Polpacci'
    ]
    
    for muscle in muscle_groups:
        cursor.execute("INSERT OR IGNORE INTO Gruppi_Muscolari (nome) VALUES (?)", (muscle,))

    # --- INSERIMENTO OBIETTIVI ---
    objectives = [
        'Massa muscolare',
        'Definizione',
        'Forza',
        'Resistenza',
        'Dimagrimento'
    ]
    
    for obj in objectives:
        cursor.execute("INSERT OR IGNORE INTO Obiettivi (nome) VALUES (?)", (obj,))

    # --- INSERIMENTO DIFFICOLTÀ ---
    difficulties = ['Principiante', 'Intermedio', 'Avanzato']
    
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
        ('Panca Piana', 'Distendersi sulla panca e spingere il bilanciere', 1, 2),
        ('Trazioni', 'Trazione alla sbarra', 1, 3),
        ('Military Press', 'Press sopra la testa', 1, 2),
        ('Squat', 'Piegamenti gambe con bilanciere', 3, 2),
        ('Curl Bicipiti', 'Curl con manubri', 1, 1),
        ('Crunch', 'Addominali a terra', 2, 1)
    ]
    
    for nome, descrizione, obiettivo_id, difficolta_id in exercises:
        cursor.execute("""
            INSERT OR IGNORE INTO Esercizi (nome, descrizione, obiettivo_id, difficolta_id)
            VALUES (?, ?, ?, ?)
        """, (nome, descrizione, obiettivo_id, difficolta_id))

    # --- INSERIMENTO SCHEDE ---
    # Prima otteniamo alcuni ID necessari
    cursor.execute("SELECT id FROM Utenti WHERE is_trainer = TRUE LIMIT 1")
    trainer_id = cursor.fetchone()[0]
    
    cursor.execute("SELECT id FROM Utenti WHERE is_trainer = FALSE AND username != 'admin' LIMIT 2")
    client_ids = [row[0] for row in cursor.fetchall()]

    # Creiamo alcune schede
    for client_id in client_ids:
        cursor.execute("""
            INSERT INTO Schede (cliente_id, trainer_id)
            VALUES (?, ?)
        """, (client_id, trainer_id))
        
        scheda_id = cursor.lastrowid
        
        # Aggiungiamo esercizi alle schede
        esercizi_scheda = [
            (1, 1, 4, 12, 60, None),  # (esercizio_id, macchinario_id, serie, ripetizioni, recupero, peso)
            (2, None, 3, 10, 90, None),
            (4, 3, 4, 15, 60, 60.0)
        ]
        
        for es_id, mac_id, serie, reps, rec, peso in esercizi_scheda:
            cursor.execute("""
                INSERT INTO Schede_Esercizi 
                (scheda_id, esercizio_id, macchinario_id, serie, ripetizioni, recupero_secondi, peso_kg)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (scheda_id, es_id, mac_id, serie, reps, rec, peso))

    conn.commit()
    conn.close()
    print("Database popolato con successo!")
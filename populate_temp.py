import sqlite3

import db_operations as database 

def populate_temp():
    conn = sqlite3.connect(database.DB_FILE)
    cursor = conn.cursor()

    temp_password = "temp123"
    hashed_password = database.hash_password(temp_password)

    try:
        cursor.execute('DELETE FROM Storico_Schede')
        cursor.execute('DELETE FROM Schede_Esercizi')
        cursor.execute('DELETE FROM Schede')
        cursor.execute('DELETE FROM Clienti_Trainer')
        cursor.execute('DELETE FROM Utenti')
        conn.commit()
    except Exception as e:
        print(f"Errore durante la pulizia del database: {e}")
        conn.rollback()

    # Inserimento macchinari
    cursor.execute('''
    INSERT OR IGNORE INTO Macchinari (nome) VALUES 
    ('Leg Press'),
    ('Lat Machine'),
    ('Panca Piana'),
    ('Panca Inclinata'),
    ('Chest Press'),
    ('Shoulder Press'),
    ('Cable Crossover'),
    ('Leg Extension'),
    ('Leg Curl'),
    ('Abdominal Crunch'),
    ('Tapis Roulant'),
    ('Cyclette'),
    ('Ellittica'),
    ('Manubri'),
    ('Bilanciere'),
    ('TRX'),
    ('Kettlebell'),
    ('Smith Machine')
    ''')

    # Inserimento trainer
    cursor.execute('''
    INSERT INTO Utenti (is_trainer, username, surname, email, phone, date_of_birth, password_hash) VALUES 
    (TRUE, 'Marco', 'Rossi', 'marco.rossi@example.com', '+393331234567', '1985-05-12', ?),
    (TRUE, 'Laura', 'Bianchi', 'laura.bianchi@example.com', '+393337654321', '1990-10-22', ?)
    ''', (hashed_password, hashed_password))

    # Inserimento clienti
    cursor.execute('''
    INSERT INTO Utenti (is_trainer, username, surname, email, phone, date_of_birth, password_hash, password_change_required, obiettivo_id) VALUES 
    (FALSE, 'Giovanni', 'Verdi', 'giovanni.verdi@example.com', '+393339876543', '1992-03-15', ?, 1, 1),
    (FALSE, 'Francesca', 'Neri', 'francesca.neri@example.com', '+393335678901', '1988-07-25', ?, 1, 2),
    (FALSE, 'Alessandro', 'Gialli', 'alessandro.gialli@example.com', '+393332345678', '1995-11-30', ?, 1, 3),
    (FALSE, 'Claudia', 'Blu', 'claudia.blu@example.com', '+393338765432', '1990-09-18', ?, 1, 2),
    (FALSE, 'Roberto', 'Viola', 'roberto.viola@example.com', '+393334567890', '1982-04-05', ?, 1, 4)
    ''', (hashed_password, hashed_password, hashed_password, hashed_password, hashed_password))

    # Associazione clienti-trainer
    cursor.execute('''
    INSERT INTO Clienti_Trainer (cliente_id, trainer_id) VALUES 
    (3, 1),
    (5, 1),
    (7, 1)
    ''')

    cursor.execute('''
    INSERT INTO Clienti_Trainer (cliente_id, trainer_id) VALUES 
    (4, 2),
    (6, 2)
    ''')

    # Inserimento esercizi
    cursor.execute('''
    INSERT INTO Esercizi (nome, descrizione, obiettivo_id, difficolta_id) VALUES
    ('Burpees', 'Esercizio completo che coinvolge tutto il corpo. Partire in piedi, scendere in posizione di plank, fare un piegamento, tornare in posizione accovacciata e saltare verso l alto.', 1, 3),
    ('Jumping Jacks', 'In piedi con le gambe unite e le braccia lungo i fianchi, saltare allargando le gambe e sollevando le braccia sopra la testa, poi tornare alla posizione iniziale.', 1, 1),
    ('Mountain Climbers', 'In posizione di plank, portare alternativamente le ginocchia al petto con un movimento rapido.', 1, 2),
    ('Plank', 'Mantenere la posizione di plank sui gomiti, con il corpo allineato dalla testa ai piedi.', 2, 2),
    ('Squat', 'Piegare le ginocchia mantenendo la schiena dritta, come se ci si stesse per sedere, poi risalire.', 2, 1),
    ('Push-ups', 'Piegamenti sulle braccia, mantenendo il corpo rigido dalla testa ai piedi.', 2, 2),
    ('Bench Press', 'Distesi sulla panca, abbassare e sollevare il bilanciere all altezza del petto.', 3, 2),
    ('Deadlift', 'Sollevare un bilanciere da terra fino ad avere il corpo completamente eretto.', 3, 3),
    ('Pull-ups', 'Trazione alla sbarra, partendo con le braccia distese e tirando fino a portare il mento sopra la sbarra.', 3, 3),
    ('Hip Opener', 'Esercizio per migliorare la mobilità dell anca.', 4, 1),
    ('Shoulder Dislocates', 'Esercizio con banda elastica per migliorare la mobilità delle spalle.', 4, 2),
    ('Ankle Mobility', 'Esercizio per migliorare la mobilità delle caviglie.', 4, 1),
    ('Single Leg Balance', 'Mantenere l equilibrio su una gamba sola.', 5, 1),
    ('Bosu Ball Squats', 'Eseguire squat stando in equilibrio su una Bosu Ball.', 5, 3),
    ('Stability Ball Plank', 'Eseguire il plank con i gomiti appoggiati su una palla da stabilità.', 5, 2)
    ''')

    # Associazione esercizi-muscoli
    cursor.execute('''
    INSERT OR IGNORE INTO Esercizi_Muscoli (esercizio_id, muscolo_id, tipo) VALUES
    (1, 2, 'primario'), (1, 5, 'primario'), (1, 7, 'primario'), (1, 13, 'secondario'), (1, 8, 'secondario'),
    (2, 1, 'secondario'), (2, 7, 'primario'), (2, 8, 'primario'),
    (3, 5, 'primario'), (3, 8, 'primario'), (3, 7, 'secondario'),
    (4, 5, 'primario'), (4, 1, 'secondario'), (4, 13, 'secondario'),
    (5, 7, 'primario'), (5, 13, 'primario'), (5, 15, 'secondario'),
    (6, 2, 'primario'), (6, 11, 'secondario'), (6, 5, 'secondario'),
    (7, 2, 'primario'), (7, 11, 'secondario'), (7, 1, 'secondario'),
    (8, 12, 'primario'), (8, 13, 'primario'), (8, 15, 'primario'), (8, 5, 'secondario'),
    (9, 12, 'primario'), (9, 3, 'secondario'), (9, 10, 'secondario'),
    (10, 13, 'primario'), (10, 6, 'primario'), (10, 14, 'primario'),
    (11, 1, 'primario'), (11, 10, 'secondario'),
    (12, 16, 'primario'), (12, 9, 'primario'),
    (13, 7, 'secondario'), (13, 16, 'secondario'),
    (14, 7, 'primario'), (14, 13, 'primario'), (14, 5, 'secondario'),
    (15, 5, 'primario'), (15, 1, 'secondario'), (15, 2, 'secondario')
    ''')

    # Creazione schede
    cursor.execute('''INSERT INTO Schede (cliente_id, trainer_id) VALUES (3, 1)''')
    
    cursor.execute('''
    INSERT INTO Schede_Esercizi (scheda_id, esercizio_id, macchinario_id, ripetizioni, serie, recupero_secondi) VALUES
    (1, 1, NULL, 15, 3, 45), (1, 2, NULL, 30, 4, 30), (1, 3, NULL, 20, 3, 45), (1, 5, NULL, 15, 3, 60)
    ''')

    cursor.execute('''INSERT INTO Schede (cliente_id, trainer_id) VALUES (4, 2)''')
    
    cursor.execute('''
    INSERT INTO Schede_Esercizi (scheda_id, esercizio_id, macchinario_id, ripetizioni, serie, recupero_secondi) VALUES
    (2, 4, NULL, 60, 3, 45), (2, 5, NULL, 15, 4, 60), (2, 6, NULL, 10, 3, 60), (2, 14, NULL, 12, 3, 90)
    ''')

    cursor.execute('''INSERT INTO Schede (cliente_id, trainer_id) VALUES (5, 1)''')
    
    cursor.execute('''
    INSERT INTO Schede_Esercizi (scheda_id, esercizio_id, macchinario_id, ripetizioni, serie, recupero_secondi, peso_kg) VALUES
    (3, 7, 3, 8, 4, 120, 80), (3, 8, 15, 6, 3, 180, 100), (3, 9, NULL, 8, 3, 120, NULL), (3, 5, 18, 10, 4, 120, 60)
    ''')

    cursor.execute('''INSERT INTO Schede (cliente_id, trainer_id) VALUES (6, 2)''')
    
    cursor.execute('''
    INSERT INTO Schede_Esercizi (scheda_id, esercizio_id, macchinario_id, ripetizioni, serie, recupero_secondi) VALUES
    (4, 5, NULL, 15, 3, 60), (4, 6, NULL, 10, 3, 45), (4, 4, NULL, 45, 4, 30), (4, 13, NULL, 30, 3, 60)
    ''')

    cursor.execute('''INSERT INTO Schede (cliente_id, trainer_id) VALUES (7, 1)''')
    
    cursor.execute('''
    INSERT INTO Schede_Esercizi (scheda_id, esercizio_id, macchinario_id, durata_secondi, serie, recupero_secondi) VALUES
    (5, 10, NULL, 60, 3, 30), (5, 11, NULL, 45, 4, 30), (5, 12, NULL, 60, 3, 30), (5, 9, NULL, 30, 2, 60)
    ''')

    # Inserimento storico schede
    cursor.execute('''
    INSERT INTO Storico_Schede (scheda_id, cliente_id, trainer_id, data_salvataggio) VALUES
    (1, 3, 1, '2024-04-10 10:15:30')
    ''')

    conn.commit()
    conn.close()
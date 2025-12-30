import sqlite3
import os

import db_operations as database 

def populate_temp():
    conn = sqlite3.connect(database.DB_FILE)
    cursor = conn.cursor()

    temp_password = "test123"
    hashed_password = database.hash_password(temp_password)

    try:
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
    INSERT OR IGNORE INTO Utenti (is_trainer, username, surname, email, phone, date_of_birth, password_hash) VALUES 
    (TRUE, 'Marco', 'Rossi', 'marco.rossi@example.com', '+393331234567', '1985-05-12', ?)
    ''', (hashed_password,))

    # Inserimento clienti
    cursor.execute('''
    INSERT OR IGNORE INTO Utenti (is_trainer, username, surname, email, phone, date_of_birth, password_hash, password_change_required, obiettivo_id) VALUES 
    (FALSE, 'Giovanni', 'Verdi', 'giovanni.verdi@example.com', '+393339876543', '1992-03-15', ?, 1, 1)
    ''', (hashed_password,))

    # Associazione clienti-trainer
    cursor.execute('''
    INSERT OR IGNORE INTO Clienti_Trainer (cliente_id, trainer_id) VALUES 
    (2, 1)
    ''')


    # Associazione esercizi-muscoli
    cursor.execute('''
    INSERT OR IGNORE INTO Esercizi_Muscoli (esercizio_id, muscolo_id, tipo) VALUES
        -- AffondiBulgari (id: 1)
        (1, 7, 'primario'), -- Quadricipiti
        (1, 13, 'primario'), -- Glutei  
        (1, 15, 'secondario'), -- Femorali

        -- Alzate Frontali (id: 2)
        (2, 1, 'primario'), -- Spalle
        (2, 3, 'secondario'), -- Bicipiti

        -- Bench Press (id: 5)
        (5, 2, 'primario'), -- Pettorali
        (5, 11, 'secondario'), -- Tricipiti

        -- Lat Pulldown (id: 13)
        (13, 12, 'primario'), -- Dorsali
        (13, 3, 'secondario'), -- Bicipiti

        -- Squat (id: 29)
        (29, 7, 'primario'), -- Quadricipiti
        (29, 13, 'primario'), -- Glutei
        (29, 15, 'secondario'), -- Femorali
        (29, 16, 'secondario'), -- Polpacci

        -- Shoulder Press (id: 28)
        (28, 1, 'primario'), -- Spalle
        (28, 11, 'secondario'), -- Tricipiti

        -- Leg Press (id: 16)
        (16, 7, 'primario'), -- Quadricipiti
        (16, 13, 'secondario'), -- Glutei

        -- Push-Up (id: 24)
        (24, 2, 'primario'), -- Pettorali
        (24, 11, 'secondario'), -- Tricipiti

        -- Rematore (id: 25)
        (25, 12, 'primario'), -- Dorsali
        (25, 3, 'secondario'), -- Bicipiti

        -- Plank (id: 21)
        (21, 5, 'primario') -- Addominali
    ''')

    conn.commit()
    conn.close()
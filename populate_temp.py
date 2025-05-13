import sqlite3
import os

import db_operations as database 

def populate_temp():
    conn = sqlite3.connect(database.DB_FILE)
    cursor = conn.cursor()

    temp_password = "test123"
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
    (TRUE, 'Marco', 'Rossi', 'marco.rossi@example.com', '+393331234567', '1985-05-12', ?)
    ''', (hashed_password,))

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

    # Creazione schede
    cursor.execute('''
    INSERT INTO Schede (cliente_id, trainer_id) VALUES
        (3, 1), -- Giovanni Verdi - Marco Rossi
        (4, 2), -- Francesca Neri - Laura Bianchi
        (5, 1), -- Alessandro Gialli - Marco Rossi
        (6, 2), -- Claudia Blu - Laura Bianchi
        (7, 1)  -- Roberto Viola - Marco Rossi
    ''')

    # Inserimento esercizi nelle schede
    cursor.execute('''
    INSERT INTO Schede_Esercizi (scheda_id, esercizio_id, macchinario_id, serie, ripetizioni, peso_kg, recupero_secondi) VALUES
        -- Scheda 1 (Giovanni Verdi - Dimagrimento)
        (1, 13, 2, 3, 12, 40, 60),  -- Lat Pulldown
        (1, 16, 1, 4, 15, 80, 90),  -- Leg Press
        (1, 21, NULL, 3, 30, NULL, 45),  -- Plank

        -- Scheda 2 (Francesca Neri - Tonificazione)
        (2, 24, NULL, 3, 12, NULL, 60),  -- Push-Up
        (2, 2, 14, 3, 15, 5, 45),   -- Alzate Frontali
        (2, 21, NULL, 3, 45, NULL, 30),  -- Plank

        -- Scheda 3 (Alessandro Gialli - Massa muscolare)
        (3, 5, 3, 4, 8, 70, 120),   -- Bench Press
        (3, 29, 15, 4, 8, 100, 120), -- Squat
        (3, 25, 15, 4, 10, 60, 90),  -- Rematore

        -- Scheda 4 (Claudia Blu - Tonificazione)
        (4, 1, NULL, 3, 12, NULL, 60),   -- Affondi Bulgari
        (4, 28, 6, 3, 12, 20, 60),   -- Shoulder Press
        (4, 21, NULL, 3, 40, NULL, 30),  -- Plank

        -- Scheda 5 (Roberto Viola - Mobilità)
        (5, 16, 1, 3, 15, 60, 60),   -- Leg Press
        (5, 24, NULL, 3, 10, NULL, 45),  -- Push-Up
        (5, 21, NULL, 4, 30, NULL, 30)   -- Plank
    ''')

    # Inserimento storico schede
    cursor.execute('''
    INSERT INTO Storico_Schede (scheda_id, cliente_id, trainer_id) VALUES
        (1, 3, 1),
        (2, 4, 2),
        (3, 5, 1),
        (4, 6, 2),
        (5, 7, 1)
    ''')

    conn.commit()
    conn.close()
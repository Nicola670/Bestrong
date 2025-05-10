import sqlite3
import bcrypt
from init_db import DB_FILE

def hash_password(password):
    """Genera l'hash della password"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

def verify_password(password, hashed):
    """Verifica la password"""
    try:
        return bcrypt.checkpw(password.encode('utf-8'), hashed)
    except Exception as e:
        print(f"Errore nella verifica della password: {e}")
        return False

def get_user_by_id(user_id):
    """Ottiene un utente dal suo ID"""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT 
                u.id,
                u.username,
                u.surname,
                u.email,
                u.phone,
                u.date_of_birth,
                u.password_hash,
                u.is_trainer,
                u.password_change_required,
                o.nome as obiettivo
            FROM Utenti u
            LEFT JOIN Obiettivi o ON u.obiettivo_id = o.id
            WHERE u.id = ?
        """, (user_id,))
        user = cursor.fetchone()
        if user:
            return {
                'id': user[0],
                'username': user[1],
                'surname': user[2],
                'email': user[3],
                'phone': user[4],
                'date_of_birth': user[5],
                'password': user[6],
                'is_trainer': user[7],
                'password_change_required': user[8],
                'obiettivo': user[9]
            }
        return None
    finally:
        conn.close()

def get_user_by_email(email):
    """Ottiene un utente dalla sua email"""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT 
                u.id,
                u.username,
                u.surname,
                u.email,
                u.phone,
                u.date_of_birth,
                u.is_trainer,
                o.nome as obiettivo
            FROM Utenti u
            LEFT JOIN Obiettivi o ON u.obiettivo_id = o.id
            WHERE u.email = ?
        """, (email,))
        user = cursor.fetchone()
        if user:
            return {
                'id': user[0],
                'username': user[1],
                'surname': user[2],
                'email': user[3],
                'phone': user[4],
                'date_of_birth': user[5],
                'is_trainer': user[6],
                'obiettivo': user[7]
            }
        return None
    finally:
        conn.close()

def get_user_by_phone(phone):
    """Ottiene un utente dal suo numero di telefono"""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id FROM Utenti WHERE phone = ?", (phone,))
        result = cursor.fetchone()
        return result[0] if result else None
    finally:
        conn.close()

def get_user_by_username(username):
    """Ottiene un utente dal suo username"""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT 
                u.id,
                u.username,
                u.password_hash,
                u.is_trainer,
                u.password_change_required
            FROM Utenti u
            WHERE u.username = ?
        """, (username,))
        user = cursor.fetchone()
        if user:
            return {
                'id': user[0],
                'username': user[1],
                'password': user[2],
                'is_trainer': user[3],
                'password_change_required': user[4]
            }
        return None
    finally:
        conn.close()

def register_user(username, surname, email, phone, date_of_birth, password_hash, is_trainer=False, password_change_required=True, obiettivo=None):
    """Registra un nuovo utente"""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    try:
        # Ottieni l'ID dell'obiettivo se specificato
        obiettivo_id = None
        if obiettivo:
            cursor.execute("SELECT id FROM Obiettivi WHERE nome = ?", (obiettivo,))
            result = cursor.fetchone()
            if result:
                obiettivo_id = result[0]

        cursor.execute("""
            INSERT INTO Utenti (
                username,
                surname,
                email,
                phone,
                date_of_birth,
                password_hash,
                is_trainer,
                password_change_required,
                obiettivo_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            username,
            surname,
            email,
            phone,
            date_of_birth,
            password_hash,
            is_trainer,
            password_change_required,
            obiettivo_id
        ))
        conn.commit()
        return True
    except Exception as e:
        print(f"Errore durante la registrazione: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()

def add_relation(client_id, trainer_id):
    """Aggiunge una relazione trainer-cliente"""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO Clienti_Trainer (cliente_id, trainer_id)
            VALUES (?, ?)
        """, (client_id, trainer_id))
        conn.commit()
        return True
    except Exception as e:
        print(f"Errore nell'aggiunta della relazione: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()

def get_clients_by_trainer(trainer_id):
    """Ottiene tutti i clienti di un trainer"""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT 
                u.id,
                u.username,
                u.surname,
                u.email,
                u.phone,
                u.date_of_birth,
                o.nome as obiettivo
            FROM Utenti u
            INNER JOIN Clienti_Trainer ct ON u.id = ct.cliente_id
            LEFT JOIN Obiettivi o ON u.obiettivo_id = o.id
            WHERE ct.trainer_id = ? AND u.is_trainer = 0
        """, (trainer_id,))
        
        clients = cursor.fetchall()
        return [{
            'id': client[0],
            'nome': client[1],
            'cognome': client[2],
            'email': client[3],
            'telefono': client[4],
            'dataNascita': client[5],
            'obiettivo': client[6] or 'Non specificato'
        } for client in clients]
    finally:
        conn.close()

def update_password(user_id, new_password_hash):
    """Aggiorna la password di un utente"""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    try:
        cursor.execute("""
            UPDATE Utenti 
            SET password_hash = ?, password_change_required = 0
            WHERE id = ?
        """, (new_password_hash, user_id))
        conn.commit()
        return True
    except Exception as e:
        print(f"Errore nell'aggiornamento della password: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()

# visualizzazione macchinari
def macchinari():
    try:
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()

        cursor.execute("""
            SELECT nome
            FROM Macchinari
        """)

        # Recupera tutti i risultati della query
        risultati = cursor.fetchall()

        return risultati
    except Exception as e:
        print(f"Errore durante la visualizzazione dei macchinari: {e}")
        return []
    finally:
        conn.close()

# aggiunta macchinari
def add_macchinari(nome):
    try:
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO Macchinari
            (nome)
            VALUES
            (?)
        """, (nome,))

        conn.commit()
        return cursor.rowcount > 0
    except Exception as e:
        print(f"Errore durante l'aggiunta dei macchinari: {e}")
        return False
    finally:
        conn.close()

# eliminazione macchinari
def del_macchinari(nome):
    try:
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()

        cursor.execute("""
            DELETE FROM Macchinari
            WHERE nome = ?
        """, (nome,))

        conn.commit()
        return cursor.rowcount > 0
    except Exception as e:
        print(f"Errore durante l'eliminazione dei macchinari: {e}")
        return False
    finally:
        conn.close()

# modifica macchinari
def change_macchinari(nome_vecchio, nome_nuovo):
    try:
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()

        cursor.execute("""
            UPDATE Macchinari SET
            nome = ?
            WHERE nome = ?
        """, (nome_nuovo, nome_vecchio))

        conn.commit()
        return cursor.rowcount > 0
    except Exception as e:
        print(f"Errore durante la modifica dei macchinari: {e}")
        return False
    finally:
        conn.close()

def get_user_template_data(user_id):
    user_details = get_user_by_id(user_id)

    user_name = user_details.get('username', '')
    user_surname = user_details.get('surname', '')
    user_initials = user_name[0] + user_surname[0] if user_name and user_surname else ''

    return {
        'user_name': user_name,
        'user_surname': user_surname,
        'user_initials': user_initials,
        'user_is_trainer': user_details.get('is_trainer', False)
    }
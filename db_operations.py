import sqlite3
from init_db import DB_FILE
import bcrypt

# Genera un salt e calcola l'hash della password
def hash_password(password):
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt)

# Verifica se la password fornita corrisponde all'hash
def verify_password(password, hashed):
    return bcrypt.checkpw(password.encode('utf-8'), hashed)

# Prende i dati di un user dal database dato il suo username
def get_user_by_username(username):
    try:
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT id, username, password_hash, is_trainer 
            FROM Utenti 
            WHERE username = ?
        """, (username,))
        
        user = cursor.fetchone()
        if user:
            return {
                'id': user[0],
                'username': user[1],
                'password': user[2],  # password_hash
                'is_trainer': bool(user[3])  # Converti in boolean
            }
        return None
    except Exception as e:
        print(f"Errore nel recupero dell'utente: {e}")
        return None
    finally:
        conn.close()

# Prende i dati di un user dal database dato il suo id
def get_user_by_id(user_id):
    try:
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT id, username, is_trainer 
            FROM Utenti 
            WHERE id = ?
        """, (user_id,))
        
        user = cursor.fetchone()
        if user:
            return {
                'id': user[0],
                'username': user[1],
                'is_trainer': user[2]
            }
        return None
    except Exception as e:
        print(f"Errore nel recupero dell'utente: {e}")
        return None
    finally:
        conn.close()


def register_user(username, hashed_password, is_trainer=False):
    try:
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO Utenti (username, password_hash, is_trainer)
            VALUES (?, ?, ?)
        """, (username, hashed_password, is_trainer))
        
        conn.commit()
        return True
    except sqlite3.IntegrityError:
        return False
    except Exception as e:
        print(f"Errore durante la registrazione: {e}")
        return False
    finally:
        conn.close()

def update_password(user_id, new_password_hash):
    """
    Aggiorna la password dell'utente e resetta il flag password_change_required
    
    Args:
        user_id: ID dell'utente
        new_password_hash: Hash della nuova password
    
    Returns:
        bool: True se l'aggiornamento è avvenuto con successo, False altrimenti
    """
    try:
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        
        cursor.execute("""
            UPDATE Utenti 
            SET password_hash = ?, 
                password_change_required = FALSE
            WHERE id = ?
        """, (new_password_hash, user_id))
        
        conn.commit()
        return cursor.rowcount > 0
    except Exception as e:
        print(f"Errore durante l'aggiornamento della password: {e}")
        return False
    finally:
        conn.close()
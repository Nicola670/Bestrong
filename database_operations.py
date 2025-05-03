import sqlite3
import os
from init_db import DB_FILE
import bcrypt

salt = bcrypt.gensalt()

def hash_password():
    print("temp")

def get_db_connection():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    db_path = os.path.join(current_dir, DB_FILE)
    return sqlite3.connect(db_path)

def get_user_by_username(username):
    try:
        conn = get_db_connection()
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

def get_user_by_id(user_id):
    try:
        conn = get_db_connection()
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
        conn = get_db_connection()
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
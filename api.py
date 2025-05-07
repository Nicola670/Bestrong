import sqlite3
import os
from flask import Blueprint, jsonify, request, send_file, Response
from flask_login import login_required, current_user
from init_db import DB_FILE

# Crea un Blueprint per le API
api = Blueprint('api', __name__)

# Definisci il percorso della cartella dei video
VIDEOS_DIRECTORY = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static', 'videos')
# Crea la cartella se non esiste
os.makedirs(VIDEOS_DIRECTORY, exist_ok=True)

def get_chunk_size():
    return 1024 * 1024  # 1MB per chunk

def generate_video_stream(video_path):
    chunk_size = get_chunk_size()
    with open(video_path, 'rb') as video_file:
        while True:
            chunk = video_file.read(chunk_size)
            if not chunk:
                break
            yield chunk

# --- ENDPOINTS PER TRAINER ---
@api.route('/api/clients', methods=['GET'])
#@login_required
def get_clients():
    """
    if not current_user.is_trainer:
        return jsonify({'error': 'Unauthorized'}), 403
    """

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT Utenti.id, Utenti.username
            FROM Utenti
            INNER JOIN Clienti_Trainer ON Utenti.id = Clienti_Trainer.cliente_id
            WHERE Clienti_Trainer.trainer_id = ?
        """, (1,)) # sostituire con current_user.id quando viene implementato le sessioni
        clients = cursor.fetchall()
        return jsonify([{
            'id': client[0], 
            'username': client[1]
        } for client in clients])
    finally:
        conn.close()

@api.route('/api/client/<int:client_id>', methods=['GET'])
#@login_required
def get_client_by_id(client_id):
    """
    if not current_user.is_trainer:
        return jsonify({'error': 'Unauthorized'}), 403
    """

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    try:
        # Esegui la query per ottenere i dettagli del cliente
        cursor.execute("""
            SELECT Utenti.id, Utenti.username
            FROM Utenti
            INNER JOIN Clienti_Trainer ON Utenti.id = Clienti_Trainer.cliente_id
            WHERE Clienti_Trainer.cliente_id = ? AND Clienti_Trainer.trainer_id = ?
        """, (client_id, 1)) # sostituire con current_user.id quando viene implementato le sessioni
        client = cursor.fetchone()
        print(client)
        # Controlla se il cliente esiste
        if not client:
            return jsonify({'error': 'Client not found'}), 404

        # Restituisci i dettagli del cliente
        return jsonify({
            'id': client[0],
            'username': client[1],
        })
    except Exception as e:
        # Gestione degli errori
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@api.route('/api/exercise/video/<int:exercise_id>', methods=['GET'])
#@login_required
def stream_exercise_video(exercise_id):
    try:
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        
        # Verifica se l'esercizio esiste e ottieni il percorso del video
        cursor.execute("""
            SELECT video_url 
            FROM Esercizi 
            WHERE id = ?
        """, (exercise_id,))
        
        result = cursor.fetchone()
        
        if not result or not result[0]:
            return jsonify({'error': 'Video not found'}), 404
            
        video_filename = result[0]
        video_path = os.path.join(VIDEOS_DIRECTORY, video_filename)
        
        # Verifica se il file esiste
        if not os.path.exists(video_path):
            return jsonify({'error': 'Video file not found'}), 404

        # Streaming del video
        return Response(
            generate_video_stream(video_path),
            mimetype='video/mp4',
            direct_passthrough=True
        )

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@api.route('/api/exercises', methods=['GET'])
#@login_required
def get_exercises():
    """
    if not current_user.is_trainer:
        return jsonify({'error': 'Unauthorized'}), 403
    """

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT 
            Esercizi.id,
            Esercizi.nome,
            Esercizi.descrizione,
                       video_url,
                       immagine_url,
                       Obiettivi.nome,
                       Difficolta.livello
                
            FROM Esercizi
            INNER JOIN Obiettivi ON obiettivo_id = Obiettivi.id
            INNER JOIN Difficolta ON difficolta_id = Difficolta.id
        """) 
        exercises = cursor.fetchall()
        return jsonify([{
            'id': exercise[0], 
            'nome': exercise[1],
            'descrizione': exercise[2],
            'video_url': exercise[3],
            'immagine_url': exercise[4],
            'obiettivo':  exercise[5],
            'livello':  exercise[6]
        } for exercise in exercises])
    finally:
        conn.close()

@api.route('/api/workouts', methods=['GET'])
#@login_required
def get_workouts():
    """
    if not current_user.is_trainer:
        return jsonify({'error': 'Unauthorized'}), 403
    """

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            
        """) 
        workouts = cursor.fetchall()
        print(workouts)
        '''
        return jsonify([{
            'id': exercises[0], 
            'nome': exercises[1],
            'descrizione': exercises[2],
            'video_url': exercises[3],
            'immagine_url': exercises[4]
        } for workout in workouts])'''
    finally:
        conn.close()


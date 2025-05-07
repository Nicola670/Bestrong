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

@api.route('/api/client/<int:client_id>/schede', methods=['GET'])
@login_required
def get_client_schede(client_id):
    """Restituisce tutte le schede di allenamento di un cliente specifico"""
    try:
        # Verifica autorizzazioni
        if not current_user.is_trainer and current_user.id != client_id:
            return jsonify({'error': 'Unauthorized'}), 403

        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        
        # Query per ottenere le schede con i relativi esercizi
        cursor.execute("""
            SELECT 
                s.id AS scheda_id,
                s.creato,
                s.aggiornato,
                se.id AS esercizio_scheda_id,
                e.nome AS nome_esercizio,
                e.descrizione AS descrizione_esercizio,
                e.video_url,
                se.ripetizioni,
                se.serie,
                se.durata_secondi,
                se.recupero_secondi,
                se.peso_kg,
                m.nome AS nome_macchinario
            FROM Schede s
            LEFT JOIN Schede_Esercizi se ON s.id = se.scheda_id
            LEFT JOIN Esercizi e ON se.esercizio_id = e.id
            LEFT JOIN Macchinari m ON se.macchinario_id = m.id
            WHERE s.cliente_id = ?
            ORDER BY s.creato DESC, s.id, se.id
        """, (client_id,))
        
        schede_raw = cursor.fetchall()
        
        if not schede_raw:
            return jsonify({'message': 'Nessuna scheda trovata'}), 404

        # Organizzo i dati in una struttura gerarchica
        schede = {}
        for row in schede_raw:
            scheda_id = row[0]
            if scheda_id not in schede:
                schede[scheda_id] = {
                    'id': scheda_id,
                    'data_creazione': row[1],
                    'ultimo_aggiornamento': row[2],
                    'esercizi': []
                }
            
            # Aggiungo l'esercizio solo se esiste (potrebbe essere una scheda vuota)
            if row[3]:  # se esiste esercizio_scheda_id
                esercizio = {
                    'id': row[3],
                    'nome': row[4],
                    'descrizione': row[5],
                    'video_url': row[6],
                    'ripetizioni': row[7],
                    'serie': row[8],
                    'durata_secondi': row[9],
                    'recupero_secondi': row[10],
                    'peso_kg': row[11],
                    'macchinario': row[12]
                }
                schede[scheda_id]['esercizi'].append(esercizio)

        return jsonify(list(schede.values()))

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()
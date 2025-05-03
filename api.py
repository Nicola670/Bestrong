import sqlite3
from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user
from init_db import DB_FILE

# Crea un Blueprint per le API
api = Blueprint('api', __name__)

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
            SELECT id, username FROM Utenti 
            WHERE is_trainer = FALSE
        """)
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
            SELECT id, username
            FROM Utenti
            WHERE id = ? AND is_trainer = FALSE
        """, (client_id,))
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
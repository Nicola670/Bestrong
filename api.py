from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user
from init_db import get_db_connection

# Crea un Blueprint per le API
api = Blueprint('api', __name__)

# --- ENDPOINTS PER TRAINER ---
@api.route('/api/clients', methods=['GET'])
@login_required
def get_clients():
    if not current_user.is_trainer:
        return jsonify({'error': 'Unauthorized'}), 403
    
    conn = get_db_connection()
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

@api.route('/api/workouts/<int:client_id>', methods=['GET'])
@login_required
def get_client_workouts(client_id):
    if not current_user.is_trainer:
        return jsonify({'error': 'Unauthorized'}), 403
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT s.id, s.creato, s.aggiornato
            FROM Schede s
            WHERE s.cliente_id = ?
        """, (client_id,))
        workouts = cursor.fetchall()
        return jsonify([{
            'id': w[0],
            'created': w[1],
            'updated': w[2]
        } for w in workouts])
    finally:
        conn.close()

@api.route('/api/client/<int:client_id>', methods=['GET'])
@login_required
def get_client_details(client_id):
    if not current_user.is_trainer:
        return jsonify({'error': 'Unauthorized'}), 403
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT id, username, created_at 
            FROM Utenti 
            WHERE id = ? AND is_trainer = FALSE
        """, (client_id,))
        client = cursor.fetchone()
        if not client:
            return jsonify({'error': 'Client not found'}), 404
            
        return jsonify({
            'id': client[0],
            'username': client[1],
            'memberSince': client[2]
        })
    finally:
        conn.close()

@api.route('/api/exercises', methods=['GET'])
@login_required
def get_exercises():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT e.id, e.nome, e.descrizione, e.video_url, e.immagine_url,
                   o.nome as obiettivo, d.livello as difficolta,
                   GROUP_CONCAT(gm.nome) as gruppi_muscolari
            FROM Esercizi e
            JOIN Obiettivi o ON e.obiettivo_id = o.id
            JOIN Difficolta d ON e.difficolta_id = d.id
            LEFT JOIN Esercizi_Muscoli em ON e.id = em.esercizio_id
            LEFT JOIN Gruppi_Muscolari gm ON em.muscolo_id = gm.id
            GROUP BY e.id
        """)
        exercises = cursor.fetchall()
        return jsonify([{
            'id': ex[0],
            'name': ex[1],
            'description': ex[2],
            'videoUrl': ex[3],
            'imageUrl': ex[4],
            'objective': ex[5],
            'difficulty': ex[6],
            'muscleGroups': ex[7].split(',') if ex[7] else []
        } for ex in exercises])
    finally:
        conn.close()

@api.route('/api/workout/<int:workout_id>', methods=['GET'])
@login_required
def get_workout_details(workout_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT se.*, e.nome, e.descrizione, m.nome as macchinario
            FROM Schede_Esercizi se
            JOIN Esercizi e ON se.esercizio_id = e.id
            LEFT JOIN Macchinari m ON se.macchinario_id = m.id
            WHERE se.scheda_id = ?
        """, (workout_id,))
        exercises = cursor.fetchall()
        return jsonify([{
            'id': ex[0],
            'exerciseName': ex[8],
            'description': ex[9],
            'machine': ex[10],
            'sets': ex[4],
            'reps': ex[3],
            'duration': ex[5],
            'rest': ex[6],
            'weight': ex[7]
        } for ex in exercises])
    finally:
        conn.close()

# --- ENDPOINTS PER GESTIONE SCHEDE ---
@api.route('/api/workout', methods=['POST'])
@login_required
def create_workout():
    if not current_user.is_trainer:
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.get_json()
    client_id = data.get('client_id')
    exercises = data.get('exercises', [])
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Crea nuova scheda
        cursor.execute("""
            INSERT INTO Schede (cliente_id, trainer_id)
            VALUES (?, ?)
        """, (client_id, current_user.id))
        
        workout_id = cursor.lastrowid
        
        # Inserisci esercizi
        for ex in exercises:
            cursor.execute("""
                INSERT INTO Schede_Esercizi 
                (scheda_id, esercizio_id, macchinario_id, ripetizioni, 
                serie, durata_secondi, recupero_secondi, peso_kg)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (workout_id, ex['exercise_id'], ex.get('machine_id'), 
                  ex.get('reps'), ex.get('sets'), ex.get('duration'),
                  ex.get('rest'), ex.get('weight')))
        
        conn.commit()
        return jsonify({'id': workout_id}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 400
    finally:
        conn.close()

@api.route('/api/workout/<int:workout_id>', methods=['PUT'])
@login_required
def update_workout(workout_id):
    if not current_user.is_trainer:
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.get_json()
    exercises = data.get('exercises', [])
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Verifica che la scheda esista
        cursor.execute("SELECT id FROM Schede WHERE id = ?", (workout_id,))
        if not cursor.fetchone():
            return jsonify({'error': 'Workout not found'}), 404
            
        # Elimina vecchi esercizi
        cursor.execute("DELETE FROM Schede_Esercizi WHERE scheda_id = ?", (workout_id,))
        
        # Inserisci nuovi esercizi
        for ex in exercises:
            cursor.execute("""
                INSERT INTO Schede_Esercizi 
                (scheda_id, esercizio_id, macchinario_id, ripetizioni, 
                serie, durata_secondi, recupero_secondi, peso_kg)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (workout_id, ex['exercise_id'], ex.get('machine_id'), 
                  ex.get('reps'), ex.get('sets'), ex.get('duration'),
                  ex.get('rest'), ex.get('weight')))
        
        # Aggiorna timestamp
        cursor.execute("""
            UPDATE Schede 
            SET aggiornato = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (workout_id,))
        
        conn.commit()
        return jsonify({'success': True})
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 400
    finally:
        conn.close()

@api.route('/api/workout/<int:workout_id>', methods=['DELETE'])
@login_required
def delete_workout(workout_id):
    if not current_user.is_trainer:
        return jsonify({'error': 'Unauthorized'}), 403
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("DELETE FROM Schede_Esercizi WHERE scheda_id = ?", (workout_id,))
        cursor.execute("DELETE FROM Schede WHERE id = ?", (workout_id,))
        conn.commit()
        return jsonify({'success': True})
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 400
    finally:
        conn.close()

# --- ENDPOINTS PER CLIENTI ---
@api.route('/api/my-workouts', methods=['GET'])
@login_required
def get_my_workouts():
    if current_user.is_trainer:
        return jsonify({'error': 'Unauthorized'}), 403
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT s.id, s.creato, s.aggiornato
            FROM Schede s
            WHERE s.cliente_id = ?
        """, (current_user.id,))
        workouts = cursor.fetchall()
        return jsonify([{
            'id': w[0],
            'created': w[1],
            'updated': w[2]
        } for w in workouts])
    finally:
        conn.close()

@api.route('/api/my-profile', methods=['GET'])
@login_required
def get_my_profile():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT u.username, u.created_at,
                   COUNT(DISTINCT s.id) as total_workouts
            FROM Utenti u
            LEFT JOIN Schede s ON u.id = s.cliente_id
            WHERE u.id = ?
            GROUP BY u.id
        """, (current_user.id,))
        profile = cursor.fetchone()
        return jsonify({
            'username': profile[0],
            'memberSince': profile[1],
            'totalWorkouts': profile[2]
        })
    finally:
        conn.close()

@api.route('/api/exercise-groups', methods=['GET'])
@login_required
def get_exercise_groups():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("SELECT id, nome FROM Gruppi_Muscolari")
        groups = cursor.fetchall()
        return jsonify([{
            'id': g[0],
            'name': g[1]
        } for g in groups])
    finally:
        conn.close()
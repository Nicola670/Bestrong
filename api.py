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
#@login_required  # Riabilitare quando il login sarà implementato
def get_clients():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT 
                u.id,
                u.username as nome,
                u.surname as cognome,
                u.email,
                u.phone,
                u.date_of_birth,
                o.nome as obiettivo
            FROM Utenti u
            LEFT JOIN Obiettivi o ON u.obiettivo_id = o.id
            WHERE u.is_trainer = 0
        """)
        
        clients = cursor.fetchall()
        
        return jsonify([{
            'id': client[0],
            'nome': client[1], 
            'cognome': client[2],
            'email': client[3],
            'telefono': client[4],
            'dataNascita': client[5],
            'obiettivo': client[6] or 'Non specificato',
            'iscrizione': '2024-01-01'  # Per ora hardcoded, da aggiungere al DB
        } for client in clients])
        
    except Exception as e:
        print(f"Errore nel recupero dei clienti: {e}")
        return jsonify({'error': str(e)}), 500
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
            SELECT Utenti.id, Utenti.username, Utenti.surname, Utenti.email. Utenti.phone, Utenti.date_of_birth
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
            'surname': client[2],
            'email': client[3],
            'phone': client[4],
            'date_of_birth': client[5]
        })
    except Exception as e:
        # Gestione degli errori
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@api.route('/api/client/<int:client_id>', methods=['DELETE'])
@login_required
def delete_client(client_id):
    """Elimina un cliente specifico"""
    try:
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()

        # Verifica che l'utente corrente sia un trainer
        if not current_user.is_trainer:
            return jsonify({'error': 'Non autorizzato - Solo i trainer possono eliminare i clienti'}), 403

        # Verifica che il cliente esista
        cursor.execute("SELECT id FROM Utenti WHERE id = ? AND is_trainer = 0", (client_id,))
        if not cursor.fetchone():
            return jsonify({'error': 'Cliente non trovato'}), 404
            
        # Elimina tutte le relazioni associate al cliente
        cursor.execute("DELETE FROM Clienti_Trainer WHERE cliente_id = ?", (client_id,))
        
        # Elimina il cliente
        cursor.execute("DELETE FROM Utenti WHERE id = ?", (client_id,))
        
        conn.commit()
        return jsonify({'message': 'Cliente eliminato con successo'})
        
    except Exception as e:
        print(f"Errore durante l'eliminazione del cliente: {e}")
        conn.rollback()
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

@api.route('/api/exercises', methods=['GET'])
#@login_required
def get_exercises():
    """Restituisce tutti gli esercizi presenti nel database"""
    try:
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT 
                e.id,
                e.nome,
                e.descrizione,
                e.video_url,
                e.immagine_url,
                o.nome AS obiettivo,
                d.livello AS difficolta,
                GROUP_CONCAT(CASE 
                    WHEN em.tipo = 'primario' THEN gm.nome 
                END) AS muscoli_primari,
                GROUP_CONCAT(CASE 
                    WHEN em.tipo = 'secondario' THEN gm.nome 
                END) AS muscoli_secondari
            FROM Esercizi e
            LEFT JOIN Obiettivi o ON e.obiettivo_id = o.id
            LEFT JOIN Difficolta d ON e.difficolta_id = d.id
            LEFT JOIN Esercizi_Muscoli em ON e.id = em.esercizio_id
            LEFT JOIN Gruppi_Muscolari gm ON em.muscolo_id = gm.id
            GROUP BY e.id
            ORDER BY e.nome
        """)
        
        exercises = cursor.fetchall()
        
        if not exercises:
            return jsonify({'message': 'Nessun esercizio trovato'}), 404

        # Formatta i risultati in JSON
        exercises_list = []
        for ex in exercises:
            muscoli_primari = ex[7].split(',') if ex[7] else []
            muscoli_secondari = ex[8].split(',') if ex[8] else []
            
            exercise = {
                'id': ex[0],
                'nome': ex[1],
                'descrizione': ex[2],
                'video_url': ex[3],
                'immagine_url': ex[4],
                'obiettivo': ex[5],
                'difficolta': ex[6],
                'muscoli_primari': [m for m in muscoli_primari if m],
                'muscoli_secondari': [m for m in muscoli_secondari if m]
            }
            exercises_list.append(exercise)

        return jsonify(exercises_list)

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@api.route('/api/exercises', methods=['POST'])
@login_required
def add_exercise():
    try:
        data = request.json
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()

        # Ottieni gli ID di obiettivo e difficoltà
        cursor.execute("SELECT id FROM Obiettivi WHERE nome = ?", (data['goal'],))
        obiettivo_id = cursor.fetchone()
        if not obiettivo_id:
            return jsonify({'error': 'Obiettivo non valido'}), 400

        cursor.execute("SELECT id FROM Difficolta WHERE livello = ?", (data['difficulty'],))
        difficolta_id = cursor.fetchone()
        if not difficolta_id:
            return jsonify({'error': 'Difficoltà non valida'}), 400
        
        # Inserisci l'esercizio
        cursor.execute("""
            INSERT INTO Esercizi (
                nome, descrizione, video_url, immagine_url,
                obiettivo_id, difficolta_id
            ) VALUES (?, ?, ?, ?, ?, ?)
        """, (
            data['name'],
            data['description'],
            data['mediaUrl'] if data['mediaType'] == 'video' else None,
            data['mediaUrl'] if data['mediaType'] == 'image' else None,
            obiettivo_id[0],
            difficolta_id[0]
        ))
        
        exercise_id = cursor.lastrowid
        
        # Inserisci i muscoli primari
        for muscle in data['primaryMuscles']:
            cursor.execute("SELECT id FROM Gruppi_Muscolari WHERE nome = ?", (muscle,))
            muscle_id = cursor.fetchone()
            if muscle_id:
                cursor.execute("""
                    INSERT INTO Esercizi_Muscoli (
                        esercizio_id, muscolo_id, tipo
                    ) VALUES (?, ?, ?)
                """, (exercise_id, muscle_id[0], 'primario'))
            
        # Inserisci i muscoli secondari
        for muscle in data['secondaryMuscles']:
            cursor.execute("SELECT id FROM Gruppi_Muscolari WHERE nome = ?", (muscle,))
            muscle_id = cursor.fetchone()
            if muscle_id:
                cursor.execute("""
                    INSERT INTO Esercizi_Muscoli (
                        esercizio_id, muscolo_id, tipo
                    ) VALUES (?, ?, ?)
                """, (exercise_id, muscle_id[0], 'secondario'))
        
        conn.commit()
        return jsonify({'success': True, 'id': exercise_id}), 201
        
    except Exception as e:
        conn.rollback()
        print(f"Errore nell'aggiunta dell'esercizio: {e}")
        return jsonify({'error': 'Errore durante il salvataggio dell\'esercizio'}), 500
    finally:
        conn.close()

@api.route('/api/exercises/<int:exercise_id>', methods=['PUT'])
@login_required
def update_exercise(exercise_id):
    try:
        data = request.json
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()

        # Ottieni gli ID di obiettivo e difficoltà
        cursor.execute("SELECT id FROM Obiettivi WHERE nome = ?", (data['goal'],))
        obiettivo_id = cursor.fetchone()
        if not obiettivo_id:
            return jsonify({'error': 'Obiettivo non valido'}), 400

        cursor.execute("SELECT id FROM Difficolta WHERE livello = ?", (data['difficulty'],))
        difficolta_id = cursor.fetchone()
        if not difficolta_id:
            return jsonify({'error': 'Difficoltà non valida'}), 400
        
        # Aggiorna i dati dell'esercizio
        cursor.execute("""
            UPDATE Esercizi SET 
                nome = ?, 
                descrizione = ?,
                video_url = ?,
                immagine_url = ?,
                obiettivo_id = ?,
                difficolta_id = ?
            WHERE id = ?
        """, (
            data['name'],
            data['description'],
            data['mediaUrl'] if data['mediaType'] == 'video' else None,
            data['mediaUrl'] if data['mediaType'] == 'image' else None,
            obiettivo_id[0],
            difficolta_id[0],
            exercise_id
        ))
        
        # Rimuovi tutti i muscoli esistenti per questo esercizio
        cursor.execute("DELETE FROM Esercizi_Muscoli WHERE esercizio_id = ?", (exercise_id,))
        
        # Inserisci i nuovi muscoli primari
        for muscle in data['primaryMuscles']:
            cursor.execute("SELECT id FROM Gruppi_Muscolari WHERE nome = ?", (muscle,))
            muscle_id = cursor.fetchone()
            if muscle_id:
                cursor.execute("""
                    INSERT INTO Esercizi_Muscoli (
                        esercizio_id, muscolo_id, tipo
                    ) VALUES (?, ?, ?)
                """, (exercise_id, muscle_id[0], 'primario'))
            
        # Inserisci i nuovi muscoli secondari
        for muscle in data['secondaryMuscles']:
            cursor.execute("SELECT id FROM Gruppi_Muscolari WHERE nome = ?", (muscle,))
            muscle_id = cursor.fetchone()
            if muscle_id:
                cursor.execute("""
                    INSERT INTO Esercizi_Muscoli (
                        esercizio_id, muscolo_id, tipo
                    ) VALUES (?, ?, ?)
                """, (exercise_id, muscle_id[0], 'secondario'))
        
        conn.commit()
        return jsonify({'success': True}), 200
        
    except Exception as e:
        conn.rollback()
        print(f"Errore nell'aggiornamento dell'esercizio: {e}")
        return jsonify({'error': 'Errore durante l\'aggiornamento dell\'esercizio'}), 500
    finally:
        conn.close()

@api.route('/api/exercises/<int:exercise_id>', methods=['DELETE'])
@login_required
def delete_exercise(exercise_id):
    try:
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        
        # Rimuovi prima i riferimenti nelle schede
        cursor.execute("DELETE FROM Schede_Esercizi WHERE esercizio_id = ?", (exercise_id,))
        
        # Rimuovi le associazioni con i muscoli
        cursor.execute("DELETE FROM Esercizi_Muscoli WHERE esercizio_id = ?", (exercise_id,))
        
        # Infine rimuovi l'esercizio
        cursor.execute("DELETE FROM Esercizi WHERE id = ?", (exercise_id,))
        
        conn.commit()
        return jsonify({'success': True}), 200
        
    except Exception as e:
        conn.rollback()
        print(f"Errore nella cancellazione dell'esercizio: {e}")
        return jsonify({'error': 'Errore durante la cancellazione dell\'esercizio'}), 500
    finally:
        conn.close()
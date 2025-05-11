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
            SELECT Utenti.id, Utenti.username, Utenti.surname, Utenti.email, Utenti.phone, Utenti.date_of_birth
            FROM Utenti
            INNER JOIN Clienti_Trainer ON Utenti.id = Clienti_Trainer.cliente_id
            WHERE Clienti_Trainer.cliente_id = ? AND Clienti_Trainer.trainer_id = ?
        """, (client_id, 1)) # sostituire con current_user.id quando viene implementato le sessioni
        client = cursor.fetchone()
    
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
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()

        # Prima verifica debug
        print("\n=== DEBUG INFO ===")
        cursor.execute("SELECT * FROM Schede WHERE cliente_id = ?", (client_id,))
        schede_base = cursor.fetchall()
        print(f"Schede base trovate: {schede_base}")

        # Query principale modificata con LEFT JOIN
        cursor.execute("""
            SELECT DISTINCT
                s.id,
                s.creato,
                s.aggiornato,
                GROUP_CONCAT(DISTINCT IFNULL(gm.nome, 'Generale')) as gruppi_muscolari,
                COUNT(DISTINCT se.id) as num_esercizi
            FROM Schede s
            LEFT JOIN Schede_Esercizi se ON s.id = se.scheda_id
            LEFT JOIN Esercizi e ON se.esercizio_id = e.id
            LEFT JOIN Esercizi_Muscoli em ON e.id = em.esercizio_id
            LEFT JOIN Gruppi_Muscolari gm ON em.muscolo_id = gm.id
            WHERE s.cliente_id = ?
            GROUP BY s.id
            ORDER BY s.creato DESC
        """, (client_id,))
        
        schede_raw = cursor.fetchall()
        print(f"Schede dopo JOIN trovate: {schede_raw}")
        
        if not schede_raw:
            return jsonify({'message': 'Nessuna scheda trovata'}), 404

        schede = []
        for scheda in schede_raw:
            scheda_id, data_creazione, ultimo_aggiornamento, gruppi, num_esercizi = scheda
            
            # Query modificata per gli esercizi
            cursor.execute("""
                SELECT 
                    e.nome,
                    se.serie,
                    se.ripetizioni,
                    se.peso_kg,
                    se.recupero_secondi,
                    IFNULL(gm.nome, 'Generale') as gruppo_muscolare
                FROM Schede_Esercizi se
                LEFT JOIN Esercizi e ON se.esercizio_id = e.id
                LEFT JOIN Esercizi_Muscoli em ON e.id = em.esercizio_id
                LEFT JOIN Gruppi_Muscolari gm ON em.muscolo_id = gm.id
                WHERE se.scheda_id = ?
            """, (scheda_id,))
            
            esercizi = cursor.fetchall()
            print(f"Esercizi per scheda {scheda_id}: {esercizi}")
            
            scheda_data = {
                'id': scheda_id,
                'data_creazione': data_creazione,
                'ultimo_aggiornamento': ultimo_aggiornamento,
                'gruppi_muscolari': gruppi.split(',') if gruppi else ['Generale'],
                'num_esercizi': num_esercizi,
                'esercizi': [{
                    'nome': es[0],
                    'serie': es[1],
                    'ripetizioni': es[2],
                    'peso_kg': es[3],
                    'recupero': es[4],
                    'gruppo': es[5]
                } for es in esercizi]
            }
            schede.append(scheda_data)

        print("=== FINE DEBUG ===\n")
        return jsonify(schede)

    except Exception as e:
        print(f"Errore nel recupero delle schede: {e}")
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

@api.route('/api/schede', methods=['POST'])
@login_required
def create_scheda():
    try:
        data = request.json
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        
        # Inserisci la scheda
        cursor.execute("""
            INSERT INTO Schede (
                cliente_id, trainer_id, creato, aggiornato
            ) VALUES (?, ?, datetime('now'), datetime('now'))
        """, (
            data['cliente_id'],
            current_user.id  # ID del trainer attualmente loggato
        ))
        
        scheda_id = cursor.lastrowid
        
        # Inserisci gli esercizi della scheda
        for esercizio in data['esercizi']:
            cursor.execute("""
                INSERT INTO Schede_Esercizi (
                    scheda_id, esercizio_id, serie, ripetizioni,
                    peso_kg, recupero_secondi
                ) VALUES (?, ?, ?, ?, ?, ?)
            """, (
                scheda_id,
                esercizio['esercizio_id'],
                esercizio['serie'],
                esercizio['ripetizioni'],
                esercizio['peso_kg'],
                esercizio['recupero_secondi']
            ))
        
        conn.commit()
        return jsonify({'success': True, 'id': scheda_id}), 201
        
    except Exception as e:
        conn.rollback()
        print(f"Errore nel salvataggio della scheda: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@api.route('/api/schede/<int:scheda_id>', methods=['GET'])
@login_required
def get_scheda_details(scheda_id):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    try:
        # Prima recupera i dettagli della scheda
        cursor.execute("""
            SELECT s.id, s.creato, s.aggiornato
            FROM Schede s
            WHERE s.id = ?
        """, (scheda_id,))
        
        scheda = cursor.fetchone()
        if not scheda:
            return jsonify({'error': 'Scheda non trovata'}), 404

        # Poi recupera gli esercizi della scheda con i loro dettagli
        cursor.execute("""
            SELECT 
                e.id,
                e.nome,
                se.serie,
                se.ripetizioni,
                se.peso_kg,
                se.recupero_secondi,
                GROUP_CONCAT(DISTINCT gm.nome) as gruppi_muscolari
            FROM Schede_Esercizi se
            JOIN Esercizi e ON se.esercizio_id = e.id
            LEFT JOIN Esercizi_Muscoli em ON e.id = em.esercizio_id
            LEFT JOIN Gruppi_Muscolari gm ON em.muscolo_id = gm.id
            WHERE se.scheda_id = ?
            GROUP BY e.id
        """, (scheda_id,))
        
        esercizi = []
        for row in cursor.fetchall():
            esercizi.append({
                'id': row[0],
                'nome': row[1],
                'serie': row[2],
                'ripetizioni': row[3],
                'peso_kg': row[4],
                'recupero': row[5],
                'gruppo': row[6]
            })

        return jsonify({
            'id': scheda[0],
            'data_creazione': scheda[1],
            'data_aggiornamento': scheda[2],
            'esercizi': esercizi
        })

    except Exception as e:
        print(f"Errore nel recupero dei dettagli della scheda: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@api.route('/api/current-user', methods=['GET'])
@login_required
def get_current_user():
    """Restituisce i dati dell'utente corrente"""
    try:
        if not current_user.is_authenticated:
            return jsonify({'error': 'Utente non autenticato'}), 401

        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        
        # Modifica la query per ottenere più informazioni
        cursor.execute("""
            SELECT 
                u.id,
                u.username,
                u.surname,
                u.email,
                u.is_trainer
            FROM Utenti u
            WHERE u.id = ?
        """, (current_user.id,))
        
        user = cursor.fetchone()
        
        if not user:
            return jsonify({'error': 'Utente non trovato'}), 404
            
        return jsonify({
            'id': user[0],
            'nome': user[1],
            'cognome': user[2],
            'email': user[3],
            'is_trainer': bool(user[4])
        })
        
    except Exception as e:
        print(f"Errore nel recupero dei dati utente: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@api.route('/api/obiettivi', methods=['GET'])
def get_obiettivi():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT id, nome
            FROM Obiettivi
            ORDER BY nome
        """)
        
        obiettivi = [{'id': row[0], 'nome': row[1]} for row in cursor.fetchall()]
        return jsonify(obiettivi)
        
    except Exception as e:
        print(f"Errore nel recupero degli obiettivi: {e}")
        return jsonify({'error': 'Errore nel caricamento degli obiettivi'}), 500
    finally:
        conn.close()

@api.route('/api/schede/<int:scheda_id>', methods=['PUT'])
@login_required
def update_scheda(scheda_id):
    try:
        data = request.json
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        
        # Verifica che la scheda esista
        cursor.execute("""
            SELECT cliente_id, trainer_id 
            FROM Schede 
            WHERE id = ?
        """, (scheda_id,))
        
        scheda = cursor.fetchone()
        if not scheda:
            return jsonify({'error': 'Scheda non trovata'}), 404
            
        # Verifica che l'utente corrente sia il trainer che ha creato la scheda
        if scheda[1] != current_user.id:
            return jsonify({'error': 'Non autorizzato a modificare questa scheda'}), 403

        # Aggiorna la data di modifica della scheda
        cursor.execute("""
            UPDATE Schede 
            SET aggiornato = datetime('now')
            WHERE id = ?
        """, (scheda_id,))

        # Rimuovi tutti gli esercizi esistenti
        cursor.execute("DELETE FROM Schede_Esercizi WHERE scheda_id = ?", (scheda_id,))
        
        # Inserisci i nuovi esercizi
        for esercizio in data['esercizi']:
            cursor.execute("""
                INSERT INTO Schede_Esercizi (
                    scheda_id, 
                    esercizio_id, 
                    serie, 
                    ripetizioni,
                    peso_kg, 
                    recupero_secondi
                ) VALUES (?, ?, ?, ?, ?, ?)
            """, (
                scheda_id,
                esercizio['esercizio_id'],
                esercizio['serie'],
                esercizio['ripetizioni'],
                esercizio.get('peso_kg'),  # Usa get() per gestire valori opzionali
                esercizio.get('recupero_secondi')
            ))
        
        conn.commit()
        return jsonify({
            'success': True,
            'message': 'Scheda aggiornata con successo'
        }), 200
        
    except Exception as e:
        conn.rollback()
        print(f"Errore nell'aggiornamento della scheda: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@api.route('/api/schede/<int:scheda_id>/cliente', methods=['GET'])
@login_required
def get_cliente_by_scheda(scheda_id):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT u.id, u.username, u.surname, u.email
            FROM Utenti u
            JOIN Schede s ON u.id = s.cliente_id
            WHERE s.id = ?
        """, (scheda_id,))
        
        cliente = cursor.fetchone()
        
        if not cliente:
            return jsonify({'error': 'Cliente non trovato'}), 404
            
        return jsonify({
            'id': cliente[0],
            'nome': cliente[1],
            'cognome': cliente[2],
            'email': cliente[3]
        })
        
    except Exception as e:
        print(f"Errore nel recupero dei dati del cliente: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()
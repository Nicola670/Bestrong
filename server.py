from flask import Flask, request, render_template, redirect, url_for, flash, jsonify, session
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from datetime import timedelta, datetime
import secrets
from api import api
from init_db import initialize_db, populate_database
import db_operations as database
import bcrypt
from functools import wraps

app = Flask(__name__)

# Chiave segreta più sicura generata in modo casuale
app.secret_key = secrets.token_hex(32)
app.register_blueprint(api)
app.config["DEBUG"] = True

# Se remember me non è selezionato, la sessione scade alla chiusura del browser
app.config['REMEMBER_COOKIE_DURATION'] = timedelta(hours=1)  # Durata del cookie remember me

''' Configurazione dei cookie di sessione con https
app.config['REMEMBER_COOKIE_SECURE'] = False
app.config['SESSION_COOKIE_SECURE'] = False
app.config['REMEMBER_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
'''

app.config['REMEMBER_COOKIE_SECURE'] = False  # Impostare su True se si usa HTTPS
app.config['REMEMBER_COOKIE_HTTPONLY'] = True

# Gestore degli account di Flask
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'
login_manager.session_protection = "strong"  # Protezione avanzata delle sessioni

# Classe User per gestire gli utenti
class User(UserMixin):
    def __init__(self, id, username, is_trainer=False):
        self.id = id
        self.username = username
        self.is_trainer = is_trainer

def is_valid_password(password):
    # Almeno 8 caratteri, una maiuscola, una minuscola, un numero
    return (len(password) >= 8 and 
            any(c.isupper() for c in password) and 
            any(c.islower() for c in password) and 
            any(c.isdigit() for c in password))

# Funzione che prende i dati dell'utente della sessione
@login_manager.user_loader
def load_user(user_id):
    try:
        user = database.get_user_by_id(user_id)
        if user and 'id' in user and 'username' in user and 'is_trainer' in user:
            return User(user['id'], user['username'], bool(user['is_trainer']))
    except Exception as e:
        print(f"Errore nel caricamento dell'utente: {e}")
    return None

@app.before_request
def check_session_activity():
    if current_user.is_authenticated:
        # Skip per alcune route
        if request.endpoint in ['static', 'logout']:
            return
            
        # Verifica ultima attività
        last_activity = session.get('last_activity')
        if last_activity:
            last_activity = datetime.fromisoformat(last_activity)
            if datetime.now() - last_activity > timedelta(hours=2):
                session.clear()
                logout_user()
                flash('Sessione scaduta. Effettua nuovamente il login.')
                return redirect(url_for('login'))
                
        # Aggiorna timestamp ultima attività
        session['last_activity'] = datetime.now().isoformat()

@app.before_request 
def disable_cors():
    if request.method == 'OPTIONS':
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'DELETE, GET, POST, PUT, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
        return '', 200, headers

@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'DELETE, GET, POST, PUT, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    return response

# Decoratore personalizzato per verificare se l'utente è un trainer
def trainer_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated or not current_user.is_trainer:
            flash('Accesso non autorizzato. Questa sezione è riservata ai trainer.')
            return redirect(url_for('client_dashboard'))
        return f(*args, **kwargs)
    return decorated_function

# Decoratore personalizzato per verificare se l'utente è un cliente
def client_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated or current_user.is_trainer:
            flash('Accesso non autorizzato. Questa sezione è riservata ai clienti.')
            return redirect(url_for('dashboard'))
        return f(*args, **kwargs)
    return decorated_function

@app.route('/', methods=['GET'])
def home():
    if not current_user.is_authenticated:
        return redirect(url_for('login'))
        
    if current_user.is_trainer:
        return redirect(url_for('dashboard'))
    return redirect(url_for('client_dashboard'))

@app.route('/login', methods=['GET'])
def login_page():
    return render_template('login.html')

@app.route('/login', methods=['POST'])
def login():
    username = request.form.get('username')
    password = request.form.get('pswd')
    remember = True if request.form.get('remember') else False
    
    if not username or not password:
        flash('Per favore, inserisci tutti i campi')
        return redirect(url_for('login_page'))

    user = database.get_user_by_username(username)
    
    if user is None:
        flash('Username o password non validi')
        return redirect(url_for('login_page'))
    
    try:
        if database.verify_password(password, user['password']):
            user_obj = User(user['id'], user['username'], bool(user['is_trainer']))
            login_user(user_obj, remember=remember)  # Usa il valore del checkbox
            
            # Imposta la sessione come permanente solo se remember è True
            session.permanent = remember
            
            # Aggiungi informazioni utili alla sessione
            session['user_id'] = user['id']
            session['username'] = user['username']
            session['is_trainer'] = user['is_trainer']
            session['last_activity'] = datetime.now().isoformat()
            
            # Se l'utente deve cambiare password, reindirizza
            if user['password_change_required']:
                return redirect(url_for('change_password'))
            
            # Redirect normale basato sul tipo di utente
            if user['is_trainer']:
                return redirect(url_for('dashboard'))
            else:
                return redirect(url_for('client_dashboard'))
        else:
            flash('Username o password non validi')
            return redirect(url_for('login_page'))
    except Exception as e:
        print(f"Errore durante il login: {e}")
        flash('Si è verificato un errore durante il login')
        return redirect(url_for('login_page'))

@app.route('/register', methods=['POST'])
@login_required
@trainer_required
def register():
    try:
        # Ottieni tutti i dati dal form
        nome = request.form.get('nome')
        cognome = request.form.get('cognome')
        email = request.form.get('email')
        telefono = request.form.get('telefono')
        data_nascita = request.form.get('dataNascita')
        obiettivo_id = request.form.get('obiettivo')
        temp_password = "Password123"  # Password temporanea
        
        # Verifica che i campi obbligatori siano presenti
        if not all([nome, cognome, email, telefono, data_nascita, obiettivo_id]):
            return jsonify({'error': 'Tutti i campi sono obbligatori'}), 400

        # Verifica se l'email è già registrata
        existing_user = database.get_user_by_email(email)
        if existing_user:
            return jsonify({'error': 'Email già registrata'}), 400
            
        # Verifica se il telefono è già registrato
        if database.get_user_by_phone(telefono):
            return jsonify({'error': 'Numero di telefono già registrato'}), 400

        hashed_password = database.hash_password(temp_password)
        
        # Registra il nuovo utente con tutti i dati
        success = database.register_user(
            username = nome,  # Usa il nome come username
            surname = cognome,
            email = email,
            phone = telefono,
            date_of_birth = data_nascita,
            password_hash = hashed_password,
            is_trainer = False,
            password_change_required = True,
            obiettivo_id = obiettivo_id
        )

        if success:
            # Ottieni l'utente appena creato
            new_user = database.get_user_by_email(email)
            if new_user:
                # Crea la relazione trainer-cliente
                database.add_relation(new_user['id'], current_user.id)
                return jsonify({
                    'message': 'Cliente registrato con successo!',
                    'client': {
                        'id': new_user['id'],
                        'nome': new_user['username'],
                        'cognome': new_user['surname'],
                        'email': new_user['email'],
                        'telefono': new_user['phone'],
                        'dataNascita': new_user['date_of_birth'],
                        'obiettivo': new_user['obiettivo_id']
                    }
                })

        return jsonify({'error': 'Errore durante la registrazione'}), 500

    except Exception as e:
        print(f"Errore durante la registrazione: {e}")
        return jsonify({'error': 'Si è verificato un errore durante la registrazione'}), 500

@app.route('/dashboard')
@login_required
@trainer_required
def dashboard():
    clients = database.get_clients_by_trainer(current_user.id)
    
    user_data = database.get_user_template_data(current_user.id)

    # Il doppio asterisco (**) spacchetta il dizionario 'user_data' e passa 
    # ogni chiave come argomento al template. per esempio, se 'user_data' ha
    # {'username': 'Mario', 'surname': 'Rossi'}, il template riceverà
    # username='Mario' e surname='Rossi'.
    return render_template('dashboard.html', clients = clients, **user_data)

@app.route('/client')
@login_required
@client_required
def client_dashboard():
    user_data = database.get_user_template_data(current_user.id)

    return render_template('schedeClient.html', **user_data)

@app.route('/schermata_esecuzione')
@login_required
@client_required
def schermata_esecuzione():
    user_data = database.get_user_template_data(current_user.id)
    scheda_id = request.args.get('scheda_id')

    # Aggiungi l'ID della scheda ai dati utente
    user_data['scheda_id'] = scheda_id

    return render_template('schermata_esecuzione.html', **user_data)

@app.route('/modifica_scheda')
@login_required
@trainer_required
def modifica_scheda():
    scheda_id = request.args.get('scheda_id')
    if not scheda_id:
        flash('ID scheda non valido')
        return redirect(url_for('dashboard'))
    
    user_data = database.get_user_template_data(current_user.id)
    return render_template('modifica_scheda.html', scheda_id=scheda_id, **user_data)

@app.route('/about')
@login_required
def about():
    user_data = database.get_user_template_data(current_user.id)

    return render_template('About.html', **user_data)

@app.route('/esercizi')
@login_required
@trainer_required
def esercizi():
    clients = database.get_clients_by_trainer(current_user.id)
    return render_template('gestione_esercizi.html', clients=clients)

@app.route('/creazione_scheda')
@login_required
@trainer_required
def creazione_scheda():
    return render_template('creazione_scheda.html')

@app.route('/logout')
@login_required
def logout():
    # Pulisci la sessione
    session.clear()
    logout_user()
    flash('Logout effettuato con successo')
    return redirect(url_for('login'))

@app.route('/change_password', methods=['GET', 'POST'])
@login_required
def change_password():
    if request.method == 'GET':
        return render_template('change_password.html')
    
    data = request.get_json()
    new_password = data.get('new_password')
    confirm_password = data.get('confirm_password')
    
    if not new_password or not confirm_password:
        return jsonify({'error': 'Per favore, inserisci tutti i campi'}), 400
        
    if new_password != confirm_password:
        return jsonify({'error': 'Le password non corrispondono'}), 400
        
    try:
        # Hash e salva la nuova password
        salt = bcrypt.gensalt()
        hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), salt)
        
        # Aggiorna il database
        success = database.update_password(current_user.id, hashed_password)
        if success:
            redirect_url = url_for('dashboard') if current_user.is_trainer else url_for('client_dashboard')
            return jsonify({'message': 'Password aggiornata con successo!', 'redirect': redirect_url})
                
        return jsonify({'error': 'Aggiornamento password fallito'}), 500
    except Exception as e:
        print(f"Errore durante il cambio password: {e}")
        return jsonify({'error': 'Si è verificato un errore durante il cambio password'}), 500

@app.route('/machines')
@login_required
@trainer_required
def macchinari_dashboard():
    return render_template('machines.html')

@app.route('/add_machines')
@login_required
@trainer_required
def add_macchinari_dashboard():
    return render_template('machines.html')

@app.route('/del_machines')
@login_required
@trainer_required
def del_macchinari_dashboard():
    return render_template('machines.html')

@app.route('/change_machines')
@login_required
@trainer_required
def change_macchinari_dashboard():
    return render_template('machines.html')
    
@app.route('/profile')
@login_required
def profile():
    if not current_user.is_authenticated:
        return redirect(url_for('login'))
    
    user_data = database.get_user_template_data(current_user.id)

    return render_template('profilo.html', **user_data)


@app.errorhandler(404)
def page_not_found(error):
    return render_template('404.html'), 404

@app.errorhandler(401)
def unauthorized(error):
    session.clear()
    flash('Sessione non valida. Effettua nuovamente il login.')
    return redirect(url_for('login'))

if __name__ == "__main__":
    # Inizializza e popola il database
    initialize_db()
    populate_database()
    app.run(port=5001)
    
    ''' https con certificato autofirmato
    app.run(
        host='0.0.0.0',  # Permette connessioni esterne
        port=5001,
        ssl_context='adhoc',  # Usa un certificato autofirmato
        debug=True
    )
    '''
from flask import Flask, request, render_template, redirect, url_for, flash, jsonify
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from api import api
from init_db import initialize_db, populate_database
import db_operations as database

import bcrypt

app = Flask(__name__)
app.secret_key = "tacnegativa"
app.register_blueprint(api)
app.config["DEBUG"] = True

# gesotore degli account di Flask
login_manager = LoginManager()
# collegamento gestore all'app
login_manager.init_app(app)
# route che prende l'utente se non è autenticato
login_manager.login_view = 'login'

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
    user = database.get_user_by_id(user_id)
    if user:
        return User(user['id'], user['username'])
    return None

@app.route('/')
def home():
    """ TEMPORANEA
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    return render_template("login.html")
    """
    return render_template("login.html")

@app.route('/login', methods=['POST'])
def login():
    username = request.form.get('username')
    password = request.form.get('pswd')
    
    if not username or not password:
        flash('Per favore, inserisci tutti i campi')
        return redirect(url_for('home'))

    user = database.get_user_by_username(username)
    
    if user is None:
        flash('Username o password non validi')
        return redirect(url_for('home'))
    
    try:
        if database.verify_password(password, user['password']):
            user_obj = User(user['id'], user['username'], bool(user['is_trainer']))
            login_user(user_obj)
            
            # Se l'utente deve cambiare password, reindirizza alla pagina di cambio password
            if user['password_change_required']:
                return redirect(url_for('change_password'))
            
            # Altrimenti, redirect normale basato sul tipo di utente
            if user['is_trainer']:
                return redirect(url_for('dashboard'))
            else:
                return redirect(url_for('client_dashboard'))
        else:
            flash('Username o password non validi')
            return redirect(url_for('home'))
    except Exception as e:
        print(f"Errore durante il login: {e}")
        flash('Si è verificato un errore durante il login')
        return redirect(url_for('home'))

@app.route('/register', methods=['POST'])
@login_required
def register():
    if not current_user.is_trainer:
        return jsonify({'error': 'Unauthorized'}), 403
        
    username = request.form.get('username')
    temp_password = "Password123"
    
    if database.get_user_by_username(username):
        flash('Username già registrato')
        return redirect(url_for('dashboard'))
    
    try:
        hashed_password = database.hash_password(temp_password)
        
        success = database.register_user(username, hashed_password, is_trainer=False, password_change_required=True)
        if success:
            new_user = database.get_user_by_username(username)
            database.add_relation(new_user['id'], current_user.id)

            flash('Cliente registrato con successo!')
            return redirect(url_for('dashboard'))
        
        flash('Registrazione fallita')
        return redirect(url_for('dashboard'))
    except Exception as e:
        print(f"Errore durante la registrazione: {e}")
        flash('Si è verificato un errore durante la registrazione')
        return redirect(url_for('dashboard'))

@app.route('/dashboard')
@login_required
def dashboard():
    if not current_user.is_authenticated:
        return redirect(url_for('login'))
    clients = database.get_clients_by_trainer(current_user.id)
    return render_template('dashboard.html', clients = clients) # passa al template la lista dei clienti

@app.route('/client')
@login_required
def client_dashboard():
    if not current_user.is_authenticated:
        return redirect(url_for('login'))
    return render_template('schedeClient.html')

@app.route('/about')
def about():
    return render_template('About.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('home'))

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
def macchinari_dashboard():
    return render_template('machines.html')

@app.route('/add_machines')
@login_required
def add_macchinari_dashboard():
    if not current_user.is_trainer: # Solo per i trainer
        flash('Accesso non autorizzato')
        return redirect(url_for('dashboard'))
    return render_template('machines.html')

@app.route('/del_machines')
@login_required
def del_macchinari_dashboard():
    if not current_user.is_trainer: # Solo per i trainer
        flash('Accesso non autorizzato')
        return redirect(url_for('dashboard'))
    return render_template('machines.html')

@app.route('/change_machines')
@login_required
def change_macchinari_dashboard():
    if not current_user.is_trainer: # Solo per i trainer
        flash('Accesso non autorizzato')
        return redirect(url_for('dashboard'))
    return render_template('machines.html')
    
    
if __name__ == "__main__":
    # Inizializza e popola il database
    initialize_db()
    populate_database()
    app.run(port=5001)
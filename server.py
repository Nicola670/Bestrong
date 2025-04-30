from flask import Flask, request, render_template, session, redirect, url_for, flash
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from flask_session import Session

from init_db import initialize_db, populate_database
import database_operations as database


#import bcrypt

app = Flask(__name__)

app.config["DEBUG"] = True

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

# Classe User per gestire gli utenti
class User(UserMixin):
    def __init__(self, id, username):
        self.id = id
        self.username = username

def is_valid_password(password):
    # Almeno 8 caratteri, una maiuscola, una minuscola, un numero
    return (len(password) >= 8 and 
            any(c.isupper() for c in password) and 
            any(c.islower() for c in password) and 
            any(c.isdigit() for c in password))


@login_manager.user_loader
def load_user(user_id):
    user = database.get_user_by_id(user_id)
    if user:
        return User(user['id'], user['username'])
    return None

@app.route('/')
def home():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    return render_template("login.html")

@app.route('/login', methods=['POST'])
def login():
    # Se l'utente è già autenticato, fallo uscire
    if current_user.is_authenticated:
        logout_user()
        session.clear()
    
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
        if bcrypt.checkpw(password.encode('utf-8'), user['password']):
            user_obj = User(user['id'], user['username'])
            login_user(user_obj)
            session.permanent = True
            
            # Redirect basato sul tipo di utente
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
def register():
    username = request.form.get('username')
    password = request.form.get('pswd')
    confirm_password = request.form.get('confirm_pswd')
    
    # Validazione input
    if not all([username, password, confirm_password]):
        flash('Per favore, inserisci tutti i campi')
        return redirect(url_for('home'))
    
    # Controllo password corrispondenti
    if password != confirm_password:
        flash('Le password non corrispondono')
        return redirect(url_for('home'))
    
    # Controlla se l'username esiste già
    if database.get_user_by_username(username):
        flash('Username già registrato')
        return redirect(url_for('home'))
    
    try:
        # Hash della password
        salt = bcrypt.gensalt()
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), salt)
        
        # Salva nel database
        success = database.register_user(username, hashed_password)
        if success:
            user = database.get_user_by_username(username)
            user_obj = User(user['id'], user['username'])
            login_user(user_obj)
            flash('Registrazione completata!')
            return redirect(url_for('client_dashboard'))
        
        flash('Registrazione fallita')
        return redirect(url_for('home'))
    except Exception as e:
        print(f"Errore durante la registrazione: {e}")
        flash('Si è verificato un errore durante la registrazione')
        return redirect(url_for('home'))

@app.route('/dashboard')
@login_required
def dashboard():
    if not current_user.is_authenticated:
        return redirect(url_for('login'))
    return render_template('dashboard.html')

@app.route('/client')
@login_required
def client_dashboard():
    if not current_user.is_authenticated:
        return redirect(url_for('login'))
    return render_template('schedeClient.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('home'))

if __name__ == "__main__":
    # Inizializza e popola il database
    initialize_db()
    populate_database()
    app.run()
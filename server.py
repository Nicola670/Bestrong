from flask import Flask, request, render_template, session, redirect, url_for, flash
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from init_db import initialize_db
import database_operations as database
import secrets
import bcrypt

#Inizializzazione del database
initialize_db()

app = Flask(__name__)
app.config["DEBUG"] = True
# Chiave segreta per le sessioni - genera una chiave casuale
app.config['SECRET_KEY'] = secrets.token_hex(16)
# Configurazione della sessione
app.config['SESSION_TYPE'] = 'filesystem'

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
    username = request.form.get('username')
    password = request.form.get('pswd')
    
    if not username or not password:
        flash('Per favore, inserisci tutti i campi')
        return redirect(url_for('home'))

    # Recupera l'utente dal database
    user = database.get_user_by_username(username)
    if user and bcrypt.checkpw(password.encode('utf-8'), user['password']):
        user_obj = User(user['id'], user['username'])
        login_user(user_obj)
        return redirect(url_for('dashboard'))
    
    flash('Username o password non validi')
    return redirect(url_for('home'))

@app.route('/register', methods=['POST'])
def register():
    username = request.form.get('username')
    password = request.form.get('pswd')
    
    # Validazione input
    if not username or not password:
        flash('Per favore, inserisci tutti i campi')
        return redirect(url_for('home'))
    
    if not is_valid_password(password):
        flash('La password deve essere lunga almeno 8 caratteri e contenere maiuscole, minuscole e numeri')
        return redirect(url_for('home'))
    
    # Controlla se l'username esiste già
    if database.get_user_by_username(username):
        flash('Username già registrato')
        return redirect(url_for('home'))
    
    # Hash della password
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), salt)
    
    # Salva nel database
    success = database.register_user(username, hashed_password)
    if success:
        flash('Registrazione completata! Effettua il login.')
        return redirect(url_for('home'))
    
    flash('Registrazione fallita')
    return redirect(url_for('home'))

@app.route('/dashboard')
@login_required
def dashboard():
    return render_template('dashboard.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('home'))

if __name__ == "__main__":
    app.run()
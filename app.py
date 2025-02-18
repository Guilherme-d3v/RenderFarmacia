import os
from flask import Flask, render_template, request, redirect, url_for, session, flash
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
import psycopg2

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY")

# Configuração do banco de dados (usando variável de ambiente DATABASE_URL)
SQLALCHEMY_DATABASE_URI = os.environ.get("postgresql://DBbotica_owner:npg_X32UOeqFIBaT@ep-cold-waterfall-a5l7qbis-pooler.us-east-2.aws.neon.tech/DBbotica?sslmode=require")

app.config['SQLALCHEMY_DATABASE_URI'] = SQLALCHEMY_DATABASE_URI
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

try:
    db = SQLAlchemy(app)
    print(f"psycopg2 version: {psycopg2.__version__}")
except Exception as e:
    print(f"Erro ao conectar ao banco de dados: {e}")
    raise

bcrypt = Bcrypt(app)

# Definição do Modelo de Usuário
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(60), nullable=False)

    def __repr__(self):
        return f"User('{self.email}')"

    # Método para gerar o hash da senha
    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

    # Método para verificar a senha
    def check_password(self, password):
        return bcrypt.check_password_hash(self.password_hash, password)

# Rotas
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']

        # Verifica se o usuário já existe
        if User.query.filter_by(email=email).first():
            flash('Email já cadastrado!', 'danger')
            return redirect(url_for('register'))

        # Cria um novo usuário
        new_user = User(email=email)
        new_user.set_password(password)  # Gera o hash da senha
        db.session.add(new_user)
        db.session.commit()

        flash('Cadastro realizado com sucesso! Faça login.', 'success')
        return redirect(url_for('login'))

    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']

        # Busca o usuário no banco de dados
        user = User.query.filter_by(email=email).first()

        # Verifica se o usuário existe e a senha está correta
        if user and user.check_password(password):
            session['user_id'] = user.id  # Inicia a sessão
            flash('Login realizado com sucesso!', 'success')
            return redirect(url_for('dashboard'))
        else:
            flash('Email ou senha incorretos.', 'danger')

    return render_template('login.html')

@app.route('/dashboard')
def dashboard():
    if 'user_id' not in session:
        flash('Por favor, faça login.', 'danger')
        return redirect(url_for('login'))

    user = User.query.get(session['user_id'])
    return render_template('dashboard.html', user=user)

@app.route('/logout')
def logout():
    session.pop('user_id', None)  # Encerra a sessão
    flash('Logout realizado com sucesso!', 'success')
    return redirect(url_for('login'))

# Cria o banco de dados (execute apenas uma vez)
# Comente ou remova essa linha após a criação inicial das tabelas
# with app.app_context():
#     db.create_all()

if __name__ == '__main__':
    app.run(debug=True)
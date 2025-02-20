import os
from flask import Flask, render_template, request, redirect, url_for, session, jsonify
from flask_sqlalchemy import SQLAlchemy
import psycopg2

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY")
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get("DATABASE_URL")
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Adicione para segurança de cookies (IMPORTANTE)
app.config.update(
    SESSION_COOKIE_SECURE=True,
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE='Lax'
)

db = SQLAlchemy(app)

from models import CartItem, Product, Category, Review, User

# Rotas principais (mantidas iguais)
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'Email já cadastrado!'}), 400
            
        new_user = User(email=email)
        new_user.set_password(password)
        db.session.add(new_user)
        db.session.commit()
        return jsonify({'message': 'Cadastro realizado com sucesso!'})
    
    return render_template('register.html')

# ====== PARTE CORRIGIDA ======
@app.route('/login', methods=['POST'])
def login():
    email = request.form.get('email')
    password = request.form.get('password')
    user = User.query.filter_by(email=email).first()

    if user and user.check_password(password):
        session['user_id'] = user.id  # Armazena user_id na sessão
        return jsonify({
            'message': 'Login realizado!',
            'user': {'nome': user.nome, 'email': user.email}
        })
    return jsonify({'error': 'Credenciais inválidas'}), 401

@app.route('/verificar_sessao')
def verificar_sessao():
    if 'user_id' in session:  # Verificação corrigida
        user = User.query.get(session['user_id'])
        return jsonify({'usuarioLogado': True, 'user': {'nome': user.nome}})
    return jsonify({'usuarioLogado': False})

@app.route('/obter_usuario')
def obter_usuario():
    if 'user_id' in session:
        user = User.query.get(session['user_id'])
        return jsonify({'nome': user.nome})
    return jsonify({'error': 'Não logado'}), 401

@app.route('/logout', methods=['POST'])  # Método POST corrigido
def logout():
    session.pop('user_id', None)
    return jsonify({'success': True, 'message': 'Logout realizado!'})

# ====== Rotas do Carrinho (mantidas iguais) ======
@app.route('/adicionar_ao_carrinho', methods=['POST'])
def adicionar_ao_carrinho():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Não autenticado'}), 401
    
    # ... (o restante do código do carrinho permanece igual)

if __name__ == '__main__':
    app.run(debug=True)
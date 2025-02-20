import os
from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify
from flask_sqlalchemy import SQLAlchemy
import psycopg2

# Inicialização do aplicativo Flask
app = Flask(__name__)

# Define a chave secreta do Flask, usada para sessões e criptografia; ela pode vir de uma variável de ambiente
app.secret_key = os.environ.get("SECRET_KEY")

# Configuração do banco de dados usando a variável de ambiente DATABASE_URL
SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL")
app.config['SQLALCHEMY_DATABASE_URI'] = SQLALCHEMY_DATABASE_URI
# Desativa o rastreamento de modificações para evitar overhead extra
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
# Adicione para segurança de cookies (IMPORTANTE)
app.config.update(
    SESSION_COOKIE_SECURE=True,
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE='Lax'
)
# Inicialização do SQLAlchemy e verificação da versão do psycopg2 (driver do PostgreSQL)
try:
    db = SQLAlchemy()
    db.init_app(app)  # Inicializa o SQLAlchemy com o app Flask
    print(f"psycopg2 version: {psycopg2.__version__}")
except Exception as e:
    print(f"Erro ao conectar ao banco de dados: {e}")
    raise  # Se houver erro, interrompe a execução

from models import CartItem, Product, Category, Review, User # Importa o User do models

# Rotas da aplicação

@app.route('/')
def index():
    # Rota principal que renderiza a página inicial
    return render_template('index.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    # Rota para cadastro de usuários; aceita requisições GET e POST
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']

        # Verifica se já existe um usuário com o mesmo e-mail
        if User.query.filter_by(email=email).first():
            flash('Email já cadastrado!', 'danger')
            return redirect(url_for('register'))

        # Cria um novo objeto usuário e define o hash da senha
        new_user = User(email=email)
        new_user.set_password(password)
        db.session.add(new_user)
        db.session.commit()  # Salva o novo usuário no banco de dados

        flash('Cadastro realizado com sucesso! Faça login.', 'success')
        return redirect(url_for('login'))

    # Se for uma requisição GET, renderiza o formulário de cadastro
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

@app.route('/dashboard')
def dashboard():
    # Rota para o dashboard do usuário, que requer que o usuário esteja logado
    if 'user_id' not in session:
        flash('Por favor, faça login.', 'danger')
        return redirect(url_for('login'))

    # Obtém o usuário a partir do ID armazenado na sessão
    user = User.query.get(session['user_id'])
    return render_template('dashboard.html', user=user)

@app.route('/logout')
def logout():
    # Remove o ID do usuário da sessão
    session.pop('user_id', None)
    flash('Logout realizado com sucesso!', 'success')
    
    # Redirecionar para a página inicial (ou página desejada)
    return redirect(url_for('index'))  # 'index' pode ser a sua página inicial ou qualquer outra



# Rotas do carrinho de compras
@app.route('/adicionar_ao_carrinho', methods=['POST'])
def adicionar_ao_carrinho():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Usuário não logado'}), 401

    product_id = request.form.get('produto_id')
    quantidade = request.form.get('quantidade')

    try:
        quantidade = int(quantidade)
    except ValueError:
        return jsonify({'error': 'Quantidade inválida'}), 400

    produto = Product.query.get(product_id)
    if not produto:
        return jsonify({'error': 'Produto não encontrado'}), 404

    item_existente = CartItem.query.filter_by(user_id=user_id, product_id=product_id).first()

    try:
        if item_existente:
            item_existente.quantity += quantidade
        else:
            novo_item = CartItem(user_id=user_id, product_id=product_id, quantity=quantidade)
            db.session.add(novo_item)

        db.session.commit()
        return jsonify({'message': 'Produto adicionado ao carrinho'}), 200
    except Exception as e:
        db.session.rollback()
        print(f"Erro ao adicionar ao carrinho: {e}")
        return jsonify({'error': 'Erro ao adicionar ao carrinho'}), 500
    
@app.route('/carrinho', methods=['GET'])
def carrinho():
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'error': 'Usuário não autenticado'}), 401

        # Busca os itens do carrinho do usuário autenticado
        itens_no_carrinho = CartItem.query.filter_by(user_id=user_id).all()

        # Converte os itens para JSON
        itens_json = [
            {
                'id': item.id,
                'produto': {
                    'id': item.product.id,
                    'nome': item.product.name,
                    'preco': float(item.product.price)  # Garante que seja um número serializável
                },
                'quantidade': item.quantity
            }
            for item in itens_no_carrinho
        ]

        return jsonify(itens_json)

    except Exception as e:
        return jsonify({'error': 'Erro interno no servidor', 'details': str(e)}), 500


@app.route('/remover_do_carrinho/<int:item_id>', methods=['DELETE'])
def remover_do_carrinho(item_id):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Usuário não logado'}), 401

    item = CartItem.query.get(item_id)
    if not item:
        return jsonify({'error': 'Item não encontrado'}), 404

    if item.user_id != user_id:
        return jsonify({'error': 'Item não pertence ao usuário'}), 403

    try:
        db.session.delete(item)
        db.session.commit()
        return jsonify({'message': 'Item removido do carrinho'}), 200
    except Exception as e:
        db.session.rollback()
        print(f"Erro ao remover do carrinho: {e}")
        return jsonify({'error': 'Erro ao remover do carrinho'}), 500
    
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


# Roda o aplicativo Flask em modo de debug, se este arquivo for executado diretamente
if __name__ == '__main__':
    app.run(debug=True)
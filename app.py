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

@app.route('/login', methods=['GET', 'POST'])
def login():
    # Rota para login de usuário; aceita GET e POST
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']

        # Busca o usuário pelo e-mail informado
        user = User.query.filter_by(email=email).first()

        # Se o usuário existe e a senha está correta, inicia a sessão
        if user and user.check_password(password):
            session['user_id'] = user.id
            flash('Login realizado com sucesso!', 'success')
            return redirect(url_for('dashboard'))
        else:
            flash('Email ou senha incorretos.', 'danger')

    # Renderiza a página de login
    return render_template('login.html')

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
    # Rota para efetuar logout; remove o ID do usuário da sessão
    session.pop('user_id', None)
    flash('Logout realizado com sucesso!', 'success')
    return redirect(url_for('login'))


# Rotas do carrinho de compras
@app.route('/adicionar_ao_carrinho', methods=['POST'])
def adicionar_ao_carrinho():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Usuário não logado'}), 401

    product_id = request.form.get('produto_id')
    quantidade = int(request.form.get('quantidade'))

    produto = Product.query.get(product_id)
    if not produto:
        return jsonify({'error': 'Produto não encontrado'}), 404

    item_existente = CartItem.query.filter_by(user_id=user_id, product_id=product_id).first()

    try:
        if item_existente:
            item_existente.quantity += quantidade
        else:
            novo_item = CartItem(user_id=user_id, product_id=product_id, quantity=quantidade) # Correção aqui
            db.session.add(novo_item)

        db.session.commit()
        return jsonify({'message': 'Produto adicionado ao carrinho'}), 200
    except Exception as e:
        db.session.rollback()
        print(f"Erro ao adicionar ao carrinho: {e}")
        return jsonify({'error': 'Erro ao adicionar ao carrinho'}), 500
@app.route('/carrinho')
def carrinho():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Usuário não logado'}), 401

    itens_no_carrinho = CartItem.query.filter_by(user_id=user_id).all()

    itens_json = []
    for item in itens_no_carrinho:
        itens_json.append({
            'id': item.id,  # Adicione esta linha
            'produto': {
                'id': item.product.id,
                'nome': item.product.name,
                'preco': item.product.price
            },
            'quantidade': item.quantity
        })

    return jsonify(itens_json)
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

# Roda o aplicativo Flask em modo de debug, se este arquivo for executado diretamente
if __name__ == '__main__':
    app.run(debug=True)
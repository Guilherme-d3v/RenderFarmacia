import os
from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
import psycopg2
from models import CartItem,Product, Category, Review# Importa o modelo de item de carrinho definido em outro arquivo (models.py)

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
    db = SQLAlchemy(app)
    print(f"psycopg2 version: {psycopg2.__version__}")
except Exception as e:
    print(f"Erro ao conectar ao banco de dados: {e}")
    raise  # Se houver erro, interrompe a execução

# Inicialização do Bcrypt para tratamento de senhas (hashing)
bcrypt = Bcrypt(app)

# Definição do modelo de Usuário, que representa uma tabela no banco de dados
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)  # Coluna 'id' como chave primária
    email = db.Column(db.String(120), unique=True, nullable=False)  # Coluna 'email' única e obrigatória
    password_hash = db.Column(db.String(60), nullable=False)  # Armazena o hash da senha

    def __repr__(self):
        # Representação do objeto para facilitar a depuração
        return f"User('{self.email}')"

    # Método para gerar e armazenar o hash da senha
    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

    # Método para verificar se a senha informada corresponde ao hash armazenado
    def check_password(self, password):
        return bcrypt.check_password_hash(self.password_hash, password)

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
            item_existente.quantidade += quantidade
        else:
            novo_item = CartItem(user_id=user_id, product_id=product_id, quantidade=quantidade)
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
            'produto': {
                'id': item.product.id,
                'nome': item.product.name,
                'preco': item.product.preco
            },
            'quantidade': item.quantidade
        })

    return jsonify(itens_json)
# Roda o aplicativo Flask em modo de debug, se este arquivo for executado diretamente
if __name__ == '__main__':
    app.run(debug=True)

import os
from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify
from flask_sqlalchemy import SQLAlchemy
import psycopg2
from flask_mail import Mail, Message

# Inicialização do aplicativo Flask
app = Flask(__name__)

# Define a chave secreta do Flask, usada para sessões e criptografia; ela pode vir de uma variável de ambiente
app.secret_key = os.environ.get("SECRET_KEY")

# Configurações do servidor SMTP
app.config['MAIL_SERVER'] = 'smtp.gmail.com'  # ou o servidor de e-mail que você está usando
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USE_SSL'] = False
app.config['MAIL_USERNAME'] = 'guii.parada@gmail.com'  # seu e-mail
app.config['MAIL_PASSWORD'] = 'phae zigu odbw fcch'  # sua senha ou app password
app.config['MAIL_DEFAULT_SENDER'] = 'guii.parada@gmail.com'  # Substitua pelo seu e-mail


# Inicializando o Flask-Mail
mail = Mail(app)

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

@app.route('/construct')
def construct():
    return render_template('construct.html')

@app.route('/register', methods=['POST'])
def register():
    try:
        data = request.json  # Recebe os dados em JSON do front-end
        nome = data.get("nome")
        email = data.get("email")
        password = data.get("password")
        birth = data.get("birth")
        cpf = data.get("cpf")
        telefone = data.get("telefone")

        if not nome or not email or not password or not birth or not cpf or not telefone:
            return jsonify({"message": "Preencha todos os campos!", "success": False}), 400

        # Verifica se o e-mail ou CPF já estão cadastrados
        if User.query.filter_by(email=email).first():
            return jsonify({"message": "Email já cadastrado!", "success": False}), 400
        if User.query.filter_by(cpf=cpf).first():
            return jsonify({"message": "CPF já cadastrado!", "success": False}), 400

        # Criar usuário e definir a senha usando o método set_password()
        new_user = User(nome=nome, email=email, birth=birth, cpf=cpf, telefone=telefone)
        new_user.set_password(password)

        db.session.add(new_user)
        db.session.commit()

        return jsonify({"message": "Cadastro realizado com sucesso!", "success": True}), 201

    except Exception as e:
        return jsonify({"message": f"Erro ao cadastrar: {str(e)}", "success": False}), 500


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

@app.route('/logout', methods=['POST'])  # <-- Método POST definido
def logout():
    if 'user_id' in session:
        session.pop('user_id', None)
    return jsonify({'success': True, 'message': 'Logout realizado!'})


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
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'message': 'Por favor, efetue login'}), 401

    try:
        # Busca os itens do carrinho do usuário autenticado
        itens_no_carrinho = CartItem.query.filter_by(user_id=user_id).all()

        # Calcula o total e prepara a lista de itens em JSON
        itens_json = []
        total_carrinho = sum(
            float(item.product.price) * item.quantity
            for item in itens_no_carrinho
        )

        # Converte os itens para JSON
        for item in itens_no_carrinho:
            preco_item = float(item.product.price)
            subtotal_item = preco_item * item.quantity
            itens_json.append({
                'id': item.id,
                'produto': {
                    'id': item.product.id,
                    'nome': item.product.name,
                    'preco': preco_item
                },
                'quantidade': item.quantity,
                'subtotal': subtotal_item  # Opcional: incluir o subtotal de cada item
            })

        return jsonify({
            'itens': itens_json,
            'total': round(total_carrinho, 2)
        })

    except Exception as e:
        return jsonify({
            'error': 'Erro interno no servidor',
            'details': str(e)
        }), 500





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


# Rota para resetar a senha usando o token
@app.route('/reset-password/<token>', methods=['GET', 'POST'])
def reset_password(token):
    if request.method == 'GET':
        # Verifica se o token é válido
        user = User.find_by_reset_token(token)
        if not user or user.is_reset_token_expired():
            flash('O link de recuperação é inválido ou expirou.', 'error')
            return render_template('reset_password.html', token=token)
        return render_template('reset_password.html', token=token)
    
    elif request.method == 'POST':
        try:
            data = request.get_json()
            password = data.get('password')
            confirm_password = data.get('confirm_password')
            
            # Validações
            if not password or not confirm_password:
                return jsonify({'error': 'Preencha todos os campos'}), 400
            
            if password != confirm_password:
                return jsonify({'error': 'As senhas não coincidem'}), 400
            
            if len(password) < 8:
                return jsonify({'error': 'A senha deve ter pelo menos 8 caracteres'}), 400
            
            user = User.find_by_reset_token(token)
            if not user or user.is_reset_token_expired():
                return jsonify({'error': 'Link inválido ou expirado'}), 400
            
            # Atualiza a senha
            user.set_password(password)
            user.reset_token = None
            user.reset_token_expiry = None
            db.session.commit()
            
            return jsonify({
                'message': 'Senha redefinida com sucesso! Você será redirecionado para a página de login.'
            }), 200
            
        except Exception as e:
            db.session.rollback()
            print(f"Erro ao redefinir senha: {str(e)}")
            return jsonify({
                'error': 'Ocorreu um erro ao redefinir sua senha. Por favor, tente novamente.'
            }), 500

@app.route('/forgot-password', methods=['POST'])
def forgot_password():
    try:
        data = request.get_json()  # Agora recebemos JSON em vez de form-data
        email = data.get('email')
        
        if not email:
            return jsonify({'error': 'E-mail é obrigatório'}), 400

        user = User.query.filter_by(email=email).first()
        if not user:
            # Por segurança, não revelamos se o e-mail existe ou não
            return jsonify({
                'message': 'Se o e-mail estiver cadastrado, um link de recuperação será enviado'
            }), 200

        # Gera o token de reset
        reset_token = user.generate_reset_token()
        reset_link = url_for('reset_password', token=reset_token, _external=True)
        
        # Configura o e-mail
        msg = Message(
            "Recuperação de Senha - Botica Suplementos",
            recipients=[email]
        )
        msg.body = f"""Olá,

Você solicitou a redefinição de sua senha. Clique no link abaixo para criar uma nova senha:

{reset_link}

Este link expirará em 24 horas.

Se você não solicitou esta alteração, por favor ignore este e-mail.

Atenciosamente,
Equipe Botica Suplementos"""
        
        # Envia o e-mail
        mail.send(msg)
        
        return jsonify({
            'message': 'Se o e-mail estiver cadastrado, um link de recuperação será enviado'
        }), 200

    except Exception as e:
        print(f"Erro no forgot-password: {str(e)}")
        return jsonify({
            'error': 'Ocorreu um erro ao processar sua solicitação'
        }), 500

# Roda o aplicativo Flask em modo de debug, se este arquivo for executado diretamente
if __name__ == '__main__':
    app.run(debug=True)
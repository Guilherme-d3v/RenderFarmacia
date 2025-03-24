from app import db  # Importa a instância 'db' do arquivo app.py
from flask_bcrypt import Bcrypt
from datetime import datetime, timedelta
import secrets

bcrypt = Bcrypt()

class User(db.Model):
    __tablename__ = 'user'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(60), nullable=False)
    nome = db.Column(db.String(100), nullable=False)
    birth = db.Column(db.String(10), nullable=False) # Assumindo formato DD/MM/AAAA
    cpf = db.Column(db.String(14), unique=True, nullable=False) # Assumindo formato XXX.XXX.XXX-XX
    telefone = db.Column(db.String(15), nullable=False) # Assumindo formato (XX) XXXXX-XXXX
    # Campos para recuperação de senha
    reset_token = db.Column(db.String(100), unique=True, nullable=True)
    reset_token_expiry = db.Column(db.DateTime, nullable=True)

    def __repr__(self):
        return f"User('{self.email}')"

    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

    def check_password(self, password):
        return bcrypt.check_password_hash(self.password_hash, password)

    # Métodos para recuperação de senha (adicione estas funções dentro da classe User)
    def generate_reset_token(self):
        self.reset_token = secrets.token_urlsafe(50)
        self.reset_token_expiry = datetime.utcnow() + timedelta(hours=1) # Token expira em 1 hora
        db.session.commit()
        return self.reset_token

    def is_reset_token_expired(self):
        return self.reset_token_expiry is None or self.reset_token_expiry < datetime.utcnow()

    @staticmethod
    def find_by_reset_token(token):
        return User.query.filter_by(reset_token=token).first()
    
class CartItem(db.Model):
    __tablename__ = 'cart_items'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False) # Corrigido para 'products.id'
    quantity = db.Column(db.Integer, nullable=False, default=1)

    product = db.relationship('Product', backref='cart_items')
    user = db.relationship('User', backref='cart_items')

    def __repr__(self):
        return f"CartItem('{self.product_id}', '{self.user_id}', '{self.quantity}')"

class Product(db.Model):
    __tablename__ = 'products' # Corrigido para 'products'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    price = db.Column(db.Float, nullable=False)
    description = db.Column(db.String(200))
    image = db.Column(db.String(100))
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id')) # Corrigido para 'categories.id'
    reviews = db.relationship('Review', lazy=True)

    def __repr__(self):
        return f'<Product {self.name}>'

class Category(db.Model):
    __tablename__ = 'categories' # Corrigido para 'categories'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    products = db.relationship('Product', backref='category', lazy=True)

    def __repr__(self):
        return f'<Category {self.name}>'

class Review(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    rating = db.Column(db.Integer, nullable=False)
    comment = db.Column(db.String(200))
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False) # Corrigido para 'products.id'
    product = db.relationship('Product', overlaps="reviews")

    def __repr__(self):
        return f'<Review {self.id}>'
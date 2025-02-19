from flask_sqlalchemy import SQLAlchemy
db = SQLAlchemy()


class CartItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=1)

    product = db.relationship('Product', backref='cart_items')
    user = db.relationship('User', backref='cart_items')

    def __repr__(self):
        return f"CartItem('{self.product_id}', '{self.user_id}', '{self.quantity}')"

class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    price = db.Column(db.Float, nullable=False)
    description = db.Column(db.String(200)) # Campo para descrição do produto
    image = db.Column(db.String(100)) # Campo para imagem do produto
    category_id = db.Column(db.Integer, db.ForeignKey('category.id')) # Chave estrangeira para categoria
    reviews = db.relationship('Review', backref='product', lazy=True) # Relacionamento com avaliações

    def __repr__(self):
        return f'<Product {self.name}>'

class Category(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    products = db.relationship('Product', backref='category', lazy=True) # Relacionamento com produtos

    def __repr__(self):
        return f'<Category {self.name}>'

class Review(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    rating = db.Column(db.Integer, nullable=False)
    comment = db.Column(db.String(200))
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False)
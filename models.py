from app import db  # Importa a instância 'db' do arquivo app.py

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(60), nullable=False)

    def __repr__(self):
        return f"User('{self.email}')"

class CartItem(db.Model):
    __tablename__ = 'cart_items'  # Especifica o nome da tabela
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
    description = db.Column(db.String(200))
    image = db.Column(db.String(100))
    category_id = db.Column(db.Integer, db.ForeignKey('category.id'))
    reviews = db.relationship('Review', lazy=True)

    def __repr__(self):
        return f'<Product {self.name}>'

class Category(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    products = db.relationship('Product', backref='category', lazy=True)

    def __repr__(self):
        return f'<Category {self.name}>'

class Review(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    rating = db.Column(db.Integer, nullable=False)
    comment = db.Column(db.String(200))
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False)
    product = db.relationship('Product', overlaps="reviews")

    def __repr__(self):
        return f'<Review {self.id}>'
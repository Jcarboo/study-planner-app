from flask_pymongo import PyMongo
from flask_login import LoginManager
from flask_bcrypt import Bcrypt
from flask_mail import Mail

mongo = PyMongo()
login_manager = LoginManager()
bcrypt = Bcrypt()
mail = Mail()

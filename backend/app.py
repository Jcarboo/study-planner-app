from flask import Flask
from flask_cors import CORS
from config import Config
from extensions import mongo, login_manager, bcrypt, mail
from routes.study import study_bp
from routes.auth import auth_bp
import os


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    app.config.update(
        MAIL_SERVER='smtp.gmail.com',
        MAIL_PORT=587,
        MAIL_USE_TLS=True,
        MAIL_USERNAME=os.environ.get('MAIL_USERNAME'),
        MAIL_PASSWORD=os.environ.get('MAIL_PASSWORD'),
        MAIL_DEFAULT_SENDER=os.environ.get('MAIL_USERNAME')
    )

    mail.init_app(app)

    # Init extensions
    CORS(app, supports_credentials=True, origins=["http://localhost:3000"], allow_headers=["Content-Type"])
    mongo.init_app(app)
    login_manager.init_app(app)
    bcrypt.init_app(app)

    # Register blueprints
    app.register_blueprint(study_bp)
    app.register_blueprint(auth_bp)
    return app

# Moved this out of top-level to avoid circular import
from models.user import User

@login_manager.user_loader
def load_user(user_id):
    return User.get(user_id)

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)

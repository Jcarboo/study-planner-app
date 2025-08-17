# app.py
from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from extensions import mongo, login_manager, bcrypt, mail
import os

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    app.config.update(
        SECRET_KEY=os.environ.get("SECRET_KEY"),
        SESSION_COOKIE_SAMESITE="None",
        SESSION_COOKIE_SECURE=True,
        REMEMBER_COOKIE_SAMESITE="None",
        REMEMBER_COOKIE_SECURE=True,
    )

    # Mail
    app.config.update(
        MAIL_SERVER='smtp.gmail.com',
        MAIL_PORT=587,
        MAIL_USE_TLS=True,
        MAIL_USERNAME=os.environ.get('MAIL_USERNAME'),
        MAIL_PASSWORD=os.environ.get('MAIL_PASSWORD'),
        MAIL_DEFAULT_SENDER=os.environ.get('MAIL_USERNAME')
    )

    CORS(
        app,
        supports_credentials=True,
        origins=[
            os.environ.get("FRONTEND_URL", "https://plan2win.vercel.app"),
            "http://localhost:3000",                
            "https://*.vercel.app",                 
        ],
        allow_headers=["Content-Type"],
        expose_headers=["Set-Cookie"],
    )

    mail.init_app(app)
    mongo.init_app(app)
    login_manager.init_app(app)
    bcrypt.init_app(app)

    # blueprints
    from routes.study import study_bp
    from routes.auth import auth_bp
    from routes.profile import profile_bp
    from routes.search import search_bp
    from routes.ai import ai_bp

    app.register_blueprint(study_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(profile_bp)
    app.register_blueprint(search_bp)
    app.register_blueprint(ai_bp)

    @app.get("/health")
    def health():
        return jsonify({"ok": True, })
    
    return app

from models.user import User

@login_manager.user_loader
def load_user(user_id):
    return User.get(user_id)

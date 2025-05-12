from flask import Blueprint, request, jsonify, make_response
from flask_login import login_user, logout_user, login_required, current_user
from extensions import mongo, mail
from models.user import User
from utils.security import hash_password, check_password
from flask_cors import cross_origin
from bson.objectid import ObjectId
from flask_mail import Message

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')

@auth_bp.route('/register', methods=['POST', 'OPTIONS'])
@cross_origin(origins='http://localhost:3000', supports_credentials=True)
def register():
    # Handle preflight OPTIONS request
    if request.method == 'OPTIONS':
        response = make_response('', 200)
        response.headers['Access-Control-Allow-Origin'] = 'http://localhost:3000'
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        return response

    # Handle POST registration request
    data = request.get_json()

    existing = mongo.db.users.find_one({'email': data['email']})
    if existing:
        return jsonify({'error': 'User already exists'}), 400

    hashed = hash_password(data['password'])
    result = mongo.db.users.insert_one({
        'username': data['username'],
        'email': data['email'],
        'password': hashed
    })

    # Log them in
    user_doc = mongo.db.users.find_one({'email': data['email']})
    user = User(user_doc)
    login_user(user)
    msg = Message(
        subject="Welcome to Study Planner!",
        recipients=[data['email']],
        body=f"Hi {data['username']}, thanks for signing up for Plan2Win! Read up on how to use the app on the about page of the wesbite! Happy planning!"
    )
    mail.send(msg)

    return jsonify({'message': 'User created', 'user_id': str(result.inserted_id)}), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user_doc = mongo.db.users.find_one({'email': data['email']})
    if user_doc and check_password(data['password'], user_doc['password']):
        user = User(user_doc)
        login_user(user)
        return jsonify({'message': 'Login successful', 'user': user.username}), 200
    return jsonify({'error': 'Invalid credentials'}), 401

@auth_bp.route('/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({'message': 'Logout successful'})

@auth_bp.route('/check', methods=['GET'])
@cross_origin(origins='http://localhost:3000', supports_credentials=True)
def check_session():
    response = make_response(jsonify({"loggedIn": current_user.is_authenticated}))
    return response

@auth_bp.route('/delete-account', methods=['POST'])
@login_required
@cross_origin(origins='http://localhost:3000', supports_credentials=True)
def delete_account():
    user_id = current_user.id
    mongo.db.users.delete_one({"_id": ObjectId(user_id)})
    mongo.db.studyplans.delete_many({"user_id": user_id})  # Adjust this if your study plan model differs
    logout_user()
    return jsonify({"message": "Account deleted"}), 200
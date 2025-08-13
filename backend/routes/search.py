from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from flask_login import login_required
from bson.objectid import ObjectId
from extensions import mongo

search_bp = Blueprint('search', __name__, url_prefix='/search')

@search_bp.route('/users', methods=['GET'])
@login_required
@cross_origin(origins='https://plan2win.vercel.app', supports_credentials=True)
def search_users():
    query = request.args.get('q', '').strip()
    if not query:
        return jsonify([])

    results = mongo.db.users.find(
        { 'username': { '$regex': query, '$options': 'i' } },
        { 'username': 1 }
    )
    return jsonify([
        { 'username': user['username'], 'user_id': str(user['_id']) }
        for user in results
    ])

@search_bp.route('/courses', methods=['GET'])
@login_required
@cross_origin(origins='https://plan2win.vercel.app', supports_credentials=True)
def search_courses():
    query = request.args.get('q', '').strip()
    if not query:
        return jsonify([])

    # Unwind courses array and match on course name
    pipeline = [
        { '$unwind': '$courses' },
        { '$match': { 'courses': { '$regex': query, '$options': 'i' } } },
        { '$group': { '_id': '$courses' } }
    ]
    results = mongo.db.users.aggregate(pipeline)
    return jsonify([r['_id'] for r in results])

@search_bp.route('/course-members/<course>', methods=['GET'])
@login_required
@cross_origin(origins='https://plan2win.vercel.app', supports_credentials=True)
def get_course_members(course):
    results = mongo.db.users.find(
        { 'courses': course },
        { 'username': 1 }
    )
    return jsonify([
        { 'username': user['username'], 'user_id': str(user['_id']) }
        for user in results
    ])

@search_bp.route('/user/<user_id>', methods=['GET'])
@login_required
@cross_origin(origins='https://plan2win.vercel.app', supports_credentials=True)
def get_user_profile(user_id):
    user_doc = mongo.db.users.find_one(
        { "_id": ObjectId(user_id) },
        { "username": 1, "email": 1, "courses": 1 }
    )
    if not user_doc:
        return jsonify({ "error": "User not found" }), 404

    return jsonify({
        "username": user_doc.get("username"),
        "email": user_doc.get("email"),
        "courses": user_doc.get("courses", [])
    })

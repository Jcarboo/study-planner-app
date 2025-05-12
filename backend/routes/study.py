from flask import Blueprint, request, jsonify
from flask_login import current_user, login_required
from extensions import mongo
from bson.objectid import ObjectId

study_bp = Blueprint('study', __name__, url_prefix='/study')

@study_bp.route('/create', methods=['POST'])
@login_required
def create_plan():
    data = request.get_json()
    mongo.db.study_plans.insert_one({
        'user_id': ObjectId(data['user_id']),
        'title': data['title'],
        'subject': data['subject'],
        'deadline': data['deadline'],
        'tasks': data['tasks'],
    })
    return jsonify({'message': 'Plan created successfully'}), 201

@study_bp.route('/all', methods=['GET'])
@login_required
def get_all():
    plans = list(mongo.db.study_plans.find({'user_id': current_user.id}))
    for p in plans:
        p['_id'] = str(p['_id'])
    return jsonify(plans), 200

@study_bp.route('/<plan_id>', methods=['PUT'])
@login_required
def update_plan(plan_id):
    data = request.get_json
    mongo.db.study_plans.update_one(
        {'_id': ObjectId(plan_id)},
        {'$set': {
            'title': data['title'],
            'subject': data['subject'],
            'deadline': data['deadline'],
            'tasks': data['tasks']
        }}
    )
    return jsonify({'message': 'Plan updated'}), 200

@study_bp.route('/<plan_id>', methods=['DELETE'])
@login_required
def delete_plan(plan_id):
    mongo.db.study_plans.delete_one(
        {'_id': ObjectId(plan_id),
         'user_id': current_user.id}
        )
    return jsonify({'message': 'Plan deleted'}), 200
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
        'user_id': current_user.id,  
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
    data = request.get_json()
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

@study_bp.route('/<plan_id>/delete-task', methods=['POST'])
@login_required
def delete_task(plan_id):
    data = request.get_json()
    task_name = data.get("task_name")

    if not task_name:
        return jsonify({"error": "Task name required"}), 400

    result = mongo.db.study_plans.update_one(
        {
            "_id": ObjectId(plan_id),
            "user_id": current_user.id
        },
        {
            "$pull": { "tasks": { "name": task_name } }
        }
    )

    if result.modified_count == 0:
        return jsonify({"error": "Task not found or unauthorized"}), 404

    return jsonify({"message": "Task deleted"}), 200
@study_bp.route('/<plan_id>/add-task', methods=['POST'])
@login_required
def add_task(plan_id):
    data = request.get_json()
    task_name = data.get("task_name")

    if not task_name:
        return jsonify({"error": "Task name required"}), 400

    result = mongo.db.study_plans.update_one(
        {
            "_id": ObjectId(plan_id),
            "user_id": current_user.id
        },
        {
            "$push": { "tasks": { "name": task_name, "done": False } }
        }
    )

    if result.modified_count == 0:
        return jsonify({"error": "Plan not found or unauthorized"}), 404

    return jsonify({"message": "Task added"}), 200

@study_bp.route('/<plan_id>/toggle-task', methods=['POST'])
@login_required
def toggle_task(plan_id):
    data = request.get_json()
    task_name = data.get("task_name")
    done = data.get("done")

    result = mongo.db.study_plans.update_one(
        {
            "_id": ObjectId(plan_id),
            "user_id": current_user.id,
            "tasks.name": task_name
        },
        {
            "$set": { "tasks.$.done": done }
        }
    )

    if result.modified_count == 0:
        return jsonify({"error": "Task not found or unauthorized"}), 404

    return jsonify({"message": "Task updated"}), 200


from flask import Blueprint, request, jsonify
from flask_login import current_user, login_required
from extensions import mongo
from bson.objectid import ObjectId
from datetime import datetime, timezone, timedelta
from collections import defaultdict

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

    if task_name is None or done is None:
        return jsonify({"error": "Missing task_name or done"}), 400

    result = mongo.db.study_plans.update_one(
        {
            "_id": ObjectId(plan_id),
            "user_id": current_user.id
        },
        {
            "$set": {
                "tasks.$[elem].done": done,
                "tasks.$[elem].completed_at": datetime.now(timezone.utc).isoformat() if done else None
            }
        },
        array_filters=[{ "elem.name": task_name }]
    )

    if result.modified_count == 0:
        return jsonify({"error": "Task not found or unauthorized"}), 404

    return jsonify({"message": "Task updated"}), 200

@study_bp.route('/stats', methods=['GET'])
@login_required
def get_study_stats():
    plans = list(mongo.db.study_plans.find({'user_id': current_user.id}))

    total_plans = len(plans)
    total_tasks = 0
    completed_tasks = 0
    subject_stats = {}
    daily_completion = {}

    for plan in plans:
        subject = plan.get('subject', 'Unknown')
        tasks = plan.get('tasks', [])

        total_tasks += len(tasks)
        completed = sum(1 for t in tasks if t.get('done'))

        completed_tasks += completed
        subject_stats.setdefault(subject, {'total': 0, 'completed': 0})
        subject_stats[subject]['total'] += len(tasks)
        subject_stats[subject]['completed'] += completed

        for task in tasks:
            if task.get('done') and 'completed_at' in task:
                day = task['completed_at'][:10]  # YYYY-MM-DD
                daily_completion[day] = daily_completion.get(day, 0) + 1

    return jsonify({
        'totalPlans': total_plans,
        'totalTasks': total_tasks,
        'completedTasks': completed_tasks,
        'subjectStats': subject_stats,
        'dailyCompletion': daily_completion
    })

@study_bp.route('/stats/summary', methods=['GET'])
@login_required
def get_summary_stats():
    now = datetime.now(timezone.utc)
    start_date = now - timedelta(days=29)
    streak_map = { (start_date + timedelta(days=i)).strftime('%Y-%m-%d'): 0 for i in range(30) }

    plans = mongo.db.study_plans.find({'user_id': current_user.id})
    subject_counts = defaultdict(int)
    weekly_count = 0

    for plan in plans:
        for task in plan.get("tasks", []):
            if task.get("done") and "completed_at" in task:
                try:
                    dt = datetime.fromisoformat(task["completed_at"].replace("Z", "+00:00"))
                    date_str = dt.astimezone(timezone.utc).strftime('%Y-%m-%d')
                    subject = plan.get("subject", "")[:4].upper()

                    # Add to streak map
                    if date_str in streak_map:
                        streak_map[date_str] += 1

                    # Check if it's within the last 7 days
                    if now - dt <= timedelta(days=6):
                        weekly_count += 1

                    # Subject count
                    subject_counts[subject] += 1
                except Exception as e:
                    print("Error parsing date:", e)

    # Longest streak calc
    streak_keys = sorted(streak_map.keys())
    current_streak = 0
    longest_streak = 0
    for key in streak_keys:
        if streak_map[key] > 0:
            current_streak += 1
            longest_streak = max(longest_streak, current_streak)
        else:
            current_streak = 0

    top_subject = max(subject_counts.items(), key=lambda x: x[1])[0] if subject_counts else None

    return jsonify({
        'longestStreak': longest_streak,
        'weeklyCount': weekly_count,
        'topSubject': top_subject
    })


@study_bp.route('/task-completions/daily', methods=['GET'])
@login_required
def get_daily_task_completions():
    now = datetime.now(timezone.utc)
    start_date = now - timedelta(days=29)  # Last 30 days including today

    # Initialize day map
    daily_counts = { (start_date + timedelta(days=i)).strftime('%Y-%m-%d'): 0 for i in range(30) }

    # Query all plans
    plans = mongo.db.study_plans.find({'user_id': current_user.id})

    for plan in plans:
        for task in plan.get("tasks", []):
            if task.get("done") and "completed_at" in task:
                try:
                    dt = datetime.fromisoformat(task["completed_at"].replace("Z", "+00:00"))
                    day_key = dt.astimezone(timezone.utc).strftime('%Y-%m-%d')
                    if day_key in daily_counts:
                        daily_counts[day_key] += 1
                except Exception as e:
                    print(f"Skipping invalid completed_at date: {task.get('completed_at')} - {e}")

    # Convert to list of dicts for charting
    data = [{"date": day, "count": count} for day, count in daily_counts.items()]
    return jsonify(data)

def _subject_stats_for_user(user_id: str):
    """
    Build per-subject totals/completions for a given user_id.
    Returns list of dicts: {subject, total, completed, percent}
    """
    plans = mongo.db.study_plans.find({"user_id": user_id})
    subject_map = defaultdict(lambda: {"total": 0, "completed": 0})

    for plan in plans:
        subject = (plan.get("subject") or "")[:4].upper()
        for t in plan.get("tasks", []):
            subject_map[subject]["total"] += 1
            if t.get("done"):
                subject_map[subject]["completed"] += 1

    out = []
    for subject, data in subject_map.items():
        total = data["total"]
        completed = data["completed"]
        percent = round((completed / total) * 100) if total else 0
        out.append({
            "subject": subject or "UNK",
            "total": total,
            "completed": completed,
            "percent": percent
        })
    return out

@study_bp.route('/user/<user_id>/subject-stats', methods=['GET'])
@login_required
def public_subject_stats(user_id):
    """
    Per-subject progress for the given user.
    Frontend can display just the percent if you want more privacy.
    """
    return jsonify(_subject_stats_for_user(user_id)), 200


@study_bp.route('/user/<user_id>/stats/summary', methods=['GET'])
@login_required
def public_summary_stats(user_id):
    """
    Longest streak, tasks this week, and top subject for a given user.
    """
    now = datetime.now(timezone.utc)
    start_date = now - timedelta(days=29)
    streak_map = {(start_date + timedelta(days=i)).strftime('%Y-%m-%d'): 0 for i in range(30)}

    plans = mongo.db.study_plans.find({"user_id": user_id})
    subject_counts = defaultdict(int)
    weekly_count = 0

    for plan in plans:
        subject_code = (plan.get("subject", "")[:4] or "").upper()
        for task in plan.get("tasks", []):
            if task.get("done") and "completed_at" in task:
                try:
                    dt = datetime.fromisoformat(task["completed_at"].replace("Z", "+00:00"))
                    date_str = dt.astimezone(timezone.utc).strftime('%Y-%m-%d')
                    if date_str in streak_map:
                        streak_map[date_str] += 1
                    if now - dt <= timedelta(days=6):
                        weekly_count += 1
                    subject_counts[subject_code] += 1
                except Exception:
                    pass

    longest_streak = 0
    current = 0
    for day in sorted(streak_map.keys()):
        if streak_map[day] > 0:
            current += 1
            longest_streak = max(longest_streak, current)
        else:
            current = 0

    top_subject = max(subject_counts.items(), key=lambda x: x[1])[0] if subject_counts else None

    return jsonify({
        "longestStreak": longest_streak,
        "weeklyCount": weekly_count,
        "topSubject": top_subject
    }), 200


@study_bp.route('/user/<user_id>/task-completions/daily', methods=['GET'])
@login_required
def public_daily_completions(user_id):
    """
    Last 30 days of daily completion counts for a given user.
    """
    now = datetime.now(timezone.utc)
    start_date = now - timedelta(days=29)
    daily_counts = {(start_date + timedelta(days=i)).strftime('%Y-%m-%d'): 0 for i in range(30)}

    plans = mongo.db.study_plans.find({"user_id": user_id})
    for plan in plans:
        for task in plan.get("tasks", []):
            if task.get("done") and "completed_at" in task:
                try:
                    dt = datetime.fromisoformat(task["completed_at"].replace("Z", "+00:00"))
                    day_key = dt.astimezone(timezone.utc).strftime('%Y-%m-%d')
                    if day_key in daily_counts:
                        daily_counts[day_key] += 1
                except Exception:
                    pass

    data = [{"date": day, "count": count} for day, count in daily_counts.items()]
    return jsonify(data), 200

@study_bp.route('/<plan_id>/feature', methods=['POST'])
@login_required
def set_featured(plan_id):
    data = request.get_json() or {}
    featured = bool(data.get("featured", False))
    res = mongo.db.study_plans.update_one(
        {"_id": ObjectId(plan_id), "user_id": current_user.id},
        {"$set": {"featured": featured}}
    )
    if res.matched_count == 0:
        return jsonify({"error": "Not found or not owner"}), 404
    return jsonify({"message": "Updated", "featured": featured})

@study_bp.route('/<plan_id>/feature', methods=['POST'])
@login_required
def toggle_feature(plan_id):
    """
    Toggle whether this plan is featured on the user's public profile.
    Body: { "featured": true|false }
    """
    data = request.get_json() or {}
    featured = bool(data.get("featured", False))

    res = mongo.db.study_plans.update_one(
        {"_id": ObjectId(plan_id), "user_id": current_user.id},
        {"$set": {"featured": featured}}
    )

    if res.matched_count == 0:
        return jsonify({"error": "Plan not found or unauthorized"}), 404

    return jsonify({"message": "Updated", "featured": featured}), 200


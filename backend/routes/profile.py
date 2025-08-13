from flask import Blueprint, request, jsonify, Response
from flask_login import current_user, login_required
from collections import defaultdict
from datetime import datetime, timezone, timedelta
from bson.objectid import ObjectId
from extensions import mongo
import os
import gridfs


profile_bp = Blueprint('profile', __name__, url_prefix='/profile')

@profile_bp.route('', methods=['GET'])
@login_required
def get_profile():
    user_doc = mongo.db.users.find_one({'_id': ObjectId(current_user.id)})
    if not user_doc:
        return jsonify({'error': 'User not found'}), 404
    return jsonify({
        "username": user_doc.get("username"),
        "email": user_doc.get("email"),
        "courses": user_doc.get("courses", [])
    })

@profile_bp.route('/courses', methods=['POST'])
@login_required
def update_courses():
    data = request.get_json()
    courses = data.get('courses', [])

    if not isinstance(courses, list):
        return jsonify({'error': 'Course must be a list'}), 400
    
    # Normalize 
    normalized = []
    seen = set()
    for course in courses:
        norm = course.strip().lower()
        if norm not in seen:
            seen.add(norm)
            normalized.append(course.strip().upper())
    
    mongo.db.users.update_one(
        {'_id': ObjectId(current_user.id)},
        {'$set': {'courses': normalized}}
    )

    return jsonify({'message': 'Courses updated successfully'})

@profile_bp.route('/upload-photo', methods=['POST'])
@login_required
def upload_photo():
    fs = gridfs.GridFS(mongo.db)
    if 'photo' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['photo']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    # Remove old photo if exists
    user_doc = mongo.db.users.find_one({"_id": ObjectId(current_user.id)})
    old_photo_id = user_doc.get('profile_photo_id')
    if old_photo_id:
        fs.delete(ObjectId(old_photo_id))

    # Save new photo
    file_id = fs.put(file, filename=f"{current_user.id}_profile_photo")

    # Update user with photo ID
    mongo.db.users.update_one(
        {"_id": ObjectId(current_user.id)},
        {"$set": {"profile_photo_id": file_id}}
    )

    return jsonify({"message": "Photo uploaded successfully"})

@profile_bp.route('/photo', methods=['GET'])
@login_required
def get_photo():
    fs = gridfs.GridFS(mongo.db)
    user_doc = mongo.db.users.find_one({"_id": ObjectId(current_user.id)})
    photo_id = user_doc.get('profile_photo_id')
    if not photo_id:
        return jsonify({"error": "No photo found"}), 404

    try:
        grid_out = fs.get(ObjectId(photo_id))
        return Response(grid_out.read(), mimetype=grid_out.content_type)
    except:
        return jsonify({"error": "Photo not found in GridFS"}), 404
    
@profile_bp.route('/photo/<user_id>', methods=['GET'])
def get_other_user_photo(user_id):
    fs = gridfs.GridFS(mongo.db)
    try:
        user_doc = mongo.db.users.find_one({"_id": ObjectId(user_id)})
        if not user_doc:
            return jsonify({"error": "User not found"}), 404

        photo_id = user_doc.get('profile_photo_id')
        if not photo_id:
            return jsonify({"error": "No photo found"}), 404

        grid_out = fs.get(ObjectId(photo_id))
        return Response(grid_out.read(), mimetype=grid_out.content_type)

    except Exception as e:
        print("Error serving user photo:", e)
        return jsonify({"error": "Failed to retrieve photo"}), 500

@profile_bp.route('/stats', methods=['GET'])
@login_required
def get_study_stats():
    user_id = str(current_user.id)  # stored as string in study_plans

    plans = list(mongo.db.study_plans.find({'user_id': user_id}))
    total_plans = len(plans)
    total_tasks = 0
    completed_tasks = 0

    for plan in plans:
        tasks = plan.get("tasks", [])
        total_tasks += len(tasks)
        completed_tasks += sum(1 for task in tasks if task.get("done") is True)

    return jsonify({
        "total_plans": total_plans,
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks
    }), 200

@profile_bp.route('/<user_id>/public', methods=['GET'])
@login_required
def get_public_profile(user_id):
    """
    Public-view profile for another user.
    Returns basic fields only: username, (optional) email, public courses.
    """
    try:
        user_doc = mongo.db.users.find_one({'_id': ObjectId(user_id)}, {'username': 1, 'email': 1, 'courses': 1})
        if not user_doc:
            return jsonify({'error': 'User not found'}), 404

        return jsonify({
            'username': user_doc.get('username', ''),
            'email': user_doc.get('email', ''),       # remove if you don’t want email public
            'courses': user_doc.get('courses', []),
        }), 200
    except Exception as e:
        print('get_public_profile error:', e)
        return jsonify({'error': 'Failed to load public profile'}), 500


@profile_bp.route('/<user_id>/public-stats', methods=['GET'])
@login_required
def get_public_stats(user_id):
    """
    Privacy-friendly stats for another user:
    - subjectStats: [{subject, percent}] (percent complete per subject)
    - longestStreak (days)
    - topSubject (by completed tasks)
    No raw task counts are returned.
    """
    try:
        # Pull all plans for that user (study_plans.user_id is stored as string)
        plans = list(mongo.db.study_plans.find({'user_id': user_id}))

        # ---- Subject percents (completed / total) ----
        subj_totals = defaultdict(int)
        subj_completed = defaultdict(int)

        for p in plans:
            subject = (p.get('subject') or '')[:4].upper()
            for t in p.get('tasks', []):
                subj_totals[subject] += 1
                if t.get('done'):
                    subj_completed[subject] += 1

        subject_stats = []
        for subj, total in subj_totals.items():
            comp = subj_completed.get(subj, 0)
            percent = round((comp / total) * 100) if total else 0
            subject_stats.append({'subject': subj, 'percent': percent})

        # ---- Longest streak & top subject (by completed tasks) ----
        now = datetime.now(timezone.utc)
        start_date = now - timedelta(days=29)
        streak_map = {(start_date + timedelta(days=i)).strftime('%Y-%m-%d'): 0 for i in range(30)}
        subject_counts = defaultdict(int)

        for p in plans:
            subject = (p.get('subject') or '')[:4].upper()
            for t in p.get('tasks', []):
                if t.get('done') and t.get('completed_at'):
                    try:
                        dt = datetime.fromisoformat(str(t['completed_at']).replace('Z', '+00:00'))
                        day_key = dt.astimezone(timezone.utc).strftime('%Y-%m-%d')
                        if day_key in streak_map:
                            streak_map[day_key] += 1
                        subject_counts[subject] += 1
                    except Exception as e:
                        print('public-stats parse date error:', e)

        # Longest consecutive days with >0 completions
        current = longest = 0
        for day in sorted(streak_map.keys()):
            if streak_map[day] > 0:
                current += 1
                longest = max(longest, current)
            else:
                current = 0

        top_subject = max(subject_counts.items(), key=lambda x: x[1])[0] if subject_counts else None

        return jsonify({
            'longestStreak': int(longest),
            'topSubject': top_subject,
            'subjectStats': subject_stats
        }), 200

    except Exception as e:
        print('get_public_stats error:', e)
        return jsonify({'error': 'Failed to load public stats'}), 500

@profile_bp.route('/<user_id>/featured-plans', methods=['GET'])
def get_featured_plans(user_id):
    """
    Public-ish endpoint: returns read-only, featured study plans for the given user_id.
    """
    cursor = mongo.db.study_plans.find(
        {"user_id": user_id, "featured": True},
        {"title": 1, "subject": 1, "tasks": 1}
    )

    plans = []
    for p in cursor:
        tasks = p.get("tasks", [])
        preview = [{"name": t.get("name", ""), "done": bool(t.get("done", False))} for t in tasks[:6]]
        plans.append({
            "_id": str(p["_id"]),
            "title": p.get("title", "Untitled"),
            "subject": p.get("subject", "Unknown"),
            "tasks": preview,
            "totalTasks": len(tasks),
        })

    return jsonify(plans), 200


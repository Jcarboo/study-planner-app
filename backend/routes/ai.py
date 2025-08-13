# backend/ai.py
import os, json, re, io
from typing import Optional
from flask import Blueprint, request, jsonify
from datetime import datetime, timezone, timedelta
from extensions import mongo
from flask_login import login_required, current_user
from flask_cors import cross_origin
from bson.objectid import ObjectId
from google import genai
from PyPDF2 import PdfReader

ai_bp = Blueprint("ai", __name__, url_prefix="/ai")

def _parse_json_block(text: str):
    """Extract a JSON array/object from model text (handles code fences)."""
    if not text:
        return None
    # Try direct JSON first
    try:
        return json.loads(text)
    except Exception:
        pass
    # Strip ```json ... ``` or ``` ... ```
    m = re.search(r"```(?:json)?\s*(.*?)```", text, re.S | re.I)
    if m:
        candidate = m.group(1).strip()
        try:
            return json.loads(candidate)
        except Exception:
            pass
    # Fallback: find first [ ... ] array
    m = re.search(r"(\[.*\])", text, re.S)
    if m:
        try:
            return json.loads(m.group(1))
        except Exception:
            pass
    return None

@ai_bp.route("/breakdown", methods=["POST"])
@cross_origin(origins='https://plan2win.vercel.app', supports_credentials=True)
@login_required
def breakdown():
    data = request.get_json(force=True) or {}
    title = (data.get("title") or "").strip()
    subject = (data.get("subject") or "").strip()
    notes = (data.get("notes") or "").strip()
    max_items = int(data.get("max_items") or 6)

    if not title:
        return jsonify({"error": "Missing 'title'"}), 400

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return jsonify({"error": "Server misconfig: GEMINI_API_KEY not set"}), 500

    client = genai.Client(api_key=api_key)

    prompt = f"""
You are a study planning assistant. Break down the user's task into {max_items} concrete,
short, actionable subtasks (no fluff). Return ONLY valid JSON in this schema:

[
  {{ "name": "string (actionable step)", "priority": "High|Medium|Low" }},
  ...
]

Context:
- Task/Plan title: {title}
- Subject/Course: {subject or "N/A"}
- Extra notes: {notes or "N/A"}

Rules:
- Keep each "name" under 80 characters.
- Do not include numbering or bullet symbols in names.
- Prefer verbs ("Review Chapter 3", "Write outline").
- Only return JSON, no explanations.
"""

    try:
        resp = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        text = getattr(resp, "text", "") or ""
        parsed = _parse_json_block(text)

        if not isinstance(parsed, list):
            return jsonify({"error": "Model did not return a valid list"}), 502

        # Map to your tasks shape: {name, done:false}
        tasks = []
        for item in parsed[:max_items]:
            name = (item.get("name") if isinstance(item, dict) else str(item)).strip()
            if name:
                tasks.append({"name": name, "done": False})

        return jsonify({"tasks": tasks}), 200

    except Exception as e:
        # Log e server-side in real app
        return jsonify({"error": "AI breakdown failed"}), 500

def _json_from_text(text: str):
    try:
        return json.loads(text)
    except Exception:
        pass
    m = re.search(r"```(?:json)?\s*(.*?)```", text, re.S | re.I)
    if m:
        try:
            return json.loads(m.group(1).strip())
        except Exception:
            pass
    m = re.search(r"(\{.*\}|\[.*\])", text, re.S)
    if m:
        try:
            return json.loads(m.group(1))
        except Exception:
            pass
    return None

@ai_bp.route("/tips", methods=["GET"])
@cross_origin(origins="https://plan2win.vercel.app", supports_credentials=True)
@login_required
def ai_study_tips():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return jsonify({"error": "Server misconfig: GEMINI_API_KEY not set"}), 500

    client = genai.Client(api_key=api_key)

    # --- Fetch current user (ObjectId by default) ---
    user_id = str(current_user.id)
    user_doc = None
    try:
        user_doc = mongo.db.users.find_one({"_id": ObjectId(user_id)})
    except Exception:
        # if your users._id are strings (unlikely here), fall back
        user_doc = mongo.db.users.find_one({"_id": user_id})

    courses = (user_doc or {}).get("courses", [])

    # --- Pull recent plans (last 30 days optional) ---
    plans = list(
        mongo.db.study_plans.find(
            {"user_id": user_id},
            {"title": 1, "subject": 1, "deadline": 1, "tasks": 1}
        )
    )

    def plan_summary(p):
        subj = (p.get("subject") or "")[:10]
        dl = p.get("deadline") or ""
        tasks = p.get("tasks", [])
        done = sum(1 for t in tasks if t.get("done"))
        total = len(tasks)
        return {
            "title": p.get("title") or "Untitled",
            "subject": subj,
            "deadline": dl,
            "done": done,
            "total": total
        }

    plans_compact = [plan_summary(p) for p in plans]

    prompt = f"""
You are a study coach. Generate concise, actionable tips for this student.
Return ONLY valid JSON matching this schema:

{{
  "quickTips": [ "max 5 concise tips" ],
  "habits": [ "max 5 small weekly habits" ],
  "weekPlan": [
    {{ "day": "Mon", "suggestion": "short actionable plan" }},
    {{ "day": "Tue", "suggestion": "..." }},
    {{ "day": "Wed", "suggestion": "..." }},
    {{ "day": "Thu", "suggestion": "..." }},
    {{ "day": "Fri", "suggestion": "..." }},
    {{ "day": "Sat", "suggestion": "..." }},
    {{ "day": "Sun", "suggestion": "..." }}
  ]
}}

Context:
- Courses: {courses}
- Recent plans: {plans_compact}

Guidelines:
- Use subject codes (e.g., CMSC421) where relevant.
- Reference deadlines if present (e.g., “prioritize ENES412 due on Friday”).
- Keep each string < 120 chars. No emojis.
- No preambles or explanations — JSON only.
"""

    try:
        resp = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        data = _json_from_text(getattr(resp, "text", "") or "")
        if not isinstance(data, dict):
            return jsonify({"error": "AI did not return valid JSON"}), 502

        quick = [str(x)[:200] for x in (data.get("quickTips") or [])][:5]
        habits = [str(x)[:200] for x in (data.get("habits") or [])][:5]
        week_raw = data.get("weekPlan") or []
        week = [
            {"day": str(i.get("day",""))[:10], "suggestion": str(i.get("suggestion",""))[:220]}
            for i in week_raw
        ][:7]

        return jsonify({
            "quickTips": quick,
            "habits": habits,
            "weekPlan": week
        })
    except Exception as e:
        # log e in real app
        return jsonify({"error": "AI tips failed"}), 500
    

MAX_NOTES = 5

def _client():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY not set")
    return genai.Client(api_key=api_key)

def _clean_json(text: str):
    try:
        return json.loads(text)
    except Exception:
        pass
    m = re.search(r"```(?:json)?\s*(.*?)```", text, re.S|re.I)
    if m:
        try: return json.loads(m.group(1))
        except Exception: pass
    m = re.search(r"(\{.*\}|\[.*\])", text, re.S)
    if m:
        try: return json.loads(m.group(1))
        except Exception: pass
    return None

def _extract_text_from_upload(f):
    filename = (getattr(f, "filename", "") or "").lower()
    data = f.read()
    if filename.endswith(".pdf"):
        reader = PdfReader(io.BytesIO(data))
        text = ""
        for page in reader.pages:
            text += (page.extract_text() or "") + "\n"
        return text.strip()
    else:
        try: return data.decode("utf-8", errors="ignore")
        except Exception: return data.decode("latin-1", errors="ignore")

def _get_latest_notes_text(user_id: str) -> Optional[str]:
    doc = mongo.db.ai_notes.find_one({"user_id": user_id}, sort=[("created_at", -1)])
    return doc.get("text") if doc else None

def _get_note_text_by_id(user_id: str, note_id: str) -> Optional[str]:
    try:
        doc = mongo.db.ai_notes.find_one({"_id": ObjectId(note_id), "user_id": user_id})
        return doc.get("text") if doc else None
    except Exception:
        return None

@ai_bp.route("/notes", methods=["GET"])
@cross_origin(origins="https://plan2win.vercel.app", supports_credentials=True)
@login_required
def list_notes():
    user_id = str(current_user.id)
    cursor = mongo.db.ai_notes.find({"user_id": user_id}).sort("created_at", -1)
    notes = []
    for n in cursor:
        text = n.get("text", "")
        notes.append({
            "_id": str(n["_id"]),
            "title": n.get("title") or (text[:60] + ("…" if len(text) > 60 else "")),
            "created_at": n.get("created_at"),
            "chars": len(text)
        })
    return jsonify(notes)

@ai_bp.route("/notes/upload", methods=["POST"])
@cross_origin(origins="https://plan2win.vercel.app", supports_credentials=True)
@login_required
def upload_notes():
    user_id = str(current_user.id)
    count = mongo.db.ai_notes.count_documents({"user_id": user_id})
    if count >= MAX_NOTES:
        return jsonify({"error": f"Note limit reached ({MAX_NOTES}). Delete one before adding more."}), 400

    title = None
    text = None

    # multipart file + optional 'title'
    if "note" in request.files:
        text = _extract_text_from_upload(request.files["note"])
        title = request.form.get("title")
    else:
        body = request.get_json(silent=True) or {}
        text = body.get("text")
        title = body.get("title")

    if not text or not text.strip():
        return jsonify({"error": "No notes provided"}), 400

    if not title:
        title = text.strip().splitlines()[0][:60] if text.strip() else "Untitled"
        if len(text) > 60 and title == text[:60]:
            title += "…"

    doc = {
        "user_id": user_id,
        "title": title,
        "text": text.strip(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    inserted = mongo.db.ai_notes.insert_one(doc)
    return jsonify({"message": "Notes uploaded", "noteId": str(inserted.inserted_id)}), 201

@ai_bp.route("/notes/<note_id>", methods=["DELETE"])
@cross_origin(origins="https://plan2win.vercel.app", supports_credentials=True)
@login_required
def delete_note(note_id):
    user_id = str(current_user.id)
    try:
        res = mongo.db.ai_notes.delete_one({"_id": ObjectId(note_id), "user_id": user_id})
        if res.deleted_count == 0:
            return jsonify({"error": "Note not found"}), 404
        return jsonify({"message": "Note deleted"})
    except Exception:
        return jsonify({"error": "Invalid note id"}), 400

@ai_bp.route("/notes/summarize", methods=["POST"])
@cross_origin(origins="https://plan2win.vercel.app", supports_credentials=True)
@login_required
def summarize_notes():
    body = request.get_json() or {}
    note_id = body.get("noteId")
    user_id = str(current_user.id)

    text = _get_note_text_by_id(user_id, note_id) if note_id else _get_latest_notes_text(user_id)
    if not text:
        return jsonify({"error": "No notes found. Upload first."}), 400

    client = _client()
    prompt = f"""
Summarize the following notes into:
- keyPoints: 5–10 concise bullets
- concepts: 3–6 key concepts with 1–2 sentence explanations
- actionItems: 3–6 concrete next steps for studying
Return JSON ONLY:
{{
  "keyPoints": ["..."],
  "concepts": [{{"term":"...", "explanation":"..."}}, ...],
  "actionItems": ["..."]
}}
Notes:
{text[:18000]}
"""
    resp = client.models.generate_content(model="gemini-2.5-flash", contents=prompt)
    data = _clean_json(getattr(resp, "text", "") or "") or {}
    return jsonify(data)

@ai_bp.route("/notes/explain", methods=["POST"])
@cross_origin(origins="https://plan2win.vercel.app", supports_credentials=True)
@login_required
def explain_concept():
    body = request.get_json() or {}
    topic = (body.get("topic") or "").strip()
    note_id = body.get("noteId")
    if not topic:
        return jsonify({"error": "topic required"}), 400

    user_id = str(current_user.id)
    text = _get_note_text_by_id(user_id, note_id) if note_id else _get_latest_notes_text(user_id)
    if not text:
        return jsonify({"error": "No notes found"}), 400

    client = _client()
    prompt = f"""
Explain '{topic}' using the student's notes for grounding.
Return JSON ONLY: {{"explanation":"...", "analogy":"...", "steps":["..."]}}
Notes:
{text[:18000]}
"""
    resp = client.models.generate_content(model="gemini-2.5-flash", contents=prompt)
    data = _clean_json(getattr(resp, "text", "") or "") or {}
    return jsonify(data)

@ai_bp.route("/quiz/generate", methods=["POST"])
@cross_origin(origins="https://plan2win.vercel.app", supports_credentials=True)
@login_required
def quiz_generate():
    body = request.get_json() or {}
    note_id = body.get("noteId")
    num_mcq = int(body.get("numMCQ", 4))
    num_fr = int(body.get("numFR", 2))
    difficulty = (body.get("difficulty") or "medium").lower()

    user_id = str(current_user.id)
    text = _get_note_text_by_id(user_id, note_id) if note_id else _get_latest_notes_text(user_id)
    if not text:
        return jsonify({"error": "No notes found"}), 400

    client = _client()
    prompt = f"""
Create a quiz from these notes. Difficulty: {difficulty}.
Return JSON ONLY:
{{
  "questions": [
    {{
      "type":"mcq",
      "question":"...",
      "choices":["A","B","C","D"],
      "answerIndex": 0,
      "explanation":"..."
    }},
    {{
      "type":"fr",
      "question":"...",
      "rubric":"short rubric to grade",
      "idealAnswer":"2-4 sentence ideal answer"
    }}
  ]
}}
Require exactly {num_mcq} MCQ and {num_fr} FR.
Notes:
{text[:18000]}
"""
    resp = client.models.generate_content(model="gemini-2.5-flash", contents=prompt)
    parsed = _clean_json(getattr(resp, "text", "") or "")
    if not parsed or "questions" not in parsed:
        return jsonify({"error": "Model returned invalid quiz"}), 502

    doc = {
        "user_id": user_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "questions": parsed["questions"]
    }
    inserted = mongo.db.ai_quizzes.insert_one(doc)
    return jsonify({"quizId": str(inserted.inserted_id), "questions": parsed["questions"]})

@ai_bp.route("/quiz/grade", methods=["POST"])
@cross_origin(origins="https://plan2win.vercel.app", supports_credentials=True)
@login_required
def quiz_grade():
    body = request.get_json() or {}
    quiz_id = body.get("quizId")
    answers = body.get("answers", [])
    if not quiz_id or not isinstance(answers, list):
        return jsonify({"error": "quizId and answers[] required"}), 400

    quiz = mongo.db.ai_quizzes.find_one({"_id": ObjectId(quiz_id), "user_id": str(current_user.id)})
    if not quiz:
        return jsonify({"error": "Quiz not found"}), 404

    questions = quiz.get("questions", [])
    score = 0
    detailed = []
    fr_to_grade = []

    for i, q in enumerate(questions):
        if q.get("type") == "mcq":
            correct = q.get("answerIndex")
            user_idx = answers[i] if i < len(answers) else None
            is_correct = (user_idx == correct)
            if is_correct:
                score += 1
            detailed.append({
                "type":"mcq",
                "question": q.get("question"),
                "choices": q.get("choices"),
                "correctIndex": correct,
                "yourIndex": user_idx,
                "correct": is_correct,
                "explanation": q.get("explanation")
            })
        else:
            fr_to_grade.append({
                "i": i,
                "question": q.get("question"),
                "rubric": q.get("rubric"),
                "ideal": q.get("idealAnswer"),
                "answer": (answers[i] if i < len(answers) else "")
            })

    if fr_to_grade:
        client = _client()
        prompt = {
            "role":"user",
            "parts":[{
                "text": f"""Grade the following free-response answers. Return JSON ONLY:

{{
  "graded": [
    {{"index": <int>, "score": <0 or 1>, "feedback": "1-3 sentences"}}, ...
  ]
}}

DATA:
{json.dumps(fr_to_grade)[:18000]}
"""
            }]
        }
        resp = client.models.generate_content(model="gemini-2.5-flash", contents=prompt)
        data = _clean_json(getattr(resp, "text", "") or "") or {}
        for g in data.get("graded", []):
            idx = g.get("index")
            sc = 1 if g.get("score") else 0
            score += sc
            item = next((x for x in fr_to_grade if x["i"] == idx), None)
            detailed.append({
                "type":"fr",
                "index": idx,
                "question": item["question"] if item else "",
                "yourAnswer": item["answer"] if item else "",
                "score": sc,
                "feedback": g.get("feedback")
            })

    total = len(questions)
    return jsonify({"score": score, "total": total, "details": detailed})
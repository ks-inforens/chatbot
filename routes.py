from flask import Blueprint, request, jsonify, current_app
from models import db, Query  
from chatbot.chatbot import PerplexityChatbot
from scholarship_finder.scholarship import build_prompt, fetch_scholarships
import requests
import time
import json

bp = Blueprint('api', __name__, url_prefix='/api')

bot = None

@bp.before_app_request
def create_chatbot():
    global bot
    bot = PerplexityChatbot(
        api_key=current_app.config.get('PERPLEXITY_API_KEY'),
        content_file_path=current_app.config.get('CONTENT_FILE')
    )

@bp.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok"})

@bp.route('/ask', methods=['POST'])
def ask():
    start = time.time()
    data = request.get_json(silent=True) or {}
    question = (data.get("question") or "").strip()
    session_id = data.get("sessionId")
    user_id = data.get("userId")

    if not question:
        return jsonify({"error": "Question is required"}), 400

    ip = request.headers.get("X-Forwarded-For", request.remote_addr)
    ua = request.headers.get("User-Agent")

    try:
        raw_answer = bot.ask_question(question)
        latency_ms = int((time.time() - start) * 1000)

        query = Query(
            session_id=session_id,
            user_id=user_id,
            question=question,
            answer=raw_answer,
            model="perplexity-sonar",
            latency_ms=latency_ms,
            success=True,
            ip_address=ip,
            user_agent=ua,
        )

        db.session.add(query)
        db.session.commit()

        return jsonify({
            "answer": raw_answer,
            "latencyMs": latency_ms,
            "messageId": query.id
        })

    except Exception as e:
        latency_ms = int((time.time() - start) * 1000)
        current_app.logger.error(f"Error during ask: {e}")
        return jsonify({"error": f"Failed to get answer: {str(e)}"}), 500

@bp.route('/feedback', methods=['POST'])
def feedback():
    data = request.get_json()
    message_id = data.get("messageId")
    thumbs_up = data.get("thumbsUp", False)
    thumbs_down = data.get("thumbsDown", False)
    feedback_text = data.get("feedback", "")

    if not message_id:
        return jsonify({"error": "Message ID is required"}), 400

    try:
        query = Query.query.get(message_id)
        if not query:
            return jsonify({"error": "Message ID not found"}), 404

        query.thumbs_up = thumbs_up
        query.thumbs_down = thumbs_down
        query.feedback = feedback_text

        db.session.commit()

        return jsonify({"status": "ok"})
    except Exception as e:
        current_app.logger.error(f"Error updating feedback: {e}")
        return jsonify({"error": str(e)}), 500

@bp.route("/transcribe")
def transcribe():
    try:
        audio_file = request.files["file"]
        response = requests.post(
            "https://api.perplexity.ai/audio/transcriptions",
            headers={"Authorization": f"Bearer {current_app.config.get('PERPLEXITY_API_KEY')}"},
            files={"file": (audio_file.filename, audio_file, audio_file.mimetype)},
        )
        return jsonify(response.json())
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@bp.route("/scholarships", methods=["POST"])
def scholarships():
    try:
        data = request.get_json(silent=True) or {}
        required_fields = ["citizenship", "preferred_country", "level", "field"]

        missing = [f for f in required_fields if not data.get(f)]
        if missing:
            return jsonify({"error": f"Missing required fields: {', '.join(missing)}"}), 400

        prompt = build_prompt(data)
        results = fetch_scholarships(prompt)  

        scholarships_data = json.loads(results)

        return jsonify({
            "scholarships": scholarships_data["scholarships"],  
            "prompt": prompt
        })

    except Exception as e:
        current_app.logger.error(f"Error in /scholarships: {e}")
        return jsonify({"error": str(e)}), 500
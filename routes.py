from flask import Blueprint, request, jsonify, current_app, send_file
from werkzeug.utils import secure_filename
from models import db, Query  
from chatbot.chatbot import PerplexityChatbot
from scholarship_finder.scholarship import build_prompt, fetch_scholarships
from sop_builder.sop_builder import generate_sop, save_pdf, save_docx
from cv_builder.main import generate_cv_from_data
from cv_builder.save import save_as_docx, save_as_pdf  
from cv_builder.parse_cv import extract_info_from_pdf, extract_info_from_docx
import requests
import time
import json
import tempfile
import os

bp = Blueprint('api', __name__, url_prefix='/api')

bot = None

ALLOWED_EXTENSIONS = {'pdf', 'docx'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

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
    
@bp.route("/sop", methods=["POST"])
def sop():
    try:
        data = request.get_json(silent=True) or {}
        required_fields = ["name", "country_of_origin", "intended_degree", 
                           "preferred_country", "field_of_study", "preferred_uni"]

        missing = [f for f in required_fields if not data.get(f)]
        if missing:
            return jsonify({"error": f"Missing required fields: {', '.join(missing)}"}), 400

        token = current_app.config.get("PERPLEXITY_API_KEY")
        sop, prompt = generate_sop(data, token)

        if not sop:
            return jsonify({"error": "Failed to generate SOP"}), 500

        return jsonify({
            "sop": sop,
            "prompt": prompt,
            "word_count": len(sop.split())
        })

    except Exception as e:
        current_app.logger.error(f"Error in /sop: {e}")
        return jsonify({"error": str(e)}), 500
    
@bp.route("/sop/download/pdf", methods=["POST"])
def sop_download_pdf():
    try:
        data = request.get_json()
        sop_text = data.get("sop")
        if not sop_text:
            return {"error": "SOP text is required"}, 400

        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
        tmp.close()  
        save_pdf(tmp.name, sop_text)

        response = send_file(
            tmp.name,
            as_attachment=True,
            download_name="SOP.pdf",
            mimetype="application/pdf"
        )
        
        @response.call_on_close
        def cleanup():
            try:
                os.unlink(tmp.name)
            except Exception:
                current_app.logger.warning(f"Failed to delete temp file: {tmp.name}")

        return response

    except Exception as e:
        current_app.logger.error(f"Error in /sop/download/pdf: {e}")
        return {"error": str(e)}, 500

@bp.route("/sop/download/docx", methods=["POST"])
def sop_download_docx():
    try:
        data = request.get_json()
        sop_text = data.get("sop")
        if not sop_text:
            return {"error": "SOP text is required"}, 400

        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".docx")
        tmp.close()
        save_docx(tmp.name, sop_text)

        response = send_file(
            tmp.name,
            as_attachment=True,
            download_name="SOP.docx",
            mimetype="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        )

        @response.call_on_close
        def cleanup():
            try:
                os.unlink(tmp.name)
            except Exception:
                current_app.logger.warning(f"Failed to delete temp file: {tmp.name}")

        return response

    except Exception as e:
        current_app.logger.error(f"Error in /sop/download/docx: {e}")
        return {"error": str(e)}, 500

@bp.route("/cv/download/docx", methods=["POST"])
def cv_download_docx():
    try:
        data = request.get_json()
        if not data:
            return {"error": "JSON body required"}, 400

        workflow = data.get("workflow")
        if not workflow:
            return {"error": "workflow field is required"}, 400

        has_work_exp = data.get("has_work_exp", None)
        user_data = _extract_user_data(data, workflow)

        generated_cv = generate_cv_from_data(user_data, workflow, has_work_exp)

        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".docx")
        tmp.close()
        save_as_docx(generated_cv, tmp.name)

        response = send_file(
            tmp.name,
            as_attachment=True,
            download_name="Generated_CV.docx",
            mimetype="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        )

        @response.call_on_close
        def cleanup():
            try:
                os.unlink(tmp.name)
            except Exception:
                current_app.logger.warning(f"Failed to delete temp file: {tmp.name}")

        return response

    except Exception as e:
        current_app.logger.error(f"Error in /cv/download/docx: {e}")
        return {"error": str(e)}, 500

@bp.route("/cv/download/pdf", methods=["POST"])
def cv_download_pdf():
    try:
        data = request.get_json()
        if not data:
            return {"error": "JSON body required"}, 400

        workflow = data.get("workflow")
        if not workflow:
            return {"error": "workflow field is required"}, 400

        has_work_exp = data.get("has_work_exp", None)
        user_data = _extract_user_data(data, workflow)

        generated_cv = generate_cv_from_data(user_data, workflow, has_work_exp)

        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
        tmp.close()
        save_as_pdf(generated_cv, tmp.name)

        response = send_file(
            tmp.name,
            as_attachment=True,
            download_name="Generated_CV.pdf",
            mimetype="application/pdf"
        )

        @response.call_on_close
        def cleanup():
            try:
                os.unlink(tmp.name)
            except Exception:
                current_app.logger.warning(f"Failed to delete temp file: {tmp.name}")

        return response

    except Exception as e:
        current_app.logger.error(f"Error in /cv/download/pdf: {e}")
        return {"error": str(e)}, 500

def _extract_user_data(data, workflow):
    if workflow == "new":
        return {
            "full_name": data.get("full_name"),
            "target_country": data.get("target_country"),
            "cv_length": data.get("cv_length"),
            "style": data.get("style"),
            "email": data.get("email"),
            "phone": data.get("phone"),
            "linkedin": data.get("linkedin"),
            "location": data.get("location"),
            "work_experience": data.get("work_experience", ""),
            "education": data.get("education", ""),
            "skills": data.get("skills"),
            "certificates": data.get("certificates"),
            "projects": data.get("projects")
        }
    elif workflow == "existing":
        user_data = data.get("user_data", {})
        if not user_data:
            raise ValueError("user_data is required for existing workflow")
        return user_data
    else:
        raise ValueError("Invalid workflow")
    
@bp.route('/upload-cv', methods=['POST'])
def upload_cv():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": "Unsupported file type"}), 400

    filename = secure_filename(file.filename)
    upload_folder = current_app.config.get('UPLOAD_FOLDER', '/tmp/uploads')
    os.makedirs(upload_folder, exist_ok=True)

    file_path = os.path.join(upload_folder, filename)
    file.save(file_path)

    if filename.endswith('.pdf'):
        info = extract_info_from_pdf(file_path)
    else:
        info = extract_info_from_docx(file_path)

    print(info)

    return jsonify(json.loads(info)), 200
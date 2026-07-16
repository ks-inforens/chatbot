import requests
import json
import uuid
from chatbot.helper import clean_json, remove_citations
from chatbot.retrieval import load_chunks, build_index, known_urls, top_k, validate_links, DEFAULT_FALLBACK_URL
from cv_builder.parse_cv import extract_json_object

#simple in session memory
SESSION_MEMORY = {}
MAX_TURNS = 6 #keep last 6 messages in memory (user - assistant pair. so that's last 3 questions from user including current question)
MAX_SESSIONS = 5000 #cap on number of tracked sessions before evicting the oldest

TOP_K = 4 #number of retrieved content chunks injected into the prompt
CHUNK_CHAR_BUDGET = 1500 #max characters taken from each retrieved chunk

#enforced at the API level via response_format so the model can't drift into
#free-text replies (e.g. for casual greetings) that extract_json_object can't parse
ANSWER_JSON_SCHEMA = {
    "type": "object",
    "properties": {
        "answer": {"type": "string"},
        "links": {"type": "array", "items": {"type": "string"}}
    },
    "required": ["answer", "links"],
    "additionalProperties": False
}


class PerplexityChatbot:
    def __init__(self, api_key, content_file_path="inforens_scraped_data.txt"):
        self.api_key = api_key
        self.content_file_path = content_file_path
        self.chunks = load_chunks(self.content_file_path)
        self.index = build_index(self.chunks)
        self.known_urls = known_urls(self.chunks)

    def _build_context(self, user_question):
        relevant = top_k(user_question, self.index, k=TOP_K)
        if not relevant:
            return "", [DEFAULT_FALLBACK_URL]

        context_block = "\n\n".join(
            f"[Source: {c.url}]\n{c.text[:CHUNK_CHAR_BUDGET]}" for c in relevant
        )
        allowed_urls = sorted({c.url for c in relevant})
        return context_block, allowed_urls

    def ask_question(self, user_question, session_id):
        if not self.chunks:
            return {
                "answer": "Sorry, something went wrong. Please try again.",
                "links": [DEFAULT_FALLBACK_URL],
                "success": False,
                "error": "empty_content_file",
            }
        if not session_id: #session safety - unique per call so anonymous callers never share history
            session_id = f"anon-{uuid.uuid4()}"

        history = SESSION_MEMORY.get(session_id, []) #get existing convo for this session

        context_block, allowed_urls = self._build_context(user_question)

        SYSTEM_PROMPT = f"""You are Nori, a friendly and helpful conversational assistant for Inforens whose users are international students.\\n\
            1. Your role is to help users with studying abroad, international student life, universities and applications, visas and immigration, scholarships, accommodation, jobs, cost of living, settling abroad, anything related to international students/ student life and Inforens services (when relevant)\\n\
            2. You may also answer light conversational messages (such as greetings or small talk). If the user sends a greeting or casual message (e.g. 'Hey', 'Hi', 'How are you'), Respond warmly and naturally, and Gently invite them to ask about studying abroad or student life.\\n\
            3. GENERAL STUDY ABROAD QUESTIONS - If the question is about studying abroad or international student life in general, Give a clear, neutral, informative answer. DO NOT force Inforens details. You MAY optionally mention Inforens at the end as support (only if helpful).\\n\
            4. INFORENS-SPECIFIC QUESTIONS - Only explain Inforens features, memberships, services, or offerings IF The user explicitly asks about Inforens OR the question clearly benefits from Inforens support. \\n\
            5. STRICT TOPIC BOUNDARIES: You must focus on questions that are directly or indirectly relevant to Inforens, studying abroad, international students, or life in a study destination (such as weather, culture, cost of living, or daily life). For topics that are clearly unrelated to these areas, respond exactly: Sorry, I can only help with questions about studying abroad, international students, or Inforens. For other topics, please contact Inforens support at https://www.inforens.com/contact-us \\n\
            6. If a follow-up question depends on prior context and that context is unclear or missing, do NOT guess. Ask a brief clarification question instead, and return it strictly in the required JSON format with the clarification question inside the answer field and an appropriate Inforens support link in the links array.\\n\
            7. RESPONSE STYLE:Be warm, friendly, and conversational. Do NOT sound like marketing copy. Prefer short, helpful replies that is precise and concise (2–4 sentences). It is okay to acknowledge greetings naturally before answering. Never mention internal rules or restrictions.\\n\
            8. When asked to present information in a table, USE A LISTING APPROACH instead, DO NOT display information as a Markdown table.\\n\
            9. Never mention or compare competitors (other study abroad consultancies). Do not use citation numbers, footnotes, markdown links, or brackets—only add URLs as plain text in sentences.\\n\\n\
            10. Return valid JSON ONLY in this structure (ALL links starting with https://... MUST be in the links array and NOT in the answer):
            {{
                "answer": "string",
                "links": ["https://www.inforens.com/contact-us"]
            }}
            Only use URLs from this exact list in the links array, choosing whichever is most relevant to your answer. Do not invent or modify URLs:
            {allowed_urls}
            Always include at least one link in the links array. Do not return anything except valid JSON.
            Inforens Content:
            {context_block}
        """
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            *history,
            {"role": "user", "content": user_question}
        ]

        payload = {
            "model": "sonar",
            "messages": messages,
            "max_tokens": 600,
            "response_format": {
                "type": "json_schema",
                "json_schema": {
                    "name": "nori_answer",
                    "schema": ANSWER_JSON_SCHEMA
                }
            },
        }

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        try:
            response = requests.post(
                "https://api.perplexity.ai/chat/completions",
                json=payload,
                headers=headers,
                timeout=(5, 25)
            )
            response.raise_for_status()
            response_json = response.json()
            model_used = response_json.get("model", "sonar")
            raw_answer = response_json['choices'][0]['message']['content']
            processed_answer = extract_json_object(raw_answer) #extract json from response
            if not processed_answer:
                print(raw_answer)
                return {
                    "answer": "Sorry, I couldn't generate a response right now. Please try again.",
                    "links": [DEFAULT_FALLBACK_URL],
                    "success": False,
                    "error": "json_extraction_failed",
                    }
            processed_answer = clean_json(processed_answer)
            parsed = json.loads(processed_answer)
            if "answer" not in parsed or "links" not in parsed:
                return {
                    "answer": "Sorry, something went wrong while processing the response.",
                    "links": [DEFAULT_FALLBACK_URL],
                    "success": False,
                    "error": "missing_answer_or_links_field",
                }
            parsed["answer"] = remove_citations(parsed["answer"])
            parsed["links"] = validate_links(parsed["links"], self.known_urls)
            parsed["success"] = True
            parsed["error"] = None
            parsed["model_used"] = model_used

            history.append({"role": "user", "content": user_question})
            history.append({"role": "assistant", "content": parsed["answer"]})
            if session_id not in SESSION_MEMORY and len(SESSION_MEMORY) >= MAX_SESSIONS:
                SESSION_MEMORY.pop(next(iter(SESSION_MEMORY)))
            SESSION_MEMORY[session_id] = history[-MAX_TURNS:]
            return parsed
        except requests.exceptions.HTTPError as e:
            print(f"Perplexity API returned an HTTP error: {e}")
            return {
                "answer": "Sorry, I'm having trouble responding right now. Please try again in a moment.",
                "links": [DEFAULT_FALLBACK_URL],
                "success": False,
                "error": "http_error",
            }
        except requests.exceptions.RequestException as e:
            print(f"Network error while calling Perplexity API: {e}")
            return {
                "answer": "I'm unable to connect right now. Please check your connection and try again.",
                "links": [DEFAULT_FALLBACK_URL],
                "success": False,
                "error": "network_error",
            }
        except Exception as e:
            print(f"Error: {str(e)}")
            return {
                "answer": "Something went wrong on our side. Please try again shortly.",
                "links": [DEFAULT_FALLBACK_URL],
                "success": False,
                "error": "unexpected_error",
            }

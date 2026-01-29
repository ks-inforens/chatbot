import requests
import re
import json
from chatbot.helper import clean_json, remove_citations
from cv_builder.parse_cv import extract_json_object

#simple in session memory
SESSION_MEMORY = {}
MAX_TURNS = 6 #keep last 6 messages in memory (user - assistant pair. so that's last 3 questions from user including current question)

class PerplexityChatbot:
    def __init__(self, api_key, content_file_path="inforens_scraped_data.txt"):
        self.api_key = api_key
        self.content_file_path = content_file_path
        self.full_text = self._load_content()
        self.valid_urls = self._extract_valid_urls()

    def _load_content(self):
        try:
            with open(self.content_file_path, "r", encoding="utf-8") as f:
                return f.read()
        except FileNotFoundError:
            print("⚠️ Content file not found.")
            return ""

    def _extract_valid_urls(self):
        urls = set(re.findall(r"https?://[^\s,)]+", self.full_text))
        return urls

    def _postprocess_answer(self, answer):
        # Remove numbered citation marks ([1][2] etc).
        answer = re.sub(r'\[\d+\]', '', answer)
        answer = re.sub(r"\[https?://([^\]]+)\]\(https?://[^\)]+\)", r"https://\1", answer)
        return answer

    def ask_question(self, user_question, session_id):
        if not self.full_text:
            return {"answer": "Sorry, something went wrong. Please try again.", "links": ["https://www.inforens.com/contact-us"]}
        if not session_id: #session safety
            session_id = "anonymous"

        history = SESSION_MEMORY.get(session_id, []) #get existing convo for this session

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
            10. Return valid JSON ONLY in this structure:
            {{
                "answer": "string",
                "links": ["https://www.inforens.com/contact-us"]
            }}
            Always include at least one link in the links array. Do not return anything except valid JSON.
            Inforens Content:
            {self.full_text[:8000]}
        """
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            *history,
            {"role": "user", "content": user_question}
        ]

        payload = {
            "model": "sonar",
            "messages": messages,
            "max_tokens": 400,
        }

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        try:
            response = requests.post(
                "https://api.perplexity.ai/chat/completions",
                json=payload,
                headers=headers
            )
            response.raise_for_status()
            raw_answer = response.json()['choices'][0]['message']['content']
            processed_answer = extract_json_object(raw_answer) #extract json from response
            if not processed_answer:
                print(raw_answer)
                return {
                    "answer": "Sorry, I couldn’t generate a response right now. Please try again.",
                    "links": ["https://www.inforens.com/contact-us"]
                    }
            processed_answer = clean_json(processed_answer)
            parsed = json.loads(processed_answer)
            parsed["answer"] = remove_citations(parsed["answer"])
            if "answer" not in parsed or "links" not in parsed:
                return {
                "answer": "Sorry, something went wrong while processing the response.",
                "links": ["https://www.inforens.com/contact-us"]
            }
            history.append({"role": "user", "content": user_question})
            history.append({"role": "assistant", "content": parsed["answer"]})
            SESSION_MEMORY[session_id] = history[-MAX_TURNS:]
            return parsed
        except requests.exceptions.HTTPError as e:
            print("Perplexity API returned an HTTP error")
            return {"answer": "Sorry, I’m having trouble responding right now. Please try again in a moment.", "links": ["https://www.inforens.com/contact-us"]}
        except requests.exceptions.RequestException:
            print("Network error while calling Perplexity API")
            return { "answer": "I’m unable to connect right now. Please check your connection and try again.", "links": ["https://www.inforens.com/contact-us"]}
        
        except Exception:
            print(f"Error: {str(e)}")
            return { "answer": "Something went wrong on our side. Please try again shortly.", "links": ["https://www.inforens.com/contact-us"] }
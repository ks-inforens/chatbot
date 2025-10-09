import requests
from flask import current_app
import re

class PerplexityChatbot:
    def __init__(self, api_key, content_file_path="inforens_scraped_data.txt"):
        self.api_key = api_key
        self.content_file_path = content_file_path
        self.full_text = self._load_content()

    # Load content from file
    def _load_content(self):
        try:
            with open(self.content_file_path, "r", encoding="utf-8") as f:
                return f.read()
        except FileNotFoundError:
            print("⚠️ Content file not found.")
            return ""

    
    def ask_question(self, user_question):
        if not self.full_text:
            return "No content loaded. Please check the .txt file."

        
        prompt = (
    "You are an assistant for Inforens, helping international students. The audience consists of international students, so every question should be answered from the perspective of an international student."
    "If the user's question matches Inforens content, answer with that and provide the most relevant Inforens page URL (not the homepage if a better link exists). "
    "If the question is about something not in the content (such as weather, currency rates, local facts, news, etc.), always answer using your own knowledge, giving a brief general answer and never refuse. "
    "NEVER say that the question is not related, never say to 'ask a particular question', and never redirect the user back to the homepage unless truly most appropriate. "
    "Do NOT include any citation styles such as [1], [2], etc. "
    "ALWAYS attach one relevant Inforens page link in your reply: select the best deep link for the topic, and if no relevant link is found, use https://www.inforens.com/contact-us. "
    "All answers should be concise (2-3 sentences). "
    "\n\nInforens Content:\n{self.full_text}\n\n"
    f"Question: {user_question}\n"
    "Answer:"
)




        payload = {
            "model": "sonar",
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 400  
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
            return raw_answer.strip()
        except Exception as e:
            return f"API request failed: {str(e)}"

if __name__ == "__main__":
    api_key = current_app.config.get('PERPLEXITY_KEY')

    bot = PerplexityChatbot(api_key=api_key, content_file_path="inforens_scraped_data.txt")

    print("Inforens Chatbot")
    print("Type 'exit' to quit.\n")

    while True:
        question = input("You: ")
        if question.lower() in ["exit", "quit"]:
            print("Chatbot: Goodbye")
            break

        answer = bot.ask_question(question)
        print("Chatbot:", answer, "\n")

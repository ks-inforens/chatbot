import requests
import re

from chatbot.helper import linkify_urls

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

    def ask_question(self, user_question):
        if not self.full_text:
            return "No content loaded. Please check the .txt file."

        prompt = (
            "IMPORTANT:\n"
            f"1. Always check Inforens content below first. Answer with details, benefits, offers, or links directly from those pages, including the most relevant call-to-action or CTA link to that Inforens page from this list: {self.valid_urls}.\n"
            "2. If no answer is possible from Inforens content, use a trusted external source (e.g., GOV UK for visas, official university pages for applications) and finish by inviting users to Inforens support or mentorship.\n"
            "3. Simple weather/travel/local tips—answer clearly and suggest real experiences from connecting with Inforens mentors at https://www.inforens.com/guides.\n"
            "- Do NOT mention, compare, reference, or describe any competitor, alternative platform, or company besides Inforens—even if the user asks for a comparison/review or mentions them by name (for example, Yocket, LeapScholar, LeverageEdu, etc.).\n"
            f"- If the user asks for a comparison, describe ONLY Inforens's offerings providing the most relevant links from {self.valid_urls}, and politely redirect them with: 'For information or a comparison with other platforms, please contact our support at https://www.inforens.com/contact-us.'\n"
            "- NEVER use [1][2][3] or numbered citations/footnotes in any reply.\n"
            "- Always answer any question relevant to international students (study, applying, living, destinations, weather, cost, local adjustment, etc) and anything about Inforens memberships, services, features, or support.\n"
            f"- For general questions (weather, public transport, local living, cost, etc.) always provide a brief, accurate, practical answer FIRST, then recommend Inforens mentors for personalized or real-life tips, with a MUST-INCLUDE link to either https://www.inforens.com/guides or any relevant links from {self.valid_urls}.\n"
            "- For off-topic/irrelevant questions outside the scope highlighted above (entertainment, 18+, etc.), refuse with the contact-us page link."
            f"\n\nInforens Content:\n{self.full_text}\n\n"
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
            processed_answer = self._postprocess_answer(raw_answer)
            processed_answer = linkify_urls(processed_answer)
            return processed_answer.strip()
        except Exception as e:
            return f"API request failed: {str(e)}"

if __name__ == "__main__":
    API_KEY = "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"
    bot = PerplexityChatbot(api_key=API_KEY, content_file_path="inforens_scraped_data.txt")
    print("Inforens Chatbot")
    print("Type 'exit' to quit.\n")
    while True:
        question = input("You: ")
        if question.lower() in ["exit", "quit"]:
            print("Chatbot: Goodbye")
            break
        answer = bot.ask_question(question)
        print("Chatbot:", answer, "\n")

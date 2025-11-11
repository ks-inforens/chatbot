import requests
import re

class PerplexityChatbot:
    def __init__(self, api_key, content_file_path="inforens_scraped_data.txt"):
        self.api_key = api_key
        self.content_file_path = content_file_path
        self.full_text = self._load_content()
        self.valid_urls = self._extract_valid_urls()

    # Load content from file
    def _load_content(self):
        try:
            with open(self.content_file_path, "r", encoding="utf-8") as f:
                return f.read()
        except FileNotFoundError:
            print("⚠️ Content file not found.")
            return ""

    # Extract all URLs from the text file for validity checking
    def _extract_valid_urls(self):
        urls = set(re.findall(r"https?://[^\s,)]+", self.full_text))
        urls.add("https://www.inforens.com/guides")
        urls.add("https://www.inforens.com/contact-us")
        return urls

    # Replace invalid URLs in bot answers with mentor guide or contact-us
    def _postprocess_answer(self, answer):
        urls = re.findall(r"https?://[^\s,)]+", answer)
        lower_answer = answer.lower()
        for url in urls:
            # If the model proposes a URL not in the valid set, swap with best fallback
            if url not in self.valid_urls:
                if ("mentor" in lower_answer or "mentoring" in lower_answer) and "https://www.inforens.com/guides" in self.valid_urls:
                    answer = answer.replace(url, "https://www.inforens.com/guides")
                else:
                    answer = answer.replace(url, "https://www.inforens.com/contact-us")
        # If model outputs '[https://...](https://...)' markdown-style, convert to plain link
        answer = re.sub(r"\[https?://([^\]]+)\]\(https?://[^\)]+\)", r"https://\1", answer)
        return answer

    def ask_question(self, user_question):
        if not self.full_text:
            return "No content loaded. Please check the .txt file."

        # STRICT PROMPT for LLM filtering only
        prompt = (
            "IMPORTANT:\n"
            "- Only answer questions directly relevant to international students, such as: applications, scholarships, visas, study destinations, student life, living costs, travel, weather, accommodation, local transport, cultural adjustment and settling in.\n"
            "- Weather, cost of living, living arrangements, travel, and cultural adaptation questions for study destinations ARE relevant and should be answered.\n"
            "- If a question is completely unrelated to these topics—including personal, entertainment, 18+ content, sports, cooking, gambling, news, jokes, or celebrity queries—politely refuse to answer and respond with:\n"
            "  'Sorry, I can only answer questions related to international students and their study destination. For all other matters, please contact support at https://www.inforens.com/contact-us.'\n"
            "- NEVER attempt to answer anything off-topic, inappropriate, or outside this student/study/destination focus, even if the user insists.\n\n"
            "You are an assistant for Inforens, helping international students. "
            "If the user's question matches Inforens content, answer using that and ONLY provide a URL that is present in the scraped content. "
            "If the question is about mentors/mentoring and no valid link is found, use https://www.inforens.com/guides. "
            "If no relevant deep link is found, use https://www.inforens.com/contact-us. "
            "For questions about weather, transport, living, or cultural adjustment, provide general helpful advice for international students. "
            "Do NOT include citations, references, or mention competitors. Always attach ONE valid Inforens link."
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
            processed_answer = self._postprocess_answer(raw_answer)
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

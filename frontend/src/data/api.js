export const API_BASE_URL = 'http:localhost:5000/api';

export async function askQuestion(question, sessionId, userId) {
    const res = await fetch(`${API_BASE_URL}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, sessionId, userId })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Request failed')
    return data
}

export async function sendFeedback(messageId, thumbsUp, thumbsDown) {
    await fetch(`${API_BASE_URL}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, thumbsUp, thumbsDown }),
    });
}
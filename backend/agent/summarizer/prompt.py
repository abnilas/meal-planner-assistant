SYSTEM_PROMPT = """Summarize the conversation into a short, clear title.

Rules:
- 3-6 words.
- No punctuation.
- No emojis.
- Neutral and descriptive.
- Focus on the main topic or task.
- You will only reply with the title.

Provided conversation:
User: {first_user_message}
Asssistant: {first_agent_reply}
"""


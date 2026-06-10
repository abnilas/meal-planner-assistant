import json
from typing import Any, Dict
from openai import OpenAI

from agent.summarizer.prompt import SYSTEM_PROMPT


def summarize_chat_agent(api_key: str, data: Dict[str, Any]):
    """
    Generate a short chat title from the first user/assistant messages.

    Args:
        api_key (str): OpenRouter API key used to call the chat model.
        data (dict): Conversation payload containing a "messages" list. The
            same payload is returned with its "title" field updated.
    """
    client = OpenAI(base_url="https://openrouter.ai/api/v1", api_key=api_key)
    model = "z-ai/glm-4.5-air"

    # Get first 2 user/assistant messages (skip system prompt if present)
    chat_messages = [msg for msg in data["messages"] if msg["role"] != "system"][:2]
    
    # Create prompt to start summarizing
    summary_messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": f"Conversation:\n{json.dumps(chat_messages, indent=2)}\n\nProvide only the title, nothing else."}
    ]

    response = client.chat.completions.create(
        model=model,
        messages=summary_messages
    )

    data["title"] = response.choices[0].message.content.strip()
    
    return data

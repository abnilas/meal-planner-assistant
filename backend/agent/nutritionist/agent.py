import os
import json
import uuid
from openai import OpenAI

from agent.nutritionist.prompt import SYSTEM_PROMPT
from agent.summarizer.agent import summarize_chat_agent
from scripts.setup_chromadb import set_chromadb_client
from agent.tools.tools import tools
from agent.tools.utils import handle_tool_calls, to_api_messages
from constants import CHAT_FILE_EXTENSION, CHAT_LOG_DIR, CHROMADB_DIR

from schemas.reply_schema import UserMessage

CHROMADB_CLIENT = set_chromadb_client(path=CHROMADB_DIR)


def ensure_message_ids(data: dict):
    for message in data.get("messages", []):
        if "id" not in message:
            message["id"] = str(uuid.uuid4())
    return data


def build_conversation(file_path: str, user_msg: UserMessage):
    """
    Load an existing chat log or create a new conversation payload.

    Args:
        file_path (str): Absolute or relative path to the chat JSON file.
        user_msg (UserMessage): Incoming user message, used to seed the title
            when a new conversation is created.

    Returns:
        dict: Conversation data with a system prompt and message IDs ensured.
    """
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            if "messages" not in data:
                data["messages"] = [
                    {"id": str(uuid.uuid4()), "role": "system", "content": SYSTEM_PROMPT, "products": []}]
    else:
        data = {
            "title": user_msg.message[:50],
            "messages": [{"id": str(uuid.uuid4()), "role": "system", "content": SYSTEM_PROMPT, "products": []}]
        }

    return ensure_message_ids(data)


def chat_with_agent(api_key: str, user_msg: UserMessage):
    """
    Send a user message to the nutritionist agent and persist the reply.

    Args:
        api_key (str): OpenRouter API key used for model calls.
        user_msg (UserMessage): Request payload containing the message text and
            chat session ID.

    Returns:
        dict: Assistant message payload and session ID for the API response.
    """
    client = OpenAI(base_url="https://openrouter.ai/api/v1", api_key=api_key)
    model = "google/gemini-2.5-pro"

    filename = f"{user_msg.sessionId}{CHAT_FILE_EXTENSION}"
    file_path = os.path.join(CHAT_LOG_DIR, filename)

    data = build_conversation(file_path, user_msg)

    # Add user message
    data["messages"].append({
        "id": str(uuid.uuid4()),
        "role": "user",
        "content": user_msg.message,
        "products": []
    })

    response = client.chat.completions.create(
        model=model,
        messages=to_api_messages(data["messages"]),
        tools=tools,
        tool_choice="auto"
    )

    response, mentioned_products = handle_tool_calls(
        CHROMADB_CLIENT, client, model, data, response)

    assistant_reply = response.choices[0].message.content

    if not assistant_reply:
        assistant_reply = "I apologize, but I encountered an issue generating a response."
        mentioned_products = []

    assistant_message_id = str(uuid.uuid4())
    data["messages"].append({
        "id": assistant_message_id,
        "role": "assistant",
        "content": assistant_reply,
        "products": mentioned_products or []
    })

    # Call agent to summarize conversation
    if len(data["messages"]) == 3:  # first system + user + assistant messages
        try:
            data = summarize_chat_agent(api_key, data)
        except Exception as e:
            print(f"Failed to summarize conversation: {e}")

    try:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=4)
        print(f"Conversation saved to {file_path}")
    except Exception as e:
        print(f"Error saving conversation: {e}")

    return {
        "message": {
            "id": assistant_message_id,
            "role": "assistant",
            "content": assistant_reply,
            "products": mentioned_products or []
        },
        "sessionId": user_msg.sessionId
    }

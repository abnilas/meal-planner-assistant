import os
import uuid
import json
from fastapi import APIRouter, HTTPException, status
from dotenv import load_dotenv

from scripts.product_utils import list_all_products, list_stores, list_products_per_store
from agent.nutritionist.agent import chat_with_agent
from schemas.reply_schema import UserMessage
from constants import CHAT_FILE_EXTENSION, CHAT_LOG_DIR, ENV_FILE


router = APIRouter()

load_dotenv(ENV_FILE)


@router.get('/stores', status_code=200)
def get_stores():
    """
    Return all store names available in the dataset with images
    """
    stores = list_stores()
    if not stores:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Supermarket not found"
        )

    return stores


@router.get("/products", status_code=200)
def get_products(store: str = None):
    """
    Return products, optionally filtered by store.

    Args:
        store (str | None): Store name to filter by. If omitted, products from
            all stores are returned.
    """
    if store:
        products = list_products_per_store(store)
    else:
        products = list_all_products()

    if not products:
        raise HTTPException(status_code=404, detail="Product file not found")

    return products


@router.get("/chats", status_code=200)
def list_chats():
    """
    List saved chat sessions.

    Returns:
        list[dict]: Chat IDs and display titles loaded from saved JSON files.
    """
    base_path = CHAT_LOG_DIR

    files = [
        f for f in os.listdir(base_path)
        if os.path.isfile(os.path.join(base_path, f)) and f.endswith(CHAT_FILE_EXTENSION)
    ]
    
    chats = []
    for f in files:
        file_path = os.path.join(base_path, f)
        with open(file_path, 'r') as file:
            data = json.load(file)
            chats.append({
                "id": f.split(".")[0],
                "title": data.get('title', 'Untitled')
            })
    
    return chats


def validate_session_id(session_id: str) -> str:
    try:
        return str(uuid.UUID(session_id))
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid chat session ID"
        )


@ router.get("/chat/{id}", status_code=200)
def get_chat(id):
    """
    Load one saved chat session and backfill missing message IDs.

    Args:
        id (str): Chat session ID, matching a JSON filename in storage.

    Returns:
        dict: Full persisted chat data.
    """
    base_path = CHAT_LOG_DIR
    chat_id = validate_session_id(id)
    file_path = os.path.join(base_path, f"{chat_id}{CHAT_FILE_EXTENSION}")

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Chat not found")

    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    changed = False
    for message in data.get("messages", []):
        if "id" not in message:
            message["id"] = str(uuid.uuid4())
            changed = True

    if changed:
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=4)

    return data


@ router.post("/request-agent", status_code=200)
def call_agent(user_msg: UserMessage):
    """
    Prompt the nutritionist agent and save the conversation to a file.

    Args:
        user_msg (UserMessage): User message payload containing the prompt and
            optional session ID.

    Returns:
        dict: Assistant reply payload from the nutritionist agent.
    """
    api_key= os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(
        status_code = 500, detail = "OPENAI_API_KEY not configured")

    if not user_msg.sessionId:
        user_msg.sessionId = str(uuid.uuid4())
    else:
        user_msg.sessionId = validate_session_id(user_msg.sessionId)

    assistant_reply = chat_with_agent(api_key, user_msg)
    return assistant_reply

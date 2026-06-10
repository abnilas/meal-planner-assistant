import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
PRODUCTS_FILE = os.path.join(DATA_DIR, "supermarkets.json")
CHROMADB_DIR = os.path.join(DATA_DIR, "chroma_data")
CHAT_LOG_DIR = os.path.join(BASE_DIR, "storage", "chats")
ENV_FILE = os.path.join(BASE_DIR, ".env")
CHAT_FILE_EXTENSION = ".json"

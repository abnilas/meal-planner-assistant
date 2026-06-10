import chromadb

from scripts.vector_database.init_database import initialize_product_database


def set_chromadb_client(path: str):
    chroma_client = chromadb.PersistentClient(path=path)
    initialize_product_database(chroma_client, force_reindex=False)

    return chroma_client

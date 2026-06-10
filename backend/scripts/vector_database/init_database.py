from chromadb.api import Collection, ClientAPI
from scripts.product_utils import format_products_per_store
from collections.abc import Iterable

BATCH_SIZE = 100

def set_chromadb_collection(chromadb_client: ClientAPI, collection_name: str):
    """
    Retrieve an existing Chroma collection or create it when missing.

    Args:
        chromadb_client (ClientAPI): Chroma client connected to local storage.
        collection_name (str): Name of the product collection to load.

    Returns:
        Collection: Existing or newly-created Chroma collection.
    """
    collection_exists = False
    try:
        collection = chromadb_client.get_collection(collection_name)
        existing_count = collection.count()
        collection_exists = True

        if existing_count > 0:
            print(f"Collection already exists with {existing_count} products")
        else:
            print("Collection exists but is empty, will populate it")

    except Exception as e:
        print(f"Collection doesn't exist, creating new one")

    if not collection_exists:
        collection = chromadb_client.create_collection(collection_name)

    return collection

def handle_force_reindex(chromadb_client: ClientAPI, collection_name: str):
    try:
        chromadb_client.delete_collection(collection_name)
        print("Deleted existing collection")
    except Exception as e:
        print(f"Collection didn't exist or couldn't be deleted: {e}")


def build_searchable_text(item: dict) -> str:
    name = item.get("name", "Unknown product")
    store = item.get("store", "unknown store")

    attributes = [
        f"{k} {v}"
        for k, v in item.items()
        if k not in {"name", "store"} and v
    ]

    return f"{name} from {store}. " + ", ".join(attributes)


def sanitize_metadata(
    data: dict,
    *,
    list_separator: str = ", ",
) -> dict:
    """
    Convert metadata into Chroma-compatible primitive values.

    Args:
        data (dict): Product metadata to clean before indexing.
        list_separator (str): Separator used when converting iterable values
            into strings.

    Returns:
        dict: Metadata containing only values Chroma can store.
    """
    clean = {}

    for key, value in data.items():
        if value is None:
            continue
        if isinstance(value, (str, int, float, bool)):
            clean[key] = value
        elif isinstance(value, Iterable) and not isinstance(value, (str, bytes)):
            clean[key] = list_separator.join(map(str, value))
        else:
            clean[key] = str(value)

    return clean


def index_items_in_batches(
    chromadb_collection: Collection,
    items: list[dict],
    batch_size: int = BATCH_SIZE,
) -> list[str]:
    """
    Add product records to Chroma in batches with one-by-one fallback.

    Args:
        chromadb_collection (Collection): Chroma collection to receive products.
        items (list[dict]): Normalized product records with at least an "id".
        batch_size (int): Number of records to add per batch.

    Returns:
        list[str]: Product IDs that failed during preparation or indexing.
    """
    failed_items: list[str] = []
    indexed_count = 0

    for i in range(0, len(items), batch_size):
        batch = items[i:i + batch_size]

        documents: list[str] = []
        metadatas: list[dict] = []
        ids: list[str] = []

        for item in batch:
            try:
                documents.append(build_searchable_text(item))
                metadatas.append(sanitize_metadata(item))
                ids.append(str(item["id"]))
            except Exception as e:
                print(f"Error preparing item {item.get('id', 'unknown')}: {e}")
                failed_items.append(str(item.get("id", "unknown")))

        if not documents:
            continue

        try:
            chromadb_collection.add(
                documents=documents,
                metadatas=metadatas,
                ids=ids,
            )
            indexed_count += len(documents)

            if indexed_count % 500 == 0 or indexed_count == len(items):
                print(f"Indexed {indexed_count}/{len(items)} items")

        except Exception as e:
            print(f"Error adding batch: {e}")

            # fallback: add one-by-one
            for j in range(len(documents)):
                try:
                    chromadb_collection.add(
                        documents=[documents[j]],
                        metadatas=[metadatas[j]],
                        ids=[ids[j]],
                    )
                    indexed_count += 1
                except Exception as e2:
                    print(f"   Failed to add item {ids[j]}: {e2}")
                    failed_items.append(ids[j])
    
    final_count = chromadb_collection.count()
    print(f"Successfully indexed {final_count} products")

    if failed_items:
        print(
            f"Failed to index {len(failed_items)} products: {failed_items[:10]}")

    return failed_items


def index_database_items(chromadb_collection: Collection, items: list[dict]):
    print("Starting indexing...")

    index_items_in_batches(chromadb_collection, items, BATCH_SIZE)


def initialize_product_database(chromadb_client: ClientAPI, force_reindex: bool = False):
    """
    Initialize or update all store-specific product collections.

    Args:
        chromadb_client (ClientAPI): Chroma client connected to local storage.
        force_reindex (bool): If True, recreate collections from scratch. If
            False, index only products not already present in each collection.
    """    
    products_by_store = format_products_per_store()
    stores = products_by_store.keys()
    collections_by_store = {}

    for store in stores:
        collection_name = f'{store}_nutrition_products'
        all_store_products = products_by_store.get(store, [])

        print(f"\nProcessing store: '{store}'...")

        if not all_store_products:
            print(f"No products found in source file for this store. Skipping.")
            continue
        
        print(f"Found {len(all_store_products)} total products in source file.")

        if force_reindex:
            handle_force_reindex(chromadb_client, collection_name)

        # Get or create the collection object
        product_collection = set_chromadb_collection(
            chromadb_client, collection_name)
        
        collections_by_store[store] = product_collection
        
        # Get IDs of products already in the database.
        existing_ids = set(product_collection.get(include=[])['ids'])
        print(f"Collection currently contains {len(existing_ids)} items.")
        
        # Find new products
        products_to_index = [
            product for product in all_store_products if str(product['id']) not in existing_ids
        ]
        
        # Only run indexing if there are new products
        if not products_to_index:
            print(" Database is already up-to-date. No new items to index.")
            continue
        
        print(f"Found {len(products_to_index)} new products to add to the database.")
        
        index_database_items(product_collection, products_to_index)
        
        print(f"Successfully indexed {len(products_to_index)} new items.")

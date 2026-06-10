import chromadb
from typing import List, Dict, Any

from scripts.product_utils import list_stores


def search_by_store_collection(chromadb_client: chromadb.ClientAPI, query: str, n_results: int, store: str):
    """
    Search one store-specific Chroma collection for matching products.

    Args:
        chromadb_client (chromadb.ClientAPI): Chroma client connected to the
            product database.
        query (str): Natural-language product search query.
        n_results (int): Maximum number of products to return.
        store (str): Store name used to select the collection.

    Returns:
        list[dict]: Product metadata entries returned by Chroma, or an empty
            list if the collection is missing or empty.
    """
    collection_name = f"{store}_nutrition_products"
    print(
        f"Searching for '{query}' in specific collection: '{collection_name}'...")
    try:
        collection = chromadb_client.get_collection(name=collection_name)

        if collection.count() == 0:
            print(f"Collection '{collection_name}' is empty.")
            return []

        results = collection.query(
            query_texts=[query],
            n_results=n_results
        )

        products = results['metadatas'][0] if results and results['metadatas'] else [
        ]
        print(f"Found {len(products)} products in {store}.")
        return products

    except Exception as e:
        print(f"Error searching in store '{store}': {e}")
        return []


def search_all_store_collections(chromadb_client: chromadb.ClientAPI, query: str, n_results: int):
    """
    Search every store product collection and merge the best matches.

    Args:
        chromadb_client (chromadb.ClientAPI): Chroma client connected to the
            product database.
        query (str): Natural-language product search query.
        n_results (int): Maximum number of products to return across all stores.

    Returns:
        list[dict]: Product metadata sorted by ascending vector distance.
    """
    print(f"Searching for '{query}' across ALL stores...")
    all_results = []
    all_collections = chromadb_client.list_collections()

    for collection in all_collections:
        if not collection.name.endswith("_nutrition_products"):
            continue

        print(f"  - Querying collection: {collection.name}")
        results = collection.query(
            query_texts=[query],
            n_results=n_results,
            include=["metadatas", "distances"]
        )

        # Combine distances and metadatas into a single list of tuples
        if results and results['metadatas'][0]:
            for i in range(len(results['metadatas'][0])):
                distance = results['distances'][0][i]
                metadata = results['metadatas'][0][i]
                all_results.append((distance, metadata))

    if not all_results:
        print("No products found in any store.")
        return []

    # Re-sort all collected results by their distance (ascending order)
    all_results.sort(key=lambda x: x[0])

    # Extract just the metadata from the top N sorted results
    final_products = [metadata for distance, metadata in all_results]

    # Return the top N overall results
    top_products = final_products[:n_results]
    print(f"Found {len(top_products)} products across all stores.")
    return top_products


def search_products(
    chromadb_client: chromadb.ClientAPI,
    query: str,
    n_results: int = 5,
) -> List[Dict[str, Any]]:
    """Searches for products in the vector database.

    If the query mentions a known store, only that store collection is searched.
    Otherwise, all store collections are searched and the closest matches are
    merged into one result list.

    Args:
        chromadb_client (chromadb.ClientAPI): Chroma client connected to the
            product database.
        query (str): Natural-language product search query.
        n_results (int): Maximum number of products to return.

    Returns:
        list[dict[str, Any]]: Product metadata for the best matching products.

    """
    stores = list_stores()
    matching_store = next((store for store in stores if store["name"].lower() in query.lower()),
                          None
                          )

    matching_store = matching_store["name"] if matching_store else None

    if matching_store:
        products = search_by_store_collection(
            chromadb_client, query, n_results, matching_store)

    else:
        products = search_all_store_collections(
            chromadb_client, query, n_results)

    return products

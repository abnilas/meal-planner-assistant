import hashlib
import json

from constants import PRODUCTS_FILE


with open(PRODUCTS_FILE, "r", encoding="utf-8") as f:
    product_data = json.load(f)


def list_all_products():
    return product_data


def list_stores():
    all_stores = []

    for idx in range(len(product_data)):
        store_info = {
            "name": product_data[idx]["n"],
            "image": product_data[idx]["i"],
            "price": 0.00,
        }
        all_stores.append(store_info)
    return list(all_stores)


def list_products_per_store(store: str):
    products = []
    for idx in range(0, len(product_data)):
        if product_data[idx]["n"] == store:
            products.append(product_data[idx])
    return list(products)


def generate_product_id(store_name: str, product_name: str, size: str, price: float) -> str:
    unique_string = f"{store_name}_{product_name}_{size}_{price}"
    return hashlib.md5(unique_string.encode()).hexdigest()


def format_products_per_store():
    """
    Convert raw supermarket data into search-indexable product metadata.

    Returns:
        dict[str, list[dict]]: Store names mapped to normalized product records
            containing ID, store, name, price, and size.
    """
    stores = list_stores()

    formatted_data = {}

    for store in stores:
        per_store_products = list(list_products_per_store(store['name']))
        per_store_products_data = per_store_products[0]['d']

        if per_store_products_data:
            product_list_for_store = [
                {
                'id': generate_product_id(store['name'], product['n'], product['s'], product['p']),
                'store': store['name'],
                'name': product['n'],
                'price': product['p'],
                'size': product['s'],
                }
            for product in per_store_products_data
            ]

            formatted_data[store['name']] = product_list_for_store

    return formatted_data

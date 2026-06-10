tools = [
    {
        "type": "function",
        "function": {
                "name": "search_products",
                "description": (
                    "Search for products from Dutch supermarkets. "
                ),
            "parameters": {
                    "type": "object",
                    "properties": {
                        "query": {
                            "type": "string",
                            "description": "Product description (e.g., 'chicken breast', 'vegetables')"
                        },
                        "n_results": {
                            "type": "integer",
                            "description": "Number of results (default 10)",
                            "default": 10
                        },
                    },
                    "required": ["query"]
                }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "report_mentioned_products",
            "description": (
                "MUST be called at the end of every response. Reports which products "
                "you are explicitly mentioning or recommending to the user. "
                "If no products are mentioned, call with products as an empty array."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "products": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "store": {"type": "string"},
                                "name": {"type": "string"},
                                "price": {"type": "number"},
                                "size": {"type": "string"},
                            },
                            "required": ["store", "name", "price"]
                        },
                        "description": "List of products mentioned. Empty array if none."
                    }
                },
                "required": ["products"]
            }
        }
    }

]

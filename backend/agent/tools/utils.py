import json
from openai import OpenAI
from typing import Any

from agent.tools.search_products import search_products
from agent.tools.tools import tools


def to_api_messages(messages: list):
    allowed_keys = {"role", "content", "tool_calls", "tool_call_id"}
    return [
        {key: value for key, value in message.items() if key in allowed_keys}
        for message in messages
    ]


def convert_tools_to_dict(message: Any):
    """
    Convert OpenAI tool call objects into JSON-serializable dictionaries.

    Args:
        message (Any): Assistant message object containing a "tool_calls"
            sequence from the model response.

    Returns:
        list[dict]: Tool call data that can be appended to API messages.
    """
    tool_calls_dict = []
    for tc in message.tool_calls:
        tool_calls_dict.append({
            "id": tc.id,
            "type": tc.type,
            "function": {
                "name": tc.function.name,
                "arguments": tc.function.arguments
            }
        })
    
    return tool_calls_dict


def handle_tool_calls(
    chromadb_client,
    client: OpenAI,
    model: str,
    data: dict,
    response,
    max_iterations: int = 5
):
    """
    Execute model-requested tools and continue the chat until a final reply.

    Args:
        chromadb_client: Chroma client used by product-search tool calls.
        client (OpenAI): OpenAI-compatible client used for follow-up model calls.
        model (str): Model name to use for follow-up completions.
        data (dict): Conversation payload containing persisted messages.
        response: Initial model response that may contain tool calls.
        max_iterations (int): Maximum number of tool-call rounds to process.

    Returns:
        tuple: Final model response and the products reported by the assistant.
    """
    iteration = 0
    api_messages = to_api_messages(data["messages"])
    mentioned_products = []

    while response.choices[0].finish_reason == "tool_calls" and iteration < max_iterations:
        iteration += 1
        assistant_message = response.choices[0].message
        should_continue = False

        tool_calls_dict = convert_tools_to_dict(assistant_message)
        api_messages.append({
            "role": "assistant",
            "content": assistant_message.content,
            "tool_calls": tool_calls_dict
        })

        for tool_call in assistant_message.tool_calls:
            if tool_call.function.name == "search_products":
                try:
                    args = json.loads(tool_call.function.arguments)
                    query = args.get("query", "")
                    n_results = args.get("n_results", 5)

                    products = search_products(
                        chromadb_client=chromadb_client,
                        query=query,
                        n_results=n_results
                    )

                    if products:
                        result_summary = f"Found {len(products)} products:\n\n"
                        for i, p in enumerate(products, 1):
                            result_summary += (
                                f"{i}. {p.get('name', 'Unknown')} - {p.get('store', 'Unknown')}\n"
                                f"   Price: €{p.get('price', 'N/A')} | Size: {p.get('size', 'N/A')}\n"
                            )
                            result_summary += "\n"
                        tool_result = {
                            "summary": result_summary,
                            "count": len(products),
                            "products": products
                        }
                    else:
                        tool_result = {
                            "summary": f"No products found for query: '{query}'",
                            "count": 0,
                            "products": []
                        }

                except Exception as e:
                    print(f"Error executing search: {e}")
                    tool_result = {"error": str(e), "summary": "Search failed"}

                api_messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": json.dumps(tool_result, ensure_ascii=False, indent=2)
                })
                should_continue = True

            elif tool_call.function.name == "report_mentioned_products":
                try:
                    args = json.loads(tool_call.function.arguments)
                    mentioned_products = args.get("products", [])
                except Exception as e:
                    print(f"Error parsing reported products: {e}")
                    mentioned_products = []

                # Acknowledge the tool call (required by the API)
                api_messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": json.dumps({"status": "recorded"})
                })

        if not should_continue and assistant_message.content:
            break

        try:
            response = client.chat.completions.create(
                model=model,
                messages=api_messages,
                tools=tools,
                tool_choice="auto"
            )
        except Exception as e:
            print(f"Error in follow-up API call: {e}")
            break

    return response, mentioned_products

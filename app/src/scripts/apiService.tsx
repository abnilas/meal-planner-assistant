import type {
    AgentResponse,
    AllChatsResponse,
    ChatResponse,
    StoreResponse,
} from "@/schemas";
import { API_PATHS, buildApiUrl } from "@/constants";

export const agentReply = async (
    message: string,
    sessionId?: string
): Promise<AgentResponse> => {
    const response = await fetch(buildApiUrl(API_PATHS.REQUEST_AGENT), {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            sessionId,
            message,
        }),
    });

    if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();

    return {
        message: {
            id: data.message.id,
            role: data.message.role,
            content: data.message.content ?? "",
            products: data.message?.products ?? [],
        },
        sessionId: data.sessionId,
    };
};

export const fetchStores = async (): Promise<StoreResponse> => {
    const response = await fetch(buildApiUrl(API_PATHS.STORES), {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    });

    if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();

    return data;
};

export const fetchAllChats = async (): Promise<AllChatsResponse> => {
    const response = await fetch(buildApiUrl(API_PATHS.CHATS), {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    });

    if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();

    return data;
};

export const fetchChat = async (id: string): Promise<ChatResponse> => {
    const response = await fetch(
        buildApiUrl(API_PATHS.chat(id)),
        {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        }
    );

    if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();

    return data;
};

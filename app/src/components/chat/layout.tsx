import React, { useCallback, useEffect, useState } from "react";
import cn from "@/lib/utils";
import PromptBox from "./prompt";
import ReplyBox from "./reply";
import { Circle } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";
import { agentReply, fetchChat } from "@/scripts/apiService";
import type {
    AgentResponse,
    ChatResponse,
    MessageItem,
} from "@/schemas";
import { cleanMarkdown } from "@/scripts/parser";
import { useSidebar } from "../ui/sidebar";

interface ChatProps extends React.HTMLAttributes<HTMLDivElement> {
    className?: string;
    id?: string;
    side: string;
    messages: MessageItem[];
    setMessages: React.Dispatch<React.SetStateAction<MessageItem[]>>;
    selectedMessageId: string | null;
    onSelectAssistantMessage: (messageId: string) => void;
}

export const Chat: React.FC<ChatProps> = ({
    className,
    id,
    messages,
    setMessages,
    selectedMessageId,
    onSelectAssistantMessage,
    side,
    ...props
}) => {
    const [inputValue, setInputValue] = useState("");
    const [sessionId, setSessionId] = useState<string | undefined>(id);
    const [loading, setLoading] = useState(false);
    const { open } = useSidebar();

    const parseChatMessages = useCallback((response: ChatResponse): MessageItem[] =>
        response.messages
            .filter(
                (msg) =>
                    msg.role !== "system"
            )
            .map((msg, idx): MessageItem => {
                const baseMessage = {
                    id: msg.id ?? `${response.title}-${idx}`,
                    role: msg.role,
                    content: cleanMarkdown(msg.content),
                };

                return msg.role === "assistant"
                    ? { ...baseMessage, role: "assistant", products: msg.products ?? [] }
                    : { ...baseMessage, role: "user" };
            }), []);

    const handleSendButtonClick = async () => {
        if (!inputValue.trim()) return;

        setMessages((prev) => [
            ...prev,
            { id: crypto.randomUUID(), role: "user", content: inputValue },
        ]);

        setLoading(true);
        const currentMessage = inputValue;
        setInputValue("");

        try {
            let activeSessionId = sessionId;
            if (!activeSessionId) {
                activeSessionId = crypto.randomUUID();
                setSessionId(activeSessionId);
            }

            const response: AgentResponse = await agentReply(
                currentMessage,
                activeSessionId
            );

            const assistantMessage: MessageItem = {
                id: response.message.id ?? crypto.randomUUID(),
                role: "assistant",
                content: cleanMarkdown(response.message.content),
                products: response.message.products ?? [],
            };

            setMessages((prev) => [
                ...prev,
                assistantMessage,
            ]);
            onSelectAssistantMessage(assistantMessage.id);

        } catch (err) {
            console.error("Error getting agent response:", err);
            const assistantMessage: MessageItem = {
                id: crypto.randomUUID(),
                role: "assistant",
                content: "Sorry, something went wrong.",
                products: [],
            };

            setMessages((prev) => [
                ...prev,
                assistantMessage,
            ]);
            onSelectAssistantMessage(assistantMessage.id);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setSessionId(id);
    }, [id]);

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            try {
                const response: ChatResponse = await fetchChat(id);
                const parsedResponse = parseChatMessages(response);

                setMessages(parsedResponse);
            } catch (err) {
                console.error("Error fetching chat:", err);
            }
        };
        fetchData();
    }, [id, parseChatMessages, setMessages]);

    return (
        <div
            className={cn(
                "fixed top-0 flex flex-col p-4 transition-all duration-300",
                side === "left" && "left-0 top-0 w-sm h-screen rounded-r-lg",
                side === "right" && "right-0 top-0 w-sm h-screen rounded-l-lg",
                side === "center" && [
                    "top-4 bottom-4 rounded-lg w-1/2",
                    open
                        ? "left-1/2 -translate-x-1/3"
                        : "left-1/2 -translate-x-1/2",
                ],
                className
            )}
            {...props}
        >
            <ScrollArea className="flex-3">
                <div className="flex flex-col min-h-full gap-4 wrap-break-word p-4">
                    {messages?.map((msg) => (
                        <div key={msg.id}>
                            <ReplyBox
                                id={msg.role}
                                prompt={msg.content}
                                isSelected={selectedMessageId === msg.id}
                                onClick={
                                    msg.role === "assistant"
                                        ? () => onSelectAssistantMessage(msg.id)
                                        : undefined
                                }
                            />
                        </div>
                    ))}

                    {loading && (
                        <div className="flex items-center p-4">
                            <Circle
                                color="purple"
                                fill="purple"
                                size={10}
                                className="animate-ping"
                            />
                        </div>
                    )}
                </div>
            </ScrollArea>

            <PromptBox
                inputValue={inputValue}
                loading={loading}
                setInputValue={setInputValue}
                handleSendButtonClick={handleSendButtonClick}
            />
            <p className="text-xs text-slate-400 flex items-start pt-2">
                AI Nutritionist & Meal-planner © 2026 Andreea Nilas
            </p>
        </div>
    );
};

export default Chat;

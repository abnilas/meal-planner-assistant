import * as z from "zod";

export const StoreResponseSchema = z.array(
    z.object({
        name: z.string(),
        image: z.string().optional(),
        price: z.number(),
    })
);

const MessageRoleSchema = z.enum(["user", "assistant", "system"]);

export const ProductSchema = z.object({
    name: z.string(),
    store: z.string(),
    price: z.number(),
    size: z.string().optional(),
});

const MessageSchema = z.object({
    id: z.string(),
    role: MessageRoleSchema,
    content: z.string(),
    products: z.array(ProductSchema).nullable().default(null),
});

export const AgentResponseSchema = z.object({
    message: MessageSchema,
    sessionId: z.string(),
});

export const ChatMessagesSchema = z.object({
    title: z.string(),
    messages: z.array(MessageSchema),
});

const ChatItemSchema = z.object({
    id: z.string(),
    title: z.string(),
});

export const AllChatsResponseSchema = z.array(ChatItemSchema);

export type AgentResponse = z.infer<typeof AgentResponseSchema>;
export type StoreResponse = z.infer<typeof StoreResponseSchema>;
export type AllChatsResponse = z.infer<typeof AllChatsResponseSchema>;
export type ChatResponse = z.infer<typeof ChatMessagesSchema>;
export type ChatItemSchema = z.infer<typeof ChatItemSchema>;
export type Product = z.infer<typeof ProductSchema>;
export type MessageSchema = z.infer<typeof MessageSchema>;

// Message types
export type MessageRole = z.infer<typeof MessageRoleSchema>; // "user" | "assistant" | "system"
export type ApiMessage = z.infer<typeof MessageSchema>;


export type MessageItem =
    | { id: string; role: "user"; content: string }
    | { id: string; role: "assistant"; content: string; products?: Product[] };

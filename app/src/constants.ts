import vegetableWallpaper from "@/assets/vegetable-wallpaper.webp";

const DEFAULT_API_BASE_URL = "http://localhost:8000";

export const API_BASE_URL = (
    import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL
).replace(/\/$/, "");

export const API_PATHS = {
    REQUEST_AGENT: "/request-agent",
    STORES: "/stores",
    CHATS: "/chats",
    chat: (id: string) => `/chat/${encodeURIComponent(id)}`,
} as const;

export const ROUTES = {
    HOME: "/",
    CHAT: "/chat/:id",
    chat: (id: string) => `/chat/${encodeURIComponent(id)}`,
} as const;

export const STORE_IMAGE_PATHS: Record<string, string> = {
    dirk: "/images/dirk.png",
    dekamarkt: "/images/dekamarkt.png",
};

export const APP_BACKGROUND_IMAGE = vegetableWallpaper;

export const buildApiUrl = (path: string) => `${API_BASE_URL}${path}`;

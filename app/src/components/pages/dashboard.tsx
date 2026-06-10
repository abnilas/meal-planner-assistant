import { useParams } from "react-router-dom";
import Chat from "../chat/layout";
import Sidebar from "../sidebar/layout";
import { useMemo, useState } from "react";
import type { MessageItem, Product } from "@/schemas";
import StoreOverview from "../store-list/layout";
import GroceryListOverview from "../grocery-list/layout";
import { useSidebar } from "../ui/sidebar";
import { APP_BACKGROUND_IMAGE } from "@/constants";

interface ProductOverviewsProps {
    products: Product[];
    selectedStore: string | null;
    onSelectStore: (store: string) => void;
}

const ProductOverviews = ({
    products,
    selectedStore,
    onSelectStore,
}: ProductOverviewsProps) => {
    const { open, isMobile } = useSidebar();
    const shouldOffsetForSidebar = open && !isMobile;
    const lanePosition = shouldOffsetForSidebar
        ? "left-[var(--sidebar-width)] right-96"
        : "left-0 right-96";
    const overviewLayout = shouldOffsetForSidebar
        ? "flex flex-col items-center justify-center gap-4 xl:flex-row xl:gap-8"
        : "flex items-center justify-center gap-8 xl:gap-16";
    const overviewSize = shouldOffsetForSidebar
        ? "h-60 w-56 lg:h-72 lg:w-60 xl:h-88 xl:w-64"
        : "h-88 w-72 xl:h-96 xl:w-80";

    return (
        <div
            className={`fixed inset-y-0 ${lanePosition} flex items-center justify-center px-6 transition-all duration-300`}
        >
            <div className={overviewLayout}>
                <StoreOverview
                    className={overviewSize}
                    products={products}
                    selectedStore={selectedStore}
                    onSelectStore={onSelectStore}
                />
                <GroceryListOverview
                    className={overviewSize}
                    products={products}
                    selectedStore={selectedStore}
                />
            </div>
        </div>
    );
};

const Dashboard = () => {
    const { id } = useParams<{ id: string }>();
    const [messages, setMessages] = useState<MessageItem[]>([]);
    const [selectedMessageId, setSelectedMessageId] = useState<string | null>(
        null
    );
    const [selectedStore, setSelectedStore] = useState<string | null>(null);

    const assistantMessages = useMemo(
        () => messages.filter((msg) => msg.role === "assistant"),
        [messages]
    );

    const fallbackMessageId = useMemo(() => {
        const firstAssistantWithProducts = assistantMessages.find(
            (msg) => (msg.products?.length ?? 0) > 0
        );

        return firstAssistantWithProducts?.id ?? assistantMessages[0]?.id ?? null;
    }, [assistantMessages]);

    const effectiveMessageId = assistantMessages.some(
        (msg) => msg.id === selectedMessageId
    )
        ? selectedMessageId
        : fallbackMessageId;

    const selectedAssistantMessage = assistantMessages.find(
        (msg) => msg.id === effectiveMessageId
    );

    const normalizeStore = (store: string) =>
        store.toLowerCase().trim() === "albert heijn"
            ? "ah"
            : store.toLowerCase().trim();

    const selectedProducts = selectedAssistantMessage?.products ?? [];
    const effectiveSelectedStore = selectedProducts.some(
        (product) =>
            selectedStore && normalizeStore(product.store) === normalizeStore(selectedStore)
    )
        ? selectedStore
        : null;
    const hasAssistantMessage = assistantMessages.length > 0;
    const side = hasAssistantMessage ? "right" : "center";

    return (
        <div className="relative min-h-screen">
            <div
                className="background"
                style={{ backgroundImage: `url(${APP_BACKGROUND_IMAGE})` }}
            />

            <Sidebar>
                <Chat
                    id={id}
                    side={side}
                    messages={messages}
                    setMessages={setMessages}
                    selectedMessageId={effectiveMessageId}
                    onSelectAssistantMessage={(messageId) => {
                        setSelectedMessageId(messageId);
                        setSelectedStore(null);
                    }}
                />
                
                {hasAssistantMessage && (
                    <ProductOverviews
                        products={selectedProducts}
                        selectedStore={effectiveSelectedStore}
                        onSelectStore={setSelectedStore}
                    />
                )}
            </Sidebar>
        </div>
    );
};

export default Dashboard;

import DisplayArea from "../ui/display-area";
import cn from "../../lib/utils";
import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { StoreResponse, Product } from "@/schemas";
import { fetchStores } from "@/scripts/apiService";
import { useLocation } from "react-router-dom";
import { getStoreItems } from "@/scripts/utils";
import { STORE_IMAGE_PATHS } from "@/constants";

interface StoreOverviewProps {
    className?: string;
    products: Product[];
    selectedStore: string | null;
    onSelectStore?: (store: string) => void;
}

export const StoreOverview: React.FC<StoreOverviewProps> = ({
    className,
    products,
    selectedStore,
    onSelectStore,
    ...props
}) => {
    const [items, setItems] = useState<StoreResponse>([]);
    const location = useLocation();
    const stores = useMemo(() => getStoreItems(products), [products]);

    const mapStoreImages = useCallback((items: StoreResponse): StoreResponse => {
        const storeMap = new Map(
            stores.map((s) => [
                s.store.toLowerCase().trim() === "albert heijn"
                    ? "ah"
                    : s.store.toLowerCase().trim(),
                s.totalPrice,
            ])
        );

        return items
            .filter((item) => storeMap.has(item.name.toLowerCase().trim()))
            .map((item) => ({
                ...item,
                image: STORE_IMAGE_PATHS[item.name.toLowerCase().trim()] || item.image,
                price: storeMap.get(item.name.toLowerCase().trim()) ?? 0,
            }));
    }, [stores]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response: StoreResponse = await fetchStores();
                const updatedResponse = mapStoreImages(response);
                setItems(updatedResponse);
            } catch (err) {
                console.error("Error getting store data:", err);
            }
        };
        fetchData();
    }, [location.pathname, mapStoreImages]);

    return (
        <DisplayArea
            className={cn("", className)}
            {...props}
            title="Store Overview"
            id="store"
            tags={items}
            enableButton={true}
            emptyMessage="This assistant message does not include store product data."
            selectedStore={selectedStore}
            onSelectStore={onSelectStore}
        />
    );
};

export default StoreOverview;

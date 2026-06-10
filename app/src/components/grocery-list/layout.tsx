import DisplayArea from "../ui/display-area";
import cn from "../../lib/utils";
import type React from "react";
import type { Product } from "@/schemas";

interface GroceryListOverviewProps {
    className?: string;
    products: Product[];
    selectedStore: string | null;
}

export const GroceryListOverview: React.FC<GroceryListOverviewProps> = ({
    className,
    products,
    selectedStore,
    ...props
}) => {
    const parseStore = (store: string) => {
        const map: Record<string, string> = {
            "albert heijn": "ah",
        };

        return map[store.toLowerCase().trim()] ?? store.toLowerCase().trim();
    };

    return (
        <DisplayArea
            className={cn("", className)}
            {...props}
            title="Grocery List Overview"
            id="grocery"
            emptyMessage="This assistant message does not include grocery product data."
            tags={
                selectedStore
                    ? products.filter(
                          (item) =>
                              parseStore(item.store) ===
                              parseStore(selectedStore)
                      )
                    : products
            }
            enableButton={false}
        />
    );
};

export default GroceryListOverview;

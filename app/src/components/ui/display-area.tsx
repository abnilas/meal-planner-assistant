import * as React from "react";
import { ScrollArea } from "./scroll-area";
import cn from "../../lib/utils";
import { Button } from "./button";
import type { ScrollAreaProps } from "@radix-ui/react-scroll-area";
import type { StoreResponse } from "@/schemas";
import { Separator } from "./separator";
import { UtensilsCrossed } from "lucide-react";
import type { Product } from "@/schemas";

type DisplayItem = (StoreResponse[number] | Product) & {
    image?: string;
};

export interface DisplayAreaProps extends ScrollAreaProps {
    className?: string;
    title?: string;
    id: string;
    tags: DisplayItem[];
    enableButton?: boolean;
    selectedStore?: string | null;
    onSelectStore?: (store: string) => void;
    emptyMessage?: string;
}

export const DisplayArea: React.FC<DisplayAreaProps> = ({
    className,
    title,
    id,
    tags,
    enableButton,
    selectedStore,
    onSelectStore,
    emptyMessage = "No product data is available for this message.",
    ...props
}) => {
    const hasTags = tags.length > 0;

    return (
        <div className="flex flex-col text-xs font-semibold text-purple-900 bg-purple-50 items-start border rounded-md p-4">
            <h4 className="mb-2 font-bold uppercase text-xs text-purple-900 flex items-start">
                {title}
            </h4>
            <ScrollArea
                className={cn(
                    "bg-purple-50 text-slate-800",
                    className
                )}
                {...props}
            >
                <div className="p-4">
                    {hasTags ? (
                        tags.map((tag, idx) => (
                            <div key={`${tag.name}-${idx}`} className="flex flex-col">
                                <Button
                                    variant="ghost"
                                    size="lg"
                                    className={`w-full text-sm text-slate-800 capitalize font-normal text-left whitespace-pre-line break-words rounded-none justify-start items-center px-2 h-16
                                ${
                                    enableButton
                                        ? "hover:bg-purple-100 cursor-pointer"
                                        : "cursor-default hover:bg-transparent"
                                }
                                ${
                                    selectedStore === tag.name
                                        ? "bg-purple-200 rounded-none"
                                        : ""
                                }
                            `}
                                    onClick={() => {
                                        if (id === "store") {
                                            onSelectStore?.(tag.name);
                                        }
                                    }}
                                >
                                    {tag.image ? (
                                        <img
                                            src={tag.image}
                                            width={36}
                                            height={36}
                                            alt=""
                                        />
                                    ) : (
                                        <UtensilsCrossed width={36} height={36} />
                                    )}

                                    <span className="ml-2">{tag.name}</span>

                                    <span className="ml-auto flex items-end">
                                        {Number(tag.price).toFixed(2)}
                                    </span>
                                </Button>

                                {idx !== tags.length - 1 && <Separator />}
                            </div>
                        ))
                    ) : (
                        <p className="text-sm font-normal normal-case leading-5 text-slate-500">
                            {emptyMessage}
                        </p>
                    )}
                </div>
            </ScrollArea>
            {hasTags && (
                <div className="p-4 bg-purple-100 text-sm rounded-sm">
                    Cheapest price: {Math.min(...tags.map((tag) => tag.price))}
                </div>
            )}
        </div>
    );
};

export default DisplayArea;

import React, { useRef } from "react";
import cn from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SendHorizontal } from "lucide-react";

interface PromptBoxProps extends React.HTMLAttributes<HTMLDivElement> {
    className?: string;
    inputValue: string;
    loading: boolean;
    setInputValue: (value: string) => void;
    handleSendButtonClick: () => void;
}

export const PromptBox: React.FC<PromptBoxProps> = ({
    className,
    inputValue,
    loading,
    setInputValue,
    handleSendButtonClick,
    ...props
}) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleContainerClick = () => {
        textareaRef.current?.focus();
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key !== "Enter" || event.shiftKey) return;

        event.preventDefault();
        if (!loading) {
            handleSendButtonClick();
        }
    };

    let placeholderContent = null;

    if (!inputValue) {
        placeholderContent = (
            <p className="pointer-events-none absolute p-2 text-slate-400 font-normal text-base">
                Type your message...
            </p>
        );
    }

    return (
        <div className="flex flex-1 h-full">
            <div
                className={cn(
                    "relative cursor-text p-6",
                    "w-full max-h-40 rounded-2xl border bg-card shadow-md",
                    "text-slate-400 font-normal text-base",
                    className
                )}
                onClick={handleContainerClick}
                {...props}
            >
                <div className="relative w-full">
                    {placeholderContent}
                    <textarea
                        ref={textareaRef}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        rows={1}
                        className="w-full h-16 bg-transparent resize-none overflow-y-auto text-slate-800 focus:outline-none custom-scrollbar p-2"
                    />
                </div>

                <Button
                    size="icon"
                    className="absolute bottom-4 right-4 bg-purple-700 hover:bg-purple-900 text-white"
                    onClick={handleSendButtonClick}
                    disabled={loading}
                >
                    <SendHorizontal className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
};

export default PromptBox;

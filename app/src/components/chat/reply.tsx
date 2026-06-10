import cn from "@/lib/utils";
import { User } from "lucide-react";
import { Bot } from "lucide-react";
import { parseMarkdown } from "@/scripts/parser";

interface ReplyBoxProps extends React.HTMLAttributes<HTMLDivElement> {
    prompt: string;
    id: "user" | "assistant";
    className?: string;
    isSelected?: boolean;
}

export const ReplyBox: React.FC<ReplyBoxProps> = ({
    prompt,
    id,
    className,
    isSelected,
    onClick,
    ...props
}) => {
    const isUser = id === "user";
    const isClickable = id === "assistant" && Boolean(onClick);
    let avatarContent = null;

    if (isUser) {
        avatarContent = <User size={24} color="#7e22ce" />;
    } else {
        avatarContent = <Bot size={24} color="#7e22ce" />;
    }

    return (
        <div
            className={cn(
                `flex items-end`,
                isUser ? "flex-row-reverse" : "flex-row",
                isClickable && "cursor-pointer",
                className
            )}
            onClick={onClick}
            {...props}
        >
            <div className="shrink-0 self-start p-2">{avatarContent}</div>

            <div
                className={cn(
                    "p-4 rounded-2xl shadow-md max-w-sm wrap-break-words font-normal text-base text-left bg-card",
                    isClickable && !isSelected && "hover:bg-purple-50",
                    isSelected && "bg-purple-100",
                    className
                )}
            >
                {prompt ? parseMarkdown(prompt) : <span className="text-slate-400">Type…</span>}
            </div>
        </div>
    );
};

export default ReplyBox;

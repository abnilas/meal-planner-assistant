import * as React from "react";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";

import cn from "../../lib/utils";

const ScrollArea = React.forwardRef<
    React.ElementRef<typeof ScrollAreaPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>
>(({ className, children, ...props }, ref) => (
    <ScrollAreaPrimitive.Root
        ref={ref}
        className={cn("relative overflow-hidden", className)}
        {...props}
    >
        <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
            {children}
        </ScrollAreaPrimitive.Viewport>
        <ScrollBar />
        <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
));

const ScrollBar = React.forwardRef<
    React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
    React.ComponentPropsWithoutRef<
        typeof ScrollAreaPrimitive.ScrollAreaScrollbar
    >
>(({ className, orientation = "vertical", ...props }, ref) => (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
        ref={ref}
        orientation={orientation}
        className={cn(
            "flex touch-none select-none",
            orientation === "vertical" && "h-full w-1.5",
            orientation === "horizontal" && "h-1.5 flex-col",
            className
        )}
        {...props}
    >
        <ScrollAreaPrimitive.ScrollAreaThumb className="flex-1 rounded-full bg-violet-600 hover:bg-violet-700" />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
));

ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName;

export { ScrollArea, ScrollBar };

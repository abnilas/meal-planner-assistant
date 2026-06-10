import { useEffect, useState } from "react";
import { Carrot, PanelLeft, type LucideIcon } from "lucide-react";
import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
    useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import type { AllChatsResponse } from "@/schemas";
import { fetchAllChats } from "@/scripts/apiService";
import { ROUTES } from "@/constants";


type Item = {
    title: string;
    url: string;
    icon: LucideIcon;
};

export function AppSidebar() {
    const [items, setItems] = useState<Item[]>([
        { title: "", url: "", icon: Carrot },
    ]);

    const { open, setOpen } = useSidebar();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response: AllChatsResponse = await fetchAllChats();

                const mappedResponse = response.map((chat) => ({
                    title: `${chat.title}`,
                    url: ROUTES.chat(chat.id),
                    icon: Carrot,
                }));

                setItems(mappedResponse);
            } catch (err) {
                console.error("Error getting store data:", err);
            }
        };
        fetchData();
    }, []);

    return (
        <SidebarProvider>
            <Button
                onClick={() => setOpen(!open)}
                className="fixed top-4 left-4 z-50 rounded shadow-none bg-purple-200 text-purple-900 hover:bg-purple-900 hover:text-white w-2 h-8"
            >
                <PanelLeft size={22} strokeWidth={3} />
            </Button>

            <Sidebar
                collapsible="offcanvas"
                className={`
                    top-0 left-0 h-screen z-40 w-74 overflow-hidden
                    transform transition-transform duration-300 ease-in-out
                    ${open ? "translate-x-0" : "-translate-x-full"}
                `}
            >
                <SidebarHeader className="flex justify-end items-end bg-purple-50 p-4">
                    {open && (
                        <Button
                            onClick={() => {
                                window.location.href = ROUTES.HOME; // navigate and refresh
                            }}
                            className="rounded shadow-none bg-purple-200 text-purple-900 hover:bg-purple-900 hover:text-white w-24 h-8 flex items-center justify-center"
                        >
                            <span className=""> + New chat</span>
                        </Button>
                    )}
                </SidebarHeader>

                <SidebarContent className="bg-purple-50 h-screen">
                    <ScrollArea className="h-screen w-full">
                        <SidebarGroup>
                            <SidebarGroupLabel className="text-purple-900 uppercase text-xs">
                                Your chats
                            </SidebarGroupLabel>

                            <SidebarGroupContent>
                                <SidebarMenu>
                                    {items.map((item) => (
                                        <SidebarMenuItem
                                            key={item.title}
                                            className="text-slate-800"
                                        >
                                            <SidebarMenuButton asChild>
                                                <a
                                                    href={item.url}
                                                    className="flex items-center gap-2 rounded"
                                                >
                                                    <item.icon className="w-5 h-5" />
                                                    <span>{item.title}</span>
                                                </a>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    ))}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    </ScrollArea>
                </SidebarContent>
            </Sidebar>
        </SidebarProvider>
    );
}

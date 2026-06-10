import {
    SidebarProvider,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/app-sidebar";


export default function Sidebar({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SidebarProvider>
            <AppSidebar/>
            <main>
                {children}
            </main>
        </SidebarProvider>
    );
}

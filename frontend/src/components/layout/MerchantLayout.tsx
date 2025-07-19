import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Store, KeyRound, LogOut } from 'lucide-react';

// Main navigation for the merchant panel
const mainNavItems = [
    { title: "Store Information", href: "/merchant/store-information", icon: Store },
];

// Settings/account related navigation
const settingsNavItems = [
    { title: "Credentials", href: "/merchant/credentials", icon: KeyRound },
];

export function MerchantLayout() {
    const { logout, user } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    // Helper to render nav links to avoid repetition
    const renderNavLink = (item: { title: string, href: string, icon: React.ElementType }) => (
        <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) => cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                isActive && "bg-muted text-primary font-semibold"
            )}
        >
            <item.icon className="h-4 w-4" />
            {item.title}
        </NavLink>
    );

    return (
        <div className="flex min-h-screen w-full">
            <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r bg-background sm:flex">
                <nav className="flex flex-col items-start gap-2 p-4">
                    <div className="px-2 pb-2 flex items-center">
                        <img src="/binhinav-logo.svg" alt="Binhinav Logo" className="w-10 h-10 mr-2" />
                        <div>
                            <h1 className="text-xl font-bold tracking-tight">binhinav</h1>
                            <p className="text-sm text-muted-foreground">{user?.username || 'Merchant Panel'}</p>
                        </div>
                    </div>
                    {mainNavItems.map(renderNavLink)}
                </nav>
                <div className="mt-auto p-4">
                    <nav className="flex flex-col items-start gap-2">
                        {settingsNavItems.map(renderNavLink)}
                        <Button variant="ghost" className="w-full justify-start gap-3" onClick={handleLogout}>
                            <LogOut className="h-4 w-4" />
                            Logout
                        </Button>
                    </nav>
                </div>
            </aside>
            <main className="flex flex-1 flex-col sm:pl-64">
                <div className="flex-1 p-4 sm:p-8 w-full max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}

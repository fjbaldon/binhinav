import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { History, TvMinimal, KeyRound, Building, Users, LayoutDashboard, Shapes, LogOut, Clapperboard } from 'lucide-react';

const sidebarNavItems = [
    { title: "Recent Changes", href: "/admin/recent-changes", icon: History },
    { title: "Places", href: "/admin/places", icon: Building },
    { title: "Merchants", href: "/admin/merchants", icon: Users },
    { title: "Categories", href: "/admin/categories", icon: Shapes },
    { title: "Floor Plans", href: "/admin/floor-plans", icon: LayoutDashboard },
    { title: "Kiosks", href: "/admin/kiosks", icon: TvMinimal },
    { title: "Ads", href: "/admin/ads", icon: Clapperboard },
    { title: "Credentials", href: "/admin/credentials", icon: KeyRound },
];

export function AdminLayout() {
    const { logout, user } = useAuth(); // Get the user object from the auth hook
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <div className="flex min-h-screen w-full">
            <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r bg-background sm:flex">
                <nav className="flex flex-col items-start gap-2 px-4 py-4">
                    <div className="px-2 pb-4 flex items-center">
                        <img src="/binhinav-logo.svg" alt="Binhinav Logo" className="w-10 h-10 mr-2" />
                        <div>
                            <h1 className="text-xl font-bold tracking-tight">binhinav</h1>
                            <p className="text-sm text-muted-foreground">{user?.username || 'Admin Panel'}</p>
                        </div>
                    </div>
                    {sidebarNavItems.map((item) => (
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
                    ))}
                </nav>
                <div className="mt-auto p-4">
                    <Button variant="ghost" className="w-full justify-start gap-3" onClick={handleLogout}>
                        <LogOut className="h-4 w-4" />
                        Logout
                    </Button>
                </div>
            </aside>
            <main className="flex flex-1 flex-col sm:pl-64">
                <div className="flex-1 p-4 sm:p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}

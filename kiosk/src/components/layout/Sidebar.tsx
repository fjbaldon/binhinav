import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, X, Shapes } from 'lucide-react';
import type { Category } from "@/api/types";
import { DynamicIcon } from "../shared/DynamicIcon";

interface SidebarProps {
    categories: Category[];
    activeCategoryId: string | null;
    onCategoryChange: (id: string | null) => void;
    searchTerm: string;
    onSearchChange: (term: string) => void;
    onClearFilters: () => void;
}

export function Sidebar({
    categories,
    activeCategoryId,
    onCategoryChange,
    searchTerm,
    onSearchChange,
    onClearFilters,
}: SidebarProps) {
    const hasActiveFilters = searchTerm || activeCategoryId;

    return (
        <aside className="absolute top-6 left-6 bottom-6 w-80 bg-background/80 backdrop-blur-sm rounded-2xl shadow-lg flex flex-col gap-4 z-10 p-4">

            {/* Header section */}
            <div className="flex items-center gap-2 px-2">
                <img src="/binhinav-logo.svg" alt="Binhinav Logo" className="h-8 w-8" />
                <h1 className="text-2xl font-bold text-primary">binhinav</h1>
            </div>

            {/* Search bar section */}
            <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    type="text"
                    placeholder="Search..."
                    className="w-full pl-10 h-12 text-md rounded-lg"
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
                {searchTerm && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full"
                        onClick={() => onSearchChange('')}
                    >
                        <X className="h-5 w-5" />
                    </Button>
                )}
            </div>

            {/* IMPROVEMENT: New contextual header for the categories list */}
            <div className="flex items-center justify-between px-2 h-8">
                <h2 className="text-lg font-semibold tracking-tight">
                    Categories
                </h2>
                {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={onClearFilters} className="text-muted-foreground h-auto p-1">
                        Clear
                        <X className="ml-1 h-4 w-4" />
                    </Button>
                )}
            </div>

            <ScrollArea className="flex-1 min-h-0">
                <div className="space-y-2 pr-3">
                    <Button
                        variant={activeCategoryId === null ? 'default' : 'ghost'}
                        onClick={() => onCategoryChange(null)}
                        className="w-full h-auto justify-start text-lg py-3 whitespace-normal"
                    >
                        <Shapes className="mr-4 h-6 w-6 shrink-0" />
                        <span className="text-left">All Categories</span>
                    </Button>
                    {categories.map(category => (
                        <Button
                            key={category.id}
                            variant={activeCategoryId === category.id ? 'default' : 'ghost'}
                            onClick={() => onCategoryChange(category.id)}
                            className="w-full h-auto justify-start text-lg py-3 whitespace-normal"
                        >
                            <DynamicIcon name={category.iconKey} className="mr-4 h-6 w-6 shrink-0" />
                            <span className="text-left">{category.name}</span>
                        </Button>
                    ))}
                </div>
            </ScrollArea>

            {/* IMPROVEMENT: The old clear button at the bottom has been removed */}
        </aside>
    );
}

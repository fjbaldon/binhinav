import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, X, Shapes, Loader2, Frown, Building2 } from 'lucide-react';
import type { Category, Place } from "@/api/types";
import { DynamicIcon } from "../shared/DynamicIcon";
import { getAssetUrl } from "@/api";

type SearchStatus = 'idle' | 'loading' | 'no-results' | 'has-results';

interface SidebarProps {
    categories: Category[];
    activeCategoryIds: string[];
    onCategoryToggle: (id: string | null) => void;
    searchTerm: string;
    onSearchChange: (term: string) => void;
    searchStatus: SearchStatus;
    searchResults: Place[];
    onSearchResultClick: (place: Place) => void;
}

export function Sidebar({
    categories,
    activeCategoryIds,
    onCategoryToggle,
    searchTerm,
    onSearchChange,
    searchStatus,
    searchResults,
    onSearchResultClick,
}: SidebarProps) {
    const hasActiveCategoryFilters = activeCategoryIds.length > 0;
    const isSearchActive = !!searchTerm;

    return (
        <aside className="relative w-80 flex-col gap-4 bg-card border p-4 rounded-3xl hidden lg:flex">

            <div className="flex items-center gap-2 px-2">
                <img src="/binhinav-logo.svg" alt="Binhinav Logo" className="h-8 w-8" />
                <h1 className="text-2xl font-bold text-primary">binhinav</h1>
            </div>

            <div className="relative w-full">
                {searchStatus === 'loading' ? (
                    <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground animate-spin" />
                ) : (
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                )}
                <Input
                    type="text"
                    placeholder="Search for a store..."
                    className="w-full pl-10 h-12 text-md rounded-lg"
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
                {searchTerm && (
                    <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full" onClick={() => onSearchChange('')}>
                        <X className="h-5 w-5" />
                    </Button>
                )}
            </div>

            <div className="flex items-center justify-between px-2 h-8">
                <h2 className="text-lg font-semibold tracking-tight">
                    {isSearchActive ? 'Search Results' : 'Categories'}
                </h2>
                {hasActiveCategoryFilters && (
                    <Button variant="ghost" size="sm" onClick={() => onCategoryToggle(null)} className="text-muted-foreground h-auto p-1">Clear<X className="ml-1 h-4 w-4" /></Button>
                )}
            </div>

            <div className="flex-1 min-h-0">
                {isSearchActive ? (
                    <>
                        {searchStatus === 'no-results' && (
                            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4">
                                <Frown className="h-12 w-12 mb-4" />
                                <p className="font-semibold">No Results Found</p>
                                <p className="text-sm">Please try a different search term.</p>
                            </div>
                        )}
                        {searchStatus === 'has-results' && (
                            <ScrollArea className="h-full">
                                <div className="space-y-1 pr-3">
                                    {searchResults.map(place => (
                                        <Button
                                            key={place.id}
                                            variant="ghost"
                                            onClick={() => onSearchResultClick(place)}
                                            className="w-full h-auto justify-start py-2 px-3 text-left"
                                        >
                                            {place.logoUrl ? (
                                                <img src={getAssetUrl(place.logoUrl)} className="mr-3 h-10 w-10 rounded-md object-cover shrink-0" alt={place.name} />
                                            ) : (
                                                <div className="mr-3 h-10 w-10 rounded-md bg-muted flex items-center justify-center shrink-0">
                                                    <Building2 className="h-5 w-5 text-muted-foreground" />
                                                </div>
                                            )}
                                            <div className="flex-1">
                                                <p className="font-semibold text-base leading-tight">{place.name}</p>
                                                <p className="text-sm text-muted-foreground">{place.floorPlan.name}</p>
                                            </div>
                                        </Button>
                                    ))}
                                </div>
                            </ScrollArea>
                        )}
                    </>
                ) : (
                    <ScrollArea className="h-full">
                        <div className="space-y-2 pr-3">
                            <Button
                                variant={activeCategoryIds.length === 0 ? 'default' : 'ghost'}
                                onClick={() => onCategoryToggle(null)}
                                className="w-full h-auto justify-start text-lg py-3 whitespace-normal"
                            >
                                <Shapes className="mr-4 h-6 w-6 shrink-0" />
                                <span
                                    className={`inline-block text-left transition-transform duration-200 ease-out ${activeCategoryIds.length === 0 ? 'scale-105' : 'scale-100'
                                        }`}
                                >
                                    All Categories
                                </span>
                            </Button>
                            {categories.map(category => (
                                <Button
                                    key={category.id}
                                    variant={activeCategoryIds.includes(category.id) ? 'default' : 'ghost'}
                                    onClick={() => onCategoryToggle(category.id)}
                                    className="w-full h-auto justify-start text-lg py-3 whitespace-normal"
                                >
                                    <DynamicIcon name={category.iconKey} className="mr-4 h-6 w-6 shrink-0" />
                                    <span
                                        className={`inline-block text-left transition-transform duration-200 ease-out ${activeCategoryIds.includes(category.id) ? 'scale-105' : 'scale-100'
                                            }`}
                                    >
                                        {category.name}
                                    </span>
                                </Button>
                            ))}
                        </div>
                    </ScrollArea>
                )}
            </div>
        </aside>
    );
}

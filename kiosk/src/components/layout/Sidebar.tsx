import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, X, Shapes, Loader2, Frown, Building2, RotateCcw } from 'lucide-react';
import type { Category, Place } from "@/api/types";
import { DynamicIcon } from "../shared/DynamicIcon";
import { getAssetUrl } from "@/api";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";

type SearchStatus = 'idle' | 'loading' | 'no-results' | 'has-results';

interface SidebarProps {
    categories: Category[];
    activeCategoryIds: string[];
    onCategoryToggle: (id: string | null) => void;
    onCategorySelectFromSearch: (id: string) => void;
    searchTerm: string;
    onSearchChange: (term: string) => void;
    searchStatus: SearchStatus;
    searchResults: Place[];
    onSearchResultClick: (place: Place) => void;
    isFilterActive: boolean;
    onResetSearch: () => void;
}

const viewVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, transition: { duration: 0.15 } }
};


export function Sidebar({
    categories,
    activeCategoryIds,
    onCategoryToggle,
    onCategorySelectFromSearch,
    searchTerm,
    onSearchChange,
    searchStatus,
    searchResults,
    onSearchResultClick,
    isFilterActive,
    onResetSearch,
}: SidebarProps) {
    const hasActiveCategoryFilters = activeCategoryIds.length > 0;
    const isSearchActive = !!searchTerm;

    const filteredCategories = isSearchActive
        ? categories.filter(category =>
            category.name.toLowerCase().includes(searchTerm.toLowerCase())
        ) : [];

    const hasPlaceResults = searchStatus === 'has-results';
    const hasCategoryResults = filteredCategories.length > 0;
    const noResultsFound = isSearchActive && searchStatus === 'no-results' && !hasCategoryResults;

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
                    placeholder="Search for stores or categories..."
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

            <AnimatePresence>
                {isFilterActive && (
                    <motion.div
                        className="px-1"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Button
                            variant="default"
                            className="w-full h-12 text-md bg-[#1c6d2b] hover:bg-[#1a5a24] text-primary-foreground font-medium"
                            onClick={onResetSearch}
                        >
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Start New Search
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>


            <div className="flex items-center justify-between px-2 h-8">
                <h2 className="text-lg font-semibold tracking-tight">
                    {isSearchActive ? 'Search Results' : 'Categories'}
                </h2>
                {hasActiveCategoryFilters && !isSearchActive && (
                    <Button variant="ghost" size="sm" onClick={() => onCategoryToggle(null)} className="text-muted-foreground h-auto p-1">Clear<X className="ml-1 h-4 w-4" /></Button>
                )}
            </div>

            <div className="flex-1 min-h-0">
                <ScrollArea className="h-full">
                    <AnimatePresence mode="wait">
                        {isSearchActive ? (
                            <motion.div
                                key="search-results"
                                variants={viewVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                            >
                                {noResultsFound ? (
                                    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4">
                                        <Frown className="h-12 w-12 mb-4" />
                                        <p className="font-semibold">No Results Found</p>
                                        <p className="text-sm">Please try a different search term.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4 pr-3">
                                        {hasCategoryResults && (
                                            <div>
                                                <h3 className="text-sm font-semibold text-muted-foreground px-3 mb-1">Categories</h3>
                                                <div className="space-y-2 pl-2">
                                                    {filteredCategories.map(category => (
                                                        <Button
                                                            key={category.id}
                                                            variant="ghost"
                                                            onClick={() => onCategorySelectFromSearch(category.id)}
                                                            className="w-full h-auto justify-start text-lg py-3 whitespace-normal"
                                                        >
                                                            <DynamicIcon name={category.iconKey} className="mr-4 h-6 w-6 shrink-0 text-primary" />
                                                            <div className="flex-1 text-left">
                                                                <span className="font-semibold">{category.name}</span>
                                                            </div>
                                                        </Button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {hasPlaceResults && (
                                            <div>
                                                <h3 className="text-sm font-semibold text-muted-foreground px-3 mb-1">Places</h3>
                                                <div className="space-y-2 pl-2">
                                                    {searchResults.map(place => (
                                                        <Button
                                                            key={place.id}
                                                            variant="ghost"
                                                            onClick={() => onSearchResultClick(place)}
                                                            className="w-full h-auto justify-start text-lg py-3 whitespace-normal"
                                                        >
                                                            {place.logoUrl ? (
                                                                <img src={getAssetUrl(place.logoUrl)} className="mr-4 h-6 w-6 rounded-md object-cover shrink-0" alt={place.name} />
                                                            ) : (
                                                                <div className="mr-4 h-6 w-6 rounded-md bg-muted flex items-center justify-center shrink-0">
                                                                    <Building2 className="h-4 w-4 text-muted-foreground" />
                                                                </div>
                                                            )}
                                                            <div className="flex-1 flex items-center justify-between text-left">
                                                                <span className="font-semibold">{place.name}</span>
                                                                <Badge variant="outline" className="text-xs">{place.floorPlan.name}</Badge>
                                                            </div>
                                                        </Button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </motion.div>
                        ) : (
                            <motion.div
                                key="categories-list"
                                variants={viewVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                className="space-y-2 pr-3 pl-2 pt-2"
                            >
                                <Button
                                    variant={activeCategoryIds.length === 0 ? 'default' : 'ghost'}
                                    onClick={() => onCategoryToggle(null)}
                                    className="w-full h-auto justify-start text-lg py-3 whitespace-normal"
                                >
                                    <Shapes className="mr-4 h-6 w-6 shrink-0" />
                                    <div className="flex-1 text-left">
                                        <span className={`inline-block transition-transform duration-200 ease-out ${activeCategoryIds.length === 0 ? 'scale-105' : 'scale-100'}`}>
                                            All Categories
                                        </span>
                                    </div>
                                </Button>
                                {categories.map(category => (
                                    <Button
                                        key={category.id}
                                        variant={activeCategoryIds.includes(category.id) ? 'default' : 'ghost'}
                                        onClick={() => onCategoryToggle(category.id)}
                                        className="w-full h-auto justify-start text-lg py-3 whitespace-normal"
                                    >
                                        <DynamicIcon name={category.iconKey} className="mr-4 h-6 w-6 shrink-0" />
                                        <div className="flex-1 text-left">
                                            <span className={`inline-block transition-transform duration-200 ease-out ${activeCategoryIds.includes(category.id) ? 'scale-105' : 'scale-100'}`}>
                                                {category.name}
                                            </span>
                                        </div>
                                    </Button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </ScrollArea>
            </div>
        </aside>
    );
}

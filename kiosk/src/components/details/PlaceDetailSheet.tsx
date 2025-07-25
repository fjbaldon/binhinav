import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getAssetUrl } from "@/api";
import type { Place } from "@/api/types";
import { DynamicIcon } from "../shared/DynamicIcon";
import { Map, Clock, Building, Info, ImageOff, X } from "lucide-react";

interface PlaceDetailSheetProps {
    place: Place | null;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onPlaceSelect: (place: Place) => void;
}

export function PlaceDetailSheet({
    place,
    isOpen,
    onOpenChange,
    onPlaceSelect,
}: PlaceDetailSheetProps) {
    if (!isOpen || !place) return null;

    const handleSelectOnMapClick = () => {
        onPlaceSelect(place);
        onOpenChange(false);
    };

    return (
        <aside className="absolute top-6 right-6 w-full max-w-96 bg-background/80 backdrop-blur-sm rounded-2xl shadow-lg flex flex-col gap-0 z-10 p-0 animate-in slide-in-from-right-2 max-h-[calc(100vh-3rem)]">
            <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 h-8 w-8 rounded-full z-20"
                onClick={() => onOpenChange(false)}
            >
                <X className="h-5 w-5" />
                <span className="sr-only">Close</span>
            </Button>

            {/* --- Non-Scrolling Header --- */}
            <div>
                <div className="relative">
                    {place.coverUrl ? (
                        <img
                            src={getAssetUrl(place.coverUrl)}
                            alt={`${place.name} cover`}
                            className="w-full h-48 object-cover rounded-t-2xl"
                        />
                    ) : (
                        <div className="w-full h-48 bg-muted flex items-center justify-center rounded-t-2xl">
                            <ImageOff className="h-16 w-16 text-muted-foreground/50" />
                        </div>
                    )}
                    <div className="absolute -bottom-12 left-6 h-24 w-24 rounded-full bg-background border-4 border-background p-1 shadow-md">
                        {place.logoUrl ? (
                            <img
                                src={getAssetUrl(place.logoUrl)}
                                alt={`${place.name} logo`}
                                className="w-full h-full object-cover rounded-full"
                            />
                        ) : (
                            <div className="w-full h-full rounded-full bg-muted flex items-center justify-center">
                                <Building className="h-10 w-10 text-muted-foreground/50" />
                            </div>
                        )}
                    </div>
                </div>
                <div className="p-6 pt-16 pb-4 space-y-2 text-left">
                    <h2 className="text-3xl font-bold break-words">{place.name}</h2>
                    {place.category && (
                        <div>
                            <Badge variant="secondary" className="text-md py-1 px-3">
                                <DynamicIcon name={place.category.iconKey} className="mr-2 h-4 w-4" />
                                {place.category.name}
                            </Badge>
                        </div>
                    )}
                </div>
            </div>

            {/* --- Scrolling Content Area (About & Hours) --- */}
            <div className="flex-1 min-h-0">
                <ScrollArea className="h-full">
                    <div className="px-6 pb-6 pt-2 space-y-4">
                        <div className="flex items-start gap-4">
                            <Info className="h-5 w-5 mt-1 text-muted-foreground shrink-0" />
                            <div>
                                <h3 className="font-semibold">About</h3>
                                <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap break-words">
                                    {place.description || 'No description provided.'}
                                </p>
                            </div>
                        </div>

                        <div className="h-px bg-border" />

                        <div className="flex items-start gap-4">
                            <Clock className="h-5 w-5 mt-1 text-muted-foreground shrink-0" />
                            <div>
                                <h3 className="font-semibold">Business Hours</h3>
                                <p className="text-muted-foreground text-sm">
                                    {place.businessHours || 'Not available'}
                                </p>
                            </div>
                        </div>
                    </div>
                </ScrollArea>
            </div>

            {/* --- Non-Scrolling Footer (Location & Button) --- */}
            <div className="p-4 border-t bg-transparent mt-auto">
                <Button className="w-full h-14 text-lg justify-between px-6" onClick={handleSelectOnMapClick}>
                    <div className="flex items-center gap-3">
                        <Building className="h-5 w-5" />
                        <span className="font-semibold">{place.floorPlan.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Map className="h-5 w-5" />
                        <span className="font-semibold">Show on Map</span>
                    </div>
                </Button>
            </div>
        </aside>
    );
}

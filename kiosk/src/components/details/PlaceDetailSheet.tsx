import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getAssetUrl } from "@/api";
import type { Place } from "@/api/types";
import { DynamicIcon } from "../shared/DynamicIcon";
import { Map, Clock, Building, Info, ImageOff } from "lucide-react";

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
    if (!place) return null;

    const handleSelectOnMapClick = () => {
        onPlaceSelect(place);
        onOpenChange(false); // Close the sheet to let the user see the map
    };

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent className="w-full md:w-[450px] sm:max-w-none flex flex-col p-0 gap-0">
                {/* Scrollable content area */}
                <ScrollArea className="flex-1">
                    {/* Image Section */}
                    <div className="relative">
                        {place.coverUrl ? (
                            <img
                                src={getAssetUrl(place.coverUrl)}
                                alt={`${place.name} cover`}
                                className="w-full h-48 object-cover"
                            />
                        ) : (
                            <div className="w-full h-48 bg-muted flex items-center justify-center">
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

                    {/* Details Section */}
                    <div className="p-6 pt-16 space-y-6">
                        <SheetHeader className="text-left space-y-2 p-0">
                            <SheetTitle className="text-3xl font-bold">{place.name}</SheetTitle>
                            {place.category && (
                                <SheetDescription>
                                    <Badge variant="secondary" className="text-md py-1 px-3">
                                        <DynamicIcon name={place.category.iconKey} className="mr-2 h-4 w-4" />
                                        {place.category.name}
                                    </Badge>
                                </SheetDescription>
                            )}
                        </SheetHeader>

                        {/* Info List */}
                        <div className="space-y-4">
                            <div className="flex items-start gap-4">
                                <Info className="h-5 w-5 mt-1 text-muted-foreground shrink-0" />
                                <div>
                                    <h3 className="font-semibold">About</h3>
                                    <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
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

                            <div className="h-px bg-border" />

                            <div className="flex items-start gap-4">
                                <Building className="h-5 w-5 mt-1 text-muted-foreground shrink-0" />
                                <div>
                                    <h3 className="font-semibold">Location</h3>
                                    <p className="text-muted-foreground text-sm">
                                        {place.floorPlan.name}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </ScrollArea>

                {/* Footer Action Button */}
                <div className="p-4 border-t bg-background mt-auto">
                    <Button className="w-full h-14 text-lg" onClick={handleSelectOnMapClick}>
                        <Map className="mr-2 h-6 w-6" /> Show on Map
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}

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
import { Map, Info, Clock, X as CloseIcon } from "lucide-react";

interface PlaceDetailSheetProps {
    place: Place | null;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onShowOnMap: (place: Place) => void;
}

export function PlaceDetailSheet({
    place,
    isOpen,
    onOpenChange,
    onShowOnMap,
}: PlaceDetailSheetProps) {
    if (!place) return null;

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent className="w-full md:w-[450px] sm:max-w-none flex flex-col p-0">
                <ScrollArea className="flex-1">
                    <div className="relative">
                        {place.coverUrl ? (
                            <img
                                src={getAssetUrl(place.coverUrl)}
                                alt={`${place.name} cover`}
                                className="w-full h-48 object-cover"
                            />
                        ) : (
                            <div className="w-full h-48 bg-muted" />
                        )}
                        <div className="absolute -bottom-12 left-6 h-24 w-24 rounded-full bg-background border-4 border-background p-1">
                            {place.logoUrl ? (
                                <img
                                    src={getAssetUrl(place.logoUrl)}
                                    alt={`${place.name} logo`}
                                    className="w-full h-full object-cover rounded-full"
                                />
                            ) : (
                                <div className="w-full h-full rounded-full bg-muted" />
                            )}
                        </div>
                    </div>

                    <div className="p-6 pt-16">
                        <SheetHeader className="text-left">
                            <SheetTitle className="text-3xl font-bold">{place.name}</SheetTitle>
                            {place.category && (
                                <SheetDescription>
                                    <Badge variant="secondary" className="text-md">
                                        <DynamicIcon name={place.category.iconKey} className="mr-2" />
                                        {place.category.name}
                                    </Badge>
                                </SheetDescription>
                            )}
                        </SheetHeader>

                        {/* IMPROVEMENT: Structured information sections */}
                        <div className="mt-8 space-y-6">
                            <div>
                                <h3 className="flex items-center gap-2 font-semibold mb-2 text-lg">
                                    <Info className="h-5 w-5 text-primary" />
                                    About
                                </h3>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                    {place.description || 'No description provided.'}
                                </p>
                            </div>
                            <div>
                                <h3 className="flex items-center gap-2 font-semibold mb-2 text-lg">
                                    <Clock className="h-5 w-5 text-primary" />
                                    Business Hours
                                </h3>
                                <p className="text-sm font-medium">
                                    {place.businessHours || 'Not specified'}
                                </p>
                            </div>
                        </div>
                    </div>
                </ScrollArea>
                {/* IMPROVEMENT: Enhanced footer with clear primary and secondary actions */}
                <div className="p-4 border-t bg-background flex gap-2">
                    <Button variant="outline" className="w-1/3 h-14 text-lg" onClick={() => onOpenChange(false)}>
                        <CloseIcon className="mr-2 h-6 w-6" />
                        Close
                    </Button>
                    <Button className="w-2/3 h-14 text-lg" onClick={() => onShowOnMap(place)}>
                        <Map className="mr-2 h-6 w-6" />
                        Show on Map
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}

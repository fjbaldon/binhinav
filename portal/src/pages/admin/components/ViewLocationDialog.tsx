import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { getAssetUrl } from "@/api";
import { Target } from "lucide-react";
import type { FloorPlan, Place } from "@/api/types";
import { ContextPin } from "./ContextPin";

interface ViewableLocation {
    id: string;
    name: string;
    locationX: number;
    locationY: number;
    floorPlan: FloorPlan;
}

interface ViewLocationDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    item: ViewableLocation | null;
    placesOnFloor: Place[];
}

export function ViewLocationDialog({ isOpen, onOpenChange, item, placesOnFloor }: ViewLocationDialogProps) {
    if (!item) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Location for: {item.name}</DialogTitle>
                    <DialogDescription>Floor Plan: {item.floorPlan.name}</DialogDescription>
                </DialogHeader>
                <div className="relative mt-4 w-full rounded-md border bg-muted/20 overflow-hidden">
                    <img
                        src={getAssetUrl(item.floorPlan.imageUrl)}
                        alt={item.floorPlan.name}
                        className="max-h-[70vh] w-full object-contain"
                    />
                    {placesOnFloor
                        .filter(p => p.id !== item.id)
                        .map(place => (
                            <ContextPin key={place.id} place={place} />
                        ))
                    }
                    <Target
                        className="absolute text-red-500 w-8 h-8 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                        style={{ left: `${item.locationX}%`, top: `${item.locationY}%` }}
                        strokeWidth={2.5}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}

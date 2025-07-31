import { useEffect, useState, useRef } from "react";
import type { FloorPlan } from "@/api/types";
import { getAssetUrl } from "@/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Target } from 'lucide-react';

interface LocationSetterDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (coords: { x: number; y: number }) => void;
    onBack: () => void;
    floorPlan: FloorPlan;
    initialCoords: [number, number] | null;
    isPending: boolean;
}

export function LocationSetterDialog({
    isOpen,
    onOpenChange,
    onSave,
    onBack,
    floorPlan,
    initialCoords,
    isPending,
}: LocationSetterDialogProps) {
    const [coords, setCoords] = useState<[number, number] | null>(initialCoords);
    const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
    const imageRef = useRef<HTMLImageElement>(null);

    const handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
        const img = event.currentTarget;
        setImageSize({
            width: img.naturalWidth,
            height: img.naturalHeight,
        });
    };

    const handleImageClick = (event: React.MouseEvent<HTMLImageElement>) => {
        if (!imageSize || !imageRef.current) return;

        const img = imageRef.current;
        const rect = img.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const containerWidth = rect.width;
        const containerHeight = rect.height;
        const imageAspect = imageSize.width / imageSize.height;
        const containerAspect = containerWidth / containerHeight;

        let renderWidth, renderHeight, offsetX, offsetY;

        if (containerAspect > imageAspect) {
            renderHeight = containerHeight;
            renderWidth = containerHeight * imageAspect;
            offsetX = (containerWidth - renderWidth) / 2;
            offsetY = 0;
        } else {
            renderWidth = containerWidth;
            renderHeight = containerWidth / imageAspect;
            offsetX = 0;
            offsetY = (containerHeight - renderHeight) / 2;
        }

        if (
            x < offsetX ||
            x > offsetX + renderWidth ||
            y < offsetY ||
            y > offsetY + renderHeight
        ) {
            toast.warning("Please click within the floor plan image area.");
            return;
        }

        const imageX = x - offsetX;
        const imageY = y - offsetY;
        const percentX = (imageX / renderWidth) * 100;
        const percentY = (imageY / renderHeight) * 100;

        setCoords([percentX, percentY]);
    };

    const handleSave = () => {
        if (coords) onSave({ x: coords[0], y: coords[1] });
        else toast.error("Please set a location by double-clicking the map.");
    };

    useEffect(() => {
        if (isOpen) {
            setCoords(initialCoords);
            setImageSize(null);
        }
    }, [isOpen, initialCoords]);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Step 2: Set Location</DialogTitle>
                    <DialogDescription>
                        Click on the map to place a pin for the new location.
                    </DialogDescription>
                </DialogHeader>
                <div className="relative w-full rounded-md border bg-muted/20 overflow-hidden mt-4 flex items-center justify-center">
                    <img
                        ref={imageRef}
                        src={getAssetUrl(floorPlan.imageUrl)}
                        alt={floorPlan.name}
                        onLoad={handleImageLoad}
                        onClick={handleImageClick}
                        className="max-h-[60vh] w-auto h-auto object-contain cursor-crosshair"
                        style={{ display: 'block' }}
                    />
                    {coords && imageSize && (
                        <Target
                            className="absolute text-red-500 w-6 h-6 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                            style={{ left: `${coords[0]}%`, top: `${coords[1]}%` }}
                        />
                    )}
                </div>
                <div className="flex justify-between items-center mt-4">
                    <p className="text-sm text-muted-foreground">Coordinates: {coords ? `(${coords[0].toFixed(2)}%, ${coords[1].toFixed(2)}%)` : 'Not set'}</p>
                    <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={onBack}>
                            Back
                        </Button>
                        <Button type="button" onClick={handleSave} disabled={isPending || !coords}>
                            {isPending ? "Saving..." : "Save Place"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

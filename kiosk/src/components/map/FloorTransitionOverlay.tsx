import { Loader2 } from 'lucide-react';

interface FloorTransitionOverlayProps {
    isOpen: boolean;
    floorName: string;
}

export function FloorTransitionOverlay({ isOpen, floorName }: FloorTransitionOverlayProps) {
    if (!isOpen) return null;

    return (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center animate-in fade-in duration-300">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-2xl font-bold text-foreground">
                Switching to {floorName}...
            </p>
        </div>
    );
}

import { useControls } from 'react-zoom-pan-pinch';
import { Button } from "@/components/ui/button";
import { Plus, Minus } from 'lucide-react';
import type { FloorPlan } from '@/api/types';

interface MapControlsProps {
    floorPlans: FloorPlan[];
    currentFloorPlanId: string | null;
    onFloorChange: (id: string) => void;
    kioskFloorId: string; // The actual floor the kiosk is on
}

export function MapControls({ floorPlans, currentFloorPlanId, onFloorChange, kioskFloorId }: MapControlsProps) {
    const { zoomIn, zoomOut } = useControls();

    // Sort floor plans if needed, assuming names can be sorted alphabetically/numerically
    const sortedFloorPlans = [...floorPlans].sort((a, b) => b.name.localeCompare(a.name));

    return (
        // Use justify-between to push items to the edges and add z-10
        <div className="absolute top-6 right-6 bottom-6 flex flex-col items-end justify-between z-10 pointer-events-none">
            {/* Floor Selector Group (stays at top) */}
            <div className="bg-background/80 backdrop-blur-sm rounded-2xl shadow-lg p-2 flex flex-col gap-2 pointer-events-auto">
                {sortedFloorPlans.map(fp => (
                    <Button
                        key={fp.id}
                        onClick={() => onFloorChange(fp.id)}
                        variant={currentFloorPlanId === fp.id ? 'default' : 'secondary'}
                        className="w-14 h-14 text-lg font-bold rounded-lg relative" // Add relative positioning
                    >
                        {/* Add the indicator dot if this is the kiosk's floor */}
                        {fp.id === kioskFloorId && (
                            <span className="absolute top-1.5 right-1.5 h-3 w-3 rounded-full bg-blue-500 border-2 border-background" />
                        )}
                        {fp.name.replace(/floor|level/i, '').trim()}
                    </Button>
                ))}
            </div>

            {/* Zoom Controls Group (pushed to bottom) */}
            <div className="bg-background/80 backdrop-blur-sm rounded-2xl shadow-lg p-2 flex flex-col gap-2 pointer-events-auto">
                <Button onClick={() => zoomIn()} size="icon" className="w-14 h-14 rounded-lg">
                    <Plus className="h-6 w-6" />
                </Button>
                <Button onClick={() => zoomOut()} size="icon" className="w-14 h-14 rounded-lg">
                    <Minus className="h-6 w-6" />
                </Button>
            </div>
        </div>
    );
}

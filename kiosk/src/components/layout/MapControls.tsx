import { useControls } from 'react-zoom-pan-pinch';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, LocateFixed } from 'lucide-react';
import type { FloorPlan } from '@/api/types';

interface MapControlsProps {
    floorPlans: FloorPlan[];
    currentFloorPlanId: string | null;
    onFloorChange: (id: string) => void;
    kioskFloorId: string;
    floorResultCounts: Record<string, number>;
    onLocateKiosk: () => void;
}

export function MapControls({ floorPlans, currentFloorPlanId, onFloorChange, kioskFloorId, floorResultCounts = {}, onLocateKiosk }: MapControlsProps) {
    const { zoomIn, zoomOut } = useControls();

    const sortedFloorPlans = [...floorPlans].sort((a, b) => b.name.localeCompare(a.name));

    const actionButtonClasses = "w-14 h-14 rounded-lg transition-transform duration-100 hover:scale-110 active:scale-95";

    return (
        <div className="absolute top-6 right-6 bottom-6 flex flex-col items-end justify-between z-10 pointer-events-none">
            <div className="bg-background/80 backdrop-blur-sm rounded-2xl shadow-lg p-2 flex flex-col gap-2 pointer-events-auto">
                {sortedFloorPlans.map(fp => {
                    const resultCount = floorResultCounts[fp.id];
                    const isActive = currentFloorPlanId === fp.id;
                    return (
                        <Button
                            key={fp.id}
                            onClick={() => onFloorChange(fp.id)}
                            variant={isActive ? 'default' : 'secondary'}
                            className="w-14 h-14 text-lg font-bold rounded-lg relative transition-transform duration-100 hover:scale-110 active:scale-95 active:brightness-90"
                        >
                            {fp.id === kioskFloorId && (
                                <span className="absolute top-1.5 left-1.5 h-3 w-3 rounded-full bg-blue-500 border-2 border-background" />
                            )}
                            {resultCount > 0 && (
                                <Badge className="absolute top-1 right-1 h-5 w-5 p-0 justify-center rounded-full bg-red-500 text-white border-2 border-background">
                                    {resultCount}
                                </Badge>
                            )}
                            {fp.name.replace(/floor|level/i, '').trim()}
                        </Button>
                    );
                })}
            </div>

            <div className="flex flex-col gap-2 pointer-events-auto">
                <div className="bg-background/80 backdrop-blur-sm rounded-2xl shadow-lg p-2">
                    <Button
                        onClick={onLocateKiosk}
                        size="icon"
                        className={actionButtonClasses}
                    >
                        <LocateFixed className="h-6 w-6" />
                    </Button>
                </div>
                <div className="bg-background/80 backdrop-blur-sm rounded-2xl shadow-lg p-2 flex flex-col gap-2">
                    <Button onClick={() => zoomIn()} size="icon" className={actionButtonClasses}>
                        <Plus className="h-6 w-6" />
                    </Button>
                    <Button onClick={() => zoomOut()} size="icon" className={actionButtonClasses}>
                        <Minus className="h-6 w-6" />
                    </Button>
                </div>
            </div>
        </div>
    );
}

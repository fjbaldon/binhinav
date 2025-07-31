import type { Place } from "@/api/types";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { MapPin } from 'lucide-react';

interface ContextPinProps {
    place: Place;
}

export function ContextPin({ place }: ContextPinProps) {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div
                        className="absolute transform -translate-x-1/2 -translate-y-full"
                        style={{
                            left: `${place.locationX}%`,
                            top: `${place.locationY}%`,
                        }}
                    >
                        <MapPin className="h-4 w-4 text-slate-500 fill-slate-400/50" />
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{place.name}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

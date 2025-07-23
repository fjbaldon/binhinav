import { MapPin } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface KioskPinProps {
    x: number;
    y: number;
    name: string;
}

export function KioskPin({ x, y, name }: KioskPinProps) {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div
                        className="absolute transform -translate-x-1/2 -translate-y-full cursor-pointer"
                        style={{ left: `${x}px`, top: `${y}px` }}
                    >
                        <MapPin className="w-20 h-20 text-blue-500 fill-blue-200/80 stroke-[1.5]" />
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p className="font-semibold">You Are Here: {name}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

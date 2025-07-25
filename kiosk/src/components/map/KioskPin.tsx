import { MapPin } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';

interface KioskPinProps {
    x: number;
    y: number;
    name: string;
    isPulsing?: boolean;
}

export function KioskPin({ x, y, name, isPulsing }: KioskPinProps) {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div
                        className="absolute transform -translate-x-1/2 -translate-y-full cursor-pointer z-20"
                        style={{ left: `${x}px`, top: `${y}px` }}
                    >
                        <div className="relative w-20 h-20">
                            {isPulsing && (
                                <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping" />
                            )}
                            <MapPin
                                className={cn(
                                    "absolute inset-0 w-20 h-20 text-blue-500 fill-blue-200/80 stroke-[1.5] transition-transform",
                                    isPulsing && "animate-bounce"
                                )}
                            />
                        </div>
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p className="font-semibold">You Are Here: {name}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

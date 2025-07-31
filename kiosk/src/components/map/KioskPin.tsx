import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface KioskPinProps {
    x: number;
    y: number;
    name: string;
    isPulsing?: boolean;
    mapScale: number;
}

export function KioskPin({ x, y, name, isPulsing, mapScale }: KioskPinProps) {
    const visualScale = 1 / mapScale;

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div
                        className="absolute cursor-pointer z-10"
                        style={{
                            left: `${x}%`,
                            top: `${y}%`,
                            transform: 'translate(-50%, -50%)',
                        }}
                    >
                        <div
                            className="transform-gpu origin-center"
                            style={{
                                transform: `scale(${visualScale})`,
                            }}
                        >
                            <div className="relative w-20 h-20 group/pin">
                                {/* Outer pulse ring */}
                                {isPulsing && (
                                    <div className="absolute inset-0 rounded-full bg-blue-400 opacity-75 animate-ping" style={{ animationDuration: '2s' }} />
                                )}

                                {/* Mid ring */}
                                <div className="absolute inset-2 rounded-full bg-blue-400/60" />

                                {/* Center dot */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white border-4 border-blue-500 shadow-md" />

                                {/* Optional: inner glow */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-blue-200 animate-pulse" style={{ animationDuration: '1.5s' }} />
                            </div>
                        </div>
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p className="font-semibold text-xl">You Are Here: {name}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
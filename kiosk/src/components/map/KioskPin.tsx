import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface KioskPinProps {
    x: number;
    y: number;
    name: string;
    isPulsing?: boolean;
    mapScale: number;
}

const sonarKeyframes = `
  @keyframes sonar-ping {
    from {
      transform: scale(0.7);
      opacity: 0.4;
    }
    to {
      transform: scale(8);
      opacity: 0;
    }
  }
`;

export function KioskPin({ x, y, name, isPulsing, mapScale }: KioskPinProps) {
    const visualScale = 1 / mapScale;

    return (
        <TooltipProvider>
            <style>{sonarKeyframes}</style>
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
                                {isPulsing && (
                                    <>
                                        <div
                                            className="absolute inset-0 rounded-full bg-blue-500"
                                            style={{ animation: 'sonar-ping 3.5s cubic-bezier(0, 0, 0.2, 1) infinite' }}
                                        />
                                        <div
                                            className="absolute inset-0 rounded-full bg-blue-500"
                                            style={{ animation: 'sonar-ping 3.5s cubic-bezier(0, 0, 0.2, 1) infinite', animationDelay: '1.75s' }}
                                        />
                                    </>
                                )}
                                <div className="absolute inset-2 rounded-full bg-blue-400/60" />
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white border-4 border-blue-500 shadow-md" />
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-blue-200" />
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

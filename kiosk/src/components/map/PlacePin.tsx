import type { Place } from '@/api/types';
import { cn } from '@/lib/utils';
import { getAssetUrl } from '@/api';
import { Building2 } from 'lucide-react';

interface PlacePinProps {
    place: Place;
    isSelected: boolean;
    onClick: () => void;
}

export function PlacePin({ place, isSelected, onClick }: PlacePinProps) {
    // Unique ID for the clip path to prevent SVG conflicts
    const clipPathId = `logo-clip-${place.id}`;

    return (
        // --- MODIFIED: The main wrapper is now centered on the coordinate ---
        <div
            className={cn(
                "absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group",
                isSelected && "z-10"
            )}
            style={{ left: `${place.locationX}px`, top: `${place.locationY}px` }}
            onClick={onClick}
        >
            {/* --- MODIFIED: Pin container is slightly smaller by default --- */}
            <div className={cn(
                "relative w-16 h-16 transition-all duration-200", // Default size is smaller
                isSelected ? "scale-125" : "group-hover:scale-110" // Scales up on select/hover
            )}>
                <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
                    <defs>
                        {/* The mask for the logo, centered in the new square viewbox */}
                        <clipPath id={clipPathId}>
                            <circle cx="50" cy="50" r="46" />
                        </clipPath>
                    </defs>

                    {/* --- MODIFIED: Replaced <path> with a <circle> for the main body --- */}
                    <circle
                        cx="50"
                        cy="50"
                        r="48"
                        className={cn(
                            "transition-colors stroke-[4]",
                            isSelected
                                ? "fill-red-100/90 stroke-red-500"
                                : "fill-background stroke-primary/80 group-hover:fill-primary-foreground group-hover:stroke-primary"
                        )}
                    />

                    {/* The logo or fallback icon, clipped by the circle */}
                    {place.logoUrl ? (
                        <image
                            href={getAssetUrl(place.logoUrl)}
                            x="4" y="4" width="92" height="92" // Centered for the r=46 clip path
                            clipPath={`url(#${clipPathId})`}
                            preserveAspectRatio="xMidYMid slice"
                        />
                    ) : (
                        <foreignObject x="25" y="25" width="50" height="50" clipPath={`url(#${clipPathId})`}>
                            <div className="flex items-center justify-center w-full h-full">
                                <Building2 className={cn(
                                    "w-7 h-7 transition-colors",
                                    isSelected ? "text-red-600" : "text-primary/90 group-hover:text-primary"
                                )} />
                            </div>
                        </foreignObject>
                    )}
                </svg>
            </div>

            {/* --- MODIFIED: The Label position is adjusted for the new centered pin --- */}
            <div
                className={cn(
                    "absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-1 rounded-md shadow text-center whitespace-nowrap transition-all duration-200",
                    isSelected
                        ? "bg-background text-base font-bold text-foreground"
                        : "bg-background/80 text-xs font-medium text-foreground/80"
                )}
            >
                <p>{place.name}</p>
            </div>
        </div>
    );
}

import { MapPin } from 'lucide-react';
import type { Place } from '@/api/types';
import { cn } from '@/lib/utils';
import { getAssetUrl } from '@/api';

interface PlacePinProps {
    place: Place;
    isSelected: boolean;
    onClick: () => void;
}

export function PlacePin({ place, isSelected, onClick }: PlacePinProps) {
    return (
        <div
            className="absolute transform -translate-x-1/2 -translate-y-full cursor-pointer group"
            style={{ left: `${place.locationX}px`, top: `${place.locationY}px` }}
            onClick={onClick}
        >
            {/* The Pin Icon */}
            <MapPin
                className={cn(
                    "w-20 h-20 transition-all duration-200 stroke-[1.5]",
                    isSelected
                        ? "text-red-500 fill-red-200/80 scale-125"
                        : "text-primary/70 fill-secondary/80 group-hover:text-primary group-hover:fill-primary-foreground group-hover:scale-110"
                )}
            />
            {/* The Logo inside the pin */}
            {place.logoUrl && (
                <img
                    src={getAssetUrl(place.logoUrl)}
                    alt={`${place.name} logo`}
                    className="absolute top-2 left-1/2 -translate-x-1/2 w-[42px] h-[42px] rounded-full object-cover pointer-events-none"
                />
            )}
            {/* The Label */}
            <div
                className={cn(
                    "absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 rounded-lg bg-background/90 shadow-lg text-center whitespace-nowrap transition-all origin-top",
                    isSelected ? "scale-100" : "scale-0 group-hover:scale-100"
                )}
            >
                <p className="font-bold text-foreground">{place.name}</p>
            </div>
        </div>
    );
}

import type { Place } from '@/api/types';
import { cn } from '@/lib/utils';
import { getAssetUrl } from '@/api';
import { Building2 } from 'lucide-react';

interface PlacePinProps {
    place: Place;
    isSelected: boolean;
    onClick: () => void;
    mapScale: number;
    isDimmed?: boolean;
    isPulsing?: boolean;
}

const sonarKeyframes = `
  @keyframes place-sonar-ping {
    from {
      transform: scale(0.7);
      opacity: 0.6;
    }
    to {
      transform: scale(8);
      opacity: 0;
    }
  }
`;

export function PlacePin({ place, isSelected, onClick, mapScale, isDimmed, isPulsing }: PlacePinProps) {
    const visualScale = 1 / mapScale;

    const clipPathId = `logo-clip-${place.id}`;

    return (
        <div
            className="absolute cursor-pointer"
            style={{
                left: `${place.locationX}%`,
                top: `${place.locationY}%`,
                transform: 'translate(-50%, -50%)',
            }}
            onClick={onClick}
        >
            <style>{isPulsing && sonarKeyframes}</style>
            <div
                className="transform-gpu origin-center"
                style={{
                    transform: `scale(${visualScale})`,
                }}
            >
                <div
                    className={cn(
                        'relative w-16 h-16 group/pin transition-all duration-200',
                        isSelected ? 'scale-110' : 'group-hover/pin:scale-105',
                        { 'opacity-40 saturate-50': isDimmed && !isSelected }
                    )}
                >
                    {isPulsing && (
                        <>
                            <div
                                className="absolute inset-0 rounded-full bg-red-500"
                                style={{ animation: 'place-sonar-ping 3.5s cubic-bezier(0, 0, 0.2, 1) infinite' }}
                            />
                            <div
                                className="absolute inset-0 rounded-full bg-red-500"
                                style={{ animation: 'place-sonar-ping 3.5s cubic-bezier(0, 0, 0.2, 1) infinite', animationDelay: '1.75s' }}
                            />
                        </>
                    )}
                    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
                        <defs>
                            <clipPath id={clipPathId}>
                                <circle cx="50" cy="50" r="46" />
                            </clipPath>
                        </defs>

                        <circle
                            cx="50"
                            cy="50"
                            r="48"
                            className={cn(
                                'transition-colors stroke-[4]',
                                isSelected
                                    ? 'fill-red-100/90 stroke-red-500'
                                    : 'fill-background stroke-primary/80 group-hover/pin:fill-primary-foreground group-hover/pin:stroke-primary'
                            )}
                        />

                        {place.logoUrl ? (
                            <image
                                href={getAssetUrl(place.logoUrl)}
                                x="4"
                                y="4"
                                width="92"
                                height="92"
                                clipPath={`url(#${clipPathId})`}
                                preserveAspectRatio="xMidYMid slice"
                            />
                        ) : (
                            <foreignObject x="15" y="15" width="70" height="70" clipPath={`url(#${clipPathId})`}>
                                <div className="flex items-center justify-center w-full h-full">
                                    <Building2
                                        className={cn(
                                            'w-12 h-12 transition-colors',
                                            isSelected
                                                ? 'text-red-600'
                                                : 'text-primary/90 group-hover/pin:text-primary'
                                        )}
                                    />
                                </div>
                            </foreignObject>
                        )}
                    </svg>

                    <div
                        className={cn(
                            'absolute top-full left-1/2 -translate-x-1/2 mt-2 px-4 py-2 rounded-lg shadow bg-background text-xl font-bold text-foreground whitespace-nowrap transition-all duration-200',
                            isSelected ? 'opacity-100 scale-100' : 'opacity-0 scale-95 group-hover/pin:opacity-100 group-hover/pin:scale-100'
                        )}
                    >
                        <p>{place.name}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

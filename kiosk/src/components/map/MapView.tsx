import { useRef, useEffect } from 'react';
import { TransformWrapper, TransformComponent, type ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';
import { getAssetUrl } from '@/api';
import type { Place, KioskData } from '@/api/types';
import { PlacePin } from './PlacePin';
import { KioskPin } from './KioskPin';
import { getTransformForBounds } from '@/lib/utils';

interface MapViewProps {
    kiosk: KioskData;
    floorPlan: { id: string, imageUrl: string } | undefined;
    places: Place[];
    selectedPlace: Place | null;
    onPlaceSelect: (place: Place | null) => void;
    mapControllerRef: React.RefObject<ReactZoomPanPinchRef | null>;
    children?: React.ReactNode; // Accept children to render map controls
}

export function MapView({ kiosk, floorPlan, places, selectedPlace, onPlaceSelect, mapControllerRef, children }: MapViewProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const controller = mapControllerRef.current;
        const container = mapContainerRef.current;
        if (!controller || !container || !selectedPlace) return;

        setTimeout(() => {
            const viewSize = {
                width: container.offsetWidth,
                height: container.offsetHeight,
            };

            const transform = getTransformForBounds(
                { x: kiosk.locationX, y: kiosk.locationY },
                { x: selectedPlace.locationX, y: selectedPlace.locationY },
                viewSize
            );

            controller.setTransform(transform.x, transform.y, transform.scale, 300, 'easeOut');
        }, 100);

    }, [selectedPlace, kiosk.locationX, kiosk.locationY, mapControllerRef]);


    if (!floorPlan) {
        return <div className="flex items-center justify-center h-full bg-muted">Select a floor plan to begin.</div>;
    }

    return (
        <div ref={mapContainerRef} className="h-full w-full bg-muted overflow-hidden">
            <TransformWrapper
                ref={mapControllerRef}
                initialScale={1}
                minScale={0.2}
                maxScale={3}
                limitToBounds={false}
                panning={{ velocityDisabled: true }}
            >
                {/* Render children (MapControls) here so they have access to the zoom context */}
                {children}
                <TransformComponent wrapperClass="!w-full !h-full" contentClass="!w-full !h-full">
                    <div
                        className="relative"
                        onClick={(e) => {
                            if (e.target === e.currentTarget) {
                                onPlaceSelect(null);
                            }
                        }}
                    >
                        <img src={getAssetUrl(floorPlan.imageUrl)} alt="Floor Plan" className="pointer-events-none" />
                        {/* Conditionally render the KioskPin only if the floors match */}
                        {kiosk.floorPlan.id === floorPlan?.id && (
                            <KioskPin x={kiosk.locationX} y={kiosk.locationY} name={kiosk.name} />
                        )}
                        {places.map(place => (
                            <PlacePin
                                key={place.id}
                                place={place}
                                isSelected={selectedPlace?.id === place.id}
                                onClick={() => onPlaceSelect(place)}
                            />
                        ))}
                    </div>
                </TransformComponent>
            </TransformWrapper>
        </div>
    );
}
import { useRef, useEffect, useState, useLayoutEffect } from 'react';
import { TransformWrapper, TransformComponent, type ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';
import { getAssetUrl } from '@/api';
import type { Place, KioskData } from '@/api/types';
import { PlacePin } from './PlacePin';
import { KioskPin } from './KioskPin';
import { getTransformForBounds } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface MapViewProps {
    kiosk: KioskData;
    floorPlan: { id: string, imageUrl: string } | undefined;
    places: Place[];
    selectedPlace: Place | null;
    onPlaceSelect: (place: Place | null) => void;
    mapControllerRef: React.RefObject<ReactZoomPanPinchRef | null>;
    isLocatingKiosk: boolean;
    children?: React.ReactNode;
}

export function MapView({ kiosk, floorPlan, places, selectedPlace, onPlaceSelect, mapControllerRef, isLocatingKiosk, children }: MapViewProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const [mapSize, setMapSize] = useState<{ width: number; height: number } | null>(null);
    const [initialTransform, setInitialTransform] = useState<{ scale: number; x: number; y: number } | null>(null);

    // Effect to reset the state when the floor plan changes
    useEffect(() => {
        setMapSize(null);
        setInitialTransform(null);
    }, [floorPlan?.id]);

    // This effect calculates the initial transform as soon as the image size is known
    useLayoutEffect(() => {
        if (mapSize && !initialTransform && mapContainerRef.current) {
            const container = mapContainerRef.current;
            const PADDING = 48;
            const viewWidth = container.offsetWidth;
            const viewHeight = container.offsetHeight;

            if (viewWidth === 0 || viewHeight === 0) return;

            const scaleX = viewWidth / (mapSize.width + PADDING * 2);
            const scaleY = viewHeight / (mapSize.height + PADDING * 2);
            const scale = Math.min(scaleX, scaleY);

            const x = (viewWidth - mapSize.width * scale) / 2;
            const y = (viewHeight - mapSize.height * scale) / 2;

            setInitialTransform({ scale, x, y });
        }
    }, [mapSize, initialTransform]);

    // Effect to animate zooming to a selected place
    useEffect(() => {
        const controller = mapControllerRef.current;
        const container = mapContainerRef.current;
        if (!controller || !container || !selectedPlace || !mapSize) return;

        const timer = setTimeout(() => {
            const viewSize = { width: container.offsetWidth, height: container.offsetHeight };
            const transform = getTransformForBounds(
                { x: kiosk.locationX, y: kiosk.locationY },
                { x: selectedPlace.locationX, y: selectedPlace.locationY },
                viewSize, 150
            );
            controller.setTransform(transform.x, transform.y, transform.scale, 300, 'easeOut');
        }, 100);

        return () => clearTimeout(timer);
    }, [selectedPlace, kiosk.locationX, kiosk.locationY, mapControllerRef, mapSize]);

    // Function to capture the image's natural dimensions on load
    const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        setMapSize({
            width: e.currentTarget.naturalWidth,
            height: e.currentTarget.naturalHeight,
        });
    };

    if (!floorPlan) {
        return <div className="flex items-center justify-center h-full bg-muted">Select a floor plan to begin.</div>;
    }

    return (
        <div ref={mapContainerRef} className="h-full w-full bg-muted overflow-hidden">
            {/* This image is used to trigger the onLoad event but is not visible */}
            <img
                src={getAssetUrl(floorPlan.imageUrl)}
                onLoad={handleImageLoad}
                className="absolute opacity-0 pointer-events-none"
                alt=""
            />

            {/* Show a loader until the initial transform is calculated */}
            {!initialTransform ? (
                <div className="flex items-center justify-center h-full w-full">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
            ) : (
                /* Once ready, render the map wrapper with its initial state pre-calculated */
                <TransformWrapper
                    ref={mapControllerRef}
                    key={floorPlan.id}
                    initialScale={initialTransform.scale}
                    initialPositionX={initialTransform.x}
                    initialPositionY={initialTransform.y}
                    minScale={0.2}
                    maxScale={3}
                    limitToBounds={true}
                    panning={{ velocityDisabled: false }}
                    wheel={{ step: 0.2 }}
                    doubleClick={{ disabled: true }}
                >
                    {children}
                    <TransformComponent wrapperClass="!w-full !h-full" contentClass="">
                        <div
                            className="relative"
                            style={{ width: mapSize!.width, height: mapSize!.height }}
                            onClick={(e) => { if (e.target === e.currentTarget) { onPlaceSelect(null); } }}
                        >
                            <img
                                src={getAssetUrl(floorPlan.imageUrl)}
                                alt="Floor Plan"
                                className="pointer-events-none block"
                            />

                            {/* Pins are now rendered inside a perfectly sized and positioned container */}
                            {kiosk.floorPlan.id === floorPlan?.id && (
                                <KioskPin x={kiosk.locationX} y={kiosk.locationY} name={kiosk.name} isPulsing={isLocatingKiosk} />
                            )}
                            {places.map(place => (
                                <PlacePin key={place.id} place={place} isSelected={selectedPlace?.id === place.id} onClick={() => onPlaceSelect(place)} />
                            ))}
                        </div>
                    </TransformComponent>
                </TransformWrapper>
            )}
        </div>
    );
}

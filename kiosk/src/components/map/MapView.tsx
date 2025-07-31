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
    currentScale: number;
    onScaleChange: (scale: number) => void;
}

export function MapView({ kiosk, floorPlan, places, selectedPlace, onPlaceSelect, mapControllerRef, isLocatingKiosk, children, currentScale, onScaleChange }: MapViewProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const [mapSize, setMapSize] = useState<{ width: number; height: number } | null>(null);
    const [initialTransform, setInitialTransform] = useState<{ scale: number; x: number; y: number } | null>(null);

    useEffect(() => {
        setMapSize(null);
        setInitialTransform(null);
    }, [floorPlan?.id]);

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

    useEffect(() => {
        const controller = mapControllerRef.current;
        const container = mapContainerRef.current;
        if (!controller || !container || !selectedPlace || !mapSize) return;

        const kioskPixelCoords = {
            x: (kiosk.locationX / 100) * mapSize.width,
            y: (kiosk.locationY / 100) * mapSize.height,
        };
        const placePixelCoords = {
            x: (selectedPlace.locationX / 100) * mapSize.width,
            y: (selectedPlace.locationY / 100) * mapSize.height,
        };

        const timer = setTimeout(() => {
            const viewSize = { width: container.offsetWidth, height: container.offsetHeight };
            const transform = getTransformForBounds(
                kioskPixelCoords,
                placePixelCoords,
                viewSize, 150
            );
            controller.setTransform(transform.x, transform.y, transform.scale, 300, 'easeOut');
        }, 100);

        return () => clearTimeout(timer);
    }, [selectedPlace, kiosk, mapControllerRef, mapSize]);

    useEffect(() => {
        if (isLocatingKiosk && mapControllerRef.current) {
            mapControllerRef.current.resetTransform(600, "easeOut");
        }
    }, [isLocatingKiosk, mapControllerRef]);


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
        <div ref={mapContainerRef} className="h-full w-full bg-muted overflow-hidden" data-selected={!!selectedPlace}>
            <img
                src={getAssetUrl(floorPlan.imageUrl)}
                onLoad={handleImageLoad}
                className="absolute opacity-0 pointer-events-none"
                alt=""
            />

            {!initialTransform ? (
                <div className="flex items-center justify-center h-full w-full">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
            ) : (
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
                    onTransformed={(_ref, state) => onScaleChange(state.scale)}
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

                            {kiosk.floorPlan.id === floorPlan?.id && (
                                <KioskPin x={kiosk.locationX} y={kiosk.locationY} name={kiosk.name} isPulsing={isLocatingKiosk} mapScale={currentScale} />
                            )}
                            {places.map(place => (
                                <PlacePin key={place.id} place={place} isSelected={selectedPlace?.id === place.id} onClick={() => onPlaceSelect(place)} mapScale={currentScale} />
                            ))}
                        </div>
                    </TransformComponent>
                </TransformWrapper>
            )}
        </div>
    );
}

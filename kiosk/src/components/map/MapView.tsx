import { useRef, useEffect, useState, useLayoutEffect, useMemo } from 'react';
import { TransformWrapper, TransformComponent, type ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';
import { getAssetUrl } from '@/api';
import type { Place, KioskData } from '@/api/types';
import { PlacePin } from './PlacePin';
import { KioskPin } from './KioskPin';
import { getTransformForBounds } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface MapData {
    id: string;
    imageUrl: string;
    width: number;
    height: number;
}

interface MapViewProps {
    kiosk: KioskData;
    floorPlan: { id: string, imageUrl: string } | undefined;
    places: Place[];
    highlightedPlaces: Place[] | null;
    isFilterActive: boolean;
    selectedPlace: Place | null;
    searchSelectedItem: Place | null;
    onPlaceSelect: (place: Place | null) => void;
    mapControllerRef: React.RefObject<ReactZoomPanPinchRef | null>;
    isLocatingKiosk: boolean;
    isAnimatingPath: boolean;
    onMapInteraction: () => void;
    children?: React.ReactNode;
    currentScale: number;
    onScaleChange: (scale: number) => void;
}

export function MapView({
    kiosk, floorPlan, places, highlightedPlaces, isFilterActive,
    selectedPlace, searchSelectedItem, onPlaceSelect, mapControllerRef,
    isLocatingKiosk, isAnimatingPath, onMapInteraction, children, currentScale, onScaleChange
}: MapViewProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const [mapData, setMapData] = useState<MapData | null>(null);

    useEffect(() => {
        if (!floorPlan) {
            setMapData(null);
            return;
        }

        // Preload the image to get its dimensions before rendering
        const img = new window.Image();
        img.src = getAssetUrl(floorPlan.imageUrl);

        img.onload = () => {
            // Only update if the floor plan is still the one we want
            setMapData(prevMapData => {
                const newMapData = {
                    id: floorPlan.id,
                    imageUrl: floorPlan.imageUrl,
                    width: img.naturalWidth,
                    height: img.naturalHeight,
                };
                // Avoid unnecessary re-renders if data is the same
                if (JSON.stringify(prevMapData) === JSON.stringify(newMapData)) {
                    return prevMapData;
                }
                return newMapData;
            });
        };

        img.onerror = () => {
            console.error("Failed to load floor plan image:", img.src);
            setMapData(null); // Or set an error state
        };

    }, [floorPlan]);

    const initialTransform = useMemo(() => {
        if (!mapData || !mapContainerRef.current) return null;

        const container = mapContainerRef.current;
        const PADDING = 48;
        const viewWidth = container.offsetWidth;
        const viewHeight = container.offsetHeight;

        if (viewWidth === 0 || viewHeight === 0) return null;

        const scaleX = viewWidth / (mapData.width + PADDING * 2);
        const scaleY = viewHeight / (mapData.height + PADDING * 2);
        const scale = Math.min(scaleX, scaleY);

        const x = (viewWidth - mapData.width * scale) / 2;
        const y = (viewHeight - mapData.height * scale) / 2;

        return { scale, x, y };
    }, [mapData]);

    useEffect(() => {
        const controller = mapControllerRef.current;
        const container = mapContainerRef.current;
        if (!controller || !container || !selectedPlace || !mapData) return;

        const kioskPixelCoords = {
            x: (kiosk.locationX / 100) * mapData.width,
            y: (kiosk.locationY / 100) * mapData.height,
        };
        const placePixelCoords = {
            x: (selectedPlace.locationX / 100) * mapData.width,
            y: (selectedPlace.locationY / 100) * mapData.height,
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
    }, [selectedPlace, kiosk, mapControllerRef, mapData]);

    useEffect(() => {
        if ((isLocatingKiosk || searchSelectedItem) && mapControllerRef.current) {
            mapControllerRef.current.resetTransform(600, "easeOut");
        }
    }, [isLocatingKiosk, searchSelectedItem, mapControllerRef]);

    const highlightedPlaceIds = useMemo(() => {
        if (!highlightedPlaces) return null;
        return new Set(highlightedPlaces.map(p => p.id));
    }, [highlightedPlaces]);

    return (
        <div ref={mapContainerRef} className="h-full w-full bg-muted overflow-hidden" data-selected={!!selectedPlace}>
            {!mapData || !initialTransform ? (
                <div className="flex items-center justify-center h-full w-full">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
            ) : (
                <TransformWrapper
                    ref={mapControllerRef}
                    key={mapData.id} // This is crucial for re-initializing the component on floor change
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
                    onPanningStart={onMapInteraction}
                    onPinchingStart={onMapInteraction}
                    onWheelStart={onMapInteraction}
                >
                    {children}
                    <TransformComponent wrapperClass="!w-full !h-full" contentClass="">
                        <div
                            className="relative"
                            style={{ width: mapData.width, height: mapData.height }}
                            onClick={(e) => { if (e.target === e.currentTarget) { onPlaceSelect(null); } }}
                        >
                            <img
                                src={getAssetUrl(mapData.imageUrl)}
                                alt="Floor Plan"
                                className="pointer-events-none block"
                            />

                            {kiosk.floorPlan.id === mapData.id && (
                                <KioskPin x={kiosk.locationX} y={kiosk.locationY} name={kiosk.name} isPulsing={isLocatingKiosk || isAnimatingPath} mapScale={currentScale} />
                            )}
                            {places.map(place => {
                                const isDimmed = isFilterActive && highlightedPlaceIds ? !highlightedPlaceIds.has(place.id) : false;
                                const isPulsing = isAnimatingPath && place.id === searchSelectedItem?.id;
                                const isCurrentlySelected = selectedPlace?.id === place.id || searchSelectedItem?.id === place.id;

                                return (
                                    <PlacePin
                                        key={place.id}
                                        place={place}
                                        isSelected={isCurrentlySelected}
                                        onClick={() => onPlaceSelect(place)}
                                        mapScale={currentScale}
                                        isDimmed={isDimmed}
                                        isPulsing={isPulsing}
                                    />
                                );
                            })}
                        </div>
                    </TransformComponent>
                </TransformWrapper>
            )}
        </div>
    );
}

import { useRef, useEffect, useState, useMemo } from 'react';
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
    onTransform: (state: { scale: number; positionX: number; positionY: number }) => void;
}

export function MapView({
    kiosk, floorPlan, places, highlightedPlaces, isFilterActive,
    selectedPlace, searchSelectedItem, onPlaceSelect, mapControllerRef,
    isLocatingKiosk, isAnimatingPath, onMapInteraction, children, currentScale, onTransform
}: MapViewProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const [mapData, setMapData] = useState<MapData | null>(null);

    useEffect(() => {
        if (!floorPlan) {
            setMapData(null);
            return;
        }

        const img = new window.Image();
        img.src = getAssetUrl(floorPlan.imageUrl);

        img.onload = () => {
            setMapData(prevMapData => {
                const newMapData = {
                    id: floorPlan.id,
                    imageUrl: floorPlan.imageUrl,
                    width: img.naturalWidth,
                    height: img.naturalHeight,
                };
                if (JSON.stringify(prevMapData) === JSON.stringify(newMapData)) {
                    return prevMapData;
                }
                return newMapData;
            });
        };

        img.onerror = () => {
            console.error("Failed to load floor plan image:", img.src);
            setMapData(null);
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
        const targetPlace = selectedPlace || searchSelectedItem;

        if (!controller || !container || !targetPlace || !mapData) return;

        const placePixelCoords = {
            x: (targetPlace.locationX / 100) * mapData.width,
            y: (targetPlace.locationY / 100) * mapData.height,
        };

        const timer = setTimeout(() => {
            const viewSize = { width: container.offsetWidth, height: container.offsetHeight };
            const isShowingPathFromSearch = searchSelectedItem && isAnimatingPath;

            if (isShowingPathFromSearch) {
                if (kiosk.floorPlan.id === floorPlan?.id) {
                    const kioskPixelCoords = {
                        x: (kiosk.locationX / 100) * mapData.width,
                        y: (kiosk.locationY / 100) * mapData.height,
                    };
                    const transform = getTransformForBounds(
                        kioskPixelCoords,
                        placePixelCoords,
                        viewSize, 400
                    );
                    controller.setTransform(transform.x, transform.y, transform.scale, 300, 'easeOut');
                } else {
                    controller.resetTransform(300, 'easeOut');
                }
            } else if (selectedPlace) {
                const zoomScale = 0.6;
                const transform = {
                    x: (viewSize.width / 2) - (placePixelCoords.x * zoomScale),
                    y: (viewSize.height / 2) - (placePixelCoords.y * zoomScale),
                    scale: zoomScale,
                };
                controller.setTransform(transform.x, transform.y, transform.scale, 300, 'easeOut');
            }
        }, 100);

        return () => clearTimeout(timer);
    }, [selectedPlace, searchSelectedItem, isAnimatingPath, kiosk, floorPlan, mapControllerRef, mapData]);


    useEffect(() => {
        if ((isLocatingKiosk) && mapControllerRef.current) {
            mapControllerRef.current.resetTransform(600, "easeOut");
        }
    }, [isLocatingKiosk, mapControllerRef]);

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
                    key={mapData.id}
                    initialScale={initialTransform.scale}
                    initialPositionX={initialTransform.x}
                    initialPositionY={initialTransform.y}
                    minScale={0.2}
                    maxScale={3}
                    limitToBounds={true}
                    panning={{ velocityDisabled: false }}
                    wheel={{ step: 0.2 }}
                    doubleClick={{ disabled: true }}
                    onTransformed={(_ref, state) => onTransform(state)}
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
                                <KioskPin
                                    x={kiosk.locationX}
                                    y={kiosk.locationY}
                                    name={kiosk.name}
                                    isPulsing={isLocatingKiosk || (isAnimatingPath && kiosk.floorPlan.id === floorPlan?.id)}
                                    mapScale={currentScale}
                                    isLocatingKiosk={isLocatingKiosk}
                                />
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

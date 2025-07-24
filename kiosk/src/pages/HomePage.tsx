import { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from "sonner";
import type { ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';
import * as api from '@/api/kiosk';
import type { Place, Category, KioskData, FloorPlan } from '@/api/types';
import { useDebounce } from '@/hooks/useDebounce';
import { useInactivityTimer } from '@/hooks/useInactivityTimer';
import { Sidebar } from '@/components/layout/Sidebar';
import { MapView } from '@/components/map/MapView';
import { PlaceDetailSheet } from '@/components/details/PlaceDetailSheet';
import { AdOverlay } from '@/components/ads/AdOverlay';
import { MapControls } from '@/components/layout/MapControls';

const KIOSK_ID = import.meta.env.VITE_KIOSK_ID;

export default function HomePage() {
    const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
    const [currentFloorPlanId, setCurrentFloorPlanId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategoryIds, setActiveCategoryIds] = useState<string[]>([]);
    const [isInactive, setIsInactive] = useState(false);
    const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);
    const mapControllerRef = useRef<ReactZoomPanPinchRef>(null);

    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    useInactivityTimer(() => setIsInactive(true), 60000);

    useEffect(() => {
        if (isInactive) {
            setIsDetailSheetOpen(false);
            setSelectedPlace(null);
        }
    }, [isInactive]);

    const { data: kioskData, isLoading: isLoadingKiosk } = useQuery<KioskData>({
        queryKey: ['kioskData', KIOSK_ID],
        queryFn: () => {
            if (!KIOSK_ID) {
                toast.error("Kiosk ID is not configured.", { description: "Please set VITE_KIOSK_ID in your .env file." });
                throw new Error("Kiosk ID missing");
            }
            return api.getKioskData(KIOSK_ID);
        },
        enabled: !!KIOSK_ID, retry: false, refetchOnWindowFocus: false, staleTime: Infinity,
    });

    useEffect(() => {
        if (kioskData && !currentFloorPlanId) setCurrentFloorPlanId(kioskData.floorPlan.id);
    }, [kioskData, currentFloorPlanId]);

    const { data: floorPlans = [] } = useQuery<FloorPlan[]>({
        queryKey: ['floorPlans'],
        queryFn: api.getFloorPlans,
        staleTime: 1000 * 60 * 5,
    });

    const { data: places = [] } = useQuery<Place[]>({
        queryKey: ['places', debouncedSearchTerm, activeCategoryIds, kioskData?.id],
        queryFn: () => api.getPlaces({
            searchTerm: debouncedSearchTerm,
            categoryIds: activeCategoryIds,
            kioskId: kioskData?.id,
        }),
        enabled: !!kioskData?.id,
    });

    const { data: categories = [] } = useQuery<Category[]>({
        queryKey: ['categories'],
        queryFn: api.getCategories,
        staleTime: 1000 * 60 * 5,
    });

    const currentFloorPlan = useMemo(() => floorPlans.find(fp => fp.id === currentFloorPlanId), [floorPlans, currentFloorPlanId]);
    const placesOnCurrentFloor = useMemo(() => places.filter(p => p.floorPlan.id === currentFloorPlanId), [places, currentFloorPlanId]);

    const handlePlaceSelect = (place: Place | null) => {
        setSelectedPlace(place);
        setIsDetailSheetOpen(!!place);
        if (debouncedSearchTerm && place && kioskData) {
            api.logPlaceSelection({
                searchTerm: debouncedSearchTerm,
                placeId: place.id,
                kioskId: kioskData.id,
            });
        }
    };

    const handleCategoryToggle = (categoryId: string | null) => {
        if (categoryId === null) {
            setActiveCategoryIds([]);
            return;
        }

        setActiveCategoryIds(prevIds => {
            if (prevIds.includes(categoryId)) {
                return prevIds.filter(id => id !== categoryId);
            } else {
                return [...prevIds, categoryId];
            }
        });
    };

    const handleSheetOpenChange = (open: boolean) => {
        setIsDetailSheetOpen(open);
        if (!open) setSelectedPlace(null);
    };

    const resetFilters = () => {
        setSearchTerm('');
        setActiveCategoryIds([]);
    }

    const resetView = () => {
        setIsInactive(false);
        handlePlaceSelect(null);
        resetFilters();
        if (kioskData) setCurrentFloorPlanId(kioskData.floorPlan.id);
        mapControllerRef.current?.resetTransform(300);
    };

    if (isLoadingKiosk) return <div className="flex items-center justify-center h-screen text-lg">Initializing Kiosk...</div>;
    if (!kioskData) return <div className="flex items-center justify-center h-screen text-lg text-destructive">Kiosk could not be loaded. Check configuration.</div>;

    return (
        <div className="h-screen w-screen">
            <div className="h-full w-full bg-background overflow-hidden relative">
                <MapView
                    kiosk={kioskData}
                    floorPlan={currentFloorPlan}
                    places={placesOnCurrentFloor}
                    selectedPlace={selectedPlace}
                    onPlaceSelect={handlePlaceSelect}
                    mapControllerRef={mapControllerRef}
                >
                    <MapControls
                        floorPlans={floorPlans}
                        currentFloorPlanId={currentFloorPlanId}
                        onFloorChange={setCurrentFloorPlanId}
                        kioskFloorId={kioskData.floorPlan.id}
                    />
                </MapView>
                <Sidebar
                    categories={categories}
                    activeCategoryIds={activeCategoryIds}
                    onCategoryToggle={handleCategoryToggle}
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    onClearFilters={resetFilters}
                />
                <PlaceDetailSheet
                    place={selectedPlace}
                    isOpen={isDetailSheetOpen}
                    onOpenChange={handleSheetOpenChange}
                    onPlaceSelect={handlePlaceSelect}
                />
                {isInactive && <AdOverlay onInteraction={resetView} />}
            </div>
        </div>
    );
}

import { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from "sonner";
import type { ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';

// API and types
import * as api from '@/api/kiosk';
import type { Place, Category, KioskData, FloorPlan } from '@/api/types';

// Hooks
import { useDebounce } from '@/hooks/useDebounce';
import { useInactivityTimer } from '@/hooks/useInactivityTimer';

// Components
import { Sidebar } from '@/components/layout/Sidebar';
import { MapView } from '@/components/map/MapView';
import { PlaceDetailSheet } from '@/components/details/PlaceDetailSheet';
import { AdOverlay } from '@/components/ads/AdOverlay';
import { MapControls } from '@/components/layout/MapControls';

// Get Kiosk ID from environment variables
const KIOSK_ID = import.meta.env.VITE_KIOSK_ID;

export default function HomePage() {
    // --- STATE MANAGEMENT ---
    const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
    const [currentFloorPlanId, setCurrentFloorPlanId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
    const [isInactive, setIsInactive] = useState(false);
    const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);
    const mapControllerRef = useRef<ReactZoomPanPinchRef>(null);

    // --- HOOKS ---
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    // --- MODIFICATION ---
    // Create a handler for inactivity that also closes the details sheet.
    const handleInactivity = () => {
        setIsInactive(true);
        handlePlaceSelect(null); // This closes the sheet and clears the selection
    };

    useInactivityTimer(handleInactivity, 60000);

    // --- DATA FETCHING ---
    const { data: kioskData, isLoading: isLoadingKiosk } = useQuery<KioskData>({
        queryKey: ['kioskData', KIOSK_ID],
        queryFn: () => {
            if (!KIOSK_ID) {
                toast.error("Kiosk ID is not configured.", { description: "Please set VITE_KIOSK_ID in your .env file." });
                throw new Error("Kiosk ID missing");
            }
            return api.getKioskData(KIOSK_ID);
        },
        enabled: !!KIOSK_ID,
        retry: false,
        refetchOnWindowFocus: false,
        staleTime: Infinity,
    });

    useEffect(() => {
        if (kioskData && !currentFloorPlanId) {
            setCurrentFloorPlanId(kioskData.floorPlan.id);
        }
    }, [kioskData, currentFloorPlanId]);

    const { data: floorPlans = [] } = useQuery<FloorPlan[]>({
        queryKey: ['floorPlans'],
        queryFn: api.getFloorPlans,
        staleTime: 1000 * 60 * 5,
    });

    const { data: places = [] } = useQuery<Place[]>({
        queryKey: ['places', debouncedSearchTerm, activeCategoryId],
        queryFn: () => api.getPlaces({ searchTerm: debouncedSearchTerm, categoryId: activeCategoryId }),
    });

    const { data: categories = [] } = useQuery<Category[]>({
        queryKey: ['categories'],
        queryFn: api.getCategories,
        staleTime: 1000 * 60 * 5,
    });

    // --- MEMOIZED VALUES ---
    const currentFloorPlan = useMemo(() => {
        return floorPlans.find(fp => fp.id === currentFloorPlanId);
    }, [floorPlans, currentFloorPlanId]);

    const placesOnCurrentFloor = useMemo(() => {
        return places.filter(p => p.floorPlan.id === currentFloorPlanId);
    }, [places, currentFloorPlanId]);

    // --- EVENT HANDLERS ---
    const handlePlaceSelect = (place: Place | null) => {
        setSelectedPlace(place);
        setIsDetailSheetOpen(!!place);
    };

    const handleShowOnMap = (place: Place) => {
        if (place.floorPlan.id !== currentFloorPlanId) {
            setCurrentFloorPlanId(place.floorPlan.id);
        }
        handlePlaceSelect(place);
        setIsDetailSheetOpen(true);
    };

    const resetFilters = () => {
        setSearchTerm('');
        setActiveCategoryId(null);
    }

    const resetView = () => {
        setIsInactive(false);
        handlePlaceSelect(null);
        resetFilters();
        if (kioskData) {
            setCurrentFloorPlanId(kioskData.floorPlan.id);
        }
        mapControllerRef.current?.resetTransform(300);
    };

    // --- RENDER LOGIC ---
    if (isLoadingKiosk) {
        return <div className="flex items-center justify-center h-screen text-lg">Initializing Kiosk...</div>;
    }

    if (!kioskData) {
        return <div className="flex items-center justify-center h-screen text-lg text-destructive">Kiosk could not be loaded. Check configuration.</div>;
    }

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
                        kioskFloorId={kioskData.floorPlan.id} // Pass the kiosk's floor ID here
                    />
                </MapView>

                <Sidebar
                    categories={categories}
                    activeCategoryId={activeCategoryId}
                    onCategoryChange={setActiveCategoryId}
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    onClearFilters={resetFilters}
                />

                <PlaceDetailSheet
                    place={selectedPlace}
                    isOpen={isDetailSheetOpen}
                    onOpenChange={setIsDetailSheetOpen}
                    onShowOnMap={handleShowOnMap}
                />

                {isInactive && <AdOverlay onInteraction={resetView} />}
            </div>
        </div>
    );
}

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { toast } from 'sonner';

type SearchStatus = 'idle' | 'loading' | 'no-results' | 'has-results';

const KIOSK_ID = import.meta.env.VITE_KIOSK_ID;

export default function HomePage() {
    const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
    const [currentFloorPlanId, setCurrentFloorPlanId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategoryIds, setActiveCategoryIds] = useState<string[]>([]);
    const [isInactive, setIsInactive] = useState(false);
    const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);
    const [searchStatus, setSearchStatus] = useState<SearchStatus>('idle');
    const [isLocatingKiosk, setIsLocatingKiosk] = useState(false);
    const mapControllerRef = useRef<ReactZoomPanPinchRef>(null);

    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    useInactivityTimer(() => setIsInactive(true), 60000);

    const isSearchActive = !!debouncedSearchTerm;

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
        if (kioskData && !currentFloorPlanId) {
            setCurrentFloorPlanId(kioskData.floorPlan.id);
        }
    }, [kioskData, currentFloorPlanId]);

    const { data: floorPlans = [] } = useQuery<FloorPlan[]>({
        queryKey: ['floorPlans'],
        queryFn: api.getFloorPlans,
        staleTime: 1000 * 60 * 5,
    });

    const sortedActiveCategoryIds = useMemo(() => [...activeCategoryIds].sort(), [activeCategoryIds]);

    const { data: places, isFetching: isFetchingPlaces } = useQuery<Place[]>({
        queryKey: ['places', debouncedSearchTerm, sortedActiveCategoryIds],
        queryFn: () => api.getPlaces({
            searchTerm: debouncedSearchTerm,
            categoryIds: sortedActiveCategoryIds,
            kioskId: kioskData?.id,
        }),
        enabled: !!kioskData?.id,
    });

    const { data: categories = [] } = useQuery<Category[]>({
        queryKey: ['categories'],
        queryFn: api.getCategories,
        staleTime: 1000 * 60 * 5,
    });

    const handlePlaceSelect = useCallback((place: Place | null) => {
        if (place) {
            setCurrentFloorPlanId(place.floorPlan.id);
        }
        setSelectedPlace(place);
        setIsDetailSheetOpen(!!place);

        if (debouncedSearchTerm && place && kioskData) {
            api.logPlaceSelection({
                searchTerm: debouncedSearchTerm,
                placeId: place.id,
                kioskId: kioskData.id,
            });
        }
    }, [kioskData, debouncedSearchTerm]);

    useEffect(() => {
        if (isFetchingPlaces && isSearchActive) {
            setSearchStatus('loading');
        } else if (isSearchActive) {
            setSearchStatus(places && places.length > 0 ? 'has-results' : 'no-results');
        } else {
            setSearchStatus('idle');
        }
    }, [isFetchingPlaces, isSearchActive, places]);


    useEffect(() => {
        if (isInactive) {
            setIsDetailSheetOpen(false);
            setSelectedPlace(null);
        }
    }, [isInactive]);

    const currentFloorPlan = useMemo(() => floorPlans.find(fp => fp.id === currentFloorPlanId), [floorPlans, currentFloorPlanId]);

    const pinsToDisplay = useMemo(() => {
        if (!places) return [];
        return places.filter(p => p.floorPlan.id === currentFloorPlanId);
    }, [places, currentFloorPlanId]);


    const handleCategoryToggle = (categoryId: string | null) => {
        setSearchTerm('');
        if (categoryId === null) {
            setActiveCategoryIds([]);
            return;
        }
        setActiveCategoryIds(prevIds =>
            prevIds.includes(categoryId)
                ? prevIds.filter(id => id !== categoryId)
                : [...prevIds, categoryId]
        );
    };

    const handleSearchChange = (term: string) => {
        setSearchTerm(term);
        setActiveCategoryIds([]);
    };

    const handleSheetOpenChange = (open: boolean) => {
        setIsDetailSheetOpen(open);
        if (!open) setSelectedPlace(null);
    };

    const resetView = () => {
        setIsInactive(false);
        handlePlaceSelect(null);
        setSearchTerm('');
        setActiveCategoryIds([]);
        if (kioskData) setCurrentFloorPlanId(kioskData.floorPlan.id);
        mapControllerRef.current?.resetTransform(300);
    };

    const handleLocateKiosk = () => {
        if (!kioskData || !mapControllerRef.current) return;
        const controller = mapControllerRef.current;
        const { instance } = controller;
        const { wrapperComponent } = instance;

        if (!wrapperComponent) return;

        setSelectedPlace(null);
        setCurrentFloorPlanId(kioskData.floorPlan.id);

        const scale = 1.2;
        const x = (wrapperComponent.offsetWidth / 2) - (kioskData.locationX * scale);
        const y = (wrapperComponent.offsetHeight / 2) - (kioskData.locationY * scale);

        controller.setTransform(x, y, scale, 300, "easeOut");

        setIsLocatingKiosk(true);
        setTimeout(() => setIsLocatingKiosk(false), 2500);
    };

    if (isLoadingKiosk) return <div className="flex items-center justify-center h-screen text-lg">Initializing Kiosk...</div>;
    if (!kioskData) return <div className="flex items-center justify-center h-screen text-lg text-destructive">Kiosk could not be loaded. Check configuration.</div>;

    return (
        <div className="h-screen w-screen">
            <div className="h-full w-full bg-background overflow-hidden relative">
                <MapView
                    kiosk={kioskData}
                    floorPlan={currentFloorPlan}
                    places={pinsToDisplay}
                    selectedPlace={selectedPlace}
                    onPlaceSelect={handlePlaceSelect}
                    mapControllerRef={mapControllerRef}
                    onLocateKiosk={handleLocateKiosk}
                    isLocatingKiosk={isLocatingKiosk}
                >
                    <MapControls
                        floorPlans={floorPlans}
                        currentFloorPlanId={currentFloorPlanId}
                        onFloorChange={setCurrentFloorPlanId}
                        kioskFloorId={kioskData.floorPlan.id}
                        floorResultCounts={{}}
                        onLocateKiosk={handleLocateKiosk}
                    />
                </MapView>
                <Sidebar
                    categories={categories}
                    activeCategoryIds={activeCategoryIds}
                    onCategoryToggle={handleCategoryToggle}
                    searchTerm={searchTerm}
                    onSearchChange={handleSearchChange}
                    searchStatus={searchStatus}
                    searchResults={places || []}
                    onSearchResultClick={handlePlaceSelect}
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

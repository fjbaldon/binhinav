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
import { FloorTransitionOverlay } from '@/components/map/FloorTransitionOverlay';
import { toast } from 'sonner';
import { Info } from 'lucide-react';

type SearchStatus = 'idle' | 'loading' | 'no-results' | 'has-results';

export default function HomePage({ kioskId }: { kioskId: string }) {
    const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
    const [searchSelectedItem, setSearchSelectedItem] = useState<Place | null>(null);
    const [isAnimatingPath, setIsAnimatingPath] = useState(false);
    const [currentFloorPlanId, setCurrentFloorPlanId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategoryIds, setActiveCategoryIds] = useState<string[]>([]);
    const [isInactive, setIsInactive] = useState(false);
    const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);
    const [searchStatus, setSearchStatus] = useState<SearchStatus>('idle');
    const [isLocatingKiosk, setIsLocatingKiosk] = useState(false);
    const [currentMapScale, setCurrentMapScale] = useState(1);
    const [transitioningToFloor, setTransitioningToFloor] = useState<string | null>(null);
    const mapControllerRef = useRef<ReactZoomPanPinchRef>(null);
    const [viewState, setViewState] = useState<'overview' | 'detail'>('overview');
    const overviewMapState = useRef<{ scale: number; positionX: number; positionY: number } | null>(null);

    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    useInactivityTimer(() => setIsInactive(true), 60000);

    const isFilterActive = useMemo(() => debouncedSearchTerm.length > 0 || activeCategoryIds.length > 0, [debouncedSearchTerm, activeCategoryIds]);

    const { data: kioskData, isLoading: isLoadingKiosk } = useQuery<KioskData>({
        queryKey: ['kioskData', kioskId],
        queryFn: () => {
            if (!kioskId) {
                throw new Error("Kiosk ID is missing");
            }
            return api.getKioskData(kioskId);
        },
        enabled: !!kioskId,
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

    const { data: allPlaces = [] } = useQuery<Place[]>({
        queryKey: ['allPlaces'],
        queryFn: () => api.getPlaces({}),
        staleTime: 1000 * 60 * 5,
    });

    const sortedActiveCategoryIds = useMemo(() => [...activeCategoryIds].sort(), [activeCategoryIds]);

    const { data: filteredPlaces, isFetching: isFetchingPlaces } = useQuery<Place[]>({
        queryKey: ['places', debouncedSearchTerm, sortedActiveCategoryIds],
        queryFn: () => api.getPlaces({
            searchTerm: debouncedSearchTerm,
            categoryIds: debouncedSearchTerm ? [] : sortedActiveCategoryIds,
            kioskId: kioskData?.id,
        }),
        enabled: !!kioskData?.id && isFilterActive,
    });

    const { data: categories = [] } = useQuery<Category[]>({
        queryKey: ['categories'],
        queryFn: api.getCategories,
        staleTime: 1000 * 60 * 5,
    });

    const floorResultCounts = useMemo(() => {
        if (!isFilterActive || !filteredPlaces) {
            return {};
        }
        return filteredPlaces.reduce((acc, place) => {
            const floorId = place.floorPlan.id;
            acc[floorId] = (acc[floorId] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
    }, [isFilterActive, filteredPlaces]);

    const performFloorTransition = (place: Place, action: () => void) => {
        if (place.floorPlan.id !== currentFloorPlanId) {
            setTransitioningToFloor(place.floorPlan.name);
            setTimeout(() => {
                action();
                setTransitioningToFloor(null);
            }, 1500);
        } else {
            action();
        }
    };

    const handleSheetOpenChange = (open: boolean) => {
        setIsDetailSheetOpen(open);
        if (!open) {
            setSelectedPlace(null);
            setIsAnimatingPath(false);

            if (mapControllerRef.current && overviewMapState.current) {
                const { scale, positionX, positionY } = overviewMapState.current;
                mapControllerRef.current.setTransform(positionX, positionY, scale, 300, 'easeOut');
            }
            setViewState('overview');
        }
    };

    const handlePlaceSelect = useCallback((place: Place | null) => {
        if (!place) {
            handleSheetOpenChange(false);
            return;
        }

        const selectAction = () => {
            setCurrentFloorPlanId(place.floorPlan.id);
            setSelectedPlace(place);
            setSearchSelectedItem(null);
            setIsAnimatingPath(false);
            setIsDetailSheetOpen(true);
            setViewState('detail');
        };

        performFloorTransition(place, selectAction);

    }, [currentFloorPlanId]);

    const handleSearchResultSelect = useCallback((place: Place) => {
        if (kioskData && place.floorPlan.id !== kioskData.floorPlan.id) {
            toast(
                <div className="flex items-center gap-5">
                    <Info className="h-10 w-10 text-primary shrink-0" />
                    <div className="flex flex-col">
                        <p className="text-xl font-bold text-primary">Switching to {place.floorPlan.name}</p>
                        <p className="text-base text-muted-foreground">This store is on a different floor.</p>
                    </div>
                </div>,
                {
                    duration: 5000,
                    classNames: {
                        toast: 'bg-secondary border-border p-6',
                    },
                }
            );
        }

        const selectAction = () => {
            setSelectedPlace(null);
            setIsDetailSheetOpen(false);
            setCurrentFloorPlanId(place.floorPlan.id);
            setSearchSelectedItem(place);
            setIsAnimatingPath(true);
            setViewState('detail');

            if (debouncedSearchTerm && kioskData) {
                api.logPlaceSelection({
                    searchTerm: debouncedSearchTerm,
                    placeId: place.id,
                    kioskId: kioskData.id,
                });
            }
        };

        performFloorTransition(place, selectAction);
    }, [kioskData, debouncedSearchTerm, currentFloorPlanId]);

    const handleShowOnMap = useCallback((place: Place) => {
        const showAction = () => {
            setIsDetailSheetOpen(false);
            setCurrentFloorPlanId(place.floorPlan.id);
            setSearchSelectedItem(place);
            setIsAnimatingPath(true);
            setViewState('detail');
        };

        performFloorTransition(place, showAction);
    }, [currentFloorPlanId]);


    useEffect(() => {
        if (isFetchingPlaces && isFilterActive) {
            setSearchStatus('loading');
        } else if (isFilterActive) {
            setSearchStatus(filteredPlaces && filteredPlaces.length > 0 ? 'has-results' : 'no-results');
        } else {
            setSearchStatus('idle');
        }
    }, [isFetchingPlaces, isFilterActive, filteredPlaces]);


    useEffect(() => {
        if (isInactive) {
            setIsDetailSheetOpen(false);
            setSelectedPlace(null);
            setSearchSelectedItem(null);
            setIsAnimatingPath(false);
        }
    }, [isInactive]);

    const currentFloorPlan = useMemo(() => floorPlans.find(fp => fp.id === currentFloorPlanId), [floorPlans, currentFloorPlanId]);

    const pinsToDisplay = useMemo(() => {
        return allPlaces.filter(p => p.floorPlan.id === currentFloorPlanId);
    }, [allPlaces, currentFloorPlanId]);

    const handleCategoryToggle = (categoryId: string | null) => {
        setSearchTerm('');
        setIsAnimatingPath(false);
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

    const handleCategorySelectFromSearch = (categoryId: string) => {
        setSearchTerm('');
        setIsAnimatingPath(false);
        setActiveCategoryIds(prevIds => {
            if (prevIds.includes(categoryId)) {
                return prevIds;
            }
            return [...prevIds, categoryId];
        });
    };

    const handleSearchChange = (term: string) => {
        setSearchTerm(term);
        setIsAnimatingPath(false);
    };

    const resetView = useCallback(() => {
        setIsInactive(false);
        setIsDetailSheetOpen(false);
        setSelectedPlace(null);
        setSearchSelectedItem(null);
        setSearchTerm('');
        setActiveCategoryIds([]);
        setIsAnimatingPath(false);
        if (kioskData) setCurrentFloorPlanId(kioskData.floorPlan.id);
        mapControllerRef.current?.resetTransform(300);
        setViewState('overview');
    }, [kioskData]);

    const handleLocateKiosk = () => {
        if (!kioskData) return;

        const locateAction = () => {
            setSelectedPlace(null);
            setSearchSelectedItem(null);
            setIsAnimatingPath(false);
            setCurrentFloorPlanId(kioskData.floorPlan.id);
            setIsLocatingKiosk(true);
            setTimeout(() => setIsLocatingKiosk(false), 3500);
        }

        if (kioskData.floorPlan.id !== currentFloorPlanId) {
            setTransitioningToFloor(kioskData.floorPlan.name);
            setTimeout(() => {
                locateAction();
                setTransitioningToFloor(null);
            }, 1500);
        } else {
            locateAction();
        }
    };

    const handleMapInteraction = useCallback(() => {
        if (isAnimatingPath) {
            setIsAnimatingPath(false);
        }
        if (searchSelectedItem) {
            setSearchSelectedItem(null);
        }
    }, [isAnimatingPath, searchSelectedItem]);

    const handleMapTransform = useCallback((state: { scale: number; positionX: number; positionY: number }) => {
        setCurrentMapScale(state.scale);
        if (viewState === 'overview') {
            overviewMapState.current = {
                scale: state.scale,
                positionX: state.positionX,
                positionY: state.positionY,
            };
        }
    }, [viewState]);

    const searchResultsForSidebar = useMemo(() => {
        if (!isFilterActive) return [];
        return filteredPlaces || [];
    }, [isFilterActive, filteredPlaces]);

    const isSearchMode = searchTerm.length > 0;

    if (isLoadingKiosk) return <div className="flex items-center justify-center h-screen text-lg">Initializing Kiosk...</div>;
    if (!kioskData) return <div className="flex items-center justify-center h-screen text-lg text-destructive">Kiosk could not be loaded. Check configuration.</div>;

    return (
        <main className="relative h-screen w-screen p-6 flex flex-row gap-6 bg-background overflow-hidden">
            <Sidebar
                categories={categories}
                activeCategoryIds={activeCategoryIds}
                onCategoryToggle={handleCategoryToggle}
                onCategorySelectFromSearch={handleCategorySelectFromSearch}
                searchTerm={searchTerm}
                onSearchChange={handleSearchChange}
                searchStatus={searchStatus}
                searchResults={isSearchMode ? searchResultsForSidebar : (filteredPlaces || [])}
                onSearchResultClick={handleSearchResultSelect}
                isFilterActive={isFilterActive}
                onResetSearch={resetView}
            />
            <div className="relative flex-1 h-full rounded-2xl overflow-hidden group">
                <MapView
                    kiosk={kioskData}
                    floorPlan={currentFloorPlan}
                    places={pinsToDisplay}
                    highlightedPlaces={isFilterActive ? (filteredPlaces ?? []) : allPlaces}
                    isFilterActive={isFilterActive}
                    selectedPlace={selectedPlace}
                    searchSelectedItem={searchSelectedItem}
                    onPlaceSelect={handlePlaceSelect}
                    mapControllerRef={mapControllerRef}
                    isLocatingKiosk={isLocatingKiosk}
                    isAnimatingPath={isAnimatingPath}
                    onMapInteraction={handleMapInteraction}
                    currentScale={currentMapScale}
                    onTransform={handleMapTransform}
                >
                    <MapControls
                        floorPlans={floorPlans}
                        currentFloorPlanId={currentFloorPlanId}
                        onFloorChange={setCurrentFloorPlanId}
                        kioskFloorId={kioskData.floorPlan.id}
                        floorResultCounts={floorResultCounts}
                        onLocateKiosk={handleLocateKiosk}
                    />
                </MapView>
                <FloorTransitionOverlay isOpen={!!transitioningToFloor} floorName={transitioningToFloor || ''} />
                <PlaceDetailSheet
                    place={selectedPlace}
                    isOpen={isDetailSheetOpen}
                    onOpenChange={handleSheetOpenChange}
                    onShowOnMap={handleShowOnMap}
                />
            </div>
            {isInactive && <AdOverlay onInteraction={resetView} />}
        </main>
    );
}

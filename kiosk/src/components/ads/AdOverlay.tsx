import { useQuery } from '@tanstack/react-query';
import useEmblaCarousel, { type UseEmblaCarouselType } from 'embla-carousel-react';
import { getActiveAds } from '@/api/kiosk';
import { getAssetUrl } from '@/api';
import { Hand } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

type EmblaApiType = UseEmblaCarouselType[1];

interface AdOverlayProps {
    onInteraction: () => void;
}

export function AdOverlay({ onInteraction }: AdOverlayProps) {
    const { data: ads = [], isLoading } = useQuery({
        queryKey: ['activeAds'],
        queryFn: getActiveAds,
        staleTime: 1000 * 60,
    });

    const [emblaRef, emblaApi] = useEmblaCarousel({
        loop: true,
        watchDrag: false,
    });

    const imageTimerRef = useRef<number | null>(null);
    const [isExiting, setIsExiting] = useState(false);

    const skipBrokenSlide = useCallback(() => {
        emblaApi?.scrollNext();
    }, [emblaApi]);

    const handleVideoEnd = useCallback(() => {
        emblaApi?.scrollNext();
    }, [emblaApi]);

    const playActiveVideo = useCallback((api: EmblaApiType | undefined) => {
        if (!api) return;
        const activeIndex = api.selectedScrollSnap();
        const activeAd = ads[activeIndex];
        if (activeAd?.type === 'video') {
            const video = api.slideNodes()[activeIndex]?.querySelector('video');
            if (video) {
                video.play().catch(e => console.error("Video play failed:", e));
            }
        }
    }, [ads]);

    const handleSelect = useCallback((api: EmblaApiType | undefined) => {
        if (!api) return;
        if (imageTimerRef.current) clearTimeout(imageTimerRef.current);

        api.slideNodes().forEach(slideNode => {
            const video = slideNode.querySelector('video');
            if (video) {
                video.pause();
                video.currentTime = 0;
            }
        });

        const selectedIndex = api.selectedScrollSnap();
        const selectedAd = ads[selectedIndex];
        if (!selectedAd) return;

        if (selectedAd.type === 'video') {
            playActiveVideo(api);
        } else {
            imageTimerRef.current = window.setTimeout(() => api.scrollNext(), 5000);
        }
    }, [ads, playActiveVideo]);

    const handleExit = useCallback(() => {
        if (isExiting) return;
        setIsExiting(true);
        setTimeout(() => {
            onInteraction();
        }, 300);
    }, [onInteraction, isExiting]);

    useEffect(() => {
        if (!emblaApi || ads.length === 0) return;

        const handleVisibilityChange = () => {
            if (!emblaApi) return;
            if (document.visibilityState === 'hidden') {
                if (imageTimerRef.current) clearTimeout(imageTimerRef.current);
                const activeVideo = emblaApi.slideNodes()[emblaApi.selectedScrollSnap()]?.querySelector('video');
                activeVideo?.pause();
            } else if (document.visibilityState === 'visible') {
                handleSelect(emblaApi);
            }
        };

        emblaApi.on('select', handleSelect);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        if (document.visibilityState === 'visible') {
            handleSelect(emblaApi);
        }

        return () => {
            emblaApi.off('select', handleSelect);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (imageTimerRef.current) clearTimeout(imageTimerRef.current);
        };
    }, [emblaApi, ads, handleSelect]);

    if (isLoading || ads.length === 0) {
        return null;
    }

    return (
        <div
            className={cn(
                "fixed inset-0 bg-black/80 z-[60] flex flex-col items-center justify-center duration-300",
                isExiting ? 'animate-out fade-out' : 'animate-in fade-in'
            )}
            onClick={handleExit}
        >
            <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-black/40 to-transparent pointer-events-none z-[1]" />
            <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black/40 to-transparent pointer-events-none z-[1]" />

            <div className="absolute top-8 left-8 flex items-center gap-4 text-white z-10 pointer-events-none select-none">
                <img src="/binhinav-logo.svg" alt="Binhinav Logo" className="h-12 w-12 brightness-0 invert drop-shadow-lg" />
                <div>
                    <h1 className="text-3xl font-bold tracking-tight drop-shadow-lg">binhinav</h1>
                    <p className="text-lg text-white/80 drop-shadow-lg">Interactive Directory</p>
                </div>
            </div>

            <div className="embla w-full h-full overflow-hidden" ref={emblaRef}>
                <div className="embla__container h-full flex">
                    {ads.map((ad, index) => (
                        <div key={ad.id} className="embla__slide h-full flex-[0_0_100%] flex items-center justify-center">
                            <div className="w-full aspect-video bg-muted/20 rounded-2xl overflow-hidden shadow-2xl">
                                {ad.type === 'video' ? (
                                    <video
                                        onEnded={handleVideoEnd}
                                        onCanPlay={() => {
                                            if (emblaApi?.selectedScrollSnap() === index) {
                                                playActiveVideo(emblaApi);
                                            }
                                        }}
                                        onError={skipBrokenSlide}
                                        src={getAssetUrl(ad.fileUrl)}
                                        className="w-full h-full object-cover"
                                        muted
                                        playsInline
                                    />
                                ) : (
                                    <img
                                        onError={skipBrokenSlide}
                                        src={getAssetUrl(ad.fileUrl)}
                                        alt={ad.name}
                                        className="w-full h-full object-cover"
                                    />
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div
                className="absolute bottom-12 flex items-center gap-4 text-white animate-pulse cursor-pointer select-none z-10"
                onClick={(e) => {
                    e.stopPropagation();
                    handleExit();
                }}
            >
                <Hand className="h-10 w-10 drop-shadow-lg" />
                <span className="text-3xl font-semibold tracking-tight drop-shadow-lg">Tap to Continue</span>
            </div>
        </div>
    );
}

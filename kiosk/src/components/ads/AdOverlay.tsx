import { useQuery } from '@tanstack/react-query';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { getActiveAds } from '@/api/kiosk';
import { getAssetUrl } from '@/api';
import { Hand } from 'lucide-react';

interface AdOverlayProps {
    onInteraction: () => void;
}

export function AdOverlay({ onInteraction }: AdOverlayProps) {
    const { data: ads = [], isLoading } = useQuery({
        queryKey: ['activeAds'],
        queryFn: getActiveAds,
        staleTime: 1000 * 60, // 1 minute
    });

    const [emblaRef] = useEmblaCarousel({ loop: true }, [
        Autoplay({ delay: 5000 }), // Change slide every 5 seconds
    ]);

    if (isLoading || ads.length === 0) {
        return null; // Don't show overlay if there are no ads or it's loading
    }

    return (
        <div
            className="fixed inset-0 bg-black/80 z-[60] flex flex-col items-center justify-center animate-in fade-in"
            onClick={onInteraction}
        >
            {/* Informational Branding in Top-Left Corner */}
            <div className="absolute top-8 left-8 flex items-center gap-4 text-white z-10 pointer-events-none select-none">
                <img src="/binhinav-logo.svg" alt="Binhinav Logo" className="h-12 w-12 brightness-0 invert" />
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">binhinav</h1>
                    <p className="text-lg text-white/80">Interactive Directory</p>
                </div>
            </div>

            <div className="embla w-full h-full overflow-hidden" ref={emblaRef}>
                <div className="embla__container h-full flex">
                    {ads.map(ad => (
                        <div key={ad.id} className="embla__slide h-full flex-[0_0_100%] flex items-center justify-center">
                            <div className="w-full aspect-video bg-muted/20 rounded-2xl overflow-hidden shadow-2xl">
                                <img
                                    src={getAssetUrl(ad.imageUrl)}
                                    alt={ad.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Redesigned "Tap to Continue" to match branding style */}
            <div
                className="absolute bottom-12 flex items-center gap-4 text-white animate-pulse cursor-pointer select-none z-10"
                onClick={(e) => {
                    e.stopPropagation();
                    onInteraction();
                }}
            >
                <Hand className="h-10 w-10" />
                <span className="text-3xl font-semibold tracking-tight">Tap to Continue</span>
            </div>
        </div>
    );
}

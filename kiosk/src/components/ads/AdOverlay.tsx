import { useQuery } from '@tanstack/react-query';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { getActiveAds } from '@/api/kiosk';
import { getAssetUrl } from '@/api';
import { Button } from '@/components/ui/button';

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
            className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center animate-in fade-in"
            onClick={onInteraction}
        >
            {/* This is the Viewport. It needs to hide the parts of the filmstrip that are off-screen. */}
            <div className="embla w-full h-full overflow-hidden" ref={emblaRef}>
                {/* This is the Container/Filmstrip. It needs to lay out the slides horizontally. */}
                <div className="embla__container h-full flex">
                    {ads.map(ad => (
                        // This is the Slide. It needs a defined width.
                        <div key={ad.id} className="embla__slide h-full flex-[0_0_100%]">
                            <div className="w-full h-full flex items-center justify-center p-8">
                                <img
                                    src={getAssetUrl(ad.imageUrl)}
                                    alt={ad.name}
                                    className="max-w-full max-h-full object-contain"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <Button
                variant="secondary"
                className="absolute bottom-10 h-16 text-xl px-8"
                // Add stopPropagation to prevent the overlay's onClick from also firing
                onClick={(e) => {
                    e.stopPropagation();
                    onInteraction();
                }}
            >
                Tap to Continue
            </Button>
        </div>
    );
}
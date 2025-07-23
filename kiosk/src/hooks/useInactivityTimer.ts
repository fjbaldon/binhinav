import { useEffect, useCallback } from 'react';

export function useInactivityTimer(onInactive: () => void, timeout: number = 30000) {
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

    const resetTimer = useCallback(() => {
        if (window.inactivityTimer) {
            clearTimeout(window.inactivityTimer);
        }
        window.inactivityTimer = setTimeout(onInactive, timeout) as unknown as number;
    }, [onInactive, timeout]);

    useEffect(() => {
        events.forEach(event => {
            window.addEventListener(event, resetTimer);
        });

        resetTimer(); // Initialize timer on mount

        return () => {
            events.forEach(event => {
                window.removeEventListener(event, resetTimer);
            });
            if (window.inactivityTimer) {
                clearTimeout(window.inactivityTimer);
            }
        };
    }, [resetTimer, events]);
}

// Extend the Window interface to include our timer ID
declare global {
    interface Window {
        inactivityTimer: number | undefined;
    }
}

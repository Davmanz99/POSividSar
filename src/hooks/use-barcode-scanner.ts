import { useEffect, useState } from 'react';

/**
 * Hook to detect barcode scanner input.
 * Scanners usually emulate keyboard input, sending characters rapidly followed by 'Enter'.
 */
export function useBarcodeScanner(onScan: (barcode: string) => void) {
    const [barcode, setBarcode] = useState('');
    const [lastKeyTime, setLastKeyTime] = useState(0);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const currentTime = Date.now();
            const timeDiff = currentTime - lastKeyTime;

            // If keys are pressed very fast (scanner speed), append to barcode
            // Manual typing is usually slower (>50ms between keys)
            if (timeDiff > 50) {
                setBarcode(''); // Reset if too slow (manual typing)
            }

            if (e.key === 'Enter') {
                if (barcode.length > 2) { // Minimum length to consider it a barcode
                    onScan(barcode);
                    setBarcode('');
                }
            } else if (e.key.length === 1) { // Printable characters
                setBarcode((prev) => prev + e.key);
            }

            setLastKeyTime(currentTime);
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [barcode, lastKeyTime, onScan]);
}

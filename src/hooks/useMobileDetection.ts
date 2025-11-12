import { useState, useEffect } from 'react';

/**
 * Custom hook to detect mobile devices and handle viewport changes
 * Returns mobile state and viewport dimensions
 * Includes iOS-specific fixes for proper rotation handling
 */
export function useMobileDetection() {
  const [isMobile, setIsMobile] = useState(false);
  const [viewport, setViewport] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    let debounceTimer: NodeJS.Timeout | null = null;
    let orientationTimer: NodeJS.Timeout | null = null;

    // Detect iOS devices (iPhone, iPad, iPod)
    const isIOS = typeof window !== 'undefined' &&
      /iPad|iPhone|iPod/.test(navigator.userAgent);

    /**
     * Get accurate viewport dimensions
     * On iOS, use visualViewport API for real-time accurate dimensions
     * Falls back to window.inner* for other browsers
     */
    const getViewportDimensions = () => {
      if (isIOS && window.visualViewport) {
        // iOS: Use visualViewport for accurate dimensions
        return {
          width: window.visualViewport.width,
          height: window.visualViewport.height,
        };
      } else {
        // Android/Desktop: Use standard window dimensions
        return {
          width: window.innerWidth,
          height: window.innerHeight,
        };
      }
    };

    const checkMobile = () => {
      const dimensions = getViewportDimensions();
      const { width, height } = dimensions;

      // Consider mobile if width <= 768px (tablet breakpoint)
      const mobile = width <= 768;

      setIsMobile(mobile);
      setViewport({ width, height });

      if (isIOS) {
        console.log(`[iOS] Viewport updated: ${width}x${height}, Mobile: ${mobile}`);
      }
    };

    // Debounced resize handler for smooth performance
    const handleResize = () => {
      if (debounceTimer) clearTimeout(debounceTimer);

      if (isIOS) {
        // iOS: Use shorter debounce and rely more on visualViewport events
        debounceTimer = setTimeout(() => {
          checkMobile();
        }, 100);
      } else {
        // Android/Desktop: Standard debounce
        debounceTimer = setTimeout(() => {
          checkMobile();
        }, 150);
      }
    };

    // iOS-specific: Handle orientation change with proper delay
    const handleOrientationChange = () => {
      if (orientationTimer) clearTimeout(orientationTimer);

      if (isIOS) {
        // iOS Safari needs 300-500ms to stabilize viewport after rotation
        // This accounts for address bar animations and UI chrome adjustments
        orientationTimer = setTimeout(() => {
          checkMobile();

          // Double-check after another 200ms to ensure stability
          setTimeout(() => {
            checkMobile();
          }, 200);
        }, 400);
      } else {
        // Android/Desktop: Shorter delay is sufficient
        orientationTimer = setTimeout(() => {
          checkMobile();
        }, 100);
      }
    };

    // iOS-specific: visualViewport resize handler
    const handleVisualViewportResize = () => {
      if (isIOS) {
        // Immediate update for visualViewport changes
        checkMobile();
      }
    };

    // Initial check
    checkMobile();

    // Listen for resize and orientation changes
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    // iOS-specific: Listen to visualViewport for accurate real-time updates
    if (isIOS && window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleVisualViewportResize);
    }

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      if (orientationTimer) clearTimeout(orientationTimer);

      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);

      if (isIOS && window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleVisualViewportResize);
      }
    };
  }, []);

  return { isMobile, viewport };
}

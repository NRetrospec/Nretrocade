import { useState, useEffect } from 'react';

/**
 * Custom hook to detect mobile devices and handle viewport changes
 * Returns mobile state and viewport dimensions
 * Includes debouncing for resize events to optimize performance
 */
export function useMobileDetection() {
  const [isMobile, setIsMobile] = useState(false);
  const [viewport, setViewport] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    let debounceTimer: NodeJS.Timeout | null = null;

    const checkMobile = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      // Consider mobile if width <= 768px (tablet breakpoint)
      const mobile = width <= 768;

      setIsMobile(mobile);
      setViewport({ width, height });
    };

    // Debounced resize handler for smooth performance
    const handleResize = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        checkMobile();
      }, 150); // 150ms debounce
    };

    // Immediate handler for orientation change (no debounce needed)
    const handleOrientationChange = () => {
      // Add small delay to ensure viewport dimensions are updated
      setTimeout(() => {
        checkMobile();
      }, 100);
    };

    // Initial check
    checkMobile();

    // Listen for resize and orientation changes
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  return { isMobile, viewport };
}

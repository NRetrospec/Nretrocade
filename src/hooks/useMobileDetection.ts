import { useState, useEffect } from 'react';

/**
 * Custom hook to detect mobile devices and handle viewport changes
 * Returns mobile state and viewport dimensions
 */
export function useMobileDetection() {
  const [isMobile, setIsMobile] = useState(false);
  const [viewport, setViewport] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    const checkMobile = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      // Consider mobile if width <= 768px (tablet breakpoint)
      const mobile = width <= 768;

      setIsMobile(mobile);
      setViewport({ width, height });
    };

    // Initial check
    checkMobile();

    // Listen for resize and orientation changes
    window.addEventListener('resize', checkMobile);
    window.addEventListener('orientationchange', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('orientationchange', checkMobile);
    };
  }, []);

  return { isMobile, viewport };
}

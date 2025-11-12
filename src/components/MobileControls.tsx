import { useState, useCallback, useEffect, TouchEvent } from 'react';
import './MobileControls.css';

interface MobileControlsProps {
  onButtonDown: (key: string) => void;
  onButtonUp: (key: string) => void;
  onFocus?: () => void;
}

const STORAGE_KEY = 'nretrocade-controls-visible';

interface ButtonConfig {
  key: string;
  label: string;
  style?: 'primary' | 'secondary' | 'special';
}

/**
 * Action button configurations
 * Arranged for ergonomic thumb placement
 */
const ACTION_BUTTONS: ButtonConfig[] = [
  { key: 'z', label: 'Z', style: 'primary' },
  { key: 'x', label: 'X', style: 'primary' },
  { key: 'c', label: 'C', style: 'secondary' },
  { key: ' ', label: 'Space', style: 'special' },
  { key: 'Shift', label: 'Shift', style: 'secondary' },
  { key: 'Control', label: 'Ctrl', style: 'secondary' },
  { key: 'Enter', label: 'Enter', style: 'special' },
  { key: 'e', label: 'E', style: 'secondary' },
  { key: 'f', label: 'F', style: 'secondary' },
];

/**
 * MobileControls Component
 * Renders on-screen D-pad and action buttons for mobile touch input
 * Prevents default touch behavior and maintains Ruffle focus
 */
export function MobileControls({ onButtonDown, onButtonUp, onFocus }: MobileControlsProps) {
  const [activeButtons, setActiveButtons] = useState<Set<string>>(new Set());

  // Controls visibility state - load from localStorage or default to true
  const [controlsVisible, setControlsVisible] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored !== null ? JSON.parse(stored) : true;
    } catch {
      return true;
    }
  });

  /**
   * Save controls visibility preference to localStorage
   */
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(controlsVisible));
    } catch (error) {
      console.warn('[MobileControls] Failed to save visibility preference:', error);
    }
  }, [controlsVisible]);

  /**
   * Get Ruffle canvas for refocusing after toggle
   */
  const getRuffleCanvas = useCallback((): HTMLCanvasElement | null => {
    const rufflePlayer = document.querySelector('ruffle-player');
    if (!rufflePlayer || !rufflePlayer.shadowRoot) return null;
    return rufflePlayer.shadowRoot.querySelector('canvas') as HTMLCanvasElement | null;
  }, []);

  /**
   * Toggle controls visibility and immediately refocus Ruffle canvas
   */
  const toggleControls = useCallback(() => {
    setControlsVisible(prev => !prev);

    // Refocus canvas after toggle to ensure input continues working
    setTimeout(() => {
      const canvas = getRuffleCanvas();
      if (canvas) {
        canvas.focus({ preventScroll: true });
        console.log('[MobileControls] Canvas refocused after toggle');
      }
    }, 100);
  }, [getRuffleCanvas]);

  /**
   * Handle touch start - must prevent default to avoid iOS zoom/scroll
   */
  const handleTouchStart = useCallback((e: TouchEvent, key: string) => {
    e.preventDefault();
    e.stopPropagation();

    // Ensure Ruffle stays focused
    onFocus?.();

    // Activate button
    if (!activeButtons.has(key)) {
      setActiveButtons(prev => new Set(prev).add(key));
      onButtonDown(key);
    }
  }, [activeButtons, onButtonDown, onFocus]);

  /**
   * Handle touch end
   */
  const handleTouchEnd = useCallback((e: TouchEvent, key: string) => {
    e.preventDefault();
    e.stopPropagation();

    // Deactivate button
    if (activeButtons.has(key)) {
      setActiveButtons(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
      onButtonUp(key);
    }
  }, [activeButtons, onButtonUp]);

  /**
   * Handle touch cancel (iOS can fire this when interrupted)
   */
  const handleTouchCancel = useCallback((e: TouchEvent, key: string) => {
    handleTouchEnd(e, key);
  }, [handleTouchEnd]);

  /**
   * Render D-pad button
   */
  const renderDPadButton = (direction: 'up' | 'down' | 'left' | 'right', key: string) => {
    const isActive = activeButtons.has(key);
    const arrowMap = {
      up: '▲',
      down: '▼',
      left: '◀',
      right: '▶',
    };

    return (
      <button
        className={`dpad-button dpad-${direction} ${isActive ? 'active' : ''}`}
        onTouchStart={(e) => handleTouchStart(e, key)}
        onTouchEnd={(e) => handleTouchEnd(e, key)}
        onTouchCancel={(e) => handleTouchCancel(e, key)}
        aria-label={`${direction} arrow`}
      >
        <span className="button-icon">{arrowMap[direction]}</span>
      </button>
    );
  };

  /**
   * Render action button
   */
  const renderActionButton = (config: ButtonConfig) => {
    const isActive = activeButtons.has(config.key);
    const styleClass = config.style || 'primary';

    return (
      <button
        key={config.key}
        className={`action-button action-${styleClass} ${isActive ? 'active' : ''}`}
        onTouchStart={(e) => handleTouchStart(e, config.key)}
        onTouchEnd={(e) => handleTouchEnd(e, config.key)}
        onTouchCancel={(e) => handleTouchCancel(e, config.key)}
        aria-label={config.label}
      >
        <span className="button-label">{config.label}</span>
      </button>
    );
  };

  return (
    <div className="mobile-controls">
      {/* Fadeable Controls Wrapper */}
      <div className={`controls-wrapper ${!controlsVisible ? 'hidden' : ''}`}>
        {/* D-Pad Container - Bottom Left */}
        <div className="dpad-container">
          <div className="dpad-grid">
            {renderDPadButton('up', 'ArrowUp')}
            {renderDPadButton('left', 'ArrowLeft')}
            <div className="dpad-center" />
            {renderDPadButton('right', 'ArrowRight')}
            {renderDPadButton('down', 'ArrowDown')}
          </div>
        </div>

        {/* Action Buttons - Bottom Right */}
        <div className="action-container">
          {/* Primary cluster (Z, X) */}
          <div className="action-cluster primary-cluster">
            {ACTION_BUTTONS.filter(b => b.style === 'primary').map(renderActionButton)}
          </div>

          {/* Secondary cluster (C, E, F, Shift, Ctrl) */}
          <div className="action-cluster secondary-cluster">
            {ACTION_BUTTONS.filter(b => b.style === 'secondary').map(renderActionButton)}
          </div>

          {/* Special buttons (Space, Enter) */}
          <div className="action-cluster special-cluster">
            {ACTION_BUTTONS.filter(b => b.style === 'special').map(renderActionButton)}
          </div>
        </div>

        {/* Controller Connection Indicator */}
        <div className="controller-indicator">
          🎮 Controller Ready
        </div>
      </div>

      {/* Toggle Button - Always Visible at Bottom Center */}
      <button
        className="controls-toggle"
        onClick={toggleControls}
        aria-label={controlsVisible ? 'Hide controls' : 'Show controls'}
        title={controlsVisible ? 'Hide controls' : 'Show controls'}
      >
        <span className="toggle-icon">{controlsVisible ? '🎮' : '👆'}</span>
        <span className="toggle-text">
          {controlsVisible ? 'Hide' : 'Show'}
        </span>
      </button>
    </div>
  );
}

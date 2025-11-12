import { useEffect, useRef, useCallback } from 'react';

/**
 * Controller button to keyboard mapping
 * Based on standard gamepad layout (Xbox/PlayStation compatible)
 */
const GAMEPAD_BUTTON_MAP: { [index: number]: string } = {
  12: 'ArrowUp',      // D-pad Up
  13: 'ArrowDown',    // D-pad Down
  14: 'ArrowLeft',    // D-pad Left
  15: 'ArrowRight',   // D-pad Right
  0: 'z',             // A / Cross
  1: 'x',             // B / Circle
  2: 'c',             // X / Square
  3: 'e',             // Y / Triangle
  4: 'Shift',         // L1 / LB
  5: 'Shift',         // R1 / RB
  6: 'Control',       // L2 / LT
  7: 'Control',       // R2 / RT
  8: 'f',             // Select / Back
  9: 'Enter',         // Start
  10: ' ',            // L3 (Left stick button) - Space
  11: ' ',            // R3 (Right stick button) - Space
};

/**
 * Threshold for analog stick to register as button press
 */
const ANALOG_THRESHOLD = 0.5;

interface UseGameInputOptions {
  enabled: boolean;
  ruffleRef: React.RefObject<HTMLDivElement>;
}

/**
 * Unified game input hook
 * Manages focus, keyboard event dispatch, and controller polling
 */
export function useGameInput({ enabled, ruffleRef }: UseGameInputOptions) {
  const activeKeysRef = useRef<Set<string>>(new Set());
  const gamepadStateRef = useRef<{ [key: string]: boolean }>({});
  const animationFrameRef = useRef<number | null>(null);
  const focusIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Get the Ruffle canvas element from shadow DOM
   */
  const getRuffleCanvas = useCallback((): HTMLCanvasElement | null => {
    if (!ruffleRef.current) return null;

    const rufflePlayer = ruffleRef.current.querySelector('ruffle-player');
    if (!rufflePlayer || !rufflePlayer.shadowRoot) return null;

    const canvas = rufflePlayer.shadowRoot.querySelector('canvas');
    return canvas as HTMLCanvasElement | null;
  }, [ruffleRef]);

  /**
   * Focus the Ruffle canvas aggressively
   */
  const focusCanvas = useCallback(() => {
    const canvas = getRuffleCanvas();
    if (canvas && document.activeElement !== canvas) {
      try {
        canvas.focus({ preventScroll: true });
        console.log('[Input] Ruffle canvas focused');
      } catch (error) {
        console.warn('[Input] Failed to focus canvas:', error);
      }
    }
  }, [getRuffleCanvas]);

  /**
   * Dispatch keyboard event to Ruffle canvas
   */
  const dispatchKeyEvent = useCallback((type: 'keydown' | 'keyup', key: string) => {
    const canvas = getRuffleCanvas();
    if (!canvas) {
      console.warn('[Input] Canvas not available for event dispatch');
      return;
    }

    // Ensure focus before dispatching
    if (document.activeElement !== canvas) {
      canvas.focus({ preventScroll: true });
    }

    // Create and dispatch keyboard event
    const event = new KeyboardEvent(type, {
      key,
      code: key,
      keyCode: key.charCodeAt(0),
      which: key.charCodeAt(0),
      bubbles: true,
      cancelable: true,
      composed: true,
    });

    canvas.dispatchEvent(event);
    console.log(`[Input] Dispatched ${type}: ${key}`);
  }, [getRuffleCanvas]);

  /**
   * Handle touch button press (from on-screen controls)
   */
  const handleButtonDown = useCallback((key: string) => {
    if (activeKeysRef.current.has(key)) return;

    activeKeysRef.current.add(key);
    focusCanvas(); // Ensure focus before input
    dispatchKeyEvent('keydown', key);
  }, [focusCanvas, dispatchKeyEvent]);

  /**
   * Handle touch button release (from on-screen controls)
   */
  const handleButtonUp = useCallback((key: string) => {
    if (!activeKeysRef.current.has(key)) return;

    activeKeysRef.current.delete(key);
    dispatchKeyEvent('keyup', key);
  }, [dispatchKeyEvent]);

  /**
   * Poll gamepad state and dispatch events
   */
  const pollGamepad = useCallback(() => {
    if (!enabled) return;

    const gamepads = navigator.getGamepads();
    const gamepad = gamepads[0]; // Primary controller

    if (!gamepad) {
      animationFrameRef.current = requestAnimationFrame(pollGamepad);
      return;
    }

    // Process buttons
    gamepad.buttons.forEach((button, index) => {
      const key = GAMEPAD_BUTTON_MAP[index];
      if (!key) return;

      const stateKey = `btn_${index}`;
      const isPressed = button.pressed || button.value > 0.5;
      const wasPressed = gamepadStateRef.current[stateKey] || false;

      if (isPressed && !wasPressed) {
        // Button just pressed
        handleButtonDown(key);
        gamepadStateRef.current[stateKey] = true;
      } else if (!isPressed && wasPressed) {
        // Button just released
        handleButtonUp(key);
        gamepadStateRef.current[stateKey] = false;
      }
    });

    // Process analog sticks as directional input
    if (gamepad.axes.length >= 2) {
      const leftX = gamepad.axes[0];
      const leftY = gamepad.axes[1];

      // Left stick horizontal
      const leftKey = 'axis_left';
      const rightKey = 'axis_right';
      const upKey = 'axis_up';
      const downKey = 'axis_down';

      if (leftX < -ANALOG_THRESHOLD && !gamepadStateRef.current[leftKey]) {
        handleButtonDown('ArrowLeft');
        gamepadStateRef.current[leftKey] = true;
      } else if (leftX > -ANALOG_THRESHOLD && gamepadStateRef.current[leftKey]) {
        handleButtonUp('ArrowLeft');
        gamepadStateRef.current[leftKey] = false;
      }

      if (leftX > ANALOG_THRESHOLD && !gamepadStateRef.current[rightKey]) {
        handleButtonDown('ArrowRight');
        gamepadStateRef.current[rightKey] = true;
      } else if (leftX < ANALOG_THRESHOLD && gamepadStateRef.current[rightKey]) {
        handleButtonUp('ArrowRight');
        gamepadStateRef.current[rightKey] = false;
      }

      // Left stick vertical
      if (leftY < -ANALOG_THRESHOLD && !gamepadStateRef.current[upKey]) {
        handleButtonDown('ArrowUp');
        gamepadStateRef.current[upKey] = true;
      } else if (leftY > -ANALOG_THRESHOLD && gamepadStateRef.current[upKey]) {
        handleButtonUp('ArrowUp');
        gamepadStateRef.current[upKey] = false;
      }

      if (leftY > ANALOG_THRESHOLD && !gamepadStateRef.current[downKey]) {
        handleButtonDown('ArrowDown');
        gamepadStateRef.current[downKey] = true;
      } else if (leftY < ANALOG_THRESHOLD && gamepadStateRef.current[downKey]) {
        handleButtonUp('ArrowDown');
        gamepadStateRef.current[downKey] = false;
      }
    }

    animationFrameRef.current = requestAnimationFrame(pollGamepad);
  }, [enabled, handleButtonDown, handleButtonUp]);

  /**
   * Setup focus management and controller detection
   */
  useEffect(() => {
    if (!enabled) return;

    console.log('[Input] Unified input system enabled');

    // Initial focus
    const initialFocusTimeout = setTimeout(() => {
      focusCanvas();
    }, 500); // Wait for Ruffle to fully initialize

    // Periodic focus check (failsafe)
    focusIntervalRef.current = setInterval(() => {
      focusCanvas();
    }, 2000);

    // Refocus on visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[Input] Page visible, refocusing canvas');
        focusCanvas();
      }
    };

    // Refocus on orientation change
    const handleOrientationChange = () => {
      console.log('[Input] Orientation changed, refocusing canvas');
      setTimeout(() => focusCanvas(), 300);
    };

    // Controller connection logging
    const handleGamepadConnected = (e: GamepadEvent) => {
      console.log('[Input] Controller connected:', e.gamepad.id);
      focusCanvas();
    };

    const handleGamepadDisconnected = (e: GamepadEvent) => {
      console.log('[Input] Controller disconnected:', e.gamepad.id);
      // Clear all controller state
      gamepadStateRef.current = {};
    };

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', focusCanvas);
    window.addEventListener('gamepadconnected', handleGamepadConnected);
    window.addEventListener('gamepaddisconnected', handleGamepadDisconnected);

    // Start gamepad polling loop
    animationFrameRef.current = requestAnimationFrame(pollGamepad);

    // Cleanup
    return () => {
      clearTimeout(initialFocusTimeout);

      if (focusIntervalRef.current) {
        clearInterval(focusIntervalRef.current);
      }

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', focusCanvas);
      window.removeEventListener('gamepadconnected', handleGamepadConnected);
      window.removeEventListener('gamepaddisconnected', handleGamepadDisconnected);

      // Release all active keys
      activeKeysRef.current.forEach(key => {
        dispatchKeyEvent('keyup', key);
      });
      activeKeysRef.current.clear();
      gamepadStateRef.current = {};

      console.log('[Input] Unified input system disabled');
    };
  }, [enabled, focusCanvas, dispatchKeyEvent, pollGamepad]);

  return {
    handleButtonDown,
    handleButtonUp,
    focusCanvas,
  };
}

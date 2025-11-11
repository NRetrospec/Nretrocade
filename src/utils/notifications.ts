/**
 * Toast Notification Utility for N Retrospec
 *
 * A wrapper around Sonner toast library with custom N Retrospec themed styling.
 * Replaces primitive browser alert() calls with smooth, animated notifications.
 */

import { toast } from "sonner";

/**
 * Show a success notification
 *
 * @param message - The success message to display
 * @param description - Optional additional details
 *
 * @example
 * showSuccess("Account created!", "Welcome to N Retrospec")
 */
export function showSuccess(message: string, description?: string) {
  toast.success(message, {
    description,
    duration: 4000,
    className: "nretro-toast-success",
    style: {
      background: "linear-gradient(135deg, #0e7490 0%, #6366f1 100%)",
      border: "2px solid rgba(34, 211, 238, 0.5)",
      color: "white",
      backdropFilter: "blur(12px)",
      boxShadow: "0 8px 32px rgba(34, 211, 238, 0.3)",
    },
  });
}

/**
 * Show an error notification
 *
 * @param message - The error message to display
 * @param description - Optional error details
 *
 * @example
 * showError("Login failed", "Username or password incorrect")
 */
export function showError(message: string, description?: string) {
  toast.error(message, {
    description,
    duration: 5000,
    className: "nretro-toast-error",
    style: {
      background: "linear-gradient(135deg, #dc2626 0%, #f97316 100%)",
      border: "2px solid rgba(239, 68, 68, 0.5)",
      color: "white",
      backdropFilter: "blur(12px)",
      boxShadow: "0 8px 32px rgba(239, 68, 68, 0.3)",
    },
  });
}

/**
 * Show an info notification
 *
 * @param message - The info message to display
 * @param description - Optional additional details
 *
 * @example
 * showInfo("Session expired", "Please log in again")
 */
export function showInfo(message: string, description?: string) {
  toast.info(message, {
    description,
    duration: 4000,
    className: "nretro-toast-info",
    style: {
      background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
      border: "2px solid rgba(148, 163, 184, 0.5)",
      color: "white",
      backdropFilter: "blur(12px)",
      boxShadow: "0 8px 32px rgba(148, 163, 184, 0.2)",
    },
  });
}

/**
 * Show a warning notification
 *
 * @param message - The warning message to display
 * @param description - Optional warning details
 *
 * @example
 * showWarning("Username already taken", "Please choose a different username")
 */
export function showWarning(message: string, description?: string) {
  toast.warning(message, {
    description,
    duration: 4500,
    className: "nretro-toast-warning",
    style: {
      background: "linear-gradient(135deg, #f59e0b 0%, #eab308 100%)",
      border: "2px solid rgba(245, 158, 11, 0.5)",
      color: "white",
      backdropFilter: "blur(12px)",
      boxShadow: "0 8px 32px rgba(245, 158, 11, 0.3)",
    },
  });
}

/**
 * Show a loading notification
 *
 * @param message - The loading message to display
 * @returns Toast ID that can be used to dismiss or update the toast
 *
 * @example
 * const toastId = showLoading("Creating account...");
 * // Later: toast.dismiss(toastId);
 */
export function showLoading(message: string) {
  return toast.loading(message, {
    className: "nretro-toast-loading",
    style: {
      background: "linear-gradient(135deg, #4c1d95 0%, #6b21a8 100%)",
      border: "2px solid rgba(168, 85, 247, 0.5)",
      color: "white",
      backdropFilter: "blur(12px)",
      boxShadow: "0 8px 32px rgba(168, 85, 247, 0.3)",
    },
  });
}

/**
 * Show a custom styled notification
 *
 * @param message - The message to display
 * @param options - Custom toast options
 *
 * @example
 * showCustom("Level Up!", { icon: "🎮", duration: 3000 })
 */
export function showCustom(message: string, options?: {
  description?: string;
  icon?: string;
  duration?: number;
}) {
  toast(message, {
    description: options?.description,
    icon: options?.icon,
    duration: options?.duration || 4000,
    style: {
      background: "linear-gradient(135deg, #0891b2 0%, #a855f7 100%)",
      border: "2px solid rgba(168, 85, 247, 0.5)",
      color: "white",
      backdropFilter: "blur(12px)",
      boxShadow: "0 8px 32px rgba(168, 85, 247, 0.3)",
    },
  });
}

/**
 * Dismiss all active toasts
 */
export function dismissAll() {
  toast.dismiss();
}

/**
 * Promise-based toast for async operations
 *
 * @example
 * await showPromise(
 *   loginMutation(),
 *   {
 *     loading: "Logging in...",
 *     success: "Welcome back!",
 *     error: "Login failed"
 *   }
 * );
 */
export function showPromise<T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: any) => string);
  }
) {
  return toast.promise(promise, {
    loading: messages.loading,
    success: messages.success,
    error: messages.error,
    style: {
      background: "linear-gradient(135deg, #0891b2 0%, #a855f7 100%)",
      border: "2px solid rgba(168, 85, 247, 0.5)",
      color: "white",
      backdropFilter: "blur(12px)",
    },
  });
}

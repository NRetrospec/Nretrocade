/**
 * Custom Logout Button for N Retrospec
 *
 * A themed logout button that matches the N Retrospec aesthetic
 * with red/orange tones to indicate a logout action.
 */

import { useClerk } from "@clerk/clerk-react";

interface CustomLogoutButtonProps {
  className?: string;
  text?: string;
  confirmLogout?: boolean;
  onLogout?: () => void;
}

export function CustomLogoutButton({
  className = "",
  text = "Log Out of N Retrospec",
  confirmLogout = true,
  onLogout
}: CustomLogoutButtonProps) {
  const { signOut } = useClerk();

  const handleLogout = async () => {
    // Optional confirmation dialog
    if (confirmLogout) {
      const confirmed = window.confirm("Are you sure you want to log out?");
      if (!confirmed) return;
    }

    // Call custom logout handler if provided
    if (onLogout) {
      onLogout();
    }

    // Sign out from Clerk
    await signOut();
  };

  return (
    <button
      onClick={handleLogout}
      className={`
        group relative overflow-hidden
        px-8 py-3 rounded-lg
        bg-gradient-to-r from-red-600 via-orange-600 to-pink-600
        hover:from-red-500 hover:via-orange-500 hover:to-pink-500
        text-white font-bold text-sm tracking-wide
        transition-all duration-300 ease-out
        transform hover:scale-105 hover:shadow-2xl
        hover:shadow-red-500/50
        border-2 border-transparent
        hover:border-red-400/50
        ${className}
      `}
    >
      {/* Animated background glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-red-400/20 via-orange-400/20 to-pink-400/20 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300" />

      {/* Button content */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {/* Logout icon */}
        <svg
          className="w-5 h-5 transition-transform group-hover:-translate-x-1"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
        </svg>

        {/* Button text with subtle glow */}
        <span className="drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]">
          {text}
        </span>
      </span>

      {/* Shimmer effect on hover */}
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </button>
  );
}

/**
 * Compact version for navigation bars or user menus
 * Can work with or without Clerk authentication
 */
export function CustomLogoutButtonCompact({
  className = "",
  onLogout,
  useClerkSignOut = false
}: {
  className?: string;
  onLogout?: () => void;
  useClerkSignOut?: boolean;
}) {
  const { signOut } = useClerk();

  const handleLogout = async () => {
    // Call custom logout handler if provided
    if (onLogout) {
      onLogout();
    }

    // Sign out from Clerk if specified
    if (useClerkSignOut) {
      await signOut();
    }
  };

  return (
    <button
      onClick={handleLogout}
      className={`
        px-4 py-2 rounded-md
        bg-gradient-to-r from-red-600 to-orange-600
        hover:from-red-500 hover:to-orange-500
        text-white font-semibold text-xs
        transition-all duration-200
        hover:shadow-lg hover:shadow-red-500/30
        border border-red-400/30
        ${className}
      `}
    >
      Log Out
    </button>
  );
}

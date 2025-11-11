/**
 * Custom Login Button for N Retrospec
 *
 * A themed replacement for Clerk's default SignInButton that matches
 * the N Retrospec dark, neon aesthetic with smooth animations and glow effects.
 */

import { SignInButton } from "@clerk/clerk-react";

interface CustomLoginButtonProps {
  className?: string;
  text?: string;
}

export function CustomLoginButton({
  className = "",
  text = "Log In to N Retrocade"
}: CustomLoginButtonProps) {
  return (
    <SignInButton mode="modal">
      <button
        className={`
          group relative overflow-hidden
          px-8 py-3 rounded-lg
          bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600
          hover:from-cyan-500 hover:via-blue-500 hover:to-purple-500
          text-white font-bold text-sm tracking-wide
          transition-all duration-300 ease-out
          transform hover:scale-105 hover:shadow-2xl
          hover:shadow-cyan-500/50
          border-2 border-transparent
          hover:border-cyan-400/50
          ${className}
        `}
      >
        {/* Animated background glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 via-blue-400/20 to-purple-400/20 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300" />

        {/* Button content */}
        <span className="relative z-10 flex items-center justify-center gap-2">
          {/* Login icon */}
          <svg
            className="w-5 h-5 transition-transform group-hover:rotate-12"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>

          {/* Button text with subtle glow */}
          <span className="drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]">
            {text}
          </span>
        </span>

        {/* Shimmer effect on hover */}
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </button>
    </SignInButton>
  );
}

/**
 * Compact version for navigation bars or tight spaces
 */
export function CustomLoginButtonCompact({ className = "" }: { className?: string }) {
  return (
    <SignInButton mode="modal">
      <button
        className={`
          px-4 py-2 rounded-md
          bg-gradient-to-r from-cyan-600 to-purple-600
          hover:from-cyan-500 hover:to-purple-500
          text-white font-semibold text-xs
          transition-all duration-200
          hover:shadow-lg hover:shadow-cyan-500/30
          border border-cyan-400/30
          ${className}
        `}
      >
        Log In
      </button>
    </SignInButton>
  );
}

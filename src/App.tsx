import { Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { useState, useEffect } from "react";
import { SignUpButton, UserButton, SignedIn, SignedOut } from "@clerk/clerk-react";
import { useUser } from "./contexts/UserContext";
import { showError } from "./utils/notifications";
import { CustomLoginButton } from "./components/CustomLoginButton";
import { CustomLogoutButtonCompact } from "./components/CustomLogoutButton";
import LandingPage from "./components/LandingPage";
import { GamePlayer } from "./components/GamePlayer";
import { GameList } from "./components/GameList";
import { AdPanel } from "./components/AdPanel";
import { NavigationBar } from "./components/NavigationBar";
import { FriendsPanel } from "./components/FriendsPanel";
import { GuildPanel } from "./components/GuildPanel";
import { LevelPanel } from "./components/LevelPanel";

export default function App() {
  return (
    <div className="min-h-screen">
      {/* Custom themed toast notifications */}
      <Toaster
        position="top-right"
        expand={true}
        richColors
        toastOptions={{
          style: {
            background: "linear-gradient(135deg, #0891b2 0%, #6366f1 100%)",
            border: "2px solid rgba(34, 211, 238, 0.3)",
            color: "white",
            backdropFilter: "blur(12px)",
          },
          className: "nretro-toast",
        }}
      />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/main" element={<MainApp />} />
      </Routes>
    </div>
  );
}

function MainApp() {
  const { currentUser, isLoading, isClerkAuthenticated, login, logout } = useUser();
  const [currentView, setCurrentView] = useState<"home" | "friends" | "level" | "guild">("home");
  const [selectedGame, setSelectedGame] = useState<any>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAnonymousLogin, setShowAnonymousLogin] = useState(false);
  const [username, setUsername] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => {
    // Show login modal if no user is logged in
    if (!isLoading && !currentUser) {
      setShowLoginModal(true);
    }
  }, [isLoading, currentUser]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setLoggingIn(true);
    try {
      await login(username.trim());
      setShowLoginModal(false);
      setUsername("");
    } catch (error: any) {
      showError("username taken", "Please try again or sign in with Clerk");
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = () => {
    if (confirm("Are you sure you want to logout?")) {
      logout();
      setShowLoginModal(true);
    }
  };

  // Show loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-cyan-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-cyan-300 text-lg">Loading NRetrocade...</p>
        </div>
      </div>
    );
  }

  // Show login modal
  if (showLoginModal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-cyan-900">
        <div className="bg-black/80 backdrop-blur-sm border-2 border-cyan-500/50 rounded-lg p-8 w-full max-w-md">
          <h1 className="text-4xl font-bold text-center bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent pixel-font mb-2">
            N RETROCADE
          </h1>
          <p className="text-center text-gray-400 mb-6">Welcome to the Retro Gaming Universe!</p>

          {!showAnonymousLogin ? (
            <div className="space-y-4">
              <div className="space-y-3">
                {/* Custom themed login button */}
                <CustomLoginButton className="w-full" />

                {/* Custom themed sign up button */}
                <SignUpButton mode="modal">
                  <button className="w-full group relative overflow-hidden px-8 py-3 rounded-lg bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 hover:from-purple-500 hover:via-pink-500 hover:to-red-500 text-white font-bold text-sm tracking-wide transition-all duration-300 ease-out transform hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/50 border-2 border-transparent hover:border-purple-400/50">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 via-pink-400/20 to-red-400/20 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300" />
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <svg className="w-5 h-5 transition-transform group-hover:rotate-12" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                      </svg>
                      <span className="drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]">Create Account</span>
                    </span>
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  </button>
                </SignUpButton>
              </div>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-black/80 text-gray-400">or</span>
                </div>
              </div>

              <button
                onClick={() => setShowAnonymousLogin(true)}
                className="w-full px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded font-bold transition-all"
              >
                Continue as Guest
              </button>

              <p className="text-xs text-center text-gray-500 mt-4">
                Sign in with Clerk to sync your progress across devices
              </p>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-cyan-300 mb-2 font-semibold">Choose a Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username (3-20 characters)"
                  className="w-full px-4 py-3 bg-black/50 border border-cyan-500/50 rounded text-cyan-100 placeholder-gray-500 focus:outline-none focus:border-cyan-400"
                  required
                  minLength={3}
                  maxLength={20}
                  pattern="[a-zA-Z0-9_]+"
                  disabled={loggingIn}
                />
                <p className="text-xs text-gray-500 mt-1">Letters, numbers, and underscores only</p>
              </div>

              <button
                type="submit"
                disabled={loggingIn || !username.trim()}
                className="w-full px-6 py-3 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white rounded font-bold transition-all transform hover:scale-105"
              >
                {loggingIn ? "Logging in..." : "Enter as Guest"}
              </button>

              <button
                type="button"
                onClick={() => setShowAnonymousLogin(false)}
                className="w-full px-4 py-2 text-gray-400 hover:text-white text-sm transition-colors"
              >
                ← Back to Sign In
              </button>

              <p className="text-xs text-gray-500 text-center mt-4">
                Guest progress is saved locally only
              </p>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-black/50 backdrop-blur-sm border-b border-cyan-500/30 p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent pixel-font">
            N RETROCADE
          </h1>
          <div className="flex items-center gap-4">
            {currentUser && (
              <>
                <div className="flex items-center gap-2">
                  {currentUser.avatarUrl ? (
                    <img
                      src={currentUser.avatarUrl}
                      alt={currentUser.username}
                      className="w-10 h-10 rounded-full border-2 border-cyan-500"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                      {currentUser.username?.substring(0, 2).toUpperCase() || "??"}
                    </div>
                  )}
                  <div>
                    <div className="text-cyan-300 font-semibold">{currentUser.username}</div>
                    <div className="text-xs text-gray-400">Level {currentUser.level}</div>
                  </div>
                </div>

                {/* Show Clerk UserButton for authenticated users */}
                <SignedIn>
                  <UserButton
                    appearance={{
                      elements: {
                        avatarBox: "w-10 h-10 border-2 border-purple-500",
                      },
                    }}
                  />
                </SignedIn>

                {/* Show custom logout button for anonymous users */}
                <SignedOut>
                  <CustomLogoutButtonCompact
                    onLogout={logout}
                    className="px-4 py-2"
                  />
                </SignedOut>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Left Sidebar - Game List */}
        <div className="w-80 bg-black/30 backdrop-blur-sm border-r border-cyan-500/30">
          {currentView === "home" && <GameList onSelectGame={setSelectedGame} />}
          {currentView === "friends" && <FriendsPanel />}
          {currentView === "level" && <LevelPanel />}
          {currentView === "guild" && <GuildPanel />}
        </div>

        {/* Center - Game Player or Feature Panel */}
        <div className="flex-1 flex items-center justify-center p-8">
          {currentView === "home" ? (
            selectedGame ? (
              <GamePlayer game={selectedGame} />
            ) : (
              <div className="text-center">
                <div className="text-6xl mb-4">🎮</div>
                <h2 className="text-2xl text-cyan-300 mb-2">Select a Game to Play</h2>
                <p className="text-gray-400">Choose from our collection of classic Flash games</p>
              </div>
            )
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center max-w-md">
                <div className="text-6xl mb-4">
                  {currentView === "friends" && "👥"}
                  {currentView === "level" && "⭐"}
                  {currentView === "guild" && "🛡️"}
                </div>
                <h2 className="text-2xl text-cyan-300 mb-2 capitalize">{currentView}</h2>
                <p className="text-gray-400">
                  {currentView === "friends" && "Add friends, see who's online, and track friend requests in the left panel."}
                  {currentView === "level" && "Track your XP, view the leaderboard, and unlock achievements in the left panel."}
                  {currentView === "guild" && "Create or join a guild, chat with members, and compete for the top spot in the left panel."}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar - Ads */}
        <div className="w-80 bg-black/30 backdrop-blur-sm border-l border-cyan-500/30">
          <AdPanel />
        </div>
      </div>

      {/* Bottom Navigation */}
      <NavigationBar currentView={currentView} onViewChange={setCurrentView} />
    </div>
  );
}

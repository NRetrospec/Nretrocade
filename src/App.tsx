import { Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { useState, useEffect } from "react";
import LandingPage from "./components/LandingPage";
import { GamePlayer } from "./components/GamePlayer";
import { GameList } from "./components/GameList";
import { AdPanel } from "./components/AdPanel";
import { NavigationBar } from "./components/NavigationBar";

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <Toaster />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/main" element={<MainApp />} />
      </Routes>
    </div>
  );
}

function MainApp() {
  const [currentView, setCurrentView] = useState<"home" | "friends" | "level" | "guild">("home");
  const [selectedGame, setSelectedGame] = useState<any>(null);

  useEffect(() => {
    // Seed games on first load - simplified for demo
    console.log("Seeding games...");
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-black/50 backdrop-blur-sm border-b border-cyan-500/30 p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent pixel-font">
            N RETROSPEC
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-cyan-300">Welcome to the Retro Gaming Universe!</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Left Sidebar - Game List */}
        <div className="w-80 bg-black/30 backdrop-blur-sm border-r border-cyan-500/30">
          {currentView === "home" && <GameList onSelectGame={setSelectedGame} />}
        </div>

        {/* Center - Game Player */}
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
            <div className="text-center">
              <div className="text-6xl mb-4">
                {currentView === "friends" && "👥"}
                {currentView === "level" && "⭐"}
                {currentView === "guild" && "🛡️"}
              </div>
              <h2 className="text-2xl text-cyan-300 capitalize">{currentView} Panel</h2>
              <p className="text-gray-400">This feature is not available in the public version</p>
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

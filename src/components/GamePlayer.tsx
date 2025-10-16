import { useEffect, useRef, useState } from "react";

interface GamePlayerProps {
  game: any;
}

export function GamePlayer({ game }: GamePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let rufflePlayer: any = null;

   const initRuffle = async () => {
  try {
    setIsLoading(true);
    setError(null);

    // Load Ruffle dynamically from CDN if not already present
    if (!(window as any).RufflePlayer) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://unpkg.com/@ruffle-rs/ruffle";
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load Ruffle script."));
        document.body.appendChild(script);
      });
    }

    const Ruffle = (window as any).RufflePlayer;
    if (!Ruffle) {
      throw new Error("RufflePlayer not found on window after loading.");
    }

    // Create Ruffle player properly
    const ruffleInstance = Ruffle.newest();
    const player = ruffleInstance.createPlayer(); // ✅ this returns an HTMLElement

    if (!player) {
      throw new Error("Failed to create Ruffle player element.");
    }

    // Configure styling
    player.style.width = "100%";
    player.style.height = "600px";
    player.style.border = "2px solid #06b6d4";
    player.style.borderRadius = "8px";

    // Append and load
    if (containerRef.current) {
      containerRef.current.innerHTML = "";
      containerRef.current.appendChild(player);
      await player.load(game.swfUrl);
    }

    setIsLoading(false);
  } catch (err) {
    console.error("Failed to load Ruffle:", err);
    setError("Failed to load game. This might be a demo - Ruffle requires actual SWF files.");
    setIsLoading(false);
  }
};


    initRuffle();

    return () => {
      if (rufflePlayer && rufflePlayer.remove) {
        rufflePlayer.remove();
      }
    };
  }, [game._id]);

  if (error) {
    return (
      <div className="w-full max-w-4xl bg-black/50 border border-red-500/50 rounded-lg p-8 text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl text-red-400 mb-4">Game Load Error</h2>
        <p className="text-gray-300 mb-4">{error}</p>
        <div className="bg-yellow-500/20 border border-yellow-500/50 rounded p-4 text-yellow-200">
          <p className="text-sm">
            <strong>Demo Note:</strong> This is a demonstration of the gaming platform.
            In a real deployment, you would need to host actual SWF files and configure Ruffle properly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl">
      {/* Game Header */}
      <div className="bg-black/50 border border-cyan-500/50 rounded-t-lg p-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-cyan-300 pixel-font">{game.title}</h2>
            <p className="text-gray-400">{game.description}</p>
            <div className="flex gap-2 mt-2">
              {game.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-1 bg-purple-500/30 text-purple-300 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">Difficulty</div>
            <div className="text-lg font-bold text-cyan-300">{game.difficulty}</div>
            {game.isMultiplayer && (
              <div className="text-xs text-cyan-400 mt-1">🌐 Multiplayer</div>
            )}
          </div>
        </div>
      </div>

      {/* Game Container */}
      <div className="bg-black border-x border-cyan-500/50 relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
              <p className="text-cyan-300">Loading game...</p>
            </div>
          </div>
        )}
        <div ref={containerRef} className="w-full min-h-[600px]" />
      </div>

      {/* Game Controls */}
      <div className="bg-black/50 border border-cyan-500/50 rounded-b-lg p-4">
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <button
              onClick={() => alert("Game completed! Enjoy playing!")}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
            >
              Mark Complete
            </button>
          </div>
          <div className="text-sm text-gray-400">
            Enjoy the retro gaming experience!
          </div>
        </div>
      </div>
    </div>
  );
}

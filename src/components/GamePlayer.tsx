import { useEffect, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useUser } from "../contexts/UserContext";
import { toast } from "sonner";
import { useMobileDetection } from "../hooks/useMobileDetection";

interface GamePlayerProps {
  game: any;
  onClose?: () => void; // New prop for closing game view (mobile)
}

export function GamePlayer({ game, onClose }: GamePlayerProps) {
  const { currentUser } = useUser();
  const { isMobile, viewport } = useMobileDetection();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playTime, setPlayTime] = useState(0); // in seconds
  const sessionIdRef = useRef<string | null>(null);

  const startSession = useMutation(api.gameSessions.startSession);
  const endSession = useMutation(api.gameSessions.endSession);
  const updateHeartbeat = useMutation(api.gameSessions.updateSessionHeartbeat);

  // Prevent body scroll on mobile when game is active
  useEffect(() => {
    if (isMobile) {
      // Store original overflow style
      const originalOverflow = document.body.style.overflow;
      const originalPosition = document.body.style.position;

      // Prevent scrolling
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';

      // Restore on unmount
      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.position = originalPosition;
        document.body.style.width = '';
        document.body.style.height = '';
      };
    }
  }, [isMobile]);

  // Initialize game session
  useEffect(() => {
    if (!currentUser?._id || !game._id) return;

    const initSession = async () => {
      try {
        const result = await startSession({
          userId: currentUser._id,
          gameId: game._id,
        });
        sessionIdRef.current = result.sessionId;
        toast.success("Game session started!", {
          description: "You'll earn XP while playing!",
        });
      } catch (error) {
        console.error("Failed to start session:", error);
      }
    };

    initSession();

    // Cleanup: end session when component unmounts
    return () => {
      if (sessionIdRef.current && currentUser._id) {
        endSession({ userId: currentUser._id, completed: false })
          .then((result) => {
            toast.success(`Session ended! +${result.expAwarded} XP`, {
              description: `Played for ${result.duration} minutes`,
            });
          })
          .catch(console.error);
      }
    };
  }, [currentUser?._id, game._id]);

  // Heartbeat and playtime tracker
  useEffect(() => {
    if (!currentUser?._id) return;

    // Update playtime every second
    const playTimeInterval = setInterval(() => {
      setPlayTime((prev) => prev + 1);
    }, 1000);

    // Send heartbeat every 30 seconds
    const heartbeatInterval = setInterval(() => {
      if (currentUser._id) {
        updateHeartbeat({ userId: currentUser._id })
          .then((result) => {
            if (result.success) {
              console.log(`Heartbeat sent. Estimated XP: ${result.estimatedExp}`);
            }
          })
          .catch(console.error);
      }
    }, 30 * 1000);

    return () => {
      clearInterval(playTimeInterval);
      clearInterval(heartbeatInterval);
    };
  }, [currentUser?._id]);

  // Initialize Ruffle player
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
        const player = ruffleInstance.createPlayer();

        if (!player) {
          throw new Error("Failed to create Ruffle player element.");
        }

        // Configure styling based on mobile/desktop
        if (isMobile) {
          // Mobile: fullscreen-like dimensions
          player.style.width = "100vw";
          player.style.height = `${viewport.height - 120}px`; // Subtract space for header/controls
          player.style.border = "none";
          player.style.borderRadius = "0";
        } else {
          // Desktop: fixed container
          player.style.width = "100%";
          player.style.height = "600px";
          player.style.border = "2px solid #06b6d4";
          player.style.borderRadius = "8px";
        }

        // Append and load
        if (containerRef.current) {
          containerRef.current.innerHTML = "";
          containerRef.current.appendChild(player);
          await player.load(game.swfUrl);
        }

        setIsLoading(false);
        rufflePlayer = player;
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
  }, [game._id, isMobile, viewport]);

  const handleMarkComplete = async () => {
    if (!currentUser?._id) return;

    try {
      const result = await endSession({
        userId: currentUser._id,
        completed: true, // Completion bonus!
      });

      toast.success(`Game completed! +${result.expAwarded} XP`, {
        description: `Total playtime: ${result.duration} minutes`,
        duration: 5000,
      });

      // Restart session to continue playing
      const newSession = await startSession({
        userId: currentUser._id,
        gameId: game._id,
      });
      sessionIdRef.current = newSession.sessionId;
      setPlayTime(0);
    } catch (error: any) {
      toast.error("Failed to mark complete", {
        description: error.message,
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (error) {
    return (
      <div className={`bg-black/50 border border-red-500/50 rounded-lg p-8 text-center ${isMobile ? 'w-full h-screen flex flex-col justify-center' : 'w-full max-w-4xl'}`}>
        {isMobile && onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-50 w-10 h-10 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center text-2xl font-bold shadow-lg transition-colors"
            aria-label="Close game"
          >
            ×
          </button>
        )}
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
    <div className={`${isMobile ? 'fixed inset-0 z-40 bg-gradient-to-br from-gray-900 via-purple-900 to-cyan-900 overflow-hidden' : 'w-full max-w-4xl'}`}>
      {/* Mobile Close Button - Floating in top-right corner */}
      {isMobile && onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 w-12 h-12 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center text-3xl font-bold shadow-lg transition-all hover:scale-110"
          aria-label="Close game"
        >
          ×
        </button>
      )}

      {/* Game Header */}
      <div className={`bg-black/50 border border-cyan-500/50 p-4 ${isMobile ? '' : 'rounded-t-lg'}`}>
        <div className={`flex ${isMobile ? 'flex-col gap-2' : 'justify-between items-center'}`}>
          <div className={`${isMobile ? 'pr-14' : ''}`}>
            <h2 className={`font-bold text-cyan-300 pixel-font ${isMobile ? 'text-lg' : 'text-2xl'}`}>{game.title}</h2>
            {!isMobile && <p className="text-gray-400">{game.description}</p>}
            <div className="flex gap-2 mt-2 flex-wrap">
              {game.tags.slice(0, isMobile ? 2 : game.tags.length).map((tag: string) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-1 bg-purple-500/30 text-purple-300 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          {!isMobile && (
            <div className="text-right">
              <div className="text-sm text-gray-400">Difficulty</div>
              <div className="text-lg font-bold text-cyan-300">{game.difficulty}</div>
              {game.isMultiplayer && (
                <div className="text-xs text-cyan-400 mt-1">🌐 Multiplayer</div>
              )}
              <div className="mt-2 text-sm text-gray-400">
                <div className="text-xs">Session Time</div>
                <div className="text-lg font-bold text-purple-400">{formatTime(playTime)}</div>
                <div className="text-xs text-gray-500">~{Math.floor(playTime / 6)} XP earned</div>
              </div>
            </div>
          )}
          {isMobile && (
            <div className="flex justify-between text-xs text-gray-400">
              <div>
                <span className="text-cyan-300 font-bold">{game.difficulty}</span> difficulty
              </div>
              <div>
                <span className="text-purple-400 font-bold">{formatTime(playTime)}</span> • ~{Math.floor(playTime / 6)} XP
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Game Container */}
      <div className={`bg-black relative ${isMobile ? 'flex-1' : 'border-x border-cyan-500/50'}`}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
              <p className="text-cyan-300">Loading game...</p>
            </div>
          </div>
        )}
        <div ref={containerRef} className={`w-full ${isMobile ? 'h-full' : 'min-h-[600px]'}`} />
      </div>

      {/* Game Controls - Desktop Only */}
      {!isMobile && (
        <div className="bg-black/50 border border-cyan-500/50 rounded-b-lg p-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <button
                onClick={handleMarkComplete}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors font-semibold"
                disabled={!currentUser}
              >
                ✓ Mark Complete (+50 XP Bonus)
              </button>
            </div>
            <div className="text-sm text-gray-400">
              💡 Earn 10 XP per minute played
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Bar - Compact Controls */}
      {isMobile && (
        <div className="bg-black/90 border-t border-cyan-500/50 p-3 flex justify-between items-center">
          <button
            onClick={handleMarkComplete}
            className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors font-semibold text-sm flex items-center gap-1"
            disabled={!currentUser}
          >
            ✓ Complete
          </button>
          <div className="text-xs text-gray-400">
            💡 10 XP/min
          </div>
        </div>
      )}
    </div>
  );
}

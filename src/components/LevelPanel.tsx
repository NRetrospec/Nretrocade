import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useUser } from "../contexts/UserContext";

export function LevelPanel() {
  const { currentUser } = useUser();

  const profile = useQuery(
    api.users.getProfile,
    currentUser?.userId ? { userId: currentUser.userId } : "skip"
  );
  const leaderboard = useQuery(api.users.getLeaderboard, { limit: 10 });

  if (!profile || !currentUser) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  // Use the levelInfo from the backend calculation
  const levelInfo = profile.levelInfo;
  const progressPercent = levelInfo.progress;

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-cyan-500/30">
        <h2 className="text-xl font-bold text-cyan-300 mb-4 pixel-font">LEVEL & STATS</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Current Level */}
        <div className="bg-black/40 border border-cyan-500/30 rounded-lg p-4">
          <div className="text-center mb-4">
            <div className="text-6xl font-bold text-cyan-300 pixel-font">
              {levelInfo.level}
            </div>
            <div className="text-lg text-gray-300">Level</div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>{Math.floor(levelInfo.currentLevelExp)} EXP</span>
              <span>{Math.floor(levelInfo.nextLevelExp - levelInfo.currentLevelExp)} EXP to next level</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-cyan-400 to-purple-400 h-3 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, progressPercent)}%` }}
              ></div>
            </div>
            <div className="text-center text-xs text-gray-400 mt-1">
              {Math.floor(progressPercent)}% Complete
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-purple-400">{profile.exp}</div>
              <div className="text-sm text-gray-400">Total EXP</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-cyan-400">
                {Math.floor(profile.totalPlaytime / 60)}h {profile.totalPlaytime % 60}m
              </div>
              <div className="text-sm text-gray-400">Time Played</div>
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-black/40 border border-cyan-500/30 rounded-lg p-4">
          <h3 className="text-lg font-bold text-cyan-300 mb-4 pixel-font">LEADERBOARD</h3>
          <div className="space-y-2">
            {leaderboard?.map((player) => (
              <div
                key={player._id}
                className={`flex items-center gap-3 p-2 rounded ${
                  player.userId === currentUser.userId
                    ? "bg-cyan-500/20 border border-cyan-500/50"
                    : "bg-black/20"
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                  player.rank === 1 ? "bg-yellow-500 text-black" :
                  player.rank === 2 ? "bg-gray-400 text-black" :
                  player.rank === 3 ? "bg-orange-600 text-white" :
                  "bg-gray-600 text-white"
                }`}>
                  {player.rank}
                </div>
                {player.avatarUrl ? (
                  <img
                    src={player.avatarUrl}
                    alt={player.username}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                    {player.username.substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="flex-1">
                  <div className="font-semibold text-cyan-100">
                    {player.username}
                    {player.userId === currentUser.userId && (
                      <span className="ml-2 text-xs text-cyan-400">(You)</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-400">Level {player.level}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-purple-400">{player.exp}</div>
                  <div className="text-xs text-gray-400">EXP</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Achievements */}
        <div className="bg-black/40 border border-cyan-500/30 rounded-lg p-4">
          <h3 className="text-lg font-bold text-cyan-300 mb-4 pixel-font">ACHIEVEMENTS</h3>
          <div className="grid grid-cols-2 gap-2">
            <div className={`p-3 rounded text-center ${
              levelInfo.level >= 5 ? "bg-green-500/20 border border-green-500/50" : "bg-gray-500/20 border border-gray-500/50"
            }`}>
              <div className="text-2xl mb-1">🎮</div>
              <div className="text-xs text-gray-300 font-semibold">Gamer</div>
              <div className="text-xs text-gray-400">Reach Level 5</div>
              {levelInfo.level >= 5 && (
                <div className="text-xs text-green-400 mt-1">✓ Unlocked</div>
              )}
            </div>
            <div className={`p-3 rounded text-center ${
              profile.totalPlaytime >= 60 ? "bg-green-500/20 border border-green-500/50" : "bg-gray-500/20 border border-gray-500/50"
            }`}>
              <div className="text-2xl mb-1">⏰</div>
              <div className="text-xs text-gray-300 font-semibold">Dedicated</div>
              <div className="text-xs text-gray-400">Play 1 Hour</div>
              {profile.totalPlaytime >= 60 && (
                <div className="text-xs text-green-400 mt-1">✓ Unlocked</div>
              )}
            </div>
            <div className={`p-3 rounded text-center ${
              levelInfo.level >= 10 ? "bg-green-500/20 border border-green-500/50" : "bg-gray-500/20 border border-gray-500/50"
            }`}>
              <div className="text-2xl mb-1">⭐</div>
              <div className="text-xs text-gray-300 font-semibold">Pro Gamer</div>
              <div className="text-xs text-gray-400">Reach Level 10</div>
              {levelInfo.level >= 10 && (
                <div className="text-xs text-green-400 mt-1">✓ Unlocked</div>
              )}
            </div>
            <div className={`p-3 rounded text-center ${
              profile.exp >= 1000 ? "bg-green-500/20 border border-green-500/50" : "bg-gray-500/20 border border-gray-500/50"
            }`}>
              <div className="text-2xl mb-1">💪</div>
              <div className="text-xs text-gray-300 font-semibold">Experienced</div>
              <div className="text-xs text-gray-400">Earn 1000 XP</div>
              {profile.exp >= 1000 && (
                <div className="text-xs text-green-400 mt-1">✓ Unlocked</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

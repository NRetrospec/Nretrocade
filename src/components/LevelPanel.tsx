import { useQuery } from "convex/react";
import { api } from "../../convex2/_generated2/api";

export function LevelPanel() {
  const profile = useQuery(api.users.getProfile, {});
  const leaderboard = useQuery(api.users.getLeaderboard, { limit: 10 });

  if (!profile) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  const currentLevelExp = (profile.level - 1) * 1000;
  const nextLevelExp = profile.level * 1000;
  const progressExp = profile.exp - currentLevelExp;
  const neededExp = nextLevelExp - currentLevelExp;
  const progressPercent = (progressExp / neededExp) * 100;

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
              {profile.level}
            </div>
            <div className="text-lg text-gray-300">Level</div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>{progressExp} EXP</span>
              <span>{neededExp} EXP to next level</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-cyan-400 to-purple-400 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-purple-400">{profile.exp}</div>
              <div className="text-sm text-gray-400">Total EXP</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-cyan-400">{profile.totalPlaytime}</div>
              <div className="text-sm text-gray-400">Minutes Played</div>
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-black/40 border border-cyan-500/30 rounded-lg p-4">
          <h3 className="text-lg font-bold text-cyan-300 mb-4 pixel-font">LEADERBOARD</h3>
          <div className="space-y-2">
            {leaderboard?.map((player, index) => (
              <div
                key={player._id}
                className={`flex items-center gap-3 p-2 rounded ${
                  player.userId === profile.userId
                    ? "bg-cyan-500/20 border border-cyan-500/50"
                    : "bg-black/20"
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                  index === 0 ? "bg-yellow-500 text-black" :
                  index === 1 ? "bg-gray-400 text-black" :
                  index === 2 ? "bg-orange-600 text-white" :
                  "bg-gray-600 text-white"
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-cyan-100">{player.username}</div>
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
              profile.level >= 5 ? "bg-green-500/20 border border-green-500/50" : "bg-gray-500/20 border border-gray-500/50"
            }`}>
              <div className="text-2xl mb-1">🎮</div>
              <div className="text-xs text-gray-300">Gamer</div>
              <div className="text-xs text-gray-400">Reach Level 5</div>
            </div>
            <div className={`p-3 rounded text-center ${
              profile.totalPlaytime >= 60 ? "bg-green-500/20 border border-green-500/50" : "bg-gray-500/20 border border-gray-500/50"
            }`}>
              <div className="text-2xl mb-1">⏰</div>
              <div className="text-xs text-gray-300">Dedicated</div>
              <div className="text-xs text-gray-400">Play 1 Hour</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

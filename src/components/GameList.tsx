import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";

interface GameListProps {
  onSelectGame: (game: any) => void;
}

export function GameList({ onSelectGame }: GameListProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [multiplayerOnly, setMultiplayerOnly] = useState(false);

  const games = useQuery(api.games.listGames, {
    search: search || undefined,
    category: category || undefined,
    multiplayerOnly: multiplayerOnly || undefined,
  });

  const categories = ["Strategy", "Adventure", "Music", "Action", "Puzzle", "Sports"];

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-cyan-500/30">
        <h2 className="text-xl font-bold text-cyan-300 mb-4 pixel-font">GAME LIBRARY</h2>

        {/* Search */}
        <input
          type="text"
          placeholder="Search games..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 bg-black/50 border border-cyan-500/50 rounded text-cyan-100 placeholder-gray-400 focus:border-cyan-400 focus:outline-none mb-3"
        />

        {/* Filters */}
        <div className="space-y-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 bg-black/50 border border-cyan-500/50 rounded text-cyan-100 focus:border-cyan-400 focus:outline-none"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <label className="flex items-center text-cyan-300 cursor-pointer">
            <input
              type="checkbox"
              checked={multiplayerOnly}
              onChange={(e) => setMultiplayerOnly(e.target.checked)}
              className="mr-2 accent-cyan-400"
            />
            Multiplayer Only
          </label>
        </div>
      </div>

      {/* Games List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {games?.map((game) => (
          <div
            key={game._id}
            onClick={() => onSelectGame(game)}
            className="bg-black/40 border border-cyan-500/30 rounded-lg p-3 cursor-pointer hover:border-cyan-400 hover:bg-black/60 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-cyan-500 rounded flex items-center justify-center text-white font-bold">
                {game.title.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-cyan-100 truncate group-hover:text-cyan-300">
                  {game.title}
                </h3>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span className="px-2 py-1 bg-purple-500/30 rounded">{game.category}</span>
                  {game.isMultiplayer && (
                    <span className="px-2 py-1 bg-cyan-500/30 rounded">MP</span>
                  )}
                  <span className="px-2 py-1 bg-gray-500/30 rounded">{game.difficulty}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {game.playCount} plays
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1 mt-2">
              {game.tags.slice(0, 3).map((tag: string) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-1 bg-cyan-500/20 text-cyan-300 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}

        {games?.length === 0 && (
          <div className="text-center text-gray-400 py-8">
            <div className="text-4xl mb-2">🎮</div>
            <p>No games found</p>
          </div>
        )}
      </div>
    </div>
  );
}

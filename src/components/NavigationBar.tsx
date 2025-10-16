interface NavigationBarProps {
  currentView: "home" | "friends" | "level" | "guild";
  onViewChange: (view: "home" | "friends" | "level" | "guild") => void;
}

export function NavigationBar({ currentView, onViewChange }: NavigationBarProps) {
  const buttons = [
    { id: "friends", icon: "🧑‍🤝‍🧑", label: "Friends" },
    { id: "home", icon: "🏠", label: "Home" },
    { id: "level", icon: "🧪", label: "Level" },
    { id: "guild", icon: "🛡️", label: "Guild" },
  ] as const;

  return (
    <div className="bg-black/50 backdrop-blur-sm border-t border-cyan-500/30 p-4">
      <div className="flex justify-center gap-8">
        {buttons.map((button) => (
          <button
            key={button.id}
            onClick={() => onViewChange(button.id)}
            className={`
              flex flex-col items-center gap-2 px-6 py-3 rounded-lg transition-all
              ${currentView === button.id
                ? "bg-cyan-500/30 border-2 border-cyan-400 text-cyan-300"
                : "bg-black/30 border-2 border-gray-600 text-gray-400 hover:border-cyan-500 hover:text-cyan-300"
              }
            `}
          >
            <div className="text-2xl">{button.icon}</div>
            <span className="text-sm font-semibold pixel-font">{button.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

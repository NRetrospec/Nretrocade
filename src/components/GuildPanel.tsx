import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex2/_generated2/api";
import { useState } from "react";

export function GuildPanel() {
  const profile = useQuery(api.users.getProfile, {});
  const guild = useQuery(api.guilds.getGuild, 
    profile?.guildId ? { guildId: profile.guildId } : "skip"
  );
  const guildMembers = useQuery(api.guilds.getGuildMembers,
    profile?.guildId ? { guildId: profile.guildId } : "skip"
  );
  const guildMessages = useQuery(api.guilds.getGuildMessages,
    profile?.guildId ? { guildId: profile.guildId } : "skip"
  );
  const availableGuilds = useQuery(api.guilds.searchGuilds, {});

  const createGuild = useMutation(api.guilds.createGuild);
  const joinGuild = useMutation(api.guilds.joinGuild);
  const leaveGuild = useMutation(api.guilds.leaveGuild);
  const sendMessage = useMutation(api.guilds.sendGuildMessage);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newGuildName, setNewGuildName] = useState("");
  const [newGuildDescription, setNewGuildDescription] = useState("");
  const [messageText, setMessageText] = useState("");

  const handleCreateGuild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGuildName.trim()) return;

    try {
      await createGuild({
        name: newGuildName,
        description: newGuildDescription || undefined,
        isPrivate: false,
      });
      setNewGuildName("");
      setNewGuildDescription("");
      setShowCreateForm(false);
    } catch (err) {
      console.error("Failed to create guild:", err);
    }
  };

  const handleJoinGuild = async (guildId: any) => {
    try {
      await joinGuild({ guildId });
    } catch (err) {
      console.error("Failed to join guild:", err);
    }
  };

  const handleLeaveGuild = async () => {
    if (confirm("Are you sure you want to leave this guild?")) {
      try {
        await leaveGuild();
      } catch (err) {
        console.error("Failed to leave guild:", err);
      }
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !profile?.guildId) return;

    try {
      await sendMessage({
        guildId: profile.guildId,
        content: messageText,
      });
      setMessageText("");
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  if (!profile) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-cyan-500/30">
        <h2 className="text-xl font-bold text-cyan-300 mb-4 pixel-font">GUILD</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {profile.guildId && guild ? (
          // In Guild View
          <div className="h-full flex flex-col">
            {/* Guild Info */}
            <div className="p-4 border-b border-cyan-500/30">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-bold text-cyan-300">{guild.name}</h3>
                  {guild.description && (
                    <p className="text-sm text-gray-400">{guild.description}</p>
                  )}
                </div>
                <button
                  onClick={handleLeaveGuild}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
                >
                  Leave
                </button>
              </div>
              <div className="text-sm text-gray-400">
                {guild.memberCount} members
              </div>
            </div>

            {/* Chat */}
            <div className="flex-1 flex flex-col">
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {guildMessages?.map((message) => (
                  <div key={message._id} className="bg-black/20 rounded p-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-cyan-300 text-sm">
                        {message.username}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-gray-200 text-sm">{message.content}</p>
                  </div>
                ))}
                {guildMessages?.length === 0 && (
                  <div className="text-center text-gray-400 py-4">
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                )}
              </div>

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-cyan-500/30">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-3 py-2 bg-black/50 border border-cyan-500/50 rounded text-cyan-100 placeholder-gray-400 focus:border-cyan-400 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!messageText.trim()}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 text-white rounded transition-colors"
                  >
                    Send
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          // No Guild View
          <div className="p-4 space-y-6">
            {/* Create Guild */}
            <div className="bg-black/40 border border-cyan-500/30 rounded-lg p-4">
              <h3 className="text-lg font-bold text-cyan-300 mb-3">Create Guild</h3>
              {!showCreateForm ? (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="w-full px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded transition-colors"
                >
                  Create New Guild
                </button>
              ) : (
                <form onSubmit={handleCreateGuild} className="space-y-3">
                  <input
                    type="text"
                    value={newGuildName}
                    onChange={(e) => setNewGuildName(e.target.value)}
                    placeholder="Guild name"
                    className="w-full px-3 py-2 bg-black/50 border border-cyan-500/50 rounded text-cyan-100 placeholder-gray-400 focus:border-cyan-400 focus:outline-none"
                    required
                  />
                  <textarea
                    value={newGuildDescription}
                    onChange={(e) => setNewGuildDescription(e.target.value)}
                    placeholder="Guild description (optional)"
                    className="w-full px-3 py-2 bg-black/50 border border-cyan-500/50 rounded text-cyan-100 placeholder-gray-400 focus:border-cyan-400 focus:outline-none resize-none"
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                    >
                      Create
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Available Guilds */}
            <div className="bg-black/40 border border-cyan-500/30 rounded-lg p-4">
              <h3 className="text-lg font-bold text-cyan-300 mb-3">Join Guild</h3>
              <div className="space-y-2">
                {availableGuilds?.map((availableGuild) => (
                  <div
                    key={availableGuild._id}
                    className="flex justify-between items-center p-3 bg-black/20 rounded border border-gray-600"
                  >
                    <div>
                      <h4 className="font-semibold text-cyan-100">{availableGuild.name}</h4>
                      <p className="text-sm text-gray-400">
                        {availableGuild.memberCount} members
                      </p>
                      {availableGuild.description && (
                        <p className="text-xs text-gray-500 mt-1">
                          {availableGuild.description}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleJoinGuild(availableGuild._id)}
                      className="px-3 py-1 bg-cyan-600 hover:bg-cyan-700 text-white text-sm rounded transition-colors"
                    >
                      Join
                    </button>
                  </div>
                ))}
                {availableGuilds?.length === 0 && (
                  <div className="text-center text-gray-400 py-4">
                    <p>No public guilds available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

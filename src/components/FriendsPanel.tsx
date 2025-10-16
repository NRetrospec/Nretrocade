import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex2/_generated2/api";
import { useState } from "react";

export function FriendsPanel() {
  const friends = useQuery(api.friends.getFriends);
  const pendingRequests = useQuery(api.friends.getPendingRequests);
  const acceptRequest = useMutation(api.friends.acceptFriendRequest);
  const [activeTab, setActiveTab] = useState<"friends" | "requests">("friends");

  const handleAcceptRequest = async (friendshipId: any) => {
    try {
      await acceptRequest({ friendshipId });
    } catch (err) {
      console.error("Failed to accept friend request:", err);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-cyan-500/30">
        <h2 className="text-xl font-bold text-cyan-300 mb-4 pixel-font">FRIENDS</h2>
        
        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("friends")}
            className={`px-3 py-2 rounded text-sm font-semibold transition-colors ${
              activeTab === "friends"
                ? "bg-cyan-500/30 text-cyan-300"
                : "bg-black/30 text-gray-400 hover:text-cyan-300"
            }`}
          >
            Friends ({friends?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab("requests")}
            className={`px-3 py-2 rounded text-sm font-semibold transition-colors ${
              activeTab === "requests"
                ? "bg-cyan-500/30 text-cyan-300"
                : "bg-black/30 text-gray-400 hover:text-cyan-300"
            }`}
          >
            Requests ({pendingRequests?.length || 0})
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === "friends" && (
          <div className="space-y-3">
            {friends?.map((friend) => (
              <div
                key={friend._id}
                className="bg-black/40 border border-cyan-500/30 rounded-lg p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold">
                    {friend.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-cyan-100">{friend.username}</h3>
                    <div className="text-sm text-gray-400">
                      Level {friend.level} • {friend.exp} EXP
                    </div>
                  </div>
                  <div className="text-xs text-green-400">● Online</div>
                </div>
              </div>
            ))}

            {friends?.length === 0 && (
              <div className="text-center text-gray-400 py-8">
                <div className="text-4xl mb-2">👥</div>
                <p>No friends yet</p>
                <p className="text-sm">Add friends to see them here</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "requests" && (
          <div className="space-y-3">
            {pendingRequests?.map((request) => (
              <div
                key={request._id}
                className="bg-black/40 border border-yellow-500/30 rounded-lg p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                    {request.requesterProfile.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-cyan-100">
                      {request.requesterProfile.username}
                    </h3>
                    <div className="text-sm text-gray-400">
                      Level {request.requesterProfile.level}
                    </div>
                  </div>
                  <button
                    onClick={() => handleAcceptRequest(request._id)}
                    className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
                  >
                    Accept
                  </button>
                </div>
              </div>
            ))}

            {pendingRequests?.length === 0 && (
              <div className="text-center text-gray-400 py-8">
                <div className="text-4xl mb-2">📬</div>
                <p>No pending requests</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

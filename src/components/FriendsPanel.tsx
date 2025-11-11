import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { useUser } from "../contexts/UserContext";
import { showSuccess, showError } from "../utils/notifications";

export function FriendsPanel() {
  const { currentUser } = useUser();
  const [activeTab, setActiveTab] = useState<"friends" | "requests">("friends");
  const [friendUsername, setFriendUsername] = useState("");
  const [sendingRequest, setSendingRequest] = useState(false);

  const friends = useQuery(
    api.friends.getFriends,
    currentUser?._id ? { userId: currentUser._id } : "skip"
  );
  const pendingRequests = useQuery(
    api.friends.getPendingRequests,
    currentUser?._id ? { userId: currentUser._id } : "skip"
  );

  const acceptRequest = useMutation(api.friends.acceptFriendRequest);
  const sendRequest = useMutation(api.friends.sendFriendRequest);

  const handleAcceptRequest = async (requestId: any) => {
    try {
      await acceptRequest({ requestId });
    } catch (err) {
      console.error("Failed to accept friend request:", err);
    }
  };

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?._id || !friendUsername.trim()) return;

    setSendingRequest(true);
    try {
      await sendRequest({
        requesterId: currentUser._id,
        recipientUsername: friendUsername.trim(),
      });
      showSuccess(`Friend request sent to ${friendUsername}`, "They'll see your request in their Friends panel");
      setFriendUsername("");
    } catch (err: any) {
      showError(err.message || "Failed to send friend request", "Make sure the username is correct");
    } finally {
      setSendingRequest(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-cyan-500/30">
        <h2 className="text-xl font-bold text-cyan-300 mb-4 pixel-font">FRIENDS</h2>

        {/* Add Friend Form */}
        <form onSubmit={handleSendRequest} className="mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={friendUsername}
              onChange={(e) => setFriendUsername(e.target.value)}
              placeholder="Enter username..."
              className="flex-1 px-3 py-2 bg-black/50 border border-cyan-500/30 rounded text-cyan-100 placeholder-gray-500 focus:outline-none focus:border-cyan-500"
              disabled={sendingRequest}
            />
            <button
              type="submit"
              disabled={sendingRequest || !friendUsername.trim()}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded transition-colors font-semibold"
            >
              {sendingRequest ? "Sending..." : "Add"}
            </button>
          </div>
        </form>

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
                  {friend.avatarUrl ? (
                    <img
                      src={friend.avatarUrl}
                      alt={friend.username}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold">
                      {friend.username.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-cyan-100">{friend.username}</h3>
                    <div className="text-sm text-gray-400">
                      Level {friend.level} • {friend.exp} EXP
                    </div>
                  </div>
                  {friend.isOnline ? (
                    <div className="text-xs text-green-400">● Online</div>
                  ) : (
                    <div className="text-xs text-gray-500">● Offline</div>
                  )}
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
                key={request.requestId}
                className="bg-black/40 border border-yellow-500/30 rounded-lg p-3"
              >
                <div className="flex items-center gap-3">
                  {request.requester.avatarUrl ? (
                    <img
                      src={request.requester.avatarUrl}
                      alt={request.requester.username}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                      {request.requester.username.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-cyan-100">
                      {request.requester.username}
                    </h3>
                    <div className="text-sm text-gray-400">
                      Level {request.requester.level}
                    </div>
                  </div>
                  <button
                    onClick={() => handleAcceptRequest(request.requestId)}
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

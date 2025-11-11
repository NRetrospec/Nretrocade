/**
 * Friends System Module
 * Handles friend requests, friendships, and online status
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { isUserOnline } from "./utils";

// ========== QUERIES ==========

/**
 * Get all accepted friends for a user
 */
export const getFriends = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Get friendships where user is either requester or recipient
    const asRequester = await ctx.db
      .query("friendships")
      .withIndex("by_requester", (q) => q.eq("requesterId", args.userId))
      .filter((q) => q.eq(q.field("status"), "accepted"))
      .collect();

    const asRecipient = await ctx.db
      .query("friendships")
      .withIndex("by_recipient", (q) => q.eq("recipientId", args.userId))
      .filter((q) => q.eq(q.field("status"), "accepted"))
      .collect();

    // Get friend user IDs
    const friendIds = [
      ...asRequester.map((f) => f.recipientId),
      ...asRecipient.map((f) => f.requesterId),
    ];

    // Get friend profiles
    const friends = await Promise.all(
      friendIds.map(async (friendId) => {
        const user = await ctx.db.get(friendId);
        if (!user) return null;

        return {
          _id: user._id,
          userId: user.userId,
          username: user.username,
          avatarUrl: user.avatarUrl,
          level: user.level,
          exp: user.exp,
          isOnline: isUserOnline(user.lastSeen),
          lastSeen: user.lastSeen,
        };
      })
    );

    // Filter out nulls and sort by online status, then by username
    return friends
      .filter((f) => f !== null)
      .sort((a, b) => {
        if (a.isOnline !== b.isOnline) {
          return a.isOnline ? -1 : 1;
        }
        return a.username.localeCompare(b.username);
      });
  },
});

/**
 * Get pending friend requests (incoming)
 */
export const getPendingRequests = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const requests = await ctx.db
      .query("friendships")
      .withIndex("by_recipient_and_status", (q) =>
        q.eq("recipientId", args.userId).eq("status", "pending")
      )
      .collect();

    // Get requester profiles
    const requestsWithUsers = await Promise.all(
      requests.map(async (request) => {
        const requester = await ctx.db.get(request.requesterId);
        if (!requester) return null;

        return {
          requestId: request._id,
          requester: {
            _id: requester._id,
            userId: requester.userId,
            username: requester.username,
            avatarUrl: requester.avatarUrl,
            level: requester.level,
          },
          createdAt: request.createdAt,
        };
      })
    );

    return requestsWithUsers.filter((r) => r !== null);
  },
});

/**
 * Get sent friend requests (outgoing pending)
 */
export const getSentRequests = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const requests = await ctx.db
      .query("friendships")
      .withIndex("by_requester", (q) => q.eq("requesterId", args.userId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    // Get recipient profiles
    const requestsWithUsers = await Promise.all(
      requests.map(async (request) => {
        const recipient = await ctx.db.get(request.recipientId);
        if (!recipient) return null;

        return {
          requestId: request._id,
          recipient: {
            _id: recipient._id,
            userId: recipient.userId,
            username: recipient.username,
            avatarUrl: recipient.avatarUrl,
            level: recipient.level,
          },
          createdAt: request.createdAt,
        };
      })
    );

    return requestsWithUsers.filter((r) => r !== null);
  },
});

/**
 * Check if two users are friends
 */
export const areFriends = query({
  args: {
    userId1: v.id("users"),
    userId2: v.id("users"),
  },
  handler: async (ctx, args) => {
    const friendship = await ctx.db
      .query("friendships")
      .withIndex("by_requester_and_recipient", (q) =>
        q.eq("requesterId", args.userId1).eq("recipientId", args.userId2)
      )
      .first();

    if (friendship && friendship.status === "accepted") {
      return { areFriends: true, status: "accepted" };
    }

    const reverseFriendship = await ctx.db
      .query("friendships")
      .withIndex("by_requester_and_recipient", (q) =>
        q.eq("requesterId", args.userId2).eq("recipientId", args.userId1)
      )
      .first();

    if (reverseFriendship) {
      return {
        areFriends: reverseFriendship.status === "accepted",
        status: reverseFriendship.status,
      };
    }

    return { areFriends: false, status: null };
  },
});

/**
 * Get friendship status between two users
 */
export const getFriendshipStatus = query({
  args: {
    userId: v.id("users"),
    targetUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Check if userId sent request to targetUserId
    const outgoing = await ctx.db
      .query("friendships")
      .withIndex("by_requester_and_recipient", (q) =>
        q.eq("requesterId", args.userId).eq("recipientId", args.targetUserId)
      )
      .first();

    if (outgoing) {
      return {
        status: outgoing.status,
        direction: "outgoing",
        requestId: outgoing._id,
      };
    }

    // Check if targetUserId sent request to userId
    const incoming = await ctx.db
      .query("friendships")
      .withIndex("by_requester_and_recipient", (q) =>
        q.eq("requesterId", args.targetUserId).eq("recipientId", args.userId)
      )
      .first();

    if (incoming) {
      return {
        status: incoming.status,
        direction: "incoming",
        requestId: incoming._id,
      };
    }

    return { status: null, direction: null, requestId: null };
  },
});

// ========== MUTATIONS ==========

/**
 * Send a friend request
 */
export const sendFriendRequest = mutation({
  args: {
    requesterId: v.id("users"),
    recipientUsername: v.string(),
  },
  handler: async (ctx, args) => {
    // Find recipient by username
    const recipient = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.recipientUsername))
      .first();

    if (!recipient) {
      throw new Error("User not found");
    }

    // Can't friend yourself
    if (args.requesterId === recipient._id) {
      throw new Error("Cannot send friend request to yourself");
    }

    // Check if friendship already exists
    const existing = await ctx.db
      .query("friendships")
      .withIndex("by_requester_and_recipient", (q) =>
        q.eq("requesterId", args.requesterId).eq("recipientId", recipient._id)
      )
      .first();

    if (existing) {
      if (existing.status === "accepted") {
        throw new Error("Already friends");
      }
      if (existing.status === "pending") {
        throw new Error("Friend request already sent");
      }
      if (existing.status === "rejected") {
        throw new Error("Friend request was rejected");
      }
    }

    // Check reverse friendship
    const reverse = await ctx.db
      .query("friendships")
      .withIndex("by_requester_and_recipient", (q) =>
        q.eq("requesterId", recipient._id).eq("recipientId", args.requesterId)
      )
      .first();

    if (reverse) {
      if (reverse.status === "pending") {
        // Automatically accept if there's a pending request from the other user
        await ctx.db.patch(reverse._id, {
          status: "accepted",
          acceptedAt: Date.now(),
        });

        return {
          success: true,
          autoAccepted: true,
          message: "Friend request accepted (mutual)",
        };
      }
      if (reverse.status === "accepted") {
        throw new Error("Already friends");
      }
    }

    // Create friend request
    const requestId = await ctx.db.insert("friendships", {
      requesterId: args.requesterId,
      recipientId: recipient._id,
      status: "pending",
      createdAt: Date.now(),
    });

    return {
      success: true,
      requestId,
      recipientUsername: recipient.username,
    };
  },
});

/**
 * Accept a friend request
 */
export const acceptFriendRequest = mutation({
  args: { requestId: v.id("friendships") },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);

    if (!request) {
      throw new Error("Friend request not found");
    }

    if (request.status !== "pending") {
      throw new Error("Friend request is not pending");
    }

    await ctx.db.patch(args.requestId, {
      status: "accepted",
      acceptedAt: Date.now(),
    });

    // Award XP bonus for making a friend
    const recipient = await ctx.db.get(request.recipientId);
    if (recipient) {
      await ctx.db.patch(request.recipientId, {
        exp: recipient.exp + 10,
      });
    }

    return { success: true };
  },
});

/**
 * Reject a friend request
 */
export const rejectFriendRequest = mutation({
  args: { requestId: v.id("friendships") },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);

    if (!request) {
      throw new Error("Friend request not found");
    }

    if (request.status !== "pending") {
      throw new Error("Friend request is not pending");
    }

    await ctx.db.patch(args.requestId, {
      status: "rejected",
    });

    return { success: true };
  },
});

/**
 * Remove a friend (unfriend)
 */
export const removeFriend = mutation({
  args: {
    userId: v.id("users"),
    friendId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Find the friendship
    const friendship1 = await ctx.db
      .query("friendships")
      .withIndex("by_requester_and_recipient", (q) =>
        q.eq("requesterId", args.userId).eq("recipientId", args.friendId)
      )
      .first();

    if (friendship1) {
      await ctx.db.delete(friendship1._id);
      return { success: true };
    }

    const friendship2 = await ctx.db
      .query("friendships")
      .withIndex("by_requester_and_recipient", (q) =>
        q.eq("requesterId", args.friendId).eq("recipientId", args.userId)
      )
      .first();

    if (friendship2) {
      await ctx.db.delete(friendship2._id);
      return { success: true };
    }

    throw new Error("Friendship not found");
  },
});

/**
 * Cancel a sent friend request
 */
export const cancelFriendRequest = mutation({
  args: { requestId: v.id("friendships") },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);

    if (!request) {
      throw new Error("Friend request not found");
    }

    if (request.status !== "pending") {
      throw new Error("Can only cancel pending requests");
    }

    await ctx.db.delete(args.requestId);

    return { success: true };
  },
});

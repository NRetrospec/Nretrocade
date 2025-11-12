/**
 * User Management Module
 * Handles user profiles, XP, leveling, and leaderboards
 * Supports both Clerk authentication and anonymous users
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  calculateLevelFromExp,
  generateDefaultAvatar,
  generateUserId,
  isValidUsername,
  isUserOnline,
} from "./utils";

// ========== QUERIES ==========

/**
 * Get current user profile by userId
 */
export const getProfile = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!user) return null;

    // Calculate level info from XP
    const levelInfo = calculateLevelFromExp(user.exp ?? 0);

    return {
      ...user,
      levelInfo,
      isOnline: isUserOnline(user.lastSeen ?? 0),
    };
  },
});

/**
 * Get user profile by internal Convex ID
 */
export const getProfileById = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id);
    if (!user) return null;

    const levelInfo = calculateLevelFromExp(user.exp ?? 0);

    return {
      ...user,
      levelInfo,
      isOnline: isUserOnline(user.lastSeen ?? 0),
    };
  },
});

/**
 * Get multiple user profiles by IDs (for friends list, etc.)
 */
export const getProfilesByIds = query({
  args: { userIds: v.array(v.id("users")) },
  handler: async (ctx, args) => {
    const users = await Promise.all(
      args.userIds.map((id) => ctx.db.get(id))
    );

    return users
      .filter((user) => user !== null)
      .map((user) => ({
        ...user,
        levelInfo: calculateLevelFromExp(user.exp ?? 0),
        isOnline: isUserOnline(user.lastSeen ?? 0),
      }));
  },
});

/**
 * Check if username is available
 */
export const isUsernameAvailable = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    if (!isValidUsername(args.username)) {
      return { available: false, reason: "Invalid username format" };
    }

    const existing = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();

    if (existing) {
      return { available: false, reason: "Username already taken" };
    }

    return { available: true };
  },
});

/**
 * Get leaderboard (top users by XP)
 */
export const getLeaderboard = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;

    const users = await ctx.db
      .query("users")
      .withIndex("by_exp")
      .order("desc")
      .take(limit);

    return users.map((user, index) => ({
      rank: index + 1,
      _id: user._id,
      userId: user.userId,
      username: user.username ?? "",
      avatarUrl: user.avatarUrl,
      level: user.level,
      exp: user.exp ?? 0,
      totalPlaytime: user.totalPlaytime ?? 0,
      levelInfo: calculateLevelFromExp(user.exp ?? 0),
    }));
  },
});

/**
 * Search users by username
 */
export const searchUsers = query({
  args: { searchTerm: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    const searchLower = args.searchTerm.toLowerCase();

    // Simple search - get all users and filter
    // For production, consider implementing a search index
    const allUsers = await ctx.db.query("users").take(100);

    const filtered = allUsers
      .filter((user) =>
        (user.username ?? "").toLowerCase().includes(searchLower)
      )
      .slice(0, limit);

    return filtered.map((user) => ({
      _id: user._id,
      userId: user.userId,
      username: user.username ?? "",
      avatarUrl: user.avatarUrl,
      level: user.level,
      exp: user.exp ?? 0,
      isOnline: isUserOnline(user.lastSeen ?? 0),
    }));
  },
});

// ========== MUTATIONS ==========

/**
 * Create or get existing user profile (anonymous login)
 */
export const createOrGetProfile = mutation({
  args: {
    userId: v.optional(v.string()),
    username: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    if (args.userId) {
      const userId = args.userId; // Narrow the type
      const existing = await ctx.db
        .query("users")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .first();

      if (existing) {
        // Update last seen
        await ctx.db.patch(existing._id, {
          lastSeen: Date.now(),
        });
        return { userId: existing.userId, _id: existing._id, isNew: false };
      }
    }

    // Validate username
    if (!isValidUsername(args.username)) {
      throw new Error("Invalid username format (3-20 alphanumeric characters)");
    }

    // Check username availability
    const usernameExists = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();

    if (usernameExists) {
      throw new Error("username taken");
    }

    // Create new user
    const userId = args.userId || generateUserId();
    const now = Date.now();

    const newUserId = await ctx.db.insert("users", {
      userId,
      username: args.username,
      avatarUrl: generateDefaultAvatar(args.username),
      level: 1,
      exp: 0,
      totalPlaytime: 0,
      lastSeen: now,
      createdAt: now,
      isAnonymous: true,
    });

    return { userId, _id: newUserId, isNew: true };
  },
});

/**
 * Sync Clerk user with Convex database
 * Called automatically when a user signs in with Clerk
 */
export const syncClerkUser = mutation({
  args: {
    clerkUserId: v.string(),
    tokenIdentifier: v.string(),
    email: v.optional(v.string()),
    username: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user already exists by tokenIdentifier
    const existing = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", args.tokenIdentifier))
      .first();

    const now = Date.now();

    if (existing) {
      // Update existing user
      await ctx.db.patch(existing._id, {
        lastSeen: now,
        email: args.email,
        avatarUrl: args.avatarUrl || existing.avatarUrl,
        username: args.username || existing.username,
      });
      return { userId: existing.userId, _id: existing._id, isNew: false };
    }

    // Generate username if not provided
    let username = args.username;
    if (!username) {
      // Extract username from email or use Clerk user ID
      username = args.email?.split("@")[0] || `user_${args.clerkUserId.slice(0, 8)}`;
    }

    // Ensure username is unique
    let finalUsername = username;
    let counter = 1;
    while (true) {
      const usernameExists = await ctx.db
        .query("users")
        .withIndex("by_username", (q) => q.eq("username", finalUsername))
        .first();

      if (!usernameExists) break;
      finalUsername = `${username}${counter}`;
      counter++;
    }

    // Create new user
    const newUserId = await ctx.db.insert("users", {
      userId: args.clerkUserId,
      tokenIdentifier: args.tokenIdentifier,
      username: finalUsername,
      email: args.email,
      avatarUrl: args.avatarUrl || generateDefaultAvatar(finalUsername),
      level: 1,
      exp: 0,
      totalPlaytime: 0,
      lastSeen: now,
      createdAt: now,
      isAnonymous: false,
    });

    return { userId: args.clerkUserId, _id: newUserId, isNew: true };
  },
});

/**
 * Get current user by Clerk token identifier
 */
export const getCurrentUser = query({
  args: { tokenIdentifier: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", args.tokenIdentifier))
      .first();

    if (!user) return null;

    const levelInfo = calculateLevelFromExp(user.exp ?? 0);

    return {
      ...user,
      levelInfo,
      isOnline: isUserOnline(user.lastSeen ?? 0),
    };
  },
});

/**
 * Update user profile (username, avatar)
 */
export const updateProfile = mutation({
  args: {
    userId: v.string(),
    username: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const updates: any = {
      lastSeen: Date.now(),
    };

    // Update username if provided
    if (args.username) {
      const username = args.username; // Narrow the type
      if (!isValidUsername(username)) {
        throw new Error("Invalid username format");
      }

      // Check if new username is available
      if (username !== user.username) {
        const existing = await ctx.db
          .query("users")
          .withIndex("by_username", (q) => q.eq("username", username))
          .first();

        if (existing) {
          throw new Error("Username already taken");
        }

        updates.username = username;
      }
    }

    // Update avatar if provided
    if (args.avatarUrl) {
      updates.avatarUrl = args.avatarUrl;
    }

    await ctx.db.patch(user._id, updates);

    return { success: true };
  },
});

/**
 * Add XP to user and handle level-ups
 */
export const addExp = mutation({
  args: {
    userId: v.id("users"),
    expAmount: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const newExp = (user.exp ?? 0) + args.expAmount;
    const oldLevelInfo = calculateLevelFromExp(user.exp ?? 0);
    const newLevelInfo = calculateLevelFromExp(newExp);

    const leveledUp = newLevelInfo.level > oldLevelInfo.level;

    // Update user
    await ctx.db.patch(args.userId, {
      exp: newExp,
      level: newLevelInfo.level,
      lastSeen: Date.now(),
    });

    // Update guild total XP if user is in a guild
    if (user.guildId) {
      const guild = await ctx.db.get(user.guildId);
      if (guild) {
        const newGuildExp = guild.totalExp + args.expAmount;
        const guildLevel = calculateLevelFromExp(newGuildExp).level;

        await ctx.db.patch(user.guildId, {
          totalExp: newGuildExp,
          level: guildLevel,
        });
      }
    }

    return {
      success: true,
      leveledUp,
      oldLevel: oldLevelInfo.level,
      newLevel: newLevelInfo.level,
      totalExp: newExp,
    };
  },
});

/**
 * Update playtime
 */
export const updatePlaytime = mutation({
  args: {
    userId: v.id("users"),
    minutesPlayed: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(args.userId, {
      totalPlaytime: (user.totalPlaytime ?? 0) + args.minutesPlayed,
      lastSeen: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Update last seen timestamp (for online status)
 */
export const updateLastSeen = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, {
      lastSeen: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Delete user account
 */
export const deleteAccount = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Remove from guild if in one
    if (user.guildId) {
      const membership = await ctx.db
        .query("guild_members")
        .withIndex("by_guild_and_user", (q) =>
          q.eq("guildId", user.guildId!).eq("userId", user._id)
        )
        .first();

      if (membership) {
        await ctx.db.delete(membership._id);

        // Update guild member count
        const guild = await ctx.db.get(user.guildId);
        if (guild) {
          await ctx.db.patch(user.guildId, {
            memberCount: guild.memberCount - 1,
          });
        }
      }
    }

    // Delete all friendships
    const friendshipsAsRequester = await ctx.db
      .query("friendships")
      .withIndex("by_requester", (q) => q.eq("requesterId", user._id))
      .collect();

    const friendshipsAsRecipient = await ctx.db
      .query("friendships")
      .withIndex("by_recipient", (q) => q.eq("recipientId", user._id))
      .collect();

    for (const friendship of [...friendshipsAsRequester, ...friendshipsAsRecipient]) {
      await ctx.db.delete(friendship._id);
    }

    // Delete user
    await ctx.db.delete(user._id);

    return { success: true };
  },
});

/**
 * Game Session Tracking Module
 * Handles gameplay tracking, XP awards, and playtime statistics
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { calculateExpFromPlaytime } from "./utils";

// ========== QUERIES ==========

/**
 * Get active session for a user (incomplete session)
 */
export const getActiveSession = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("game_sessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("completed"), false))
      .first();

    if (!session) return null;

    // Get game info
    const game = await ctx.db.get(session.gameId);

    return {
      ...session,
      game,
      currentDuration: Math.floor((Date.now() - session.startTime) / 60000),
    };
  },
});

/**
 * Get user's play history
 */
export const getUserSessions = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;

    const sessions = await ctx.db
      .query("game_sessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("completed"), true))
      .order("desc")
      .take(limit);

    // Get game info for each session
    const sessionsWithGames = await Promise.all(
      sessions.map(async (session) => {
        const game = await ctx.db.get(session.gameId);
        return {
          ...session,
          game,
        };
      })
    );

    return sessionsWithGames;
  },
});

/**
 * Get game play statistics for a user
 */
export const getUserGameStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("game_sessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("completed"), true))
      .collect();

    const totalPlaytime = sessions.reduce((sum, s) => sum + s.duration, 0);
    const totalExpEarned = sessions.reduce((sum, s) => sum + s.expAwarded, 0);
    const totalGamesPlayed = sessions.length;

    // Get unique games played
    const uniqueGames = new Set(sessions.map((s) => s.gameId));
    const uniqueGamesCount = uniqueGames.size;

    // Most played game
    const gameCounts: Record<string, number> = {};
    sessions.forEach((s) => {
      gameCounts[s.gameId] = (gameCounts[s.gameId] || 0) + s.duration;
    });

    const mostPlayedGameId = Object.entries(gameCounts).sort(
      ([, a], [, b]) => b - a
    )[0]?.[0];

    let mostPlayedGame = null;
    if (mostPlayedGameId) {
      mostPlayedGame = await ctx.db.get(mostPlayedGameId as any);
    }

    return {
      totalPlaytime,
      totalExpEarned,
      totalGamesPlayed,
      uniqueGamesCount,
      mostPlayedGame,
    };
  },
});

/**
 * Get leaderboard for a specific game
 */
export const getGameLeaderboard = query({
  args: {
    gameId: v.id("games"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;

    // Get all sessions for this game
    const sessions = await ctx.db
      .query("game_sessions")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .filter((q) => q.eq(q.field("completed"), true))
      .collect();

    // Group by user and sum playtime
    const userPlaytimes: Record<string, number> = {};
    sessions.forEach((session) => {
      const userId = session.userId;
      userPlaytimes[userId] = (userPlaytimes[userId] || 0) + session.duration;
    });

    // Sort by playtime
    const sorted = Object.entries(userPlaytimes)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit);

    // Get user info
    const leaderboard = await Promise.all(
      sorted.map(async ([userId, playtime], index) => {
        const user = await ctx.db.get(userId as any);
        return {
          rank: index + 1,
          user,
          playtime,
        };
      })
    );

    return leaderboard;
  },
});

// ========== MUTATIONS ==========

/**
 * Start a new game session
 */
export const startSession = mutation({
  args: {
    userId: v.id("users"),
    gameId: v.id("games"),
  },
  handler: async (ctx, args) => {
    // Check if user has an active session
    const activeSession = await ctx.db
      .query("game_sessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("completed"), false))
      .first();

    if (activeSession) {
      // End the previous session first
      const duration = Math.floor((Date.now() - activeSession.startTime) / 60000);
      const expAwarded = calculateExpFromPlaytime(duration);

      await ctx.db.patch(activeSession._id, {
        endTime: Date.now(),
        duration,
        expAwarded,
        completed: true,
      });

      // Award XP to user
      const user = await ctx.db.get(args.userId);
      if (user) {
        await ctx.db.patch(args.userId, {
          exp: user.exp + expAwarded,
          totalPlaytime: user.totalPlaytime + duration,
        });
      }
    }

    // Create new session
    const sessionId = await ctx.db.insert("game_sessions", {
      userId: args.userId,
      gameId: args.gameId,
      startTime: Date.now(),
      duration: 0,
      expAwarded: 0,
      completed: false,
    });

    return { sessionId, success: true };
  },
});

/**
 * End current game session and award XP
 */
export const endSession = mutation({
  args: {
    userId: v.id("users"),
    completed: v.optional(v.boolean()), // Did user complete the game?
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("game_sessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("completed"), false))
      .first();

    if (!session) {
      throw new Error("No active session found");
    }

    // Calculate duration in minutes
    const duration = Math.floor((Date.now() - session.startTime) / 60000);

    // Calculate XP (10 XP per minute + bonus for completion)
    let expAwarded = calculateExpFromPlaytime(duration);
    if (args.completed) {
      expAwarded += 50; // Completion bonus
    }

    // Update session
    await ctx.db.patch(session._id, {
      endTime: Date.now(),
      duration,
      expAwarded,
      completed: true,
    });

    // Award XP to user
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const newExp = user.exp + expAwarded;
    const newPlaytime = user.totalPlaytime + duration;

    await ctx.db.patch(args.userId, {
      exp: newExp,
      totalPlaytime: newPlaytime,
      lastSeen: Date.now(),
    });

    // Update game play count
    const game = await ctx.db.get(session.gameId);
    if (game) {
      await ctx.db.patch(session.gameId, {
        playCount: game.playCount + 1,
      });
    }

    // Update guild XP if user is in a guild
    if (user.guildId) {
      const guild = await ctx.db.get(user.guildId);
      if (guild) {
        await ctx.db.patch(user.guildId, {
          totalExp: guild.totalExp + expAwarded,
        });
      }
    }

    return {
      success: true,
      duration,
      expAwarded,
      totalExp: newExp,
      totalPlaytime: newPlaytime,
    };
  },
});

/**
 * Heartbeat to keep session alive (called periodically during gameplay)
 */
export const updateSessionHeartbeat = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("game_sessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("completed"), false))
      .first();

    if (!session) {
      return { success: false, message: "No active session" };
    }

    // Update user's last seen
    await ctx.db.patch(args.userId, {
      lastSeen: Date.now(),
    });

    // Calculate current playtime
    const currentDuration = Math.floor((Date.now() - session.startTime) / 60000);

    return {
      success: true,
      currentDuration,
      estimatedExp: calculateExpFromPlaytime(currentDuration),
    };
  },
});

/**
 * Delete user's game history
 */
export const clearUserSessions = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("game_sessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    for (const session of sessions) {
      await ctx.db.delete(session._id);
    }

    return { success: true, deletedCount: sessions.length };
  },
});

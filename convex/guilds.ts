/**
 * Guild System Module
 * Handles guild creation, membership, and management
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { calculateLevelFromExp } from "./utils";

// ========== QUERIES ==========

/**
 * Get guild by ID
 */
export const getGuild = query({
  args: { guildId: v.id("guilds") },
  handler: async (ctx, args) => {
    const guild = await ctx.db.get(args.guildId);
    if (!guild) return null;

    // Get owner info
    const owner = await ctx.db.get(guild.ownerId);

    // Calculate guild level from total XP
    const levelInfo = calculateLevelFromExp(guild.totalExp);

    return {
      ...guild,
      owner,
      levelInfo,
    };
  },
});

/**
 * Get user's current guild
 */
export const getUserGuild = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user || !user.guildId) return null;

    const guild = await ctx.db.get(user.guildId);
    if (!guild) return null;

    const owner = await ctx.db.get(guild.ownerId);
    const levelInfo = calculateLevelFromExp(guild.totalExp);

    return {
      ...guild,
      owner,
      levelInfo,
    };
  },
});

/**
 * Get all guild members
 */
export const getGuildMembers = query({
  args: { guildId: v.id("guilds") },
  handler: async (ctx, args) => {
    const memberships = await ctx.db
      .query("guild_members")
      .withIndex("by_guild", (q) => q.eq("guildId", args.guildId))
      .collect();

    // Get member profiles
    const members = await Promise.all(
      memberships.map(async (membership) => {
        const user = await ctx.db.get(membership.userId);
        if (!user) return null;

        return {
          _id: user._id,
          userId: user.userId,
          username: user.username,
          avatarUrl: user.avatarUrl,
          level: user.level,
          exp: user.exp,
          role: membership.role,
          joinedAt: membership.joinedAt,
        };
      })
    );

    return members
      .filter((m) => m !== null)
      .sort((a, b) => {
        // Sort by role (owner > admin > member), then by join date
        const roleOrder = { owner: 0, admin: 1, member: 2 };
        if (roleOrder[a.role] !== roleOrder[b.role]) {
          return roleOrder[a.role] - roleOrder[b.role];
        }
        return a.joinedAt - b.joinedAt;
      });
  },
});

/**
 * Search for public guilds
 */
export const searchGuilds = query({
  args: {
    searchTerm: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;

    let guilds;
    if (args.searchTerm) {
      const searchTerm = args.searchTerm; // Narrow the type
      // Search by name
      guilds = await ctx.db
        .query("guilds")
        .withSearchIndex("search_guilds", (q) =>
          q.search("name", searchTerm)
        )
        .take(limit);
    } else {
      // Get all public guilds
      guilds = await ctx.db
        .query("guilds")
        .withIndex("by_privacy", (q) => q.eq("isPrivate", false))
        .order("desc")
        .take(limit);
    }

    // Filter to only public guilds and add level info
    return guilds
      .filter((g) => !g.isPrivate)
      .map((guild) => ({
        ...guild,
        levelInfo: calculateLevelFromExp(guild.totalExp),
      }));
  },
});

/**
 * Get guild leaderboard (by level/XP)
 */
export const getGuildLeaderboard = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;

    const guilds = await ctx.db
      .query("guilds")
      .withIndex("by_level")
      .order("desc")
      .take(limit);

    return guilds.map((guild, index) => ({
      rank: index + 1,
      _id: guild._id,
      name: guild.name,
      level: guild.level,
      totalExp: guild.totalExp,
      memberCount: guild.memberCount,
      levelInfo: calculateLevelFromExp(guild.totalExp),
    }));
  },
});

/**
 * Check if user is in a guild
 */
export const isUserInGuild = query({
  args: {
    userId: v.id("users"),
    guildId: v.id("guilds"),
  },
  handler: async (ctx, args) => {
    const membership = await ctx.db
      .query("guild_members")
      .withIndex("by_guild_and_user", (q) =>
        q.eq("guildId", args.guildId).eq("userId", args.userId)
      )
      .first();

    return membership !== null;
  },
});

/**
 * Get user's role in guild
 */
export const getUserGuildRole = query({
  args: {
    userId: v.id("users"),
    guildId: v.id("guilds"),
  },
  handler: async (ctx, args) => {
    const membership = await ctx.db
      .query("guild_members")
      .withIndex("by_guild_and_user", (q) =>
        q.eq("guildId", args.guildId).eq("userId", args.userId)
      )
      .first();

    return membership?.role || null;
  },
});

// ========== MUTATIONS ==========

/**
 * Create a new guild
 */
export const createGuild = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    description: v.string(),
    isPrivate: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Check if user is already in a guild
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (user.guildId) {
      throw new Error("You are already in a guild. Leave your current guild first.");
    }

    // Validate guild name (3-30 characters)
    if (args.name.length < 3 || args.name.length > 30) {
      throw new Error("Guild name must be 3-30 characters");
    }

    // Check if guild name is taken
    const existing = await ctx.db
      .query("guilds")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();

    if (existing) {
      throw new Error("Guild name already taken");
    }

    // Create guild
    const guildId = await ctx.db.insert("guilds", {
      name: args.name,
      description: args.description,
      ownerId: args.userId,
      isPrivate: args.isPrivate,
      memberCount: 1,
      totalExp: user.exp, // Start with creator's XP
      level: user.level,
      createdAt: Date.now(),
    });

    // Add creator as owner member
    await ctx.db.insert("guild_members", {
      guildId,
      userId: args.userId,
      role: "owner",
      joinedAt: Date.now(),
    });

    // Update user's guild
    await ctx.db.patch(args.userId, {
      guildId,
    });

    // Award XP for creating guild
    await ctx.db.patch(args.userId, {
      exp: user.exp + 100,
    });

    return { success: true, guildId };
  },
});

/**
 * Join a guild
 */
export const joinGuild = mutation({
  args: {
    userId: v.id("users"),
    guildId: v.id("guilds"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const guild = await ctx.db.get(args.guildId);
    if (!guild) {
      throw new Error("Guild not found");
    }

    // Check if user is already in a guild
    if (user.guildId) {
      throw new Error("You are already in a guild. Leave your current guild first.");
    }

    // Check if guild is private
    if (guild.isPrivate) {
      throw new Error("This guild is private and requires an invitation");
    }

    // Check if user is already a member
    const existing = await ctx.db
      .query("guild_members")
      .withIndex("by_guild_and_user", (q) =>
        q.eq("guildId", args.guildId).eq("userId", args.userId)
      )
      .first();

    if (existing) {
      throw new Error("You are already a member of this guild");
    }

    // Add user to guild
    await ctx.db.insert("guild_members", {
      guildId: args.guildId,
      userId: args.userId,
      role: "member",
      joinedAt: Date.now(),
    });

    // Update guild stats
    await ctx.db.patch(args.guildId, {
      memberCount: guild.memberCount + 1,
      totalExp: guild.totalExp + user.exp,
      level: calculateLevelFromExp(guild.totalExp + user.exp).level,
    });

    // Update user's guild
    await ctx.db.patch(args.userId, {
      guildId: args.guildId,
    });

    return { success: true };
  },
});

/**
 * Leave a guild
 */
export const leaveGuild = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user || !user.guildId) {
      throw new Error("You are not in a guild");
    }

    const guild = await ctx.db.get(user.guildId);
    if (!guild) {
      throw new Error("Guild not found");
    }

    // Check if user is the owner
    if (guild.ownerId === args.userId) {
      // Transfer ownership to another admin, or delete guild if no other members
      const members = await ctx.db
        .query("guild_members")
        .withIndex("by_guild", (q) => q.eq("guildId", user.guildId!))
        .collect();

      if (members.length === 1) {
        // Only member is the owner, delete the guild
        await ctx.db.delete(user.guildId);

        // Delete all guild messages
        const messages = await ctx.db
          .query("guild_messages")
          .withIndex("by_guild", (q) => q.eq("guildId", user.guildId!))
          .collect();

        for (const message of messages) {
          await ctx.db.delete(message._id);
        }

        // Delete membership
        for (const member of members) {
          await ctx.db.delete(member._id);
        }
      } else {
        // Transfer ownership to first admin or first member
        const newOwner = members.find(
          (m) => m.userId !== args.userId && m.role === "admin"
        ) || members.find((m) => m.userId !== args.userId);

        if (newOwner) {
          await ctx.db.patch(user.guildId, {
            ownerId: newOwner.userId,
            memberCount: guild.memberCount - 1,
            totalExp: guild.totalExp - user.exp,
            level: calculateLevelFromExp(guild.totalExp - user.exp).level,
          });

          // Update new owner's role
          const ownerMembership = await ctx.db
            .query("guild_members")
            .withIndex("by_guild_and_user", (q) =>
              q.eq("guildId", user.guildId!).eq("userId", newOwner.userId)
            )
            .first();

          if (ownerMembership) {
            await ctx.db.patch(ownerMembership._id, {
              role: "owner",
            });
          }
        }

        // Remove user's membership
        const membership = await ctx.db
          .query("guild_members")
          .withIndex("by_guild_and_user", (q) =>
            q.eq("guildId", user.guildId!).eq("userId", args.userId)
          )
          .first();

        if (membership) {
          await ctx.db.delete(membership._id);
        }
      }
    } else {
      // Regular member leaving
      const membership = await ctx.db
        .query("guild_members")
        .withIndex("by_guild_and_user", (q) =>
          q.eq("guildId", user.guildId!).eq("userId", args.userId)
        )
        .first();

      if (membership) {
        await ctx.db.delete(membership._id);
      }

      // Update guild stats
      await ctx.db.patch(user.guildId, {
        memberCount: guild.memberCount - 1,
        totalExp: guild.totalExp - user.exp,
        level: calculateLevelFromExp(guild.totalExp - user.exp).level,
      });
    }

    // Update user
    await ctx.db.patch(args.userId, {
      guildId: undefined,
    });

    return { success: true };
  },
});

/**
 * Promote member to admin (owner only)
 */
export const promoteMember = mutation({
  args: {
    ownerId: v.id("users"),
    memberId: v.id("users"),
    guildId: v.id("guilds"),
  },
  handler: async (ctx, args) => {
    const guild = await ctx.db.get(args.guildId);
    if (!guild) {
      throw new Error("Guild not found");
    }

    // Check if requester is owner
    if (guild.ownerId !== args.ownerId) {
      throw new Error("Only the guild owner can promote members");
    }

    // Get member's membership
    const membership = await ctx.db
      .query("guild_members")
      .withIndex("by_guild_and_user", (q) =>
        q.eq("guildId", args.guildId).eq("userId", args.memberId)
      )
      .first();

    if (!membership) {
      throw new Error("User is not a member of this guild");
    }

    if (membership.role === "owner") {
      throw new Error("Cannot promote the guild owner");
    }

    await ctx.db.patch(membership._id, {
      role: "admin",
    });

    return { success: true };
  },
});

/**
 * Demote admin to member (owner only)
 */
export const demoteMember = mutation({
  args: {
    ownerId: v.id("users"),
    memberId: v.id("users"),
    guildId: v.id("guilds"),
  },
  handler: async (ctx, args) => {
    const guild = await ctx.db.get(args.guildId);
    if (!guild) {
      throw new Error("Guild not found");
    }

    // Check if requester is owner
    if (guild.ownerId !== args.ownerId) {
      throw new Error("Only the guild owner can demote members");
    }

    // Get member's membership
    const membership = await ctx.db
      .query("guild_members")
      .withIndex("by_guild_and_user", (q) =>
        q.eq("guildId", args.guildId).eq("userId", args.memberId)
      )
      .first();

    if (!membership) {
      throw new Error("User is not a member of this guild");
    }

    if (membership.role === "owner") {
      throw new Error("Cannot demote the guild owner");
    }

    await ctx.db.patch(membership._id, {
      role: "member",
    });

    return { success: true };
  },
});

/**
 * Kick member from guild (owner/admin only)
 */
export const kickMember = mutation({
  args: {
    kickerId: v.id("users"),
    memberId: v.id("users"),
    guildId: v.id("guilds"),
  },
  handler: async (ctx, args) => {
    const guild = await ctx.db.get(args.guildId);
    if (!guild) {
      throw new Error("Guild not found");
    }

    // Check if kicker has permission
    const kickerMembership = await ctx.db
      .query("guild_members")
      .withIndex("by_guild_and_user", (q) =>
        q.eq("guildId", args.guildId).eq("userId", args.kickerId)
      )
      .first();

    if (!kickerMembership || (kickerMembership.role !== "owner" && kickerMembership.role !== "admin")) {
      throw new Error("Only guild owners and admins can kick members");
    }

    // Cannot kick yourself
    if (args.kickerId === args.memberId) {
      throw new Error("Cannot kick yourself. Use leave guild instead.");
    }

    // Get member to kick
    const memberToKick = await ctx.db.get(args.memberId);
    if (!memberToKick) {
      throw new Error("Member not found");
    }

    const membership = await ctx.db
      .query("guild_members")
      .withIndex("by_guild_and_user", (q) =>
        q.eq("guildId", args.guildId).eq("userId", args.memberId)
      )
      .first();

    if (!membership) {
      throw new Error("User is not a member of this guild");
    }

    // Cannot kick owner
    if (membership.role === "owner") {
      throw new Error("Cannot kick the guild owner");
    }

    // Admins can only kick regular members
    if (kickerMembership.role === "admin" && membership.role === "admin") {
      throw new Error("Admins cannot kick other admins");
    }

    // Remove membership
    await ctx.db.delete(membership._id);

    // Update guild stats
    await ctx.db.patch(args.guildId, {
      memberCount: guild.memberCount - 1,
      totalExp: guild.totalExp - memberToKick.exp,
      level: calculateLevelFromExp(guild.totalExp - memberToKick.exp).level,
    });

    // Update kicked user
    await ctx.db.patch(args.memberId, {
      guildId: undefined,
    });

    return { success: true };
  },
});

/**
 * Guild Chat Module
 * Handles guild message sending and retrieval
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ========== QUERIES ==========

/**
 * Get guild messages (recent messages with pagination)
 */
export const getGuildMessages = query({
  args: {
    guildId: v.id("guilds"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    const messages = await ctx.db
      .query("guild_messages")
      .withIndex("by_guild_and_timestamp", (q) => q.eq("guildId", args.guildId))
      .order("desc")
      .take(limit);

    // Reverse to show oldest first
    return messages.reverse();
  },
});

/**
 * Get messages after a specific timestamp (for real-time updates)
 */
export const getNewMessages = query({
  args: {
    guildId: v.id("guilds"),
    afterTimestamp: v.number(),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("guild_messages")
      .withIndex("by_guild_and_timestamp", (q) => q.eq("guildId", args.guildId))
      .filter((q) => q.gt(q.field("timestamp"), args.afterTimestamp))
      .collect();

    return messages;
  },
});

/**
 * Get total message count for a guild
 */
export const getGuildMessageCount = query({
  args: { guildId: v.id("guilds") },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("guild_messages")
      .withIndex("by_guild", (q) => q.eq("guildId", args.guildId))
      .collect();

    return messages.length;
  },
});

// ========== MUTATIONS ==========

/**
 * Send a message to guild chat
 */
export const sendMessage = mutation({
  args: {
    guildId: v.id("guilds"),
    userId: v.id("users"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate message content
    if (!args.content.trim()) {
      throw new Error("Message cannot be empty");
    }

    if (args.content.length > 500) {
      throw new Error("Message too long (max 500 characters)");
    }

    // Check if user is a member of the guild
    const membership = await ctx.db
      .query("guild_members")
      .withIndex("by_guild_and_user", (q) =>
        q.eq("guildId", args.guildId).eq("userId", args.userId)
      )
      .first();

    if (!membership) {
      throw new Error("You are not a member of this guild");
    }

    // Get user info for denormalized data
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Create message
    const messageId = await ctx.db.insert("guild_messages", {
      guildId: args.guildId,
      userId: args.userId,
      username: user.username ?? "",
      avatarUrl: user.avatarUrl,
      content: args.content.trim(),
      timestamp: Date.now(),
    });

    return {
      success: true,
      messageId,
      timestamp: Date.now(),
    };
  },
});

/**
 * Delete a message (owner/admin or message author only)
 */
export const deleteMessage = mutation({
  args: {
    messageId: v.id("guild_messages"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    // Check if user is the author
    if (message.userId === args.userId) {
      await ctx.db.delete(args.messageId);
      return { success: true };
    }

    // Check if user is owner/admin
    const membership = await ctx.db
      .query("guild_members")
      .withIndex("by_guild_and_user", (q) =>
        q.eq("guildId", message.guildId).eq("userId", args.userId)
      )
      .first();

    if (!membership) {
      throw new Error("You are not a member of this guild");
    }

    if (membership.role === "owner" || membership.role === "admin") {
      await ctx.db.delete(args.messageId);
      return { success: true };
    }

    throw new Error("You can only delete your own messages");
  },
});

/**
 * Clear all guild messages (owner only)
 */
export const clearGuildMessages = mutation({
  args: {
    guildId: v.id("guilds"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const guild = await ctx.db.get(args.guildId);
    if (!guild) {
      throw new Error("Guild not found");
    }

    // Check if user is owner
    if (guild.ownerId !== args.userId) {
      throw new Error("Only the guild owner can clear all messages");
    }

    const messages = await ctx.db
      .query("guild_messages")
      .withIndex("by_guild", (q) => q.eq("guildId", args.guildId))
      .collect();

    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    return { success: true, deletedCount: messages.length };
  },
});

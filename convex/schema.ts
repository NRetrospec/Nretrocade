import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ========== USER SYSTEM ==========
  // Note: Several fields made optional for backward compatibility with incomplete user documents.
  // Run the fixUsers migration to populate missing fields with defaults.
  // With Clerk integration: userId stores Clerk user ID, tokenIdentifier stores Clerk token subject
  users: defineTable({
    userId: v.optional(v.string()),    // Unique identifier (Clerk user ID or anonymous ID)
    tokenIdentifier: v.optional(v.string()), // Clerk token identifier for authenticated users
    username: v.optional(v.string()),  // Display name
    email: v.optional(v.string()),     // Email (from Clerk or optional for anonymous)
    avatarUrl: v.optional(v.string()), // Profile picture
    level: v.optional(v.number()),     // Current level
    exp: v.optional(v.number()),       // Current XP
    totalPlaytime: v.optional(v.number()), // Total minutes played
    lastSeen: v.optional(v.number()),  // Last activity timestamp
    createdAt: v.optional(v.number()), // Account creation
    guildId: v.optional(v.id("guilds")), // Current guild
    isAnonymous: v.optional(v.boolean()), // Anonymous user flag (false for Clerk users)
  })
    .index("by_userId", ["userId"])
    .index("by_tokenIdentifier", ["tokenIdentifier"])
    .index("by_username", ["username"])
    .index("by_level", ["level"])
    .index("by_exp", ["exp"])
    .index("by_guild", ["guildId"]),

  // ========== GAME SYSTEM ==========
  games: defineTable({
    title: v.string(),
    swfUrl: v.string(),
    thumbnail: v.string(),
    description: v.optional(v.string()),
    tags: v.array(v.string()),
    isMultiplayer: v.boolean(),
    category: v.string(),
    difficulty: v.union(v.literal("Easy"), v.literal("Medium"), v.literal("Hard")),
    playCount: v.number(),
  })
    .index("by_category", ["category"])
    .index("by_multiplayer", ["isMultiplayer"])
    .searchIndex("search_games", {
      searchField: "title",
      filterFields: ["category", "isMultiplayer"],
    }),

  game_sessions: defineTable({
    userId: v.id("users"),        // Player
    gameId: v.id("games"),        // Game being played
    startTime: v.number(),        // Session start
    endTime: v.optional(v.number()), // Session end
    duration: v.number(),         // Minutes played
    expAwarded: v.number(),       // XP gained this session
    completed: v.boolean(),       // Session finished flag
  })
    .index("by_user", ["userId"])
    .index("by_game", ["gameId"])
    .index("by_user_and_game", ["userId", "gameId"])
    .index("by_completed", ["completed"]),

  // ========== FRIENDS SYSTEM ==========
  friendships: defineTable({
    requesterId: v.id("users"),   // User who sent request
    recipientId: v.id("users"),   // User who received request
    status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("rejected")),
    createdAt: v.number(),        // Request timestamp
    acceptedAt: v.optional(v.number()), // Accept timestamp
  })
    .index("by_requester", ["requesterId"])
    .index("by_recipient", ["recipientId"])
    .index("by_status", ["status"])
    .index("by_requester_and_recipient", ["requesterId", "recipientId"])
    .index("by_recipient_and_status", ["recipientId", "status"]),

  // ========== GUILD SYSTEM ==========
  guilds: defineTable({
    name: v.string(),             // Guild name (unique)
    description: v.string(),      // Guild description
    ownerId: v.id("users"),       // Guild creator
    isPrivate: v.boolean(),       // Invite-only flag
    memberCount: v.number(),      // Current members
    totalExp: v.number(),         // Sum of all member XP
    level: v.number(),            // Guild level
    createdAt: v.number(),        // Creation timestamp
  })
    .index("by_name", ["name"])
    .index("by_owner", ["ownerId"])
    .index("by_level", ["level"])
    .index("by_privacy", ["isPrivate"])
    .searchIndex("search_guilds", {
      searchField: "name",
      filterFields: ["isPrivate"],
    }),

  guild_members: defineTable({
    guildId: v.id("guilds"),      // Guild reference
    userId: v.id("users"),        // Member reference
    role: v.union(v.literal("owner"), v.literal("admin"), v.literal("member")),
    joinedAt: v.number(),         // Join timestamp
  })
    .index("by_guild", ["guildId"])
    .index("by_user", ["userId"])
    .index("by_guild_and_user", ["guildId", "userId"]),

  guild_messages: defineTable({
    guildId: v.id("guilds"),      // Guild reference
    userId: v.id("users"),        // Sender
    username: v.string(),         // Sender name (denormalized)
    avatarUrl: v.optional(v.string()), // Sender avatar (denormalized)
    content: v.string(),          // Message text
    timestamp: v.number(),        // Send timestamp
  })
    .index("by_guild", ["guildId"])
    .index("by_guild_and_timestamp", ["guildId", "timestamp"]),
});

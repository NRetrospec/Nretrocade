import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Games table
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
});

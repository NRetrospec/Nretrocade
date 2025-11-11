/**
 * Migration Mutation: Fix Users with Missing Fields
 *
 * This mutation patches all user documents that are missing required fields
 * with safe default values to match the current schema.
 */

import { mutation } from "./_generated/server";

export const fixUsers = mutation({
  args: {},
  handler: async (ctx) => {
    // Get all users from the database
    const allUsers = await ctx.db.query("users").collect();

    let fixedCount = 0;
    const total = allUsers.length;

    console.log(`Found ${total} users to check...`);

    for (const user of allUsers) {
      const updates: any = {};
      let needsUpdate = false;

      // Check and fix createdAt
      if (user.createdAt === undefined || user.createdAt === null) {
        updates.createdAt = Date.now();
        needsUpdate = true;
      }

      // Check and fix exp
      if (user.exp === undefined || user.exp === null) {
        updates.exp = 0;
        needsUpdate = true;
      }

      // Check and fix level
      if (user.level === undefined || user.level === null) {
        updates.level = 1;
        needsUpdate = true;
      }

      // Check and fix totalPlaytime
      if (user.totalPlaytime === undefined || user.totalPlaytime === null) {
        updates.totalPlaytime = 0;
        needsUpdate = true;
      }

      // Check and fix lastSeen
      if (user.lastSeen === undefined || user.lastSeen === null) {
        updates.lastSeen = Date.now();
        needsUpdate = true;
      }

      // Check and fix username
      if (!user.username || user.username.trim() === "") {
        updates.username = "Anonymous";
        needsUpdate = true;
      }

      // Check and fix userId
      if (!user.userId || user.userId.trim() === "") {
        updates.userId = `anon_${user._id}`;
        needsUpdate = true;
      }

      // Check and fix isAnonymous
      if (user.isAnonymous === undefined || user.isAnonymous === null) {
        updates.isAnonymous = true;
        needsUpdate = true;
      }

      // Apply updates if needed
      if (needsUpdate) {
        await ctx.db.patch(user._id, updates);
        fixedCount++;
        console.log(`Fixed user ${user._id}:`, Object.keys(updates));
      }
    }

    const result = {
      fixedCount,
      total,
      message: `Fixed ${fixedCount} out of ${total} users`,
    };

    console.log("Migration complete:", result);
    return result;
  },
});

/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as fixUsers from "../fixUsers.js";
import type * as friends from "../friends.js";
import type * as gameSessions from "../gameSessions.js";
import type * as games from "../games.js";
import type * as guildMessages from "../guildMessages.js";
import type * as guilds from "../guilds.js";
import type * as users from "../users.js";
import type * as utils from "../utils.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  fixUsers: typeof fixUsers;
  friends: typeof friends;
  gameSessions: typeof gameSessions;
  games: typeof games;
  guildMessages: typeof guildMessages;
  guilds: typeof guilds;
  users: typeof users;
  utils: typeof utils;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

/**
 * Clerk Authentication Configuration for Convex
 *
 * This configuration enables Clerk authentication in your Convex backend.
 * Clerk will handle user authentication and provide identity information to Convex.
 */

export default {
  providers: [
    {
      domain: "https://api.clerk.com",
      applicationID: "convex",
    },
  ],
};

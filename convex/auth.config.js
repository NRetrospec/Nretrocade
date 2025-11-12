/**
 * Clerk Authentication Configuration for Convex
 *
 * This configuration enables Clerk authentication in your Convex backend.
 * Clerk will handle user authentication and provide identity information to Convex.
 *
 * To set up:
 * 1. Create a JWT template in Clerk Dashboard named "convex" (exactly)
 * 2. Copy the Issuer URL from the template settings
 * 3. Set CLERK_JWT_ISSUER_DOMAIN in your .env.local file
 */

export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: "convex",
    },
  ],
};

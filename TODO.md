# Remove Authentication from Convex + React App

## Frontend Changes
- [ ] Update package.json: Remove @convex-dev/auth, add react-router-dom
- [ ] Update src/main.tsx: Remove ConvexAuthProvider, add Router
- [ ] Create new LandingPage component with "Enter" button
- [ ] Update src/App.tsx: Remove auth-related imports/components, add routing for / and /main
- [ ] Delete src/SignInForm.tsx and src/SignOutButton.tsx
- [ ] Remove all auth-related logic from components

## Backend Changes
- [ ] Delete convex/auth.ts, convex/auth.config.ts, convex/http.ts, convex/router.ts
- [ ] Update convex/schema.ts: Remove authTables and all user-related tables
- [ ] Update convex/games.ts: Remove auth checks, keep only public functions
- [ ] Delete convex/users.ts, convex/friends.ts, convex/guilds.ts
- [ ] Remove convex2/ directory entirely

## Followup Steps
- [ ] Run npm install after package.json changes
- [ ] Test the app: Landing page should show, "Enter" button navigates to main app
- [ ] Verify no auth errors in console
- [ ] Ensure games can be listed and played without authentication

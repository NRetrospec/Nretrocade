# Clerk Authentication Setup Guide

This guide will help you set up Clerk authentication for NRetrocade.

## Prerequisites

- A Clerk account (sign up at https://clerk.com)
- Node.js and npm installed
- Convex backend deployed

## Step-by-Step Setup

### 1. Create a Clerk Application

1. Go to https://dashboard.clerk.com
2. Click "Add application"
3. Choose a name for your application (e.g., "NRetrocade")
4. Select authentication methods:
   - ✅ Email
   - ✅ Google
   - Add any other providers you want

### 2. Get Your Clerk Keys

1. In the Clerk Dashboard, go to "API Keys"
2. Copy your **Publishable Key** (starts with `pk_test_` or `pk_live_`)
3. Copy your **Secret Key** (starts with `sk_test_` or `sk_live_`)

### 3. Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and add your Clerk keys:
   ```env
   VITE_CONVEX_URL=your_convex_deployment_url
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_actual_key_here
   CLERK_SECRET_KEY=sk_test_your_actual_key_here
   ```

### 4. Configure Clerk Allowed Redirect URLs

1. In the Clerk Dashboard, go to "Paths" or "URLs"
2. Add your development URL: `http://localhost:5173`
3. Add your production URL when deploying

### 5. Deploy Convex Schema

The schema has been updated to support Clerk authentication. Deploy it:

```bash
npx convex dev
```

This will push the updated schema with the new `tokenIdentifier` index.

### 6. Install Dependencies (Already Done)

The required packages are already installed:
- `@clerk/clerk-react` - Clerk React components
- `@clerk/backend` - Clerk backend utilities

### 7. Start the Development Server

```bash
npm run dev
```

This will start both the frontend and Convex backend.

## How It Works

### Authentication Flow

1. **Clerk Sign In**: Users can sign in with:
   - Google OAuth
   - Email + Password
   - Or continue as a guest (anonymous)

2. **User Sync**: When a user signs in with Clerk:
   - The `syncClerkUser` mutation is automatically called
   - User data is created/updated in Convex
   - A unique `tokenIdentifier` is stored for the user

3. **Session Management**:
   - Clerk sessions are automatically synced
   - Users stay logged in across page reloads
   - Sessions work across devices for Clerk users

### Anonymous vs. Authenticated Users

- **Anonymous (Guest) Users**:
  - Data stored in localStorage
  - No sync across devices
  - Can be converted to authenticated users later

- **Clerk Authenticated Users**:
  - Data synced across all devices
  - Persistent authentication
  - Can log back in without "username taken" errors

## Backend Integration

The Convex backend now includes:

- **`convex/auth.config.js`**: Clerk authentication configuration
- **`convex/users.ts`**:
  - `syncClerkUser` mutation for syncing Clerk users
  - `getCurrentUser` query for fetching authenticated user data
- **`convex/schema.ts`**: Updated with `tokenIdentifier` field and index

## Frontend Integration

- **`src/main.tsx`**: Wrapped with `ClerkProvider` and `ConvexProviderWithClerk`
- **`src/contexts/UserContext.tsx`**: Updated to support both Clerk and anonymous users
- **`src/App.tsx`**:
  - Sign In/Sign Up buttons
  - Guest login option
  - UserButton for authenticated users

## Troubleshooting

### "Missing VITE_CLERK_PUBLISHABLE_KEY"

Make sure you've created `.env.local` and added your Clerk keys.

### "CORS errors" or "Redirect errors"

Add your development URL (`http://localhost:5173`) to Clerk's allowed redirect URLs.

### Users not syncing

Check the browser console for errors. Make sure:
1. Convex is running (`npx convex dev`)
2. Schema is deployed
3. Clerk keys are correct

### Schema validation errors

Run the migration to fix old user documents:
```bash
npx convex run fixUsers:fixUsers
```

## Testing

1. **Sign Up with Clerk**: Click "Create Account" and sign up with Google or Email
2. **Sign In**: Log out and sign back in - your data should persist
3. **Guest Mode**: Click "Continue as Guest" to test anonymous authentication
4. **Multi-Device**: Sign in on a different browser/device with the same Clerk account

## Production Deployment

1. Update `.env` or deployment platform with production Clerk keys
2. Add production URLs to Clerk's allowed redirect URLs
3. Deploy Convex: `npx convex deploy`
4. Deploy frontend with your hosting provider

## Support

- Clerk Documentation: https://clerk.com/docs
- Convex Documentation: https://docs.convex.dev
- Clerk + Convex Guide: https://docs.convex.dev/auth/clerk

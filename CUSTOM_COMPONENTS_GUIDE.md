# N Retrospec Custom Components Guide

This guide shows how to use the custom-themed authentication and notification components that replace default Clerk buttons and browser alerts.

## 🎨 Custom Components Overview

All components match the **N Retrospec dark, neon aesthetic** with:
- Gradient backgrounds (cyan → purple → pink)
- Smooth hover effects and animations
- Neon glow effects on hover
- Glassmorphism with backdrop blur
- Shimmer animations

---

## 🔐 Authentication Components

### CustomLoginButton

Themed replacement for Clerk's `<SignInButton>` that opens the Clerk authentication modal.

#### Import
```tsx
import { CustomLoginButton, CustomLoginButtonCompact } from "./components/CustomLoginButton";
```

#### Usage - Full Size Button
```tsx
<CustomLoginButton />

// With custom text
<CustomLoginButton text="Sign In to N Retrospec" />

// With custom styling
<CustomLoginButton className="w-full mt-4" />
```

#### Usage - Compact Button (for navbars)
```tsx
<CustomLoginButtonCompact />
<CustomLoginButtonCompact className="ml-4" />
```

#### Features
- ✅ Opens Clerk modal for authentication
- ✅ Animated background glow effect
- ✅ Icon animation on hover
- ✅ Shimmer effect
- ✅ Neon text drop shadow
- ✅ Fully customizable with className prop

---

### CustomLogoutButton

Themed logout button with optional confirmation dialog.

#### Import
```tsx
import { CustomLogoutButton, CustomLogoutButtonCompact } from "./components/CustomLogoutButton";
```

#### Usage - Full Size Button
```tsx
// For Clerk authenticated users
<CustomLogoutButton />

// Without confirmation
<CustomLogoutButton confirmLogout={false} />

// With custom callback
<CustomLogoutButton
  onLogout={() => {
    console.log("User logged out");
    // Custom logic here
  }}
/>

// Custom text
<CustomLogoutButton text="Sign Out" />
```

#### Usage - Compact Button (for anonymous users)
```tsx
// Anonymous user logout (localStorage only)
<CustomLogoutButtonCompact
  onLogout={logout}
  useClerkSignOut={false}
/>

// Clerk user logout
<CustomLogoutButtonCompact
  onLogout={() => console.log("Logged out")}
  useClerkSignOut={true}
/>
```

#### Features
- ✅ Red/orange gradient (warning color)
- ✅ Optional confirmation dialog
- ✅ Custom callback support
- ✅ Works with both Clerk and anonymous auth
- ✅ Animated icon (slides left on hover)
- ✅ Shimmer effect

---

## 🔔 Toast Notification System

Replaces all primitive `alert()` calls with beautiful, themed toast notifications.

### Import
```tsx
import {
  showSuccess,
  showError,
  showInfo,
  showWarning,
  showLoading,
  showCustom,
  showPromise,
  dismissAll
} from "./utils/notifications";
```

### Usage Examples

#### Success Notification
```tsx
showSuccess("Account created!", "Welcome to N Retrospec");
showSuccess("Guild created!");
```

**Styling**: Cyan → Blue gradient with cyan glow

---

#### Error Notification
```tsx
showError("Login failed", "Username or password incorrect");
showError("Username already taken", "Please choose a different username");
```

**Styling**: Red → Orange gradient with red glow

---

#### Info Notification
```tsx
showInfo("Session expired", "Please log in again");
showInfo("New update available");
```

**Styling**: Dark slate gradient with subtle glow

---

#### Warning Notification
```tsx
showWarning("Username already taken", "Please choose a different username");
showWarning("Low connection quality");
```

**Styling**: Orange → Yellow gradient with amber glow

---

#### Loading Notification
```tsx
const toastId = showLoading("Creating account...");

// Later, dismiss it
toast.dismiss(toastId);
```

**Styling**: Purple gradient with purple glow

---

#### Custom Notification
```tsx
showCustom("Level Up!", {
  icon: "🎮",
  description: "You reached level 10!",
  duration: 3000
});
```

---

#### Promise-based Toast
```tsx
await showPromise(
  loginMutation(),
  {
    loading: "Logging in...",
    success: "Welcome back!",
    error: "Login failed"
  }
);
```

---

## 🎯 Real-World Examples

### Example 1: Login Form with Toast
```tsx
const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    await login(username.trim());
    showSuccess("Logged in successfully!", "Welcome back to N Retrospec");
    setShowLoginModal(false);
  } catch (error: any) {
    showError(error.message || "Failed to login", "Please try again");
  }
};
```

### Example 2: Friend Request with Toast
```tsx
const handleSendRequest = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    await sendRequest({
      requesterId: currentUser._id,
      recipientUsername: friendUsername.trim(),
    });
    showSuccess(
      `Friend request sent to ${friendUsername}`,
      "They'll see your request in their Friends panel"
    );
    setFriendUsername("");
  } catch (err: any) {
    showError(
      err.message || "Failed to send friend request",
      "Make sure the username is correct"
    );
  }
};
```

### Example 3: Guild Creation with Toast
```tsx
const handleCreateGuild = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    await createGuild({
      userId: currentUser._id,
      name: newGuildName,
      description: newGuildDescription || "A new guild!",
      isPrivate: false,
    });
    showSuccess(
      `Guild "${newGuildName}" created!`,
      "You earned 100 XP for creating a guild"
    );
    setShowCreateForm(false);
  } catch (err: any) {
    showError(
      err.message || "Failed to create guild",
      "Make sure the guild name is unique"
    );
  }
};
```

### Example 4: Custom Login Screen
```tsx
<div className="space-y-4">
  {/* Custom themed login button */}
  <CustomLoginButton className="w-full" />

  {/* Custom themed sign up button */}
  <SignUpButton mode="modal">
    <button className="w-full group relative overflow-hidden px-8 py-3 rounded-lg bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 hover:from-purple-500 hover:via-pink-500 hover:to-red-500 text-white font-bold text-sm tracking-wide transition-all duration-300 ease-out transform hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/50 border-2 border-transparent hover:border-purple-400/50">
      <span className="relative z-10 flex items-center justify-center gap-2">
        <span className="drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]">Create Account</span>
      </span>
    </button>
  </SignUpButton>

  {/* Guest login */}
  <button
    onClick={() => setShowAnonymousLogin(true)}
    className="w-full px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded font-bold transition-all"
  >
    Continue as Guest
  </button>
</div>
```

---

## 🎨 Toaster Configuration

The main `<Toaster />` component is configured in `App.tsx`:

```tsx
<Toaster
  position="top-right"
  expand={true}
  richColors
  toastOptions={{
    style: {
      background: "linear-gradient(135deg, #0891b2 0%, #6366f1 100%)",
      border: "2px solid rgba(34, 211, 238, 0.3)",
      color: "white",
      backdropFilter: "blur(12px)",
    },
    className: "nretro-toast",
  }}
/>
```

---

## 🚀 Migration from Browser Alerts

### Before (Primitive)
```tsx
alert("Username already taken");
alert(error.message || "Failed to login");
```

### After (Themed)
```tsx
showError("Username already taken", "Please choose a different username");
showError(error.message || "Failed to login", "Please try again");
```

---

## 🎭 Component Variants

### Login Button Variants
| Component | Size | Use Case |
|-----------|------|----------|
| `CustomLoginButton` | Full | Login screens, modals |
| `CustomLoginButtonCompact` | Small | Navigation bars, headers |

### Logout Button Variants
| Component | Size | Use Case |
|-----------|------|----------|
| `CustomLogoutButton` | Full | Settings pages, profile screens |
| `CustomLogoutButtonCompact` | Small | Navigation bars, dropdowns |

### Toast Notification Types
| Function | Color | Use Case |
|----------|-------|----------|
| `showSuccess` | Cyan/Blue | Successful operations |
| `showError` | Red/Orange | Errors, failures |
| `showInfo` | Gray/Slate | Informational messages |
| `showWarning` | Orange/Yellow | Warnings, cautions |
| `showLoading` | Purple | Loading states |
| `showCustom` | Customizable | Special notifications |

---

## 📝 Best Practices

1. **Always provide descriptions** - Use the optional description parameter for context
   ```tsx
   showError("Login failed", "Check your username and password");
   ```

2. **Use appropriate toast types** - Match the notification type to the message
   ```tsx
   showSuccess("Profile updated");  // ✅ Good
   showError("Profile updated");    // ❌ Wrong type
   ```

3. **Keep messages concise** - Short titles, detailed descriptions
   ```tsx
   showSuccess("Friend added", "You can now chat with them");
   ```

4. **Dismiss loading toasts** - Always dismiss loading notifications
   ```tsx
   const id = showLoading("Processing...");
   await someOperation();
   toast.dismiss(id);
   showSuccess("Done!");
   ```

5. **Use promise toasts for async** - Automatically handles loading/success/error
   ```tsx
   await showPromise(mutation(), {
     loading: "Saving...",
     success: "Saved!",
     error: "Failed to save"
   });
   ```

---

## 🎨 Color Palette Reference

**N Retrospec Theme Colors:**
- Primary: `#22d3ee` (cyan-400)
- Secondary: `#a855f7` (purple-500)
- Accent: `#ec4899` (pink-500)
- Success: `#0891b2` (cyan-600) → `#6366f1` (indigo-500)
- Error: `#dc2626` (red-600) → `#f97316` (orange-500)
- Warning: `#f59e0b` (amber-500) → `#eab308` (yellow-500)
- Info: `#1e293b` (slate-800) → `#334155` (slate-700)

All components use these colors with:
- Gradient backgrounds
- Border glow effects
- Drop shadows with color-matched glow
- Glassmorphism backdrop blur

---

## 🔧 Customization

All components accept `className` prop for additional styling:

```tsx
<CustomLoginButton className="w-full mt-4 mb-2" />
<CustomLogoutButtonCompact className="absolute top-4 right-4" />
```

Toast notifications can be customized:
```tsx
showCustom("Custom message", {
  icon: "🚀",
  duration: 5000
});
```

---

## 📦 File Structure

```
src/
├── components/
│   ├── CustomLoginButton.tsx      # Login button components
│   ├── CustomLogoutButton.tsx     # Logout button components
├── utils/
│   ├── notifications.ts           # Toast notification utilities
└── App.tsx                        # Toaster configuration
```

---

## ✅ Migration Checklist

- [x] Replaced `<SignInButton>` with `<CustomLoginButton>`
- [x] Replaced logout buttons with `<CustomLogoutButton>`
- [x] Replaced all `alert()` calls with toast notifications
- [x] Configured `<Toaster />` with N Retrospec theme
- [x] Updated all error handling to use `showError()`
- [x] Updated all success messages to use `showSuccess()`

---

**All components are now visually cohesive and match the N Retrospec brand aesthetic!** 🎮✨

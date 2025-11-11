# NRetrocade - Complete Implementation Guide

## 🎮 Project Overview

NRetrocade is a full-stack retro gaming platform that allows users to play classic Flash games with social features including friends, guilds, and a comprehensive leveling system.

**Tech Stack:**
- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS
- **Backend:** Convex (Serverless BaaS)
- **Database:** Convex Database (NoSQL)
- **Game Emulation:** Ruffle (Flash Player)
- **Real-time:** Convex Subscriptions

---

## 📋 Features Implemented

### ✅ User System
- Anonymous authentication (no sign-up required)
- User profiles with username, avatar, level, and XP
- Persistent user sessions (localStorage)
- XP and leveling system with exponential curve
- Playtime tracking
- User leaderboard

### ✅ Friends System
- Send/accept/reject friend requests
- View friends list with online/offline status
- Real-time status updates
- Search users by username
- XP bonus for adding friends

### ✅ Guild System
- Create/join/leave guilds
- Guild levels based on total member XP
- Guild chat with real-time messaging
- Member management (owner/admin/member roles)
- Guild leaderboard
- Public/private guild settings

### ✅ Game Session Tracking
- Automatic session start/end
- Real-time playtime tracking
- XP awards (10 XP per minute)
- Completion bonuses (+50 XP)
- Heartbeat system for active sessions
- Play history and statistics

### ✅ Leveling & XP System
- Exponential level curve (harder as you level up)
- XP sources:
  - 10 XP per minute of gameplay
  - 50 XP bonus for completing a game
  - 100 XP for creating a guild
  - 10 XP for adding a friend
- Achievement system with unlock conditions
- Progress tracking with visual progress bars

### ✅ Game Library
- Search games by title
- Filter by category and multiplayer status
- Game metadata (difficulty, tags, play count)
- Ruffle Flash player integration
- Game thumbnails and descriptions

---

## 🗄️ Database Schema

### Users Table
```typescript
{
  _id: Id<"users">
  userId: string              // Unique identifier
  username: string            // Display name
  email?: string              // Optional email
  avatarUrl?: string          // Profile picture URL
  level: number               // Current level
  exp: number                 // Total XP
  totalPlaytime: number       // Minutes played
  lastSeen: number            // Last activity timestamp
  createdAt: number           // Account creation
  guildId?: Id<"guilds">      // Current guild
}
```

### Games Table
```typescript
{
  _id: Id<"games">
  title: string
  swfUrl: string
  thumbnail: string
  description?: string
  tags: string[]
  isMultiplayer: boolean
  category: string
  difficulty: "Easy" | "Medium" | "Hard"
  playCount: number
}
```

### Game Sessions Table
```typescript
{
  _id: Id<"game_sessions">
  userId: Id<"users">
  gameId: Id<"games">
  startTime: number
  endTime?: number
  duration: number            // Minutes
  expAwarded: number
  completed: boolean
}
```

### Friendships Table
```typescript
{
  _id: Id<"friendships">
  requesterId: Id<"users">
  recipientId: Id<"users">
  status: "pending" | "accepted" | "rejected"
  createdAt: number
  acceptedAt?: number
}
```

### Guilds Table
```typescript
{
  _id: Id<"guilds">
  name: string                // Unique
  description: string
  ownerId: Id<"users">
  isPrivate: boolean
  memberCount: number
  totalExp: number            // Sum of member XP
  level: number               // Guild level
  createdAt: number
}
```

### Guild Members Table
```typescript
{
  _id: Id<"guild_members">
  guildId: Id<"guilds">
  userId: Id<"users">
  role: "owner" | "admin" | "member"
  joinedAt: number
}
```

### Guild Messages Table
```typescript
{
  _id: Id<"guild_messages">
  guildId: Id<"guilds">
  userId: Id<"users">
  username: string            // Denormalized
  avatarUrl?: string          // Denormalized
  content: string
  timestamp: number
}
```

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js 18+ installed
- npm or pnpm package manager
- Convex account (free tier available)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Set Up Convex

1. **Create a Convex account** at https://convex.dev
2. **Initialize Convex** in your project:
   ```bash
   npx convex dev
   ```
3. This will:
   - Create a new Convex project
   - Generate `.env.local` with your `VITE_CONVEX_URL`
   - Push the schema to Convex cloud
   - Start the development server

### Step 3: Seed the Database

The app will automatically use the existing `seedGames` mutation from `convex/games.ts`. To manually seed:

```bash
# In Convex dashboard, run:
games.seedGames()
```

### Step 4: Run the Development Server

```bash
npm run dev
```

This starts both:
- Frontend dev server (Vite) on http://localhost:5173
- Convex dev server (auto-syncs backend changes)

### Step 5: Test the Application

1. Navigate to http://localhost:5173
2. Click "Enter" on the landing page
3. Create a username (first-time login)
4. Explore all features!

---

## 🎯 Usage Guide

### User Authentication
- **First Visit:** Enter a username (3-20 alphanumeric characters)
- **Returning:** Automatic login via localStorage
- **Logout:** Click logout button in header

### Playing Games
1. Select a game from the left sidebar
2. Game loads with Ruffle player
3. Session auto-starts, tracking playtime
4. Earn 10 XP per minute
5. Click "Mark Complete" for +50 XP bonus
6. Session ends when you switch games or leave

### Friends System
1. Click "Friends" in bottom navigation
2. Enter a friend's username in the input
3. Click "Add" to send a friend request
4. View pending requests in "Requests" tab
5. Accept or reject requests
6. See friends with online/offline status

### Guild System
1. Click "Guild" in bottom navigation
2. **Create a Guild:**
   - Click "Create New Guild"
   - Enter guild name and description
   - Guild starts at your current level/XP
3. **Join a Guild:**
   - Browse available public guilds
   - Click "Join" on any guild
4. **Guild Chat:**
   - Send messages in real-time
   - See member avatars and timestamps
5. **Leave Guild:**
   - Click "Leave" button
   - If you're the owner, ownership transfers or guild deletes

### Leveling & Achievements
1. Click "Level" in bottom navigation
2. View your current level and XP progress
3. See global leaderboard (top 10)
4. Check achievement progress
5. Achievements unlock automatically

---

## 📊 XP & Leveling Formulas

### Level Calculation
```typescript
// XP required to reach level N from level N-1
expForLevel(N) = N * 100 * 1.5^(N-1)

// Examples:
Level 1 → 2: 150 XP
Level 2 → 3: 300 XP
Level 3 → 4: 675 XP
Level 5 → 6: 2,278 XP
Level 10 → 11: 47,000 XP
```

### XP Sources
| Action | XP Gained |
|--------|-----------|
| Play game (per minute) | 10 XP |
| Complete game | +50 XP |
| Create guild | +100 XP |
| Add friend | +10 XP |

### Guild Level
- Guild level = sum of all member XP
- Uses same formula as user levels
- Updates when members gain XP or join/leave

---

## 🔧 API Reference

### User APIs (`convex/users.ts`)
- `getProfile(userId)` - Get user profile
- `createOrGetProfile(userId?, username)` - Create/login user
- `updateProfile(userId, username?, avatarUrl?)` - Update profile
- `addExp(userId, expAmount)` - Award XP
- `getLeaderboard(limit?)` - Get top users
- `searchUsers(searchTerm)` - Find users by username

### Game Session APIs (`convex/gameSessions.ts`)
- `startSession(userId, gameId)` - Start playing
- `endSession(userId, completed?)` - End session, award XP
- `updateSessionHeartbeat(userId)` - Keep session alive
- `getUserSessions(userId)` - Get play history
- `getUserGameStats(userId)` - Get aggregate stats

### Friends APIs (`convex/friends.ts`)
- `getFriends(userId)` - Get accepted friends
- `getPendingRequests(userId)` - Get incoming requests
- `sendFriendRequest(requesterId, recipientUsername)` - Send request
- `acceptFriendRequest(requestId)` - Accept request
- `rejectFriendRequest(requestId)` - Reject request
- `removeFriend(userId, friendId)` - Unfriend

### Guild APIs (`convex/guilds.ts`)
- `getUserGuild(userId)` - Get user's guild
- `getGuildMembers(guildId)` - Get all members
- `searchGuilds(searchTerm?)` - Find public guilds
- `createGuild(userId, name, description, isPrivate)` - Create guild
- `joinGuild(userId, guildId)` - Join guild
- `leaveGuild(userId)` - Leave guild
- `promoteMember(ownerId, memberId, guildId)` - Promote to admin
- `kickMember(kickerId, memberId, guildId)` - Remove member

### Guild Chat APIs (`convex/guildMessages.ts`)
- `getGuildMessages(guildId, limit?)` - Get chat history
- `sendMessage(guildId, userId, content)` - Send message
- `deleteMessage(messageId, userId)` - Delete message

---

## 🏗️ Project Structure

```
NRetrocade/
├── convex/                      # Backend (Convex)
│   ├── schema.ts               # Database schema
│   ├── users.ts                # User management
│   ├── games.ts                # Game queries (existing)
│   ├── gameSessions.ts         # Session tracking
│   ├── friends.ts              # Friends system
│   ├── guilds.ts               # Guild management
│   ├── guildMessages.ts        # Guild chat
│   ├── utils.ts                # Shared utilities
│   └── _generated/             # Auto-generated types
├── src/
│   ├── components/
│   │   ├── LandingPage.tsx     # Entry page
│   │   ├── NavigationBar.tsx   # Bottom nav
│   │   ├── GameList.tsx        # Game browser
│   │   ├── GamePlayer.tsx      # Ruffle player + session tracking
│   │   ├── FriendsPanel.tsx    # Friends UI
│   │   ├── GuildPanel.tsx      # Guild UI
│   │   ├── LevelPanel.tsx      # XP/Level UI
│   │   └── AdPanel.tsx         # Ad sidebar
│   ├── contexts/
│   │   └── UserContext.tsx     # Global user state
│   ├── App.tsx                 # Main app logic
│   └── main.tsx                # React entry point
├── public/                     # Static assets
├── .env.local                  # Convex URL (auto-generated)
├── package.json                # Dependencies
└── README.md                   # This file
```

---

## 🎨 Component Architecture

### UserContext Provider
- Manages current user state
- Handles anonymous login
- Updates last seen timestamp
- Provides user to all components

### GamePlayer Component
- Loads Ruffle Flash player
- Tracks game sessions
- Awards XP automatically
- Shows real-time playtime
- Handles session cleanup

### Friends/Guild/Level Panels
- Use Convex real-time queries
- Subscribe to data changes
- Update UI automatically
- Handle mutations (create, join, etc.)

---

## 🔐 Security Considerations

### Current Implementation (Demo/MVP)
- Anonymous authentication (no passwords)
- No email verification
- Client-side only validation
- LocalStorage for session persistence

### Production Recommendations
1. **Add Authentication:**
   - Integrate Clerk or Auth0
   - Email/password or social login
   - Server-side session management

2. **Add Authorization:**
   - Verify user permissions in backend
   - Validate all mutations
   - Rate limiting on API calls

3. **Input Validation:**
   - Sanitize all user inputs
   - Validate message content (prevent XSS)
   - Enforce username uniqueness

4. **Data Privacy:**
   - Add user consent flows
   - GDPR compliance
   - Account deletion endpoint

---

## 🐛 Known Issues & Limitations

1. **Flash Games:**
   - Ruffle compatibility varies by game
   - Some games may not work properly
   - Demo SWF URLs may be broken

2. **Real-time Updates:**
   - Online status checks last seen within 5 mins
   - No WebRTC for multiplayer games
   - Chat limited to guild members

3. **Scalability:**
   - LocalStorage limited to single device
   - No server-side session validation
   - Simple search (no full-text indexing)

---

## 🚧 Future Enhancements

### Phase 1: Core Features
- [ ] Direct messaging between friends
- [ ] User profile pages
- [ ] Game ratings and reviews
- [ ] Favorite games list

### Phase 2: Social Features
- [ ] Activity feed (friend plays game)
- [ ] Guild invitations
- [ ] Guild vs Guild competitions
- [ ] Friend referral system

### Phase 3: Gaming Features
- [ ] Game collections/playlists
- [ ] High score tracking per game
- [ ] Multiplayer lobby system
- [ ] Spectator mode

### Phase 4: Polish
- [ ] Mobile responsive design
- [ ] PWA (installable app)
- [ ] Dark/light theme toggle
- [ ] Sound effects and music

---

## 📚 Resources

### Documentation
- [Convex Docs](https://docs.convex.dev)
- [Ruffle Docs](https://ruffle.rs)
- [React Docs](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)

### Community
- [Convex Discord](https://discord.gg/convex)
- [Ruffle Discord](https://discord.gg/ruffle)

---

## 🙏 Acknowledgments

- **Ruffle Team** - Flash emulation
- **Convex** - Serverless backend
- **React Team** - UI framework
- **Tailwind CSS** - Styling system

---

## 📄 License

This project is open source and available for educational purposes.

---

## 👨‍💻 Development

### Running Tests
```bash
npm test
```

### Building for Production
```bash
npm run build
```

### Deploying to Production
```bash
# Deploy Convex backend
npx convex deploy

# Build frontend
npm run build

# Deploy to Vercel/Netlify/etc
# (upload dist/ folder)
```

---

## 💬 Support

For issues, questions, or feature requests:
1. Check the documentation above
2. Review Convex logs in dashboard
3. Check browser console for errors
4. Create an issue in the repository

---

**Happy Gaming! 🎮✨**

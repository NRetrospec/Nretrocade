import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery, useMutation } from "convex/react";
import { useUser as useClerkUser } from "@clerk/clerk-react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface User {
  _id: Id<"users">;
  userId: string;
  username: string;
  email?: string;
  avatarUrl?: string;
  level: number;
  exp: number;
  totalPlaytime: number;
  lastSeen: number;
  createdAt: number;
  guildId?: Id<"guilds">;
  isAnonymous?: boolean;
}

interface UserContextType {
  currentUser: User | null;
  isLoading: boolean;
  isClerkAuthenticated: boolean;
  login: (username: string) => Promise<void>;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [storedUserId, setStoredUserId] = useState<string | null>(null);

  // Clerk authentication
  const { isSignedIn, user: clerkUser, isLoaded } = useClerkUser();

  const createOrGetProfile = useMutation(api.users.createOrGetProfile);
  const syncClerkUser = useMutation(api.users.syncClerkUser);
  const updateLastSeen = useMutation(api.users.updateLastSeen);

  // Get token identifier for Clerk users
  const getTokenIdentifier = () => {
    if (clerkUser) {
      return `${clerkUser.id}|clerk`;
    }
    return null;
  };

  // Get user profile from Convex (for anonymous users)
  const anonymousProfile = useQuery(
    api.users.getProfile,
    !isSignedIn && storedUserId ? { userId: storedUserId } : "skip"
  );

  // Get user profile from Convex (for Clerk users)
  const clerkProfile = useQuery(
    api.users.getCurrentUser,
    isSignedIn && getTokenIdentifier() ? { tokenIdentifier: getTokenIdentifier()! } : "skip"
  );

  // Sync Clerk user with Convex on sign in
  useEffect(() => {
    if (isLoaded && isSignedIn && clerkUser) {
      const tokenIdentifier = getTokenIdentifier();
      if (tokenIdentifier) {
        syncClerkUser({
          clerkUserId: clerkUser.id,
          tokenIdentifier,
          email: clerkUser.primaryEmailAddress?.emailAddress,
          username: clerkUser.username || clerkUser.firstName || undefined,
          avatarUrl: clerkUser.imageUrl,
        }).catch(console.error);
      }
    }
  }, [isLoaded, isSignedIn, clerkUser]);

  // Load anonymous user from localStorage on mount
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      const savedUserId = localStorage.getItem("nretrocade_userId");
      if (savedUserId) {
        setStoredUserId(savedUserId);
      } else {
        setIsLoading(false);
      }
    }
  }, [isLoaded, isSignedIn]);

  // Update current user when Clerk profile loads
  useEffect(() => {
    if (isSignedIn && clerkProfile) {
      setCurrentUser(clerkProfile as User);
      setIsLoading(false);

      // Update last seen periodically (every 2 minutes)
      const interval = setInterval(() => {
        if (clerkProfile.userId) {
          updateLastSeen({ userId: clerkProfile.userId }).catch(console.error);
        }
      }, 2 * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [isSignedIn, clerkProfile]);

  // Update current user when anonymous profile loads
  useEffect(() => {
    if (!isSignedIn && anonymousProfile) {
      setCurrentUser(anonymousProfile as User);
      setIsLoading(false);

      // Update last seen periodically (every 2 minutes)
      const interval = setInterval(() => {
        if (anonymousProfile.userId) {
          updateLastSeen({ userId: anonymousProfile.userId }).catch(console.error);
        }
      }, 2 * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [isSignedIn, anonymousProfile]);

  // Anonymous login function (for backward compatibility)
  const login = async (username: string) => {
    try {
      setIsLoading(true);

      // Try to get existing user or create new one
      const savedUserId = localStorage.getItem("nretrocade_userId");

      const result = await createOrGetProfile({
        userId: savedUserId || undefined,
        username,
      });

      // Save userId to localStorage
      localStorage.setItem("nretrocade_userId", result.userId);
      setStoredUserId(result.userId);

    } catch (error: any) {
      setIsLoading(false);
      throw new Error(error.message || "Failed to login");
    }
  };

  const logout = () => {
    localStorage.removeItem("nretrocade_userId");
    setCurrentUser(null);
    setStoredUserId(null);
  };

  return (
    <UserContext.Provider
      value={{
        currentUser,
        isLoading: !isLoaded || isLoading,
        isClerkAuthenticated: isSignedIn || false,
        login,
        logout
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}

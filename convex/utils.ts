/**
 * Shared utility functions for NRetrocade backend
 */

/**
 * Calculate XP required to reach a specific level
 * Formula: level * 100 * 1.5^(level-1)
 */
export function getExpForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.floor(level * 100 * Math.pow(1.5, level - 1));
}

/**
 * Calculate total XP required from level 1 to target level
 */
export function getTotalExpForLevel(level: number): number {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += getExpForLevel(i + 1);
  }
  return total;
}

/**
 * Calculate level from total XP
 * Returns { level, currentLevelExp, nextLevelExp }
 */
export function calculateLevelFromExp(totalExp: number): {
  level: number;
  currentLevelExp: number;
  nextLevelExp: number;
  progress: number;
} {
  let level = 1;
  let expForCurrentLevel = 0;

  while (expForCurrentLevel <= totalExp) {
    level++;
    const expRequired = getExpForLevel(level);
    if (expForCurrentLevel + expRequired > totalExp) {
      level--;
      break;
    }
    expForCurrentLevel += expRequired;
  }

  const nextLevelExp = getExpForLevel(level + 1);
  const currentLevelExp = totalExp - expForCurrentLevel;
  const progress = nextLevelExp > 0 ? (currentLevelExp / nextLevelExp) * 100 : 0;

  return {
    level,
    currentLevelExp,
    nextLevelExp,
    progress,
  };
}

/**
 * Calculate XP to award based on playtime
 * Base rate: 10 XP per minute
 */
export function calculateExpFromPlaytime(minutes: number): number {
  return Math.floor(minutes * 10);
}

/**
 * Calculate guild level from total XP
 * Uses same formula as user levels
 */
export function calculateGuildLevel(totalExp: number): number {
  return calculateLevelFromExp(totalExp).level;
}

/**
 * Generate a random avatar URL (fallback)
 */
export function generateDefaultAvatar(username: string): string {
  const hash = username
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const avatarNumber = (hash % 10) + 1;
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;
}

/**
 * Validate username (alphanumeric, 3-20 chars)
 */
export function isValidUsername(username: string): boolean {
  return /^[a-zA-Z0-9_]{3,20}$/.test(username);
}

/**
 * Generate unique user ID (for anonymous users)
 */
export function generateUserId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Get user initials from username for avatar fallback
 */
export function getUserInitials(username: string): string {
  return username.substring(0, 2).toUpperCase();
}

/**
 * Format playtime in hours and minutes
 */
export function formatPlaytime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

/**
 * Calculate time ago string (e.g., "2 hours ago")
 */
export function getTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "just now";
}

/**
 * Check if user is online (last seen within 5 minutes)
 */
export function isUserOnline(lastSeen: number): boolean {
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  return lastSeen >= fiveMinutesAgo;
}

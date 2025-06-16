
export interface Meal {
  day: string;
  breakfast: string;
  lunch: string;
  dinner: string;
}

export interface Exercise {
  day: string;
  activity: string;
  duration: string;
}

export interface Mindfulness {
  day: string;
  practice: string;
  duration: string;
}

export interface WellnessPlan {
  meals: Meal[];
  exercise: Exercise[];
  mindfulness: Mindfulness[];
}

export interface OnboardingData {
  goals: string;
  dietPreferences: string;
  budget: string;
}

export interface MoodLog {
  id: string; // For unique key in lists
  date: string; // ISO string for consistency
  mood: string; // e.g., "😊", "🙂"
  notes?: string;
  selfieDataUri?: string; // To store the captured selfie
  aiFeedback?: string; // To store AI's feedback on the mood
  createdAt?: any; // Firestore Timestamp for ordering
}

export interface GroceryItem {
  id: string; // Unique identifier for the item
  name: string;
  category: string; // e.g., "Produce", "Dairy", "Pantry", "Meats"
  quantity?: string; // e.g., "1 lb", "2 cans", "1 gallon"
  notes?: string; // e.g., "ripe", "low-sodium"
}

export interface GroceryList {
  id: string;
  items: GroceryItem[];
  generatedDate: string; // ISO string
}

// For User's public profile aspects like display name
export interface UserProfile {
  displayName: string | null;
  email: string | null;
  avatarUrl?: string;
  // Gamification elements to be expanded
  level?: number;
  xp?: number;
  dailyQuestStreak?: number;
  bestQuestStreak?: number;
  lastQuestCompletionDate?: string; // YYYY-MM-DD
  title?: string; // e.g., "Novice Quester"
}

// For Admin Dashboard
export interface UserListItem {
  id: string; // UID
  email: string | null;
  displayName?: string | null;
  avatarUrl?: string; // Added for admin list page
}

export interface FullUserDetail extends UserListItem { // FullUserDetail now extends UserListItem
  onboardingData: OnboardingData | null;
  wellnessPlan: WellnessPlan | null;
  moodLogs: MoodLog[];
  groceryList: GroceryList | null;
  activeChallengeProgress?: UserActiveChallenge | null;
  // avatarUrl is inherited from UserListItem
  profile?: UserProfile; // Include full profile for admin view
}

// For Mood Chart
export interface ChartMoodLog {
  date: string; // Formatted date string for X-axis label (e.g., "MMM d")
  moodValue: number; // Numerical representation of mood
  moodEmoji: string; // Original mood emoji for tooltip
  fullDate: string; // Full ISO date string for sorting/original reference
}

// For Wellness Challenges
export interface CurrentChallenge {
  id: string;
  title: string;
  description: string;
  durationDays: number;
}

export interface UserActiveChallenge {
  challengeId: string;
  joinedDate: string; // ISO String
  completedDates: string[]; // Array of "YYYY-MM-DD" date strings
  daysCompleted: number;
}

// For Leaderboard display
export interface LeaderboardEntry {
  id: string; // UID
  displayName: string | null;
  daysCompleted: number;
  rank?: number;
  avatarUrl?: string;
  // Could expand to show level or XP for gamified leaderboards
  level?: number;
  xp?: number;
}

// GAMIFICATION TYPES
export type QuestType = 'study' | 'workout' | 'hobby' | 'chore' | 'wellness' | 'creative' | 'social' | 'break' | 'other';

export interface Quest {
  id: string;
  title: string;
  description?: string;
  questType: QuestType;
  xpValue: number;
  isCompleted: boolean;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime?: string; // Optional: HH:MM
  durationMinutes?: number; // Optional
  urgency?: 'low' | 'medium' | 'high' | 'asap'; // Optional
  energyLevel?: 'low' | 'medium' | 'high'; // Optional
  isRecurring?: boolean; // Optional
  relatedHabitId?: string; // Optional
  isTimeLimited?: boolean; // Optional
  deadline?: string; // Optional, ISOString or similar for time-limited quests
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  iconName: string; // e.g., name of a Lucide icon or path to custom SVG
  earnedDate?: string; // ISO string
}

export interface Collectible { // For skins, perks, boosts
  id: string;
  name: string;
  description: string;
  type: 'skin_avatar' | 'skin_profile_border' | 'boost_xp' | 'boost_quest_slot';
  iconName: string;
  duration?: number; // For boosts, in hours or days
  effectValue?: number; // For boosts, e.g., 2 for 2x XP
  isEquipped?: boolean;
}

export interface DailySummary {
  date: string; // YYYY-MM-DD
  questsCompleted: number;
  totalQuests: number;
  xpGained: number;
  badgesEarned: Badge[];
  streakContinued: boolean;
  activityScore?: number; // Optional: some comparative score
}

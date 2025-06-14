
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
  avatarUrl?: string; // Added avatarUrl here for profile context
}

// For Admin Dashboard
export interface UserListItem {
  id: string; // UID
  email: string | null;
  displayName?: string | null;
}

export interface FullUserDetail extends UserListItem {
  onboardingData: OnboardingData | null;
  wellnessPlan: WellnessPlan | null;
  moodLogs: MoodLog[];
  groceryList: GroceryList | null;
  activeChallengeProgress?: UserActiveChallenge | null;
  avatarUrl?: string; // Ensure avatarUrl is part of full detail
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

// For Leaderboard display - Email removed for privacy
export interface LeaderboardEntry {
  id: string; // UID
  displayName: string | null; // Display name is public
  daysCompleted: number;
  rank?: number; // Optional rank, to be assigned client-side
  avatarUrl?: string; // Optional avatar for leaderboard
}


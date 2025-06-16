
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
  id: string; 
  date: string; 
  mood: string; 
  notes?: string;
  selfieDataUri?: string; 
  aiFeedback?: string; 
  createdAt?: any; 
}

export interface GroceryItem {
  id: string; 
  name: string;
  category: string; 
  quantity?: string; 
  notes?: string; 
}

export interface GroceryList {
  id: string;
  items: GroceryItem[];
  generatedDate: string; 
}

export interface UserProfile {
  displayName: string | null;
  email: string | null;
  avatarUrl?: string;
  level?: number;
  xp?: number;
  dailyQuestStreak?: number;
  bestQuestStreak?: number;
  lastQuestCompletionDate?: string; 
  title?: string; 
}

export interface UserListItem {
  id: string; 
  email: string | null;
  displayName?: string | null;
  avatarUrl?: string; 
}

export interface FullUserDetail extends UserListItem { 
  onboardingData: OnboardingData | null;
  wellnessPlan: WellnessPlan | null;
  moodLogs: MoodLog[];
  groceryList: GroceryList | null;
  activeChallengeProgress?: UserActiveChallenge | null;
  profile?: UserProfile; 
}

export interface ChartMoodLog {
  date: string; 
  moodValue: number; 
  moodEmoji: string; 
  fullDate: string; 
}

export interface CurrentChallenge {
  id: string;
  title: string;
  description: string;
  durationDays: number;
}

export interface UserActiveChallenge {
  challengeId: string;
  joinedDate: string; 
  completedDates: string[]; 
  daysCompleted: number;
}

export interface LeaderboardEntry {
  id: string; 
  displayName: string | null;
  daysCompleted: number;
  rank?: number;
  avatarUrl?: string;
  level?: number;
  xp?: number;
}

// GAMIFICATION & AI SCHEDULING TYPES
export type QuestType = 'study' | 'workout' | 'hobby' | 'chore' | 'wellness' | 'creative' | 'social' | 'break' | 'other';

// User's raw input for a task
export interface RawTask {
  id: string; // Client-generated UUID
  description: string;
  durationMinutes?: number;
  priority?: 'high' | 'medium' | 'low';
  questType?: QuestType;
  fixedTime?: string; // e.g., "14:00-15:00" or "10:00 start"
  deadline?: string; // e.g., "today EOD"
  urgency?: string; // User-defined text like "ASAP!"
  requiredEnergyLevel?: string; // User-defined text like "High focus"
}

// AI-Generated Scheduled Quest
export interface ScheduledQuest {
  id: string; // Unique ID for this scheduled slot (can be same as originalTaskId or new)
  originalTaskId: string; // ID of the RawTask it corresponds to
  title: string; // Engaging, quest-like title from AI
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  questType: QuestType;
  xp: number; // XP for completing this quest
  notes?: string; // AI-generated tip or note
  // status will be managed in Firestore via questCompletionStatus in DailyPlan
}

// AI-Generated Break Slot
export interface BreakSlot {
  id: string; // Unique ID for this break slot
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  suggestion?: string; // Fun break activity
  xp?: number; // Small XP for taking the break
}

// Structure for storing daily plans in Firestore
export interface DailyPlan {
  rawTasks: RawTask[];
  userContextForAI: string | null; // User's textual context provided to AI for this day
  generatedQuests: ScheduledQuest[];
  generatedBreaks: BreakSlot[];
  aiDailySummaryMessage: string | null;
  questCompletionStatus: Record<string, 'active' | 'completed' | 'missed'>; // key is ScheduledQuest.id
  lastGeneratedAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}


export interface Badge {
  id: string;
  name: string;
  description: string;
  iconName: string; 
  earnedDate?: string; 
}

export interface Collectible { 
  id: string;
  name: string;
  description: string;
  type: 'skin_avatar' | 'skin_profile_border' | 'boost_xp' | 'boost_quest_slot';
  iconName: string;
  duration?: number; 
  effectValue?: number; 
  isEquipped?: boolean;
}

export interface DailySummary {
  date: string; 
  questsCompleted: number;
  totalQuests: number;
  xpGained: number;
  badgesEarned: Badge[];
  streakContinued: boolean;
  activityScore?: number; 
}

    

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
  dailyPlans?: DailyPlan[]; // Added to hold daily quest plans
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

export type QuestType = 'study' | 'workout' | 'hobby' | 'chore' | 'wellness' | 'creative' | 'social' | 'break' | 'other';

// AI-Generated Scheduled Quest
export interface ScheduledQuest {
  id: string;
  originalTaskId: string;
  title: string;
  startTime: string;
  endTime: string;
  questType: QuestType;
  xp: number;
  notes?: string;
}

// AI-Generated Break Slot
export interface BreakSlot {
  id: string;
  startTime: string;
  endTime: string;
  suggestion?: string;
  xp?: number;
}

// Structure for storing daily plans in Firestore
export interface DailyPlan {
  id?: string; // Document ID, typically the date string YYYY-MM-DD
  naturalLanguageDailyInput: string | null;
  userContextForAI: string | null;
  generatedQuests: ScheduledQuest[];
  generatedBreaks: BreakSlot[];
  aiDailySummaryMessage: string | null;
  questCompletionStatus: Record<string, 'active' | 'completed' | 'missed'>;
  lastGeneratedAt: any;
  updatedAt: any;
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

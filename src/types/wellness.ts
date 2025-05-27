
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



"use client";

import type { WellnessPlan, OnboardingData, MoodLog, GroceryList, Meal } from '@/types/wellness';
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { generateWellnessPlan as aiGenerateWellnessPlan, type GenerateWellnessPlanInput } from '@/ai/flows/generate-wellness-plan';
import { provideMoodFeedback as aiProvideMoodFeedback, type ProvideMoodFeedbackInput } from '@/ai/flows/provide-mood-feedback';
import { generateGroceryList as aiGenerateGroceryList, type GenerateGroceryListInput, type GenerateGroceryListOutput } from '@/ai/flows/generate-grocery-list';
import { useToast } from "@/hooks/use-toast";
import { auth } from '@/lib/firebase';
import { 
  User, 
  onAuthStateChanged, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut 
} from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';

interface PlanContextType {
  currentUser: User | null;
  isLoadingAuth: boolean;
  signupWithEmail: (email: string, pass: string) => Promise<User | null>;
  loginWithEmail: (email: string, pass: string) => Promise<User | null>;
  logoutUser: () => Promise<void>;
  onboardingData: OnboardingData;
  setOnboardingData: React.Dispatch<React.SetStateAction<OnboardingData>>;
  wellnessPlan: WellnessPlan | null;
  isLoadingPlan: boolean;
  errorPlan: string | null;
  generatePlan: (data: OnboardingData) => Promise<void>;
  clearPlanAndData: () => void; // Renamed for clarity
  isPlanAvailable: boolean;
  isOnboardedState: boolean; // Renamed to avoid conflict
  completeOnboarding: (data: OnboardingData) => void;
  moodLogs: MoodLog[];
  addMoodLog: (mood: string, notes?: string, selfieDataUri?: string) => Promise<void>;
  groceryList: GroceryList | null;
  isLoadingGroceryList: boolean;
  errorGroceryList: string | null;
  generateGroceryList: (currentPlan: WellnessPlan) => Promise<void>;
}

const PlanContext = createContext<PlanContextType | undefined>(undefined);

const defaultOnboardingData: OnboardingData = {
  goals: '',
  dietPreferences: '',
  budget: '',
};

export const PlanProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>(defaultOnboardingData);
  const [wellnessPlan, setWellnessPlan] = useState<WellnessPlan | null>(null);
  const [isLoadingPlan, setIsLoadingPlan] = useState(false);
  const [errorPlan, setErrorPlan] = useState<string | null>(null);
  const [isOnboardedState, setIsOnboardedState] = useState(false);
  const [moodLogs, setMoodLogs] = useState<MoodLog[]>([]);
  const [groceryList, setGroceryList] = useState<GroceryList | null>(null);
  const [isLoadingGroceryList, setIsLoadingGroceryList] = useState(false);
  const [errorGroceryList, setErrorGroceryList] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();

  const clearPlanAndData = () => {
    setWellnessPlan(null);
    setOnboardingData(defaultOnboardingData);
    setIsOnboardedState(false);
    setMoodLogs([]);
    setGroceryList(null);
    localStorage.removeItem('grozen_wellnessPlan');
    localStorage.removeItem('grozen_onboardingData');
    localStorage.removeItem('grozen_moodLogs');
    localStorage.removeItem('grozen_groceryList');
    setErrorPlan(null);
    setErrorGroceryList(null);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsLoadingAuth(false);
      clearPlanAndData(); // Clear local data on auth change to prevent data mixing
      // Future: if user logs in, load their data from Firestore.
      // For now, this means they start fresh on login/logout.
    });
    return () => unsubscribe();
  }, []);
  
  useEffect(() => {
    if (!isLoadingAuth && !currentUser) {
      // If not loading auth and no user, load any existing anonymous data
      // This logic might change once Firestore is primary
      const storedOnboardingData = localStorage.getItem('grozen_onboardingData');
      if (storedOnboardingData) {
        try {
          const parsedData = JSON.parse(storedOnboardingData);
          setOnboardingData(parsedData);
          setIsOnboardedState(true);
        } catch (e) { console.error("Error parsing onboarding data from LS", e); localStorage.removeItem('grozen_onboardingData');}
      }
      const storedWellnessPlan = localStorage.getItem('grozen_wellnessPlan');
      if (storedWellnessPlan) {
        try {
          const parsedPlan = JSON.parse(storedWellnessPlan);
          if (parsedPlan && Array.isArray(parsedPlan.meals) && Array.isArray(parsedPlan.exercise) && Array.isArray(parsedPlan.mindfulness)) {
            setWellnessPlan(parsedPlan);
          } else {
            localStorage.removeItem('grozen_wellnessPlan');
          }
        } catch (e) { console.error("Error parsing wellness plan from LS", e); localStorage.removeItem('grozen_wellnessPlan');}
      }
      const storedMoodLogs = localStorage.getItem('grozen_moodLogs');
      if (storedMoodLogs) {
         try { setMoodLogs(JSON.parse(storedMoodLogs)); } catch (e) { console.error("Error parsing mood logs from LS", e); localStorage.removeItem('grozen_moodLogs'); }
      }
      const storedGroceryList = localStorage.getItem('grozen_groceryList');
      if (storedGroceryList) {
        try { setGroceryList(JSON.parse(storedGroceryList)); } catch (e) { console.error("Error parsing grocery list from LS", e); localStorage.removeItem('grozen_groceryList'); }
      }
    }
  }, [currentUser, isLoadingAuth]);


  const signupWithEmail = async (email: string, pass: string): Promise<User | null> => {
    setIsLoadingAuth(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      toast({ title: "Signup Successful", description: "Welcome to GroZen!" });
      return userCredential.user;
    } catch (error: any) {
      console.error("Signup error", error);
      toast({ variant: "destructive", title: "Signup Failed", description: error.message || "Could not create account." });
      setCurrentUser(null); // Ensure user is null on failed signup
      return null;
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const loginWithEmail = async (email: string, pass: string): Promise<User | null> => {
    setIsLoadingAuth(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      toast({ title: "Login Successful", description: "Welcome back!" });
      return userCredential.user;
    } catch (error: any) {
      console.error("Login error", error);
      toast({ variant: "destructive", title: "Login Failed", description: error.message || "Invalid email or password." });
      setCurrentUser(null);
      return null;
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const logoutUser = async () => {
    setIsLoadingAuth(true);
    try {
      await signOut(auth);
      clearPlanAndData(); // Clear local data on logout
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      router.push('/login'); 
    } catch (error: any) {
      console.error("Logout error", error);
      toast({ variant: "destructive", title: "Logout Failed", description: error.message || "Could not log out." });
    } finally {
      setIsLoadingAuth(false);
    }
  };
  
  const completeOnboarding = (data: OnboardingData) => {
    setOnboardingData(data);
    setIsOnboardedState(true);
    // For now, save to LS. Later, this will be Firestore-specific.
    if (currentUser) {
      // TODO: Save to Firestore for currentUser
      console.log("Placeholder: Save onboarding data to Firestore for user", currentUser.uid, data);
      localStorage.setItem('grozen_onboardingData', JSON.stringify(data)); // Temporary
    } else {
      // Should not happen if routes are protected
      localStorage.setItem('grozen_onboardingData', JSON.stringify(data));
    }
  };

  const generatePlan = async (data: OnboardingData) => {
    if (!currentUser && !['/login', '/signup'].includes(pathname)) {
       toast({variant: "destructive", title: "Not Authenticated", description: "Please log in to generate a plan."});
       router.push('/login');
       return;
    }
    setIsLoadingPlan(true);
    setErrorPlan(null);
    try {
      const input: GenerateWellnessPlanInput = {
        goals: data.goals,
        dietPreferences: data.dietPreferences,
        budget: data.budget,
      };
      const result = await aiGenerateWellnessPlan(input);
      
      let parsedPlanCandidate: any;
      try {
        parsedPlanCandidate = JSON.parse(result.plan);
      } catch (parseError) {
        console.error("Failed to parse wellness plan JSON from AI:", parseError, "Raw plan string:", result.plan);
        setErrorPlan("The AI returned an invalid plan format. Please try again.");
        toast({ variant: "destructive", title: "Plan Generation Error", description: "The AI's plan was not in a recognizable format." });
        setIsLoadingPlan(false);
        return;
      }

      if (
        parsedPlanCandidate &&
        typeof parsedPlanCandidate === 'object' &&
        Array.isArray(parsedPlanCandidate.meals) && parsedPlanCandidate.meals.length > 0 &&
        Array.isArray(parsedPlanCandidate.exercise) && 
        Array.isArray(parsedPlanCandidate.mindfulness)
      ) {
        const planToSet = parsedPlanCandidate as WellnessPlan;
        setWellnessPlan(planToSet);
        if (currentUser) {
            // TODO: Save to Firestore
            console.log("Placeholder: Save wellness plan to Firestore for user", currentUser.uid, planToSet);
             localStorage.setItem('grozen_wellnessPlan', JSON.stringify(planToSet)); // Temporary
        } else {
             localStorage.setItem('grozen_wellnessPlan', JSON.stringify(planToSet));
        }
        toast({ title: "Success", description: "Your personalized wellness plan has been generated!" });
      } else {
        console.error("Generated plan is incomplete or malformed. Parsed plan:", parsedPlanCandidate);
        setErrorPlan("The AI generated an incomplete plan (e.g., missing essential meal data). Please check your inputs or try again.");
        toast({ variant: "destructive", title: "Plan Generation Incomplete", description: "The AI's plan was incomplete (e.g., missing meals). Please try again." });
      }
    } catch (err) {
      console.error("Failed to generate plan:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during plan generation.";
      setErrorPlan(errorMessage);
      toast({ variant: "destructive", title: "Error Generating Plan", description: errorMessage });
    } finally {
      setIsLoadingPlan(false);
    }
  };

  const addMoodLog = async (mood: string, notes?: string, selfieDataUri?: string) => {
    if (!currentUser && !['/login', '/signup'].includes(pathname)) {
       toast({variant: "destructive", title: "Not Authenticated", description: "Please log in to add a mood log."});
       router.push('/login');
       return;
    }
    let aiFeedbackText: string | undefined = undefined;
    try {
      const feedbackInput: ProvideMoodFeedbackInput = { mood, notes };
      const feedbackResponse = await aiProvideMoodFeedback(feedbackInput);
      aiFeedbackText = feedbackResponse.feedback;
    } catch (err) {
      console.error("Failed to get AI mood feedback:", err);
      const errorMessage = err instanceof Error ? err.message : "Could not get AI feedback.";
      toast({ variant: "destructive", title: "AI Feedback Error", description: errorMessage });
    }

    const newLog: MoodLog = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      mood,
      notes,
      selfieDataUri,
      aiFeedback: aiFeedbackText,
    };
    const updatedLogs = [newLog, ...moodLogs];
    setMoodLogs(updatedLogs);
     if (currentUser) {
        // TODO: Save to Firestore
        console.log("Placeholder: Save mood logs to Firestore for user", currentUser.uid, updatedLogs);
        localStorage.setItem('grozen_moodLogs', JSON.stringify(updatedLogs)); // Temporary
    } else {
        localStorage.setItem('grozen_moodLogs', JSON.stringify(updatedLogs));
    }
    toast({ 
      title: "Mood Logged", 
      description: `Your mood has been recorded. ${aiFeedbackText ? "Here's a thought: " + aiFeedbackText : ""}` 
    });
  };

  const generateGroceryList = async (currentPlan: WellnessPlan) => {
    if (!currentUser && !['/login', '/signup'].includes(pathname)) {
       toast({variant: "destructive", title: "Not Authenticated", description: "Please log in to generate a grocery list."});
       router.push('/login');
       return;
    }
    if (!currentPlan || !currentPlan.meals || currentPlan.meals.length === 0) {
      toast({ variant: "destructive", title: "Error", description: "Cannot generate grocery list without a meal plan." });
      return;
    }
    setIsLoadingGroceryList(true);
    setErrorGroceryList(null);
    try {
      const input: GenerateGroceryListInput = { 
        meals: currentPlan.meals.map(meal => ({
          day: meal.day,
          breakfast: meal.breakfast,
          lunch: meal.lunch,
          dinner: meal.dinner,
        })) as Meal[]
      };
      const result: GenerateGroceryListOutput = await aiGenerateGroceryList(input);
      
      const newGroceryList: GroceryList = {
        id: crypto.randomUUID(),
        items: result.items,
        generatedDate: new Date().toISOString(),
      };
      setGroceryList(newGroceryList);
      if (currentUser) {
        // TODO: Save to Firestore
        console.log("Placeholder: Save grocery list to Firestore for user", currentUser.uid, newGroceryList);
        localStorage.setItem('grozen_groceryList', JSON.stringify(newGroceryList)); // Temporary
      } else {
        localStorage.setItem('grozen_groceryList', JSON.stringify(newGroceryList));
      }
      toast({ title: "Success", description: "Your grocery list has been generated!" });
    } catch (err) {
      console.error("Failed to generate grocery list:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setErrorGroceryList(errorMessage);
      toast({ variant: "destructive", title: "Error", description: `Failed to generate grocery list: ${errorMessage}` });
    } finally {
      setIsLoadingGroceryList(false);
    }
  };

  const isPlanAvailable = !!wellnessPlan && Array.isArray(wellnessPlan.meals) && wellnessPlan.meals.length > 0;

  return (
    <PlanContext.Provider value={{ 
      currentUser,
      isLoadingAuth,
      signupWithEmail,
      loginWithEmail,
      logoutUser,
      onboardingData, 
      setOnboardingData, 
      wellnessPlan, 
      isLoadingPlan, 
      errorPlan, 
      generatePlan, 
      clearPlanAndData,
      isPlanAvailable,
      isOnboardedState,
      completeOnboarding,
      moodLogs,
      addMoodLog,
      groceryList,
      isLoadingGroceryList,
      errorGroceryList,
      generateGroceryList
    }}>
      {children}
    </PlanContext.Provider>
  );
};

export const usePlan = (): PlanContextType => {
  const context = useContext(PlanContext);
  if (context === undefined) {
    throw new Error('usePlan must be used within a PlanProvider');
  }
  return context;
};

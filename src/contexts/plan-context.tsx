
"use client";

import type { WellnessPlan, OnboardingData, MoodLog, GroceryList, Meal } from '@/types/wellness';
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { generateWellnessPlan as aiGenerateWellnessPlan, type GenerateWellnessPlanInput } from '@/ai/flows/generate-wellness-plan';
import { provideMoodFeedback as aiProvideMoodFeedback, type ProvideMoodFeedbackInput } from '@/ai/flows/provide-mood-feedback';
import { generateGroceryList as aiGenerateGroceryList, type GenerateGroceryListInput, type GenerateGroceryListOutput } from '@/ai/flows/generate-grocery-list';
import { useToast } from "@/hooks/use-toast";
import { auth, db } from '@/lib/firebase'; // Added db
import { 
  User, 
  onAuthStateChanged, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore'; // Added Firestore functions
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
  clearPlanAndData: () => void;
  isPlanAvailable: boolean;
  isOnboardedState: boolean;
  completeOnboarding: (data: OnboardingData) => Promise<void>; // Now async
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

  const clearPlanAndData = (isLogout: boolean = false) => {
    setOnboardingData(defaultOnboardingData);
    setWellnessPlan(null);
    setIsOnboardedState(false);
    setErrorPlan(null);
    
    // Only clear these if it's a full logout, or explicitly requested for local data reset
    // MoodLogs and GroceryList will be handled by Firestore next
    if (isLogout) {
      setMoodLogs([]);
      setGroceryList(null);
      setErrorGroceryList(null);
      localStorage.removeItem('grozen_moodLogs');
      localStorage.removeItem('grozen_groceryList');
    }
    
    // Remove user-specific items from localStorage on logout or when Firestore takes over.
    localStorage.removeItem('grozen_wellnessPlan');
    localStorage.removeItem('grozen_onboardingData');
  };
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      clearPlanAndData(true); // Clear all local data on auth change
      setCurrentUser(user);
      
      if (user) {
        setIsLoadingAuth(true); // Start loading auth/user data
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            if (userData.onboardingData) {
              setOnboardingData(userData.onboardingData);
              setIsOnboardedState(true);
            }
            if (userData.wellnessPlan) {
              setWellnessPlan(userData.wellnessPlan);
            }
            // TODO: Load moodLogs & groceryList from Firestore in future steps
            const storedMoodLogs = localStorage.getItem('grozen_moodLogs');
             if (storedMoodLogs) {
               try { setMoodLogs(JSON.parse(storedMoodLogs)); } catch (e) { console.error("Error parsing mood logs from LS", e); localStorage.removeItem('grozen_moodLogs'); }
            }
            const storedGroceryList = localStorage.getItem('grozen_groceryList');
            if (storedGroceryList) {
              try { setGroceryList(JSON.parse(storedGroceryList)); } catch (e) { console.error("Error parsing grocery list from LS", e); localStorage.removeItem('grozen_groceryList'); }
            }

          } else {
            console.log("No such user document! New user or data not yet saved.");
            // For a new user, onboardingData and wellnessPlan will remain default/null
          }
        } catch (error) {
          console.error("Error fetching user data from Firestore:", error);
          toast({ variant: "destructive", title: "Error Loading Data", description: "Could not load your saved data." });
        } finally {
          setIsLoadingAuth(false);
        }
      } else {
        // No user logged in, load from localStorage for non-authenticated experience
        // MoodLogs and GroceryList might still use LS if no user
        const storedMoodLogs = localStorage.getItem('grozen_moodLogs');
        if (storedMoodLogs) {
           try { setMoodLogs(JSON.parse(storedMoodLogs)); } catch (e) { console.error("Error parsing mood logs from LS", e); localStorage.removeItem('grozen_moodLogs'); }
        }
        const storedGroceryList = localStorage.getItem('grozen_groceryList');
        if (storedGroceryList) {
          try { setGroceryList(JSON.parse(storedGroceryList)); } catch (e) { console.error("Error parsing grocery list from LS", e); localStorage.removeItem('grozen_groceryList'); }
        }
        setIsLoadingAuth(false);
      }
    });
    return () => unsubscribe();
  }, [toast]); // Added toast to dependencies


  const signupWithEmail = async (email: string, pass: string): Promise<User | null> => {
    setIsLoadingAuth(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      // User object will be set by onAuthStateChanged, which also handles data loading
      toast({ title: "Signup Successful", description: "Welcome to GroZen!" });
      return userCredential.user;
    } catch (error: any) {
      console.error("Signup error", error);
      toast({ variant: "destructive", title: "Signup Failed", description: error.message || "Could not create account." });
      return null;
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const loginWithEmail = async (email: string, pass: string): Promise<User | null> => {
    setIsLoadingAuth(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      // User object will be set by onAuthStateChanged, which also handles data loading
      toast({ title: "Login Successful", description: "Welcome back!" });
      return userCredential.user;
    } catch (error: any) {
      console.error("Login error", error);
      toast({ variant: "destructive", title: "Login Failed", description: error.message || "Invalid email or password." });
      return null;
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const logoutUser = async () => {
    setIsLoadingAuth(true); // Technically, onAuthStateChanged will set loading to false after user is null
    try {
      await signOut(auth);
      // clearPlanAndData(true) is called by onAuthStateChanged when user becomes null
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      router.push('/login'); 
    } catch (error: any) {
      console.error("Logout error", error);
      toast({ variant: "destructive", title: "Logout Failed", description: error.message || "Could not log out." });
      setIsLoadingAuth(false); // Ensure loading is false if signOut errors
    }
  };
  
  const completeOnboarding = async (data: OnboardingData) => {
    setOnboardingData(data);
    setIsOnboardedState(true);
    
    if (currentUser) {
      try {
        const userDocRef = doc(db, "users", currentUser.uid);
        await setDoc(userDocRef, { onboardingData: data }, { merge: true });
        toast({ title: "Onboarding Saved", description: "Your preferences have been saved." });
      } catch (error) {
        console.error("Error saving onboarding data to Firestore:", error);
        toast({ variant: "destructive", title: "Save Error", description: "Could not save your onboarding preferences." });
      }
    } else {
      // This case should ideally not be hit if routes are protected
      // For now, if no user, it implies it might be pre-login, but data won't persist to cloud.
      console.warn("Attempted to complete onboarding without a logged-in user. Data not saved to cloud.");
    }
  };

  const generatePlan = async (data: OnboardingData) => {
    if (!currentUser && !['/login', '/signup', '/'].includes(pathname)) { // Adjusted pathname check
       toast({variant: "destructive", title: "Not Authenticated", description: "Please log in to generate a plan."});
       router.push('/login');
       return;
    }
    setIsLoadingPlan(true);
    setErrorPlan(null);
    try {
      // First, ensure onboarding data is processed (and saved to Firestore if user exists)
      await completeOnboarding(data);

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
            try {
              const userDocRef = doc(db, "users", currentUser.uid);
              await setDoc(userDocRef, { wellnessPlan: planToSet }, { merge: true });
              toast({ title: "Plan Generated & Saved", description: "Your personalized wellness plan is ready!" });
            } catch (error) {
                console.error("Error saving wellness plan to Firestore:", error);
                toast({ variant: "destructive", title: "Save Error", description: "Could not save your wellness plan to the cloud, but it's available locally for this session." });
                // Plan is still set locally in state if Firestore save fails
            }
        } else {
            // Should not happen if routes are protected, but as a fallback:
            localStorage.setItem('grozen_wellnessPlan', JSON.stringify(planToSet));
            toast({ title: "Success", description: "Your personalized wellness plan has been generated!" });
        }
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
        // TODO: Save to Firestore in next step
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
        // TODO: Save to Firestore in next step
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
      clearPlanAndData: () => clearPlanAndData(false), // Pass false to not clear mood/grocery on simple plan reset
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

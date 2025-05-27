
"use client";

import type { WellnessPlan, OnboardingData, MoodLog, GroceryList, Meal } from '@/types/wellness';
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { generateWellnessPlan as aiGenerateWellnessPlan, type GenerateWellnessPlanInput } from '@/ai/flows/generate-wellness-plan';
import { provideMoodFeedback as aiProvideMoodFeedback, type ProvideMoodFeedbackInput } from '@/ai/flows/provide-mood-feedback';
import { generateGroceryList as aiGenerateGroceryList, type GenerateGroceryListInput, type GenerateGroceryListOutput } from '@/ai/flows/generate-grocery-list';
import { useToast } from "@/hooks/use-toast";
import { auth, db } from '@/lib/firebase';
import { 
  User, 
  onAuthStateChanged, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut 
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, addDoc, query, getDocs, orderBy, serverTimestamp, FieldValue, deleteDoc } from 'firebase/firestore';
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
  clearPlanAndData: (isFullLogout?: boolean) => void;
  isPlanAvailable: boolean;
  isOnboardedState: boolean;
  completeOnboarding: (data: OnboardingData) => Promise<void>;
  moodLogs: MoodLog[];
  addMoodLog: (mood: string, notes?: string, selfieDataUri?: string) => Promise<void>;
  deleteMoodLog: (logId: string) => Promise<void>;
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

interface MoodLogWithTimestamp extends MoodLog {
  createdAt: FieldValue; // For Firestore server timestamp
}

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

  const clearPlanAndData = (isFullLogout: boolean = false) => {
    setOnboardingData(defaultOnboardingData);
    setWellnessPlan(null);
    setIsOnboardedState(false);
    setErrorPlan(null);
    setMoodLogs([]);
    setGroceryList(null);
    setErrorGroceryList(null);
    
    if (isFullLogout) {
        localStorage.removeItem('grozen_wellnessPlan');
        localStorage.removeItem('grozen_onboardingData');
        localStorage.removeItem('grozen_moodLogs');
        localStorage.removeItem('grozen_groceryList');
    }
  };
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      clearPlanAndData(true); 
      setCurrentUser(user);
      
      if (user) {
        setIsLoadingAuth(true); 
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            if (userData.onboardingData) {
              setOnboardingData(userData.onboardingData);
              setIsOnboardedState(true);
            } else {
              setIsOnboardedState(false); // Ensure reset if no onboarding data
            }
            if (userData.wellnessPlan) {
              setWellnessPlan(userData.wellnessPlan);
            }
            if (userData.currentGroceryList) {
              setGroceryList(userData.currentGroceryList);
            }
          } else {
            setIsOnboardedState(false); 
          }

          const moodLogsColRef = collection(db, "users", user.uid, "moodLogs");
          const moodLogsQuery = query(moodLogsColRef, orderBy("createdAt", "desc"));
          const moodLogsSnap = await getDocs(moodLogsQuery);
          const fetchedMoodLogs = moodLogsSnap.docs.map(docSnap => {
            const data = docSnap.data();
            return { 
              id: docSnap.id, 
              ...data,
              date: data.date || (data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString()) 
            } as MoodLog;
          });
          setMoodLogs(fetchedMoodLogs);

        } catch (error) {
          console.error("Error fetching user data from Firestore:", error);
          toast({ variant: "destructive", title: "Error Loading Data", description: "Could not load your saved data." });
        } finally {
          setIsLoadingAuth(false);
        }
      } else {
        setIsLoadingAuth(false);
      }
    });
    return () => unsubscribe();
  }, [toast]);


  const signupWithEmail = async (email: string, pass: string): Promise<User | null> => {
    setIsLoadingAuth(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      toast({ title: "Signup Successful", description: "Welcome to GroZen!" });
      return userCredential.user;
    } catch (error: any) {
      console.error("Signup error", error);
      toast({ variant: "destructive", title: "Signup Failed", description: error.message || "Could not create account." });
      return null;
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
      return null;
    }
  };

  const logoutUser = async () => {
    setIsLoadingAuth(true); 
    try {
      await signOut(auth);
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      router.push('/login'); 
    } catch (error: any) {
      console.error("Logout error", error);
      toast({ variant: "destructive", title: "Logout Failed", description: error.message || "Could not log out." });
      setIsLoadingAuth(false);
    }
  };
  
  const completeOnboarding = async (data: OnboardingData) => {
    if (!currentUser) {
        toast({variant: "destructive", title: "Not Authenticated", description: "Please log in."});
        router.push('/login');
        return;
    }
    setOnboardingData(data); // Optimistic update for local state
    setIsOnboardedState(true);
    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      await setDoc(userDocRef, { onboardingData: data }, { merge: true });
    } catch (error) {
      console.error("Error saving onboarding data to Firestore:", error);
      toast({ variant: "destructive", title: "Save Error", description: "Could not save your onboarding preferences." });
    }
  };

  const generatePlan = async (data: OnboardingData) => {
    if (!currentUser) {
       toast({variant: "destructive", title: "Not Authenticated", description: "Please log in to generate a plan."});
       router.push('/login');
       return;
    }
    setIsLoadingPlan(true);
    setErrorPlan(null);
    try {
      // completeOnboarding will save the onboarding data to Firestore.
      // We await it here to ensure it completes before we try to generate the plan using this data.
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
        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          await setDoc(userDocRef, { wellnessPlan: planToSet }, { merge: true });
          toast({ title: "Plan Generated & Saved", description: "Your personalized wellness plan is ready!" });
        } catch (error) {
            console.error("Error saving wellness plan to Firestore:", error);
            toast({ variant: "destructive", title: "Save Error", description: "Could not save your wellness plan to the cloud." });
        }
      } else {
        console.error("Generated plan is incomplete or malformed. Parsed plan:", parsedPlanCandidate);
        setErrorPlan("The AI generated an incomplete plan (e.g., missing essential meal data). Please check your inputs or try again.");
        toast({ variant: "destructive", title: "Plan Generation Incomplete", description: "The AI's plan was incomplete (e.g., missing meals). Please try again." });
        setWellnessPlan(null);
      }
    } catch (err) {
      console.error("Failed to generate plan:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during plan generation.";
      setErrorPlan(errorMessage);
      toast({ variant: "destructive", title: "Error Generating Plan", description: errorMessage });
      setWellnessPlan(null);
    } finally {
      setIsLoadingPlan(false);
    }
  };

  const addMoodLog = async (mood: string, notes?: string, selfieDataUri?: string) => {
    if (!currentUser) {
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

    const newLogBase: Omit<MoodLog, 'id'> = {
      date: new Date().toISOString(), 
      mood,
      notes,
      selfieDataUri,
      aiFeedback: aiFeedbackText,
    };
    
    try {
      const moodLogsColRef = collection(db, "users", currentUser.uid, "moodLogs");
      const docRef = await addDoc(moodLogsColRef, {
        ...newLogBase,
        createdAt: serverTimestamp() 
      });
      const newLogForState: MoodLog = { ...newLogBase, id: docRef.id };
      setMoodLogs(prevLogs => [newLogForState, ...prevLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      toast({ 
        title: "Mood Logged", 
        description: `Your mood has been recorded. ${aiFeedbackText ? "Here's a thought: " + aiFeedbackText : ""}` 
      });
    } catch (error) {
      console.error("Error saving mood log to Firestore:", error);
      toast({ variant: "destructive", title: "Save Error", description: "Could not save your mood log." });
    }
  };

  const deleteMoodLog = async (logId: string) => {
    if (!currentUser) {
      toast({variant: "destructive", title: "Not Authenticated", description: "Please log in."});
      router.push('/login');
      return;
    }
    try {
      const logDocRef = doc(db, "users", currentUser.uid, "moodLogs", logId);
      await deleteDoc(logDocRef);
      setMoodLogs(prevLogs => prevLogs.filter(log => log.id !== logId));
      toast({title: "Mood Log Deleted", description: "Your mood entry has been removed."});
    } catch (error) {
      console.error("Error deleting mood log from Firestore:", error);
      toast({ variant: "destructive", title: "Delete Error", description: "Could not delete your mood log." });
    }
  };

  const generateGroceryList = async (currentPlan: WellnessPlan) => {
    if (!currentUser) {
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
        })) as Meal[] // Type assertion to ensure Meal[] is used
      };
      const result: GenerateGroceryListOutput = await aiGenerateGroceryList(input);
      
      const newGroceryList: GroceryList = {
        id: crypto.randomUUID(), 
        items: result.items,
        generatedDate: new Date().toISOString(),
      };
      
      const userDocRef = doc(db, "users", currentUser.uid);
      await setDoc(userDocRef, { currentGroceryList: newGroceryList }, { merge: true });
      setGroceryList(newGroceryList); 

      toast({ title: "Success", description: "Your grocery list has been generated and saved!" });
    } catch (err) {
      console.error("Failed to generate or save grocery list:", err);
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
      deleteMoodLog,
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

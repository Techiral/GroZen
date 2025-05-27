
"use client";

import type { WellnessPlan, OnboardingData, MoodLog, GroceryList, Meal, GroceryItem, UserListItem, FullUserDetail } from '@/types/wellness';
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { generateWellnessPlan as aiGenerateWellnessPlan, type GenerateWellnessPlanInput } from '@/ai/flows/generate-wellness-plan';
import { provideMoodFeedback as aiProvideMoodFeedback, type ProvideMoodFeedbackInput } from '@/ai/flows/provide-mood-feedback';
import { generateGroceryList as aiGenerateGroceryList, type GenerateGroceryListInput, type GenerateGroceryListOutput } from '@/ai/flows/generate-grocery-list';
import { useToast } from "@/hooks/use-toast";
import { auth, db } from '@/lib/firebase';
import {
  User, // Added import
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, addDoc, query, getDocs, orderBy, serverTimestamp, FieldValue, deleteDoc, Timestamp, collectionGroup, where } from 'firebase/firestore'; // Added FieldValue, Timestamp
import { useRouter } from 'next/navigation';

interface PlanContextType {
  currentUser: User | null;
  isAdminUser: boolean;
  isLoadingAuth: boolean;
  signupWithEmail: (email: string, pass: string) => Promise<User | null>;
  loginWithEmail: (email: string, pass: string) => Promise<User | null>;
  logoutUser: () => Promise<void>;
  onboardingData: OnboardingData;
  // setOnboardingData: React.Dispatch<React.SetStateAction<OnboardingData>>; // Not typically exposed directly
  wellnessPlan: WellnessPlan | null;
  isLoadingPlan: boolean;
  errorPlan: string | null;
  generatePlan: (data: OnboardingData) => Promise<void>;
  clearPlanAndData: (isFullLogout?: boolean, clearOnlyPlanRelatedState?: boolean) => void;
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
  deleteGroceryItem: (itemId: string) => Promise<void>;
  // Admin functions
  fetchAllUsers: () => Promise<UserListItem[]>;
  fetchFullUserDetailsForAdmin: (targetUserId: string) => Promise<FullUserDetail | null>;
}

const defaultOnboardingData: OnboardingData = {
  goals: '',
  dietPreferences: '',
  budget: '',
};

// Define the context
const PlanContext = createContext<PlanContextType | undefined>(undefined);

export const PlanProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [_onboardingData, _setOnboardingData] = useState<OnboardingData>(defaultOnboardingData);
  const [_wellnessPlan, _setWellnessPlan] = useState<WellnessPlan | null>(null);
  const [_isLoadingPlan, _setIsLoadingPlan] = useState(false);
  const [_errorPlan, _setErrorPlan] = useState<string | null>(null);
  const [_isOnboardedState, _setIsOnboardedState] = useState(false);
  const [_moodLogs, _setMoodLogs] = useState<MoodLog[]>([]);
  const [_groceryList, _setGroceryList] = useState<GroceryList | null>(null);
  const [_isLoadingGroceryList, _setIsLoadingGroceryList] = useState(false);
  const [_errorGroceryList, _setErrorGroceryList] = useState<string | null>(null);

  const { toast } = useToast();
  const router = useRouter();

  const clearPlanAndData = (
    isFullLogout: boolean = false,
    clearOnlyPlanRelatedState: boolean = false
  ) => {
    if (clearOnlyPlanRelatedState) {
      _setWellnessPlan(null);
      _setGroceryList(null);
      _setErrorPlan(null);
      _setErrorGroceryList(null);
      _setIsLoadingPlan(false);
      _setIsLoadingGroceryList(false);
      // DO NOT clear _onboardingData, _isOnboardedState, or _moodLogs from React state here
      if (isFullLogout) { 
        // Only clear these specific items from LS if it's related to a plan reset, not full data wipe for logout
        localStorage.removeItem('grozen_wellnessPlan');
        localStorage.removeItem('grozen_groceryList');
      }
      return;
    }

    // Full reset of React state (except auth related which is handled by onAuthStateChanged)
    _setOnboardingData(defaultOnboardingData);
    _setWellnessPlan(null);
    _setIsOnboardedState(false);
    _setErrorPlan(null);
    _setMoodLogs([]);
    _setGroceryList(null);
    _setErrorGroceryList(null);
    _setIsLoadingPlan(false);
    _setIsLoadingGroceryList(false);

    if (isFullLogout) { // Typically called on logout or initial auth load if no user
      localStorage.removeItem('grozen_wellnessPlan');
      localStorage.removeItem('grozen_onboardingData');
      localStorage.removeItem('grozen_moodLogs');
      localStorage.removeItem('grozen_groceryList');
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      clearPlanAndData(true); // Clear all local storage and React state on auth change.
      setCurrentUser(user);
      setIsAdminUser(false); 

      if (user) {
        if (process.env.NEXT_PUBLIC_ADMIN_UID && user.uid === process.env.NEXT_PUBLIC_ADMIN_UID) {
          setIsAdminUser(true);
          // toast({ title: "Admin Access", description: "Admin user logged in." }); // Might be too noisy on every load
        }
        setIsLoadingAuth(true); // Set loading while fetching Firestore data
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            if (userData.onboardingData) {
              _setOnboardingData(userData.onboardingData);
              _setIsOnboardedState(true);
            } else {
              _setOnboardingData(defaultOnboardingData); // Reset to default if not in DB
              _setIsOnboardedState(false);
            }

            if (userData.wellnessPlan) {
               try {
                  const plan = userData.wellnessPlan as WellnessPlan;
                   if(plan.meals && plan.exercise && plan.mindfulness) { // Basic validation
                    _setWellnessPlan(plan);
                  } else {
                    console.warn("Wellness plan from DB is malformed for user:", user.uid);
                    _setWellnessPlan(null); // Clear if malformed
                  }
              } catch (e) {
                  console.error("Error parsing wellness plan from DB for user:", user.uid, e);
                  _setWellnessPlan(null);
              }
            } else {
               _setWellnessPlan(null);
            }
            
            if (userData.currentGroceryList) {
              const loadedGroceryList = userData.currentGroceryList as GroceryList;
              // Ensure items always have IDs when loading from Firestore
              if (loadedGroceryList.items && Array.isArray(loadedGroceryList.items)) {
                loadedGroceryList.items = loadedGroceryList.items.map(item => ({
                  ...item,
                  id: item.id || crypto.randomUUID(), 
                }));
              } else {
                loadedGroceryList.items = []; // Ensure items array exists
              }
              _setGroceryList(loadedGroceryList);
            } else {
               _setGroceryList(null);
            }
          } else {
            // User document doesn't exist in Firestore yet (e.g. very new signup, before initial data save)
            _setOnboardingData(defaultOnboardingData);
            _setWellnessPlan(null);
            _setIsOnboardedState(false);
            _setGroceryList(null);
          }

          // Fetch mood logs
          const moodLogsColRef = collection(db, "users", user.uid, "moodLogs");
          const moodLogsQuery = query(moodLogsColRef, orderBy("createdAt", "desc"));
          const moodLogsSnap = await getDocs(moodLogsQuery);
          const fetchedMoodLogs = moodLogsSnap.docs.map(docSnap => {
            const data = docSnap.data();
            let dateStr = new Date().toISOString(); // Default to now if something is wrong
            if (data.createdAt && data.createdAt instanceof Timestamp) {
                dateStr = data.createdAt.toDate().toISOString();
            } else if (data.date && typeof data.date === 'string') { // Fallback for older data possibly from LS
                dateStr = data.date;
            }
            return {
              id: docSnap.id,
              ...data,
              date: dateStr, // Ensure date is a string
              selfieDataUri: data.selfieDataUri || undefined, // Ensure these exist or are undefined
              aiFeedback: data.aiFeedback || undefined,
              notes: data.notes || undefined,
            } as MoodLog;
          });
          _setMoodLogs(fetchedMoodLogs);

        } catch (error) {
          console.error("Error fetching user data from Firestore:", error);
          toast({ variant: "destructive", title: "Error Loading Data", description: "Could not load your saved data." });
          // Reset to a clean state if cloud fetch fails
          _setOnboardingData(defaultOnboardingData);
          _setWellnessPlan(null);
          _setIsOnboardedState(false);
          _setMoodLogs([]);
          _setGroceryList(null);
        } finally {
          setIsLoadingAuth(false);
        }
      } else { // No user logged in
        setIsLoadingAuth(false);
        // clearPlanAndData(true) was already called at the start of onAuthStateChanged
      }
    });
    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]); // router removed as it's not directly used in this useEffect


  const signupWithEmail = async (email: string, pass: string): Promise<User | null> => {
    setIsLoadingAuth(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      const userDocRef = doc(db, "users", userCredential.user.uid);
      await setDoc(userDocRef, { 
        email: userCredential.user.email, 
        createdAt: serverTimestamp(),
        onboardingData: defaultOnboardingData, // Initialize with default
        wellnessPlan: null,
        currentGroceryList: null,
      });
      toast({ title: "Signup Successful", description: "Welcome to GroZen! Please complete your onboarding." });
      // setCurrentUser(userCredential.user) will be handled by onAuthStateChanged
      return userCredential.user;
    } catch (error: any) {
      console.error("Signup error", error);
      toast({ variant: "destructive", title: "Signup Failed", description: error.message || "Could not create account." });
      setIsLoadingAuth(false); // Ensure loading state is reset on error
      return null;
    }
  };

  const loginWithEmail = async (email: string, pass: string): Promise<User | null> => {
    setIsLoadingAuth(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      // Data loading is handled by onAuthStateChanged
      toast({ title: "Login Successful", description: "Welcome back!" });
      // setCurrentUser(userCredential.user) will be handled by onAuthStateChanged
      return userCredential.user;
    } catch (error: any) {
      console.error("Login error", error);
      toast({ variant: "destructive", title: "Login Failed", description: error.message || "Invalid email or password." });
      setIsLoadingAuth(false); // Ensure loading state is reset on error
      return null;
    }
  };

  const logoutUser = async () => {
    setIsLoadingAuth(true); // To show loader during logout process
    try {
      await signOut(auth);
      // clearPlanAndData(true) and setCurrentUser(null) are handled by onAuthStateChanged
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      router.push('/login'); // Explicit redirect after sign out is complete
    } catch (error: any) {
      console.error("Logout error", error);
      toast({ variant: "destructive", title: "Logout Failed", description: error.message || "Could not log out." });
      setIsLoadingAuth(false); // Reset loading state if logout fails
    }
  };

  const completeOnboarding = async (data: OnboardingData) => {
    if (!currentUser) {
      toast({ variant: "destructive", title: "Not Authenticated", description: "Please log in." });
      router.push('/login');
      return;
    }
    _setOnboardingData(data); // Optimistic update of local state
    _setIsOnboardedState(true);
    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      await setDoc(userDocRef, { onboardingData: data, updatedAt: serverTimestamp() }, { merge: true });
      toast({ title: "Preferences Saved", description: "Your onboarding preferences have been updated." });
    } catch (error) {
      console.error("Error saving onboarding data to Firestore:", error);
      toast({ variant: "destructive", title: "Save Error", description: "Could not save preferences." });
      // Potentially roll back optimistic update or re-fetch if critical
    }
  };

  const generatePlan = async (data: OnboardingData) => {
    if (!currentUser) {
      toast({ variant: "destructive", title: "Not Authenticated", description: "Please log in." });
      router.push('/login');
      return;
    }
    _setIsLoadingPlan(true);
    _setErrorPlan(null);
    
    try {
      // Save onboarding data first (idempotent, merges)
      const userDocRef = doc(db, "users", currentUser.uid);
      await setDoc(userDocRef, { onboardingData: data, updatedAt: serverTimestamp() }, { merge: true });
      _setOnboardingData(data); // Ensure local state for onboarding is also up-to-date
      _setIsOnboardedState(true);

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
        _setErrorPlan("The AI returned an invalid plan format. Please try again.");
        toast({ variant: "destructive", title: "Plan Generation Error", description: "Received an invalid plan format from AI." });
         _setWellnessPlan(null); // Clear any potentially bad local state
        return;
      }
      
      // More robust validation of the plan structure
      if (
        parsedPlanCandidate &&
        typeof parsedPlanCandidate === 'object' &&
        Array.isArray(parsedPlanCandidate.meals) && parsedPlanCandidate.meals.length > 0 &&
        parsedPlanCandidate.meals.every((m: any) => typeof m.day === 'string' && typeof m.breakfast === 'string' && typeof m.lunch === 'string' && typeof m.dinner === 'string') &&
        Array.isArray(parsedPlanCandidate.exercise) && parsedPlanCandidate.exercise.every((e: any) => typeof e.day === 'string' && typeof e.activity === 'string' && typeof e.duration === 'string') &&
        Array.isArray(parsedPlanCandidate.mindfulness) && parsedPlanCandidate.mindfulness.every((m: any) => typeof m.day === 'string' && typeof m.practice === 'string' && typeof m.duration === 'string')
      ) {
        const planToSet = parsedPlanCandidate as WellnessPlan;
        _setWellnessPlan(planToSet);
        try {
          // const userDocRef = doc(db, "users", currentUser.uid); // Already defined above
          await setDoc(userDocRef, { wellnessPlan: planToSet, updatedAt: serverTimestamp() }, { merge: true });
          toast({ title: "Plan Generated & Saved", description: "Your personalized wellness plan is ready!" });
        } catch (dbError) {
          console.error("Error saving wellness plan to Firestore:", dbError);
          toast({ variant: "destructive", title: "Save Error", description: "Plan generated, but failed to save to cloud." });
        }
      } else {
        console.error("Generated plan from AI is incomplete or malformed. Parsed plan:", parsedPlanCandidate);
        _setErrorPlan("The AI generated an incomplete or malformed plan. Please check your inputs or try again.");
        toast({ variant: "destructive", title: "Plan Generation Incomplete", description: "The AI's plan was incomplete or malformed." });
        _setWellnessPlan(null); // Clear potentially bad local state
      }
    } catch (err) {
      console.error("Failed to generate plan:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      _setErrorPlan(errorMessage);
      toast({ variant: "destructive", title: "Error Generating Plan", description: errorMessage });
       _setWellnessPlan(null); // Clear potentially bad local state
    } finally {
      _setIsLoadingPlan(false);
    }
  };

  const addMoodLog = async (mood: string, notes?: string, selfieDataUri?: string) => {
    if (!currentUser) {
      toast({ variant: "destructive", title: "Not Authenticated", description: "Please log in." });
      router.push('/login');
      return;
    }
    let aiFeedbackText: string | undefined = undefined;
    try {
      const feedbackInput: ProvideMoodFeedbackInput = { mood, notes };
      const feedbackResponse = await aiProvideMoodFeedback(feedbackInput);
      aiFeedbackText = feedbackResponse.feedback;
    } catch (err) {
      console.warn("Failed to get AI mood feedback:", err);
      // Continue without AI feedback if it fails
    }

    const newLogData = {
      mood,
      notes: notes || null, // Ensure null if empty string for Firestore
      selfieDataUri: selfieDataUri || null, // Ensure null if undefined
      aiFeedback: aiFeedbackText || null, // Ensure null if undefined
      createdAt: serverTimestamp() as FieldValue, // Use server timestamp
      userId: currentUser.uid, // Optional: for potential cross-user queries if rules allowed
    };

    try {
      const moodLogsColRef = collection(db, "users", currentUser.uid, "moodLogs");
      const docRef = await addDoc(moodLogsColRef, newLogData);
      
      // For immediate UI update, create a client-side version.
      // Firestore `serverTimestamp` won't be resolved yet, so use client date for optimistic update.
      const newLogForState: MoodLog = {
        id: docRef.id,
        mood: newLogData.mood,
        notes: newLogData.notes || undefined, // Match type for MoodLog
        selfieDataUri: newLogData.selfieDataUri || undefined,
        aiFeedback: newLogData.aiFeedback || undefined,
        date: new Date().toISOString(), // Client date for immediate display
        createdAt: new Date() // For sorting client-side before Firestore confirms
      };
      _setMoodLogs(prevLogs => [newLogForState, ...prevLogs].sort((a, b) => 
         new Date(b.createdAt instanceof Date ? b.createdAt.toISOString() : b.date).getTime() - 
         new Date(a.createdAt instanceof Date ? a.createdAt.toISOString() : a.date).getTime()
      )); // Sort by createdAt or date
      toast({
        title: "Mood Logged",
        description: `${aiFeedbackText ? "GroZen Insight: " + aiFeedbackText : "Your mood has been recorded."}`
      });
    } catch (error) {
      console.error("Error saving mood log to Firestore:", error);
      toast({ variant: "destructive", title: "Save Error", description: "Could not save mood log." });
    }
  };

  const deleteMoodLog = async (logId: string) => {
    if (!currentUser) {
      toast({ variant: "destructive", title: "Not Authenticated", description: "Please log in." });
      return;
    }
    try {
      const logDocRef = doc(db, "users", currentUser.uid, "moodLogs", logId);
      await deleteDoc(logDocRef);
      _setMoodLogs(prevLogs => prevLogs.filter(log => log.id !== logId)); 
      toast({ title: "Mood Log Deleted", description: "Your mood entry has been removed." });
    } catch (error) {
      console.error("Error deleting mood log from Firestore:", error);
      toast({ variant: "destructive", title: "Delete Error", description: "Could not delete mood log." });
    }
  };

  const generateGroceryList = async (currentPlan: WellnessPlan) => {
    if (!currentUser) {
      toast({ variant: "destructive", title: "Not Authenticated", description: "Please log in." });
      return;
    }
    if (!currentPlan || !currentPlan.meals || currentPlan.meals.length === 0) {
      toast({ variant: "destructive", title: "Error", description: "Cannot generate grocery list without a meal plan." });
      return;
    }
    _setIsLoadingGroceryList(true);
    _setErrorGroceryList(null);
    try {
      const input: GenerateGroceryListInput = {
        meals: currentPlan.meals.map(meal => ({ // Ensure type casting if Meal type in context differs
          day: meal.day,
          breakfast: meal.breakfast,
          lunch: meal.lunch,
          dinner: meal.dinner,
        })) as Meal[] 
      };
      const result: GenerateGroceryListOutput = await aiGenerateGroceryList(input);

      const itemsWithIds: GroceryItem[] = result.items.map(item => ({
        ...item,
        id: crypto.randomUUID(), // Always generate a client-side UUID for items
      }));

      const newGroceryList: GroceryList = {
        id: _groceryList?.id || crypto.randomUUID(), // Reuse existing list ID or generate new
        items: itemsWithIds,
        generatedDate: new Date().toISOString(),
      };

      const userDocRef = doc(db, "users", currentUser.uid);
      await setDoc(userDocRef, { currentGroceryList: newGroceryList, updatedAt: serverTimestamp() }, { merge: true });
      _setGroceryList(newGroceryList);

      toast({ title: "Success", description: "Your grocery list has been generated and saved!" });
    } catch (err) {
      console.error("Failed to generate or save grocery list:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      _setErrorGroceryList(errorMessage);
      toast({ variant: "destructive", title: "Error", description: `Failed to generate grocery list: ${errorMessage}` });
    } finally {
      _setIsLoadingGroceryList(false);
    }
  };

  const deleteGroceryItem = async (itemIdToDelete: string) => {
    if (!currentUser || !_groceryList) {
      toast({ variant: "destructive", title: "Error", description: "User not logged in or no grocery list." });
      return;
    }

    const updatedItems = _groceryList.items.filter(item => item.id !== itemIdToDelete);
    const updatedGroceryList: GroceryList = {
      ..._groceryList, // Spread to keep other properties like id and generatedDate
      items: updatedItems,
    };

    _setGroceryList(updatedGroceryList); // Optimistic update

    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      await setDoc(userDocRef, { currentGroceryList: updatedGroceryList, updatedAt: serverTimestamp() }, { merge: true });
      toast({ title: "Item Deleted", description: "Grocery item removed." });
    } catch (error) {
      console.error("Error deleting grocery item from Firestore:", error);
      toast({ variant: "destructive", title: "Save Error", description: "Could not update grocery list in cloud." });
      // Potentially revert optimistic update by re-fetching or restoring previous state
    }
  };

  // Admin functions
  const fetchAllUsers = async (): Promise<UserListItem[]> => {
    if (!currentUser || !isAdminUser) {
        toast({ variant: "destructive", title: "Unauthorized", description: "Admin access required." });
        return [];
    }
    try {
        const usersCollectionRef = collection(db, "users");
        const usersSnapshot = await getDocs(usersCollectionRef);
        const usersList = usersSnapshot.docs.map(docSnap => ({
            id: docSnap.id,
            email: docSnap.data().email || 'N/A',
        }));
        return usersList;
    } catch (error) {
        console.error("Error fetching all users:", error);
        toast({ variant: "destructive", title: "Fetch Error", description: "Could not fetch user list." });
        return [];
    }
  };

  const fetchFullUserDetailsForAdmin = async (targetUserId: string): Promise<FullUserDetail | null> => {
    if (!currentUser || !isAdminUser) {
        toast({ variant: "destructive", title: "Unauthorized", description: "Admin access required." });
        return null;
    }
    try {
        const userDocRef = doc(db, "users", targetUserId);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
            toast({ variant: "destructive", title: "Not Found", description: "User data not found." });
            return null;
        }
        const userData = userDocSnap.data();

        const moodLogsColRef = collection(db, "users", targetUserId, "moodLogs");
        const moodLogsQuery = query(moodLogsColRef, orderBy("createdAt", "desc"));
        const moodLogsSnap = await getDocs(moodLogsQuery);
        const fetchedMoodLogs = moodLogsSnap.docs.map(docSnap => {
            const data = docSnap.data();
            let dateStr = new Date().toISOString();
            if (data.createdAt && data.createdAt instanceof Timestamp) {
                dateStr = data.createdAt.toDate().toISOString();
            } else if (data.date && typeof data.date === 'string') {
                dateStr = data.date;
            }
            return {
              id: docSnap.id,
              ...data,
              date: dateStr,
              selfieDataUri: data.selfieDataUri || undefined,
              aiFeedback: data.aiFeedback || undefined,
              notes: data.notes || undefined,
            } as MoodLog;
        });
        
        return {
            id: targetUserId,
            email: userData.email || null,
            onboardingData: userData.onboardingData || null,
            wellnessPlan: userData.wellnessPlan || null,
            moodLogs: fetchedMoodLogs,
            groceryList: userData.currentGroceryList || null,
        };

    } catch (error) {
        console.error(`Error fetching details for user ${targetUserId}:`, error);
        toast({ variant: "destructive", title: "Fetch Error", description: `Could not fetch details for user ${targetUserId}.` });
        return null;
    }
  };


  const isPlanAvailable = !!_wellnessPlan && Array.isArray(_wellnessPlan.meals) && _wellnessPlan.meals.length > 0;
  const providerValue = {
      currentUser,
      isAdminUser,
      isLoadingAuth,
      signupWithEmail,
      loginWithEmail,
      logoutUser,
      onboardingData: _onboardingData,
      // setOnboardingData: _setOnboardingData, // Expose setter if direct manipulation from outside is needed. For now, completeOnboarding handles it.
      wellnessPlan: _wellnessPlan,
      isLoadingPlan: _isLoadingPlan,
      errorPlan: _errorPlan,
      generatePlan,
      clearPlanAndData,
      isPlanAvailable,
      isOnboardedState: _isOnboardedState,
      completeOnboarding,
      moodLogs: _moodLogs,
      addMoodLog,
      deleteMoodLog,
      groceryList: _groceryList,
      isLoadingGroceryList: _isLoadingGroceryList,
      errorGroceryList: _errorGroceryList,
      generateGroceryList,
      deleteGroceryItem,
      fetchAllUsers,
      fetchFullUserDetailsForAdmin,
  };

  return (
    <PlanContext.Provider value={providerValue}>
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

    
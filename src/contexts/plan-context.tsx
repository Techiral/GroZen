
"use client";

import type { WellnessPlan, OnboardingData, MoodLog, GroceryList, Meal, GroceryItem, UserListItem, FullUserDetail } from '@/types/wellness';
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
import { doc, getDoc, setDoc, collection, addDoc, query, getDocs, orderBy, serverTimestamp, FieldValue, deleteDoc, Timestamp, collectionGroup, where } from 'firebase/firestore'; 
import { useRouter } from 'next/navigation';

interface PlanContextType {
  currentUser: User | null;
  isAdminUser: boolean;
  isLoadingAuth: boolean;
  signupWithEmail: (email: string, pass: string) => Promise<User | null>;
  loginWithEmail: (email: string, pass: string) => Promise<User | null>;
  logoutUser: () => Promise<void>;
  onboardingData: OnboardingData;
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
  fetchAllUsers: () => Promise<UserListItem[]>;
  fetchFullUserDetailsForAdmin: (targetUserId: string) => Promise<FullUserDetail | null>;
}

const defaultOnboardingData: OnboardingData = {
  goals: '',
  dietPreferences: '',
  budget: '',
};

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
      if (isFullLogout) { 
        localStorage.removeItem('grozen_wellnessPlan');
        localStorage.removeItem('grozen_groceryList');
      }
      return;
    }

    _setOnboardingData(defaultOnboardingData);
    _setWellnessPlan(null);
    _setIsOnboardedState(false);
    _setErrorPlan(null);
    _setMoodLogs([]);
    _setGroceryList(null);
    _setErrorGroceryList(null);
    _setIsLoadingPlan(false);
    _setIsLoadingGroceryList(false);

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
      setIsAdminUser(false); 

      if (user) {
        if (process.env.NEXT_PUBLIC_ADMIN_UID && user.uid === process.env.NEXT_PUBLIC_ADMIN_UID) {
          setIsAdminUser(true);
        }
        setIsLoadingAuth(true);
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            if (userData.onboardingData) {
              _setOnboardingData(userData.onboardingData);
              _setIsOnboardedState(true);
            } else {
              _setOnboardingData(defaultOnboardingData);
              _setIsOnboardedState(false);
            }

            if (userData.wellnessPlan) {
               try {
                  const plan = userData.wellnessPlan as WellnessPlan;
                   if(plan.meals && plan.exercise && plan.mindfulness) {
                    _setWellnessPlan(plan);
                  } else {
                    console.warn("Wellness plan from DB is malformed for user:", user.uid);
                    _setWellnessPlan(null); 
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
              if (loadedGroceryList.items && Array.isArray(loadedGroceryList.items)) {
                loadedGroceryList.items = loadedGroceryList.items.map(item => ({
                  ...item,
                  id: item.id || crypto.randomUUID(), 
                }));
              } else {
                loadedGroceryList.items = []; 
              }
              _setGroceryList(loadedGroceryList);
            } else {
               _setGroceryList(null);
            }
          } else {
            _setOnboardingData(defaultOnboardingData);
            _setWellnessPlan(null);
            _setIsOnboardedState(false);
            _setGroceryList(null);
            await setDoc(userDocRef, { email: user.email, createdAt: serverTimestamp() }, { merge: true });
          }

          const moodLogsColRef = collection(db, "users", user.uid, "moodLogs");
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
              mood: data.mood,
              notes: data.notes || undefined,
              selfieDataUri: data.selfieDataUri || undefined, 
              aiFeedback: data.aiFeedback || undefined,
              date: dateStr, 
              createdAt: data.createdAt || null,
            } as MoodLog;
          });
          _setMoodLogs(fetchedMoodLogs);

        } catch (error) {
          console.error("Error fetching user data from Firestore:", error);
          toast({ variant: "destructive", title: "Error Loading Data", description: "Could not load your saved data." });
          _setOnboardingData(defaultOnboardingData);
          _setWellnessPlan(null);
          _setIsOnboardedState(false);
          _setMoodLogs([]);
          _setGroceryList(null);
        } finally {
          setIsLoadingAuth(false);
        }
      } else { 
        setIsLoadingAuth(false);
      }
    });
    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]); 


  const signupWithEmail = async (email: string, pass: string): Promise<User | null> => {
    setIsLoadingAuth(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      const userDocRef = doc(db, "users", userCredential.user.uid);
      await setDoc(userDocRef, { 
        email: userCredential.user.email, 
        createdAt: serverTimestamp(),
        onboardingData: defaultOnboardingData, 
        wellnessPlan: null,
        currentGroceryList: null,
      });
      toast({ title: "Signup Successful", description: "Welcome to GroZen! Please complete your onboarding." });
      return userCredential.user;
    } catch (error: any) {
      console.error("Signup error", error);
      toast({ variant: "destructive", title: "Signup Failed", description: error.message || "Could not create account." });
      setIsLoadingAuth(false); 
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
      setIsLoadingAuth(false); 
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
      toast({ variant: "destructive", title: "Not Authenticated", description: "Please log in." });
      router.push('/login');
      return;
    }
    _setOnboardingData(data); 
    _setIsOnboardedState(true);
    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      await setDoc(userDocRef, { onboardingData: data, updatedAt: serverTimestamp() }, { merge: true });
      toast({ title: "Preferences Saved", description: "Your onboarding preferences have been updated." });
    } catch (error) {
      console.error("Error saving onboarding data to Firestore:", error);
      toast({ variant: "destructive", title: "Save Error", description: "Could not save preferences." });
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
      const userDocRef = doc(db, "users", currentUser.uid);
      await setDoc(userDocRef, { onboardingData: data, updatedAt: serverTimestamp() }, { merge: true });
      _setOnboardingData(data); 
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
         _setWellnessPlan(null); 
        return;
      }
      
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
        _setWellnessPlan(null); 
      }
    } catch (err) {
      console.error("Failed to generate plan:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      _setErrorPlan(errorMessage);
      toast({ variant: "destructive", title: "Error Generating Plan", description: errorMessage });
       _setWellnessPlan(null); 
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
    }

    const newLogData = {
      mood,
      notes: notes || null, 
      selfieDataUri: selfieDataUri || null, 
      aiFeedback: aiFeedbackText || null, 
      createdAt: serverTimestamp() as FieldValue, 
      userId: currentUser.uid, 
    };

    try {
      const moodLogsColRef = collection(db, "users", currentUser.uid, "moodLogs");
      const docRef = await addDoc(moodLogsColRef, newLogData);
      
      const newLogForState: MoodLog = {
        id: docRef.id,
        mood: newLogData.mood,
        notes: newLogData.notes || undefined, 
        selfieDataUri: newLogData.selfieDataUri || undefined,
        aiFeedback: newLogData.aiFeedback || undefined,
        date: new Date().toISOString(), 
        createdAt: new Date() 
      };
      _setMoodLogs(prevLogs => [newLogForState, ...prevLogs].sort((a, b) => 
         new Date(b.createdAt instanceof Date ? b.createdAt.toISOString() : b.date).getTime() - 
         new Date(a.createdAt instanceof Date ? a.createdAt.toISOString() : a.date).getTime()
      )); 
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
        meals: currentPlan.meals.map(meal => ({ 
          day: meal.day,
          breakfast: meal.breakfast,
          lunch: meal.lunch,
          dinner: meal.dinner,
        })) as Meal[] 
      };
      const result: GenerateGroceryListOutput = await aiGenerateGroceryList(input);

      const itemsWithIds: GroceryItem[] = result.items.map(item => ({
        ...item,
        id: crypto.randomUUID(), 
      }));

      const newGroceryList: GroceryList = {
        id: _groceryList?.id || crypto.randomUUID(), 
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
      ..._groceryList, 
      items: updatedItems,
    };

    _setGroceryList(updatedGroceryList); 

    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      await setDoc(userDocRef, { currentGroceryList: updatedGroceryList, updatedAt: serverTimestamp() }, { merge: true });
      toast({ title: "Item Deleted", description: "Grocery item removed." });
    } catch (error) {
      console.error("Error deleting grocery item from Firestore:", error);
      toast({ variant: "destructive", title: "Save Error", description: "Could not update grocery list in cloud." });
    }
  };

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
              mood: data.mood,
              notes: data.notes || undefined,
              selfieDataUri: data.selfieDataUri || undefined,
              aiFeedback: data.aiFeedback || undefined,
              date: dateStr,
              createdAt: data.createdAt || null,
            } as MoodLog;
        });
        
        let processedGroceryList: GroceryList | null = null;
        if (userData.currentGroceryList) {
            const loadedList = userData.currentGroceryList as GroceryList; // Type assertion
            if (loadedList.items && Array.isArray(loadedList.items)) {
                loadedList.items = loadedList.items.map(gItem => ({
                    ...gItem,
                    id: gItem.id || crypto.randomUUID(), // Ensure ID for each item
                }));
            } else {
                loadedList.items = []; // Ensure items array exists even if empty
            }
            processedGroceryList = loadedList;
        }

        return {
            id: targetUserId,
            email: userData.email || null,
            onboardingData: userData.onboardingData || null,
            wellnessPlan: userData.wellnessPlan || null,
            moodLogs: fetchedMoodLogs,
            groceryList: processedGroceryList,
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

    
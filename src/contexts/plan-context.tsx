
"use client";

import type { WellnessPlan, OnboardingData, MoodLog, GroceryList, Meal, GroceryItem, UserListItem, FullUserDetail, UserActiveChallenge, LeaderboardEntry, UserProfile } from '@/types/wellness';
import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo } from 'react';
import { generateWellnessPlan as aiGenerateWellnessPlan, type GenerateWellnessPlanInput } from '@/ai/flows/generate-wellness-plan';
import { provideMoodFeedback as aiProvideMoodFeedback, type ProvideMoodFeedbackInput } from '@/ai/flows/provide-mood-feedback';
import { generateGroceryList as aiGenerateGroceryList, type GenerateGroceryListInput, type GenerateGroceryListOutput } from '@/ai/flows/generate-grocery-list';
import { useToast } from "@/hooks/use-toast";
import { auth, db, GoogleAuthProvider, signInWithPopup } from '@/lib/firebase';
import {
  User,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile, // Added for updating user profile
  type AuthProvider
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, addDoc, query, getDocs, orderBy, serverTimestamp, FieldValue, deleteDoc, Timestamp, updateDoc, where, limit } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { CURRENT_CHALLENGE } from '@/config/challenge';
import { format, parseISO } from 'date-fns';

interface PlanContextType {
  currentUser: User | null;
  isAdminUser: boolean;
  isLoadingAuth: boolean;
  currentUserProfile: UserProfile | null; // For displayName and potentially other profile details
  signupWithEmail: (email: string, pass: string) => Promise<User | null>;
  loginWithEmail: (email: string, pass: string) => Promise<User | null>;
  signInWithGoogle: () => Promise<User | null>;
  logoutUser: () => Promise<void>;
  updateUserDisplayName: (newName: string) => Promise<void>;
  onboardingData: OnboardingData | null;
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
  userActiveChallenge: UserActiveChallenge | null;
  isLoadingUserChallenge: boolean;
  joinCurrentChallenge: () => Promise<void>;
  logChallengeDay: () => Promise<void>;
  fetchLeaderboardData: () => Promise<LeaderboardEntry[]>;
}

const defaultOnboardingData: OnboardingData | null = null;

const PlanContext = createContext<PlanContextType | undefined>(undefined);

export const PlanProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const [_onboardingData, _setOnboardingData] = useState<OnboardingData | null>(defaultOnboardingData);
  const [_wellnessPlan, _setWellnessPlan] = useState<WellnessPlan | null>(null);
  const [_isLoadingPlan, _setIsLoadingPlan] = useState(false);
  const [_errorPlan, _setErrorPlan] = useState<string | null>(null);
  const [_isOnboardedState, _setIsOnboardedState] = useState(false);
  const [_moodLogs, _setMoodLogs] = useState<MoodLog[]>([]);
  const [_groceryList, _setGroceryList] = useState<GroceryList | null>(null);
  const [_isLoadingGroceryList, _setIsLoadingGroceryList] = useState(false);
  const [_errorGroceryList, _setErrorGroceryList] = useState<string | null>(null);
  const [_userActiveChallenge, _setUserActiveChallenge] = useState<UserActiveChallenge | null>(null);
  const [_isLoadingUserChallenge, _setIsLoadingUserChallenge] = useState(false);

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
      // Note: onboardingData and userActiveChallenge are not cleared here
      // moodLogs are also not cleared here, they persist unless full logout/reset
      return;
    }

    // Full clear (except auth state if not isFullLogout)
    _setOnboardingData(defaultOnboardingData);
    _setWellnessPlan(null);
    _setIsOnboardedState(false);
    _setErrorPlan(null);
    _setMoodLogs([]);
    _setGroceryList(null);
    _setErrorGroceryList(null);
    _setIsLoadingPlan(false);
    _setIsLoadingGroceryList(false);
    _setUserActiveChallenge(null);
    _setIsLoadingUserChallenge(false);
    setCurrentUserProfile(null); // Clear profile on full reset

    if (isFullLogout) {
      // localStorage.removeItem('grozen_onboardingData'); // Example if we were using it more
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      clearPlanAndData(true, false);
      setCurrentUser(user);
      setIsAdminUser(false);
      setCurrentUserProfile(null);


      if (user) {
        if (process.env.NEXT_PUBLIC_ADMIN_UID && user.uid === process.env.NEXT_PUBLIC_ADMIN_UID) {
          setIsAdminUser(true);
        }
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
             setCurrentUserProfile({
              displayName: userData.displayName || user.displayName || user.email?.split('@')[0] || 'GroZen User',
              email: user.email || '',
            });
            if (userData.onboardingData) {
              _setOnboardingData(userData.onboardingData as OnboardingData);
              _setIsOnboardedState(true);
            } else {
              _setOnboardingData(defaultOnboardingData);
              _setIsOnboardedState(false);
            }

            if (userData.wellnessPlan) {
               try {
                  const plan = userData.wellnessPlan as WellnessPlan;
                   if(plan.meals && Array.isArray(plan.meals) && plan.exercise && Array.isArray(plan.exercise) && plan.mindfulness && Array.isArray(plan.mindfulness)) {
                    _setWellnessPlan(plan);
                  } else {
                    _setWellnessPlan(null);
                  }
              } catch (e) {
                  _setWellnessPlan(null);
              }
            } else {
               _setWellnessPlan(null);
            }

            if (userData.currentGroceryList) {
              let loadedGroceryList = userData.currentGroceryList as GroceryList;
              if (loadedGroceryList.items && Array.isArray(loadedGroceryList.items)) {
                loadedGroceryList.items = loadedGroceryList.items.map(gItem => ({
                  ...gItem,
                  id: gItem.id || crypto.randomUUID(),
                }));
              } else {
                loadedGroceryList.items = [];
              }
              _setGroceryList(loadedGroceryList);
            } else {
               _setGroceryList(null);
            }

            if (userData.activeChallengeProgress) {
              _setUserActiveChallenge(userData.activeChallengeProgress as UserActiveChallenge);
            } else {
              _setUserActiveChallenge(null);
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

          } else {
            const initialProfileName = user.displayName || user.email?.split('@')[0] || 'GroZen User';
            setCurrentUserProfile({ displayName: initialProfileName, email: user.email || '' });
            await setDoc(userDocRef, {
              email: user.email || null,
              displayName: initialProfileName,
              createdAt: serverTimestamp(),
              onboardingData: null,
              wellnessPlan: null,
              currentGroceryList: null,
              activeChallengeProgress: null,
            });
             _setOnboardingData(defaultOnboardingData);
            _setWellnessPlan(null);
            _setIsOnboardedState(false);
            _setGroceryList(null);
            _setMoodLogs([]);
            _setUserActiveChallenge(null);
          }
        } catch (error) {
          console.error("Error fetching user data from Firestore:", error);
          toast({ variant: "destructive", title: "Error Loading Data", description: "Could not load your saved data." });
          clearPlanAndData(true, false); // Perform a full reset
        } finally {
          setIsLoadingAuth(false);
        }
      } else {
        setIsLoadingAuth(false);
      }
    });
    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const signupWithEmail = async (email: string, pass: string): Promise<User | null> => {
    setIsLoadingAuth(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      toast({ title: "Signup Successful", description: "Welcome to GroZen! Please complete your onboarding." });
      return userCredential.user;
    } catch (error: any) {
      console.error("Signup error", error);
      if (error.code === 'auth/email-already-in-use') {
        toast({
          variant: "destructive",
          title: "Signup Failed",
          description: "This email address is already in use. Please try a different email or log in."
        });
      } else {
        toast({
          variant: "destructive",
          title: "Signup Failed",
          description: error.message || "Could not create account."
        });
      }
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

  const signInWithGoogle = async (): Promise<User | null> => {
    setIsLoadingAuth(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      toast({ title: "Signed In with Google", description: "Welcome!" });
      return result.user;
    } catch (error: any) {
      console.error("Google sign-in error", error);
      toast({ variant: "destructive", title: "Google Sign-In Failed", description: error.message || "Could not sign in with Google." });
      setIsLoadingAuth(false);
      return null;
    }
  };


  const logoutUser = async () => {
    try {
      await signOut(auth);
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      router.push('/login');
    } catch (error: any) {
      console.error("Logout error", error);
      toast({ variant: "destructive", title: "Logout Failed", description: error.message || "Could not log out." });
    }
  };

  const updateUserDisplayName = async (newName: string) => {
    if (!currentUser) {
      toast({ variant: "destructive", title: "Not Authenticated", description: "Please log in to update your display name." });
      return;
    }
    if (!newName.trim()) {
        toast({ variant: "destructive", title: "Invalid Name", description: "Display name cannot be empty."});
        return;
    }

    const userDocRef = doc(db, "users", currentUser.uid);
    try {
      await updateDoc(userDocRef, { displayName: newName.trim() });
      // Also update the displayName on the Firebase Auth user object, if possible
      if (auth.currentUser) { // Check if auth.currentUser is not null
          await updateProfile(auth.currentUser, { displayName: newName.trim() });
      }


      setCurrentUserProfile(prev => prev ? { ...prev, displayName: newName.trim() } : { displayName: newName.trim(), email: currentUser.email || '' });

      toast({ title: "Display Name Updated", description: "Your new display name has been saved." });
    } catch (error: any) {
      console.error("Error updating display name:", error);
      toast({ variant: "destructive", title: "Update Failed", description: error.message || "Could not update display name." });
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
      // Ensure onboarding data is saved first if it has changed or is new
      if (JSON.stringify(data) !== JSON.stringify(_onboardingData)) {
        await setDoc(userDocRef, { onboardingData: data, updatedAt: serverTimestamp() }, { merge: true });
        _setOnboardingData(data);
        _setIsOnboardedState(true);
      }


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
        _setIsLoadingPlan(false);
        return;
      }

      if (
        parsedPlanCandidate &&
        typeof parsedPlanCandidate === 'object' &&
        Array.isArray(parsedPlanCandidate.meals) && parsedPlanCandidate.meals.length > 0 &&
        parsedPlanCandidate.meals.every((m: any) => typeof m.day === 'string' && typeof m.breakfast === 'string' && typeof m.lunch === 'string' && typeof m.dinner === 'string') &&
        Array.isArray(parsedPlanCandidate.exercise) &&
        parsedPlanCandidate.exercise.every((e: any) => typeof e.day === 'string' && typeof e.activity === 'string' && typeof e.duration === 'string') &&
        Array.isArray(parsedPlanCandidate.mindfulness) &&
        parsedPlanCandidate.mindfulness.every((m: any) => typeof m.day === 'string' && typeof m.practice === 'string' && typeof m.duration === 'string')
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
        _setErrorPlan("The AI generated an incomplete or malformed plan. A valid meal plan is required.");
        toast({ variant: "destructive", title: "Plan Generation Incomplete", description: "The AI's plan was incomplete. A valid meal plan is required." });
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
      _setMoodLogs(prevLogs => [...prevLogs, newLogForState].sort((a, b) =>
         new Date(b.date).getTime() - new Date(a.date).getTime()
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
      _setGroceryList(_groceryList);
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
            displayName: docSnap.data().displayName || docSnap.data().email?.split('@')[0] || 'N/A',
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
            const loadedList = userData.currentGroceryList as GroceryList;
            if (loadedList.items && Array.isArray(loadedList.items)) {
                loadedList.items = loadedList.items.map(gItem => ({
                    ...gItem,
                    id: gItem.id || crypto.randomUUID(),
                }));
            } else {
                loadedList.items = [];
            }
            processedGroceryList = loadedList;
        }

        return {
            id: targetUserId,
            email: userData.email || null,
            displayName: userData.displayName || userData.email?.split('@')[0] || null,
            onboardingData: userData.onboardingData || null,
            wellnessPlan: userData.wellnessPlan || null,
            moodLogs: fetchedMoodLogs,
            groceryList: processedGroceryList,
            activeChallengeProgress: userData.activeChallengeProgress || null,
        };

    } catch (error) {
        console.error(`Error fetching details for user ${targetUserId}:`, error);
        toast({ variant: "destructive", title: "Fetch Error", description: `Could not fetch details for user ${targetUserId}.` });
        return null;
    }
  };

  const joinCurrentChallenge = async () => {
    if (!currentUser) {
      toast({ variant: "destructive", title: "Not Authenticated" });
      return;
    }
    _setIsLoadingUserChallenge(true);
    const newChallengeProgress: UserActiveChallenge = {
      challengeId: CURRENT_CHALLENGE.id,
      joinedDate: new Date().toISOString(),
      completedDates: [],
      daysCompleted: 0,
    };
    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      await updateDoc(userDocRef, { activeChallengeProgress: newChallengeProgress });
      _setUserActiveChallenge(newChallengeProgress);
      toast({ title: "Challenge Joined!", description: `You've joined the ${CURRENT_CHALLENGE.title}!` });
    } catch (error) {
      console.error("Error joining challenge:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not join the challenge." });
    } finally {
      _setIsLoadingUserChallenge(false);
    }
  };

  const logChallengeDay = async () => {
    if (!currentUser || !_userActiveChallenge) {
      toast({ variant: "destructive", title: "Error", description: "No active challenge or not logged in." });
      return;
    }
    _setIsLoadingUserChallenge(true);
    const todayStr = format(new Date(), 'yyyy-MM-dd');

    if (_userActiveChallenge.completedDates.includes(todayStr)) {
      toast({ title: "Already Logged", description: "You've already logged today's challenge progress!" });
      _setIsLoadingUserChallenge(false);
      return;
    }

    const updatedChallengeProgress: UserActiveChallenge = {
      ..._userActiveChallenge,
      completedDates: [..._userActiveChallenge.completedDates, todayStr],
      daysCompleted: _userActiveChallenge.daysCompleted + 1,
    };

    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      await updateDoc(userDocRef, { activeChallengeProgress: updatedChallengeProgress });
      _setUserActiveChallenge(updatedChallengeProgress);
      toast({ title: "Progress Logged!", description: "Great job on completing the challenge today!" });
    } catch (error) {
      console.error("Error logging challenge day:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not log challenge progress." });
    } finally {
      _setIsLoadingUserChallenge(false);
    }
  };

  const fetchLeaderboardData = async (): Promise<LeaderboardEntry[]> => {
    if (!currentUser) {
      return [];
    }
    try {
      const usersCollectionRef = collection(db, "users");
      const q = query(
        usersCollectionRef,
        where(`activeChallengeProgress.challengeId`, "==", CURRENT_CHALLENGE.id),
        orderBy(`activeChallengeProgress.daysCompleted`, "desc"),
        limit(10)
      );
      const querySnapshot = await getDocs(q);
      const leaderboardEntries: LeaderboardEntry[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.activeChallengeProgress && data.activeChallengeProgress.challengeId === CURRENT_CHALLENGE.id) {
          leaderboardEntries.push({
            id: docSnap.id,
            email: data.email || null,
            displayName: data.displayName || data.email?.split('@')[0] || 'Anonymous User',
            daysCompleted: data.activeChallengeProgress.daysCompleted,
          });
        }
      });
      return leaderboardEntries;
    } catch (error) {
      console.error("Error fetching leaderboard data:", error);
      toast({ variant: "destructive", title: "Leaderboard Error", description: "Could not load leaderboard." });
      return [];
    }
  };

  const isPlanAvailable = !!_wellnessPlan && !!_wellnessPlan.meals && _wellnessPlan.meals.length > 0;

  const providerValue = {
      currentUser,
      isAdminUser,
      isLoadingAuth,
      currentUserProfile,
      signupWithEmail,
      loginWithEmail,
      signInWithGoogle,
      logoutUser,
      updateUserDisplayName,
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
      userActiveChallenge: _userActiveChallenge,
      isLoadingUserChallenge: _isLoadingUserChallenge,
      joinCurrentChallenge,
      logChallengeDay,
      fetchLeaderboardData,
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


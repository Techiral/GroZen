
"use client";

import type { WellnessPlan, OnboardingData, MoodLog, GroceryList, Meal, GroceryItem, UserListItem, FullUserDetail, UserActiveChallenge, LeaderboardEntry, UserProfile, ScheduledQuest, BreakSlot, DailyPlan, QuestType } from '@/types/wellness';
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { generateWellnessPlan as aiGenerateWellnessPlan, type GenerateWellnessPlanInput } from '@/ai/flows/generate-wellness-plan';
import { provideMoodFeedback as aiProvideMoodFeedback, type ProvideMoodFeedbackInput } from '@/ai/flows/provide-mood-feedback';
import { generateGroceryList as aiGenerateGroceryList, type GenerateGroceryListInput, type GenerateGroceryListOutput } from '@/ai/flows/generate-grocery-list';
import { generateDailyTimetable as aiGenerateDailyTimetable, type GenerateDailyTimetableInput, type GenerateDailyTimetableOutput } from '@/ai/flows/generate-daily-timetable';
import { useToast } from "@/hooks/use-toast";
import { auth, db, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail } from '@/lib/firebase';
import {
  User,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type AuthProvider
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, addDoc, query, getDocs, orderBy, serverTimestamp, FieldValue, deleteDoc, Timestamp, updateDoc, where, limit } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { CURRENT_CHALLENGE } from '@/config/challenge';
import { format, startOfDay, parse, isSameDay, subDays, isValid } from 'date-fns';


interface PlanContextType {
  currentUser: User | null;
  isAdminUser: boolean;
  isLoadingAuth: boolean;
  currentUserProfile: UserProfile | null;
  signupWithEmail: (email: string, pass: string) => Promise<User | null>;
  signupWithDetails: (emailVal: string, passwordVal: string, usernameVal: string, avatarDataUri: string | null) => Promise<boolean>;
  loginWithEmail: (email: string, pass: string) => Promise<User | null>;
  signInWithGoogle: () => Promise<User | null>;
  logoutUser: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<boolean>;
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
  addMoodLog: (mood: string, notes?: string, selfieDataUri?: string) => Promise<string | undefined>;
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

  selectedDateForPlanning: Date;
  setSelectedDateForPlanning: (date: Date) => void;
  naturalLanguageDailyInput: string;
  setNaturalLanguageDailyInput: (input: string) => void;
  userScheduleContext: string;
  setUserScheduleContext: (context: string) => void;
  scheduledQuestsForSelectedDate: ScheduledQuest[];
  scheduledBreaksForSelectedDate: BreakSlot[];
  aiDailySummaryMessage: string | null;
  isLoadingSchedule: boolean;
  fetchDailyPlan: (date: Date) => Promise<void>;
  generateQuestScheduleForSelectedDate: () => Promise<void>;
  completeQuestInSchedule: (itemId: string, itemType: 'quest' | 'break') => Promise<void>;
  deleteScheduledItem: (itemId: string, itemType: 'quest' | 'break') => Promise<void>;
  questCompletionStatusForSelectedDate: Record<string, 'active' | 'completed' | 'missed'>;
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

  const [_selectedDateForPlanning, _setSelectedDateForPlanning] = useState<Date>(startOfDay(new Date()));
  const [_naturalLanguageDailyInput, _setNaturalLanguageDailyInput] = useState<string>('');
  const [_userScheduleContext, _setUserScheduleContext] = useState<string>('');
  const [_scheduledQuestsForSelectedDate, _setScheduledQuestsForSelectedDate] = useState<ScheduledQuest[]>([]);
  const [_scheduledBreaksForSelectedDate, _setScheduledBreaksForSelectedDate] = useState<BreakSlot[]>([]);
  const [_aiDailySummaryMessage, _setAiDailySummaryMessage] = useState<string | null>(null);
  const [_isLoadingSchedule, _setIsLoadingSchedule] = useState(false);
  const [_questCompletionStatusForSelectedDate, _setQuestCompletionStatusForSelectedDate] = useState<Record<string, 'active' | 'completed' | 'missed'>>({});


  const { toast } = useToast();
  const router = useRouter();

  const clearPlanAndData = useCallback((
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
      _setNaturalLanguageDailyInput('');
      _setUserScheduleContext('');
      _setScheduledQuestsForSelectedDate([]);
      _setScheduledBreaksForSelectedDate([]);
      _setAiDailySummaryMessage(null);
      _setIsLoadingSchedule(false);
      _setQuestCompletionStatusForSelectedDate({});
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
    _setUserActiveChallenge(null);
    _setIsLoadingUserChallenge(false);
    setCurrentUserProfile(null);

    _setSelectedDateForPlanning(startOfDay(new Date()));
    _setNaturalLanguageDailyInput('');
    _setUserScheduleContext('');
    _setScheduledQuestsForSelectedDate([]);
    _setScheduledBreaksForSelectedDate([]);
    _setAiDailySummaryMessage(null);
    _setIsLoadingSchedule(false);
    _setQuestCompletionStatusForSelectedDate({});


    if (isFullLogout) {
    }
  }, []);

  const getDailyPlanDocRef = useCallback((date: Date) => {
    if (!currentUser) return null;
    const dateString = format(date, 'yyyy-MM-dd');
    return doc(db, "users", currentUser.uid, "dailyPlans", dateString);
  }, [currentUser]);


  const fetchDailyPlan = useCallback(async (date: Date) => {
    if (!currentUser) return;
    _setIsLoadingSchedule(true);
    const planDocRef = getDailyPlanDocRef(date);
    if (!planDocRef) {
      _setIsLoadingSchedule(false);
      _setNaturalLanguageDailyInput('');
      _setUserScheduleContext('');
      _setScheduledQuestsForSelectedDate([]);
      _setScheduledBreaksForSelectedDate([]);
      _setAiDailySummaryMessage(null);
      _setQuestCompletionStatusForSelectedDate({});
      return;
    }

    try {
      const docSnap = await getDoc(planDocRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as DailyPlan;
        _setNaturalLanguageDailyInput(data.naturalLanguageDailyInput || '');
        _setUserScheduleContext(data.userContextForAI || '');
        _setScheduledQuestsForSelectedDate(data.generatedQuests || []);
        _setScheduledBreaksForSelectedDate(data.generatedBreaks || []);
        _setAiDailySummaryMessage(data.aiDailySummaryMessage || null);
        _setQuestCompletionStatusForSelectedDate(data.questCompletionStatus || {});
      } else {
        _setNaturalLanguageDailyInput('');
         _setUserScheduleContext('');
        _setScheduledQuestsForSelectedDate([]);
        _setScheduledBreaksForSelectedDate([]);
        _setAiDailySummaryMessage(null);
        _setQuestCompletionStatusForSelectedDate({});
      }
    } catch (error: any) {
      console.error("Error fetching daily plan:", error);
      toast({ variant: "destructive", title: "Load Error", description: `Could not load daily plan: ${error.message}` });
      _setNaturalLanguageDailyInput('');
      _setUserScheduleContext('');
      _setScheduledQuestsForSelectedDate([]);
      _setScheduledBreaksForSelectedDate([]);
      _setAiDailySummaryMessage(null);
      _setQuestCompletionStatusForSelectedDate({});
    } finally {
      _setIsLoadingSchedule(false);
    }
  }, [currentUser, toast, getDailyPlanDocRef]);


  useEffect(() => {
    if (currentUser) {
      fetchDailyPlan(_selectedDateForPlanning);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_selectedDateForPlanning, currentUser]);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      clearPlanAndData(true, false);
      setCurrentUser(user);
      setIsAdminUser(false);
      setCurrentUserProfile(null);

      if (user) {
        const adminUid = process.env.NEXT_PUBLIC_ADMIN_UID || 'QNSRsQsMqRRuS4288vtlBYT1a7E2';
        if (adminUid && user.uid === adminUid) {
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
              avatarUrl: userData.avatarUrl || user.photoURL || undefined,
              level: userData.level || 1,
              xp: userData.xp || 0,
              dailyQuestStreak: userData.dailyQuestStreak || 0,
              bestQuestStreak: userData.bestQuestStreak || 0,
              lastQuestCompletionDate: userData.lastQuestCompletionDate || undefined,
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

            await fetchDailyPlan(startOfDay(new Date()));

          } else {
            const initialProfileName = user.displayName || user.email?.split('@')[0] || 'GroZen User';
            const initialAvatarUrl = user.photoURL || undefined;

            setCurrentUserProfile({
                displayName: initialProfileName,
                email: user.email || '',
                avatarUrl: initialAvatarUrl,
                level: 1, xp: 0, dailyQuestStreak: 0, bestQuestStreak: 0, lastQuestCompletionDate: undefined,
            });
             const basicUserDoc = {
                email: user.email,
                displayName: initialProfileName,
                avatarUrl: initialAvatarUrl || null,
                createdAt: serverTimestamp(),
                onboardingData: null,
                wellnessPlan: null,
                currentGroceryList: null,
                activeChallengeProgress: null,
                level: 1,
                xp: 0,
                dailyQuestStreak: 0,
                bestQuestStreak: 0,
                lastQuestCompletionDate: null,
             };
             try {
                await setDoc(doc(db, "users", user.uid), basicUserDoc, { merge: true });
             } catch (basicDocError) {
                toast({ variant: "destructive", title: "Account Setup Incomplete", description: "Could not initialize your profile. Please try signing up manually or contact support."});
             }
            _setOnboardingData(defaultOnboardingData);
            _setWellnessPlan(null);
            _setIsOnboardedState(false);
            _setGroceryList(null);
            _setMoodLogs([]);
            _setUserActiveChallenge(null);
            _setNaturalLanguageDailyInput('');
            _setUserScheduleContext('');
            _setScheduledQuestsForSelectedDate([]);
            _setScheduledBreaksForSelectedDate([]);
            _setAiDailySummaryMessage(null);
            _setQuestCompletionStatusForSelectedDate({});
          }
        } catch (error) {
          console.error("Error in onAuthStateChanged fetching/creating user data from Firestore:", error);
          toast({ variant: "destructive", title: "Error Loading Data", description: "Could not load your saved data." });
          clearPlanAndData(true, false);
        } finally {
          setIsLoadingAuth(false);
        }
      } else {
        setIsLoadingAuth(false);
      }
    });
    return () => unsubscribe();
  }, [clearPlanAndData, toast, fetchDailyPlan]);


  const signupWithEmail = async (email: string, pass: string): Promise<User | null> => {
    setIsLoadingAuth(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      toast({ title: "Signup Started", description: "Welcome to GroZen! Please complete your profile setup." });
      return userCredential.user;
    } catch (error: any) {
      toast({ variant: "destructive", title: "Signup Failed", description: error.message || "Could not create account."});
      setIsLoadingAuth(false);
      return null;
    }
  };

  const signupWithDetails = async (emailVal: string, passwordVal: string, usernameVal: string, avatarDataUri: string | null): Promise<boolean> => {
    setIsLoadingAuth(true);
    let user: User | null = null;
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, emailVal, passwordVal);
      user = userCredential.user;

      await updateProfile(user, {
        displayName: usernameVal.trim(),
      });

      const trimmedUsername = usernameVal.trim().toLowerCase();
      const usernameDocRef = doc(db, "usernames", trimmedUsername);
      const usernameData = {
        userId: user.uid,
        email: user.email,
      };

      await setDoc(usernameDocRef, usernameData);

      const userDocRef = doc(db, "users", user.uid);
      const userDocPayload: UserProfile & { createdAt: FieldValue, onboardingData: null, wellnessPlan: null, currentGroceryList: null, activeChallengeProgress: null, lastQuestCompletionDate: null } = {
        email: user.email,
        displayName: usernameVal.trim(),
        avatarUrl: (avatarDataUri && typeof avatarDataUri === 'string' && avatarDataUri.trim() !== "") ? avatarDataUri : undefined,
        createdAt: serverTimestamp(),
        onboardingData: null,
        wellnessPlan: null,
        currentGroceryList: null,
        activeChallengeProgress: null,
        level: 1,
        xp: 0,
        dailyQuestStreak: 0,
        bestQuestStreak: 0,
        lastQuestCompletionDate: null,
      };

      await setDoc(userDocRef, userDocPayload);

      setCurrentUserProfile({
        displayName: usernameVal.trim(),
        email: user.email || '',
        avatarUrl: userDocPayload.avatarUrl || undefined,
        level: 1, xp: 0, dailyQuestStreak: 0, bestQuestStreak: 0, lastQuestCompletionDate: undefined
      });
      _setIsOnboardedState(false);

      toast({ title: "Signup Complete!", description: "Welcome to GroZen!" });
      setIsLoadingAuth(false);
      return true;

    } catch (error: any) {
      if (user && (error.code?.includes("permission-denied") || error.message?.includes("permission denied") || error.message?.includes("Missing or insufficient permissions") || error.name === 'FirebaseError')) {
        try {
          await user.delete();
        } catch (deleteError: any) {
          console.error("Failed to delete Firebase Auth user after signup failure:", deleteError);
        }
      }
      const commonErrorMessages: {[key: string]: string} = {
        'auth/email-already-in-use': "This email address is already in use. Try logging in or use a different email.",
      };
      let description = commonErrorMessages[error.code] || error.message || "An unexpected error occurred during signup.";
      if (error.message && error.message.includes("firestore/permission-denied")) {
        description = "Action blocked by security rules. Please check Firestore rules configuration in your Firebase project console.";
      }
      toast({ variant: "destructive", title: "Signup Failed", description: description, duration: 7000 });
      setIsLoadingAuth(false);
      return false;
    }
  };

  const loginWithEmail = async (email: string, pass: string): Promise<User | null> => {
    setIsLoadingAuth(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      toast({ title: "Login Successful", description: "Welcome back!" });
      return userCredential.user;
    } catch (error: any) {
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

  const sendPasswordReset = async (email: string): Promise<boolean> => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast({ title: "Password Reset Email Sent", description: "Check your inbox (and spam folder) for a link to reset your password." });
      return true;
    } catch (error: any) {
      let errorMessage = "Could not send password reset email.";
      if (error.code === 'auth/user-not-found') {
        errorMessage = "No user found with this email address.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "The email address is not valid.";
      }
      toast({ variant: "destructive", title: "Password Reset Failed", description: errorMessage });
      return false;
    }
  };


  const logoutUser = async () => {
    try {
      await signOut(auth);
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      router.push('/login');
    } catch (error: any) {
      toast({ variant: "destructive", title: "Logout Failed", description: error.message || "Could not log out." });
    }
  };

  const updateUserDisplayName = async (newName: string) => {
    if (!currentUser || !auth.currentUser) {
      toast({ variant: "destructive", title: "Not Authenticated" });
      return;
    }
    if (!newName.trim()) {
        toast({ variant: "destructive", title: "Invalid Name", description: "Display name cannot be empty."});
        return;
    }

    const userDocRef = doc(db, "users", currentUser.uid);
    try {
      await updateProfile(auth.currentUser, { displayName: newName.trim() });
      await updateDoc(userDocRef, { displayName: newName.trim() });
      setCurrentUserProfile(prev => prev ? { ...prev, displayName: newName.trim() } : { displayName: newName.trim(), email: currentUser.email || '', avatarUrl: prev?.avatarUrl, level: 1, xp: 0, dailyQuestStreak: 0, bestQuestStreak: 0, lastQuestCompletionDate: prev?.lastQuestCompletionDate });
      toast({ title: "Display Name Updated" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Update Failed", description: error.message });
    }
  };


  const completeOnboarding = async (data: OnboardingData) => {
    if (!currentUser) return router.push('/login');
    _setOnboardingData(data);
    _setIsOnboardedState(true);
    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      await setDoc(userDocRef, { onboardingData: data, updatedAt: serverTimestamp() }, { merge: true });
      toast({ title: "Preferences Saved" });
    } catch (error) {
      toast({ variant: "destructive", title: "Save Error", description: "Could not save preferences." });
    }
  };

  const generatePlan = async (data: OnboardingData) => {
    if (!currentUser) return router.push('/login');
    _setIsLoadingPlan(true);
    _setErrorPlan(null);
    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      if (!_isOnboardedState || JSON.stringify(data) !== JSON.stringify(_onboardingData)) {
        await setDoc(userDocRef, { onboardingData: data, updatedAt: serverTimestamp() }, { merge: true });
        _setOnboardingData(data);
        _setIsOnboardedState(true);
      }
      const input: GenerateWellnessPlanInput = data;
      const result = await aiGenerateWellnessPlan(input);
      const parsedPlanCandidate = JSON.parse(result.plan);

      if (
        parsedPlanCandidate && Array.isArray(parsedPlanCandidate.meals) && parsedPlanCandidate.meals.length > 0 &&
        parsedPlanCandidate.meals.every((m: any) => typeof m.day === 'string' && typeof m.breakfast === 'string') &&
        Array.isArray(parsedPlanCandidate.exercise) && Array.isArray(parsedPlanCandidate.mindfulness)
      ) {
        const planToSet = parsedPlanCandidate as WellnessPlan;
        _setWellnessPlan(planToSet);
        await setDoc(userDocRef, { wellnessPlan: planToSet, updatedAt: serverTimestamp() }, { merge: true });
        toast({ title: "Plan Generated & Saved!" });
      } else {
        throw new Error("AI generated an incomplete or malformed plan.");
      }
    } catch (err: any) {
      _setErrorPlan(err.message);
      toast({ variant: "destructive", title: "Error Generating Plan", description: err.message });
      _setWellnessPlan(null);
    } finally {
      _setIsLoadingPlan(false);
    }
  };

  const addMoodLog = async (mood: string, notes?: string, selfieDataUri?: string): Promise<string | undefined> => {
    if (!currentUser) {
      router.push('/login');
      return undefined;
    }
    let aiFeedbackText: string | undefined;
    try {
      const feedbackInput: ProvideMoodFeedbackInput = { mood };
      if (notes) feedbackInput.notes = notes;
      const feedbackResponse = await aiProvideMoodFeedback(feedbackInput);
      aiFeedbackText = feedbackResponse.feedback;
    } catch (err) { console.warn("AI mood feedback failed:", err); }

    const newLogData = {
      mood,
      notes: notes || null,
      selfieDataUri: selfieDataUri || null,
      aiFeedback: aiFeedbackText || null,
      createdAt: serverTimestamp(),
      userId: currentUser.uid
    };
    try {
      const docRef = await addDoc(collection(db, "users", currentUser.uid, "moodLogs"), newLogData);
      _setMoodLogs(prev => [{ ...newLogData, id: docRef.id, date: new Date().toISOString(), createdAt: new Date() } as MoodLog, ...prev]
        .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      toast({ title: "Mood Logged", description: aiFeedbackText ? `GroZen: ${aiFeedbackText}` : "Successfully recorded."});
      return aiFeedbackText;
    } catch (error) {
      toast({ variant: "destructive", title: "Save Error", description: "Could not save your mood log." });
      return undefined;
    }
  };

  const deleteMoodLog = async (logId: string) => {
    if (!currentUser) return;
    try {
      await deleteDoc(doc(db, "users", currentUser.uid, "moodLogs", logId));
      _setMoodLogs(prev => prev.filter(log => log.id !== logId));
      toast({ title: "Mood Log Deleted" });
    } catch (error) {
      toast({ variant: "destructive", title: "Delete Error", description: "Could not delete the mood log." });
    }
  };

  const generateGroceryList = async (currentPlan: WellnessPlan) => {
    if (!currentUser || !currentPlan?.meals?.length) {
        toast({variant: "default", title: "No Meal Plan", description: "Cannot generate grocery list without a meal plan."});
        return;
    }
    _setIsLoadingGroceryList(true);
    _setErrorGroceryList(null);
    try {
      const input: GenerateGroceryListInput = { meals: currentPlan.meals as Meal[] };
      const result: GenerateGroceryListOutput = await aiGenerateGroceryList(input);
      const newGroceryList: GroceryList = {
        id: _groceryList?.id || crypto.randomUUID(),
        items: result.items.map(item => ({ ...item, id: item.id || crypto.randomUUID() })),
        generatedDate: new Date().toISOString(),
      };
      await setDoc(doc(db, "users", currentUser.uid), { currentGroceryList: newGroceryList, updatedAt: serverTimestamp() }, { merge: true });
      _setGroceryList(newGroceryList);
      toast({ title: "Grocery List Generated!" });
    } catch (err: any) {
      _setErrorGroceryList(err.message);
      toast({ variant: "destructive", title: "Grocery List Error", description: err.message });
    } finally {
      _setIsLoadingGroceryList(false);
    }
  };

  const deleteGroceryItem = async (itemIdToDelete: string) => {
    if (!currentUser || !_groceryList) return;
    const updatedItems = _groceryList.items.filter(item => item.id !== itemIdToDelete);
    const updatedGroceryList = { ..._groceryList, items: updatedItems };
    _setGroceryList(updatedGroceryList);
    try {
      await setDoc(doc(db, "users", currentUser.uid), { currentGroceryList: updatedGroceryList, updatedAt: serverTimestamp() }, { merge: true });
      toast({ title: "Item Deleted" });
    } catch (error) {
      _setGroceryList(_groceryList);
      toast({ variant: "destructive", title: "Update Error", description: "Could not delete item." });
    }
  };

  const fetchAllUsers = async (): Promise<UserListItem[]> => {
    if (!isAdminUser) {
        return [];
    }
    try {
      const snap = await getDocs(collection(db, "users"));
      return snap.docs.map(d => {
          const data = d.data();
          const userItem: UserListItem = {
              id: d.id,
              email: data.email || null,
              displayName: data.displayName || null,
              avatarUrl: data.avatarUrl || undefined
          };
          return userItem;
        });
    } catch (error) {
        toast({variant: "destructive", title: "Admin Error", description: "Could not fetch user list."});
        return [];
    }
  };

  const fetchFullUserDetailsForAdmin = async (targetUserId: string): Promise<FullUserDetail | null> => {
     if (!isAdminUser) {
        return null;
     }
    try {
      const userSnap = await getDoc(doc(db, "users", targetUserId));
      if (!userSnap.exists()) {
        toast({variant: "default", title: "Not Found", description: "User data not found."});
        return null;
      }
      const userData = userSnap.data();

      const moodLogsSnap = await getDocs(query(collection(db, "users", targetUserId, "moodLogs"), orderBy("createdAt", "desc")));
      const fetchedMoodLogs = moodLogsSnap.docs.map(d => {
        const data = d.data();
        const dateStr = data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : (data.date || new Date().toISOString());
        return { ...data, id: d.id, date: dateStr } as MoodLog;
      });

      let processedGL = null;
      if (userData.currentGroceryList) {
          processedGL = {...userData.currentGroceryList, items: userData.currentGroceryList.items?.map((i:any) => ({...i, id: i.id || crypto.randomUUID()})) || []};
      }

      const dailyPlansColRef = collection(db, "users", targetUserId, "dailyPlans");
      const dailyPlansSnap = await getDocs(query(dailyPlansColRef, orderBy("lastGeneratedAt", "desc"))); 
      const fetchedDailyPlans = dailyPlansSnap.docs.map(d => {
        const planData = d.data() as DailyPlan;
        return { ...planData, id: d.id };
      });


      return {
          id: targetUserId,
          email: userData.email || null,
          displayName: userData.displayName || null,
          avatarUrl: userData.avatarUrl || undefined,
          onboardingData: userData.onboardingData || null,
          wellnessPlan: userData.wellnessPlan || null,
          moodLogs: fetchedMoodLogs,
          groceryList: processedGL,
          activeChallengeProgress: userData.activeChallengeProgress || null,
          profile: {
            displayName: userData.displayName || null,
            email: userData.email || null,
            avatarUrl: userData.avatarUrl || undefined,
            level: userData.level || 1,
            xp: userData.xp || 0,
            dailyQuestStreak: userData.dailyQuestStreak || 0,
            bestQuestStreak: userData.bestQuestStreak || 0,
            lastQuestCompletionDate: userData.lastQuestCompletionDate || undefined,
            title: userData.title || undefined,
          },
          dailyPlans: fetchedDailyPlans, 
        } as FullUserDetail;
    } catch (error: any) {
        toast({variant: "destructive", title: "Admin Error", description: `Could not fetch user details: ${error.message}`});
        return null;
    }
  };

  const joinCurrentChallenge = async () => {
    if (!currentUser) return;
    _setIsLoadingUserChallenge(true);
    const newChallenge: UserActiveChallenge = {
        challengeId: CURRENT_CHALLENGE.id,
        joinedDate: new Date().toISOString(),
        completedDates: [],
        daysCompleted: 0
    };
    try {
      await updateDoc(doc(db, "users", currentUser.uid), { activeChallengeProgress: newChallenge });
      _setUserActiveChallenge(newChallenge);
      toast({ title: "Challenge Joined!", description: `Let's do this: ${CURRENT_CHALLENGE.title}` });
    } catch (e) {
        toast({variant: "destructive", title: "Error Joining Challenge", description: "Could not join the challenge."});
    }
    finally { _setIsLoadingUserChallenge(false); }
  };

  const logChallengeDay = async () => {
    if (!currentUser || !_userActiveChallenge) return;
    _setIsLoadingUserChallenge(true);
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    if (_userActiveChallenge.completedDates.includes(todayStr)) {
      toast({ title: "Already Logged Today!", description: "Great job staying consistent!" });
      _setIsLoadingUserChallenge(false);
      return;
    }
    const updatedChallenge = {
        ..._userActiveChallenge,
        completedDates: [..._userActiveChallenge.completedDates, todayStr],
        daysCompleted: _userActiveChallenge.daysCompleted + 1
    };
    try {
      await updateDoc(doc(db, "users", currentUser.uid), { activeChallengeProgress: updatedChallenge });
      _setUserActiveChallenge(updatedChallenge);
      toast({ title: "Day Logged!", description: "Awesome progress!" });
    } catch (e) {
        toast({variant: "destructive", title: "Error Logging Day", description: "Could not log your progress."});
    }
    finally { _setIsLoadingUserChallenge(false); }
  };

  const fetchLeaderboardData = async (): Promise<LeaderboardEntry[]> => {
    if (!currentUser) {
      return [];
    }
    try {
      const q = query(
        collection(db, "users"),
        where("activeChallengeProgress.challengeId", "==", CURRENT_CHALLENGE.id),
        orderBy("activeChallengeProgress.daysCompleted", "desc"),
        limit(10)
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          displayName: data.displayName || "Anonymous User",
          daysCompleted: data.activeChallengeProgress?.daysCompleted || 0,
          avatarUrl: data.avatarUrl || undefined,
          level: data.level || 1,
          xp: data.xp || 0,
        } as LeaderboardEntry;
      });
    } catch (e: any) {
      toast({variant: "destructive", title: "Leaderboard Error", description: "Could not load leaderboard. " + (e.message || "Please check your network or try again later.") });
      return [];
    }
  };

  const generateQuestScheduleForSelectedDate = async () => {
    if (!currentUser || !_naturalLanguageDailyInput.trim()) {
      toast({ title: "No Tasks Provided", description: "Please describe your day's tasks before generating a schedule!" });
      return;
    }
    _setIsLoadingSchedule(true);
    try {
      const input: GenerateDailyTimetableInput = {
        naturalLanguageTasks: _naturalLanguageDailyInput,
        userContext: _userScheduleContext,
        currentDate: format(_selectedDateForPlanning, 'yyyy-MM-dd'),
        userName: currentUserProfile?.displayName || undefined,
      };
      const result = await aiGenerateDailyTimetable(input);

      _setScheduledQuestsForSelectedDate(result.scheduledQuests || []);
      _setScheduledBreaksForSelectedDate(result.breaks || []);
      _setAiDailySummaryMessage(result.dailySummaryMessage || null);
      
      const initialQuestStatus = (result.scheduledQuests || []).reduce((acc, quest) => {
          acc[quest.id] = 'active';
          return acc;
      }, {} as Record<string, 'active' | 'completed' | 'missed'>);
       (result.breaks || []).forEach(br => { initialQuestStatus[br.id] = 'active'; });


      _setQuestCompletionStatusForSelectedDate(initialQuestStatus);


      const planDocRef = getDailyPlanDocRef(_selectedDateForPlanning);
      if (planDocRef) {
        const planDataToSave: DailyPlan = {
            naturalLanguageDailyInput: _naturalLanguageDailyInput,
            userContextForAI: _userScheduleContext || null,
            generatedQuests: result.scheduledQuests || [],
            generatedBreaks: result.breaks || [],
            aiDailySummaryMessage: result.dailySummaryMessage || null,
            questCompletionStatus: initialQuestStatus,
            lastGeneratedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };
        await setDoc(planDocRef, planDataToSave, { merge: true });
        toast({ title: "Quest Schedule Generated!", description: "Your AI-powered plan is ready." });
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "AI Error", description: error.message || "Could not generate schedule." });
    } finally {
      _setIsLoadingSchedule(false);
    }
  };

 const completeQuestInSchedule = async (itemId: string, itemType: 'quest' | 'break') => {
    if (!currentUser || !currentUserProfile) return;

    let xpGained = 0;
    let itemTitle = "";
    const isQuest = itemType === 'quest';
    const currentDateKey = format(_selectedDateForPlanning, 'yyyy-MM-dd');

    const planDocRef = getDailyPlanDocRef(_selectedDateForPlanning);
    if (!planDocRef) return;

    let dailyPlanData: DailyPlan | null = null;
    try {
        const planSnap = await getDoc(planDocRef);
        if (planSnap.exists()) {
            dailyPlanData = planSnap.data() as DailyPlan;
        }
    } catch (e) {
        console.error("Error fetching daily plan for completion:", e);
        toast({variant: "destructive", title: "Sync Error", description: "Could not fetch daily plan to mark completion."});
        return;
    }

    if (!dailyPlanData) {
        toast({variant: "destructive", title: "Plan Not Found", description: "Daily plan for this date is missing."});
        return;
    }
    
    if (_questCompletionStatusForSelectedDate[itemId] === 'completed') {
      toast({title: "Already Done!", description: "You've already crushed this one today!"});
      return;
    }

    let allItemsForDay: (ScheduledQuest | BreakSlot)[] = [
        ...(dailyPlanData.generatedQuests || []),
        ...(dailyPlanData.generatedBreaks || [])
    ];
    const itemToComplete = allItemsForDay.find(it => it.id === itemId);

    if (!itemToComplete) {
        toast({variant: "destructive", title: "Item Not Found", description: "Could not find the item to complete."});
        return;
    }
    xpGained = (itemToComplete as ScheduledQuest).xp || (itemToComplete as BreakSlot).xp || 0;
    itemTitle = (itemToComplete as ScheduledQuest).title || (itemToComplete as BreakSlot).suggestion || "Task";


    // Update local state immediately for responsiveness
    const updatedStatus = { ..._questCompletionStatusForSelectedDate, [itemId]: 'completed' as const };
    _setQuestCompletionStatusForSelectedDate(updatedStatus);


    // Update Firestore for quest completion status within the daily plan
    try {
        await updateDoc(planDocRef, {
            questCompletionStatus: updatedStatus,
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        toast({variant: "destructive", title: "Sync Error", description: "Couldn't save completion to daily plan."});
        // Revert local state if Firestore update fails
        _setQuestCompletionStatusForSelectedDate(_questCompletionStatusForSelectedDate); // Revert to previous state
        return;
    }

    // XP and Streak Logic
    let userProfileUpdates: Partial<UserProfile> = {
        xp: (currentUserProfile.xp || 0) + xpGained,
    };
    
    const previouslyCompletedToday = Object.values(dailyPlanData.questCompletionStatus || {}).some(status => status === 'completed');

    if (!previouslyCompletedToday) { // This is the first completion for *any* quest on this selected date
        const lastCompletionDateStr = currentUserProfile.lastQuestCompletionDate;
        let newStreak = currentUserProfile.dailyQuestStreak || 0;

        if (lastCompletionDateStr && isValid(parse(lastCompletionDateStr, 'yyyy-MM-dd', new Date()))) {
            const lastCompletionDate = parse(lastCompletionDateStr, 'yyyy-MM-dd', new Date());
            const expectedPreviousDate = subDays(_selectedDateForPlanning, 1);

            if (isSameDay(lastCompletionDate, _selectedDateForPlanning)) {
                // Already counted streak for today, do nothing
            } else if (isSameDay(lastCompletionDate, expectedPreviousDate)) {
                newStreak++;
            } else {
                newStreak = 1; // Reset if not consecutive and not the same day
            }
        } else {
            newStreak = 1; // First ever completion or invalid last date
        }
        userProfileUpdates.dailyQuestStreak = newStreak;
        userProfileUpdates.bestQuestStreak = Math.max(currentUserProfile.bestQuestStreak || 0, newStreak);
        userProfileUpdates.lastQuestCompletionDate = currentDateKey;
    }
    
    // Level up logic
    const currentLevel = userProfileUpdates.level || currentUserProfile.level || 1;
    const currentXP = userProfileUpdates.xp || 0;
    const xpForNextLevel = currentLevel * 250; 
    if (currentXP >= xpForNextLevel) {
        userProfileUpdates.level = currentLevel + 1;
        userProfileUpdates.xp = currentXP % xpForNextLevel; // Carry over excess XP
        toast({ title: "LEVEL UP! 🎉", description: `You've reached Level ${userProfileUpdates.level}! Keep crushing it!`, duration: 4000 });
    }
    
    if (Object.keys(userProfileUpdates).length > 0) {
        try {
            await updateDoc(doc(db, "users", currentUser.uid), userProfileUpdates);
            setCurrentUserProfile(prev => prev ? { ...prev, ...userProfileUpdates } : null);
        } catch (error) {
            console.error("Error updating user profile for XP/streak:", error);
            toast({variant: "destructive", title: "Profile Sync Error", description: "Could not update your XP/streak."});
        }
    }

    if (xpGained > 0) {
      toast({title: `+${xpGained} XP! "${itemTitle}"`, description: "Awesome job staying on track!"});
    } else {
      toast({title: `"${itemTitle}" Complete!`, description: "Great job staying on track!"});
    }
  };


  const deleteScheduledItem = async (itemId: string, itemType: 'quest' | 'break') => {
    if (!currentUser) return;

    let updatedQuests = [..._scheduledQuestsForSelectedDate];
    let updatedBreaks = [..._scheduledBreaksForSelectedDate];

    if (itemType === 'quest') {
      updatedQuests = _scheduledQuestsForSelectedDate.filter(q => q.id !== itemId);
      _setScheduledQuestsForSelectedDate(updatedQuests);
    } else {
      updatedBreaks = _scheduledBreaksForSelectedDate.filter(b => b.id !== itemId);
      _setScheduledBreaksForSelectedDate(updatedBreaks);
    }

    const updatedCompletionStatus = { ..._questCompletionStatusForSelectedDate };
    delete updatedCompletionStatus[itemId];
    _setQuestCompletionStatusForSelectedDate(updatedCompletionStatus);


    const planDocRef = getDailyPlanDocRef(_selectedDateForPlanning);
    if (planDocRef) {
      try {
        await updateDoc(planDocRef, {
          generatedQuests: updatedQuests,
          generatedBreaks: updatedBreaks,
          questCompletionStatus: updatedCompletionStatus,
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        console.error("Error deleting scheduled item from Firestore:", error);
        if (itemType === 'quest') _setScheduledQuestsForSelectedDate(_scheduledQuestsForSelectedDate);
        else _setScheduledBreaksForSelectedDate(_scheduledBreaksForSelectedDate);
        _setQuestCompletionStatusForSelectedDate(_questCompletionStatusForSelectedDate); // Revert
        toast({ variant: "destructive", title: "Delete Error", description: "Could not remove item from schedule." });
      }
    }
  };


  const isPlanAvailable = !!_wellnessPlan?.meals?.length;

  const providerValue = {
      currentUser, isAdminUser, isLoadingAuth, currentUserProfile,
      signupWithEmail, signupWithDetails, loginWithEmail, signInWithGoogle, logoutUser, sendPasswordReset, updateUserDisplayName,
      onboardingData: _onboardingData, wellnessPlan: _wellnessPlan, isLoadingPlan: _isLoadingPlan, errorPlan: _errorPlan, generatePlan, clearPlanAndData,
      isPlanAvailable, isOnboardedState: _isOnboardedState, completeOnboarding,
      moodLogs: _moodLogs, addMoodLog, deleteMoodLog,
      groceryList: _groceryList, isLoadingGroceryList: _isLoadingGroceryList, errorGroceryList: _errorGroceryList, generateGroceryList, deleteGroceryItem,
      fetchAllUsers, fetchFullUserDetailsForAdmin,
      userActiveChallenge: _userActiveChallenge, isLoadingUserChallenge: _isLoadingUserChallenge, joinCurrentChallenge, logChallengeDay,
      fetchLeaderboardData,
      selectedDateForPlanning: _selectedDateForPlanning,
      setSelectedDateForPlanning: _setSelectedDateForPlanning,
      naturalLanguageDailyInput: _naturalLanguageDailyInput,
      setNaturalLanguageDailyInput: _setNaturalLanguageDailyInput,
      userScheduleContext: _userScheduleContext,
      setUserScheduleContext: _setUserScheduleContext,
      scheduledQuestsForSelectedDate: _scheduledQuestsForSelectedDate,
      scheduledBreaksForSelectedDate: _scheduledBreaksForSelectedDate,
      aiDailySummaryMessage: _aiDailySummaryMessage,
      isLoadingSchedule: _isLoadingSchedule,
      fetchDailyPlan,
      generateQuestScheduleForSelectedDate,
      completeQuestInSchedule,
      deleteScheduledItem,
      questCompletionStatusForSelectedDate: _questCompletionStatusForSelectedDate,
  };

  return (
    <PlanContext.Provider value={providerValue}>
      {children}
    </PlanContext.Provider>
  );
};

export const usePlan = (): PlanContextType => {
  const context = useContext(PlanContext);
  if (context === undefined) throw new Error('usePlan must be used within a PlanProvider');
  return context;
};


"use client";

import type { WellnessPlan, OnboardingData, MoodLog, GroceryList, Meal, GroceryItem, UserListItem, FullUserDetail, UserActiveChallenge, LeaderboardEntry, UserProfile } from '@/types/wellness';
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
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
  updateProfile,
  type AuthProvider
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, addDoc, query, getDocs, orderBy, serverTimestamp, FieldValue, deleteDoc, Timestamp, updateDoc, where, limit } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { CURRENT_CHALLENGE } from '@/config/challenge';
import { format } from 'date-fns';

interface PlanContextType {
  currentUser: User | null;
  isAdminUser: boolean;
  isLoadingAuth: boolean;
  currentUserProfile: UserProfile | null;
  signupWithEmail: (email: string, pass: string) => Promise<User | null>;
  signupWithDetails: (emailVal: string, passwordVal: string, usernameVal: string, avatarDataUri: string) => Promise<boolean>;
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

    if (isFullLogout) {
      // Future: localStorage.removeItem('grozen_onboardingData');
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      clearPlanAndData(true, false);
      setCurrentUser(user);
      setIsAdminUser(false);
      setCurrentUserProfile(null);

      if (user) {
        const adminUid = process.env.NEXT_PUBLIC_ADMIN_UID || 'QNSRsQsMqRRuS4288vtlBYT1a7E2'; // Example default
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
              avatarUrl: userData.avatarUrl || user.photoURL || undefined
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
            // This block runs IF THE USER IS AUTHENTICATED but NO Firestore doc exists for them.
            // This typically happens right after Google Sign-In for a NEW user, or if
            // Email/Pass signup completed but Firestore doc creation failed somehow.
            console.log(`User ${user.uid} authenticated, but no Firestore document found. Creating one.`);
            const initialProfileName = user.displayName || user.email?.split('@')[0] || 'GroZen User';
            const initialAvatarUrl = user.photoURL || undefined; 

            setCurrentUserProfile({ displayName: initialProfileName, email: user.email || '', avatarUrl: initialAvatarUrl });
            
            // Prepare a basic user document to ensure one exists.
            // This basic doc might be overwritten by `signupWithDetails` if that flow is used.
            const basicUserDocPayload = {
              email: user.email || null,
              displayName: initialProfileName,
              avatarUrl: initialAvatarUrl, // This might be from Google or undefined
              createdAt: serverTimestamp(),
              onboardingData: null,
              wellnessPlan: null,
              currentGroceryList: null,
              activeChallengeProgress: null,
            };
            await setDoc(doc(db, "users", user.uid), basicUserDocPayload, { merge: true });
            console.log(`Basic Firestore document created for new user ${user.uid}.`);

            _setOnboardingData(defaultOnboardingData);
            _setWellnessPlan(null);
            _setIsOnboardedState(false);
            _setGroceryList(null);
            _setMoodLogs([]);
            _setUserActiveChallenge(null);
          }
        } catch (error) {
          console.error("Error in onAuthStateChanged fetching/creating user data from Firestore:", error);
          toast({ variant: "destructive", title: "Error Loading Data", description: "Could not load your saved data." });
          clearPlanAndData(true, false); // Clear all local state on error
        } finally {
          setIsLoadingAuth(false);
        }
      } else {
        // User is null (logged out)
        setIsLoadingAuth(false);
      }
    });
    return () => unsubscribe();
  }, [clearPlanAndData, toast]);


  const signupWithEmail = async (email: string, pass: string): Promise<User | null> => {
    setIsLoadingAuth(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      // onAuthStateChanged will handle initial doc creation if needed, and further onboarding steps.
      toast({ title: "Signup Successful", description: "Welcome to GroZen! Please complete your profile setup." });
      return userCredential.user;
    } catch (error: any) {
      console.error("Signup error (signupWithEmail):", error);
      toast({ variant: "destructive", title: "Signup Failed", description: error.message || "Could not create account."});
      setIsLoadingAuth(false);
      return null;
    }
  };

  const signupWithDetails = async (emailVal: string, passwordVal: string, usernameVal: string, avatarDataUri: string): Promise<boolean> => {
    setIsLoadingAuth(true);
    let user: User | null = null;
    try {
      console.log("Attempting signupWithDetails for email:", emailVal, "username:", usernameVal);

      // Step 1: Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, emailVal, passwordVal);
      user = userCredential.user;
      console.log("User created with UID:", user.uid);

      // Step 2: Update Firebase Auth profile (displayName)
      // Note: photoURL in Firebase Auth is usually for actual URLs, not Data URIs.
      // We are storing the Data URI in Firestore's `avatarUrl` field.
      await updateProfile(user, {
        displayName: usernameVal.trim(),
      });
      console.log("Firebase Auth profile updated with displayName:", usernameVal.trim());

      // Step 3: Create username document for availability checking
      const trimmedUsername = usernameVal.trim().toLowerCase();
      const usernameDocRef = doc(db, "usernames", trimmedUsername);
      const usernameData = {
        userId: user.uid, // This is request.resource.data.userId in rules
        email: user.email, // For reference
      };
      console.log("Attempting to set username document:", `/usernames/${trimmedUsername}`, "with data:", usernameData);
      console.log("Authenticated user UID for rule check (request.auth.uid):", user.uid);
      await setDoc(usernameDocRef, usernameData);
      console.log("Username document created successfully.");

      // Step 4: Create/Update main user document in Firestore
      const userDocRef = doc(db, "users", user.uid); // Document ID is user.uid
      const userDocPayload = {
        email: user.email,
        displayName: usernameVal.trim(),
        avatarUrl: avatarDataUri, // This should be a valid Data URI string
        createdAt: serverTimestamp(),
        onboardingData: null,
        wellnessPlan: null,
        currentGroceryList: null,
        activeChallengeProgress: null,
      };
      console.log("Attempting to set user document:", `/users/${user.uid}`, "with payload:", userDocPayload);
      console.log("Authenticated user UID for rule check (request.auth.uid):", user.uid, "Document ID for rule check (userIdFromPath):", user.uid);
      await setDoc(userDocRef, userDocPayload, { merge: true }); // Use merge:true to be safe if a basic doc was already created by onAuthStateChanged
      console.log("User document created/merged successfully.");

      // Update local state (onAuthStateChanged will also run and might fine-tune this)
      setCurrentUserProfile({
        displayName: usernameVal.trim(),
        email: user.email || '',
        avatarUrl: avatarDataUri
      });
      _setIsOnboardedState(false); // New user, needs onboarding

      // setIsLoadingAuth(false); // onAuthStateChanged will set this
      toast({ title: "Signup Complete!", description: "Welcome to GroZen!" });
      return true;

    } catch (error: any) {
      console.error("Detailed Signup error (signupWithDetails):", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      
      // Attempt to clean up Firebase Auth user if Firestore writes failed
      if (user && (error.message.includes("permission") || error.message.includes("Firestore"))) {
        try {
          console.warn("Firestore write failed, attempting to delete created Firebase Auth user:", user.uid);
          await user.delete();
          console.log("Firebase Auth user deleted due to Firestore error during signup.");
        } catch (deleteError: any) {
          console.error("Failed to delete Firebase Auth user after signup failure:", deleteError);
          toast({ variant: "destructive", title: "Critical Signup Error", description: "Account created but profile setup failed. Please contact support." });
        }
      }

      const commonErrorMessages: {[key: string]: string} = {
        'auth/email-already-in-use': "This email address is already in use. Try logging in or use a different email.",
        'firestore/permission-denied': "Could not save your details. Please check app permissions or try again.",
        'FirebaseError: Missing or insufficient permissions.': "A permission error occurred while saving your profile. Please ensure the app has the necessary permissions.",
      };
      const description = commonErrorMessages[error.code] || commonErrorMessages[error.message] || error.message || "An unexpected error occurred during signup.";

      toast({
        variant: "destructive",
        title: "Signup Failed",
        description: description,
        duration: 7000,
      });
      setIsLoadingAuth(false);
      return false;
    }
  };

  const loginWithEmail = async (email: string, pass: string): Promise<User | null> => {
    setIsLoadingAuth(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      toast({ title: "Login Successful", description: "Welcome back!" });
      // onAuthStateChanged will handle loading user data
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
      // onAuthStateChanged will handle the rest, including checking/creating the user doc.
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
      router.push('/login'); // onAuthStateChanged will also clear local state
    } catch (error: any) {
      console.error("Logout error", error);
      toast({ variant: "destructive", title: "Logout Failed", description: error.message || "Could not log out." });
    }
  };

  const updateUserDisplayName = async (newName: string) => {
    if (!currentUser) {
      toast({ variant: "destructive", title: "Not Authenticated" });
      return;
    }
    if (!newName.trim()) {
        toast({ variant: "destructive", title: "Invalid Name", description: "Display name cannot be empty."});
        return;
    }

    const userDocRef = doc(db, "users", currentUser.uid);
    try {
      await updateProfile(auth.currentUser!, { displayName: newName.trim() });
      await updateDoc(userDocRef, { displayName: newName.trim() });
      setCurrentUserProfile(prev => prev ? { ...prev, displayName: newName.trim() } : { displayName: newName.trim(), email: currentUser.email || '', avatarUrl: prev?.avatarUrl });
      toast({ title: "Display Name Updated" });
    } catch (error: any) {
      console.error("Error updating display name:", error);
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
      console.error("Error saving onboarding data:", error);
      toast({ variant: "destructive", title: "Save Error", description: "Could not save preferences." });
    }
  };

  const generatePlan = async (data: OnboardingData) => {
    if (!currentUser) return router.push('/login');
    _setIsLoadingPlan(true);
    _setErrorPlan(null);
    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      // Ensure onboarding data is saved if it changed or wasn't saved before.
      if (JSON.stringify(data) !== JSON.stringify(_onboardingData)) {
        await setDoc(userDocRef, { onboardingData: data, updatedAt: serverTimestamp() }, { merge: true });
        _setOnboardingData(data);
        _setIsOnboardedState(true); // Mark as onboarded since we have the data
      }
      const input: GenerateWellnessPlanInput = data;
      const result = await aiGenerateWellnessPlan(input);
      const parsedPlanCandidate = JSON.parse(result.plan);

      // Validate structure of parsed plan
      if (
        parsedPlanCandidate && Array.isArray(parsedPlanCandidate.meals) && parsedPlanCandidate.meals.length > 0 &&
        parsedPlanCandidate.meals.every((m: any) => typeof m.day === 'string' && typeof m.breakfast === 'string') && // Basic check
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
      console.error("Failed to generate plan:", err);
      _setErrorPlan(err.message);
      toast({ variant: "destructive", title: "Error Generating Plan", description: err.message });
      _setWellnessPlan(null); // Clear potentially bad plan
    } finally {
      _setIsLoadingPlan(false);
    }
  };

  const addMoodLog = async (mood: string, notes?: string, selfieDataUri?: string) => {
    if (!currentUser) return router.push('/login');
    let aiFeedbackText: string | undefined;
    try {
      aiFeedbackText = (await aiProvideMoodFeedback({ mood, notes })).feedback;
    } catch (err) { console.warn("AI mood feedback failed:", err); }

    const newLogData = { mood, notes, selfieDataUri, aiFeedback: aiFeedbackText, createdAt: serverTimestamp(), userId: currentUser.uid };
    try {
      const docRef = await addDoc(collection(db, "users", currentUser.uid, "moodLogs"), newLogData);
      // Optimistically update UI then sort
      _setMoodLogs(prev => [{ ...newLogData, id: docRef.id, date: new Date().toISOString(), createdAt: new Date() } as MoodLog, ...prev]
        .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      toast({ title: "Mood Logged", description: aiFeedbackText ? `GroZen: ${aiFeedbackText}` : "Recorded."});
    } catch (error) {
      console.error("Error saving mood log:", error);
      toast({ variant: "destructive", title: "Save Error" });
    }
  };

  const deleteMoodLog = async (logId: string) => {
    if (!currentUser) return;
    try {
      await deleteDoc(doc(db, "users", currentUser.uid, "moodLogs", logId));
      _setMoodLogs(prev => prev.filter(log => log.id !== logId));
      toast({ title: "Mood Log Deleted" });
    } catch (error) {
      console.error("Error deleting mood log:", error);
      toast({ variant: "destructive", title: "Delete Error" });
    }
  };

  const generateGroceryList = async (currentPlan: WellnessPlan) => {
    if (!currentUser || !currentPlan?.meals?.length) return;
    _setIsLoadingGroceryList(true);
    _setErrorGroceryList(null);
    try {
      const input: GenerateGroceryListInput = { meals: currentPlan.meals as Meal[] };
      const result: GenerateGroceryListOutput = await aiGenerateGroceryList(input);
      const newGroceryList: GroceryList = {
        id: _groceryList?.id || crypto.randomUUID(), // Reuse ID if exists or generate new
        items: result.items.map(item => ({ ...item, id: item.id || crypto.randomUUID() })), // Ensure all items have an ID
        generatedDate: new Date().toISOString(),
      };
      await setDoc(doc(db, "users", currentUser.uid), { currentGroceryList: newGroceryList, updatedAt: serverTimestamp() }, { merge: true });
      _setGroceryList(newGroceryList);
      toast({ title: "Grocery List Generated!" });
    } catch (err: any) {
      console.error("Failed to generate grocery list:", err);
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
    _setGroceryList(updatedGroceryList); // Optimistic update
    try {
      await setDoc(doc(db, "users", currentUser.uid), { currentGroceryList: updatedGroceryList, updatedAt: serverTimestamp() }, { merge: true });
      toast({ title: "Item Deleted" });
    } catch (error) {
      _setGroceryList(_groceryList); // Revert on error
      toast({ variant: "destructive", title: "Update Error" });
    }
  };

  const fetchAllUsers = async (): Promise<UserListItem[]> => {
    if (!isAdminUser) return [];
    try {
      const snap = await getDocs(collection(db, "users"));
      return snap.docs.map(d => ({ id: d.id, email: d.data().email, displayName: d.data().displayName } as UserListItem));
    } catch (error) { console.error(error); return []; }
  };

  const fetchFullUserDetailsForAdmin = async (targetUserId: string): Promise<FullUserDetail | null> => {
     if (!isAdminUser) return null;
    try {
      const userSnap = await getDoc(doc(db, "users", targetUserId));
      if (!userSnap.exists()) return null;
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
      return { ...userData, id: targetUserId, moodLogs: fetchedMoodLogs, groceryList: processedGL } as FullUserDetail;
    } catch (error) { console.error(error); return null; }
  };

  const joinCurrentChallenge = async () => {
    if (!currentUser) return;
    _setIsLoadingUserChallenge(true);
    const newChallenge: UserActiveChallenge = { challengeId: CURRENT_CHALLENGE.id, joinedDate: new Date().toISOString(), completedDates: [], daysCompleted: 0 };
    try {
      await updateDoc(doc(db, "users", currentUser.uid), { activeChallengeProgress: newChallenge });
      _setUserActiveChallenge(newChallenge);
      toast({ title: "Challenge Joined!" });
    } catch (e) { toast({variant: "destructive", title: "Error Joining"});}
    finally { _setIsLoadingUserChallenge(false); }
  };

  const logChallengeDay = async () => {
    if (!currentUser || !_userActiveChallenge) return;
    _setIsLoadingUserChallenge(true);
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    if (_userActiveChallenge.completedDates.includes(todayStr)) {
      toast({ title: "Already Logged Today!" });
      _setIsLoadingUserChallenge(false);
      return;
    }
    const updatedChallenge = { ..._userActiveChallenge, completedDates: [..._userActiveChallenge.completedDates, todayStr], daysCompleted: _userActiveChallenge.daysCompleted + 1 };
    try {
      await updateDoc(doc(db, "users", currentUser.uid), { activeChallengeProgress: updatedChallenge });
      _setUserActiveChallenge(updatedChallenge);
      toast({ title: "Day Logged!" });
    } catch (e) { toast({variant: "destructive", title: "Error Logging"});}
    finally { _setIsLoadingUserChallenge(false); }
  };

  const fetchLeaderboardData = async (): Promise<LeaderboardEntry[]> => {
    if (!currentUser) return []; // Basic check, rules will enforce further.
    try {
      // Query needs to be allowed by Firestore rules.
      // Assumes 'activeChallengeProgress.challengeId' and 'activeChallengeProgress.daysCompleted' fields exist.
      const q = query(
        collection(db, "users"), 
        where("activeChallengeProgress.challengeId", "==", CURRENT_CHALLENGE.id), 
        orderBy("activeChallengeProgress.daysCompleted", "desc"), 
        limit(10)
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ 
        id: d.id, 
        email: d.data().email, 
        displayName: d.data().displayName, 
        daysCompleted: d.data().activeChallengeProgress.daysCompleted 
      } as LeaderboardEntry));
    } catch (e) { console.error("Error fetching leaderboard data:", e); return []; }
  };

  const isPlanAvailable = !!_wellnessPlan?.meals?.length;

  const providerValue = {
      currentUser, isAdminUser, isLoadingAuth, currentUserProfile,
      signupWithEmail, signupWithDetails, loginWithEmail, signInWithGoogle, logoutUser, updateUserDisplayName,
      onboardingData: _onboardingData, wellnessPlan: _wellnessPlan, isLoadingPlan: _isLoadingPlan, errorPlan: _errorPlan, generatePlan, clearPlanAndData,
      isPlanAvailable, isOnboardedState: _isOnboardedState, completeOnboarding,
      moodLogs: _moodLogs, addMoodLog, deleteMoodLog,
      groceryList: _groceryList, isLoadingGroceryList: _isLoadingGroceryList, errorGroceryList: _errorGroceryList, generateGroceryList, deleteGroceryItem,
      fetchAllUsers, fetchFullUserDetailsForAdmin,
      userActiveChallenge: _userActiveChallenge, isLoadingUserChallenge: _isLoadingUserChallenge, joinCurrentChallenge, logChallengeDay,
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
  if (context === undefined) throw new Error('usePlan must be used within a PlanProvider');
  return context;
};

// Extended UserProfile type to ensure avatarUrl is part of it for consistency
declare module '@/types/wellness' {
  interface UserProfile {
    avatarUrl?: string;
  }
}


"use client";

import type { WellnessPlan, OnboardingData, MoodLog, GroceryList, GroceryItem, Meal } from '@/types/wellness';
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { generateWellnessPlan as aiGenerateWellnessPlan, type GenerateWellnessPlanInput } from '@/ai/flows/generate-wellness-plan';
import { provideMoodFeedback as aiProvideMoodFeedback, type ProvideMoodFeedbackInput } from '@/ai/flows/provide-mood-feedback';
import { generateGroceryList as aiGenerateGroceryList, type GenerateGroceryListInput, type GenerateGroceryListOutput } from '@/ai/flows/generate-grocery-list';
import { useToast } from "@/hooks/use-toast";

interface PlanContextType {
  onboardingData: OnboardingData;
  setOnboardingData: React.Dispatch<React.SetStateAction<OnboardingData>>;
  wellnessPlan: WellnessPlan | null;
  isLoadingPlan: boolean;
  errorPlan: string | null;
  generatePlan: (data: OnboardingData) => Promise<void>;
  clearPlan: () => void;
  isPlanAvailable: boolean;
  isOnboarded: boolean;
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
  const [onboardingData, setOnboardingData] = useState<OnboardingData>(defaultOnboardingData);
  const [wellnessPlan, setWellnessPlan] = useState<WellnessPlan | null>(null);
  const [isLoadingPlan, setIsLoadingPlan] = useState(false);
  const [errorPlan, setErrorPlan] = useState<string | null>(null);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [moodLogs, setMoodLogs] = useState<MoodLog[]>([]);
  const [groceryList, setGroceryList] = useState<GroceryList | null>(null);
  const [isLoadingGroceryList, setIsLoadingGroceryList] = useState(false);
  const [errorGroceryList, setErrorGroceryList] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Load state from localStorage on mount
    const storedOnboardingData = localStorage.getItem('grozen_onboardingData');
    if (storedOnboardingData) {
      setOnboardingData(JSON.parse(storedOnboardingData));
      setIsOnboarded(true); 
    }
    const storedWellnessPlan = localStorage.getItem('grozen_wellnessPlan');
    if (storedWellnessPlan) {
      try {
        const parsedPlan = JSON.parse(storedWellnessPlan);
        // Basic validation for plan loaded from localStorage
        if (parsedPlan && Array.isArray(parsedPlan.meals) && Array.isArray(parsedPlan.exercise) && Array.isArray(parsedPlan.mindfulness)) {
          setWellnessPlan(parsedPlan);
        } else {
          localStorage.removeItem('grozen_wellnessPlan'); // Clear invalid stored plan
        }
      } catch (e) {
        console.error("Failed to parse stored wellness plan:", e);
        localStorage.removeItem('grozen_wellnessPlan');
      }
    }
    const storedMoodLogs = localStorage.getItem('grozen_moodLogs');
    if (storedMoodLogs) {
       try {
        setMoodLogs(JSON.parse(storedMoodLogs));
      } catch (e) {
        console.error("Failed to parse stored mood logs:", e);
        localStorage.removeItem('grozen_moodLogs');
      }
    }
    const storedGroceryList = localStorage.getItem('grozen_groceryList');
    if (storedGroceryList) {
      try {
        setGroceryList(JSON.parse(storedGroceryList));
      } catch (e) {
        console.error("Failed to parse stored grocery list:", e);
        localStorage.removeItem('grozen_groceryList');
      }
    }
  }, []);

  const completeOnboarding = (data: OnboardingData) => {
    setOnboardingData(data);
    setIsOnboarded(true);
    localStorage.setItem('grozen_onboardingData', JSON.stringify(data));
  };

  const generatePlan = async (data: OnboardingData) => {
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
        return; // Exit if JSON parsing fails
      }

      // Validate the structure, especially ensuring meals array is present and non-empty
      if (
        parsedPlanCandidate &&
        typeof parsedPlanCandidate === 'object' &&
        Array.isArray(parsedPlanCandidate.meals) && parsedPlanCandidate.meals.length > 0 &&
        Array.isArray(parsedPlanCandidate.exercise) && // Ensure other parts are at least arrays
        Array.isArray(parsedPlanCandidate.mindfulness)
      ) {
        const planToSet = parsedPlanCandidate as WellnessPlan;
        setWellnessPlan(planToSet);
        localStorage.setItem('grozen_wellnessPlan', JSON.stringify(planToSet));
        toast({ title: "Success", description: "Your personalized wellness plan has been generated!" });
      } else {
        console.error("Generated plan is incomplete or malformed. Parsed plan:", parsedPlanCandidate, "Raw plan string:", result.plan);
        // Do not update wellnessPlan if the new one is faulty, keep the old one (if any) or null.
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
    setMoodLogs(prevLogs => {
      const updatedLogs = [newLog, ...prevLogs];
      localStorage.setItem('grozen_moodLogs', JSON.stringify(updatedLogs));
      return updatedLogs;
    });
    toast({ 
      title: "Mood Logged", 
      description: `Your mood has been recorded. ${aiFeedbackText ? "Here's a thought: " + aiFeedbackText : ""}` 
    });
  };

  const generateGroceryList = async (currentPlan: WellnessPlan) => {
    if (!currentPlan || !currentPlan.meals || currentPlan.meals.length === 0) {
      toast({ variant: "destructive", title: "Error", description: "Cannot generate grocery list without a meal plan." });
      return;
    }
    setIsLoadingGroceryList(true);
    setErrorGroceryList(null);
    try {
      const input: GenerateGroceryListInput = { 
        meals: currentPlan.meals.map(meal => ({ // Ensure only known Meal properties are passed
          day: meal.day,
          breakfast: meal.breakfast,
          lunch: meal.lunch,
          dinner: meal.dinner,
        })) as Meal[] // Explicitly type assertion for Genkit flow input
      };
      const result: GenerateGroceryListOutput = await aiGenerateGroceryList(input);
      
      const newGroceryList: GroceryList = {
        id: crypto.randomUUID(),
        items: result.items,
        generatedDate: new Date().toISOString(),
      };
      setGroceryList(newGroceryList);
      localStorage.setItem('grozen_groceryList', JSON.stringify(newGroceryList));
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

  const clearPlan = () => {
    setWellnessPlan(null);
    setOnboardingData(defaultOnboardingData);
    setIsOnboarded(false);
    setMoodLogs([]);
    setGroceryList(null);
    localStorage.removeItem('grozen_wellnessPlan');
    localStorage.removeItem('grozen_onboardingData');
    localStorage.removeItem('grozen_moodLogs');
    localStorage.removeItem('grozen_groceryList');
  };

  const isPlanAvailable = !!wellnessPlan && Array.isArray(wellnessPlan.meals) && wellnessPlan.meals.length > 0;


  return (
    <PlanContext.Provider value={{ 
      onboardingData, 
      setOnboardingData, 
      wellnessPlan, 
      isLoadingPlan, 
      errorPlan, 
      generatePlan, 
      clearPlan,
      isPlanAvailable,
      isOnboarded,
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



"use client";

import type { WellnessPlan, OnboardingData, MoodLog, GroceryList, GroceryItem } from '@/types/wellness';
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
      setWellnessPlan(JSON.parse(storedWellnessPlan));
    }
    const storedMoodLogs = localStorage.getItem('grozen_moodLogs');
    if (storedMoodLogs) {
      setMoodLogs(JSON.parse(storedMoodLogs));
    }
    const storedGroceryList = localStorage.getItem('grozen_groceryList');
    if (storedGroceryList) {
      setGroceryList(JSON.parse(storedGroceryList));
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
      const parsedPlan = JSON.parse(result.plan) as WellnessPlan;
      setWellnessPlan(parsedPlan);
      localStorage.setItem('grozen_wellnessPlan', JSON.stringify(parsedPlan));
      toast({ title: "Success", description: "Your personalized wellness plan has been generated!" });
    } catch (err) {
      console.error("Failed to generate plan:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setErrorPlan(errorMessage);
      toast({ variant: "destructive", title: "Error", description: `Failed to generate plan: ${errorMessage}` });
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
      const input: GenerateGroceryListInput = { meals: currentPlan.meals };
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

  const isPlanAvailable = !!wellnessPlan;

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

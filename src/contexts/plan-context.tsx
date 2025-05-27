"use client";

import type { WellnessPlan, OnboardingData } from '@/types/wellness';
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { generateWellnessPlan as aiGenerateWellnessPlan, type GenerateWellnessPlanInput } from '@/ai/flows/generate-wellness-plan';
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

  const clearPlan = () => {
    setWellnessPlan(null);
    setOnboardingData(defaultOnboardingData);
    setIsOnboarded(false);
    localStorage.removeItem('grozen_wellnessPlan');
    localStorage.removeItem('grozen_onboardingData');
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
      completeOnboarding
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

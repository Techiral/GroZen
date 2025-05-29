
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, FormProvider, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label'; 
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Logo from '@/components/logo';
import { usePlan } from '@/contexts/plan-context';
import type { OnboardingData } from '@/types/wellness';
import { Loader2 } from 'lucide-react';

const onboardingSchema = z.object({
  goals: z.string().min(10, "Please describe your goals in a bit more detail (min. 10 characters).").max(500),
  dietPreferences: z.string().min(3, "Please specify your diet preferences (min. 3 characters).").max(500),
  budget: z.enum(["low", "medium", "high"], { required_error: "Please select your budget." }),
});

type OnboardingFormValues = z.infer<typeof onboardingSchema>;

const steps = [
  { id: 'goals', title: 'Your Wellness Goals', description: "What are you hoping to achieve?" },
  { id: 'diet', title: 'Dietary Preferences', description: "Any specific dietary needs or preferences?" },
  { id: 'budget', title: 'Your Budget', description: "What's your approximate weekly budget?" },
  { id: 'summary', title: 'Summary & Generate', description: "Review your info and generate your plan!" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { 
    currentUser, 
    isLoadingAuth, 
    completeOnboarding, 
    generatePlan, 
    isLoadingPlan, 
    onboardingData: initialData,
    isPlanAvailable 
  } = usePlan();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      goals: initialData?.goals || '',
      dietPreferences: initialData?.dietPreferences || '',
      budget: initialData?.budget as "low" | "medium" | "high" || undefined,
    },
    resetOptions: {
      keepDirtyValues: false, 
    },
  });

  useEffect(() => {
    if (initialData) {
        form.reset({
            goals: initialData.goals || '',
            dietPreferences: initialData.dietPreferences || '',
            budget: initialData.budget as "low" | "medium" | "high" || undefined,
        });
    }
  }, [initialData, form]);


  useEffect(() => {
    if (!isLoadingAuth) {
      if (!currentUser) {
        router.replace('/login');
      } else if (isPlanAvailable && currentStep !== steps.length -1) { // Allow reaching summary step even if plan exists if user came via "New Plan"
         // If user has a plan and lands here NOT on summary (e.g. direct navigation), redirect.
         // If they came via "New Plan" button, they'd already be on step 0 or progressing.
      }
    }
  }, [currentUser, isLoadingAuth, isPlanAvailable, router, currentStep]);


  const { control, handleSubmit, trigger, getValues } = form;

  const handleNext = async () => {
    let isValid = false;
    if (currentStep === 0) isValid = await trigger("goals");
    else if (currentStep === 1) isValid = await trigger("dietPreferences");
    else if (currentStep === 2) isValid = await trigger("budget");
    else isValid = true; 

    if (isValid && currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit: SubmitHandler<OnboardingFormValues> = async (data) => {
    if (!currentUser) {
        router.push('/login'); 
        return;
    }
    setIsSubmitting(true);
    try {
      const fullData: OnboardingData = { ...data };
      await completeOnboarding(fullData); 
      await generatePlan(fullData); 
      router.push('/dashboard');
    } catch (error) {
      console.error("Onboarding submission error:", error);
      // Toast for error already handled in context functions
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoadingAuth || (!isLoadingAuth && !currentUser)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Logo size="text-2xl sm:text-3xl" />
        <Loader2 className="mt-4 h-6 w-8 animate-spin text-primary" />
        <p className="mt-2 text-xs sm:text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-3 sm:p-4">
      <Card className="w-full max-w-sm sm:max-w-md neumorphic shadow-lg">
        <CardHeader className="text-center px-4 pt-4 pb-3 sm:px-6 sm:pt-5 sm:pb-4">
          <div className="mx-auto mb-2 sm:mb-3">
            <Logo size="text-lg sm:text-xl" />
          </div>
          <CardTitle className="text-base sm:text-lg">{steps[currentStep].title}</CardTitle>
          <CardDescription className="text-2xs sm:text-xs">{steps[currentStep].description}</CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-4 sm:px-6 sm:pb-5">
          <FormProvider {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4">
              {currentStep === 0 && (
                <FormField
                  control={control}
                  name="goals"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm">Goals</FormLabel>
                      <FormControl>
                        <Textarea placeholder="e.g., lose weight, gain energy, build muscle" {...field} className="min-h-[50px] sm:min-h-[60px] neumorphic-inset-sm text-xs sm:text-sm" />
                      </FormControl>
                      <FormMessage className="text-2xs sm:text-xs"/>
                    </FormItem>
                  )}
                />
              )}
              {currentStep === 1 && (
                <FormField
                  control={control}
                  name="dietPreferences"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm">Dietary Preferences</FormLabel>
                      <FormControl>
                        <Textarea placeholder="e.g., vegetarian, gluten-free, allergies to nuts" {...field} className="min-h-[50px] sm:min-h-[60px] neumorphic-inset-sm text-xs sm:text-sm" />
                      </FormControl>
                      <FormMessage className="text-2xs sm:text-xs"/>
                    </FormItem>
                  )}
                />
              )}
              {currentStep === 2 && (
                <FormField
                  control={control}
                  name="budget"
                  render={({ field }) => (
                    <FormItem className="space-y-1 sm:space-y-1.5">
                      <FormLabel className="text-xs sm:text-sm">Weekly Budget</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1 sm:space-y-1.5"
                        >
                          {['low', 'medium', 'high'].map(value => (
                            <FormItem key={value} className="flex items-center space-x-2 p-1.5 sm:p-2 neumorphic-sm hover:neumorphic-inset-sm">
                              <FormControl>
                                <RadioGroupItem value={value} />
                              </FormControl>
                              <FormLabel className="font-normal capitalize text-2xs sm:text-xs">
                                {value}
                              </FormLabel>
                            </FormItem>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage className="text-2xs sm:text-xs"/>
                    </FormItem>
                  )}
                />
              )}
              {currentStep === 3 && (
                <div className="space-y-1 p-2 sm:p-2.5 neumorphic-sm rounded-md">
                  <h4 className="font-semibold text-xs sm:text-sm mb-0.5">Review Your Information:</h4>
                  <p className="text-2xs sm:text-xs break-words"><strong>Goals:</strong> {getValues("goals")}</p>
                  <p className="text-2xs sm:text-xs break-words"><strong>Diet:</strong> {getValues("dietPreferences")}</p>
                  <p className="text-2xs sm:text-xs"><strong>Budget:</strong> <span className="capitalize">{getValues("budget")}</span></p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-between pt-1.5 sm:pt-2 gap-2 sm:gap-3">
                {currentStep > 0 && (
                  <Button type="button" variant="outline" onClick={handlePrev} className="neumorphic-button w-full sm:w-auto text-2xs sm:text-xs px-2 py-1 sm:px-3 sm:py-1.5 h-8 sm:h-9">
                    Previous
                  </Button>
                )}
                {currentStep === 0 && <div className="hidden sm:block sm:flex-grow"></div>} 
                {currentStep < steps.length - 1 && (
                  <Button type="button" variant="neumorphic-primary" onClick={handleNext} className="w-full sm:w-auto text-2xs sm:text-xs px-2 py-1 sm:px-3 sm:py-1.5 h-8 sm:h-9">
                    Next
                  </Button>
                )}
                {currentStep === steps.length - 1 && (
                  <Button type="submit" variant="neumorphic-primary" disabled={isLoadingPlan || isSubmitting} className="w-full sm:w-auto text-2xs sm:text-xs px-2 py-1 sm:px-3 sm:py-1.5 h-8 sm:h-9">
                    {(isLoadingPlan || isSubmitting) ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
                    Generate My Plan
                  </Button>
                )}
              </div>
            </form>
          </FormProvider>
          <div className="flex justify-center mt-3 sm:mt-4 space-x-1 sm:space-x-1.5">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-1 sm:h-1.5 w-3 sm:w-4 rounded-full ${currentStep >= index ? 'bg-primary' : 'bg-muted'}`}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

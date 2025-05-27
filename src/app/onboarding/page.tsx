
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
    onboardingData: initialData, // This is the onboardingData from context
    isPlanAvailable 
  } = usePlan();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    // Use initialData from context to pre-fill form
    defaultValues: {
      goals: initialData?.goals || '',
      dietPreferences: initialData?.dietPreferences || '',
      budget: initialData?.budget as "low" | "medium" | "high" || undefined,
    },
    // Reset form if initialData changes (e.g., after login)
    resetOptions: {
      keepDirtyValues: false, // discard dirty fields and let new values apply
    },
  });

  useEffect(() => {
    // Reset form with initialData from context when it changes (e.g. after login)
    // This is important if the user lands here, logs in, and then context provides their saved data
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
      } else if (isPlanAvailable) {
        // If user is logged in and already has a plan (and they somehow land here), redirect to dashboard
        router.replace('/dashboard');
      }
    }
  }, [currentUser, isLoadingAuth, isPlanAvailable, router]);


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
      await completeOnboarding(fullData); // Saves onboarding data to Firestore
      await generatePlan(fullData); // Generates plan and saves to Firestore
      router.push('/dashboard');
    } catch (error) {
      console.error("Onboarding submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoadingAuth || (!isLoadingAuth && !currentUser) || (!isLoadingAuth && currentUser && isPlanAvailable && router.pathname === '/onboarding')) {
    // Show loader if auth is loading, or if user is not logged in (redirect to login will happen),
    // or if user is logged in and has a plan (redirect to dashboard will happen)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Logo size="text-3xl sm:text-4xl" />
        <Loader2 className="mt-4 h-8 w-8 animate-spin text-primary" />
        <p className="mt-2 text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-3 sm:p-4 md:p-6">
      <Card className="w-full max-w-md sm:max-w-lg neumorphic shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 sm:mb-4">
            <Logo size="text-xl sm:text-2xl" />
          </div>
          <CardTitle className="text-md sm:text-lg md:text-xl">{steps[currentStep].title}</CardTitle>
          <CardDescription className="text-2xs sm:text-xs">{steps[currentStep].description}</CardDescription>
        </CardHeader>
        <CardContent>
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
                        <Textarea placeholder="e.g., lose weight, gain energy, build muscle" {...field} className="min-h-[60px] sm:min-h-[70px] neumorphic-inset-sm text-xs sm:text-sm" />
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
                        <Textarea placeholder="e.g., vegetarian, gluten-free, allergies to nuts" {...field} className="min-h-[60px] sm:min-h-[70px] neumorphic-inset-sm text-xs sm:text-sm" />
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
                    <FormItem className="space-y-1.5 sm:space-y-2">
                      <FormLabel className="text-xs sm:text-sm">Weekly Budget</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1 sm:space-y-1.5"
                        >
                          {['low', 'medium', 'high'].map(value => (
                            <FormItem key={value} className="flex items-center space-x-2 sm:space-x-2.5 p-2 sm:p-2 neumorphic-sm hover:neumorphic-inset-sm">
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
                <div className="space-y-1.5 sm:space-y-2 p-2 sm:p-2.5 neumorphic-sm rounded-md">
                  <h4 className="font-semibold text-xs sm:text-sm mb-1">Review Your Information:</h4>
                  <p className="text-2xs sm:text-xs break-words"><strong>Goals:</strong> {getValues("goals")}</p>
                  <p className="text-2xs sm:text-xs break-words"><strong>Diet:</strong> {getValues("dietPreferences")}</p>
                  <p className="text-2xs sm:text-xs"><strong>Budget:</strong> <span className="capitalize">{getValues("budget")}</span></p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-between pt-2 sm:pt-3 gap-2 sm:gap-0">
                {currentStep > 0 && (
                  <Button type="button" variant="outline" onClick={handlePrev} className="neumorphic-button w-full sm:w-auto text-2xs sm:text-xs px-2.5 py-1 sm:px-3 sm:py-1.5">
                    Previous
                  </Button>
                )}
                {currentStep === 0 && <div className="hidden sm:block sm:flex-grow"></div>} {/* Spacer for alignment */}
                {currentStep < steps.length - 1 && (
                  <Button type="button" variant="neumorphic-primary" onClick={handleNext} className="w-full sm:w-auto text-2xs sm:text-xs px-2.5 py-1 sm:px-3 sm:py-1.5">
                    Next
                  </Button>
                )}
                {currentStep === steps.length - 1 && (
                  <Button type="submit" variant="neumorphic-primary" disabled={isLoadingPlan || isSubmitting} className="w-full sm:w-auto text-2xs sm:text-xs px-2.5 py-1 sm:px-3 sm:py-1.5">
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
                className={`h-1.5 w-4 sm:w-5 rounded-full ${currentStep >= index ? 'bg-primary' : 'bg-muted'}`}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

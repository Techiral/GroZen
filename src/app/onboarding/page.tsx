
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, FormProvider, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; // Input not used, but keep for potential future
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
  const { completeOnboarding, generatePlan, isLoadingPlan, onboardingData: initialData } = usePlan();
  const [currentStep, setCurrentStep] = useState(0);

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      goals: initialData.goals || '',
      dietPreferences: initialData.dietPreferences || '',
      budget: initialData.budget as "low" | "medium" | "high" || undefined,
    },
  });

  const { control, handleSubmit, trigger, getValues } = form;

  const handleNext = async () => {
    let isValid = false;
    if (currentStep === 0) isValid = await trigger("goals");
    else if (currentStep === 1) isValid = await trigger("dietPreferences");
    else if (currentStep === 2) isValid = await trigger("budget");
    else isValid = true; // Summary step

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
    const fullData: OnboardingData = { ...data };
    completeOnboarding(fullData);
    await generatePlan(fullData);
    router.push('/dashboard');
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-3 sm:p-4 md:p-6">
      <Card className="w-full max-w-md sm:max-w-lg neumorphic shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 sm:mb-4">
            <Logo size="text-xl sm:text-2xl md:text-3xl" />
          </div>
          <CardTitle className="text-lg sm:text-xl md:text-2xl">{steps[currentStep].title}</CardTitle>
          <CardDescription className="text-xs sm:text-sm">{steps[currentStep].description}</CardDescription>
        </CardHeader>
        <CardContent>
          <FormProvider {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
              {currentStep === 0 && (
                <FormField
                  control={control}
                  name="goals"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm">Goals</FormLabel>
                      <FormControl>
                        <Textarea placeholder="e.g., lose weight, gain energy, build muscle" {...field} className="min-h-[70px] sm:min-h-[80px] neumorphic-inset-sm text-xs sm:text-sm" />
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
                        <Textarea placeholder="e.g., vegetarian, gluten-free, allergies to nuts" {...field} className="min-h-[70px] sm:min-h-[80px] neumorphic-inset-sm text-xs sm:text-sm" />
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
                    <FormItem className="space-y-2 sm:space-y-3">
                      <FormLabel className="text-xs sm:text-sm">Weekly Budget</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1.5 sm:space-y-2"
                        >
                          {['low', 'medium', 'high'].map(value => (
                            <FormItem key={value} className="flex items-center space-x-2 sm:space-x-3 space-y-0 p-2 sm:p-2.5 neumorphic-sm hover:neumorphic-inset-sm">
                              <FormControl>
                                <RadioGroupItem value={value} />
                              </FormControl>
                              <FormLabel className="font-normal capitalize text-xs sm:text-sm">
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
                <div className="space-y-2 sm:space-y-3 p-2.5 sm:p-3 neumorphic-sm rounded-md">
                  <h4 className="font-semibold text-sm sm:text-md mb-1.5">Review Your Information:</h4>
                  <p className="text-xs sm:text-sm break-words"><strong>Goals:</strong> {getValues("goals")}</p>
                  <p className="text-xs sm:text-sm break-words"><strong>Diet:</strong> {getValues("dietPreferences")}</p>
                  <p className="text-xs sm:text-sm"><strong>Budget:</strong> <span className="capitalize">{getValues("budget")}</span></p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-between pt-3 gap-2 sm:gap-3">
                {currentStep > 0 && (
                  <Button type="button" variant="outline" onClick={handlePrev} className="neumorphic-button w-full sm:w-auto text-xs sm:text-sm px-3 py-1.5">
                    Previous
                  </Button>
                )}
                 {/* Spacer to push next/submit to the right if no prev button */}
                {currentStep === 0 && <div className="sm:flex-grow"></div>}
                {currentStep < steps.length - 1 && (
                  <Button type="button" variant="neumorphic-primary" onClick={handleNext} className="w-full sm:w-auto text-xs sm:text-sm px-3 py-1.5">
                    Next
                  </Button>
                )}
                {currentStep === steps.length - 1 && (
                  <Button type="submit" variant="neumorphic-primary" disabled={isLoadingPlan} className="w-full sm:w-auto text-xs sm:text-sm px-3 py-1.5">
                    {isLoadingPlan ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> : null}
                    Generate My Plan
                  </Button>
                )}
              </div>
            </form>
          </FormProvider>
          {/* Progress Indicator */}
          <div className="flex justify-center mt-4 sm:mt-5 space-x-1.5 sm:space-x-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 w-5 sm:w-6 rounded-full ${currentStep >= index ? 'bg-primary' : 'bg-muted'}`}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

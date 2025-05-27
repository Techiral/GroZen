
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, FormProvider, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
    <main className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-6 md:p-8">
      <Card className="w-full max-w-md sm:max-w-lg neumorphic shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <Logo size="text-2xl sm:text-3xl" />
          </div>
          <CardTitle className="text-xl sm:text-2xl">{steps[currentStep].title}</CardTitle>
          <CardDescription className="text-sm sm:text-base">{steps[currentStep].description}</CardDescription>
        </CardHeader>
        <CardContent>
          <FormProvider {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {currentStep === 0 && (
                <FormField
                  control={control}
                  name="goals"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm sm:text-base">Goals</FormLabel>
                      <FormControl>
                        <Textarea placeholder="e.g., lose weight, gain energy, build muscle" {...field} className="min-h-[80px] sm:min-h-[100px] neumorphic-inset-sm text-sm sm:text-base" />
                      </FormControl>
                      <FormMessage className="text-xs sm:text-sm"/>
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
                      <FormLabel className="text-sm sm:text-base">Dietary Preferences</FormLabel>
                      <FormControl>
                        <Textarea placeholder="e.g., vegetarian, gluten-free, allergies to nuts" {...field} className="min-h-[80px] sm:min-h-[100px] neumorphic-inset-sm text-sm sm:text-base" />
                      </FormControl>
                      <FormMessage className="text-xs sm:text-sm"/>
                    </FormItem>
                  )}
                />
              )}
              {currentStep === 2 && (
                <FormField
                  control={control}
                  name="budget"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-sm sm:text-base">Weekly Budget</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-2"
                        >
                          {['low', 'medium', 'high'].map(value => (
                            <FormItem key={value} className="flex items-center space-x-3 space-y-0 p-2 sm:p-3 neumorphic-sm hover:neumorphic-inset-sm">
                              <FormControl>
                                <RadioGroupItem value={value} />
                              </FormControl>
                              <FormLabel className="font-normal capitalize text-sm sm:text-base">
                                {value}
                              </FormLabel>
                            </FormItem>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage className="text-xs sm:text-sm"/>
                    </FormItem>
                  )}
                />
              )}
              {currentStep === 3 && (
                <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 neumorphic-sm rounded-md">
                  <h4 className="font-semibold text-md sm:text-lg mb-2">Review Your Information:</h4>
                  <p className="text-sm sm:text-base"><strong>Goals:</strong> {getValues("goals")}</p>
                  <p className="text-sm sm:text-base"><strong>Diet:</strong> {getValues("dietPreferences")}</p>
                  <p className="text-sm sm:text-base"><strong>Budget:</strong> <span className="capitalize">{getValues("budget")}</span></p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-between pt-4 gap-3 sm:gap-0">
                {currentStep > 0 && (
                  <Button type="button" variant="outline" onClick={handlePrev} className="neumorphic-button w-full sm:w-auto text-sm sm:text-base">
                    Previous
                  </Button>
                )}
                {currentStep < steps.length - 1 && (
                  <Button type="button" variant="neumorphic-primary" onClick={handleNext} className="sm:ml-auto w-full sm:w-auto text-sm sm:text-base">
                    Next
                  </Button>
                )}
                {currentStep === steps.length - 1 && (
                  <Button type="submit" variant="neumorphic-primary" disabled={isLoadingPlan} className="sm:ml-auto w-full sm:w-auto text-sm sm:text-base">
                    {isLoadingPlan ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Generate My Plan
                  </Button>
                )}
              </div>
            </form>
          </FormProvider>
          {/* Progress Indicator */}
          <div className="flex justify-center mt-6 space-x-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-6 sm:w-8 rounded-full ${currentStep >= index ? 'bg-primary' : 'bg-muted'}`}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

    
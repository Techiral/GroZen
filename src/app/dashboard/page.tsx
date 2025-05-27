"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePlan } from '@/contexts/plan-context';
import Logo from '@/components/logo';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import type { Meal, Exercise, Mindfulness } from '@/types/wellness';
import { Utensils, Dumbbell, Brain, CalendarDays, RotateCcw } from 'lucide-react';

const SectionCard: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; itemsCount: number }> = ({ title, icon, children, itemsCount }) => (
  <Card className="neumorphic w-full mb-6">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-xl font-medium flex items-center gap-2">
        {icon} {title}
      </CardTitle>
      <span className="text-sm text-muted-foreground">{itemsCount} items</span>
    </CardHeader>
    <CardContent>
      {children}
    </CardContent>
  </Card>
);

const ItemCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={cn("neumorphic-sm p-4 rounded-md min-w-[250px] snap-start", className)}>
    {children}
  </div>
);

export default function DashboardPage() {
  const router = useRouter();
  const { wellnessPlan, isOnboarded, clearPlan, isLoadingPlan } = usePlan();

  useEffect(() => {
    if (!isLoadingPlan && !isOnboarded) {
      router.push('/onboarding');
    } else if (!isLoadingPlan && isOnboarded && !wellnessPlan) {
      // This case might mean onboarding is done, but plan generation failed or wasn't triggered
      // For now, let's assume plan generation is part of onboarding flow before redirecting here
      // Or, if plan generation can be re-triggered, add a button.
      // For now, if no plan and onboarded, means something went wrong, redirect to retry.
      router.push('/onboarding');
    }
  }, [wellnessPlan, isOnboarded, isLoadingPlan, router]);

  if (isLoadingPlan) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
        <Logo size="text-4xl" />
        <p className="mt-4 text-xl">Generating your personalized plan...</p>
        <RotateCcw className="mt-4 h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!wellnessPlan) {
     return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
        <Logo size="text-4xl" />
        <p className="mt-4 text-xl">No wellness plan found.</p>
        <Button variant="neumorphic-primary" onClick={() => router.push('/onboarding')} className="mt-4">
          Create a Plan
        </Button>
      </div>
    );
  }
  
  // For "Daily Dashboard", we might filter by current day.
  // For simplicity, showing all planned items for now.
  // const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  return (
    <main className="container mx-auto p-4 sm:p-8">
      <header className="flex flex-col sm:flex-row justify-between items-center mb-8">
        <Logo size="text-4xl" />
        <Button variant="outline" onClick={() => { clearPlan(); router.push('/'); }} className="mt-4 sm:mt-0 neumorphic-button">
          Start Over
        </Button>
      </header>

      <div className="mb-6 p-4 neumorphic rounded-lg">
        <h2 className="text-2xl font-bold text-foreground">Your GroZen Wellness Plan</h2>
        <p className="text-muted-foreground">Here's your personalized guide to a healthier you. Stay consistent!</p>
      </div>

      <SectionCard title="Meals" icon={<Utensils className="h-6 w-6 text-accent" />} itemsCount={wellnessPlan.meals.length}>
        <ScrollArea className="w-full whitespace-nowrap rounded-md">
          <div className="flex space-x-4 pb-4">
            {wellnessPlan.meals.map((meal: Meal, index: number) => (
              <ItemCard key={`meal-${index}`} className="bg-card">
                <h4 className="font-semibold text-lg mb-1 flex items-center gap-2"><CalendarDays size={18}/> {meal.day}</h4>
                <p className="text-sm"><strong>Breakfast:</strong> {meal.breakfast}</p>
                <p className="text-sm"><strong>Lunch:</strong> {meal.lunch}</p>
                <p className="text-sm"><strong>Dinner:</strong> {meal.dinner}</p>
              </ItemCard>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </SectionCard>

      <SectionCard title="Exercise Routine" icon={<Dumbbell className="h-6 w-6 text-accent" />} itemsCount={wellnessPlan.exercise.length}>
         <ScrollArea className="w-full whitespace-nowrap rounded-md">
          <div className="flex space-x-4 pb-4">
            {wellnessPlan.exercise.map((ex: Exercise, index: number) => (
              <ItemCard key={`ex-${index}`} className="bg-card">
                <h4 className="font-semibold text-lg mb-1 flex items-center gap-2"><CalendarDays size={18}/> {ex.day}</h4>
                <p className="text-sm"><strong>Activity:</strong> {ex.activity}</p>
                <p className="text-sm"><strong>Duration:</strong> {ex.duration}</p>
              </ItemCard>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </SectionCard>

      <SectionCard title="Mindfulness Practices" icon={<Brain className="h-6 w-6 text-accent" />} itemsCount={wellnessPlan.mindfulness.length}>
        <ScrollArea className="w-full whitespace-nowrap rounded-md">
          <div className="flex space-x-4 pb-4">
            {wellnessPlan.mindfulness.map((mind: Mindfulness, index: number) => (
              <ItemCard key={`mind-${index}`} className="bg-card">
                <h4 className="font-semibold text-lg mb-1 flex items-center gap-2"><CalendarDays size={18}/> {mind.day}</h4>
                <p className="text-sm"><strong>Practice:</strong> {mind.practice}</p>
                <p className="text-sm"><strong>Duration:</strong> {mind.duration}</p>
              </ItemCard>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </SectionCard>
      
      {/* Placeholder for Mood Log - Future Feature */}
      <Card className="neumorphic w-full mt-8">
        <CardHeader>
          <CardTitle className="text-xl font-medium flex items-center gap-2">Mood Check-in</CardTitle>
          <CardDescription>How are you feeling today? (Feature coming soon)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            {["😊", "🙂", "😐", "😕", "😞"].map(mood => (
              <Button key={mood} variant="outline" size="icon" className="text-2xl neumorphic-button h-14 w-14" disabled>
                {mood}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

    </main>
  );
}

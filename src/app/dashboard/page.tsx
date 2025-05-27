
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePlan } from '@/contexts/plan-context';
import Logo from '@/components/logo';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import type { Meal, Exercise, Mindfulness, MoodLog } from '@/types/wellness';
import { Utensils, Dumbbell, Brain, CalendarDays, RotateCcw, Smile, Annoyed, Frown, Meh, Laugh } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { format } from 'date-fns';


const SectionCard: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; itemsCount?: number; action?: React.ReactNode }> = ({ title, icon, children, itemsCount, action }) => (
  <Card className="neumorphic w-full mb-6">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <div className="flex flex-row items-center">
        <CardTitle className="text-xl font-medium flex items-center gap-2">
          {icon} {title}
        </CardTitle>
        {itemsCount !== undefined && <span className="ml-4 text-sm text-muted-foreground">{itemsCount} items</span>}
      </div>
      {action}
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

// Map moods to Lucide icons or keep emojis
const moodEmojis: { [key: string]: string | React.ReactNode } = {
  "😊": <Laugh className="h-6 w-6 text-green-400" />, // Happy
  "🙂": <Smile className="h-6 w-6 text-blue-400" />,    // Content
  "😐": <Meh className="h-6 w-6 text-yellow-400" />,     // Neutral
  "😕": <Annoyed className="h-6 w-6 text-orange-400" />, // Uneasy
  "😞": <Frown className="h-6 w-6 text-red-400" />       // Sad
};
const moodEmojiStrings = ["😊", "🙂", "😐", "😕", "😞"];


export default function DashboardPage() {
  const router = useRouter();
  const { wellnessPlan, isOnboarded, clearPlan, isLoadingPlan, addMoodLog, moodLogs } = usePlan();

  const [isMoodDialogOpen, setIsMoodDialogOpen] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [moodNotes, setMoodNotes] = useState("");

  useEffect(() => {
    if (!isLoadingPlan && !isOnboarded) {
      router.push('/onboarding');
    } else if (!isLoadingPlan && isOnboarded && !wellnessPlan) {
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

  const handleMoodButtonClick = (mood: string) => {
    setSelectedMood(mood);
    setMoodNotes("");
    setIsMoodDialogOpen(true);
  };

  const handleSaveMoodLog = () => {
    if (selectedMood) {
      addMoodLog(selectedMood, moodNotes);
      setIsMoodDialogOpen(false);
      setSelectedMood(null);
      setMoodNotes("");
    }
  };
  
  const sortedMoodLogs = React.useMemo(() => {
    return [...moodLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [moodLogs]);

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
      
      <Dialog open={isMoodDialogOpen} onOpenChange={setIsMoodDialogOpen}>
        <DialogContent className="neumorphic">
          <DialogHeader>
            <DialogTitle className="flex items-center text-xl">
              Log Your Mood: <span className="ml-2 text-3xl">{selectedMood}</span>
            </DialogTitle>
            <DialogDescription>
              How are you feeling right now? Add any notes if you like.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="mood-notes" className="text-right sr-only">
                Notes
              </Label>
            </div>
            <Textarea
              id="mood-notes"
              value={moodNotes}
              onChange={(e) => setMoodNotes(e.target.value)}
              placeholder="Optional: Add any thoughts or details about your mood..."
              className="col-span-4 h-24 neumorphic-inset-sm"
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" className="neumorphic-button">Cancel</Button>
            </DialogClose>
            <Button type="button" variant="neumorphic-primary" onClick={handleSaveMoodLog}>Save Mood</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SectionCard title="Mood Check-in" icon={<Smile className="h-6 w-6 text-accent" />}>
         <CardDescription className="mb-4">How are you feeling today?</CardDescription>
        <div className="flex space-x-2 justify-center sm:justify-start">
          {moodEmojiStrings.map(mood => (
            <Button 
              key={mood} 
              variant="outline" 
              size="icon" 
              onClick={() => handleMoodButtonClick(mood)}
              className="text-2xl neumorphic-button h-14 w-14 hover:neumorphic-inset"
              aria-label={`Log mood: ${mood}`}
            >
              {mood}
            </Button>
          ))}
        </div>
      </SectionCard>

      {sortedMoodLogs.length > 0 && (
        <SectionCard title="Mood History" icon={<RotateCcw className="h-6 w-6 text-accent" />} itemsCount={sortedMoodLogs.length}>
          <ScrollArea className="w-full h-[300px] whitespace-nowrap rounded-md">
            <div className="flex flex-col space-y-4 p-1">
              {sortedMoodLogs.map((log: MoodLog) => (
                <ItemCard key={log.id} className="bg-card w-full min-w-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-lg mb-1 flex items-center gap-2">
                         <span className="text-3xl">{log.mood}</span>
                         <span>{moodEmojis[log.mood] ? '' : log.mood}</span> {/* Fallback if emoji not in map for icon */}
                      </h4>
                       <p className="text-xs text-muted-foreground">
                        {format(new Date(log.date), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                  </div>
                  {log.notes && <p className="text-sm mt-2 pt-2 border-t border-border/50 whitespace-pre-wrap">{log.notes}</p>}
                </ItemCard>
              ))}
            </div>
            <ScrollBar orientation="vertical" />
          </ScrollArea>
        </SectionCard>
      )}

    </main>
  );
}

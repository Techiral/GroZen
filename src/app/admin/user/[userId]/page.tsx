
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { usePlan } from '@/contexts/plan-context';
import Logo from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Loader2, UserCircle, Utensils, Dumbbell, Brain, Smile, ShoppingCart, CalendarDays, ArrowLeft, LogOut, FileText, BarChart3, Laugh, Meh, Annoyed, Frown } from 'lucide-react';
import type { FullUserDetail, Meal, Exercise, Mindfulness, MoodLog, GroceryItem } from '@/types/wellness';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const DetailSection: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; isEmpty?: boolean; emptyText?: string }> = ({ title, icon, children, isEmpty, emptyText = "No data available." }) => (
  <Card className="neumorphic w-full mb-4">
    <CardHeader>
      <CardTitle className="text-md sm:text-lg font-medium flex items-center gap-2">
        {icon} {title}
      </CardTitle>
    </CardHeader>
    <CardContent>
      {isEmpty ? <p className="text-muted-foreground text-xs sm:text-sm">{emptyText}</p> : children}
    </CardContent>
  </Card>
);

const ItemCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={cn("neumorphic-sm p-3 sm:p-4 rounded-md min-w-[180px] xs:min-w-[200px] sm:min-w-[220px] md:min-w-[250px] snap-start", className)}>
    {children}
  </div>
);

const moodEmojis: { [key: string]: string | React.ReactNode } = {
  "😊": <Laugh className="h-4 w-4 sm:h-5 sm:w-5 text-green-400" />,
  "🙂": <Smile className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />,
  "😐": <Meh className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400" />,
  "😕": <Annoyed className="h-4 w-4 sm:h-5 sm:w-5 text-orange-400" />,
  "😞": <Frown className="h-4 w-4 sm:h-5 sm:w-5 text-red-400" />
};

export default function AdminUserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const targetUserId = params.userId as string;

  const { currentUser, isAdminUser, isLoadingAuth, fetchFullUserDetailsForAdmin, logoutUser } = usePlan();
  const [userData, setUserData] = useState<FullUserDetail | null>(null);
  const [isLoadingUserDetails, setIsLoadingUserDetails] = useState(true);

  useEffect(() => {
    if (!isLoadingAuth) {
      if (!currentUser || !isAdminUser) {
        router.replace('/login');
      } else if (targetUserId) {
        const loadUserDetails = async () => {
          setIsLoadingUserDetails(true);
          const fetchedData = await fetchFullUserDetailsForAdmin(targetUserId);
          setUserData(fetchedData);
          setIsLoadingUserDetails(false);
        };
        loadUserDetails();
      }
    }
  }, [currentUser, isAdminUser, isLoadingAuth, router, fetchFullUserDetailsForAdmin, targetUserId]);

  if (isLoadingAuth || isLoadingUserDetails || (!currentUser && !isLoadingAuth) || (!isAdminUser && currentUser)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Logo size="text-3xl sm:text-4xl" />
        <Loader2 className="mt-4 h-8 w-8 animate-spin text-primary" />
        <p className="mt-2 text-muted-foreground">Loading user details...</p>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Logo size="text-3xl sm:text-4xl" />
        <p className="mt-4 text-lg text-destructive">User data could not be loaded or user not found.</p>
        <Button onClick={() => router.back()} className="mt-4 neumorphic-button">
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    );
  }
  
  const { onboardingData, wellnessPlan, moodLogs, groceryList } = userData;

  return (
    <main className="container mx-auto p-3 sm:p-4 md:p-6">
      <header className="flex flex-col sm:flex-row justify-between items-center mb-5 sm:mb-6">
         <div className="flex items-center gap-2">
            <Logo size="text-2xl sm:text-3xl md:text-4xl" />
         </div>
        <div className="flex items-center gap-2 mt-3 sm:mt-0">
            <Button 
                variant="outline" 
                onClick={() => router.push('/admin')} 
                className="neumorphic-button text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2"
            >
                <ArrowLeft className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Back to User List
            </Button>
             <Button variant="outline" onClick={logoutUser} className="neumorphic-button text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2">
                <LogOut className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Logout
            </Button>
        </div>
      </header>
      
      <Card className="neumorphic mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <UserCircle className="h-5 w-5 sm:h-6 sm:w-6 text-accent" /> User Details
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Viewing data for User ID: <span className="font-mono text-foreground">{userData.id}</span>
            <br />
            Email: <span className="text-foreground">{userData.email || 'N/A'}</span>
          </CardDescription>
        </CardHeader>
      </Card>

      <DetailSection title="Onboarding Preferences" icon={<FileText className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />} isEmpty={!onboardingData}>
        {onboardingData && (
          <div className="space-y-1.5 text-xs sm:text-sm">
            <p><strong>Goals:</strong> {onboardingData.goals}</p>
            <p><strong>Diet Preferences:</strong> {onboardingData.dietPreferences}</p>
            <p><strong>Budget:</strong> <span className="capitalize">{onboardingData.budget}</span></p>
          </div>
        )}
      </DetailSection>

      <DetailSection title="Wellness Plan" icon={<BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />} isEmpty={!wellnessPlan || !wellnessPlan.meals || wellnessPlan.meals.length === 0}>
        {wellnessPlan && (
          <>
            <h4 className="font-semibold text-sm sm:text-md mb-2 text-muted-foreground">Meals ({wellnessPlan.meals.length})</h4>
            <ScrollArea className="w-full whitespace-nowrap rounded-md mb-3">
              <div className="flex space-x-2 sm:space-x-3 pb-3">
                {wellnessPlan.meals.map((meal: Meal, index: number) => (
                  <ItemCard key={`meal-${index}`} className="bg-card">
                    <h5 className="font-semibold text-xs sm:text-sm mb-1 flex items-center"><CalendarDays className="h-3 w-3 mr-1 text-muted-foreground" /> {meal.day}</h5>
                    <p className="text-2xs sm:text-xs break-words whitespace-normal"><strong>B:</strong> {meal.breakfast}</p>
                    <p className="text-2xs sm:text-xs break-words whitespace-normal"><strong>L:</strong> {meal.lunch}</p>
                    <p className="text-2xs sm:text-xs break-words whitespace-normal"><strong>D:</strong> {meal.dinner}</p>
                  </ItemCard>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>

            <h4 className="font-semibold text-sm sm:text-md mb-2 text-muted-foreground">Exercise ({wellnessPlan.exercise.length})</h4>
             <ScrollArea className="w-full whitespace-nowrap rounded-md mb-3">
              <div className="flex space-x-2 sm:space-x-3 pb-3">
                {wellnessPlan.exercise.map((ex: Exercise, index: number) => (
                  <ItemCard key={`ex-${index}`} className="bg-card">
                    <h5 className="font-semibold text-xs sm:text-sm mb-1 flex items-center"><CalendarDays className="h-3 w-3 mr-1 text-muted-foreground" /> {ex.day}</h5>
                    <p className="text-2xs sm:text-xs break-words whitespace-normal"><strong>Activity:</strong> {ex.activity}</p>
                    <p className="text-2xs sm:text-xs break-words whitespace-normal"><strong>Duration:</strong> {ex.duration}</p>
                  </ItemCard>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>

            <h4 className="font-semibold text-sm sm:text-md mb-2 text-muted-foreground">Mindfulness ({wellnessPlan.mindfulness.length})</h4>
             <ScrollArea className="w-full whitespace-nowrap rounded-md">
              <div className="flex space-x-2 sm:space-x-3 pb-3">
                {wellnessPlan.mindfulness.map((mind: Mindfulness, index: number) => (
                  <ItemCard key={`mind-${index}`} className="bg-card">
                    <h5 className="font-semibold text-xs sm:text-sm mb-1 flex items-center"><CalendarDays className="h-3 w-3 mr-1 text-muted-foreground" /> {mind.day}</h5>
                    <p className="text-2xs sm:text-xs break-words whitespace-normal"><strong>Practice:</strong> {mind.practice}</p>
                    <p className="text-2xs sm:text-xs break-words whitespace-normal"><strong>Duration:</strong> {mind.duration}</p>
                  </ItemCard>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </>
        )}
      </DetailSection>

      <DetailSection title="Mood Logs" icon={<Smile className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />} isEmpty={!moodLogs || moodLogs.length === 0}>
        <ScrollArea className="w-full h-[300px] sm:h-[400px] whitespace-nowrap rounded-md">
          <div className="flex flex-col space-y-2 sm:space-y-3 p-1">
            {moodLogs.map((log: MoodLog) => (
              <ItemCard key={log.id} className="bg-card w-full min-w-0">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  {log.selfieDataUri && (
                    <div className="relative w-full sm:w-20 md:w-24 h-auto aspect-square rounded-md overflow-hidden neumorphic-inset-sm">
                      <Image src={log.selfieDataUri} alt={`Selfie for mood ${log.mood}`} fill={true} className="object-cover" data-ai-hint="selfie person"/>
                    </div>
                  )}
                  <div className="flex-1">
                    <h5 className="font-semibold text-md sm:text-lg flex items-center gap-1 sm:gap-2">
                      <span className="text-xl sm:text-2xl">{log.mood}</span>
                      {moodEmojis[log.mood] && typeof moodEmojis[log.mood] !== 'string' ? moodEmojis[log.mood] : ''}
                    </h5>
                    <p className="text-2xs text-muted-foreground">
                      {format(new Date(log.date), "MMM d, yy 'at' h:mma")}
                    </p>
                    {log.notes && <p className="text-xs sm:text-sm mt-1.5 pt-1.5 border-t border-border/50 whitespace-pre-wrap break-words">{log.notes}</p>}
                    {log.aiFeedback && (
                      <div className="mt-1.5 pt-1.5 border-t border-border/50">
                        <p className="text-xs sm:text-sm italic text-muted-foreground/90 whitespace-pre-wrap break-words"><em>Insight:</em> {log.aiFeedback}</p>
                      </div>
                    )}
                  </div>
                </div>
              </ItemCard>
            ))}
          </div>
          <ScrollBar orientation="vertical" />
        </ScrollArea>
      </DetailSection>

      <DetailSection title="Grocery List" icon={<ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />} isEmpty={!groceryList || !groceryList.items || groceryList.items.length === 0}>
        {groceryList && groceryList.items && groceryList.items.length > 0 && (
            <div className="space-y-2 text-xs sm:text-sm">
                <p className="text-2xs text-muted-foreground">Generated: {format(new Date(groceryList.generatedDate), "MMM d, yyyy")}</p>
                {Object.entries(
                    groceryList.items.reduce((acc, item) => {
                        const category = item.category || 'Other';
                        if (!acc[category]) acc[category] = [];
                        acc[category].push(item);
                        return acc;
                    }, {} as Record<string, GroceryItem[]>)
                ).map(([category, items]) => (
                    <div key={category} className="mb-2">
                        <h5 className="font-semibold text-xs text-muted-foreground">{category} ({items.length})</h5>
                        <ul className="list-disc pl-4 space-y-0.5">
                            {items.map(item => (
                                <li key={item.id} className="text-2xs sm:text-xs break-words">
                                    <strong>{item.name}</strong>
                                    {item.quantity && <span className="text-muted-foreground"> ({item.quantity})</span>}
                                    {item.notes && <em className="text-muted-foreground text-2xs block"> - {item.notes}</em>}
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        )}
      </DetailSection>

    </main>
  );

    
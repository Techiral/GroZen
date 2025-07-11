
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { usePlan } from '@/contexts/plan-context';
import Logo from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Loader2, UserCircle, Utensils, Dumbbell, Brain, Smile, ShoppingCart, CalendarDays, ArrowLeft, LogOut, FileText, BarChart3, Laugh, Meh, Annoyed, Frown, Sparkles, BookOpen, Wind, Coffee, Info, ListChecks, MessageSquare, ExternalLink, Users, CheckCircle, Edit3 } from 'lucide-react';
import type { FullUserDetail, Meal, Exercise, Mindfulness, MoodLog, GroceryItem, DailyPlan, ScheduledQuest, BreakSlot, QuestType } from '@/types/wellness';
import { format, parseISO, isValid, parse } from 'date-fns';
import { cn } from '@/lib/utils';

const DetailSection: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; isEmpty?: boolean; emptyText?: string; className?: string }> = ({ title, icon, children, isEmpty, emptyText = "No data available.", className }) => (
  <Card className={cn("neumorphic w-full mb-3 sm:mb-4", className)}>
    <CardHeader className="px-3 py-2 sm:px-4 sm:py-2.5">
      <CardTitle className="text-sm sm:text-base font-medium flex items-center gap-1 sm:gap-1.5">
        {icon} {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="px-3 pt-0 pb-2.5 sm:px-4 sm:pb-3">
      {isEmpty ? <p className="text-muted-foreground text-2xs sm:text-xs">{emptyText}</p> : children}
    </CardContent>
  </Card>
);

const ItemCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={cn("neumorphic-sm p-2 sm:p-2.5 rounded-md min-w-[160px] xs:min-w-[180px] sm:min-w-[200px] md:min-w-[220px] snap-start", className)}>
    {children}
  </div>
);

const QuestItemCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={cn("neumorphic-inset-sm p-2 sm:p-2.5 rounded-md", className)}>
    {children}
  </div>
);

const moodEmojis: { [key: string]: string | React.ReactNode } = {
  "😊": <Laugh className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-green-400" aria-label="Happy emoji icon" />,
  "🙂": <Smile className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-blue-400" aria-label="Okay emoji icon" />,
  "😐": <Meh className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-yellow-400" aria-label="Neutral emoji icon" />,
  "😕": <Annoyed className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-orange-400" aria-label="Worried emoji icon" />,
  "😞": <Frown className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-red-400" aria-label="Sad emoji icon" />
};

const questTypeIcons: Record<QuestType, React.ElementType> = {
  study: BookOpen, workout: Dumbbell, hobby: ExternalLink, chore: ListChecks,
  wellness: Sparkles, creative: Edit3, social: Users, break: Coffee, other: Info,
};

const QuestIcon: React.FC<{ type: QuestType }> = ({ type }) => {
  const IconComponent = questTypeIcons[type] || Info;
  return <IconComponent className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground group-hover:text-accent transition-colors" />;
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

  if (isLoadingAuth || isLoadingUserDetails || (!currentUser && !isLoadingAuth) || (currentUser && !isAdminUser && !isLoadingAuth)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Logo size="text-xl sm:text-2xl" />
        <Loader2 className="mt-4 h-5 w-5 sm:h-6 sm:w-6 animate-spin text-primary" />
        <p className="mt-2 text-xs sm:text-sm text-muted-foreground">Loading user details...</p>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Logo size="text-xl sm:text-2xl" />
        <p className="mt-3 text-sm sm:text-base text-destructive">User data could not be loaded or user not found.</p>
        <Button onClick={() => router.back()} className="mt-3 neumorphic-button text-xs sm:text-sm px-3 py-1.5 h-8 sm:h-9" aria-label="Go Back">
          <ArrowLeft className="mr-1 h-3 w-3" /> Go Back
        </Button>
      </div>
    );
  }

  const { onboardingData, wellnessPlan, moodLogs, groceryList, avatarUrl, dailyPlans } = userData;
  const sortedDailyPlans = dailyPlans?.sort((a, b) => {
      const dateA = a.id ? parse(a.id, 'yyyy-MM-dd', new Date()) : new Date(0);
      const dateB = b.id ? parse(b.id, 'yyyy-MM-dd', new Date()) : new Date(0);
      if (!isValid(dateA) && isValid(dateB)) return 1; // a is invalid, b is valid, so b comes first
      if (isValid(dateA) && !isValid(dateB)) return -1; // a is valid, b is invalid, so a comes first
      if (!isValid(dateA) && !isValid(dateB)) return 0; // both invalid, order doesn't matter
      return dateB.getTime() - dateA.getTime(); // Sort descending (most recent first)
  }) || [];


  return (
    <main className="container mx-auto p-3 sm:p-4 md:p-6">
      <header className="flex flex-col sm:flex-row justify-between items-center mb-3 sm:mb-4">
         <div className="flex items-center gap-1 sm:gap-1.5">
            <Logo size="text-lg sm:text-xl" />
         </div>
        <div className="flex items-center gap-1 sm:gap-1.5 mt-2 sm:mt-0">
            <Button
                variant="outline"
                onClick={() => router.push('/admin')}
                className="neumorphic-button text-3xs px-2 py-1 sm:text-2xs sm:px-2.5 sm:py-1.5 h-7 sm:h-8"
                aria-label="Back to User List"
            >
                <ArrowLeft className="mr-0.5 h-2.5 w-2.5 sm:h-3 sm:w-3" /> User List
            </Button>
             <Button variant="outline" onClick={logoutUser} className="neumorphic-button text-3xs px-2 py-1 sm:text-2xs sm:px-2.5 sm:py-1.5 h-7 sm:h-8" aria-label="Logout from admin user detail page">
                <LogOut className="mr-0.5 h-2.5 w-2.5 sm:h-3 sm:w-3" /> Logout
            </Button>
        </div>
      </header>

      <Card className="neumorphic mb-4 sm:mb-5">
        <CardHeader className="flex flex-row items-center gap-2 sm:gap-3 px-3 py-2 sm:px-4 sm:py-2.5">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={userData.displayName || userData.email || 'User Avatar'}
              width={48}
              height={48}
              className="rounded-full object-cover h-10 w-10 sm:h-12 sm:w-12 neumorphic-sm"
              data-ai-hint="user avatar"
            />
          ) : (
            <UserCircle className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />
          )}
          <div className="flex-1">
            <CardTitle className="flex items-center gap-1 sm:gap-1.5 text-sm sm:text-base">
               {userData.displayName || 'User Profile'}
            </CardTitle>
            <CardDescription className="text-2xs sm:text-xs text-muted-foreground">
              User ID: <span className="font-mono text-foreground/80">{userData.id}</span>
              <br />
              Email: <span className="text-foreground/80">{userData.email || 'N/A'}</span>
            </CardDescription>
          </div>
        </CardHeader>
      </Card>

      <DetailSection title="Onboarding Preferences" icon={<FileText className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-accent" />} isEmpty={!onboardingData}>
        {onboardingData && (
          <div className="space-y-0.5 text-2xs sm:text-xs">
            <p><strong>Goals:</strong> {onboardingData.goals}</p>
            <p><strong>Diet Preferences:</strong> {onboardingData.dietPreferences}</p>
            <p><strong>Budget:</strong> <span className="capitalize">{onboardingData.budget}</span></p>
          </div>
        )}
      </DetailSection>

      <DetailSection title="AI Daily Quest Plans" icon={<ListChecks className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-accent" />} isEmpty={!sortedDailyPlans || sortedDailyPlans.length === 0}>
        <ScrollArea className="w-full h-[400px] sm:h-[500px] md:h-[600px] whitespace-nowrap rounded-md">
          <div className="flex flex-col space-y-3 sm:space-y-4 p-0.5">
            {sortedDailyPlans.map((plan: DailyPlan) => (
              <Card key={plan.id || new Date(plan.lastGeneratedAt?.toDate?.() || Date.now()).toISOString()} className="bg-card/50 neumorphic-sm">
                <CardHeader className="px-2.5 py-2 sm:px-3 sm:py-2.5">
                  <CardTitle className="text-xs sm:text-sm flex items-center justify-between">
                    <span>
                       Plan for: {plan.id ? format(parse(plan.id, 'yyyy-MM-dd', new Date()), "MMM d, yyyy") : "Unknown Date"}
                    </span>
                    {plan.lastGeneratedAt?.toDate && (
                       <span className="text-3xs text-muted-foreground">Generated: {format(plan.lastGeneratedAt.toDate(), "h:mma")}</span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-2.5 pt-0 pb-2 sm:px-3 sm:pb-2.5 space-y-2">
                  {plan.naturalLanguageDailyInput && (
                    <div className="mb-2">
                      <h5 className="font-semibold text-2xs text-muted-foreground mb-0.5">User Input:</h5>
                      <p className="text-3xs xs:text-2xs p-1.5 bg-muted/30 rounded-md whitespace-pre-wrap break-words neumorphic-inset-sm">{plan.naturalLanguageDailyInput}</p>
                    </div>
                  )}
                   {plan.userContextForAI && (
                    <div className="mb-2">
                      <h5 className="font-semibold text-2xs text-muted-foreground mb-0.5">User Context for AI:</h5>
                      <p className="text-3xs xs:text-2xs p-1.5 bg-muted/30 rounded-md whitespace-pre-wrap break-words neumorphic-inset-sm">{plan.userContextForAI}</p>
                    </div>
                  )}
                  {plan.aiDailySummaryMessage && (
                     <div className="mb-2">
                        <h5 className="font-semibold text-2xs text-muted-foreground mb-0.5 flex items-center"><Sparkles className="h-3 w-3 mr-1 text-accent"/>AI Daily Tip:</h5>
                        <p className="text-3xs xs:text-2xs p-1.5 bg-accent/10 rounded-md whitespace-pre-wrap break-words italic neumorphic-inset-sm">{plan.aiDailySummaryMessage}</p>
                    </div>
                  )}

                  {plan.generatedQuests && plan.generatedQuests.length > 0 && (
                    <div>
                      <h5 className="font-semibold text-2xs text-muted-foreground mb-1">Generated Quests ({plan.generatedQuests.length})</h5>
                      <div className="space-y-1.5">
                        {plan.generatedQuests.map((quest: ScheduledQuest) => (
                          <QuestItemCard key={quest.id} className="bg-background/70">
                            <div className="flex items-center gap-1.5">
                              <QuestIcon type={quest.questType} />
                              <div className="flex-1">
                                <p className="text-2xs sm:text-xs font-medium truncate">{quest.title}</p>
                                <p className="text-3xs text-muted-foreground">{quest.startTime} - {quest.endTime} | XP: {quest.xp}</p>
                                {quest.notes && <p className="text-3xs italic text-primary/80 truncate" title={quest.notes}>{quest.notes}</p>}
                              </div>
                              {plan.questCompletionStatus?.[quest.id] === 'completed' && <CheckCircle className="h-3.5 w-3.5 text-green-400" />}
                            </div>
                          </QuestItemCard>
                        ))}
                      </div>
                    </div>
                  )}
                  {plan.generatedBreaks && plan.generatedBreaks.length > 0 && (
                     <div className="mt-2">
                      <h5 className="font-semibold text-2xs text-muted-foreground mb-1">Suggested Breaks ({plan.generatedBreaks.length})</h5>
                       <div className="space-y-1.5">
                        {plan.generatedBreaks.map((br: BreakSlot) => (
                          <QuestItemCard key={br.id} className="bg-background/70">
                            <div className="flex items-center gap-1.5">
                               {br.suggestion?.toLowerCase().includes('walk') ? <Wind className="h-3 w-3 text-muted-foreground"/> : <Coffee className="h-3 w-3 text-muted-foreground"/>}
                              <div className="flex-1">
                                <p className="text-2xs sm:text-xs font-medium truncate">{br.suggestion || "Quick Break"}</p>
                                <p className="text-3xs text-muted-foreground">{br.startTime} - {br.endTime} {br.xp ? `| XP: ${br.xp}` : ''}</p>
                              </div>
                              {plan.questCompletionStatus?.[br.id] === 'completed' && <CheckCircle className="h-3.5 w-3.5 text-green-400" />}
                            </div>
                          </QuestItemCard>
                        ))}
                      </div>
                    </div>
                  )}
                   {(!plan.generatedQuests || plan.generatedQuests.length === 0) && (!plan.generatedBreaks || plan.generatedBreaks.length === 0) && (
                     <p className="text-center text-muted-foreground text-3xs py-2">No quests or breaks generated for this day.</p>
                   )}
                </CardContent>
              </Card>
            ))}
          </div>
          <ScrollBar orientation="vertical" />
        </ScrollArea>
      </DetailSection>

      <DetailSection title="Wellness Plan" icon={<BarChart3 className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-accent" />} isEmpty={!wellnessPlan || !wellnessPlan.meals || wellnessPlan.meals.length === 0}>
        {wellnessPlan && (
          <>
            <h4 className="font-semibold text-xs sm:text-sm mb-1 text-muted-foreground">Meals ({wellnessPlan.meals.length})</h4>
            <ScrollArea className="w-full whitespace-nowrap rounded-md mb-2 sm:mb-2.5">
              <div className="flex space-x-1.5 sm:space-x-2 pb-2 sm:pb-2.5">
                {wellnessPlan.meals.map((meal: Meal, index: number) => (
                  <ItemCard key={`meal-${index}`} className="bg-card">
                    <h5 className="font-semibold text-2xs sm:text-xs mb-0.5 flex items-center"><CalendarDays className="h-2.5 w-2.5 mr-1 text-muted-foreground" /> {meal.day}</h5>
                    <p className="text-3xs xs:text-2xs break-words whitespace-normal"><strong>B:</strong> {meal.breakfast}</p>
                    <p className="text-3xs xs:text-2xs break-words whitespace-normal"><strong>L:</strong> {meal.lunch}</p>
                    <p className="text-3xs xs:text-2xs break-words whitespace-normal"><strong>D:</strong> {meal.dinner}</p>
                  </ItemCard>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>

            <h4 className="font-semibold text-xs sm:text-sm mb-1 text-muted-foreground">Exercise ({wellnessPlan.exercise.length})</h4>
             <ScrollArea className="w-full whitespace-nowrap rounded-md mb-2 sm:mb-2.5">
              <div className="flex space-x-1.5 sm:space-x-2 pb-2 sm:pb-2.5">
                {wellnessPlan.exercise.map((ex: Exercise, index: number) => (
                  <ItemCard key={`ex-${index}`} className="bg-card">
                    <h5 className="font-semibold text-2xs sm:text-xs mb-0.5 flex items-center"><CalendarDays className="h-2.5 w-2.5 mr-1 text-muted-foreground" /> {ex.day}</h5>
                    <p className="text-3xs xs:text-2xs break-words whitespace-normal"><strong>Activity:</strong> {ex.activity}</p>
                    <p className="text-3xs xs:text-2xs break-words whitespace-normal"><strong>Duration:</strong> {ex.duration}</p>
                  </ItemCard>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>

            <h4 className="font-semibold text-xs sm:text-sm mb-1 text-muted-foreground">Mindfulness ({wellnessPlan.mindfulness.length})</h4>
             <ScrollArea className="w-full whitespace-nowrap rounded-md">
              <div className="flex space-x-1.5 sm:space-x-2 pb-2 sm:pb-2.5">
                {wellnessPlan.mindfulness.map((mind: Mindfulness, index: number) => (
                  <ItemCard key={`mind-${index}`} className="bg-card">
                    <h5 className="font-semibold text-2xs sm:text-xs mb-0.5 flex items-center"><CalendarDays className="h-2.5 w-2.5 mr-1 text-muted-foreground" /> {mind.day}</h5>
                    <p className="text-3xs xs:text-2xs break-words whitespace-normal"><strong>Practice:</strong> {mind.practice}</p>
                    <p className="text-3xs xs:text-2xs break-words whitespace-normal"><strong>Duration:</strong> {mind.duration}</p>
                  </ItemCard>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </>
        )}
      </DetailSection>

      <DetailSection title="Mood Logs" icon={<Smile className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-accent" />} isEmpty={!moodLogs || moodLogs.length === 0}>
        <ScrollArea className="w-full h-[220px] sm:h-[280px] md:h-[320px] whitespace-nowrap rounded-md">
          <div className="flex flex-col space-y-1.5 sm:space-y-2 p-0.5">
            {moodLogs.map((log: MoodLog) => (
              <ItemCard key={log.id} className="bg-card w-full min-w-0 p-2 sm:p-2.5">
                <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-2">
                  {log.selfieDataUri && (
                    <div className="relative w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 rounded-md overflow-hidden neumorphic-inset-sm">
                      <Image src={log.selfieDataUri} alt={`Selfie for mood ${log.mood} on ${format(new Date(log.date), "MMM d")}`} fill={true} className="object-cover" data-ai-hint="selfie person"/>
                    </div>
                  )}
                  <div className="flex-1">
                    <h5 className="font-semibold text-sm sm:text-base flex items-center gap-0.5 sm:gap-1">
                      <span className="text-base sm:text-lg">{log.mood}</span>
                      {moodEmojis[log.mood] && typeof moodEmojis[log.mood] !== 'string' ? moodEmojis[log.mood] : ''}
                    </h5>
                    <p className="text-3xs xs:text-2xs text-muted-foreground">
                      {format(new Date(log.date), "MMM d, yy 'at' h:mma")}
                    </p>
                    {log.notes && <p className="text-2xs sm:text-xs mt-1 pt-1 border-t border-border/50 whitespace-pre-wrap break-words">{log.notes}</p>}
                    {log.aiFeedback && (
                      <div className="mt-1 pt-1 border-t border-border/50">
                         <p className="text-3xs xs:text-2xs flex items-center gap-0.5 text-primary/80">
                            <Sparkles className="h-2.5 w-2.5 mr-0.5 text-accent" /> <em>GroZen Insight:</em>
                         </p>
                        <p className="text-2xs sm:text-xs italic text-muted-foreground/90 whitespace-pre-wrap break-words">{log.aiFeedback}</p>
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

      <DetailSection title="Grocery List" icon={<ShoppingCart className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-accent" />} isEmpty={!groceryList || !groceryList.items || groceryList.items.length === 0}>
        {groceryList && groceryList.items && groceryList.items.length > 0 && (
            <div className="space-y-1 text-2xs sm:text-xs">
                <p className="text-3xs xs:text-2xs text-muted-foreground">Generated: {format(new Date(groceryList.generatedDate), "MMM d, yyyy")}</p>
                {Object.entries(
                    groceryList.items.reduce((acc, item) => {
                        const category = item.category || 'Other';
                        if (!acc[category]) acc[category] = [];
                        acc[category].push(item);
                        return acc;
                    }, {} as Record<string, GroceryItem[]>)
                ).map(([category, items]) => (
                    <div key={category} className="mb-1">
                        <h5 className="font-semibold text-2xs text-muted-foreground">{category} ({items.length})</h5>
                        <ul className="list-disc pl-3 sm:pl-3.5 space-y-0.5">
                            {items.map(item => (
                                <li key={item.id} className="text-3xs xs:text-2xs break-words">
                                    <strong>{item.name}</strong>
                                    {item.quantity && <span className="text-muted-foreground"> ({item.quantity})</span>}
                                    {item.notes && <em className="text-muted-foreground text-3xs block"> - {item.notes}</em>}
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
}


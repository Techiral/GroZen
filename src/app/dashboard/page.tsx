
"use client";

import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { usePlan } from '@/contexts/plan-context';
import Logo from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Progress as ShadProgress } from '@/components/ui/progress';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Loader2, Utensils, Dumbbell, Brain, Smile, ShoppingCart, CalendarDays as CalendarIcon, Camera, Trash2, LogOut, Settings, Trophy, Plus, Sparkles, Target, CheckCircle, BarChart3, Users, RefreshCw, X, UserCircle, PartyPopper, ThumbsUp, Flame, BookOpen, Paintbrush, FerrisWheel, Briefcase, Coffee, Award as AwardIcon, Medal, Info, Edit3, Wand2, Clock, CircleDashed, ChevronLeft, ChevronRight, Zap, Star, Wind } from 'lucide-react';
import type { MoodLog, GroceryItem, ChartMoodLog, ScheduledQuest as ScheduledQuestType, QuestType, DailySummary, Badge as BadgeType, BreakSlot, WellnessPlan, Meal, Exercise, Mindfulness } from '@/types/wellness';
import { format, parseISO, isToday, subDays, startOfDay, isSameDay, addDays, isValid } from 'date-fns';
import { cn } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { CURRENT_CHALLENGE } from '@/config/challenge';
import anime from 'animejs';
import { useToast } from '@/hooks/use-toast';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';


// Mood emoji to numeric value mapping for chart
const moodToValue: { [key: string]: number } = {
  "😞": 1, "😕": 2, "😐": 3, "🙂": 4, "😊": 5,
};

const ItemCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={cn("neumorphic-sm p-2 sm:p-2.5 rounded-md min-w-[160px] xs:min-w-[180px] sm:min-w-[200px] md:min-w-[220px] snap-start", className)}>
    {children}
  </div>
);

const questTypeIcons: Record<QuestType, React.ElementType> = {
  study: BookOpen, workout: Dumbbell, hobby: Paintbrush, chore: Briefcase,
  wellness: AwardIcon, creative: Edit3, social: Users, break: Coffee, other: FerrisWheel,
};


const DashboardContent: React.FC = () => {
  const router = useRouter();
  const {
    currentUser, isLoadingAuth, isPlanAvailable, isOnboardedState, wellnessPlan,
    moodLogs, addMoodLog, deleteMoodLog, groceryList, isLoadingGroceryList,
    generateGroceryList, deleteGroceryItem, logoutUser, userActiveChallenge,
    isLoadingUserChallenge, joinCurrentChallenge, logChallengeDay, currentUserProfile,
    updateUserDisplayName,
    selectedDateForPlanning, setSelectedDateForPlanning, 
    naturalLanguageDailyInput, setNaturalLanguageDailyInput,
    scheduledQuestsForSelectedDate, scheduledBreaksForSelectedDate, aiDailySummaryMessage,
    isLoadingSchedule, 
    generateQuestScheduleForSelectedDate, completeQuestInSchedule, deleteScheduledItem,
  } = usePlan();
  const { toast } = useToast();

  const [selectedMood, setSelectedMood] = useState('');
  const [moodNotes, setMoodNotes] = useState('');
  const [selfieDataUri, setSelfieDataUri] = useState<string | undefined>(undefined);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isSubmittingMood, setIsSubmittingMood] = useState(false);
  const [isMoodDialogOpen, setIsMoodDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [isSummaryDialogOpen, setIsSummaryDialogOpen] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [aiFeedbackToDisplay, setAiFeedbackToDisplay] = useState<string | null>(null);
  const [userScheduleContext, setUserScheduleContext] = useState('');


  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const questCardRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
  const xpBarRef = useRef<HTMLDivElement>(null);
  const aiFeedbackCardRef = useRef<HTMLDivElement>(null);


  const [mockUserXP, setMockUserXP] = useState(0);
  const [mockUserLevel, setMockUserLevel] = useState(1);
  const [mockXPToNextLevel, setMockXPToNextLevel] = useState(250);
  const [mockDailyStreak, setMockDailyStreak] = useState(0); 
  const [mockBestStreak, setMockBestStreak] = useState(0); 
  const [mockDailySummary, setMockDailySummary] = useState<DailySummary | null>(null);

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

  useEffect(() => {
    if (!isLoadingAuth) {
      if (!currentUser) router.replace('/login');
      else if (!isOnboardedState) router.replace('/onboarding');
    }
  }, [currentUser, isLoadingAuth, isOnboardedState, router]);

  useEffect(() => {
    if (currentUserProfile) {
      setNewDisplayName(currentUserProfile.displayName || '');
      setMockUserXP(currentUserProfile.xp || 0);
      setMockUserLevel(currentUserProfile.level || 1);
      setMockDailyStreak(currentUserProfile.dailyQuestStreak || 0);
      setMockBestStreak(currentUserProfile.bestQuestStreak || 0);
    }
  }, [currentUserProfile]);

  useEffect(() => {
    if (aiFeedbackToDisplay && aiFeedbackCardRef.current) {
      anime({
        targets: aiFeedbackCardRef.current, opacity: [0, 1], translateY: [20, 0],
        scale: [0.95, 1], duration: 500, easing: 'easeOutExpo',
      });
      const timer = setTimeout(() => setAiFeedbackToDisplay(null), 7000);
      return () => clearTimeout(timer);
    }
  }, [aiFeedbackToDisplay]);

  const startCamera = useCallback(async () => {
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      toast({variant: "destructive", title: "Camera Error", description: "Could not access camera."});
      setIsCameraOpen(false);
    }
  }, [toast]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if(videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUri = canvas.toDataURL('image/webp', 0.8); 
        setSelfieDataUri(dataUri);
        stopCamera();
        setIsCameraOpen(false);
      }
    }
  }, [stopCamera]);

  const handleMoodSubmit = async () => {
    if (!selectedMood) {
        toast({variant: "destructive", title: "Mood Missing", description: "Please select a mood."});
        return;
    }
    setIsSubmittingMood(true);
    const feedback = await addMoodLog(selectedMood, moodNotes, selfieDataUri); 
    setIsSubmittingMood(false);
    setIsMoodDialogOpen(false);
    setSelectedMood('');
    setMoodNotes('');
    setSelfieDataUri(undefined);
    setIsCameraOpen(false); 
    if(typeof feedback === 'string' && feedback) {
      setAiFeedbackToDisplay(feedback);
    }
  };

  const handleDeleteMoodLog = async (logId: string) => {
    await deleteMoodLog(logId);
  };
  
  const handleGenerateGroceryList = async () => {
    if (!wellnessPlan) {
      toast({ variant: "destructive", title: "No Plan", description: "Generate a wellness plan first!" });
      return;
    }
    await generateGroceryList(wellnessPlan);
  };

  const handleDeleteGroceryItem = async (itemId: string) => {
    await deleteGroceryItem(itemId);
  };
  
  const handleUpdateDisplayName = async () => {
    if (!newDisplayName.trim()) {
        toast({variant: "destructive", title: "Name Needed", description: "Please enter a display name."});
        return;
    }
    setIsUpdatingName(true);
    await updateUserDisplayName(newDisplayName);
    setIsUpdatingName(false);
    setIsSettingsDialogOpen(false);
  };

  const handleGenerateSchedule = async () => {
    if (!naturalLanguageDailyInput.trim()) {
        toast({ title: "No Tasks Yet!", description: "Describe your day's tasks before generating a schedule." });
        return;
    }
    await generateQuestScheduleForSelectedDate(naturalLanguageDailyInput, userScheduleContext);
  };

  const handleCompleteQuest = async (questId: string) => {
    const cardRef = questCardRefs.current.get(questId);
    if (cardRef) {
      cardRef.classList.add('animate-ripple');
      setTimeout(() => cardRef.classList.remove('animate-ripple'), 700);
    }
    await completeQuestInSchedule(questId);

    const questXP = scheduledQuestsForSelectedDate.find(q => q.id === questId)?.xp ||
                    scheduledBreaksForSelectedDate.find(b => b.id === questId)?.xp || 10;
    
    const newTotalXP = (currentUserProfile?.xp || 0) + questXP;
    setMockUserXP(newTotalXP); 

    if (newTotalXP >= mockXPToNextLevel) {
      const newLevel = (currentUserProfile?.level || 1) + 1;
      setMockUserLevel(newLevel);
      setMockXPToNextLevel(prev => prev + 150); 
      toast({ title: "LEVEL UP! 🎉", description: `You've reached Level ${newLevel}! Keep crushing it!`, duration: 4000 });
      
      if (xpBarRef.current) {
        const indicator = xpBarRef.current.querySelector('.progress-bar-fill-xp') as HTMLDivElement;
        if(indicator) {
            anime({
                targets: indicator,
                width: ['100%', '0%'],
                duration: 300,
                easing: 'easeOutExpo',
                complete: () => {
                     anime({
                        targets: indicator,
                        width: `${( (newTotalXP - mockXPToNextLevel + 150) / (mockXPToNextLevel - mockXPToNextLevel + 150 +150) ) * 100}%`, 
                        duration: 500,
                        easing: 'easeOutExpo'
                    });
                }
            });
        }
      }
    } else {
        if (xpBarRef.current) {
          const indicator = xpBarRef.current.querySelector('.progress-bar-fill-xp') as HTMLDivElement;
          if (indicator) {
            anime({
                targets: indicator,
                width: `${(newTotalXP / mockXPToNextLevel) * 100}%`,
                duration: 500,
                easing: 'easeOutExpo'
            });
          }
        }
    }
  };

  const handleViewDailySummary = () => {
    const completedToday = scheduledQuestsForSelectedDate.filter(q => q.notes?.includes("(Completed!)"));
    const totalToday = scheduledQuestsForSelectedDate.length;
    const xpGainedToday = completedToday.reduce((sum, q) => sum + q.xp, 0);

    let earnedBadges: BadgeType[] = [];
    if (completedToday.length >= 2 && !localStorage.getItem('badge_quick_achiever_earned_v2')) {
      earnedBadges.push({id: 'b1', name: 'Quick Achiever!', description: 'Completed 2 quests today!', iconName: 'Medal'});
      localStorage.setItem('badge_quick_achiever_earned_v2', 'true'); 
    }
     if (completedToday.length >= 1 && mockDailyStreak === 0 && !localStorage.getItem('badge_first_streak_earned')) {
      earnedBadges.push({id: 'b_streak1', name: 'Streak Starter!', description: 'Completed your first day in a row!', iconName: 'Flame'});
      localStorage.setItem('badge_first_streak_earned', 'true');
    }


    setMockDailySummary({
      date: format(selectedDateForPlanning, 'yyyy-MM-dd'),
      questsCompleted: completedToday.length,
      totalQuests: totalToday,
      xpGained: xpGainedToday,
      badgesEarned: earnedBadges,
      streakContinued: mockDailyStreak > 0, 
      activityScore: Math.round((completedToday.length / (totalToday || 1)) * 100)
    });
    setIsSummaryDialogOpen(true);
  };

  const handleDeleteScheduledItem = async (itemId: string, itemType: 'quest' | 'break') => {
    await deleteScheduledItem(itemId, itemType);
    toast({title: `${itemType === 'quest' ? 'Quest' : 'Break'} Removed`, description: "Your schedule has been updated."});
  };

  const chartData: ChartMoodLog[] = useMemo(() =>
    moodLogs.filter(log => moodToValue[log.mood] !== undefined).slice(0, 30)
      .map(log => ({ date: format(parseISO(log.date), 'MMM d'), moodValue: moodToValue[log.mood], moodEmoji: log.mood, fullDate: log.date, }))
      .reverse(),
  [moodLogs]);

  const groupedGroceryItems = useMemo(() =>
    groceryList?.items.reduce((acc, item) => {
      const category = item.category || 'Other';
      if (!acc[category]) acc[category] = [];
      acc[category].push(item);
      return acc;
    }, {} as Record<string, GroceryItem[]>) || {},
  [groceryList]);

  const displayedItems = useMemo(() => {
    return [...scheduledQuestsForSelectedDate, ...scheduledBreaksForSelectedDate]
        .sort((a, b) => {
            const timeA = parseInt(a.startTime.replace(':', ''), 10);
            const timeB = parseInt(b.startTime.replace(':', ''), 10);
            return timeA - timeB;
        });
  }, [scheduledQuestsForSelectedDate, scheduledBreaksForSelectedDate]);


  if (!isMounted || isLoadingAuth || (!currentUser && !isLoadingAuth) || (currentUser && !isOnboardedState && !isLoadingAuth)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Logo size="text-xl sm:text-2xl" />
        <Loader2 className="mt-4 h-5 w-5 sm:h-6 sm:w-6 animate-spin text-primary" />
        <p className="mt-2 text-xs sm:text-sm text-muted-foreground">Loading your dashboard...</p>
      </div>
    );
  }
  
  if (!isPlanAvailable && scheduledQuestsForSelectedDate.length === 0 && !naturalLanguageDailyInput.trim()) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-4 text-center">
        <Logo size="text-xl sm:text-2xl" />
        <Zap className="w-12 h-12 text-accent my-4" />
        <h2 className="text-lg font-semibold text-primary">Your Quest Planner is Ready!</h2>
        <p className="text-muted-foreground text-sm max-w-md mt-2 mb-4">
          Looks like you haven&apos;t described your day for {format(selectedDateForPlanning, "eeee")} yet.
          Tell GroZen what you need to do, and let the AI craft your epic daily quest list!
        </p>
        <Button onClick={() => document.getElementById('naturalLanguageTasks')?.focus()} className="neumorphic-button-primary">
          <Plus className="mr-2 h-4 w-4" /> Describe Your Day for {format(selectedDateForPlanning, "MMM d")}
        </Button>
      </div>
    );
  }

  const QuestIcon = ({ type }: { type: QuestType }) => {
    const IconComponent = questTypeIcons[type] || Info;
    return <IconComponent className="h-3.5 w-3.5 text-muted-foreground group-hover:text-accent transition-colors" />;
  };


  return (
    <main className="container mx-auto p-3 sm:p-4 md:p-6">
       <header className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Logo size="text-xl sm:text-2xl" />
        </div>
        <div className="flex items-center gap-1 sm:gap-1.5 mt-2 sm:mt-0">
           <Button variant="outline" onClick={() => router.push('/leaderboard')} className="neumorphic-button text-3xs px-2 py-1 sm:text-2xs sm:px-2.5 sm:py-1.5 h-7 sm:h-8" aria-label="View Leaderboard">
             <Trophy className="mr-1 h-2.5 w-2.5 sm:h-3 sm:w-3" /> Leaderboard
           </Button>
           <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
            <DialogTrigger asChild>
               <Button variant="outline" className="neumorphic-button text-3xs px-2 py-1 sm:text-2xs sm:px-2.5 sm:py-1.5 h-7 sm:h-8" aria-label="Open Settings">
                 <Settings className="mr-1 h-2.5 w-2.5 sm:h-3 sm:w-3" /> Settings
               </Button>
            </DialogTrigger>
            <DialogContent className="neumorphic max-w-[90vw] xs:max-w-sm">
                <DialogHeader>
                    <DialogTitle className="text-sm sm:text-base">User Settings</DialogTitle>
                    <DialogDescription className="text-2xs sm:text-xs">Update your display name.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-3 py-3">
                    <Label htmlFor="displayName" className="text-2xs sm:text-xs">Display Name</Label>
                    <Input id="displayName" value={newDisplayName} onChange={(e) => setNewDisplayName(e.target.value)} className="h-8 sm:h-9 text-xs sm:text-sm" disabled={isUpdatingName}/>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsSettingsDialogOpen(false)} className="neumorphic-button text-xs sm:text-sm h-8 sm:h-9" disabled={isUpdatingName}>Cancel</Button>
                    <Button onClick={handleUpdateDisplayName} disabled={isUpdatingName || !newDisplayName.trim()} className="neumorphic-button-primary text-xs sm:text-sm h-8 sm:h-9">
                        {isUpdatingName && <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />} Save
                    </Button>
                </DialogFooter>
            </DialogContent>
           </Dialog>
           <Button variant="outline" onClick={logoutUser} className="neumorphic-button text-3xs px-2 py-1 sm:text-2xs sm:px-2.5 sm:py-1.5 h-7 sm:h-8" aria-label="Logout">
             <LogOut className="mr-1 h-2.5 w-2.5 sm:h-3 sm:w-3" /> Logout
           </Button>
        </div>
      </header>

      {aiFeedbackToDisplay && (
        <Card ref={aiFeedbackCardRef} className="neumorphic mb-3 sm:mb-4 p-2 sm:p-2.5 bg-accent/10 border-accent/30">
          <CardTitle className="text-xs sm:text-sm font-semibold flex items-center text-primary">
            <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 text-accent" /> GroZen Insight:
          </CardTitle>
          <CardDescription className="text-2xs sm:text-xs text-foreground/90 italic">{aiFeedbackToDisplay}</CardDescription>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          <Card className="neumorphic hover:shadow-primary/20 transition-shadow duration-300">
            <CardHeader className="px-3 py-2.5 sm:px-4 sm:py-3">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                {currentUserProfile?.avatarUrl ? (
                  <Image
                    src={currentUserProfile.avatarUrl}
                    alt="User avatar"
                    width={40}
                    height={40}
                    className="rounded-full neumorphic-sm object-cover h-8 w-8 sm:h-10 sm:w-10"
                    data-ai-hint="user avatar"
                  />
                ) : (
                  <UserCircle className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" />
                )}
                <div>
                  <CardTitle className="text-sm sm:text-base text-primary">
                    Hey {currentUserProfile?.displayName || 'GroZen User'}! Let&apos;s Rock Today! 👋
                  </CardTitle>
                  <CardDescription className="text-2xs sm:text-xs">
                    Level {mockUserLevel}  |  XP: {mockUserXP % mockXPToNextLevel} / {mockXPToNextLevel}
                  </CardDescription>
                </div>
              </div>
              <div ref={xpBarRef}>
                 <ShadProgress value={(mockUserXP % mockXPToNextLevel) / mockXPToNextLevel * 100} className="h-2 sm:h-2.5 animate-progress-fill progress-bar-fill-xp" indicatorClassName="progress-bar-fill-xp"/>
              </div>
            </CardHeader>
          </Card>

           <Card className="neumorphic">
            <CardHeader className="px-3 py-2 sm:px-4 sm:py-2.5 flex-row items-center justify-between">
                <CardTitle className="text-sm sm:text-base text-primary flex items-center">
                    <Flame className="h-4 w-4 mr-1.5 text-accent"/> Daily Quest Streak
                </CardTitle>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="flex items-center gap-0.5 sm:gap-1">
                                {[...Array(Math.max(5, mockDailyStreak))].slice(0, 7).map((_, i) => (
                                    <div
                                        key={`streak-${i}`}
                                        className={cn(
                                            "h-3 w-3 sm:h-3.5 sm:w-3.5 rounded-full neumorphic-inset-sm",
                                            i < mockDailyStreak ? "bg-primary animate-streak-fill" : "bg-muted/30"
                                        )}
                                    />
                                ))}
                                {mockDailyStreak > 0 && <span className="text-sm sm:text-base font-bold text-primary ml-1 sm:ml-1.5">{mockDailyStreak}</span>}
                            </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="neumorphic-sm text-xs">
                            <p>Current Streak: {mockDailyStreak} days</p>
                            <p>Best Streak: {mockBestStreak} days</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </CardHeader>
          </Card>

          <Card className="neumorphic">
            <CardHeader className="px-3 py-2 sm:px-4 sm:py-2.5 flex-col xs:flex-row items-start xs:items-center justify-between gap-2">
              <div className="flex-1">
                <CardTitle className="text-sm sm:text-base text-primary flex items-center">
                  <Sparkles className="h-4 w-4 mr-1.5 text-accent"/> AI Quest Planner
                </CardTitle>
                <CardDescription className="text-2xs sm:text-xs">
                  Plan for: {format(selectedDateForPlanning, "eeee, MMM d")}
                </CardDescription>
              </div>
              <div className="flex items-center gap-1">
                <Button onClick={() => setSelectedDateForPlanning(subDays(selectedDateForPlanning,1))} variant="outline" size="icon" className="neumorphic-button h-7 w-7"><ChevronLeft /></Button>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="neumorphic-button h-7 px-2 text-xs">
                            <CalendarIcon className="mr-1 h-3 w-3" />
                            {format(selectedDateForPlanning, "MMM d, yy")}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 neumorphic" align="center">
                        <Calendar
                            mode="single"
                            selected={selectedDateForPlanning}
                            onSelect={(date) => date && isValid(date) && setSelectedDateForPlanning(date)}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
                <Button onClick={() => setSelectedDateForPlanning(addDays(selectedDateForPlanning,1))} variant="outline" size="icon" className="neumorphic-button h-7 w-7"><ChevronRight /></Button>
              </div>
            </CardHeader>

            <CardContent className="px-3 pt-2 pb-2.5 sm:px-4 sm:pb-3 border-t border-border/50">
              <div className="space-y-2 mb-3">
                <Label htmlFor="naturalLanguageTasks" className="text-xs text-muted-foreground">What&apos;s your quest for {format(selectedDateForPlanning, "MMM d")}? (Tell AI everything!)</Label>
                <Textarea
                  id="naturalLanguageTasks"
                  placeholder="I have to first update my app with some new features, solve some bugs, share the information of the app to sales executive, complete homework, ask teammate for the presentation, check the hackathon, go to coaching, try to learn some social skills, etc."
                  value={naturalLanguageDailyInput}
                  onChange={(e) => setNaturalLanguageDailyInput(e.target.value)}
                  className="min-h-[80px] text-sm"
                />
                 <Textarea
                    placeholder="Any special notes for AI? (e.g., I have an appointment at 2 PM, prefer workouts in evening)"
                    value={userScheduleContext}
                    onChange={(e) => setUserScheduleContext(e.target.value)}
                    className="min-h-[40px] text-xs mt-1"
                  />
                <Button onClick={handleGenerateSchedule} disabled={isLoadingSchedule || !naturalLanguageDailyInput.trim()} className="w-full neumorphic-button-primary h-9 text-sm mt-1">
                  {isLoadingSchedule ? <Loader2 className="h-4 w-4 animate-spin"/> : <Wand2 className="h-4 w-4"/>} AI, Plan My Quests!
                </Button>
              </div>
            </CardContent>

            <CardHeader className="px-3 py-2 sm:px-4 sm:py-2.5 flex-row items-center justify-between border-t border-border/50">
              <CardTitle className="text-sm sm:text-base text-primary flex items-center">
                <Target className="h-4 w-4 mr-1.5 text-accent"/> Scheduled Quests
              </CardTitle>
              {aiDailySummaryMessage && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6"><Sparkles className="h-4 w-4 text-accent"/></Button></TooltipTrigger>
                    <TooltipContent className="neumorphic-sm text-xs max-w-xs"><p>{aiDailySummaryMessage}</p></TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              <Button variant="outline" size="sm" onClick={handleViewDailySummary} className="neumorphic-button text-3xs h-6 sm:h-7" disabled={displayedItems.length === 0}>
                  Daily Recap
              </Button>
            </CardHeader>
            <CardContent className="px-3 pt-0 pb-2.5 sm:px-4 sm:pb-3">
              {isLoadingSchedule && <div className="flex items-center justify-center py-4"><Loader2 className="h-5 w-5 animate-spin mr-2" /> <p className="text-sm text-muted-foreground">AI is crafting your schedule...</p></div>}
              {!isLoadingSchedule && displayedItems.length === 0 && !naturalLanguageDailyInput.trim() && <p className="text-2xs sm:text-xs text-muted-foreground text-center py-4">Describe your day above and let AI plan your quests!</p>}
              {!isLoadingSchedule && displayedItems.length === 0 && naturalLanguageDailyInput.trim() && <p className="text-2xs sm:text-xs text-muted-foreground text-center py-4">Click "AI, Plan My Quests!" to generate your schedule.</p>}

              {displayedItems.length > 0 ? (
                <ScrollArea className="h-[250px] sm:h-[300px] w-full">
                  <div className="space-y-2 sm:space-y-2.5 pr-1">
                    {displayedItems.map((item) => {
                       const isBreak = 'suggestion' in item;
                       const quest = isBreak ? null : item as ScheduledQuestType;
                       const breakItem = isBreak ? item as BreakSlot : null;
                       const itemId = item.id;
                       const isCompleted = quest?.notes?.includes("(Completed!)") || breakItem?.suggestion?.includes("(Taken!)");

                       return (
                          <div
                            key={itemId}
                            ref={el => questCardRefs.current.set(itemId, el)}
                            className={cn(
                                "neumorphic-sm p-2 sm:p-2.5 rounded-md group quest-card-ripple",
                                isCompleted && "opacity-60 bg-card/50"
                            )}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
                                {quest && <QuestIcon type={quest.questType} />}
                                {breakItem && (isBreak && item.suggestion?.toLowerCase().includes('walk') ? <Wind className="h-3.5 w-3.5 text-muted-foreground group-hover:text-accent transition-colors" /> : <Coffee className="h-3.5 w-3.5 text-muted-foreground group-hover:text-accent transition-colors" />)}
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs sm:text-sm font-medium truncate text-foreground">
                                        {quest ? quest.title : breakItem?.suggestion || "Quick Break"}
                                    </p>
                                    <p className="text-2xs sm:text-xs text-muted-foreground">
                                      {item.startTime} - {item.endTime}
                                      {quest && ` | XP: ${quest.xp}`}
                                      {breakItem && breakItem.xp ? ` | XP: ${breakItem.xp}`: ''}
                                    </p>
                                    {quest?.notes && !isCompleted && <p className="text-3xs text-primary/80 italic pt-0.5">{quest.notes}</p>}
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                {!isCompleted ? (
                                  <Button
                                    variant="neumorphic-primary"
                                    size="sm"
                                    onClick={() => handleCompleteQuest(itemId)}
                                    className="text-3xs px-1.5 h-6 sm:h-7 sm:text-2xs sm:px-2"
                                  >
                                    {isBreak ? "Done!" : "Complete"}
                                  </Button>
                                ) : (
                                  <CheckCircle className="h-5 w-5 text-green-400" />
                                )}
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" aria-label={`Delete ${isBreak ? 'break' : 'quest'}`}>
                                      <Trash2 className="h-3 w-3"/>
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className="neumorphic">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete This Item?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to remove "{quest ? quest.title : breakItem?.suggestion || 'this break'}" from your schedule? This cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel className="neumorphic-button">Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDeleteScheduledItem(itemId, isBreak ? 'break' : 'quest')} className="neumorphic-button-primary bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>
                          </div>
                       );
                    })}
                  </div>
                </ScrollArea>
              ) : null}
            </CardContent>
          </Card>

          {wellnessPlan && isPlanAvailable && (
            <Card className="neumorphic">
              <CardHeader className="px-3 py-2 sm:px-4 sm:py-2.5">
                <CardTitle className="text-sm sm:text-base text-primary flex items-center">
                  <BookOpen className="h-4 w-4 mr-1.5 text-accent" /> GroZen Blueprint
                </CardTitle>
                <CardDescription className="text-2xs sm:text-xs">Your personalized wellness plan.</CardDescription>
              </CardHeader>
              <CardContent className="px-3 pt-0 pb-2.5 sm:px-4 sm:pb-3">
                <Tabs defaultValue="meals" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 h-auto neumorphic-inset-sm">
                    <TabsTrigger value="meals" className="text-2xs px-1 py-1 sm:text-xs sm:px-1.5 sm:py-1.5"><Utensils className="h-3 w-3 mr-1" /> Meals</TabsTrigger>
                    <TabsTrigger value="exercise" className="text-2xs px-1 py-1 sm:text-xs sm:px-1.5 sm:py-1.5"><Dumbbell className="h-3 w-3 mr-1" /> Exercise</TabsTrigger>
                    <TabsTrigger value="mindfulness" className="text-2xs px-1 py-1 sm:text-xs sm:px-1.5 sm:py-1.5"><Brain className="h-3 w-3 mr-1" /> Mind</TabsTrigger>
                  </TabsList>
                  <TabsContent value="meals" className="mt-2">
                    <ScrollArea className="w-full whitespace-nowrap rounded-md">
                      <div className="flex space-x-1.5 sm:space-x-2 pb-2 sm:pb-2.5">
                        {wellnessPlan.meals.map((meal: Meal, index: number) => (
                          <ItemCard key={`meal-${index}`} className="bg-card">
                            <h5 className="font-semibold text-2xs sm:text-xs mb-0.5 flex items-center"><CalendarIcon className="h-2.5 w-2.5 mr-1 text-muted-foreground" /> {meal.day}</h5>
                            <p className="text-3xs xs:text-2xs break-words whitespace-normal"><strong>B:</strong> {meal.breakfast}</p>
                            <p className="text-3xs xs:text-2xs break-words whitespace-normal"><strong>L:</strong> {meal.lunch}</p>
                            <p className="text-3xs xs:text-2xs break-words whitespace-normal"><strong>D:</strong> {meal.dinner}</p>
                          </ItemCard>
                        ))}
                      </div>
                      <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                  </TabsContent>
                  <TabsContent value="exercise" className="mt-2">
                    <ScrollArea className="w-full whitespace-nowrap rounded-md">
                      <div className="flex space-x-1.5 sm:space-x-2 pb-2 sm:pb-2.5">
                        {wellnessPlan.exercise.map((ex: Exercise, index: number) => (
                          <ItemCard key={`ex-${index}`} className="bg-card">
                            <h5 className="font-semibold text-2xs sm:text-xs mb-0.5 flex items-center"><CalendarIcon className="h-2.5 w-2.5 mr-1 text-muted-foreground" /> {ex.day}</h5>
                            <p className="text-3xs xs:text-2xs break-words whitespace-normal"><strong>Activity:</strong> {ex.activity}</p>
                            <p className="text-3xs xs:text-2xs break-words whitespace-normal"><strong>Duration:</strong> {ex.duration}</p>
                          </ItemCard>
                        ))}
                      </div>
                      <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                  </TabsContent>
                  <TabsContent value="mindfulness" className="mt-2">
                     <ScrollArea className="w-full whitespace-nowrap rounded-md">
                      <div className="flex space-x-1.5 sm:space-x-2 pb-2 sm:pb-2.5">
                        {wellnessPlan.mindfulness.map((mind: Mindfulness, index: number) => (
                          <ItemCard key={`mind-${index}`} className="bg-card">
                            <h5 className="font-semibold text-2xs sm:text-xs mb-0.5 flex items-center"><CalendarIcon className="h-2.5 w-2.5 mr-1 text-muted-foreground" /> {mind.day}</h5>
                            <p className="text-3xs xs:text-2xs break-words whitespace-normal"><strong>Practice:</strong> {mind.practice}</p>
                            <p className="text-3xs xs:text-2xs break-words whitespace-normal"><strong>Duration:</strong> {mind.duration}</p>
                          </ItemCard>
                        ))}
                      </div>
                      <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}

          <Card className="neumorphic">
            <CardHeader className="px-3 py-2 sm:px-4 sm:py-2.5">
                <CardTitle className="flex items-center justify-between text-sm sm:text-base">
                    <span className="flex items-center gap-1 sm:gap-1.5 text-primary">
                      <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Mood Trends (Last 30)
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent className="px-1 py-2.5 sm:px-2 sm:pb-3 h-[180px] sm:h-[200px]">
                {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
                        <XAxis dataKey="date" tick={{ fontSize: '10px', fill: 'hsl(var(--muted-foreground))' }} axisLine={{ stroke: 'hsl(var(--border))' }} tickLine={{ stroke: 'hsl(var(--border))' }} />
                        <YAxis domain={[0.5, 5.5]} tickCount={5} tickFormatter={(value) => ['😞','😕','😐','🙂','😊'][value-1] || ''} tick={{ fontSize: '12px', fill: 'hsl(var(--muted-foreground))' }} axisLine={{ stroke: 'hsl(var(--border))' }} tickLine={{ stroke: 'hsl(var(--border))' }} />
                        <RechartsTooltip
                        contentStyle={{
                            backgroundColor: 'hsl(var(--popover))',
                            borderColor: 'hsl(var(--border))',
                            borderRadius: 'var(--radius)',
                            fontSize: '12px',
                            color: 'hsl(var(--popover-foreground))',
                            boxShadow: 'var(--neumorphic-shadow-light)'
                        }}
                        labelStyle={{ fontWeight: 'bold', color: 'hsl(var(--primary))' }}
                        itemStyle={{ color: 'hsl(var(--foreground))' }}
                        formatter={(value, name, props) => [`${props.payload.moodEmoji}`, 'Mood']}
                        />
                        <Line type="monotone" dataKey="moodValue" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3, fill: 'hsl(var(--primary))' }} activeDot={{ r: 5, fill: 'hsl(var(--accent))', stroke: 'hsl(var(--primary))' }} />
                    </LineChart>
                </ResponsiveContainer>
                ) : <p className="text-center text-muted-foreground text-xs pt-10">Not enough mood data to show a trend yet.</p>}
            </CardContent>
          </Card>

        </div>

        <div className="space-y-4 sm:space-y-6">
           <Card className="neumorphic">
            <CardHeader className="px-3 py-2 sm:px-4 sm:py-2.5">
              <CardTitle className="flex items-center justify-between text-sm sm:text-base">
                <span className="flex items-center gap-1 sm:gap-1.5 text-primary">
                  <Smile className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Vibe Check!
                </span>
                <Dialog open={isMoodDialogOpen} onOpenChange={setIsMoodDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="neumorphic-button text-3xs px-1.5 h-6 sm:h-7 sm:text-2xs sm:px-2">
                            <Plus className="h-2.5 w-2.5 sm:h-3 sm:w-3"/> Log Mood
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="neumorphic max-w-[90vw] xs:max-w-sm">
                        <DialogHeader>
                            <DialogTitle className="text-sm sm:text-base">How You Feelin&apos;?</DialogTitle>
                            <DialogDescription className="text-2xs sm:text-xs">Log your current mood. Add notes or a selfie if you like!</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-3 py-2">
                            <div className="flex justify-around">
                                {["😊", "🙂", "😐", "😕", "😞"].map(mood => (
                                    <button key={mood} onClick={() => setSelectedMood(mood)} className={cn("text-3xl sm:text-4xl p-1 rounded-md transition-all", selectedMood === mood ? 'bg-primary/20 scale-110 ring-2 ring-primary' : 'hover:bg-muted/50 hover:scale-105')}>
                                        {mood}
                                    </button>
                                ))}
                            </div>
                            <Textarea placeholder="Any deets? (Optional)" value={moodNotes} onChange={e => setMoodNotes(e.target.value)} className="min-h-[40px] text-xs sm:text-sm" />
                            {isCameraOpen && (
                            <div className="space-y-2">
                                <div className="relative w-full aspect-video bg-muted rounded-md neumorphic-inset-sm overflow-hidden">
                                    {selfieDataUri ? (
                                        <Image src={selfieDataUri} alt="Selfie preview" fill style={{ objectFit: 'cover' }} data-ai-hint="selfie preview" />
                                    ) : (
                                        <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
                                    )}
                                    <canvas ref={canvasRef} className="hidden"></canvas>
                                </div>
                                <div className="flex gap-2">
                                {selfieDataUri ? (
                                    <Button onClick={() => { setSelfieDataUri(undefined); startCamera(); }} className="w-full neumorphic-button text-xs" variant="outline">Retake</Button>
                                ) : (
                                    <Button onClick={capturePhoto} className="w-full neumorphic-button text-xs" variant="outline">Capture</Button>
                                )}
                                <Button onClick={() => { stopCamera(); setIsCameraOpen(false); setSelfieDataUri(undefined); }} className="w-full neumorphic-button text-xs" variant="outline">Cancel</Button>
                                </div>
                            </div>
                            )}
                            {!isCameraOpen && !selfieDataUri && (
                                <Button onClick={() => { setIsCameraOpen(true); startCamera();}} variant="outline" className="w-full neumorphic-button text-xs"><Camera className="mr-1.5 h-3 w-3"/> Take Selfie (Optional)</Button>
                            )}
                            {selfieDataUri && !isCameraOpen && (
                                 <Button onClick={() => { setIsCameraOpen(true); startCamera();}} variant="outline" className="w-full neumorphic-button text-xs"><Edit3 className="mr-1.5 h-3 w-3"/> Change Selfie</Button>
                            )}
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => {setIsMoodDialogOpen(false); stopCamera(); setSelectedMood(''); setMoodNotes(''); setSelfieDataUri(undefined); setIsCameraOpen(false);}} className="neumorphic-button text-xs sm:text-sm h-8 sm:h-9" disabled={isSubmittingMood}>Cancel</Button>
                            <Button onClick={handleMoodSubmit} disabled={!selectedMood || isSubmittingMood} className="neumorphic-button-primary text-xs sm:text-sm h-8 sm:h-9">
                                {isSubmittingMood && <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />} Log My Vibe!
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pt-0 pb-2.5 sm:px-4 sm:pb-3">
              {moodLogs.length === 0 ? (
                <p className="text-center text-muted-foreground text-xs py-4">No mood logs yet. Tap the `+` to add one!</p>
              ) : (
                <ScrollArea className="h-[180px] sm:h-[200px] w-full">
                    <div className="space-y-2 pr-1">
                    {moodLogs.slice(0, 10).map(log => (
                        <div key={log.id} className="neumorphic-sm p-2 rounded-md flex items-start gap-2">
                        {log.selfieDataUri && (
                            <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-md overflow-hidden neumorphic-inset-sm shrink-0">
                            <Image src={log.selfieDataUri} alt={`Selfie ${log.mood}`} fill style={{objectFit: 'cover'}} data-ai-hint="selfie photo"/>
                            </div>
                        )}
                        <div className="flex-grow min-w-0">
                            <div className="flex justify-between items-start">
                            <span className="text-xl sm:text-2xl">{log.mood}</span>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive"><Trash2 className="h-3 w-3"/></Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="neumorphic">
                                <AlertDialogHeader><AlertDialogTitle>Delete Mood Log?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel className="neumorphic-button">Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteMoodLog(log.id)} className="neumorphic-button-primary bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                                </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                            </div>
                            <p className="text-3xs text-muted-foreground">{format(parseISO(log.date), "MMM d, h:mma")}</p>
                            {log.notes && <p className="text-2xs sm:text-xs mt-1 truncate" title={log.notes}>{log.notes}</p>}
                            {log.aiFeedback && <p className="text-2xs sm:text-xs mt-1 italic text-primary/80 truncate" title={log.aiFeedback}><Sparkles className="h-3 w-3 inline-block mr-0.5 text-accent"/>{log.aiFeedback}</p>}
                        </div>
                        </div>
                    ))}
                    </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

           <Card className="neumorphic">
            <CardHeader className="px-3 py-2 sm:px-4 sm:py-2.5">
              <CardTitle className="flex items-center justify-between text-sm sm:text-base">
                <span className="flex items-center gap-1 sm:gap-1.5 text-primary">
                  <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Grocery Haul
                </span>
                 <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateGroceryList}
                    disabled={isLoadingGroceryList || !wellnessPlan}
                    className="neumorphic-button text-3xs px-1.5 h-6 sm:h-7 sm:text-2xs sm:px-2"
                  >
                    {isLoadingGroceryList ? <Loader2 className="h-3 w-3 animate-spin"/> : <RefreshCw className="h-3 w-3"/>} Gen List
                  </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pt-0 pb-2.5 sm:px-4 sm:pb-3">
              {isLoadingGroceryList && <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>}
              {!isLoadingGroceryList && !groceryList?.items?.length && (
                <p className="text-center text-muted-foreground text-xs py-4">
                  {wellnessPlan ? "Click 'Gen List' to create a shopping list from your meal plan!" : "Generate a wellness plan first to create a grocery list."}
                </p>
              )}
              {!isLoadingGroceryList && groceryList?.items?.length && (
                <ScrollArea className="h-[180px] sm:h-[200px] w-full">
                  <div className="space-y-1.5 pr-1">
                    {Object.entries(groupedGroceryItems).map(([category, items]) => (
                      <div key={category}>
                        <h4 className="text-xs font-semibold text-muted-foreground mt-1 mb-0.5">{category}</h4>
                        <ul className="space-y-0.5">
                          {items.map(item => (
                            <li key={item.id} className="text-2xs sm:text-xs flex justify-between items-center neumorphic-inset-sm p-1 rounded">
                              <span className="truncate max-w-[85%]">
                                {item.name}
                                {item.quantity && <span className="text-muted-foreground text-3xs"> ({item.quantity})</span>}
                                {item.notes && <em className="text-muted-foreground text-3xs block truncate"> - {item.notes}</em>}
                              </span>
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteGroceryItem(item.id)} className="h-5 w-5 shrink-0 text-muted-foreground hover:text-destructive"><Trash2 className="h-3 w-3"/></Button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isSummaryDialogOpen} onOpenChange={setIsSummaryDialogOpen}>
         <DialogContent className="neumorphic max-w-md">
            <DialogHeader>
                <DialogTitle className="text-center text-lg text-primary flex items-center justify-center gap-2">
                    <PartyPopper className="h-6 w-6 text-accent"/> Daily Quest Recap!
                </DialogTitle>
                <DialogDescription className="text-center text-muted-foreground text-sm">
                    {mockDailySummary ? format(parseISO(mockDailySummary.date), "eeee, MMMM do") : "Recap"}
                </DialogDescription>
            </DialogHeader>
            {mockDailySummary ? (
                <div className="space-y-3 py-3">
                    <div className="flex justify-around text-center">
                        <div>
                            <p className="text-2xl font-bold text-primary">{mockDailySummary.questsCompleted}/{mockDailySummary.totalQuests}</p>
                            <p className="text-xs text-muted-foreground">Quests Done</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-primary">+{mockDailySummary.xpGained}</p>
                            <p className="text-xs text-muted-foreground">XP Earned</p>
                        </div>
                         <div>
                            <p className="text-2xl font-bold text-primary">{mockDailySummary.activityScore || 0}%</p>
                            <p className="text-xs text-muted-foreground">Activity Score</p>
                        </div>
                    </div>
                    {mockDailySummary.streakContinued && (
                        <p className="text-center text-sm text-primary flex items-center justify-center gap-1">
                            <Flame className="h-4 w-4 text-accent" /> Streak Continued! Keep it up!
                        </p>
                    )}
                    {mockDailySummary.badgesEarned.length > 0 && (
                        <div className="text-center">
                            <h4 className="text-sm font-semibold text-primary mb-1">Badges Unlocked!</h4>
                            <div className="flex flex-wrap justify-center gap-2">
                                {mockDailySummary.badgesEarned.map(badge => (
                                    <TooltipProvider key={badge.id}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div className="p-2 neumorphic-sm rounded-md bg-card animate-badge-pop">
                                                    {badge.iconName === 'Medal' ? <Medal className="h-8 w-8 text-accent" /> : <Flame className="h-8 w-8 text-accent" />}
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent className="neumorphic-sm text-xs">
                                                <p className="font-bold">{badge.name}</p>
                                                <p>{badge.description}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                ))}
                            </div>
                        </div>
                    )}
                    <p className="text-xs text-muted-foreground text-center pt-2">You crushed it today! Keep that awesome momentum going!</p>
                </div>
            ) : (
                <p className="text-center text-muted-foreground py-4">No summary data available yet.</p>
            )}
             <DialogFooter>
                <Button onClick={() => setIsSummaryDialogOpen(false)} className="neumorphic-button w-full">Got It!</Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
    </main>
  );
};

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Logo size="text-xl sm:text-2xl" />
        <Loader2 className="mt-4 h-5 w-5 sm:h-6 sm:w-6 animate-spin text-primary" />
      </div>
    );
  }
  return <DashboardContent />;
}



"use client";

import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import SocialShareCard from '@/components/social-share-card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Loader2, Utensils, Dumbbell, Brain, Smile, ShoppingCart, CalendarDays as CalendarIcon, Camera, Trash2, LogOut, Settings, Trophy, Plus, Sparkles, Target, CheckCircle, BarChart3, Users, RefreshCw, X, UserCircle, PartyPopper, ThumbsUp, Flame, BookOpen, Paintbrush, FerrisWheel, Briefcase, Coffee, Award as AwardIcon, Medal, Info, Palette, Edit3, Sparkle, Wand2, Clock, CircleDashed, ChevronLeft, ChevronRight } from 'lucide-react';
import type { MoodLog, GroceryItem, ChartMoodLog, Quest as ScheduledQuestType, QuestType, DailySummary, Badge as BadgeType, RawTask } from '@/types/wellness'; // Renamed Quest to ScheduledQuestType
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
  wellness: AwardIcon, creative: Palette, social: Users, break: Coffee, other: FerrisWheel, 
};

// Component to handle client-side rendering safely
const DashboardContent: React.FC = () => {
  const router = useRouter();
  const { 
    currentUser, isLoadingAuth, isPlanAvailable, isOnboardedState, wellnessPlan, 
    moodLogs, addMoodLog, deleteMoodLog, groceryList, isLoadingGroceryList, 
    generateGroceryList, deleteGroceryItem, logoutUser, userActiveChallenge, 
    isLoadingUserChallenge, joinCurrentChallenge, logChallengeDay, currentUserProfile, 
    updateUserDisplayName,
    // AI Daily Scheduling
    selectedDateForPlanning, setSelectedDateForPlanning, rawTasksForSelectedDate,
    scheduledQuestsForSelectedDate, scheduledBreaksForSelectedDate, aiDailySummaryMessage,
    isLoadingSchedule, addRawTask, updateRawTask, deleteRawTask,
    generateQuestScheduleForSelectedDate, completeQuestInSchedule
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
  const aiFeedbackCardRef = useRef<HTMLDivElement>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const questCardRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
  const xpBarRef = useRef<HTMLDivElement>(null);

  const [mockQuests, setMockQuests] = useState<ScheduledQuestType[]>([]); // Using ScheduledQuestType
  const [mockUserXP, setMockUserXP] = useState(0);
  const [mockUserLevel, setMockUserLevel] = useState(1);
  const [mockXPToNextLevel, setMockXPToNextLevel] = useState(250); 
  const [mockDailyStreak, setMockDailyStreak] = useState(0);
  const [mockBestStreak, setMockBestStreak] = useState(0);
  const [mockDailySummary, setMockDailySummary] = useState<DailySummary | null>(null);

  // State for Raw Task Input
  const [currentRawTaskDesc, setCurrentRawTaskDesc] = useState('');
  const [currentRawTaskDuration, setCurrentRawTaskDuration] = useState<string>('');
  const [currentRawTaskPriority, setCurrentRawTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [currentRawTaskType, setCurrentRawTaskType] = useState<QuestType>('other');
  const [isAddingRawTask, setIsAddingRawTask] = useState(false);
  const [userScheduleContext, setUserScheduleContext] = useState('');


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
      // Potentially pre-fill userScheduleContext from profile if we store it
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

  const startCamera = useCallback(async () => { /* ... (existing camera logic) ... */ }, []);
  const stopCamera = useCallback(() => { /* ... (existing camera logic) ... */ }, []);
  const capturePhoto = useCallback(() => { /* ... (existing camera logic) ... */ }, [stopCamera]);
  const handleMoodSubmit = async () => { /* ... (existing mood submit logic) ... */ };
  const handleDeleteMoodLog = async (logId: string) => { /* ... (existing mood delete logic) ... */ };
  const handleGenerateGroceryList = async () => { /* ... (existing grocery list logic) ... */ };
  const handleDeleteGroceryItem = async (itemId: string) => { /* ... (existing grocery item delete logic) ... */ };
  const handleUpdateDisplayName = async () => { /* ... (existing display name update logic) ... */ };

  const handleAddRawTask = async () => {
    if (!currentRawTaskDesc.trim()) {
      toast({ variant: "destructive", title: "Task Empty", description: "Please describe your task." });
      return;
    }
    setIsAddingRawTask(true);
    const taskData: Omit<RawTask, 'id'> = {
      description: currentRawTaskDesc.trim(),
      durationMinutes: currentRawTaskDuration ? parseInt(currentRawTaskDuration, 10) : undefined,
      priority: currentRawTaskPriority,
      questType: currentRawTaskType,
    };
    await addRawTask(taskData);
    setCurrentRawTaskDesc('');
    setCurrentRawTaskDuration('');
    setIsAddingRawTask(false);
  };

  const handleGenerateSchedule = async () => {
    await generateQuestScheduleForSelectedDate(userScheduleContext);
  };

  const handleCompleteQuest = async (questId: string) => {
    // Animate card first
    const cardRef = questCardRefs.current.get(questId);
    if (cardRef) {
      cardRef.classList.add('animate-ripple'); // You'll need to define this animation
      setTimeout(() => cardRef.classList.remove('animate-ripple'), 700);
    }
    await completeQuestInSchedule(questId); // Then call context function
    // Future: update mockUserXP and level based on actual XP from completed quest
  };
  
  const handleViewDailySummary = () => {
     // This will be driven by actual scheduledQuests and their completion status later
    const completedToday = scheduledQuestsForSelectedDate.filter(q => q.notes?.includes("(Completed!)")); // Placeholder logic
    const totalToday = scheduledQuestsForSelectedDate.length;
    const xpGainedToday = completedToday.reduce((sum, q) => sum + q.xp, 0);
    
    let earnedBadges: BadgeType[] = []; // Placeholder
    if (completedToday.length >= 2 && !localStorage.getItem('badge_quick_achiever_earned_v2')) {
      earnedBadges.push({id: 'b1', name: 'Quick Achiever!', description: 'Completed 2 quests today!', iconName: 'Medal'});
      localStorage.setItem('badge_quick_achiever_earned_v2', 'true'); 
    }

    setMockDailySummary({
      date: format(selectedDateForPlanning, 'yyyy-MM-dd'),
      questsCompleted: completedToday.length,
      totalQuests: totalToday,
      xpGained: xpGainedToday,
      badgesEarned: earnedBadges,
      streakContinued: mockDailyStreak > 0, 
    });
    setIsSummaryDialogOpen(true);
  };

  const chartData: ChartMoodLog[] = moodLogs.filter(log => moodToValue[log.mood] !== undefined).slice(0, 30)
    .map(log => ({ date: format(parseISO(log.date), 'MMM d'), moodValue: moodToValue[log.mood], moodEmoji: log.mood, fullDate: log.date, }))
    .reverse();
  const moodLogsWithSelfies = moodLogs.filter(log => log.selfieDataUri);
  const beforeLog = moodLogsWithSelfies.length > 1 ? moodLogsWithSelfies[moodLogsWithSelfies.length - 1] : null;
  const afterLog = moodLogsWithSelfies.length > 0 ? moodLogsWithSelfies[0] : null;
  const groupedGroceryItems = groceryList?.items.reduce((acc, item) => {
    const category = item.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {} as Record<string, GroceryItem[]>) || {};
  const challengeProgress = userActiveChallenge ? Math.round((userActiveChallenge.daysCompleted / CURRENT_CHALLENGE.durationDays) * 100) : 0;
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const hasLoggedToday = userActiveChallenge?.completedDates.includes(todayStr) || false;

  if (!isMounted || isLoadingAuth || (!currentUser && !isLoadingAuth) || (currentUser && !isOnboardedState && !isLoadingAuth)) {
    return ( /* ... (existing loading screen) ... */ );
  }
  if (!isPlanAvailable && scheduledQuestsForSelectedDate.length === 0 && rawTasksForSelectedDate.length === 0) { 
    return ( /* ... (existing no plan screen, maybe adapt to "no quests for today") ... */ );
  }
  
  const QuestIcon = ({ type }: { type: QuestType }) => {
    const IconComponent = questTypeIcons[type] || Info; 
    return <IconComponent className="h-3.5 w-3.5 text-muted-foreground group-hover:text-accent transition-colors" />;
  };

  const displayedQuests = useMemo(() => {
    return [...scheduledQuestsForSelectedDate, ...scheduledBreaksForSelectedDate]
        .sort((a, b) => {
            const timeA = parseInt(a.startTime.replace(':', ''), 10);
            const timeB = parseInt(b.startTime.replace(':', ''), 10);
            return timeA - timeB;
        });
  }, [scheduledQuestsForSelectedDate, scheduledBreaksForSelectedDate]);


  return (
    <main className="container mx-auto p-3 sm:p-4 md:p-6">
      {/* ... (AI Feedback Card and Header remain largely the same) ... */}
       <header className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Logo size="text-xl sm:text-2xl" />
          <span className="text-sm sm:text-md font-semibold text-primary">Dashboard</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-1.5 mt-2 sm:mt-0">
          {/* ... (Leaderboard, Settings, Logout buttons) ... */}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* ... (Profile Card, Daily Quest Streak Card) ... */}
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
                    Hey {currentUserProfile?.displayName || 'GroZen User'}! Let's Rock Today! 👋
                  </CardTitle>
                  <CardDescription className="text-2xs sm:text-xs">
                    Level {mockUserLevel}  |  XP: {mockUserXP} / {mockXPToNextLevel}
                  </CardDescription>
                </div>
              </div>
              <div ref={xpBarRef}>
                 <ShadProgress value={(mockUserXP / mockXPToNextLevel) * 100} className="h-2 sm:h-2.5" indicatorClassName="progress-bar-fill" />
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
                                            i < mockDailyStreak ? "bg-primary" : "bg-muted/30"
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

           {/* AI Daily Schedule Section */}
          <Card className="neumorphic">
            <CardHeader className="px-3 py-2 sm:px-4 sm:py-2.5 flex-col xs:flex-row items-start xs:items-center justify-between gap-2">
              <div className="flex-1">
                <CardTitle className="text-sm sm:text-base text-primary flex items-center">
                  <Sparkle className="h-4 w-4 mr-1.5 text-accent"/> AI Quest Planner
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

            {/* Raw Task Input Area */}
            <CardContent className="px-3 pt-2 pb-2.5 sm:px-4 sm:pb-3 border-t border-border/50">
              <div className="space-y-2 mb-3">
                <Label htmlFor="rawTaskDesc" className="text-xs text-muted-foreground">New Task / Goal for {format(selectedDateForPlanning, "MMM d")}:</Label>
                <Textarea 
                  id="rawTaskDesc" 
                  placeholder="e.g., Finish math homework, 30 min jog, Call grandma" 
                  value={currentRawTaskDesc}
                  onChange={(e) => setCurrentRawTaskDesc(e.target.value)}
                  className="min-h-[40px] text-sm"
                />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Input 
                    type="number" 
                    placeholder="Mins (opt.)" 
                    value={currentRawTaskDuration} 
                    onChange={(e) => setCurrentRawTaskDuration(e.target.value)}
                    className="h-8 text-xs"
                  />
                  <select 
                    value={currentRawTaskPriority} 
                    onChange={(e) => setCurrentRawTaskPriority(e.target.value as 'low'|'medium'|'high')}
                    className="h-8 text-xs neumorphic-inset-sm rounded-md px-2 py-1 bg-input border border-input"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                  <select 
                    value={currentRawTaskType} 
                    onChange={(e) => setCurrentRawTaskType(e.target.value as QuestType)}
                    className="h-8 text-xs neumorphic-inset-sm rounded-md px-2 py-1 bg-input border border-input"
                  >
                    {Object.keys(questTypeIcons).map(type => (
                      <option key={type} value={type} className="capitalize">{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <Button onClick={handleAddRawTask} disabled={isAddingRawTask || !currentRawTaskDesc.trim()} className="w-full sm:w-auto neumorphic-button-primary h-8 text-xs">
                  {isAddingRawTask ? <Loader2 className="h-3 w-3 animate-spin"/> : <Plus className="h-3 w-3"/>} Add to List
                </Button>
              </div>

              {rawTasksForSelectedDate.length > 0 && (
                <div className="mb-3 space-y-1.5">
                  <h4 className="text-xs font-semibold text-muted-foreground">Your Tasks for {format(selectedDateForPlanning, "MMM d")}:</h4>
                  <ScrollArea className="h-[100px] w-full neumorphic-inset-sm p-2 rounded-md">
                    {rawTasksForSelectedDate.map(task => (
                      <div key={task.id} className="text-xs flex justify-between items-center py-0.5">
                        <span>{task.description} {task.durationMinutes ? `(${task.durationMinutes}m)` : ''} - {task.questType}</span>
                        <Button variant="ghost" size="icon" onClick={() => deleteRawTask(task.id)} className="h-5 w-5"><Trash2 className="h-3 w-3"/></Button>
                      </div>
                    ))}
                  </ScrollArea>
                  <Textarea 
                    placeholder="Any special notes for AI? (e.g., I have an appointment at 2 PM, prefer workouts in evening)"
                    value={userScheduleContext}
                    onChange={(e) => setUserScheduleContext(e.target.value)}
                    className="min-h-[40px] text-xs mt-1"
                  />
                  <Button onClick={handleGenerateSchedule} disabled={isLoadingSchedule} className="w-full neumorphic-button-primary h-9 text-sm mt-1">
                    {isLoadingSchedule ? <Loader2 className="h-4 w-4 animate-spin"/> : <Wand2 className="h-4 w-4"/>} AI, Plan My Quests!
                  </Button>
                </div>
              )}
            </CardContent>

            {/* Display AI Generated Quests */}
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
              <Button variant="outline" size="sm" onClick={handleViewDailySummary} className="neumorphic-button text-3xs h-6 sm:h-7">
                  Daily Recap
              </Button>
            </CardHeader>
            <CardContent className="px-3 pt-0 pb-2.5 sm:px-4 sm:pb-3">
              {isLoadingSchedule && <div className="flex items-center justify-center py-4"><Loader2 className="h-5 w-5 animate-spin mr-2" /> <p className="text-sm text-muted-foreground">AI is crafting your schedule...</p></div>}
              {!isLoadingSchedule && displayedQuests.length === 0 && rawTasksForSelectedDate.length === 0 && <p className="text-2xs sm:text-xs text-muted-foreground text-center py-4">Add some tasks above and let AI plan your quests!</p>}
              {!isLoadingSchedule && displayedQuests.length === 0 && rawTasksForSelectedDate.length > 0 && <p className="text-2xs sm:text-xs text-muted-foreground text-center py-4">Click "AI, Plan My Quests!" to generate your schedule.</p>}

              {displayedQuests.length > 0 ? (
                <ScrollArea className="h-[250px] sm:h-[300px] w-full">
                  <div className="space-y-2 sm:space-y-2.5 pr-1">
                    {displayedQuests.map((item) => {
                       const isBreak = 'suggestion' in item; // Type guard
                       const quest = isBreak ? null : item as ScheduledQuestType;
                       const breakItem = isBreak ? item as BreakSlot : null;
                       const itemId = item.id;

                       return (
                          <div
                            key={itemId}
                            ref={el => questCardRefs.current.set(itemId, el)}
                            className={cn(
                                "neumorphic-sm p-2 sm:p-2.5 rounded-md group quest-card-ripple", 
                                (quest?.notes?.includes("(Completed!)") || breakItem?.suggestion?.includes("(Taken!)")) && "opacity-60 bg-card/50"
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
                                {quest && <QuestIcon type={quest.questType} />}
                                {breakItem && <Coffee className="h-3.5 w-3.5 text-muted-foreground group-hover:text-accent transition-colors" />}
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs sm:text-sm font-medium truncate text-foreground">
                                        {quest ? quest.title : breakItem?.suggestion || "Quick Break"}
                                    </p>
                                    <p className="text-2xs sm:text-xs text-muted-foreground">
                                      {item.startTime} - {item.endTime} 
                                      {quest && ` | XP: ${quest.xp}`}
                                      {breakItem && breakItem.xp ? ` | XP: ${breakItem.xp}`: ''}
                                    </p>
                                    {quest?.notes && !quest.notes.includes("(Completed!)") && <p className="text-3xs text-primary/80 italic pt-0.5">{quest.notes}</p>}
                                </div>
                              </div>
                              {!(quest?.notes?.includes("(Completed!)") || breakItem?.suggestion?.includes("(Taken!)")) ? (
                                <Button
                                  variant="neumorphic-primary"
                                  size="sm"
                                  onClick={() => handleCompleteQuest(itemId)} // Simplified
                                  className="text-3xs px-1.5 h-6 sm:h-7 sm:text-2xs sm:px-2"
                                >
                                  {isBreak ? "Done!" : "Complete"}
                                </Button>
                              ) : (
                                <CheckCircle className="h-5 w-5 text-green-400" />
                              )}
                            </div>
                          </div>
                       );
                    })}
                  </div>
                </ScrollArea>
              ) : null}
            </CardContent>
          </Card>


          {/* ... (Challenge Card, Wellness Plan Tabs, Mood Chart) ... */}
          {/* These would remain largely the same as before, but might be moved or condensed if space is an issue */}
        </div>

        <div className="space-y-4 sm:space-y-6">
          {/* ... (Mood Logging, Grocery Haul, Social Share Card) ... */}
           <Card className="neumorphic">
            <CardHeader className="px-3 py-2 sm:px-4 sm:py-2.5">
              <CardTitle className="flex items-center justify-between text-sm sm:text-base">
                <span className="flex items-center gap-1 sm:gap-1.5 text-primary">
                  <Smile className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Vibe Check!
                </span>
                {/* ... Mood Dialog Trigger ... */}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pt-0 pb-2.5 sm:px-4 sm:pb-3">
              {/* ... Mood Logs Display ... */}
            </CardContent>
          </Card>
           <Card className="neumorphic">
            <CardHeader className="px-3 py-2 sm:px-4 sm:py-2.5">
              <CardTitle className="flex items-center justify-between text-sm sm:text-base">
                <span className="flex items-center gap-1 sm:gap-1.5 text-primary">
                  <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Grocery Haul
                </span>
                 {/* ... Grocery List Generate Button ... */}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pt-0 pb-2.5 sm:px-4 sm:pb-3">
               {/* ... Grocery List Display ... */}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isSummaryDialogOpen} onOpenChange={setIsSummaryDialogOpen}>
        {/* ... (Daily Summary Dialog Content - uses mockDailySummary for now) ... */}
      </Dialog>
    </main>
  );
};

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) { /* ... (loading screen) ... */ }
  return <DashboardContent />;
}

    
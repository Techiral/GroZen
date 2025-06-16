
"use client";

import React, { useEffect, useState, useRef, useCallback } from 'react';
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
import { Loader2, Utensils, Dumbbell, Brain, Smile, ShoppingCart, CalendarDays, Camera, Trash2, LogOut, Settings, Trophy, Plus, Sparkles, Target, CheckCircle, BarChart3, Users, RefreshCw, X, UserCircle, PartyPopper, ThumbsUp, Flame, BookOpen, Paintbrush, FerrisWheel, Briefcase, Coffee, Award as AwardIcon, Medal, Info, Palette } from 'lucide-react'; // Added Palette
import type { MoodLog, GroceryItem, ChartMoodLog, Quest, QuestType, DailySummary, Badge as BadgeType } from '@/types/wellness';
import { format, parseISO, isToday, subDays, startOfDay, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { CURRENT_CHALLENGE } from '@/config/challenge';
import anime from 'animejs';
import { useToast } from '@/hooks/use-toast';


// Mood emoji to numeric value mapping for chart
const moodToValue: { [key: string]: number } = {
  "😞": 1, // Very sad
  "😕": 2, // Worried/upset
  "😐": 3, // Neutral
  "🙂": 4, // Okay/content
  "😊": 5, // Happy
};

const ItemCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={cn("neumorphic-sm p-2 sm:p-2.5 rounded-md min-w-[160px] xs:min-w-[180px] sm:min-w-[200px] md:min-w-[220px] snap-start", className)}>
    {children}
  </div>
);

const questTypeIcons: Record<QuestType, React.ElementType> = {
  study: BookOpen,
  workout: Dumbbell,
  hobby: Paintbrush,
  chore: Briefcase, 
  wellness: AwardIcon, 
  creative: Palette, 
  social: Users,
  break: Coffee,
  other: FerrisWheel, 
};


// Component to handle client-side rendering safely
const DashboardContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { 
    currentUser, 
    isLoadingAuth, 
    isPlanAvailable, 
    isOnboardedState, 
    wellnessPlan, 
    moodLogs, 
    addMoodLog, 
    deleteMoodLog,
    groceryList,
    isLoadingGroceryList,
    generateGroceryList,
    deleteGroceryItem,
    logoutUser,
    userActiveChallenge,
    isLoadingUserChallenge,
    joinCurrentChallenge,
    logChallengeDay,
    currentUserProfile, 
    updateUserDisplayName
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


  const [mockQuests, setMockQuests] = useState<Quest[]>([
    { id: 'q1', title: 'Morning Workout: 30 min jog', questType: 'workout', xpValue: 50, isCompleted: false, scheduledDate: format(new Date(), 'yyyy-MM-dd')},
    { id: 'q2', title: 'Study: Read Chapter 5 History', questType: 'study', xpValue: 75, isCompleted: false, scheduledDate: format(new Date(), 'yyyy-MM-dd') },
    { id: 'q3', title: 'Creative Hour: Sketching', questType: 'creative', xpValue: 40, isCompleted: false, scheduledDate: format(new Date(), 'yyyy-MM-dd') },
    { id: 'q4', title: 'Wellness: 10 min meditation', questType: 'wellness', xpValue: 30, isCompleted: true, scheduledDate: format(new Date(), 'yyyy-MM-dd') },
  ]);
  const [mockUserXP, setMockUserXP] = useState(currentUserProfile?.xp || 120);
  const [mockUserLevel, setMockUserLevel] = useState(currentUserProfile?.level || 1);
  const [mockXPToNextLevel, setMockXPToNextLevel] = useState(250); 
  const [mockDailyStreak, setMockDailyStreak] = useState(currentUserProfile?.dailyQuestStreak || 3);
  const [mockBestStreak, setMockBestStreak] = useState(currentUserProfile?.bestQuestStreak || 7);
  const [mockDailySummary, setMockDailySummary] = useState<DailySummary | null>(null);


  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isLoadingAuth) {
      if (!currentUser) {
        router.replace('/login');
      } else if (!isOnboardedState) {
        router.replace('/onboarding');
      }
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
        targets: aiFeedbackCardRef.current,
        opacity: [0, 1],
        translateY: [20, 0],
        scale: [0.95, 1],
        duration: 500,
        easing: 'easeOutExpo',
      });
      const timer = setTimeout(() => setAiFeedbackToDisplay(null), 7000);
      return () => clearTimeout(timer);
    }
  }, [aiFeedbackToDisplay]);


  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' },
        audio: false 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
      setIsCameraOpen(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
    setSelfieDataUri(undefined);
  }, []);

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        const dataUri = canvas.toDataURL('image/jpeg', 0.8);
        setSelfieDataUri(dataUri);
        stopCamera();
      }
    }
  }, [stopCamera]);

  const handleMoodSubmit = async () => {
    if (!selectedMood) return;
    
    setIsSubmittingMood(true);
    try {
      const feedback = await addMoodLog(selectedMood, moodNotes || undefined, selfieDataUri);
      if (feedback && typeof feedback === 'string') {
        setAiFeedbackToDisplay(feedback);
      }
      setSelectedMood('');
      setMoodNotes('');
      setSelfieDataUri(undefined);
      setIsMoodDialogOpen(false);
    } catch (error) {
      console.error('Error submitting mood:', error);
    } finally {
      setIsSubmittingMood(false);
    }
  };

  const handleDeleteMoodLog = async (logId: string) => {
    await deleteMoodLog(logId);
  };

  const handleGenerateGroceryList = async () => {
    if (wellnessPlan) {
      await generateGroceryList(wellnessPlan);
    }
  };

  const handleDeleteGroceryItem = async (itemId: string) => {
    await deleteGroceryItem(itemId);
  };

  const handleUpdateDisplayName = async () => {
    if (!newDisplayName.trim()) return;
    
    setIsUpdatingName(true);
    try {
      await updateUserDisplayName(newDisplayName.trim());
      setIsSettingsDialogOpen(false);
    } catch (error) {
      console.error('Error updating display name:', error);
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleCompleteQuest = (questId: string) => {
    const questToComplete = mockQuests.find(q => q.id === questId);
    if (!questToComplete || questToComplete.isCompleted) return;

    setMockQuests(prevQuests =>
      prevQuests.map(q => (q.id === questId ? { ...q, isCompleted: true } : q))
    );
    
    const newXP = mockUserXP + questToComplete.xpValue;
    setMockUserXP(newXP);

    if (xpBarRef.current) {
        const progressTo = (newXP / mockXPToNextLevel) * 100;
        anime({
            targets: xpBarRef.current.querySelector('.progress-bar-fill > div'),
            width: `${Math.min(100, progressTo)}%`, 
            duration: 800,
            easing: 'easeOutQuint'
        });
    }


    if (newXP >= mockXPToNextLevel) {
      setMockUserLevel(prevLevel => prevLevel + 1);
      setMockUserXP(newXP - mockXPToNextLevel); 
      setMockXPToNextLevel(prev => prev + 100); 
      toast({title: "LEVEL UP! 🎉", description: `You reached Level ${mockUserLevel + 1}!`});
    }
    
    const cardRef = questCardRefs.current.get(questId);
    if (cardRef) {
      cardRef.classList.add('animate-ripple');
      setTimeout(() => cardRef.classList.remove('animate-ripple'), 700);
    }

    const allQuestsCompletedToday = mockQuests.filter(q => isSameDay(parseISO(q.scheduledDate), new Date())).every(q => q.isCompleted || q.id === questId);
    if(allQuestsCompletedToday) {
        setMockDailyStreak(prev => prev + 1);
        if (mockDailyStreak + 1 > mockBestStreak) {
            setMockBestStreak(mockDailyStreak + 1);
        }
    }
  };
  
  const handleViewDailySummary = () => {
    const today = new Date();
    const completedToday = mockQuests.filter(q => q.isCompleted && isSameDay(parseISO(q.scheduledDate), today));
    const totalToday = mockQuests.filter(q => isSameDay(parseISO(q.scheduledDate), today));
    const xpGainedToday = completedToday.reduce((sum, q) => sum + q.xpValue, 0);
    
    let earnedBadges: BadgeType[] = [];
    if (completedToday.length >= 2 && !localStorage.getItem('badge_quick_achiever_earned')) {
      earnedBadges.push({id: 'b1', name: 'Quick Achiever!', description: 'Completed 2 quests today!', iconName: 'Medal'});
      localStorage.setItem('badge_quick_achiever_earned', 'true'); 
    }

    setMockDailySummary({
      date: format(today, 'yyyy-MM-dd'),
      questsCompleted: completedToday.length,
      totalQuests: totalToday.length,
      xpGained: xpGainedToday,
      badgesEarned: earnedBadges,
      streakContinued: mockDailyStreak > 0, 
    });
    setIsSummaryDialogOpen(true);
  };


  const chartData: ChartMoodLog[] = moodLogs
    .filter(log => moodToValue[log.mood] !== undefined)
    .slice(0, 30)
    .map(log => ({
      date: format(parseISO(log.date), 'MMM d'),
      moodValue: moodToValue[log.mood],
      moodEmoji: log.mood,
      fullDate: log.date,
    }))
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

  const challengeProgress = userActiveChallenge 
    ? Math.round((userActiveChallenge.daysCompleted / CURRENT_CHALLENGE.durationDays) * 100)
    : 0;

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const hasLoggedToday = userActiveChallenge?.completedDates.includes(todayStr) || false;

  if (!isMounted || isLoadingAuth || (!currentUser && !isLoadingAuth) || (currentUser && !isOnboardedState && !isLoadingAuth)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Logo size="text-xl sm:text-2xl" />
        <Loader2 className="mt-4 h-5 w-5 sm:h-6 sm:w-6 animate-spin text-primary" />
        <p className="mt-2 text-xs sm:text-sm text-muted-foreground">Loading your dashboard...</p>
      </div>
    );
  }

  if (!isPlanAvailable && mockQuests.length === 0) { 
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <Logo size="text-xl sm:text-2xl" />
        <p className="mt-3 text-sm sm:text-base">No wellness plan or quests found. Let's get you set up!</p>
        <Button onClick={() => router.push('/onboarding')} className="mt-3 neumorphic-button-primary text-xs sm:text-sm px-3 py-1.5 h-8 sm:h-9">
          Create My Free Plan!
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
      {aiFeedbackToDisplay && (
        <div 
          ref={aiFeedbackCardRef}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 neumorphic p-4 max-w-xs w-full rounded-lg shadow-xl bg-card border border-primary/50"
          style={{ opacity: 0 }}
        >
          <button 
            onClick={() => setAiFeedbackToDisplay(null)} 
            className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
            aria-label="Close feedback"
          >
            <X size={18} />
          </button>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-accent" />
            <CardTitle className="text-sm font-semibold text-primary">GroZen Insight!</CardTitle>
          </div>
          <CardDescription className="text-xs text-card-foreground">{aiFeedbackToDisplay}</CardDescription>
        </div>
      )}

      <header className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Logo size="text-xl sm:text-2xl" />
          <span className="text-sm sm:text-md font-semibold text-primary">Dashboard</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-1.5 mt-2 sm:mt-0">
          <Button 
            variant="outline" 
            onClick={() => router.push('/leaderboard')} 
            className="neumorphic-button text-2xs sm:text-xs px-2 py-1 sm:px-2.5 sm:py-1.5 h-7 sm:h-8 group"
            aria-label="View Leaderboard"
          >
            <Trophy className="mr-0.5 h-2.5 w-2.5 sm:h-3 sm:w-3 group-hover:text-accent transition-colors" /> Leaderboard
          </Button>
          
          <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="neumorphic-button text-2xs sm:text-xs px-2 py-1 sm:px-2.5 sm:py-1.5 h-7 sm:h-8 group" aria-label="Settings">
                <Settings className="h-2.5 w-2.5 sm:h-3 sm:w-3 group-hover:animate-spin" style={{ animationDuration: '2s' }} />
              </Button>
            </DialogTrigger>
            <DialogContent className="neumorphic max-w-[90vw] xs:max-w-sm">
              <DialogHeader>
                <DialogTitle className="text-sm sm:text-base text-primary">Settings</DialogTitle>
                <DialogDescription className="text-2xs sm:text-xs">
                  Pimp your profile.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 sm:space-y-4">
                <div className="space-y-1 sm:space-y-1.5">
                  <Label htmlFor="displayName" className="text-2xs sm:text-xs">Display Name</Label>
                  <Input
                    id="displayName"
                    value={newDisplayName}
                    onChange={(e) => setNewDisplayName(e.target.value)}
                    placeholder="Your Epic Name"
                    className="text-xs sm:text-sm h-8 sm:h-9"
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-2.5">
                  <Button 
                    onClick={handleUpdateDisplayName} 
                    disabled={isUpdatingName || !newDisplayName.trim() || newDisplayName.trim() === currentUserProfile?.displayName}
                    className="neumorphic-button-primary text-2xs sm:text-xs px-2.5 py-1 h-7 sm:h-8 flex-1"
                  >
                    {isUpdatingName ? <Loader2 className="mr-1 h-2.5 w-2.5 animate-spin" /> : <CheckCircle className="mr-1 h-3 w-3" />}
                    Save Name
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsSettingsDialogOpen(false)}
                    className="neumorphic-button text-2xs sm:text-xs px-2.5 py-1 h-7 sm:h-8 flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="outline" onClick={logoutUser} className="neumorphic-button text-2xs sm:text-xs px-2 py-1 sm:px-2.5 sm:py-1.5 h-7 sm:h-8 group" aria-label="Logout">
            <LogOut className="mr-0.5 h-2.5 w-2.5 sm:h-3 sm:w-3 group-hover:text-red-500 transition-colors" /> Logout
          </Button>
        </div>
      </header>

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


          <Card className="neumorphic">
            <CardHeader className="px-3 py-2 sm:px-4 sm:py-2.5 flex-row items-center justify-between">
              <CardTitle className="text-sm sm:text-base text-primary flex items-center">
                <Target className="h-4 w-4 mr-1.5 text-accent"/> Today&apos;s Quests
              </CardTitle>
              <Button variant="outline" size="sm" onClick={handleViewDailySummary} className="neumorphic-button text-3xs h-6 sm:h-7">
                  Daily Recap
              </Button>
            </CardHeader>
            <CardContent className="px-3 pt-0 pb-2.5 sm:px-4 sm:pb-3">
              {mockQuests.filter(q => isSameDay(parseISO(q.scheduledDate), new Date())).length > 0 ? (
                <ScrollArea className="h-[250px] sm:h-[300px] w-full">
                  <div className="space-y-2 sm:space-y-2.5 pr-1">
                    {mockQuests.filter(q => isSameDay(parseISO(q.scheduledDate), new Date())).map((quest) => (
                      <div
                        key={quest.id}
                        ref={el => questCardRefs.current.set(quest.id, el)}
                        className={cn(
                            "neumorphic-sm p-2 sm:p-2.5 rounded-md group quest-card-ripple", 
                            quest.isCompleted && "opacity-60 bg-card/50"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
                            <QuestIcon type={quest.questType} />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs sm:text-sm font-medium truncate text-foreground">{quest.title}</p>
                                <p className="text-2xs sm:text-xs text-muted-foreground">XP: {quest.xpValue}</p>
                            </div>
                          </div>
                          {!quest.isCompleted ? (
                            <Button
                              variant="neumorphic-primary"
                              size="sm"
                              onClick={() => handleCompleteQuest(quest.id)}
                              className="text-3xs px-1.5 h-6 sm:h-7 sm:text-2xs sm:px-2"
                            >
                              Complete
                            </Button>
                          ) : (
                            <CheckCircle className="h-5 w-5 text-green-400" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <p className="text-2xs sm:text-xs text-muted-foreground text-center py-4">No quests scheduled for today. Time to add some!</p>
              )}
            </CardContent>
          </Card>


          {userActiveChallenge ? (
            <Card className="neumorphic hover:shadow-accent/20 transition-shadow duration-300">
              <CardHeader className="px-3 py-2 sm:px-4 sm:py-2.5">
                <CardTitle className="flex items-center gap-1 sm:gap-1.5 text-sm sm:text-base text-accent">
                  <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> {CURRENT_CHALLENGE.title}
                </CardTitle>
                <CardDescription className="text-2xs sm:text-xs">
                  {userActiveChallenge.daysCompleted} of {CURRENT_CHALLENGE.durationDays} days CRUSHED!
                </CardDescription>
              </CardHeader>
              <CardContent className="px-3 pt-0 pb-2.5 sm:px-4 sm:pb-3">
                <div className="space-y-2 sm:space-y-2.5">
                  <ShadProgress value={challengeProgress} className="h-2 sm:h-2.5" indicatorClassName="[&>div]:bg-gradient-to-r [&>div]:from-accent [&>div]:to-primary" />
                  <div className="flex justify-between items-center">
                    <span className="text-2xs sm:text-xs text-muted-foreground">{challengeProgress}% Complete! Keep Going!</span>
                    <Button
                      onClick={logChallengeDay}
                      disabled={hasLoggedToday || isLoadingUserChallenge}
                      variant={hasLoggedToday ? "outline" : "neumorphic-primary"}
                      className="text-3xs px-2 py-0.5 h-6 sm:text-2xs sm:px-2.5 sm:py-1 sm:h-7 group"
                    >
                      {isLoadingUserChallenge ? (
                        <Loader2 className="h-2.5 w-2.5 animate-spin" />
                      ) : hasLoggedToday ? (
                        <>
                          <ThumbsUp className="mr-0.5 h-2.5 w-2.5 text-green-400" /> Nailed It!
                        </>
                      ) : (
                        <>
                          <Plus className="mr-0.5 h-2.5 w-2.5 group-hover:rotate-90 transition-transform" /> Log Today's Win!
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
             <Card className="neumorphic hover:shadow-accent/20 transition-shadow duration-300">
              <CardHeader className="px-3 py-2 sm:px-4 sm:py-2.5">
                <CardTitle className="flex items-center gap-1 sm:gap-1.5 text-sm sm:text-base text-accent">
                  <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Join the Current Challenge!
                </CardTitle>
                <CardDescription className="text-2xs sm:text-xs">
                  {CURRENT_CHALLENGE.description} Ready to level up?
                </CardDescription>
              </CardHeader>
              <CardContent className="px-3 pt-0 pb-2.5 sm:px-4 sm:pb-3">
                <Button
                  onClick={joinCurrentChallenge}
                  disabled={isLoadingUserChallenge}
                  className="neumorphic-button-primary text-2xs sm:text-xs px-2.5 py-1 h-7 sm:h-8 group"
                >
                  {isLoadingUserChallenge ? (
                    <Loader2 className="mr-1 h-2.5 w-2.5 animate-spin" />
                  ) : (
                    <>
                      <PartyPopper className="mr-1 h-3 w-3 group-hover:scale-110 transition-transform" /> Join Challenge Now!
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          <Card className="neumorphic">
            <CardHeader className="px-3 py-2 sm:px-4 sm:py-2.5">
              <CardTitle className="flex items-center gap-1 sm:gap-1.5 text-sm sm:text-base text-primary">
                <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Your GroZen Blueprint
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pt-0 pb-2.5 sm:px-4 sm:pb-3">
              <Tabs defaultValue="meals" className="w-full">
                <TabsList className="grid w-full grid-cols-3 h-8 sm:h-9">
                  <TabsTrigger value="meals" className="text-3xs sm:text-2xs data-[state=active]:text-primary data-[state=active]:shadow-accent/30">
                    <Utensils className="mr-0.5 h-2.5 w-2.5" /> Meals
                  </TabsTrigger>
                  <TabsTrigger value="exercise" className="text-3xs sm:text-2xs data-[state=active]:text-primary data-[state=active]:shadow-accent/30">
                    <Dumbbell className="mr-0.5 h-2.5 w-2.5" /> Exercise
                  </TabsTrigger>
                  <TabsTrigger value="mindfulness" className="text-3xs sm:text-2xs data-[state=active]:text-primary data-[state=active]:shadow-accent/30">
                    <Brain className="mr-0.5 h-2.5 w-2.5" /> Mind
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="meals" className="mt-2 sm:mt-2.5">
                  <ScrollArea className="w-full whitespace-nowrap rounded-md">
                    <div className="flex space-x-1.5 sm:space-x-2 pb-2 sm:pb-2.5">
                      {wellnessPlan?.meals.map((meal, index) => (
                        <ItemCard key={`meal-${index}`} className="bg-card hover:scale-105 transition-transform duration-200">
                          <h5 className="font-semibold text-2xs sm:text-xs mb-0.5 flex items-center text-accent">
                            <CalendarDays className="h-2.5 w-2.5 mr-1 text-muted-foreground" /> {meal.day}
                          </h5>
                          <p className="text-3xs xs:text-2xs break-words whitespace-normal"><strong>B:</strong> {meal.breakfast}</p>
                          <p className="text-3xs xs:text-2xs break-words whitespace-normal"><strong>L:</strong> {meal.lunch}</p>
                          <p className="text-3xs xs:text-2xs break-words whitespace-normal"><strong>D:</strong> {meal.dinner}</p>
                        </ItemCard>
                      ))}
                    </div>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                </TabsContent>
                 <TabsContent value="exercise" className="mt-2 sm:mt-2.5">
                  <ScrollArea className="w-full whitespace-nowrap rounded-md">
                    <div className="flex space-x-1.5 sm:space-x-2 pb-2 sm:pb-2.5">
                      {wellnessPlan?.exercise.map((ex, index) => (
                        <ItemCard key={`ex-${index}`} className="bg-card hover:scale-105 transition-transform duration-200">
                          <h5 className="font-semibold text-2xs sm:text-xs mb-0.5 flex items-center text-accent">
                            <CalendarDays className="h-2.5 w-2.5 mr-1 text-muted-foreground" /> {ex.day}
                          </h5>
                          <p className="text-3xs xs:text-2xs break-words whitespace-normal"><strong>Activity:</strong> {ex.activity}</p>
                          <p className="text-3xs xs:text-2xs break-words whitespace-normal"><strong>Duration:</strong> {ex.duration}</p>
                        </ItemCard>
                      ))}
                    </div>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="mindfulness" className="mt-2 sm:mt-2.5">
                  <ScrollArea className="w-full whitespace-nowrap rounded-md">
                    <div className="flex space-x-1.5 sm:space-x-2 pb-2 sm:pb-2.5">
                      {wellnessPlan?.mindfulness.map((mind, index) => (
                        <ItemCard key={`mind-${index}`} className="bg-card hover:scale-105 transition-transform duration-200">
                          <h5 className="font-semibold text-2xs sm:text-xs mb-0.5 flex items-center text-accent">
                            <CalendarDays className="h-2.5 w-2.5 mr-1 text-muted-foreground" /> {mind.day}
                          </h5>
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

          {chartData.length > 0 && (
            <Card className="neumorphic">
              <CardHeader className="px-3 py-2 sm:px-4 sm:py-2.5">
                <CardTitle className="flex items-center gap-1 sm:gap-1.5 text-sm sm:text-base text-primary">
                  <Smile className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Mood Meter
                </CardTitle>
                <CardDescription className="text-2xs sm:text-xs">
                  Your vibe check over the last {chartData.length} entries!
                </CardDescription>
              </CardHeader>
              <CardContent className="px-3 pt-0 pb-2.5 sm:px-4 sm:pb-3">
                <div className="h-[200px] sm:h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="date" 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        domain={[1, 5]}
                        ticks={[1, 2, 3, 4, 5]}
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                      />
                      <RechartsTooltip 
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload as ChartMoodLog;
                            return (
                              <div className="neumorphic-sm p-2 border border-border/50 bg-background">
                                <p className="text-2xs sm:text-xs font-medium text-primary">{label}</p>
                                <p className="text-2xs sm:text-xs">
                                  Mood: <span className="text-base">{data.moodEmoji}</span>
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                        cursor={{ fill: 'hsl(var(--accent) / 0.1)' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="moodValue" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2.5}
                        dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 5, stroke: "hsl(var(--accent))", strokeWidth: 2, fill: "hsl(var(--accent))" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
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
                    <Button variant="outline" className="neumorphic-button text-3xs px-1.5 py-0.5 h-6 sm:text-2xs sm:px-2 sm:py-1 sm:h-7 group">
                      <Plus className="h-2.5 w-2.5 group-hover:scale-125 group-hover:text-accent transition-all" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="neumorphic max-w-[90vw] xs:max-w-sm">
                    <DialogHeader>
                      <DialogTitle className="text-sm sm:text-base text-primary">How You Feelin'?</DialogTitle>
                      <DialogDescription className="text-2xs sm:text-xs">
                        Spill the tea (or just pick an emoji).
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 sm:space-y-4">
                      <div className="space-y-1 sm:space-y-1.5">
                        <Label className="text-2xs sm:text-xs">Pick Your Vibe:</Label>
                        <div className="flex justify-center gap-2 sm:gap-3">
                          {['😞', '😕', '😐', '🙂', '😊'].map((mood) => (
                            <button
                              key={mood}
                              onClick={() => {
                                setSelectedMood(mood);
                                anime({ targets: `button[data-mood='${mood}']`, scale: [1, 1.2, 1], duration: 300, easing: 'easeOutElastic(1, .5)'});
                              }}
                              data-mood={mood}
                              className={cn(
                                "text-2xl sm:text-3xl p-1.5 sm:p-2 rounded-md transition-all duration-200",
                                selectedMood === mood 
                                  ? "neumorphic-inset-sm scale-110 ring-2 ring-accent" 
                                  : "neumorphic-sm hover:scale-110 hover:shadow-accent/30"
                              )}
                            >
                              {mood}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1 sm:space-y-1.5">
                        <Label htmlFor="moodNotes" className="text-2xs sm:text-xs">Any deets? (Optional)</Label>
                        <Textarea
                          id="moodNotes"
                          value={moodNotes}
                          onChange={(e) => setMoodNotes(e.target.value)}
                          placeholder="What's up? Spill it..."
                          className="min-h-[60px] sm:min-h-[80px] text-xs sm:text-sm"
                        />
                      </div>

                      <div className="space-y-1 sm:space-y-1.5">
                        <Label className="text-2xs sm:text-xs">Selfie Moment? (Optional)</Label>
                        {!isCameraOpen && !selfieDataUri && (
                          <Button
                            onClick={startCamera}
                            variant="outline"
                            className="w-full neumorphic-button text-2xs sm:text-xs px-2.5 py-1 h-7 sm:h-8 group"
                          >
                            <Camera className="mr-1 h-2.5 w-2.5 group-hover:text-accent transition-colors" /> Take Selfie
                          </Button>
                        )}
                        
                        {isCameraOpen && (
                          <div className="space-y-1.5 sm:space-y-2">
                            <video
                              ref={videoRef}
                              autoPlay
                              playsInline
                              className="w-full rounded-md neumorphic-inset-sm"
                            />
                            <div className="flex gap-1.5 sm:gap-2">
                              <Button
                                onClick={capturePhoto}
                                className="flex-1 neumorphic-button-primary text-2xs sm:text-xs px-2 py-1 h-7 sm:h-8 group"
                              >
                                <Camera className="mr-1 h-2.5 w-2.5 group-hover:scale-110 transition-transform" /> Capture
                              </Button>
                              <Button
                                onClick={stopCamera}
                                variant="outline"
                                className="flex-1 neumorphic-button text-2xs sm:text-xs px-2 py-1 h-7 sm:h-8 group"
                              >
                                <X className="mr-1 h-2.5 w-2.5 group-hover:text-red-500 transition-colors" /> Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                        
                        {selfieDataUri && (
                          <div className="space-y-1.5 sm:space-y-2">
                            <div className="relative">
                              <Image
                                src={selfieDataUri}
                                alt="Captured selfie"
                                width={200}
                                height={200}
                                className="w-full rounded-md neumorphic-inset-sm object-cover"
                                data-ai-hint="selfie person"
                              />
                            </div>
                            <Button
                              onClick={() => setSelfieDataUri(undefined)}
                              variant="outline"
                              className="w-full neumorphic-button text-2xs sm:text-xs px-2.5 py-1 h-7 sm:h-8 group"
                            >
                              <Trash2 className="mr-1 h-2.5 w-2.5 group-hover:text-red-500 transition-colors" /> Remove Photo
                            </Button>
                          </div>
                        )}
                      </div>

                      <Button
                        onClick={handleMoodSubmit}
                        disabled={!selectedMood || isSubmittingMood}
                        className="w-full neumorphic-button-primary text-2xs sm:text-xs px-2.5 py-1 h-7 sm:h-8 group"
                      >
                        {isSubmittingMood ? (
                          <Loader2 className="mr-1 h-2.5 w-2.5 animate-spin" />
                        ) : (
                          <Sparkles className="mr-1 h-3 w-3 group-hover:animate-ping-slow" />
                        )}
                        Log My Vibe!
                      </Button>
                    </div>
                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pt-0 pb-2.5 sm:px-4 sm:pb-3">
              {moodLogs.length === 0 ? (
                <p className="text-2xs sm:text-xs text-muted-foreground text-center py-3 sm:py-4">
                  No mood logs yet. How are you feeling today? 🤔
                </p>
              ) : (
                <ScrollArea className="h-[200px] sm:h-[250px] w-full">
                  <div className="space-y-1.5 sm:space-y-2">
                    {moodLogs.slice(0, 10).map((log) => (
                      <div key={log.id} className="neumorphic-sm p-2 sm:p-2.5 rounded-md hover:bg-card/80 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-1 sm:gap-1.5 mb-0.5">
                              <span className="text-base sm:text-lg">{log.mood}</span>
                              <span className="text-3xs xs:text-2xs text-muted-foreground">
                                {isToday(parseISO(log.date)) 
                                  ? 'Today' 
                                  : format(parseISO(log.date), 'MMM d')
                                }
                              </span>
                            </div>
                            {log.notes && (
                              <p className="text-3xs xs:text-2xs text-muted-foreground break-words">
                                {log.notes}
                              </p>
                            )}
                            {log.aiFeedback && (
                              <p className="text-3xs xs:text-2xs text-primary/90 italic mt-0.5 break-words">
                                <Sparkles className="inline h-2.5 w-2.5 mr-0.5 text-accent" />
                                {log.aiFeedback}
                              </p>
                            )}
                          </div>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                className="ml-1 sm:ml-1.5 text-muted-foreground hover:text-red-500 hover:bg-destructive/10 p-1 h-6 w-6 sm:h-7 sm:w-7 rounded-md"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="neumorphic max-w-[90vw] xs:max-w-sm">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-sm sm:text-base text-primary">Delete Mood Log?</AlertDialogTitle>
                                <AlertDialogDescription className="text-2xs sm:text-xs">
                                  Sure you wanna delete this vibe? No undos!
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                                <AlertDialogCancel className="neumorphic-button text-2xs sm:text-xs px-2.5 py-1 h-7 sm:h-8">Nah, Keep It</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDeleteMoodLog(log.id)}
                                  className="neumorphic-button-primary bg-destructive hover:bg-destructive/90 text-destructive-foreground text-2xs sm:text-xs px-2.5 py-1 h-7 sm:h-8"
                                >
                                  Yep, Delete!
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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
                  onClick={handleGenerateGroceryList}
                  disabled={isLoadingGroceryList}
                  variant="outline"
                  className="neumorphic-button text-3xs px-1.5 py-0.5 h-6 sm:text-2xs sm:px-2 sm:py-1 sm:h-7 group"
                >
                  {isLoadingGroceryList ? (
                    <Loader2 className="h-2.5 w-2.5 animate-spin" />
                  ) : (
                    <RefreshCw className="h-2.5 w-2.5 group-hover:rotate-180 transition-transform duration-300 group-hover:text-accent" />
                  )}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pt-0 pb-2.5 sm:px-4 sm:pb-3">
              {!groceryList || groceryList.items.length === 0 ? (
                <p className="text-2xs sm:text-xs text-muted-foreground text-center py-3 sm:py-4">
                  {isLoadingGroceryList ? 'AI is making your list...' : 'No groceries yet. Generate one from your meal plan! 🛒'}
                </p>
              ) : (
                <ScrollArea className="h-[200px] sm:h-[250px] w-full">
                  <div className="space-y-1.5 sm:space-y-2">
                    {Object.entries(groupedGroceryItems).map(([category, items]) => (
                      <div key={category}>
                        <h5 className="font-semibold text-2xs sm:text-xs text-accent mb-0.5 sm:mb-1">
                          {category} ({items.length})
                        </h5>
                        <div className="space-y-0.5 sm:space-y-1 mb-1.5 sm:mb-2">
                          {items.map((item) => (
                            <div key={item.id} className="flex items-center justify-between neumorphic-sm p-1.5 sm:p-2 rounded-md hover:bg-card/70 transition-colors">
                              <div className="flex-1 min-w-0">
                                <p className="text-3xs xs:text-2xs font-medium truncate">{item.name}</p>
                                {item.quantity && (
                                  <p className="text-3xs text-muted-foreground">{item.quantity}</p>
                                )}
                                {item.notes && (
                                  <p className="text-3xs text-muted-foreground italic">{item.notes}</p>
                                )}
                              </div>
                              <Button
                                onClick={() => handleDeleteGroceryItem(item.id)}
                                variant="ghost"
                                className="ml-1 sm:ml-1.5 text-muted-foreground hover:text-red-500 hover:bg-destructive/10 p-1 h-6 w-6 sm:h-7 sm:w-7 rounded-md flex-shrink-0"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {beforeLog && afterLog && (
            <SocialShareCard beforeLog={beforeLog} afterLog={afterLog} />
          )}
        </div>
      </div>

      <Dialog open={isSummaryDialogOpen} onOpenChange={setIsSummaryDialogOpen}>
        <DialogContent className="neumorphic max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg text-primary text-center flex items-center justify-center gap-2">
              <AwardIcon className="h-6 w-6 text-accent" /> Today's Epic Recap!
            </DialogTitle>
            {mockDailySummary && <DialogDescription className="text-center text-xs">Awesome job on {format(parseISO(mockDailySummary.date), "MMMM do")}!</DialogDescription>}
          </DialogHeader>
          {mockDailySummary && (
            <div className="space-y-3 py-2">
              <p className="text-sm text-center">Quests Completed: <span className="font-bold text-primary">{mockDailySummary.questsCompleted} / {mockDailySummary.totalQuests}</span></p>
              <p className="text-sm text-center">XP Gained: <span className="font-bold text-primary">+{mockDailySummary.xpGained} XP</span></p>
              {mockDailySummary.streakContinued && <p className="text-sm text-center text-green-400 flex items-center justify-center gap-1"><Flame size={16}/> Streak Continued!</p>}
              
              {mockDailySummary.badgesEarned.length > 0 && (
                <div className="text-center space-y-1 pt-2">
                  <p className="text-sm font-semibold text-primary">Badges Unlocked!</p>
                  {mockDailySummary.badgesEarned.map(badge => {
                    const BadgeIconComponent = questTypeIcons[badge.iconName as QuestType || 'other'] || Medal; // Use questTypeIcons for badge icon
                    return (
                        <div key={badge.id} className="inline-flex flex-col items-center p-2 neumorphic-sm rounded-md m-1 badge-earned-popup">
                             <BadgeIconComponent className="h-8 w-8 text-accent mb-1" />
                             <p className="text-xs font-medium text-foreground">{badge.name}</p>
                             <p className="text-2xs text-muted-foreground">{badge.description}</p>
                        </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsSummaryDialogOpen(false)} className="neumorphic-button w-full sm:w-auto">Keep Crushing It!</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </main>
  );
};

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Logo size="text-xl sm:text-2xl" />
        <Loader2 className="mt-4 h-5 w-5 sm:h-6 sm:w-6 animate-spin text-primary" />
        <p className="mt-2 text-xs sm:text-sm text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  return <DashboardContent />;
}

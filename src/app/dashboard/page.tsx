
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import SocialShareCard from '@/components/social-share-card';
import { Loader2, Utensils, Dumbbell, Brain, Smile, ShoppingCart, CalendarDays, Camera, Trash2, LogOut, Settings, Trophy, Plus, Sparkles, Target, CheckCircle, BarChart3, Users, RefreshCw, X, UserCircle } from 'lucide-react';
import type { MoodLog, GroceryItem, ChartMoodLog } from '@/types/wellness';
import { format, parseISO, isToday, subDays, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CURRENT_CHALLENGE } from '@/config/challenge';

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

  const [selectedMood, setSelectedMood] = useState('');
  const [moodNotes, setMoodNotes] = useState('');
  const [selfieDataUri, setSelfieDataUri] = useState<string | undefined>(undefined);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isSubmittingMood, setIsSubmittingMood] = useState(false);
  const [isMoodDialogOpen, setIsMoodDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [isUpdatingName, setIsUpdatingName] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

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
    if (currentUserProfile?.displayName) {
      setNewDisplayName(currentUserProfile.displayName);
    }
  }, [currentUserProfile]);

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
      await addMoodLog(selectedMood, moodNotes || undefined, selfieDataUri);
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

  if (!isPlanAvailable) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <Logo size="text-xl sm:text-2xl" />
        <p className="mt-3 text-sm sm:text-base">No wellness plan found. Please complete your onboarding first.</p>
        <Button onClick={() => router.push('/onboarding')} className="mt-3 neumorphic-button text-xs sm:text-sm px-3 py-1.5 h-8 sm:h-9">
          Complete Onboarding
        </Button>
      </div>
    );
  }

  return (
    <main className="container mx-auto p-3 sm:p-4 md:p-6">
      <header className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Logo size="text-xl sm:text-2xl" />
          <span className="text-sm sm:text-md font-semibold text-primary">Dashboard</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-1.5 mt-2 sm:mt-0">
          <Button 
            variant="outline" 
            onClick={() => router.push('/leaderboard')} 
            className="neumorphic-button text-2xs sm:text-xs px-2 py-1 sm:px-2.5 sm:py-1.5 h-7 sm:h-8"
            aria-label="View Leaderboard"
          >
            <Trophy className="mr-0.5 h-2.5 w-2.5 sm:h-3 sm:w-3" /> Leaderboard
          </Button>
          
          <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="neumorphic-button text-2xs sm:text-xs px-2 py-1 sm:px-2.5 sm:py-1.5 h-7 sm:h-8" aria-label="Settings">
                <Settings className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              </Button>
            </DialogTrigger>
            <DialogContent className="neumorphic max-w-[90vw] xs:max-w-sm">
              <DialogHeader>
                <DialogTitle className="text-sm sm:text-base">Settings</DialogTitle>
                <DialogDescription className="text-2xs sm:text-xs">
                  Update your profile information.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 sm:space-y-4">
                <div className="space-y-1 sm:space-y-1.5">
                  <Label htmlFor="displayName" className="text-2xs sm:text-xs">Display Name</Label>
                  <Input
                    id="displayName"
                    value={newDisplayName}
                    onChange={(e) => setNewDisplayName(e.target.value)}
                    placeholder="Enter your display name"
                    className="text-xs sm:text-sm h-8 sm:h-9"
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-2.5">
                  <Button 
                    onClick={handleUpdateDisplayName} 
                    disabled={isUpdatingName || !newDisplayName.trim() || newDisplayName.trim() === currentUserProfile?.displayName}
                    className="neumorphic-button-primary text-2xs sm:text-xs px-2.5 py-1 h-7 sm:h-8 flex-1"
                  >
                    {isUpdatingName ? <Loader2 className="mr-1 h-2.5 w-2.5 animate-spin" /> : null}
                    Update
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

          <Button variant="outline" onClick={logoutUser} className="neumorphic-button text-2xs sm:text-xs px-2 py-1 sm:px-2.5 sm:py-1.5 h-7 sm:h-8" aria-label="Logout">
            <LogOut className="mr-0.5 h-2.5 w-2.5 sm:h-3 sm:w-3" /> Logout
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          <Card className="neumorphic">
            <CardHeader className="px-3 py-2.5 sm:px-4 sm:py-3">
              <div className="flex items-center gap-2 sm:gap-3">
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
                  <CardTitle className="text-sm sm:text-base">
                    Welcome back, {currentUserProfile?.displayName || 'GroZen User'}! 👋
                  </CardTitle>
                  <CardDescription className="text-2xs sm:text-xs">
                    Ready to continue your wellness journey today?
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          {userActiveChallenge ? (
            <Card className="neumorphic">
              <CardHeader className="px-3 py-2 sm:px-4 sm:py-2.5">
                <CardTitle className="flex items-center gap-1 sm:gap-1.5 text-sm sm:text-base">
                  <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent" /> {CURRENT_CHALLENGE.title}
                </CardTitle>
                <CardDescription className="text-2xs sm:text-xs">
                  {userActiveChallenge.daysCompleted} of {CURRENT_CHALLENGE.durationDays} days completed
                </CardDescription>
              </CardHeader>
              <CardContent className="px-3 pt-0 pb-2.5 sm:px-4 sm:pb-3">
                <div className="space-y-2 sm:space-y-2.5">
                  <Progress value={challengeProgress} className="h-2 sm:h-2.5" />
                  <div className="flex justify-between items-center">
                    <span className="text-2xs sm:text-xs text-muted-foreground">{challengeProgress}% Complete</span>
                    <Button
                      onClick={logChallengeDay}
                      disabled={hasLoggedToday || isLoadingUserChallenge}
                      variant={hasLoggedToday ? "outline" : "neumorphic-primary"}
                      className="text-3xs px-2 py-0.5 h-6 sm:text-2xs sm:px-2.5 sm:py-1 sm:h-7"
                    >
                      {isLoadingUserChallenge ? (
                        <Loader2 className="h-2.5 w-2.5 animate-spin" />
                      ) : hasLoggedToday ? (
                        <>
                          <CheckCircle className="mr-0.5 h-2.5 w-2.5" /> Logged
                        </>
                      ) : (
                        <>
                          <Plus className="mr-0.5 h-2.5 w-2.5" /> Log Today
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="neumorphic">
              <CardHeader className="px-3 py-2 sm:px-4 sm:py-2.5">
                <CardTitle className="flex items-center gap-1 sm:gap-1.5 text-sm sm:text-base">
                  <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent" /> Join the Challenge!
                </CardTitle>
                <CardDescription className="text-2xs sm:text-xs">
                  {CURRENT_CHALLENGE.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="px-3 pt-0 pb-2.5 sm:px-4 sm:pb-3">
                <Button
                  onClick={joinCurrentChallenge}
                  disabled={isLoadingUserChallenge}
                  className="neumorphic-button-primary text-2xs sm:text-xs px-2.5 py-1 h-7 sm:h-8"
                >
                  {isLoadingUserChallenge ? (
                    <Loader2 className="mr-1 h-2.5 w-2.5 animate-spin" />
                  ) : (
                    <>
                      <Plus className="mr-1 h-2.5 w-2.5" /> Join Challenge
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          <Card className="neumorphic">
            <CardHeader className="px-3 py-2 sm:px-4 sm:py-2.5">
              <CardTitle className="flex items-center gap-1 sm:gap-1.5 text-sm sm:text-base">
                <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent" /> Your Wellness Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pt-0 pb-2.5 sm:px-4 sm:pb-3">
              <Tabs defaultValue="meals" className="w-full">
                <TabsList className="grid w-full grid-cols-3 h-8 sm:h-9">
                  <TabsTrigger value="meals" className="text-3xs sm:text-2xs">
                    <Utensils className="mr-0.5 h-2.5 w-2.5" /> Meals
                  </TabsTrigger>
                  <TabsTrigger value="exercise" className="text-3xs sm:text-2xs">
                    <Dumbbell className="mr-0.5 h-2.5 w-2.5" /> Exercise
                  </TabsTrigger>
                  <TabsTrigger value="mindfulness" className="text-3xs sm:text-2xs">
                    <Brain className="mr-0.5 h-2.5 w-2.5" /> Mind
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="meals" className="mt-2 sm:mt-2.5">
                  <ScrollArea className="w-full whitespace-nowrap rounded-md">
                    <div className="flex space-x-1.5 sm:space-x-2 pb-2 sm:pb-2.5">
                      {wellnessPlan?.meals.map((meal, index) => (
                        <ItemCard key={`meal-${index}`} className="bg-card">
                          <h5 className="font-semibold text-2xs sm:text-xs mb-0.5 flex items-center">
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
                        <ItemCard key={`ex-${index}`} className="bg-card">
                          <h5 className="font-semibold text-2xs sm:text-xs mb-0.5 flex items-center">
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
                        <ItemCard key={`mind-${index}`} className="bg-card">
                          <h5 className="font-semibold text-2xs sm:text-xs mb-0.5 flex items-center">
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
                <CardTitle className="flex items-center gap-1 sm:gap-1.5 text-sm sm:text-base">
                  <Smile className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent" /> Mood Trends
                </CardTitle>
                <CardDescription className="text-2xs sm:text-xs">
                  Your mood over the last {chartData.length} entries
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
                      <Tooltip 
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload as ChartMoodLog;
                            return (
                              <div className="neumorphic-sm p-2 border border-border/50 bg-background">
                                <p className="text-2xs sm:text-xs font-medium">{label}</p>
                                <p className="text-2xs sm:text-xs">
                                  Mood: <span className="text-base">{data.moodEmoji}</span>
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="moodValue" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 3 }}
                        activeDot={{ r: 4, stroke: "hsl(var(--primary))", strokeWidth: 2 }}
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
                <span className="flex items-center gap-1 sm:gap-1.5">
                  <Smile className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent" /> Mood Log
                </span>
                <Dialog open={isMoodDialogOpen} onOpenChange={setIsMoodDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="neumorphic-button text-3xs px-1.5 py-0.5 h-6 sm:text-2xs sm:px-2 sm:py-1 sm:h-7">
                      <Plus className="h-2.5 w-2.5" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="neumorphic max-w-[90vw] xs:max-w-sm">
                    <DialogHeader>
                      <DialogTitle className="text-sm sm:text-base">Log Your Mood</DialogTitle>
                      <DialogDescription className="text-2xs sm:text-xs">
                        How are you feeling today?
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 sm:space-y-4">
                      <div className="space-y-1 sm:space-y-1.5">
                        <Label className="text-2xs sm:text-xs">Select your mood</Label>
                        <div className="flex justify-center gap-2 sm:gap-3">
                          {['😞', '😕', '😐', '🙂', '😊'].map((mood) => (
                            <button
                              key={mood}
                              onClick={() => setSelectedMood(mood)}
                              className={cn(
                                "text-2xl sm:text-3xl p-1.5 sm:p-2 rounded-md transition-all",
                                selectedMood === mood 
                                  ? "neumorphic-inset-sm scale-110" 
                                  : "neumorphic-sm hover:scale-105"
                              )}
                            >
                              {mood}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1 sm:space-y-1.5">
                        <Label htmlFor="moodNotes" className="text-2xs sm:text-xs">Notes (optional)</Label>
                        <Textarea
                          id="moodNotes"
                          value={moodNotes}
                          onChange={(e) => setMoodNotes(e.target.value)}
                          placeholder="How are you feeling? What's on your mind?"
                          className="min-h-[60px] sm:min-h-[80px] text-xs sm:text-sm"
                        />
                      </div>

                      <div className="space-y-1 sm:space-y-1.5">
                        <Label className="text-2xs sm:text-xs">Selfie (optional)</Label>
                        {!isCameraOpen && !selfieDataUri && (
                          <Button
                            onClick={startCamera}
                            variant="outline"
                            className="w-full neumorphic-button text-2xs sm:text-xs px-2.5 py-1 h-7 sm:h-8"
                          >
                            <Camera className="mr-1 h-2.5 w-2.5" /> Take Selfie
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
                                className="flex-1 neumorphic-button-primary text-2xs sm:text-xs px-2 py-1 h-7 sm:h-8"
                              >
                                <Camera className="mr-1 h-2.5 w-2.5" /> Capture
                              </Button>
                              <Button
                                onClick={stopCamera}
                                variant="outline"
                                className="flex-1 neumorphic-button text-2xs sm:text-xs px-2 py-1 h-7 sm:h-8"
                              >
                                <X className="mr-1 h-2.5 w-2.5" /> Cancel
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
                              className="w-full neumorphic-button text-2xs sm:text-xs px-2.5 py-1 h-7 sm:h-8"
                            >
                              <Trash2 className="mr-1 h-2.5 w-2.5" /> Remove Photo
                            </Button>
                          </div>
                        )}
                      </div>

                      <Button
                        onClick={handleMoodSubmit}
                        disabled={!selectedMood || isSubmittingMood}
                        className="w-full neumorphic-button-primary text-2xs sm:text-xs px-2.5 py-1 h-7 sm:h-8"
                      >
                        {isSubmittingMood ? (
                          <Loader2 className="mr-1 h-2.5 w-2.5 animate-spin" />
                        ) : (
                          <Sparkles className="mr-1 h-2.5 w-2.5" />
                        )}
                        Log Mood
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
                  No mood logs yet. Start tracking your mood!
                </p>
              ) : (
                <ScrollArea className="h-[200px] sm:h-[250px] w-full">
                  <div className="space-y-1.5 sm:space-y-2">
                    {moodLogs.slice(0, 10).map((log) => (
                      <div key={log.id} className="neumorphic-sm p-2 sm:p-2.5 rounded-md">
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
                              <p className="text-3xs xs:text-2xs text-primary/80 italic mt-0.5 break-words">
                                <Sparkles className="inline h-2 w-2 mr-0.5" />
                                {log.aiFeedback}
                              </p>
                            )}
                          </div>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                className="ml-1 sm:ml-1.5 neumorphic-button text-3xs px-1 py-0.5 h-5 sm:h-6"
                              >
                                <Trash2 className="h-2 w-2" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="neumorphic max-w-[90vw] xs:max-w-sm">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-sm sm:text-base">Delete Mood Log</AlertDialogTitle>
                                <AlertDialogDescription className="text-2xs sm:text-xs">
                                  Are you sure you want to delete this mood entry? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                                <AlertDialogCancel className="neumorphic-button text-2xs sm:text-xs px-2.5 py-1 h-7 sm:h-8">Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDeleteMoodLog(log.id)}
                                  className="neumorphic-button-primary text-2xs sm:text-xs px-2.5 py-1 h-7 sm:h-8"
                                >
                                  Delete
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
                <span className="flex items-center gap-1 sm:gap-1.5">
                  <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent" /> Grocery List
                </span>
                <Button
                  onClick={handleGenerateGroceryList}
                  disabled={isLoadingGroceryList}
                  variant="outline"
                  className="neumorphic-button text-3xs px-1.5 py-0.5 h-6 sm:text-2xs sm:px-2 sm:py-1 sm:h-7"
                >
                  {isLoadingGroceryList ? (
                    <Loader2 className="h-2.5 w-2.5 animate-spin" />
                  ) : (
                    <RefreshCw className="h-2.5 w-2.5" />
                  )}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pt-0 pb-2.5 sm:px-4 sm:pb-3">
              {!groceryList || groceryList.items.length === 0 ? (
                <p className="text-2xs sm:text-xs text-muted-foreground text-center py-3 sm:py-4">
                  {isLoadingGroceryList ? 'Generating grocery list...' : 'No grocery list yet. Generate one from your meal plan!'}
                </p>
              ) : (
                <ScrollArea className="h-[200px] sm:h-[250px] w-full">
                  <div className="space-y-1.5 sm:space-y-2">
                    {Object.entries(groupedGroceryItems).map(([category, items]) => (
                      <div key={category}>
                        <h5 className="font-semibold text-2xs sm:text-xs text-muted-foreground mb-0.5 sm:mb-1">
                          {category} ({items.length})
                        </h5>
                        <div className="space-y-0.5 sm:space-y-1 mb-1.5 sm:mb-2">
                          {items.map((item) => (
                            <div key={item.id} className="flex items-center justify-between neumorphic-sm p-1.5 sm:p-2 rounded-md">
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
                                variant="outline"
                                className="ml-1 sm:ml-1.5 neumorphic-button text-3xs px-1 py-0.5 h-5 sm:h-6 flex-shrink-0"
                              >
                                <Trash2 className="h-2 w-2" />
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

    
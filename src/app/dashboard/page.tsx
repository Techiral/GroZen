
"use client";

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { usePlan } from '@/contexts/plan-context';
import Logo from '@/components/logo';
import SocialShareCard from '@/components/social-share-card';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import type { Meal, Exercise, Mindfulness, MoodLog, GroceryItem, ChartMoodLog, UserProfile } from '@/types/wellness';
import { Utensils, Dumbbell, Brain, CalendarDays, RotateCcw, Smile, Annoyed, Frown, Meh, Laugh, Camera, Sparkles, Trash2, VideoOff, ShoppingCart, Loader2, Gift, LogOut, ShieldCheck, LineChart as LineChartIcon, CheckSquare, Square, Share2 as ShareIcon, Trophy, ListOrdered, User as UserIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { format, differenceInDays, parseISO } from 'date-fns';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { CURRENT_CHALLENGE } from '@/config/challenge';
import { generateShareImage as aiGenerateShareImage, type GenerateShareImageInput } from '@/ai/flows/generate-share-image';


const SectionCard: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; itemsCount?: number; action?: React.ReactNode }> = ({ title, icon, children, itemsCount, action }) => (
  <Card className="neumorphic w-full mb-4 sm:mb-5">
    <CardHeader className="flex flex-col space-y-1.5 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 pb-2 px-3 py-2.5 sm:px-4 sm:py-3">
      <div className="flex flex-row items-center">
        <CardTitle className="text-sm sm:text-md font-medium flex items-center gap-1.5 sm:gap-2">
          {icon} {title}
        </CardTitle>
        {itemsCount !== undefined && <span className="ml-1.5 sm:ml-2 text-2xs text-muted-foreground">({itemsCount} items)</span>}
      </div>
      {action && <div className="w-full sm:w-auto pt-1.5 sm:pt-0">{action}</div>}
    </CardHeader>
    <CardContent className="px-3 pt-0 pb-3 sm:px-4 sm:pb-4">
      {children}
    </CardContent>
  </Card>
);

const ItemCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={cn("neumorphic-sm p-2.5 sm:p-3 rounded-md min-w-[170px] xs:min-w-[190px] sm:min-w-[210px] snap-start", className)}>
    {children}
  </div>
);

const moodEmojiStrings = [
    { emoji: "😊", label: "Happy" }, 
    { emoji: "🙂", label: "Okay" }, 
    { emoji: "😐", label: "Neutral" }, 
    { emoji: "😕", label: "Worried" }, 
    { emoji: "😞", label: "Sad" }
];

const moodToValueMapping: { [key: string]: number } = {
  "😊": 5, 
  "🙂": 4, 
  "😐": 3, 
  "😕": 2, 
  "😞": 1, 
};

const moodValueToLabel: { [key: number]: string } = {
  5: "Happy",
  4: "Okay",
  3: "Neutral",
  2: "Worried",
  1: "Sad",
};

const chartConfig = {
  mood: {
    label: "Mood",
    color: "hsl(var(--primary))", 
  },
} satisfies ChartConfig;


export default function DashboardPage() {
  const router = useRouter();
  const {
    currentUser,
    isAdminUser,
    isLoadingAuth,
    logoutUser,
    wellnessPlan,
    isOnboardedState,
    clearPlanAndData,
    isLoadingPlan,
    addMoodLog,
    deleteMoodLog,
    moodLogs,
    groceryList,
    isLoadingGroceryList,
    errorGroceryList,
    generateGroceryList: generateGroceryListFromContext,
    deleteGroceryItem,
    isPlanAvailable,
    userActiveChallenge,
    isLoadingUserChallenge,
    joinCurrentChallenge,
    logChallengeDay,
    currentUserProfile,
    updateUserDisplayName,
  } = usePlan();
  const { toast } = useToast();

  const [isMoodDialogOpen, setIsMoodDialogOpen] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [moodNotes, setMoodNotes] = useState("");
  const [logToDelete, setLogToDelete] = useState<string | null>(null);
  const [isSavingMood, setIsSavingMood] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState(currentUserProfile?.displayName || "");
  const [isUpdatingDisplayName, setIsUpdatingDisplayName] = useState(false);
  const [isSharingChallenge, setIsSharingChallenge] = useState(false);


  useEffect(() => {
    if (currentUserProfile?.displayName) {
      setNewDisplayName(currentUserProfile.displayName);
    }
  }, [currentUserProfile?.displayName]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [selfieStream, setSelfieStream] = useState<MediaStream | null>(null);
  const [capturedSelfie, setCapturedSelfie] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isVideoReadyForCapture, setIsVideoReadyForCapture] = useState(false);

  useEffect(() => {
    if (!isLoadingAuth) {
      if (!currentUser) {
        router.replace('/login');
      } else if (!isAdminUser && !isPlanAvailable && isOnboardedState && !isLoadingPlan) {
        // Stays on dashboard, dashboard handles "create plan" message
      } else if (!isAdminUser && !isOnboardedState && !isLoadingPlan) {
        router.replace('/onboarding');
      }
    }
  }, [currentUser, isAdminUser, isLoadingAuth, isPlanAvailable, isLoadingPlan, isOnboardedState, router]);


  const sortedMoodLogs = useMemo(() => {
    return [...moodLogs].sort((a, b) => {
      const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : (a.date ? parseISO(a.date).getTime() : 0);
      const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : (b.date ? parseISO(b.date).getTime() : 0);
      return dateB - dateA; 
    });
  }, [moodLogs]);

  const moodChartData: ChartMoodLog[] = useMemo(() => {
    return [...moodLogs] 
      .map(log => ({
        date: log.date ? format(parseISO(log.date), "MMM d") : "Unknown Date",
        moodValue: moodToValueMapping[log.mood] || 0, 
        moodEmoji: log.mood,
        fullDate: log.date || new Date(0).toISOString(),
      }))
      .sort((a,b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime()); 
  }, [moodLogs]);


  const [beforeShareLog, setBeforeShareLog] = useState<MoodLog | null>(null);
  const [afterShareLog, setAfterShareLog] = useState<MoodLog | null>(null);

 useEffect(() => {
    const logsWithSelfies = [...moodLogs]
      .filter(log => !!log.selfieDataUri && log.date)
      .sort((a,b) => parseISO(a.date!).getTime() - parseISO(b.date!).getTime()); 

    if (logsWithSelfies.length >= 2) {
      const firstSelfieLog = logsWithSelfies[0];
      let suitableAfterLog = null;

      for (let i = logsWithSelfies.length - 1; i > 0; i--) {
          const potentialAfterLog = logsWithSelfies[i];
          if (isAdminUser || (potentialAfterLog.date && firstSelfieLog.date && differenceInDays(parseISO(potentialAfterLog.date), parseISO(firstSelfieLog.date)) >= 14)) {
              suitableAfterLog = potentialAfterLog;
              break; 
          }
      }

      if (suitableAfterLog) {
        setBeforeShareLog(firstSelfieLog);
        setAfterShareLog(suitableAfterLog);
      } else {
        setBeforeShareLog(null);
        setAfterShareLog(null);
      }
    } else {
       setBeforeShareLog(null);
       setAfterShareLog(null);
    }
  }, [moodLogs, isAdminUser]);

  useEffect(() => {
    const video = videoRef.current;
    if (isCameraActive && selfieStream && hasCameraPermission === true && video) {
        video.srcObject = selfieStream;

        const handleLoadedMetadata = () => {
            video.play().catch(err => {
                console.error("Error playing video stream:", err);
                toast({
                    variant: "destructive",
                    title: "Camera Error",
                    description: "Could not start video playback. Ensure camera is not in use or try reopening the camera."
                });
                setIsVideoReadyForCapture(false);
            });
        };

        const handlePlaying = () => {
            setTimeout(() => {
                if (video && video.videoWidth > 0 && video.videoHeight > 0) {
                    setIsVideoReadyForCapture(true);
                } else if (video) {
                    console.warn("Video 'playing' event fired, but video dimensions are 0. Retrying check shortly.");
                    setTimeout(() => {
                        if (video && video.videoWidth > 0 && video.videoHeight > 0) {
                            setIsVideoReadyForCapture(true);
                        } else {
                            console.error("Video dimensions still 0 after delay on 'playing' event.");
                            toast({
                                variant: "destructive",
                                title: "Camera Feed Issue",
                                description: "Video feed started but dimensions are not available. Try reopening camera."
                            });
                            setIsVideoReadyForCapture(false);
                        }
                    }, 200); 
                }
            }, 100); 
        };
        
        const handleCanPlay = () => {
             if (video && video.videoWidth > 0 && video.videoHeight > 0) {
                setIsVideoReadyForCapture(true);
            }
        };
        
        const handleWaiting = () => setIsVideoReadyForCapture(false);
        const handleStalled = () => setIsVideoReadyForCapture(false);

        video.addEventListener('loadedmetadata', handleLoadedMetadata);
        video.addEventListener('playing', handlePlaying);
        video.addEventListener('canplay', handleCanPlay);
        video.addEventListener('waiting', handleWaiting);
        video.addEventListener('stalled', handleStalled);
        
        if (video.readyState >= HTMLMediaElement.HAVE_METADATA && !video.paused) {
            if (video.videoWidth > 0 && video.videoHeight > 0) {
                setIsVideoReadyForCapture(true);
            }
        } else if (video.readyState >= HTMLMediaElement.HAVE_METADATA && video.paused) {
            video.play().catch(err => console.error("Error attempting to play already loaded video", err));
        }

        return () => {
            if (video) {
                video.removeEventListener('loadedmetadata', handleLoadedMetadata);
                video.removeEventListener('playing', handlePlaying);
                video.removeEventListener('canplay', handleCanPlay);
                video.removeEventListener('waiting', handleWaiting);
                video.removeEventListener('stalled', handleStalled);
            }
            setIsVideoReadyForCapture(false);
        };
    } else {
        setIsVideoReadyForCapture(false);
    }
}, [selfieStream, isCameraActive, hasCameraPermission, toast]);


  useEffect(() => {
    const currentStream = selfieStream;
    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [selfieStream]);


  const handleToggleCamera = async () => {
    setIsVideoReadyForCapture(false); 

    if (isCameraActive && selfieStream) {
      selfieStream.getTracks().forEach(track => track.stop());
      setSelfieStream(null); 
      setIsCameraActive(false);
      if (videoRef.current) videoRef.current.srcObject = null;
    } else {
      setCapturedSelfie(null); 
      setHasCameraPermission(null); 
      setIsCameraActive(true); 

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
        setHasCameraPermission(true);
        setSelfieStream(stream);
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        setIsCameraActive(false); 
        setSelfieStream(null);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings.',
        });
      }
    }
  };

  const handleCaptureSelfie = () => {
    const video = videoRef.current;
    if (isVideoReadyForCapture && video && selfieStream) {
       if (video.videoWidth === 0 || video.videoHeight === 0) {
            toast({
                variant: 'destructive',
                title: 'Capture Failed',
                description: 'Video dimensions not available. Ensure camera feed is active and try again.',
            });
            setIsVideoReadyForCapture(false); 
            return;
        }
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUri = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedSelfie(dataUri);
        
        selfieStream.getTracks().forEach(track => track.stop());
        setSelfieStream(null);
        setIsCameraActive(false);
        setIsVideoReadyForCapture(false); 
      } else {
         toast({
            variant: 'destructive',
            title: 'Capture Failed',
            description: 'Could not get canvas context. Please try again.',
        });
      }
    } else {
        let description = 'Video stream not ready or camera not active.';
        if (!isVideoReadyForCapture && selfieStream) description = 'Video is not ready for capture. Please wait for the feed to stabilize.';
        else if (!selfieStream) description = 'Camera stream is not available.';
        else if (!video) description = 'Video element not found.';

        toast({
            variant: 'destructive',
            title: 'Capture Failed',
            description: `${description} Ensure the video feed is visible and try again.`,
        });
    }
  };

  const clearCapturedSelfie = () => {
    setCapturedSelfie(null);
  };

  const handleMoodButtonClick = (mood: string) => {
    setSelectedMood(mood);
    setMoodNotes("");
    setCapturedSelfie(null); 
    setIsVideoReadyForCapture(false);

    if (selfieStream) {
        selfieStream.getTracks().forEach(track => track.stop());
        setSelfieStream(null);
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsCameraActive(false);
    setHasCameraPermission(null); 
    
    setIsMoodDialogOpen(true);
  };

  const handleSaveMoodLog = async () => {
    if (selectedMood) {
      setIsSavingMood(true);
      try {
        await addMoodLog(selectedMood, moodNotes, capturedSelfie || undefined);
        setIsMoodDialogOpen(false); 
      } catch (error) {
        console.error("Error saving mood log:", error);
         toast({ variant: "destructive", title: "Save Error", description: "Could not save mood log." });
      } finally {
        setIsSavingMood(false);
      }
    }
  };

  const handleDialogClose = (open: boolean) => {
    setIsMoodDialogOpen(open);
    if (!open) { 
        if (selfieStream) {
          selfieStream.getTracks().forEach(track => track.stop());
          setSelfieStream(null);
        }
        if (videoRef.current) videoRef.current.srcObject = null;

        setIsCameraActive(false);
        setCapturedSelfie(null);
        setSelectedMood(null);
        setMoodNotes("");
        setHasCameraPermission(null); 
        setIsVideoReadyForCapture(false);
        setIsSavingMood(false); 
    }
  }

  const handleGenerateGroceryListClick = async () => {
    if (!wellnessPlan || !wellnessPlan.meals || wellnessPlan.meals.length === 0) {
      toast({ variant: "destructive", title: "Error", description: "No wellness plan with meals available to generate groceries from." });
      return;
    }
    await generateGroceryListFromContext(wellnessPlan);
  };

  const groupedGroceryItems = React.useMemo(() => {
    if (!groceryList) return {};
    return groceryList.items.reduce((acc, item) => {
      const category = item.category || 'Other';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {} as Record<string, GroceryItem[]>);
  }, [groceryList]);

  const handleLogout = async () => {
    await logoutUser();
  };

  const confirmDeleteMoodLog = async () => {
    if (logToDelete) {
      await deleteMoodLog(logToDelete);
      setLogToDelete(null);
    }
  };
  
  const todayDateString = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  const isChallengeDayLoggedToday = useMemo(() => {
    return !!userActiveChallenge?.completedDates.includes(todayDateString);
  }, [userActiveChallenge, todayDateString]);

  const handleChallengeShare = async () => {
    if (!userActiveChallenge || !currentUserProfile) return;
    setIsSharingChallenge(true);
    const appUrl = typeof window !== "undefined" ? window.location.origin : "GroZenApp.com";
    const shareText = `I'm crushing Day ${userActiveChallenge.daysCompleted} of the ${CURRENT_CHALLENGE.title} on GroZen! Join the challenge! ${appUrl} #GroZenChallenge #${CURRENT_CHALLENGE.id.replace(/-/g, '')}`;
    let imageFile: File | null = null;

    try {
      toast({ title: "Generating your awesome share image..." });
      const imageInput: GenerateShareImageInput = {
        challengeTitle: CURRENT_CHALLENGE.title,
        daysCompleted: userActiveChallenge.daysCompleted,
        userName: currentUserProfile.displayName || "A GroZen User",
      };
      const imageResult = await aiGenerateShareImage(imageInput);
      
      if (imageResult.imageDataUri) {
        const fetchRes = await fetch(imageResult.imageDataUri);
        const blob = await fetchRes.blob();
        imageFile = new File([blob], 'grozen-challenge-share.png', { type: blob.type });
        toast({ title: "Image generated!", description: "Ready to share."});
      } else {
        toast({ variant: "destructive", title: "Image Generation Failed", description: "Could not generate share image. Sharing text only." });
      }
    } catch (error) {
      console.error("Error generating share image:", error);
      toast({ variant: "destructive", title: "Image Generation Error", description: "Proceeding with text-only share." });
    }

    const shareData: ShareData = {
      title: "My GroZen Challenge Progress!",
      text: shareText,
      url: appUrl,
    };
    if (imageFile && navigator.canShare && navigator.canShare({ files: [imageFile] })) {
      shareData.files = [imageFile];
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast({ title: "Shared successfully!" });
      } catch (error: any) {
        if (error.name === 'AbortError') {
          toast({ title: "Share Canceled", variant: "default" });
        } else if (error.name === 'NotAllowedError') {
          toast({ title: "Share Permission Denied", description: "Trying to copy to clipboard instead.", variant: "default" });
          navigator.clipboard.writeText(shareText)
            .then(() => toast({ title: "Copied to clipboard!", description: "Challenge progress copied." }))
            .catch(() => toast({ variant: "destructive", title: "Copy Error", description: "Could not copy to clipboard." }));
        } else {
          console.error('Error sharing challenge progress:', error);
          toast({ variant: "destructive", title: "Share Error", description: "Could not share progress. Trying to copy to clipboard." });
           navigator.clipboard.writeText(shareText)
            .then(() => toast({ title: "Copied to clipboard!", description: "Challenge progress copied." }))
            .catch(() => toast({ variant: "destructive", title: "Copy Error", description: "Could not copy to clipboard." }));
        }
      }
    } else {
      // Fallback for browsers that don't support navigator.share
      navigator.clipboard.writeText(shareText)
        .then(() => toast({ title: "Copied to clipboard!", description: "Challenge progress (text) copied." }))
        .catch(() => toast({ variant: "destructive", title: "Copy Error", description: "Could not copy to clipboard." }));
    }
    setIsSharingChallenge(false);
  };

  const handleSaveDisplayName = async () => {
    if (!newDisplayName.trim()) {
      toast({ variant: "destructive", title: "Invalid Name", description: "Display name cannot be empty." });
      return;
    }
    setIsUpdatingDisplayName(true);
    await updateUserDisplayName(newDisplayName.trim());
    setIsUpdatingDisplayName(false);
  };


  if (isLoadingAuth || (!isLoadingAuth && !currentUser && !['/login', '/signup', '/'].includes(router.pathname))) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Logo size="text-2xl sm:text-3xl" />
        <Loader2 className="mt-4 h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
        <p className="mt-2 text-xs sm:text-sm text-muted-foreground">Loading user data...</p>
      </div>
    );
  }
  
  if (currentUser && !isAdminUser && !isPlanAvailable && !isOnboardedState && !isLoadingPlan) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <Logo size="text-2xl sm:text-3xl" />
        <Loader2 className="mt-4 h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
        <p className="mt-2 text-xs sm:text-sm text-muted-foreground">Setting up your space...</p>
      </div>
    );
  }
  
  if (currentUser && isOnboardedState && isLoadingPlan && !isPlanAvailable) { 
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <Logo size="text-2xl sm:text-3xl" />
        <p className="mt-3 text-sm sm:text-md">Generating your personalized plan...</p>
        <RotateCcw className="mt-3 h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (currentUser && !isAdminUser && isOnboardedState && !isPlanAvailable && !isLoadingPlan) { 
     return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <Logo size="text-2xl sm:text-3xl" />
        <p className="mt-3 text-sm sm:text-md">No wellness plan found or an error occurred.</p>
        <p className="text-2xs sm:text-xs text-muted-foreground">Please try creating a new plan.</p>
        <Button variant="neumorphic-primary" onClick={() => {clearPlanAndData(false, true); router.push('/onboarding');}} className="mt-3 text-xs sm:text-sm px-4 py-1.5 sm:px-5 sm:py-2" aria-label="New Plan or Edit Preferences">
          Create a New Plan
        </Button>
         <Button variant="outline" onClick={handleLogout} className="mt-3 neumorphic-button text-2xs sm:text-xs px-3 py-1 sm:px-4 sm:py-1.5" aria-label="Logout">
            <LogOut className="mr-1 h-3 w-3 sm:h-3.5 sm:w-3.5" /> Logout
        </Button>
      </div>
    );
  }


  return (
    <main className="container mx-auto p-3 sm:p-4 md:p-6">
      <header className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6">
        <Logo size="text-xl sm:text-2xl" />
        <div className="flex items-center gap-1.5 sm:gap-2 mt-2 sm:mt-0">
            {isAdminUser && (
                <Button 
                    variant="outline" 
                    onClick={() => router.push('/admin')} 
                    className="neumorphic-button text-2xs sm:text-xs px-2.5 py-1 sm:px-3 sm:py-1.5"
                    aria-label="Admin Panel"
                >
                    <ShieldCheck className="mr-1 h-3 w-3 sm:h-3.5 sm:w-3.5" /> Admin Panel
                </Button>
            )}
            {!isAdminUser && ( 
                <Button variant="outline" onClick={() => { clearPlanAndData(false, true); router.push('/onboarding'); }} className="neumorphic-button text-2xs sm:text-xs px-2.5 py-1 sm:px-3 sm:py-1.5" aria-label="New Plan or Edit Preferences">
                 New Plan / Edit Preferences
                </Button>
            )}
            <Button variant="outline" onClick={handleLogout} className="neumorphic-button text-2xs sm:text-xs px-2.5 py-1 sm:px-3 sm:py-1.5" aria-label="Logout">
                <LogOut className="mr-1 h-3 w-3 sm:h-3.5 sm:w-3.5" /> Logout
            </Button>
        </div>
      </header>

      {isLoadingPlan && wellnessPlan && ( 
        <div className="fixed inset-0 bg-background/80 flex flex-col items-center justify-center z-50">
          <RotateCcw className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
          <p className="mt-2 text-xs sm:text-sm">Updating your plan...</p>
        </div>
      )}
      
      <div className="mb-4 sm:mb-5 p-3 sm:p-4 neumorphic rounded-lg">
        <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-foreground">Your GroZen Wellness Plan</h2>
        <p className="text-xs sm:text-sm text-muted-foreground">Here&apos;s your personalized guide. Stay consistent!</p>
      </div>

      {(isPlanAvailable || (isAdminUser && isPlanAvailable)) && wellnessPlan && (
        <>
          <SectionCard title="Meals" icon={<Utensils className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />} itemsCount={wellnessPlan.meals.length}>
            <ScrollArea className="w-full whitespace-nowrap rounded-md">
              <div className="flex space-x-2 sm:space-x-2.5 pb-2.5 sm:pb-3">
                {wellnessPlan.meals.map((meal, index) => (
                  <ItemCard key={`meal-${index}`} className="bg-card">
                    <h4 className="font-semibold text-2xs sm:text-xs mb-1 flex items-center">
                        <CalendarDays className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" /> {meal.day}
                    </h4>
                    <p className="text-2xs sm:text-xs break-words whitespace-normal"><strong>B:</strong> {meal.breakfast}</p>
                    <p className="text-2xs sm:text-xs break-words whitespace-normal"><strong>L:</strong> {meal.lunch}</p>
                    <p className="text-2xs sm:text-xs break-words whitespace-normal"><strong>D:</strong> {meal.dinner}</p>
                  </ItemCard>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </SectionCard>

          <SectionCard title="Exercise Routine" icon={<Dumbbell className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />} itemsCount={wellnessPlan.exercise.length}>
            <ScrollArea className="w-full whitespace-nowrap rounded-md">
              <div className="flex space-x-2 sm:space-x-2.5 pb-2.5 sm:pb-3">
                {wellnessPlan.exercise.map((ex, index) => (
                  <ItemCard key={`ex-${index}`} className="bg-card">
                     <h4 className="font-semibold text-2xs sm:text-xs mb-1 flex items-center">
                        <CalendarDays className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" /> {ex.day}
                    </h4>
                    <p className="text-2xs sm:text-xs break-words whitespace-normal"><strong>Activity:</strong> {ex.activity}</p>
                    <p className="text-2xs sm:text-xs break-words whitespace-normal"><strong>Duration:</strong> {ex.duration}</p>
                  </ItemCard>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </SectionCard>

          <SectionCard title="Mindfulness Practices" icon={<Brain className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />} itemsCount={wellnessPlan.mindfulness.length}>
            <ScrollArea className="w-full whitespace-nowrap rounded-md">
              <div className="flex space-x-2 sm:space-x-2.5 pb-2.5 sm:pb-3">
                {wellnessPlan.mindfulness.map((mind, index) => (
                  <ItemCard key={`mind-${index}`} className="bg-card">
                    <h4 className="font-semibold text-2xs sm:text-xs mb-1 flex items-center">
                        <CalendarDays className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" /> {mind.day}
                    </h4>
                    <p className="text-2xs sm:text-xs break-words whitespace-normal"><strong>Practice:</strong> {mind.practice}</p>
                    <p className="text-2xs sm:text-xs break-words whitespace-normal"><strong>Duration:</strong> {mind.duration}</p>
                  </ItemCard>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </SectionCard>
        </>
      )}
      
      {isAdminUser && !isPlanAvailable && !isLoadingPlan && ( 
        <Alert className="mb-4 sm:mb-5 neumorphic">
          <AlertTitle className="text-sm sm:text-md">Admin View</AlertTitle>
          <AlertDescription className="text-2xs sm:text-xs">
            You are logged in as an admin. You can view your personal plan here if you create one, or proceed to the Admin Panel.
            <Button variant="link" onClick={() => { clearPlanAndData(false, true); router.push('/onboarding'); }} className="p-0 h-auto ml-1 text-accent text-2xs sm:text-xs">Create Personal Plan?</Button>
          </AlertDescription>
        </Alert>
      )}

      <SectionCard title="Your Profile" icon={<UserIcon className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />}>
        <div className="space-y-2">
          <div>
            <Label htmlFor="displayName" className="text-xs sm:text-sm">Display Name (for Leaderboard)</Label>
            <Input
              id="displayName"
              type="text"
              value={newDisplayName}
              onChange={(e) => setNewDisplayName(e.target.value)}
              placeholder="Your public name"
              className="mt-1 text-xs sm:text-sm"
              disabled={isUpdatingDisplayName}
            />
          </div>
          <Button 
            onClick={handleSaveDisplayName} 
            disabled={isUpdatingDisplayName || newDisplayName === (currentUserProfile?.displayName || "")}
            variant="neumorphic-primary"
            className="w-full sm:w-auto text-2xs px-2.5 py-1 sm:text-xs sm:px-3 sm:py-1.5"
          >
            {isUpdatingDisplayName ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : null}
            Save Display Name
          </Button>
        </div>
      </SectionCard>

      <SectionCard 
        title="Current Wellness Challenge" 
        icon={<Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />}
        action={
            userActiveChallenge && (
            <Link href="/leaderboard" passHref>
                <Button
                    variant="outline"
                    className="neumorphic-button text-2xs px-2 py-0.5 sm:text-xs sm:px-2.5 sm:py-1"
                    aria-label="View Challenge Leaderboard"
                >
                    <ListOrdered className="mr-1 h-3 w-3 sm:h-3.5 sm:w-3.5" /> View Leaderboard
                </Button>
            </Link>
            )
        }
      >
        <CardTitle className="text-sm sm:text-md mb-1">{CURRENT_CHALLENGE.title}</CardTitle>
        <CardDescription className="text-xs sm:text-sm mb-2.5 sm:mb-3">{CURRENT_CHALLENGE.description}</CardDescription>
        {isLoadingUserChallenge ? (
          <div className="flex items-center justify-center py-2">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <p className="ml-2 text-2xs sm:text-xs text-muted-foreground">Loading challenge status...</p>
          </div>
        ) : !userActiveChallenge ? (
          <Button
            variant="neumorphic-primary"
            onClick={joinCurrentChallenge}
            className="w-full sm:w-auto text-2xs px-2.5 py-1 sm:text-xs sm:px-3 sm:py-1.5"
            aria-label={`Join ${CURRENT_CHALLENGE.title} challenge`}
          >
            Join Challenge
          </Button>
        ) : (
          <div className="space-y-2">
            <p className="text-2xs sm:text-xs">
              Your Progress: <span className="font-semibold">{userActiveChallenge.daysCompleted}</span> / {CURRENT_CHALLENGE.durationDays} days completed
            </p>
            {userActiveChallenge.daysCompleted >= CURRENT_CHALLENGE.durationDays ? (
                 <Alert variant="default" className="neumorphic-sm">
                    <Trophy className="h-4 w-4 text-yellow-400" />
                    <AlertTitle className="text-xs sm:text-sm text-yellow-300">Challenge Complete!</AlertTitle>
                    <AlertDescription className="text-2xs sm:text-xs">
                        Congratulations on completing the {CURRENT_CHALLENGE.title}!
                    </AlertDescription>
                </Alert>
            ) : isChallengeDayLoggedToday ? (
              <div className="flex items-center gap-1.5 p-2 neumorphic-inset-sm rounded-md">
                <CheckSquare className="h-4 w-4 text-green-400" />
                <p className="text-2xs sm:text-xs text-green-300">Today&apos;s challenge logged! Keep it up!</p>
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={logChallengeDay}
                className="neumorphic-button w-full sm:w-auto text-2xs px-2.5 py-1 sm:text-xs sm:px-3 sm:py-1.5"
                aria-label="Log today's challenge completion"
              >
                <CheckSquare className="mr-1 h-3 w-3 sm:h-3.5 sm:w-3.5"/> Log Today&apos;s Completion
              </Button>
            )}
            <Button
                variant="outline"
                onClick={handleChallengeShare}
                disabled={isSharingChallenge}
                className="neumorphic-button w-full sm:w-auto text-2xs px-2.5 py-1 sm:text-xs sm:px-3 sm:py-1.5"
                aria-label="Share challenge progress"
            >
                {isSharingChallenge ? <Loader2 className="mr-1 h-3 w-3 sm:h-3.5 sm:w-3.5 animate-spin" /> : <ShareIcon className="mr-1 h-3 w-3 sm:h-3.5 sm:w-3.5"/>}
                {isSharingChallenge ? 'Sharing...' : 'Share My Progress'}
            </Button>
          </div>
        )}
      </SectionCard>


      <Dialog open={isMoodDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="neumorphic w-[90vw] max-w-md p-4 sm:p-5">
          <DialogHeader className="pb-2 sm:pb-3">
            <DialogTitle className="flex items-center text-sm sm:text-md">
              Log Your Mood: <span className="ml-1.5 text-lg sm:text-xl">{selectedMood}</span>
            </DialogTitle>
            <DialogDescription className="text-2xs sm:text-xs">
              How are you feeling? Add notes or a selfie to capture the moment.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[calc(80vh-180px)] sm:max-h-[calc(70vh-180px)] -mx-1 px-1">
            <div className="grid gap-2.5 sm:gap-3 py-2.5 sm:py-3">
              <div className="space-y-1">
                <Label htmlFor="mood-notes" className="text-2xs sm:text-xs">Notes (Optional)</Label>
                <Textarea
                  id="mood-notes"
                  value={moodNotes}
                  onChange={(e) => setMoodNotes(e.target.value)}
                  placeholder="Any thoughts or details..."
                  className="h-14 sm:h-16 neumorphic-inset-sm text-2xs sm:text-xs"
                  disabled={isSavingMood}
                  aria-label="Mood notes"
                />
              </div>
              <div className="space-y-1">
                  <Label className="text-2xs sm:text-xs">Selfie (Optional)</Label>
                  <div className="flex flex-col xs:flex-row items-start xs:items-center gap-1.5 sm:gap-2">
                      <Button
                          type="button"
                          variant="outline"
                          onClick={handleToggleCamera}
                          className="neumorphic-button w-full xs:w-auto text-2xs px-2.5 py-1 sm:text-xs sm:px-3 sm:py-1.5"
                          disabled={!!capturedSelfie || isSavingMood || (isCameraActive && !selfieStream && hasCameraPermission === null) } 
                          aria-label={isCameraActive ? 'Close Camera' : 'Open Camera'}
                      >
                          {isCameraActive && !selfieStream && hasCameraPermission === null ? <Loader2 className="mr-1 h-2.5 w-2.5 sm:h-3 sm:w-3 animate-spin" /> : (isCameraActive ? <VideoOff className="mr-1 h-2.5 w-2.5 sm:h-3 sm:w-3" /> : <Camera className="mr-1 h-2.5 w-2.5 sm:h-3 sm:w-3" />)}
                          {isCameraActive && !selfieStream && hasCameraPermission === null ? 'Starting...' : (isCameraActive ? 'Close Camera' : 'Open Camera')}
                      </Button>
                      {isCameraActive && selfieStream && hasCameraPermission === true && (
                           <Button
                              type="button"
                              variant="neumorphic-primary"
                              onClick={handleCaptureSelfie}
                              disabled={!selfieStream || !isVideoReadyForCapture || isSavingMood}
                              className="w-full xs:w-auto text-2xs px-2.5 py-1 sm:text-xs sm:px-3 sm:py-1.5"
                              aria-label="Capture Selfie"
                          >
                              <Camera className="mr-1 h-2.5 w-2.5 sm:h-3 sm:w-3" /> Capture
                          </Button>
                      )}
                  </div>

                  <div className="mt-1.5 rounded-md overflow-hidden border border-border neumorphic-inset-sm aspect-video bg-muted/20 flex items-center justify-center text-center p-1">
                    {isCameraActive && selfieStream && hasCameraPermission === true ? (
                      <video
                          ref={videoRef}
                          className="w-full h-full object-cover"
                          muted
                          playsInline
                       />
                    ) : capturedSelfie ? (
                      <div className="p-1 sm:p-1.5 text-muted-foreground">
                        <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-0.5 text-accent" />
                        <p className="text-3xs sm:text-2xs">Selfie captured!</p>
                        <p className="text-3xs">Preview below.</p>
                      </div>
                    ) : hasCameraPermission === false ? (
                      <div className="p-1 sm:p-1.5">
                        <VideoOff className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-0.5 text-destructive" />
                        <p className="font-semibold text-destructive text-3xs sm:text-2xs">Camera Access Denied</p>
                        <p className="text-3xs">Enable in browser.</p>
                      </div>
                    ) : isCameraActive && hasCameraPermission === null ? ( 
                      <div className="p-1 sm:p-1.5">
                        <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-0.5 animate-spin" />
                        <p className="text-3xs sm:text-2xs">Requesting camera...</p>
                      </div>
                    ) : ( 
                      <div className="p-1 sm:p-1.5">
                        <Camera className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-0.5" />
                        <p className="text-3xs sm:text-2xs">Camera is off.</p>
                      </div>
                    )}
                  </div>

                  {capturedSelfie && (
                      <div className="mt-2 space-y-1">
                          <p className="text-2xs sm:text-xs font-medium">Selfie Preview:</p>
                          <div className="relative aspect-video w-full max-w-[150px] sm:max-w-[180px] neumorphic-sm rounded-md overflow-hidden">
                               <Image src={capturedSelfie} alt="Captured selfie" fill={true} className="object-cover" data-ai-hint="selfie person"/>
                          </div>
                          <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={clearCapturedSelfie}
                              className="neumorphic-button items-center text-3xs px-2 py-0.5 sm:text-2xs sm:px-2 sm:py-1"
                              disabled={isSavingMood}
                              aria-label="Clear captured selfie"
                          >
                              <Trash2 className="mr-1 h-2.5 w-2.5 text-destructive" /> Clear Selfie
                          </Button>
                      </div>
                  )}
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0 justify-between pt-3 sm:pt-4">
             <DialogClose asChild>
              <Button type="button" variant="outline" className="neumorphic-button w-full sm:w-auto text-2xs px-2.5 py-1 sm:text-xs sm:px-3 sm:py-1.5" disabled={isSavingMood} aria-label="Cancel mood logging">Cancel</Button>
            </DialogClose>
            <Button
              type="button"
              variant="neumorphic-primary"
              onClick={handleSaveMoodLog}
              disabled={!selectedMood || isSavingMood}
              className="w-full sm:w-auto text-2xs px-2.5 py-1 sm:text-xs sm:px-3 sm:py-1.5"
              aria-label="Save current mood"
            >
              {isSavingMood ? <Loader2 className="mr-1 h-2.5 w-2.5 sm:h-3 sm:w-3 animate-spin" /> : null}
              {isSavingMood ? 'Saving...' : 'Save Mood'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!logToDelete} onOpenChange={(open) => !open && setLogToDelete(null)}>
        <AlertDialogContent className="neumorphic p-4 sm:p-5">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm sm:text-md">Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-2xs sm:text-xs">
              This action cannot be undone. This will permanently delete this mood log.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 pt-3 sm:pt-4">
            <AlertDialogCancel
              onClick={() => setLogToDelete(null)}
              className="neumorphic-button w-full sm:w-auto text-2xs px-2.5 py-1 sm:text-xs sm:px-3 sm:py-1.5"
              aria-label="Cancel mood log deletion"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteMoodLog}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full sm:w-auto text-2xs px-2.5 py-1 sm:text-xs sm:px-3 sm:py-1.5"
              aria-label="Confirm mood log deletion"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


      <SectionCard title="Mood Check-in" icon={<Smile className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />} >
         <CardDescription className="mb-2.5 sm:mb-3 text-xs sm:text-sm">How are you feeling today? Log your mood and optionally add a selfie.</CardDescription>
        <div className="flex space-x-1 xs:space-x-1.5 sm:space-x-2 justify-center sm:justify-start">
          {moodEmojiStrings.map(moodObj => (
            <Button
              key={moodObj.emoji}
              variant="outline"
              size="icon"
              onClick={() => handleMoodButtonClick(moodObj.emoji)}
              className="text-lg sm:text-xl neumorphic-button h-10 w-10 sm:h-12 sm:w-12 hover:neumorphic-inset"
              aria-label={`Log mood: ${moodObj.label}`}
            >
              {moodObj.emoji}
            </Button>
          ))}
        </div>
      </SectionCard>
      
      <SectionCard title="Your Mood Journey" icon={<LineChartIcon className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />}>
        {moodChartData.length >= 2 ? (
          <div className="aspect-[16/9] sm:aspect-[2/1] lg:aspect-[3/1]">
            <ChartContainer config={chartConfig} className="h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={moodChartData}
                  margin={{
                    top: 5,
                    right: 10,
                    left: -25, 
                    bottom: 0,
                  }}
                  accessibilityLayer
                >
                  <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => value.slice(0, 6)} 
                    className="text-2xs sm:text-xs"
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    domain={[0, 5]} 
                    ticks={[1, 2, 3, 4, 5]}
                    tickFormatter={(value) => moodValueToLabel[value] || ''}
                    className="text-2xs sm:text-xs"
                  />
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        indicator="line"
                        nameKey="moodValue"
                        labelKey="date"
                        formatter={(value, name, props) => {
                          const { payload } = props as any; 
                          return (
                            <div className="flex flex-col items-center gap-0.5 p-1">
                              <span className="text-sm font-semibold">{payload.moodEmoji} {moodValueToLabel[payload.moodValue as number]}</span>
                              <span className="text-xs text-muted-foreground">{payload.date}</span>
                            </div>
                          );
                        }}
                        
                      />
                    }
                  />
                  <Line
                    dataKey="moodValue"
                    type="monotone"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{
                      r: 4,
                      fill: "hsl(var(--primary))",
                      stroke: "hsl(var(--background))",
                      strokeWidth: 2,
                    }}
                    activeDot={{
                       r: 6,
                       fill: "hsl(var(--primary))",
                       stroke: "hsl(var(--background))",
                       strokeWidth: 2,
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        ) : (
          <CardDescription className="text-center text-xs sm:text-sm">
            Log your mood for at least two days to see your trend here!
          </CardDescription>
        )}
      </SectionCard>


      <SectionCard title="Mood History" icon={<RotateCcw className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />} itemsCount={sortedMoodLogs.length}>
        <ScrollArea className="w-full h-[200px] sm:h-[250px] md:h-[300px] whitespace-nowrap rounded-md">
          <div className="flex flex-col space-y-1.5 sm:space-y-2 p-0.5 sm:p-1">
            {sortedMoodLogs.map(log => (
              <ItemCard key={log.id} className="bg-card w-full min-w-0 p-2.5 sm:p-3">
                <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-2.5">
                  {log.selfieDataUri && (
                    <div className="relative w-full sm:w-16 md:w-20 h-auto aspect-square rounded-md overflow-hidden neumorphic-inset-sm">
                      <Image src={log.selfieDataUri} alt={`Selfie for mood ${log.mood} on ${log.date ? format(parseISO(log.date), "MMM d") : 'Unknown Date'}`} fill={true} className="object-cover" data-ai-hint="selfie person" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-0.5">
                      <h4 className="font-semibold text-sm sm:text-md flex items-center gap-0.5 sm:gap-1">
                        <span className="text-lg sm:text-xl">{log.mood}</span>
                        {moodEmojiStrings.find(m => m.emoji === log.mood) && 
                           (moodToValueMapping[log.mood] === 5 ? <Laugh className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-400" aria-hidden="true"/> :
                            moodToValueMapping[log.mood] === 4 ? <Smile className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-400" aria-hidden="true"/> :
                            moodToValueMapping[log.mood] === 3 ? <Meh className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-yellow-400" aria-hidden="true"/> :
                            moodToValueMapping[log.mood] === 2 ? <Annoyed className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-400" aria-hidden="true"/> :
                            moodToValueMapping[log.mood] === 1 ? <Frown className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-400" aria-hidden="true"/> : '')
                        }
                      </h4>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => setLogToDelete(log.id)} 
                                className="h-5 w-5 sm:h-6 sm:w-6 p-0 text-muted-foreground hover:text-destructive"
                                aria-label={`Delete mood log from ${log.date ? format(parseISO(log.date), "MMM d, yy 'at' h:mma") : 'Unknown Date'}`}
                            >
                                <Trash2 className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                            </Button>
                    </div>
                     <p className="text-2xs sm:text-xs text-muted-foreground">
                      {log.date ? format(parseISO(log.date), "MMM d, yy 'at' h:mma") : "Date not available"}
                    </p>
                    {log.notes && <p className="text-2xs sm:text-xs mt-1 pt-1 border-t border-border/50 whitespace-pre-wrap break-words">{log.notes}</p>}
                     {log.aiFeedback && (
                      <div className="mt-1 pt-1 border-t border-border/50">
                          <p className="text-xs sm:text-sm flex items-center gap-0.5 text-primary/90">
                              <Sparkles className="h-3 w-3 mr-1.5 text-accent" /> <em>GroZen Insight:</em>
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
        {sortedMoodLogs.length === 0 && (
            <CardDescription className="mt-2.5 text-center text-xs sm:text-sm">
                No mood logs yet. Use the Mood Check-in above to start tracking!
            </CardDescription>
        )}
      </SectionCard>

      <SectionCard title="Share Your Progress" icon={<Gift className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />}>
        {beforeShareLog && afterShareLog ? (
          <SocialShareCard beforeLog={beforeShareLog} afterLog={afterShareLog} />
        ) : (
          <CardDescription className="text-xs sm:text-sm">
            Keep logging your moods with selfies! Once you have at least two selfies, with the latest being at least 14 days after the first (or if you are an admin), your &apos;Before & After&apos; share card will appear here.
          </CardDescription>
        )}
      </SectionCard>


      <SectionCard title="Grocery Concierge" icon={<ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />}>
        <CardDescription className="mb-2.5 sm:mb-3 text-xs sm:text-sm">
          Let GroZen generate a grocery list based on your current wellness plan.
        </CardDescription>
        <Button
          onClick={handleGenerateGroceryListClick}
          disabled={isLoadingGroceryList || !wellnessPlan || !wellnessPlan.meals || wellnessPlan.meals.length === 0}
          variant="neumorphic-primary"
          className="w-full sm:w-auto text-2xs px-2.5 py-1 sm:text-xs sm:px-3 sm:py-1.5"
          aria-label="Generate Grocery List"
        >
          {isLoadingGroceryList ? <Loader2 className="mr-1 h-2.5 w-2.5 sm:h-3 sm:w-3 animate-spin" /> : <ShoppingCart className="mr-1 h-2.5 w-2.5 sm:h-3 sm:w-3" />}
          Generate Grocery List
        </Button>

        {errorGroceryList && (
          <Alert variant="destructive" className="mt-2.5 sm:mt-3">
            <AlertTitle className="text-xs sm:text-sm">Error Generating List</AlertTitle>
            <AlertDescription className="text-2xs sm:text-xs">{errorGroceryList}</AlertDescription>
          </Alert>
        )}

        {!groceryList && !isLoadingGroceryList && !errorGroceryList && (
           <CardDescription className="mt-2.5 sm:mt-3 text-xs sm:text-sm">
               No grocery list generated yet. Click the button above to create one based on your meal plan.
           </CardDescription>
        )}

        {groceryList && !isLoadingGroceryList && groceryList.items.length > 0 && (
          <div className="mt-3 sm:mt-4 space-y-2.5 sm:space-y-3">
            <h3 className="text-xs sm:text-sm font-semibold">
              Your Grocery List <span className="text-3xs sm:text-2xs text-muted-foreground"> (Generated: {groceryList.generatedDate ? format(parseISO(groceryList.generatedDate), "MMM d, yyyy") : 'Unknown'})</span>
            </h3>
            <Accordion type="multiple" className="w-full" defaultValue={Object.keys(groupedGroceryItems).length > 0 ? Object.keys(groupedGroceryItems) : undefined }>
              {Object.entries(groupedGroceryItems).map(([category, items]) => (
                <AccordionItem value={category} key={category} className="neumorphic-sm mb-1 sm:mb-1.5">
                  <AccordionTrigger className="p-2 sm:p-2.5 text-2xs sm:text-xs hover:no-underline">
                    {category} ({items.length})
                  </AccordionTrigger>
                  <AccordionContent className="p-2 sm:p-2.5">
                    <ul className="list-disc pl-3 sm:pl-3.5 space-y-1 sm:space-y-1.5 text-2xs sm:text-xs">
                      {items.map(item => (
                        <li key={item.id} className="break-words flex justify-between items-start gap-1">
                          <div>
                            <strong>{item.name}</strong>
                            {item.quantity && <span className="text-muted-foreground"> ({item.quantity})</span>}
                            {item.notes && <em className="text-muted-foreground text-3xs block"> - {item.notes}</em>}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteGroceryItem(item.id)}
                            className="h-4 w-4 p-0 text-muted-foreground hover:text-destructive shrink-0 ml-1 sm:ml-2"
                            aria-label={`Delete ${item.name} from grocery list`}
                          >
                            <Trash2 className="h-2.5 w-2.5" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            <p className="text-3xs text-muted-foreground mt-2.5 sm:mt-3">
              Note: This is an AI-generated list. Please review for accuracy and adjust quantities as needed.
            </p>
          </div>
        )}
        {groceryList && !isLoadingGroceryList && groceryList.items.length === 0 && (
            <CardDescription className="mt-2.5 sm:mt-3 text-xs sm:text-sm">
               Your grocery list is currently empty. You can generate a new one if you have a meal plan.
            </CardDescription>
        )}
      </SectionCard>

    </main>
  );
}


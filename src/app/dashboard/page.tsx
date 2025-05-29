
"use client";

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic'; 
import { usePlan } from '@/contexts/plan-context';
import Logo from '@/components/logo';
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
  AlertDialogTrigger, // Import AlertDialogTrigger
} from "@/components/ui/alert-dialog"
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { format, differenceInDays, parseISO } from 'date-fns';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

import {
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { LineChart, CartesianGrid, XAxis, YAxis } from "recharts"; 
import { CURRENT_CHALLENGE } from '@/config/challenge';
import { generateShareImage as aiGenerateShareImage, type GenerateShareImageInput } from '@/ai/flows/generate-share-image';


const ChartContainer = dynamic(() => import('@/components/ui/chart').then(mod => mod.ChartContainer), {
  ssr: false,
  loading: () => <div className="flex justify-center items-center h-[180px] sm:h-[200px] md:h-[220px]"><Loader2 className="h-6 w-6 animate-spin" /></div>,
});
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), {
  ssr: false,
  loading: () => <div className="flex justify-center items-center h-[180px] sm:h-[200px] md:h-[220px]"><Loader2 className="h-6 w-6 animate-spin" /></div>,
});
const RechartsLine = dynamic(() => import('recharts').then(mod => mod.Line), { 
  ssr: false,
});

const SocialShareCard = dynamic(() => import('@/components/social-share-card'), {
  ssr: false,
  loading: () => <div className="flex justify-center items-center p-4"><Loader2 className="h-6 w-6 animate-spin" /> <span className="ml-2 text-sm text-muted-foreground">Loading share card...</span></div>,
});


const SectionCard: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; itemsCount?: number; action?: React.ReactNode }> = ({ title, icon, children, itemsCount, action }) => (
  <Card className="neumorphic w-full mb-3 sm:mb-4">
    <CardHeader className="flex flex-col space-y-1 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 pb-1.5 px-3 py-2 sm:px-4 sm:py-2.5">
      <div className="flex flex-row items-center">
        <CardTitle className="text-sm sm:text-base font-medium flex items-center gap-1 sm:gap-1.5">
          {icon} {title}
        </CardTitle>
        {itemsCount !== undefined && <span className="ml-1.5 sm:ml-2 text-3xs sm:text-2xs text-muted-foreground">({itemsCount} items)</span>}
      </div>
      {action && <div className="w-full sm:w-auto pt-1 sm:pt-0">{action}</div>}
    </CardHeader>
    <CardContent className="px-3 pt-0 pb-2.5 sm:px-4 sm:pb-3">
      {children}
    </CardContent>
  </Card>
);

const ItemCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={cn("neumorphic-sm p-2 sm:p-2.5 rounded-md min-w-[170px] sm:min-w-[190px] snap-start", className)}>
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
  // 1. Context Hooks
  const router = useRouter();
  const { toast } = useToast();
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
  

  // 2. useState Hooks
  const [isMoodDialogOpen, setIsMoodDialogOpen] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [moodNotes, setMoodNotes] = useState("");
  // const [logToDelete, setLogToDelete] = useState<string | null>(null); // No longer needed as state, AlertDialog handles its own open state
  const [isSavingMood, setIsSavingMood] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState("");
  const [isUpdatingDisplayName, setIsUpdatingDisplayName] = useState(false);
  const [isSharingChallenge, setIsSharingChallenge] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [selfieStream, setSelfieStream] = useState<MediaStream | null>(null);
  const [capturedSelfie, setCapturedSelfie] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isVideoReadyForCapture, setIsVideoReadyForCapture] = useState(false);
  const [beforeShareLog, setBeforeShareLog] = useState<MoodLog | null>(null);
  const [afterShareLog, setAfterShareLog] = useState<MoodLog | null>(null);

  // 3. useRef Hooks
  const videoRef = useRef<HTMLVideoElement>(null);

  // 4. useEffect Hooks
  useEffect(() => {
    if (!isLoadingAuth) {
      if (!currentUser) {
        if (router.isReady && !['/login', '/signup', '/'].includes(router.pathname)) {
          router.replace('/login');
        }
      } else { 
        if (!isAdminUser) { 
          if (!isOnboardedState && !isLoadingPlan) { 
            if (router.isReady && router.pathname !== '/onboarding') {
              router.replace('/onboarding');
            }
          }
        }
      }
    }
  }, [currentUser, isAdminUser, isLoadingAuth, isOnboardedState, isLoadingPlan, router, isPlanAvailable]);

  useEffect(() => {
    if (currentUserProfile?.displayName) {
      setNewDisplayName(currentUserProfile.displayName);
    } else if (currentUser && !currentUserProfile?.displayName) {
        setNewDisplayName(currentUser.email?.split('@')[0] || "GroZen User");
    }
  }, [currentUserProfile, currentUser]);


  useEffect(() => {
    const logsWithSelfies = [...moodLogs]
      .filter(log => !!log.selfieDataUri && log.date)
      .sort((a, b) => (a.date && b.date ? parseISO(a.date).getTime() - parseISO(b.date).getTime() : 0));

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
        if (video.srcObject !== selfieStream) { 
            video.srcObject = selfieStream;
        }

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
            video.play().catch(err => {
                 console.error("Error attempting to play already loaded video", err);
                 toast({ variant: "destructive", title: "Camera Error", description: "Failed to resume video." });
            });
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
        if (video && video.srcObject && !isCameraActive) {
            (video.srcObject as MediaStream).getTracks().forEach(track => track.stop());
            video.srcObject = null;
        }
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

  // 5. useMemo Hooks
  const sortedMoodLogs = useMemo(() => {
    return [...moodLogs].sort((a, b) => {
      const dateA = a.date ? parseISO(a.date).getTime() : (a.createdAt instanceof Date ? a.createdAt.getTime() : 0);
      const dateB = b.date ? parseISO(b.date).getTime() : (b.createdAt instanceof Date ? b.createdAt.getTime() : 0);
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
      .filter(log => log.moodValue > 0) 
      .sort((a,b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime()); 
  }, [moodLogs]);
  
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
  
  const todayDateString = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  const isChallengeDayLoggedToday = useMemo(() => {
    return !!userActiveChallenge?.completedDates.includes(todayDateString);
  }, [userActiveChallenge, todayDateString]);


  // Component Logic & Event Handlers
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
        
        if (selfieStream) {
            selfieStream.getTracks().forEach(track => track.stop());
        }
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

  const handleLogout = async () => {
    await logoutUser();
  };

  const confirmDeleteMoodLog = async (logId: string) => { // Accept logId as parameter
    if (logId) {
      await deleteMoodLog(logId);
      // setLogToDelete(null); // No longer needed as AlertDialog controls itself
    }
  };
  
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
        toast({ variant: "default", title: "Sharing Text Only", description: "Couldn't generate a custom image this time. Sharing your progress with text!" });
      }
    } catch (error: any) {
      console.error("Error generating share image:", error);
      if (error.message && error.message.includes("AI did not return an image")) {
        toast({ variant: "default", title: "Sharing Text Only", description: "Couldn't generate a custom image this time. Sharing your progress with text!" });
      } else {
        toast({ variant: "destructive", title: "Image Generation Error", description: "Proceeding with text-only share." });
      }
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


  // Conditional Returns 
  if (isLoadingAuth || (!isLoadingAuth && !currentUser && router.isReady && !['/login', '/signup', '/'].includes(router.pathname))) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Logo size="text-2xl sm:text-3xl" />
        <Loader2 className="mt-4 h-6 w-6 animate-spin text-primary" />
        <p className="mt-2 text-xs sm:text-sm text-muted-foreground">Loading user data...</p>
      </div>
    );
  }
  
  if (currentUser && !isAdminUser && isOnboardedState && !isPlanAvailable && !isLoadingPlan) { 
     return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <Logo size="text-xl sm:text-2xl" />
        <p className="mt-3 text-sm sm:text-base">No wellness plan found or an error occurred.</p>
        <p className="text-2xs sm:text-xs text-muted-foreground">Please try creating a new plan.</p>
        <Button variant="neumorphic-primary" onClick={() => {clearPlanAndData(false, true); router.push('/onboarding');}} className="mt-3 text-xs sm:text-sm px-3 py-1.5 h-8 sm:h-9" aria-label="Create a New Plan">
          Create a New Plan
        </Button>
         <Button variant="outline" onClick={handleLogout} className="mt-3 neumorphic-button text-2xs sm:text-xs px-2 py-1 h-7 sm:h-8" aria-label="Logout">
            <LogOut className="mr-1 h-3 w-3" /> Logout
        </Button>
      </div>
    );
  }

  if (currentUser && isOnboardedState && isLoadingPlan && !isPlanAvailable ) { 
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <Logo size="text-xl sm:text-2xl" />
        <p className="mt-3 text-sm sm:text-base">Generating your personalized plan...</p>
        <RotateCcw className="mt-3 h-5 w-5 sm:h-6 sm:w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <main className="container mx-auto p-3 sm:p-4 md:p-6">
      <header className="flex flex-col xs:flex-row justify-between items-center mb-4 sm:mb-5">
        <Logo size="text-lg sm:text-xl" />
        <div className="flex items-center gap-1.5 sm:gap-2 mt-2 xs:mt-0">
            {isAdminUser && (
                <Button 
                    variant="outline" 
                    onClick={() => router.push('/admin')} 
                    className="neumorphic-button text-3xs px-2 py-1 sm:text-2xs sm:px-2.5 sm:py-1.5 h-7 sm:h-8"
                    aria-label="Admin Panel"
                >
                    <ShieldCheck className="mr-1 h-2.5 w-2.5 sm:h-3 sm:w-3" /> Admin
                </Button>
            )}
            {!isAdminUser && ( 
                <Button variant="outline" onClick={() => { clearPlanAndData(false, true); router.push('/onboarding'); }} className="neumorphic-button text-3xs px-2 py-1 sm:text-2xs sm:px-2.5 sm:py-1.5 h-7 sm:h-8" aria-label="New Plan / Edit Preferences">
                 New Plan/Edit
                </Button>
            )}
            <Button variant="outline" onClick={handleLogout} className="neumorphic-button text-3xs px-2 py-1 sm:text-2xs sm:px-2.5 sm:py-1.5 h-7 sm:h-8" aria-label="Logout">
                <LogOut className="mr-1 h-2.5 w-2.5 sm:h-3 sm:w-3" /> Logout
            </Button>
        </div>
      </header>

      {isLoadingPlan && wellnessPlan && ( 
        <div className="fixed inset-0 bg-background/80 flex flex-col items-center justify-center z-50">
          <RotateCcw className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-primary" />
          <p className="mt-2 text-xs sm:text-sm">Updating your plan...</p>
        </div>
      )}
      
      <div className="mb-4 sm:mb-5 p-3 sm:p-4 neumorphic rounded-lg">
        <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-foreground">Your GroZen Wellness Plan</h2>
        <p className="text-2xs sm:text-xs text-muted-foreground">Here&apos;s your personalized guide. Stay consistent!</p>
      </div>

      {(isPlanAvailable || (isAdminUser && wellnessPlan)) && wellnessPlan && ( 
        <>
          <SectionCard title="Meals" icon={<Utensils className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent" />} itemsCount={wellnessPlan.meals.length}>
            <ScrollArea className="w-full whitespace-nowrap rounded-md">
              <div className="flex space-x-2 sm:space-x-2.5 pb-2 sm:pb-2.5">
                {wellnessPlan.meals.map((meal, index) => (
                  <ItemCard key={`meal-${index}`} className="bg-card">
                    <h4 className="font-semibold text-2xs sm:text-xs mb-1 flex items-center">
                        <CalendarDays className="h-3.5 w-3.5 mr-1 text-muted-foreground" /> {meal.day}
                    </h4>
                    <p className="text-3xs xs:text-2xs sm:text-xs break-words whitespace-normal"><strong>B:</strong> {meal.breakfast}</p>
                    <p className="text-3xs xs:text-2xs sm:text-xs break-words whitespace-normal"><strong>L:</strong> {meal.lunch}</p>
                    <p className="text-3xs xs:text-2xs sm:text-xs break-words whitespace-normal"><strong>D:</strong> {meal.dinner}</p>
                  </ItemCard>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </SectionCard>

          <SectionCard title="Exercise Routine" icon={<Dumbbell className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent" />} itemsCount={wellnessPlan.exercise.length}>
            <ScrollArea className="w-full whitespace-nowrap rounded-md">
              <div className="flex space-x-2 sm:space-x-2.5 pb-2 sm:pb-2.5">
                {wellnessPlan.exercise.map((ex, index) => (
                  <ItemCard key={`ex-${index}`} className="bg-card">
                     <h4 className="font-semibold text-2xs sm:text-xs mb-1 flex items-center">
                        <CalendarDays className="h-3.5 w-3.5 mr-1 text-muted-foreground" /> {ex.day}
                    </h4>
                    <p className="text-3xs xs:text-2xs sm:text-xs break-words whitespace-normal"><strong>Activity:</strong> {ex.activity}</p>
                    <p className="text-3xs xs:text-2xs sm:text-xs break-words whitespace-normal"><strong>Duration:</strong> {ex.duration}</p>
                  </ItemCard>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </SectionCard>

          <SectionCard title="Mindfulness Practices" icon={<Brain className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent" />} itemsCount={wellnessPlan.mindfulness.length}>
            <ScrollArea className="w-full whitespace-nowrap rounded-md">
              <div className="flex space-x-2 sm:space-x-2.5 pb-2 sm:pb-2.5">
                {wellnessPlan.mindfulness.map((mind, index) => (
                  <ItemCard key={`mind-${index}`} className="bg-card">
                    <h4 className="font-semibold text-2xs sm:text-xs mb-1 flex items-center">
                        <CalendarDays className="h-3.5 w-3.5 mr-1 text-muted-foreground" /> {mind.day}
                    </h4>
                    <p className="text-3xs xs:text-2xs sm:text-xs break-words whitespace-normal"><strong>Practice:</strong> {mind.practice}</p>
                    <p className="text-3xs xs:text-2xs sm:text-xs break-words whitespace-normal"><strong>Duration:</strong> {mind.duration}</p>
                  </ItemCard>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </SectionCard>
        </>
      )}
      
      {isAdminUser && !isPlanAvailable && !isLoadingPlan && ( 
        <Alert className="mb-3 sm:mb-4 neumorphic">
          <AlertTitle className="text-sm sm:text-base">Admin View</AlertTitle>
          <AlertDescription className="text-2xs sm:text-xs">
            You are logged in as an admin. You can view your personal plan here if you create one, or proceed to the Admin Panel.
            <Button variant="link" onClick={() => { clearPlanAndData(false, true); router.push('/onboarding'); }} className="p-0 h-auto ml-1 text-accent text-2xs sm:text-xs">Create Personal Plan?</Button>
          </AlertDescription>
        </Alert>
      )}

      <SectionCard title="Your Profile" icon={<UserIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent" />}>
        <div className="space-y-1.5 sm:space-y-2">
          <div>
            <Label htmlFor="displayName" className="text-xs sm:text-sm">Display Name (for Leaderboard)</Label>
            <Input
              id="displayName"
              type="text"
              value={newDisplayName}
              onChange={(e) => setNewDisplayName(e.target.value)}
              placeholder="Your public name"
              className="mt-1 text-xs sm:text-sm h-9 sm:h-10"
              disabled={isUpdatingDisplayName}
            />
          </div>
          <Button 
            onClick={handleSaveDisplayName} 
            disabled={isUpdatingDisplayName || newDisplayName === (currentUserProfile?.displayName || "")}
            variant="neumorphic-primary"
            className="w-full sm:w-auto text-2xs px-2.5 py-1 h-8 sm:text-xs sm:px-3 sm:py-1.5 sm:h-9"
          >
            {isUpdatingDisplayName ? <Loader2 className="mr-1.5 h-2.5 w-2.5 animate-spin" /> : null}
            Save Display Name
          </Button>
        </div>
      </SectionCard>

      <SectionCard 
        title="Current Wellness Challenge" 
        icon={<Trophy className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent" />}
        action={
            userActiveChallenge && (
            <Link href="/leaderboard" passHref>
                <Button
                    variant="outline"
                    className="neumorphic-button text-3xs px-1.5 py-0.5 sm:text-2xs sm:px-2 sm:py-1 h-7 sm:h-8"
                    aria-label="View Challenge Leaderboard"
                >
                    <ListOrdered className="mr-0.5 sm:mr-1 h-2.5 w-2.5 sm:h-3 sm:w-3" /> Leaderboard
                </Button>
            </Link>
            )
        }
      >
        <CardTitle className="text-sm sm:text-base mb-0.5">{CURRENT_CHALLENGE.title}</CardTitle>
        <CardDescription className="text-2xs sm:text-xs mb-2 sm:mb-2.5">{CURRENT_CHALLENGE.description}</CardDescription>
        {isLoadingUserChallenge ? (
          <div className="flex items-center justify-center py-1.5">
            <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin text-primary" />
            <p className="ml-1.5 text-2xs sm:text-xs text-muted-foreground">Loading challenge...</p>
          </div>
        ) : !userActiveChallenge ? (
          <Button
            variant="neumorphic-primary"
            onClick={joinCurrentChallenge}
            className="w-full sm:w-auto text-2xs px-2.5 py-1 h-8 sm:text-xs sm:px-3 sm:py-1.5 sm:h-9"
            aria-label={`Join ${CURRENT_CHALLENGE.title} challenge`}
          >
            Join Challenge
          </Button>
        ) : (
          <div className="space-y-1.5 sm:space-y-2">
            <p className="text-2xs sm:text-xs">
              Your Progress: <span className="font-semibold">{userActiveChallenge.daysCompleted}</span> / {CURRENT_CHALLENGE.durationDays} days
            </p>
            {userActiveChallenge.daysCompleted >= CURRENT_CHALLENGE.durationDays ? (
                 <Alert variant="default" className="neumorphic-sm p-2 sm:p-2.5">
                    <Trophy className="h-3.5 w-3.5 text-yellow-400" />
                    <AlertTitle className="text-2xs sm:text-xs text-yellow-300">Challenge Complete!</AlertTitle>
                    <AlertDescription className="text-3xs sm:text-2xs">
                        Congratulations on completing the {CURRENT_CHALLENGE.title}!
                    </AlertDescription>
                </Alert>
            ) : isChallengeDayLoggedToday ? (
              <div className="flex items-center gap-1 p-1.5 sm:p-2 neumorphic-inset-sm rounded-md">
                <CheckSquare className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-green-400" />
                <p className="text-3xs sm:text-2xs text-green-300">Today&apos;s challenge logged! Keep it up!</p>
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={logChallengeDay}
                className="neumorphic-button w-full sm:w-auto text-2xs px-2.5 py-1 h-8 sm:text-xs sm:px-3 sm:py-1.5 sm:h-9"
                aria-label="Log today's challenge completion"
              >
                <CheckSquare className="mr-1 h-2.5 w-2.5 sm:h-3 sm:w-3"/> Log Today
              </Button>
            )}
            <Button
                variant="outline"
                onClick={handleChallengeShare}
                disabled={isSharingChallenge}
                className="neumorphic-button w-full sm:w-auto text-2xs px-2.5 py-1 h-8 sm:text-xs sm:px-3 sm:py-1.5 sm:h-9"
                aria-label="Share challenge progress"
            >
                {isSharingChallenge ? <Loader2 className="mr-1 h-2.5 w-2.5 sm:h-3 sm:w-3 animate-spin" /> : <ShareIcon className="mr-1 h-2.5 w-2.5 sm:h-3 sm:w-3"/>}
                {isSharingChallenge ? 'Sharing...' : 'Share Progress'}
            </Button>
          </div>
        )}
      </SectionCard>


      <Dialog open={isMoodDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="neumorphic w-[90vw] max-w-md p-3 sm:p-4">
          <DialogHeader className="pb-2 sm:pb-2.5">
            <DialogTitle className="flex items-center text-sm sm:text-base">
              Log Your Mood: <span className="ml-1 sm:ml-1.5 text-base sm:text-lg">{selectedMood}</span>
            </DialogTitle>
            <DialogDescription className="text-2xs sm:text-xs">
              How are you feeling? Add notes or a selfie.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[calc(80vh-180px)] sm:max-h-[calc(70vh-180px)] -mx-0.5 px-0.5">
            <div className="grid gap-2 sm:gap-2.5 py-2 sm:py-2.5">
              <div className="space-y-0.5">
                <Label htmlFor="mood-notes" className="text-2xs sm:text-xs">Notes (Optional)</Label>
                <Textarea
                  id="mood-notes"
                  value={moodNotes}
                  onChange={(e) => setMoodNotes(e.target.value)}
                  placeholder="Any thoughts or details..."
                  className="h-12 sm:h-14 neumorphic-inset-sm text-2xs sm:text-xs"
                  disabled={isSavingMood}
                  aria-label="Mood notes"
                />
              </div>
              <div className="space-y-0.5">
                  <Label className="text-2xs sm:text-xs">Selfie (Optional)</Label>
                  <div className="flex flex-col xs:flex-row items-start xs:items-center gap-1 sm:gap-1.5">
                      <Button
                          type="button"
                          variant="outline"
                          onClick={handleToggleCamera}
                          className="neumorphic-button w-full xs:w-auto text-3xs px-2 py-1 sm:text-2xs sm:px-2.5 sm:py-1 h-7 sm:h-8"
                          disabled={!!capturedSelfie || isSavingMood || (isCameraActive && !selfieStream && hasCameraPermission === null) } 
                          aria-label={isCameraActive ? 'Close Camera' : 'Open Camera'}
                      >
                          {isCameraActive && !selfieStream && hasCameraPermission === null ? <Loader2 className="mr-1 h-2 w-2 sm:h-2.5 sm:w-2.5 animate-spin" /> : (isCameraActive ? <VideoOff className="mr-1 h-2.5 w-2.5" /> : <Camera className="mr-1 h-2.5 w-2.5" />)}
                          {isCameraActive && !selfieStream && hasCameraPermission === null ? 'Starting...' : (isCameraActive ? 'Close Cam' : 'Open Cam')}
                      </Button>
                      {isCameraActive && selfieStream && hasCameraPermission === true && (
                           <Button
                              type="button"
                              variant="neumorphic-primary"
                              onClick={handleCaptureSelfie}
                              disabled={!selfieStream || !isVideoReadyForCapture || isSavingMood}
                              className="w-full xs:w-auto text-3xs px-2 py-1 sm:text-2xs sm:px-2.5 sm:py-1 h-7 sm:h-8"
                              aria-label="Capture Selfie"
                          >
                              <Camera className="mr-1 h-2.5 w-2.5" /> Capture
                          </Button>
                      )}
                  </div>
                  {/* Responsive Video Container */}
                  <div className={cn(
                      "mt-1.5 rounded-md overflow-hidden border border-border neumorphic-inset-sm bg-muted/20 flex items-center justify-center text-center p-1",
                      "aspect-[3/4] sm:aspect-square md:aspect-video" 
                    )}>
                    {isCameraActive && selfieStream && hasCameraPermission === true ? (
                      <video
                          ref={videoRef}
                          className="w-full h-full object-cover"
                          muted
                          playsInline 
                       />
                    ) : capturedSelfie ? (
                      <div className="p-1 sm:p-1.5 text-muted-foreground">
                        <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 mx-auto mb-0.5 text-accent" />
                        <p className="text-3xs sm:text-2xs">Selfie captured!</p>
                        <p className="text-3xs">Preview below.</p>
                      </div>
                    ) : hasCameraPermission === false ? (
                      <div className="p-1 sm:p-1.5">
                        <VideoOff className="h-4 w-4 sm:h-5 sm:w-5 mx-auto mb-0.5 text-destructive" />
                        <p className="font-semibold text-destructive text-3xs sm:text-2xs">Camera Access Denied</p>
                        <p className="text-3xs">Enable in browser.</p>
                      </div>
                    ) : isCameraActive && hasCameraPermission === null ? ( 
                      <div className="p-1 sm:p-1.5">
                        <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 mx-auto mb-0.5 animate-spin" />
                        <p className="text-3xs sm:text-2xs">Requesting camera...</p>
                      </div>
                    ) : ( 
                      <div className="p-1 sm:p-1.5">
                        <Camera className="h-4 w-4 sm:h-5 sm:w-5 mx-auto mb-0.5" />
                        <p className="text-3xs sm:text-2xs">Camera is off.</p>
                      </div>
                    )}
                  </div>

                  {capturedSelfie && (
                      <div className="mt-1.5 space-y-0.5">
                          <p className="text-2xs sm:text-xs font-medium">Selfie Preview:</p>
                          <div className="relative aspect-video w-full max-w-[120px] sm:max-w-[150px] neumorphic-sm rounded-md overflow-hidden">
                               <Image src={capturedSelfie} alt="Captured selfie" fill={true} className="object-cover" data-ai-hint="selfie person"/>
                          </div>
                          <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={clearCapturedSelfie}
                              className="neumorphic-button items-center text-3xs px-1.5 py-0.5 sm:text-2xs sm:px-2 sm:py-1 h-6 sm:h-7"
                              disabled={isSavingMood}
                              aria-label="Clear captured selfie"
                          >
                              <Trash2 className="mr-1 h-2 w-2 sm:h-2.5 sm:w-2.5 text-destructive" /> Clear
                          </Button>
                      </div>
                  )}
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="flex flex-col sm:flex-row gap-1.5 sm:gap-2 justify-between pt-2.5 sm:pt-3">
             <DialogClose asChild>
              <Button type="button" variant="outline" className="neumorphic-button w-full sm:w-auto text-2xs px-2 py-1 sm:text-xs sm:px-2.5 sm:py-1.5 h-8 sm:h-9" disabled={isSavingMood} aria-label="Cancel mood logging">Cancel</Button>
            </DialogClose>
            <Button
              type="button"
              variant="neumorphic-primary"
              onClick={handleSaveMoodLog}
              disabled={!selectedMood || isSavingMood}
              className="w-full sm:w-auto text-2xs px-2 py-1 sm:text-xs sm:px-2.5 sm:py-1.5 h-8 sm:h-9"
              aria-label="Save current mood"
            >
              {isSavingMood ? <Loader2 className="mr-1 h-2.5 w-2.5 animate-spin" /> : null}
              {isSavingMood ? 'Saving...' : 'Save Mood'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SectionCard title="Mood Check-in" icon={<Smile className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent" />} >
         <CardDescription className="mb-2 sm:mb-2.5 text-2xs sm:text-xs">How are you feeling today? Log your mood and optionally add a selfie.</CardDescription>
        <div className="flex space-x-1 xs:space-x-1.5 justify-center sm:justify-start">
          {moodEmojiStrings.map(moodObj => (
            <Button
              key={moodObj.emoji}
              variant="outline"
              size="icon"
              onClick={() => handleMoodButtonClick(moodObj.emoji)}
              className="text-base sm:text-lg neumorphic-button h-9 w-9 sm:h-10 sm:w-10 hover:neumorphic-inset"
              aria-label={`Log mood: ${moodObj.label}`}
            >
              {moodObj.emoji}
            </Button>
          ))}
        </div>
      </SectionCard>
      
      <SectionCard title="Your Mood Journey" icon={<LineChartIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent" />}>
        {moodChartData.length >= 2 ? (
          <div className="h-[180px] sm:h-[200px] md:h-[220px]">
            <ChartContainer config={chartConfig} className="h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={moodChartData}
                  margin={{
                    top: 5,
                    right: 5,
                    left: -30, 
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
                    className="text-3xs sm:text-2xs"
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    domain={[0, 5]} 
                    ticks={[1, 2, 3, 4, 5]}
                    tickFormatter={(value) => moodValueToLabel[value] || ''}
                    className="text-3xs sm:text-2xs"
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
                            <div className="flex flex-col items-center gap-0.5 p-1 text-xs">
                              <span className="font-semibold">{payload.moodEmoji} {moodValueToLabel[payload.moodValue as number]}</span>
                              <span className="text-2xs text-muted-foreground">{payload.date}</span>
                            </div>
                          );
                        }}
                        
                      />
                    }
                  />
                  { RechartsLine && 
                    <RechartsLine
                      dataKey="moodValue"
                      type="monotone"
                      stroke="hsl(var(--primary))"
                      strokeWidth={1.5}
                      dot={{
                        r: 3,
                        fill: "hsl(var(--primary))",
                        stroke: "hsl(var(--background))",
                        strokeWidth: 1.5,
                      }}
                      activeDot={{
                         r: 4,
                         fill: "hsl(var(--primary))",
                         stroke: "hsl(var(--background))",
                         strokeWidth: 2,
                      }}
                    />
                  }
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        ) : (
          <CardDescription className="text-center text-2xs sm:text-xs py-2">
            Log your mood for at least two days to see your trend here!
          </CardDescription>
        )}
      </SectionCard>


      <SectionCard title="Mood History" icon={<RotateCcw className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent" />} itemsCount={sortedMoodLogs.length}>
        <ScrollArea className="w-full h-[180px] sm:h-[220px] md:h-[250px] whitespace-nowrap rounded-md">
          <div className="flex flex-col space-y-1.5 sm:space-y-2 p-0.5">
            {sortedMoodLogs.map(log => (
              <ItemCard key={log.id} className="bg-card w-full min-w-0 p-2 sm:p-2.5">
                <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-2">
                  {log.selfieDataUri && (
                    <div className="relative w-full sm:w-14 md:w-16 h-auto aspect-square rounded-md overflow-hidden neumorphic-inset-sm">
                      <Image src={log.selfieDataUri} alt={`Selfie for mood ${log.mood} on ${log.date ? format(parseISO(log.date), "MMM d") : 'Unknown Date'}`} fill={true} className="object-cover" data-ai-hint="selfie person" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-0.5">
                      <h4 className="font-semibold text-sm sm:text-base flex items-center gap-0.5 sm:gap-1">
                        <span className="text-base sm:text-lg">{log.mood}</span>
                        {moodEmojiStrings.find(m => m.emoji === log.mood) && 
                           (moodToValueMapping[log.mood] === 5 ? <Laugh className="h-3.5 w-3.5 text-green-400" aria-hidden="true"/> :
                            moodToValueMapping[log.mood] === 4 ? <Smile className="h-3.5 w-3.5 text-blue-400" aria-hidden="true"/> :
                            moodToValueMapping[log.mood] === 3 ? <Meh className="h-3.5 w-3.5 text-yellow-400" aria-hidden="true"/> :
                            moodToValueMapping[log.mood] === 2 ? <Annoyed className="h-3.5 w-3.5 text-orange-400" aria-hidden="true"/> :
                            moodToValueMapping[log.mood] === 1 ? <Frown className="h-3.5 w-3.5 text-red-400" aria-hidden="true"/> : '')
                        }
                      </h4>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-4 w-4 sm:h-5 sm:w-5 p-0 text-muted-foreground hover:text-destructive"
                                aria-label={`Delete mood log from ${log.date ? format(parseISO(log.date), "MMM d, yy 'at' h:mma") : 'Unknown Date'}`}
                            >
                                <Trash2 className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="neumorphic p-3 sm:p-4">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-sm sm:text-base">Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription className="text-2xs sm:text-xs">
                              This action cannot be undone. This will permanently delete this mood log.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="flex-col sm:flex-row gap-1.5 sm:gap-2 pt-2.5 sm:pt-3">
                            <AlertDialogCancel
                              className="neumorphic-button w-full sm:w-auto text-2xs px-2 py-1 sm:text-xs sm:px-2.5 sm:py-1.5 h-8 sm:h-9"
                              aria-label="Cancel mood log deletion"
                            >
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => confirmDeleteMoodLog(log.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full sm:w-auto text-2xs px-2 py-1 sm:text-xs sm:px-2.5 sm:py-1.5 h-8 sm:h-9"
                              aria-label="Confirm mood log deletion"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                     <p className="text-3xs sm:text-2xs text-muted-foreground">
                      {log.date ? format(parseISO(log.date), "MMM d, yy 'at' h:mma") : "Date not available"}
                    </p>
                    {log.notes && <p className="text-2xs sm:text-xs mt-0.5 pt-0.5 border-t border-border/50 whitespace-pre-wrap break-words">{log.notes}</p>}
                     {log.aiFeedback && (
                      <div className="mt-0.5 pt-0.5 border-t border-border/50">
                          <p className="text-2xs sm:text-xs flex items-center gap-0.5 text-primary/90">
                              <Sparkles className="h-3 w-3 mr-1 text-accent" /> <em>GroZen Insight:</em>
                          </p>
                          <p className="text-3xs sm:text-2xs italic text-muted-foreground/90 whitespace-pre-wrap break-words">{log.aiFeedback}</p>
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
            <CardDescription className="mt-2 text-center text-2xs sm:text-xs">
                No mood logs yet. Use the Mood Check-in above to start tracking!
            </CardDescription>
        )}
      </SectionCard>

      <SectionCard title="Share Your Progress" icon={<Gift className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent" />}>
        {beforeShareLog && afterShareLog ? (
          <SocialShareCard beforeLog={beforeShareLog} afterLog={afterShareLog} />
        ) : (
          <CardDescription className="text-2xs sm:text-xs">
            Keep logging your moods with selfies! Once you have at least two selfies, with the latest being at least 14 days after the first (or if you are an admin), your &apos;Before & After&apos; share card will appear here.
          </CardDescription>
        )}
      </SectionCard>


      <SectionCard title="Grocery Concierge" icon={<ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent" />}>
        <CardDescription className="mb-2 sm:mb-2.5 text-2xs sm:text-xs">
          Let GroZen generate a grocery list based on your current wellness plan.
        </CardDescription>
        <Button
          onClick={handleGenerateGroceryListClick}
          disabled={isLoadingGroceryList || !wellnessPlan || !wellnessPlan.meals || wellnessPlan.meals.length === 0}
          variant="neumorphic-primary"
          className="w-full sm:w-auto text-2xs px-2.5 py-1 h-8 sm:text-xs sm:px-3 sm:py-1.5 sm:h-9"
          aria-label="Generate Grocery List"
        >
          {isLoadingGroceryList ? <Loader2 className="mr-1 h-2.5 w-2.5 animate-spin" /> : <ShoppingCart className="mr-1 h-2.5 w-2.5" />}
          Generate Grocery List
        </Button>

        {errorGroceryList && (
          <Alert variant="destructive" className="mt-2 sm:mt-2.5 p-2 sm:p-3">
            <AlertTitle className="text-xs sm:text-sm">Error Generating List</AlertTitle>
            <AlertDescription className="text-2xs sm:text-xs">{errorGroceryList}</AlertDescription>
          </Alert>
        )}

        {!groceryList && !isLoadingGroceryList && !errorGroceryList && (
           <CardDescription className="mt-2 sm:mt-2.5 text-2xs sm:text-xs">
               No grocery list generated yet. Click the button above to create one based on your meal plan.
           </CardDescription>
        )}

        {groceryList && !isLoadingGroceryList && groceryList.items.length > 0 && (
          <div className="mt-2.5 sm:mt-3 space-y-2 sm:space-y-2.5">
            <h3 className="text-xs sm:text-sm font-semibold">
              Your Grocery List <span className="text-3xs sm:text-2xs text-muted-foreground"> (Generated: {groceryList.generatedDate ? format(parseISO(groceryList.generatedDate), "MMM d, yyyy") : 'Unknown'})</span>
            </h3>
            <Accordion type="multiple" className="w-full" defaultValue={Object.keys(groupedGroceryItems).length > 0 ? Object.keys(groupedGroceryItems) : undefined }>
              {Object.entries(groupedGroceryItems).map(([category, items]) => (
                <AccordionItem value={category} key={category} className="neumorphic-sm mb-1 sm:mb-1.5">
                  <AccordionTrigger className="p-1.5 sm:p-2 text-2xs sm:text-xs hover:no-underline">
                    {category} ({items.length})
                  </AccordionTrigger>
                  <AccordionContent className="p-1.5 sm:p-2">
                    <ul className="list-disc pl-3 sm:pl-3.5 space-y-1 sm:space-y-1.5 text-2xs sm:text-xs">
                      {items.map(item => (
                        <li key={item.id} className="break-words flex justify-between items-start gap-1">
                          <div>
                            <strong>{item.name}</strong>
                            {item.quantity && <span className="text-muted-foreground text-3xs sm:text-2xs"> ({item.quantity})</span>}
                            {item.notes && <em className="text-muted-foreground text-3xs block"> - {item.notes}</em>}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteGroceryItem(item.id)}
                            className="h-3.5 w-3.5 p-0 text-muted-foreground hover:text-destructive shrink-0 ml-1 sm:ml-1.5"
                            aria-label={`Delete ${item.name} from grocery list`}
                          >
                            <Trash2 className="h-2 w-2 sm:h-2.5 sm:w-2.5" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            <p className="text-3xs text-muted-foreground mt-2 sm:mt-2.5">
              Note: This is an AI-generated list. Please review for accuracy and adjust quantities as needed.
            </p>
          </div>
        )}
        {groceryList && !isLoadingGroceryList && groceryList.items.length === 0 && (
            <CardDescription className="mt-2 sm:mt-2.5 text-2xs sm:text-xs">
               Your grocery list is currently empty. You can generate a new one if you have a meal plan.
            </CardDescription>
        )}
      </SectionCard>

    </main>
  );
}

    
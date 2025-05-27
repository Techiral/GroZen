
"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { usePlan } from '@/contexts/plan-context';
import Logo from '@/components/logo';
import SocialShareCard from '@/components/social-share-card';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import type { Meal, Exercise, Mindfulness, MoodLog, GroceryItem } from '@/types/wellness';
import { Utensils, Dumbbell, Brain, CalendarDays, RotateCcw, Smile, Annoyed, Frown, Meh, Laugh, Camera, Sparkles, Trash2, VideoOff, ShoppingCart, Loader2, Gift, LogOut } from 'lucide-react';
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { format, differenceInDays } from 'date-fns';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";


const SectionCard: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; itemsCount?: number; action?: React.ReactNode }> = ({ title, icon, children, itemsCount, action }) => (
  <Card className="neumorphic w-full mb-6">
    <CardHeader className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 pb-2">
      <div className="flex flex-row items-center">
        <CardTitle className="text-md sm:text-lg md:text-xl font-medium flex items-center gap-2">
          {icon} {title}
        </CardTitle>
        {itemsCount !== undefined && <span className="ml-2 sm:ml-3 text-2xs sm:text-xs text-muted-foreground">{itemsCount} items</span>}
      </div>
      {action && <div className="w-full sm:w-auto pt-2 sm:pt-0">{action}</div>}
    </CardHeader>
    <CardContent>
      {children}
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
const moodEmojiStrings = ["😊", "🙂", "😐", "😕", "😞"];


export default function DashboardPage() {
  const router = useRouter();
  const { 
    currentUser,
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
    generateGroceryList,
    isPlanAvailable
  } = usePlan();
  const { toast } = useToast();

  const [isMoodDialogOpen, setIsMoodDialogOpen] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [moodNotes, setMoodNotes] = useState("");
  const [logToDelete, setLogToDelete] = useState<string | null>(null);

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
      } else if (!isPlanAvailable && !isLoadingPlan && !isOnboardedState) { 
        router.replace('/onboarding');
      } else if (isOnboardedState && !isPlanAvailable && !isLoadingPlan) {
         // If onboarded, but plan somehow missing and not loading, maybe prompt to re-generate or go to onboarding to review.
         // For now, we can direct to onboarding to be safe, or just show dashboard with "no plan" message.
         // Consider a state where onboarding is done, but plan failed to generate.
         // Let's keep them on dashboard to see if they can try generating a new plan.
      }
    }
  }, [currentUser, isLoadingAuth, isPlanAvailable, isLoadingPlan, isOnboardedState, router]);


  const sortedMoodLogs = React.useMemo(() => {
    return [...moodLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [moodLogs]);

  const [beforeShareLog, setBeforeShareLog] = useState<MoodLog | null>(null);
  const [afterShareLog, setAfterShareLog] = useState<MoodLog | null>(null);

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
            description: "Could not start video playback. Ensure your camera is not in use."
          });
          setIsVideoReadyForCapture(false);
        });
      };

      const handlePlaying = () => {
        setTimeout(() => { 
          if (video.videoWidth > 0 && video.videoHeight > 0) {
            setIsVideoReadyForCapture(true);
          } else {
            console.warn("Video 'playing' event fired, but video dimensions are 0. Retrying check shortly.");
            setTimeout(() => {
              if (video.videoWidth > 0 && video.videoHeight > 0) {
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
        if (video.videoWidth > 0 && video.videoHeight > 0) {
            setIsVideoReadyForCapture(true);
        }
      }

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
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('playing', handlePlaying);
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('waiting', handleWaiting);
        video.removeEventListener('stalled', handleStalled);
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

  useEffect(() => {
    if (sortedMoodLogs.length >= 2) {
      const logsWithSelfies = sortedMoodLogs.filter(log => !!log.selfieDataUri).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      if (logsWithSelfies.length >= 2) {
        const firstSelfieLog = logsWithSelfies[0];
        let suitableAfterLog = null;

        for (let i = logsWithSelfies.length -1; i > 0; i--) {
            const potentialAfterLog = logsWithSelfies[i];
            if (differenceInDays(new Date(potentialAfterLog.date), new Date(firstSelfieLog.date)) >= 14) {
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
    } else {
      setBeforeShareLog(null);
      setAfterShareLog(null);
    }
  }, [sortedMoodLogs]);

  const handleToggleCamera = async () => {
    setIsVideoReadyForCapture(false); 

    if (isCameraActive && selfieStream) { 
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
  }

  const handleMoodButtonClick = (mood: string) => {
    setSelectedMood(mood);
    setMoodNotes("");
    setCapturedSelfie(null); 
    
    if (selfieStream) setSelfieStream(null); 
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsCameraActive(false);
    setHasCameraPermission(null); 
    setIsVideoReadyForCapture(false);

    setIsMoodDialogOpen(true);
  };

  const handleSaveMoodLog = async () => {
    if (selectedMood) {
      await addMoodLog(selectedMood, moodNotes, capturedSelfie || undefined);
      setIsMoodDialogOpen(false); 
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
    }
  }

  const handleGenerateGroceryListClick = async () => {
    if (!wellnessPlan || !wellnessPlan.meals || wellnessPlan.meals.length === 0) {
      toast({ variant: "destructive", title: "Error", description: "No wellness plan with meals available to generate groceries from." });
      return;
    }
    await generateGroceryList(wellnessPlan);
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
      setLogToDelete(null); // Close dialog
    }
  };


  if (isLoadingAuth || (!isLoadingAuth && !currentUser)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Logo size="text-3xl sm:text-4xl" />
        <Loader2 className="mt-4 h-8 w-8 animate-spin text-primary" />
        <p className="mt-2 text-muted-foreground">Loading user data...</p>
      </div>
    );
  }
  
  // User is logged in, but no plan AND not yet onboarded
  if (!isPlanAvailable && !isOnboardedState && !isLoadingPlan) {
    router.replace('/onboarding'); // Should be caught by useEffect, but as a safeguard
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <Logo size="text-3xl sm:text-4xl" />
        <Loader2 className="mt-4 h-8 w-8 animate-spin text-primary" />
        <p className="mt-2 text-muted-foreground">Redirecting to onboarding...</p>
      </div>
    );
  }
  
  // User is logged in, onboarded, but plan is still loading
  if (isOnboardedState && isLoadingPlan && !isPlanAvailable) { 
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <Logo size="text-3xl sm:text-4xl" />
        <p className="mt-4 text-md sm:text-lg">Generating your personalized plan...</p>
        <RotateCcw className="mt-4 h-8 w-8 sm:h-10 sm:w-10 animate-spin text-primary" />
      </div>
    );
  }
  
  // User is logged in, onboarded, plan is not loading, but still no plan available (e.g., generation failed or new user after onboarding)
  if (isOnboardedState && !isPlanAvailable && !isLoadingPlan) { 
     return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <Logo size="text-3xl sm:text-4xl" />
        <p className="mt-4 text-md sm:text-lg">No wellness plan found or an error occurred.</p>
        <p className="text-xs sm:text-sm text-muted-foreground">Please try creating a new plan.</p>
        <Button variant="neumorphic-primary" onClick={() => {clearPlanAndData(false); router.push('/onboarding');}} className="mt-4 text-sm sm:text-base px-5 py-2 sm:px-6 sm:py-3">
          Create a New Plan
        </Button>
         <Button variant="outline" onClick={handleLogout} className="mt-4 neumorphic-button text-xs sm:text-sm">
            <LogOut className="mr-2 h-4 w-4" /> Logout
        </Button>
      </div>
    );
  }


  return (
    <main className="container mx-auto p-3 sm:p-4 md:p-6">
      <header className="flex flex-col sm:flex-row justify-between items-center mb-5 sm:mb-6">
        <Logo size="text-2xl sm:text-3xl md:text-4xl" />
        <div className="flex items-center gap-2 mt-3 sm:mt-0">
            <Button variant="outline" onClick={() => { clearPlanAndData(false); router.push('/onboarding'); }} className="neumorphic-button text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2">
            New Plan
            </Button>
            <Button variant="outline" onClick={handleLogout} className="neumorphic-button text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2">
                <LogOut className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Logout
            </Button>
        </div>
      </header>

      {isLoadingPlan && wellnessPlan && ( 
        <div className="fixed inset-0 bg-background/80 flex flex-col items-center justify-center z-50">
          <RotateCcw className="h-8 w-8 sm:h-10 sm:w-10 animate-spin text-primary" />
          <p className="mt-3 text-sm sm:text-md">Updating your plan...</p>
        </div>
      )}
      
      {wellnessPlan && (
        <>
          <div className="mb-5 p-3 sm:p-4 neumorphic rounded-lg">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">Your GroZen Wellness Plan</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">Here&apos;s your personalized guide to a healthier you. Stay consistent!</p>
          </div>

          <SectionCard title="Meals" icon={<Utensils className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />} itemsCount={wellnessPlan.meals.length}>
            <ScrollArea className="w-full whitespace-nowrap rounded-md">
              <div className="flex space-x-2 sm:space-x-3 pb-3">
                {wellnessPlan.meals.map((meal: Meal, index: number) => (
                  <ItemCard key={`meal-${index}`} className="bg-card">
                    <h4 className="font-semibold text-sm sm:text-md mb-1 flex items-center">
                        <CalendarDays className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" /> {meal.day}
                    </h4>
                    <p className="text-xs sm:text-sm break-words whitespace-normal"><strong>Breakfast:</strong> {meal.breakfast}</p>
                    <p className="text-xs sm:text-sm break-words whitespace-normal"><strong>Lunch:</strong> {meal.lunch}</p>
                    <p className="text-xs sm:text-sm break-words whitespace-normal"><strong>Dinner:</strong> {meal.dinner}</p>
                  </ItemCard>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </SectionCard>

          <SectionCard title="Exercise Routine" icon={<Dumbbell className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />} itemsCount={wellnessPlan.exercise.length}>
            <ScrollArea className="w-full whitespace-nowrap rounded-md">
              <div className="flex space-x-2 sm:space-x-3 pb-3">
                {wellnessPlan.exercise.map((ex: Exercise, index: number) => (
                  <ItemCard key={`ex-${index}`} className="bg-card">
                     <h4 className="font-semibold text-sm sm:text-md mb-1 flex items-center">
                        <CalendarDays className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" /> {ex.day}
                    </h4>
                    <p className="text-xs sm:text-sm break-words whitespace-normal"><strong>Activity:</strong> {ex.activity}</p>
                    <p className="text-xs sm:text-sm break-words whitespace-normal"><strong>Duration:</strong> {ex.duration}</p>
                  </ItemCard>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </SectionCard>

          <SectionCard title="Mindfulness Practices" icon={<Brain className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />} itemsCount={wellnessPlan.mindfulness.length}>
            <ScrollArea className="w-full whitespace-nowrap rounded-md">
              <div className="flex space-x-2 sm:space-x-3 pb-3">
                {wellnessPlan.mindfulness.map((mind: Mindfulness, index: number) => (
                  <ItemCard key={`mind-${index}`} className="bg-card">
                    <h4 className="font-semibold text-sm sm:text-md mb-1 flex items-center">
                        <CalendarDays className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" /> {mind.day}
                    </h4>
                    <p className="text-xs sm:text-sm break-words whitespace-normal"><strong>Practice:</strong> {mind.practice}</p>
                    <p className="text-xs sm:text-sm break-words whitespace-normal"><strong>Duration:</strong> {mind.duration}</p>
                  </ItemCard>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </SectionCard>
        </>
      )}
      
      <Dialog open={isMoodDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="neumorphic w-[90vw] max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center text-md sm:text-lg">
              Log Your Mood: <span className="ml-2 text-xl sm:text-2xl">{selectedMood}</span>
            </DialogTitle>
            <DialogDescription className="text-2xs sm:text-xs">
              How are you feeling? Add notes or a selfie to capture the moment.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-3">
            <div className="space-y-1.5">
              <Label htmlFor="mood-notes" className="text-xs sm:text-sm">Notes (Optional)</Label>
              <Textarea
                id="mood-notes"
                value={moodNotes}
                onChange={(e) => setMoodNotes(e.target.value)}
                placeholder="Any thoughts or details about your mood..."
                className="h-16 sm:h-20 neumorphic-inset-sm text-xs sm:text-sm"
              />
            </div>
            <div className="space-y-1.5">
                <Label className="text-xs sm:text-sm">Selfie (Optional)</Label>
                <div className="flex flex-col xs:flex-row items-start xs:items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleToggleCamera}
                        className="neumorphic-button w-full xs:w-auto text-xs px-3 py-1.5"
                        disabled={!!capturedSelfie} 
                    >
                        {isCameraActive ? <VideoOff className="mr-1 h-3 w-3" /> : <Camera className="mr-1 h-3 w-3" />}
                        {isCameraActive ? 'Close Camera' : 'Open Camera'}
                    </Button>
                    {isCameraActive && selfieStream && hasCameraPermission === true && (
                         <Button
                            type="button"
                            variant="neumorphic-primary"
                            onClick={handleCaptureSelfie}
                            disabled={!selfieStream || !isVideoReadyForCapture}
                            className="w-full xs:w-auto text-xs px-3 py-1.5"
                        >
                            <Camera className="mr-1 h-3 w-3" /> Capture
                        </Button>
                    )}
                </div>
                
                <div className="mt-2 rounded-md overflow-hidden border border-border neumorphic-inset-sm aspect-video bg-muted/20 flex items-center justify-center text-center p-1.5">
                  {isCameraActive && selfieStream && hasCameraPermission === true ? (
                    <video 
                        ref={videoRef} 
                        className="w-full h-full object-cover"
                        muted 
                        playsInline 
                     />
                  ) : capturedSelfie ? (
                    <div className="p-1.5 sm:p-2 text-muted-foreground">
                      <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-1 text-accent" />
                      <p className="text-2xs sm:text-xs">Selfie captured!</p>
                      <p className="text-2xs">Preview below.</p>
                    </div>
                  ) : hasCameraPermission === false ? (
                    <div className="p-1.5 sm:p-2">
                      <VideoOff className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-1 text-destructive" />
                      <p className="font-semibold text-destructive text-2xs sm:text-xs">Camera Access Denied</p>
                      <p className="text-2xs">Enable permissions in browser.</p>
                    </div>
                  ) : isCameraActive && hasCameraPermission === null ? ( 
                    <div className="p-1.5 sm:p-2">
                      <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-1 animate-spin" />
                      <p className="text-2xs sm:text-xs">Requesting camera...</p>
                    </div>
                  ) : ( 
                    <div className="p-1.5 sm:p-2">
                      <Camera className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-1" />
                      <p className="text-2xs sm:text-xs">Camera is off.</p>
                    </div>
                  )}
                </div>

                {capturedSelfie && (
                    <div className="mt-3 space-y-1.5">
                        <p className="text-xs sm:text-sm font-medium">Selfie Preview:</p>
                        <div className="relative aspect-video w-full max-w-[150px] sm:max-w-[200px] neumorphic-sm rounded-md overflow-hidden">
                             <Image src={capturedSelfie} alt="Captured selfie" fill={true} className="object-cover" data-ai-hint="selfie person"/>
                        </div>
                        <Button 
                            type="button" 
                            variant="outline" 
                            size="sm" 
                            onClick={clearCapturedSelfie} 
                            className="neumorphic-button items-center text-2xs px-2 py-1"
                        >
                            <Trash2 className="mr-1 h-3 w-3 text-destructive" /> Clear Selfie
                        </Button>
                    </div>
                )}
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-3 sm:gap-0 justify-between">
             <DialogClose asChild>
              <Button type="button" variant="outline" className="neumorphic-button w-full sm:w-auto text-xs px-3 py-1.5">Cancel</Button>
            </DialogClose>
            <Button type="button" variant="neumorphic-primary" onClick={handleSaveMoodLog} disabled={!selectedMood} className="w-full sm:w-auto text-xs px-3 py-1.5">Save Mood</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!logToDelete} onOpenChange={(open) => !open && setLogToDelete(null)}>
        <AlertDialogContent className="neumorphic">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this mood log.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row">
            <AlertDialogCancel 
              onClick={() => setLogToDelete(null)} 
              className="neumorphic-button w-full sm:w-auto text-xs px-3 py-1.5"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteMoodLog} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full sm:w-auto text-xs px-3 py-1.5"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


      <SectionCard title="Mood Check-in" icon={<Smile className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />} >
         <CardDescription className="mb-3 text-xs sm:text-sm">How are you feeling today? Log your mood and optionally add a selfie.</CardDescription>
        <div className="flex space-x-1 sm:space-x-2 justify-center sm:justify-start">
          {moodEmojiStrings.map(mood => (
            <Button 
              key={mood} 
              variant="outline" 
              size="icon" 
              onClick={() => handleMoodButtonClick(mood)}
              className="text-lg sm:text-xl md:text-2xl neumorphic-button h-12 w-12 sm:h-14 sm:w-14 hover:neumorphic-inset"
              aria-label={`Log mood: ${mood}`}
            >
              {mood}
            </Button>
          ))}
        </div>
      </SectionCard>

      {sortedMoodLogs.length > 0 && (
        <SectionCard title="Mood History" icon={<RotateCcw className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />} itemsCount={sortedMoodLogs.length}>
          <ScrollArea className="w-full h-[250px] sm:h-[300px] md:h-[400px] whitespace-nowrap rounded-md">
            <div className="flex flex-col space-y-2 sm:space-y-3 p-1">
              {sortedMoodLogs.map((log: MoodLog) => (
                <ItemCard key={log.id} className="bg-card w-full min-w-0">
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    {log.selfieDataUri && (
                      <div className="relative w-full sm:w-20 md:w-24 h-auto aspect-square rounded-md overflow-hidden neumorphic-inset-sm">
                        <Image src={log.selfieDataUri} alt={`Selfie for mood ${log.mood}`} fill={true} className="object-cover" data-ai-hint="selfie person" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-0.5">
                        <h4 className="font-semibold text-md sm:text-lg flex items-center gap-1 sm:gap-2">
                          <span className="text-xl sm:text-2xl">{log.mood}</span>
                          {moodEmojis[log.mood] && typeof moodEmojis[log.mood] !== 'string' ? moodEmojis[log.mood] : ''}
                        </h4>
                        <AlertDialogTrigger asChild>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => setLogToDelete(log.id)}
                                className="h-6 w-6 sm:h-7 sm:w-7 p-0 text-muted-foreground hover:text-destructive"
                                aria-label="Delete mood log"
                            >
                                <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                            </Button>
                        </AlertDialogTrigger>
                      </div>
                       <p className="text-xs text-muted-foreground">
                        {format(new Date(log.date), "MMM d, yy 'at' h:mma")}
                      </p>
                      {log.notes && <p className="text-xs sm:text-sm mt-1.5 pt-1.5 border-t border-border/50 whitespace-pre-wrap break-words">{log.notes}</p>}
                       {log.aiFeedback && (
                        <div className="mt-1.5 pt-1.5 border-t border-border/50">
                            <p className="text-xs sm:text-sm flex items-center gap-1 text-primary/90">
                                <Sparkles className="h-3 w-3 mr-0.5 text-accent" /> <em>GroZen Insight:</em>
                            </p>
                            <p className="text-xs sm:text-sm italic text-muted-foreground/90 whitespace-pre-wrap break-words">{log.aiFeedback}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </ItemCard>
              ))}
            </div>
            <ScrollBar orientation="vertical" />
          </ScrollArea>
        </SectionCard>
      )}
      
      <SectionCard title="Share Your Progress" icon={<Gift className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />}>
        {beforeShareLog && afterShareLog ? (
          <SocialShareCard beforeLog={beforeShareLog} afterLog={afterShareLog} />
        ) : (
          <CardDescription className="text-xs sm:text-sm">
            Keep logging your moods with selfies! Once you have at least two selfies, with the latest being at least 14 days after the first, your &apos;Before & After&apos; share card will appear here.
          </CardDescription>
        )}
      </SectionCard>


      <SectionCard title="Grocery Concierge" icon={<ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />}>
        <CardDescription className="mb-3 text-xs sm:text-sm">
          Let GroZen generate a grocery list based on your current wellness plan.
        </CardDescription>
        <Button 
          onClick={handleGenerateGroceryListClick} 
          disabled={isLoadingGroceryList || !wellnessPlan || !wellnessPlan.meals || wellnessPlan.meals.length === 0}
          variant="neumorphic-primary"
          className="w-full sm:w-auto text-xs sm:text-sm px-3 py-1.5"
        >
          {isLoadingGroceryList ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <ShoppingCart className="mr-1 h-3 w-3" />}
          Generate Grocery List
        </Button>

        {errorGroceryList && (
          <Alert variant="destructive" className="mt-3">
            <AlertTitle className="text-xs sm:text-sm">Error Generating List</AlertTitle>
            <AlertDescription className="text-2xs sm:text-xs">{errorGroceryList}</AlertDescription>
          </Alert>
        )}

        {groceryList && !isLoadingGroceryList && (
          <div className="mt-4 space-y-3">
            <h3 className="text-sm sm:text-md font-semibold">
              Your Grocery List <span className="text-2xs sm:text-xs text-muted-foreground"> (Generated: {format(new Date(groceryList.generatedDate), "MMM d, yyyy")})</span>
            </h3>
            {Object.keys(groupedGroceryItems).length === 0 && <p className="text-xs sm:text-sm">Your grocery list is empty or could not be generated.</p>}
            <Accordion type="multiple" className="w-full" defaultValue={Object.keys(groupedGroceryItems)}>
              {Object.entries(groupedGroceryItems).map(([category, items]) => (
                <AccordionItem value={category} key={category} className="neumorphic-sm mb-1.5">
                  <AccordionTrigger className="p-2.5 text-xs sm:text-sm hover:no-underline">
                    {category} ({items.length})
                  </AccordionTrigger>
                  <AccordionContent className="p-2.5">
                    <ul className="list-disc pl-3.5 sm:pl-4 space-y-1 text-2xs sm:text-xs">
                      {items.map((item, index) => (
                        <li key={`${item.name}-${index}`} className="break-words">
                          <strong>{item.name}</strong>
                          {item.quantity && <span className="text-muted-foreground"> ({item.quantity})</span>}
                          {item.notes && <em className="text-muted-foreground text-2xs block"> - {item.notes}</em>}
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            <p className="text-2xs text-muted-foreground mt-3">
              Note: This is an AI-generated list. Please review for accuracy and adjust quantities as needed.
            </p>
          </div>
        )}
      </SectionCard>

    </main>
  );
}

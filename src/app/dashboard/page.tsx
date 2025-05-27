
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
import { Utensils, Dumbbell, Brain, CalendarDays, RotateCcw, Smile, Annoyed, Frown, Meh, Laugh, Camera, Sparkles, Trash2, VideoOff, ShoppingCart, Loader2, Gift } from 'lucide-react';
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { format, differenceInDays } from 'date-fns';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";


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

const moodEmojis: { [key: string]: string | React.ReactNode } = {
  "😊": <Laugh className="h-6 w-6 text-green-400" />,
  "🙂": <Smile className="h-6 w-6 text-blue-400" />,
  "😐": <Meh className="h-6 w-6 text-yellow-400" />,
  "😕": <Annoyed className="h-6 w-6 text-orange-400" />,
  "😞": <Frown className="h-6 w-6 text-red-400" />
};
const moodEmojiStrings = ["😊", "🙂", "😐", "😕", "😞"];


export default function DashboardPage() {
  const router = useRouter();
  const { 
    wellnessPlan, 
    isOnboarded, 
    clearPlan, 
    isLoadingPlan, 
    addMoodLog, 
    moodLogs,
    groceryList,
    isLoadingGroceryList,
    errorGroceryList,
    generateGroceryList
  } = usePlan();
  const { toast } = useToast();

  const [isMoodDialogOpen, setIsMoodDialogOpen] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [moodNotes, setMoodNotes] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [selfieStream, setSelfieStream] = useState<MediaStream | null>(null);
  const [capturedSelfie, setCapturedSelfie] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isVideoReadyForCapture, setIsVideoReadyForCapture] = useState(false);


  const sortedMoodLogs = React.useMemo(() => {
    return [...moodLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [moodLogs]);

  const [beforeShareLog, setBeforeShareLog] = useState<MoodLog | null>(null);
  const [afterShareLog, setAfterShareLog] = useState<MoodLog | null>(null);

  useEffect(() => {
    if (!isLoadingPlan && !isOnboarded) {
      router.push('/onboarding');
    } else if (!isLoadingPlan && isOnboarded && !wellnessPlan) {
      router.push('/onboarding');
    }
  }, [wellnessPlan, isOnboarded, isLoadingPlan, router]);

  // Effect for attaching stream, playing video, and managing ready state
  useEffect(() => {
    const video = videoRef.current;
    if (video && selfieStream && isCameraActive && hasCameraPermission === true) {
      video.srcObject = selfieStream;

      const handleCanPlay = () => {
        if (video.videoWidth > 0) {
          setIsVideoReadyForCapture(true);
        } else {
          // Fallback check if videoWidth is not immediately available
          setTimeout(() => {
            if (video.videoWidth > 0) setIsVideoReadyForCapture(true);
            else setIsVideoReadyForCapture(false);
          }, 100);
        }
      };
      const handlePlaying = () => {
         if (video.videoWidth > 0) setIsVideoReadyForCapture(true);
      };
      const handleWaitingOrStalled = () => setIsVideoReadyForCapture(false);

      video.addEventListener('canplay', handleCanPlay);
      video.addEventListener('playing', handlePlaying);
      video.addEventListener('waiting', handleWaitingOrStalled);
      video.addEventListener('stalled', handleWaitingOrStalled);

      video.play().catch(err => {
        console.error("Error playing video stream in effect:", err);
        toast({
          variant: "destructive",
          title: "Camera Error",
          description: "Could not start the video stream."
        });
        setIsVideoReadyForCapture(false);
      });

      return () => { // Cleanup
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('playing', handlePlaying);
        video.removeEventListener('waiting', handleWaitingOrStalled);
        video.removeEventListener('stalled', handleWaitingOrStalled);
        // Ensure ready state is false when effect cleans up
        setIsVideoReadyForCapture(false); 
      };
    } else if (!isCameraActive || !selfieStream) {
      setIsVideoReadyForCapture(false); // Ensure readiness is false if camera not active or no stream
    }
  }, [selfieStream, isCameraActive, hasCameraPermission, toast]);


  // Effect for cleaning up the selfieStream tracks (stopping tracks)
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
    setIsVideoReadyForCapture(false); // Reset readiness on toggle
    if (isCameraActive && selfieStream) { 
      setSelfieStream(null); 
      setIsCameraActive(false);
      if (videoRef.current) videoRef.current.srcObject = null;
    } else { 
      setCapturedSelfie(null); 
      setHasCameraPermission(null); 
      setIsCameraActive(true); 
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
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
                description: 'Video dimensions not available. Please try again.',
            });
            setIsVideoReadyForCapture(false); // Mark as not ready if dimensions are bad
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
        setSelfieStream(null); // Stop stream after capture
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
        toast({
            variant: 'destructive',
            title: 'Capture Failed',
            description: 'Video stream not ready or camera not active. Please ensure the video feed is visible and try again.',
        });
    }
  };
  
  const clearCapturedSelfie = () => {
    setCapturedSelfie(null);
    setIsVideoReadyForCapture(false); // Camera not active if selfie cleared
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
      // Dialog close will also trigger cleanup via onOpenChange
    }
  };
  
  const handleDialogClose = (open: boolean) => {
    setIsMoodDialogOpen(open);
    if (!open) { 
        if (selfieStream) setSelfieStream(null); // Triggers cleanup effect
        if (videoRef.current) videoRef.current.srcObject = null;
        setIsCameraActive(false);
        setCapturedSelfie(null);
        setSelectedMood(null);
        setMoodNotes("");
        setHasCameraPermission(null); 
        setIsVideoReadyForCapture(false);
    }
  }

  const handleGenerateGroceryList = async () => {
    if (wellnessPlan) {
      await generateGroceryList(wellnessPlan);
    } else {
      toast({ variant: "destructive", title: "Error", description: "No wellness plan available to generate groceries from." });
    }
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


  if (isLoadingPlan && !wellnessPlan) { 
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
        <Logo size="text-4xl" />
        <p className="mt-4 text-xl">Generating your personalized plan...</p>
        <RotateCcw className="mt-4 h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!wellnessPlan && !isOnboarded && !isLoadingPlan) { 
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


  return (
    <main className="container mx-auto p-4 sm:p-8">
      <header className="flex flex-col sm:flex-row justify-between items-center mb-8">
        <Logo size="text-4xl" />
        <Button variant="outline" onClick={() => { clearPlan(); router.push('/'); }} className="mt-4 sm:mt-0 neumorphic-button">
          Start Over
        </Button>
      </header>

      {isLoadingPlan && wellnessPlan && ( 
        <div className="fixed inset-0 bg-background/80 flex flex-col items-center justify-center z-50">
          <RotateCcw className="h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-lg">Updating your plan...</p>
        </div>
      )}
      
      {wellnessPlan && (
        <>
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
        </>
      )}
      
      <Dialog open={isMoodDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="neumorphic sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center text-xl">
              Log Your Mood: <span className="ml-2 text-3xl">{selectedMood}</span>
            </DialogTitle>
            <DialogDescription>
              How are you feeling? Add notes or a selfie to capture the moment.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="mood-notes">Notes (Optional)</Label>
              <Textarea
                id="mood-notes"
                value={moodNotes}
                onChange={(e) => setMoodNotes(e.target.value)}
                placeholder="Any thoughts or details about your mood..."
                className="h-24 neumorphic-inset-sm"
              />
            </div>
            <div className="space-y-2">
                <Label>Selfie (Optional)</Label>
                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleToggleCamera}
                        className="neumorphic-button"
                        disabled={!!capturedSelfie} 
                    >
                        {isCameraActive ? <VideoOff className="mr-2 h-4 w-4" /> : <Camera className="mr-2 h-4 w-4" />}
                        {isCameraActive ? 'Close Camera' : 'Open Camera'}
                    </Button>
                    {isCameraActive && selfieStream && hasCameraPermission === true && (
                         <Button
                            type="button"
                            variant="neumorphic-primary"
                            onClick={handleCaptureSelfie}
                            disabled={!selfieStream || !isVideoReadyForCapture}
                        >
                            <Camera className="mr-2 h-4 w-4" /> Capture
                        </Button>
                    )}
                </div>
                
                <div className="mt-2 rounded-md overflow-hidden border border-border neumorphic-inset-sm aspect-video bg-muted/20 flex items-center justify-center text-center">
                  {isCameraActive && selfieStream && hasCameraPermission === true ? (
                    <video 
                        ref={videoRef} 
                        className="w-full h-full object-cover"
                        autoPlay 
                        muted 
                        playsInline 
                     />
                  ) : capturedSelfie ? (
                    <div className="p-4 text-muted-foreground">
                      <Sparkles className="h-10 w-10 mx-auto mb-2 text-accent" />
                      <p>Selfie captured!</p>
                      <p className="text-xs">Preview below. You can clear it or save your mood.</p>
                    </div>
                  ) : hasCameraPermission === false ? (
                    <div className="p-4">
                      <VideoOff className="h-10 w-10 mx-auto mb-2 text-destructive" />
                      <p className="font-semibold text-destructive">Camera Access Denied</p>
                      <p className="text-xs">Enable camera permissions in browser settings. You might need to refresh.</p>
                    </div>
                  ) : isCameraActive && hasCameraPermission === null ? ( 
                    <div className="p-4">
                      <Loader2 className="h-10 w-10 mx-auto mb-2 animate-spin" />
                      <p>Requesting camera access...</p>
                      <p className="text-xs">Please allow in your browser.</p>
                    </div>
                  ) : ( 
                    <div className="p-4">
                      <Camera className="h-10 w-10 mx-auto mb-2" />
                      <p>Camera is off.</p>
                      <p className="text-xs">Click 'Open Camera' to add a selfie.</p>
                    </div>
                  )}
                </div>

                {capturedSelfie && (
                    <div className="mt-4 space-y-2">
                        <p className="text-sm font-medium">Selfie Preview:</p>
                        <div className="relative aspect-video w-full max-w-[200px] neumorphic-sm rounded-md overflow-hidden">
                             <Image src={capturedSelfie} alt="Captured selfie" fill={true} className="object-cover" data-ai-hint="selfie person"/>
                        </div>
                        <Button 
                            type="button" 
                            variant="outline" 
                            size="sm" 
                            onClick={clearCapturedSelfie} 
                            className="neumorphic-button items-center"
                        >
                            <Trash2 className="mr-1 h-4 w-4 text-destructive" /> Clear Selfie
                        </Button>
                    </div>
                )}
            </div>
          </div>
          <DialogFooter className="sm:justify-between">
             <DialogClose asChild>
              <Button type="button" variant="outline" className="neumorphic-button">Cancel</Button>
            </DialogClose>
            <Button type="button" variant="neumorphic-primary" onClick={handleSaveMoodLog} disabled={!selectedMood}>Save Mood</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SectionCard title="Mood Check-in" icon={<Smile className="h-6 w-6 text-accent" />} >
         <CardDescription className="mb-4">How are you feeling today? Log your mood and optionally add a selfie.</CardDescription>
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
          <ScrollArea className="w-full h-[400px] whitespace-nowrap rounded-md">
            <div className="flex flex-col space-y-4 p-1">
              {sortedMoodLogs.map((log: MoodLog) => (
                <ItemCard key={log.id} className="bg-card w-full min-w-0">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {log.selfieDataUri && (
                      <div className="relative w-full sm:w-32 h-auto aspect-square rounded-md overflow-hidden neumorphic-inset-sm">
                        <Image src={log.selfieDataUri} alt={`Selfie for mood ${log.mood}`} fill={true} className="object-cover" data-ai-hint="selfie person" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-semibold text-lg flex items-center gap-2">
                          <span className="text-3xl">{log.mood}</span>
                          {moodEmojis[log.mood] && typeof moodEmojis[log.mood] !== 'string' ? moodEmojis[log.mood] : ''}
                        </h4>
                      </div>
                       <p className="text-xs text-muted-foreground">
                        {format(new Date(log.date), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                      {log.notes && <p className="text-sm mt-2 pt-2 border-t border-border/50 whitespace-pre-wrap">{log.notes}</p>}
                       {log.aiFeedback && (
                        <div className="mt-2 pt-2 border-t border-border/50">
                            <p className="text-sm flex items-center gap-1 text-primary/90">
                                <Sparkles size={16} className="text-accent" /> <em>GroZen Insight:</em>
                            </p>
                            <p className="text-sm italic text-muted-foreground/90 whitespace-pre-wrap">{log.aiFeedback}</p>
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
      
      <SectionCard title="Share Your Progress" icon={<Gift className="h-6 w-6 text-accent" />}>
        {beforeShareLog && afterShareLog ? (
          <SocialShareCard beforeLog={beforeShareLog} afterLog={afterShareLog} />
        ) : (
          <CardDescription>
            Keep logging your moods with selfies! Once you have at least two selfies, with the latest being at least 14 days after the first, your 'Before & After' share card will appear here.
          </CardDescription>
        )}
      </SectionCard>


      <SectionCard title="Grocery Concierge" icon={<ShoppingCart className="h-6 w-6 text-accent" />}>
        <CardDescription className="mb-4">
          Let GroZen generate a grocery list based on your current wellness plan.
        </CardDescription>
        <Button 
          onClick={handleGenerateGroceryList} 
          disabled={isLoadingGroceryList || !wellnessPlan}
          variant="neumorphic-primary"
          className="w-full sm:w-auto"
        >
          {isLoadingGroceryList ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShoppingCart className="mr-2 h-4 w-4" />}
          Generate Grocery List
        </Button>

        {errorGroceryList && (
          <Alert variant="destructive" className="mt-4">
            <AlertTitle>Error Generating List</AlertTitle>
            <AlertDescription>{errorGroceryList}</AlertDescription>
          </Alert>
        )}

        {groceryList && !isLoadingGroceryList && (
          <div className="mt-6 space-y-4">
            <h3 className="text-lg font-semibold">
              Your Grocery List <span className="text-sm text-muted-foreground"> (Generated: {format(new Date(groceryList.generatedDate), "MMM d, yyyy")})</span>
            </h3>
            {Object.keys(groupedGroceryItems).length === 0 && <p>Your grocery list is empty or could not be generated.</p>}
            <Accordion type="multiple" className="w-full" defaultValue={Object.keys(groupedGroceryItems)}>
              {Object.entries(groupedGroceryItems).map(([category, items]) => (
                <AccordionItem value={category} key={category} className="neumorphic-sm mb-2">
                  <AccordionTrigger className="p-3 text-md hover:no-underline">
                    {category} ({items.length})
                  </AccordionTrigger>
                  <AccordionContent className="p-3">
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      {items.map((item, index) => (
                        <li key={`${item.name}-${index}`}>
                          <strong>{item.name}</strong>
                          {item.quantity && <span className="text-muted-foreground"> ({item.quantity})</span>}
                          {item.notes && <em className="text-muted-foreground text-xs block"> - {item.notes}</em>}
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            <p className="text-xs text-muted-foreground mt-4">
              Note: This is an AI-generated list. Please review for accuracy and adjust quantities as needed. Future versions will allow direct export.
            </p>
          </div>
        )}
      </SectionCard>

    </main>
  );
}

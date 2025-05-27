
"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { usePlan } from '@/contexts/plan-context';
import Logo from '@/components/logo';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import type { Meal, Exercise, Mindfulness, MoodLog } from '@/types/wellness';
import { Utensils, Dumbbell, Brain, CalendarDays, RotateCcw, Smile, Annoyed, Frown, Meh, Laugh, Camera, Sparkles, Trash2, VideoOff } from 'lucide-react';
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
import { format } from 'date-fns';


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
  const { wellnessPlan, isOnboarded, clearPlan, isLoadingPlan, addMoodLog, moodLogs } = usePlan();
  const { toast } = useToast();

  const [isMoodDialogOpen, setIsMoodDialogOpen] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [moodNotes, setMoodNotes] = useState("");

  // Selfie related state
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [selfieStream, setSelfieStream] = useState<MediaStream | null>(null);
  const [capturedSelfie, setCapturedSelfie] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);


  const sortedMoodLogs = React.useMemo(() => {
    return [...moodLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [moodLogs]);

  useEffect(() => {
    if (!isLoadingPlan && !isOnboarded) {
      router.push('/onboarding');
    } else if (!isLoadingPlan && isOnboarded && !wellnessPlan) {
      router.push('/onboarding');
    }
  }, [wellnessPlan, isOnboarded, isLoadingPlan, router]);

  // Cleanup camera stream when component unmounts or dialog closes
  useEffect(() => {
    return () => {
      if (selfieStream) {
        selfieStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [selfieStream]);


  const handleToggleCamera = async () => {
    if (isCameraActive && selfieStream) {
      selfieStream.getTracks().forEach(track => track.stop());
      setSelfieStream(null);
      if (videoRef.current) videoRef.current.srcObject = null;
      setCapturedSelfie(null);
      setIsCameraActive(false);
      setHasCameraPermission(null); // Reset permission status
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        setHasCameraPermission(true);
        setSelfieStream(stream);
        setIsCameraActive(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings.',
        });
      }
    }
  };

  const handleCaptureSelfie = () => {
    if (videoRef.current && selfieStream) {
      const canvas = document.createElement('canvas');
      // Set canvas dimensions to match video to avoid distortion
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        // Flip the image horizontally for a mirror effect if desired
        // context.translate(canvas.width, 0);
        // context.scale(-1, 1);
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUri = canvas.toDataURL('image/jpeg', 0.8); // Use JPEG and specify quality
        setCapturedSelfie(dataUri);
        handleToggleCamera(); // Turn off camera after capture
      }
    }
  };
  
  const clearCapturedSelfie = () => {
    setCapturedSelfie(null);
  }


  if (isLoadingPlan) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
        <Logo size="text-4xl" />
        <p className="mt-4 text-xl">Generating your personalized plan...</p>
        <RotateCcw className="mt-4 h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!wellnessPlan) {
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

  const handleMoodButtonClick = (mood: string) => {
    setSelectedMood(mood);
    setMoodNotes("");
    setCapturedSelfie(null); // Reset selfie when opening dialog for a new mood
    if (isCameraActive) { // Turn off camera if it was left on
        handleToggleCamera();
    }
    setIsMoodDialogOpen(true);
  };

  const handleSaveMoodLog = async () => {
    if (selectedMood) {
      await addMoodLog(selectedMood, moodNotes, capturedSelfie || undefined);
      setIsMoodDialogOpen(false);
      setSelectedMood(null);
      setMoodNotes("");
      setCapturedSelfie(null);
       if (isCameraActive && selfieStream) { // Turn off camera
        selfieStream.getTracks().forEach(track => track.stop());
        setSelfieStream(null);
        if (videoRef.current) videoRef.current.srcObject = null;
        setIsCameraActive(false);
      }
    }
  };
  
  const handleDialogClose = (open: boolean) => {
    if (!open) { // Dialog is closing
        if (isCameraActive && selfieStream) {
            selfieStream.getTracks().forEach(track => track.stop());
            setSelfieStream(null);
            if (videoRef.current) videoRef.current.srcObject = null;
            setIsCameraActive(false);
        }
        setCapturedSelfie(null); // Clear selfie if dialog is dismissed
    }
    setIsMoodDialogOpen(open);
  }


  return (
    <main className="container mx-auto p-4 sm:p-8">
      <header className="flex flex-col sm:flex-row justify-between items-center mb-8">
        <Logo size="text-4xl" />
        <Button variant="outline" onClick={() => { clearPlan(); router.push('/'); }} className="mt-4 sm:mt-0 neumorphic-button">
          Start Over
        </Button>
      </header>

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
                {hasCameraPermission === false && (
                     <Alert variant="destructive">
                        <AlertTitle>Camera Access Denied</AlertTitle>
                        <AlertDescription>
                            Please enable camera permissions in your browser settings to use this feature.
                            You might need to refresh the page after granting permissions.
                        </AlertDescription>
                    </Alert>
                )}
                
                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleToggleCamera}
                        className="neumorphic-button"
                    >
                        {isCameraActive ? <VideoOff className="mr-2 h-4 w-4" /> : <Camera className="mr-2 h-4 w-4" />}
                        {isCameraActive ? 'Close Camera' : 'Open Camera'}
                    </Button>
                    {isCameraActive && selfieStream && (
                         <Button
                            type="button"
                            variant="neumorphic-primary"
                            onClick={handleCaptureSelfie}
                            disabled={!selfieStream}
                        >
                            <Camera className="mr-2 h-4 w-4" /> Capture
                        </Button>
                    )}
                </div>

                {isCameraActive && (
                    <div className="mt-2 rounded-md overflow-hidden border border-border neumorphic-inset-sm aspect-video">
                         <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                    </div>
                )}

                {capturedSelfie && (
                    <div className="mt-2 space-y-2">
                        <p className="text-sm font-medium">Selfie Preview:</p>
                        <div className="relative aspect-video w-full max-w-[200px] neumorphic-sm rounded-md overflow-hidden">
                             <Image src={capturedSelfie} alt="Captured selfie" layout="fill" objectFit="cover" />
                        </div>
                        <Button type="button" variant="ghost" size="sm" onClick={clearCapturedSelfie} className="text-destructive hover:text-destructive-foreground">
                            <Trash2 className="mr-1 h-4 w-4" /> Clear Selfie
                        </Button>
                    </div>
                )}
            </div>
          </div>
          <DialogFooter className="sm:justify-between">
             <DialogClose asChild>
              <Button type="button" variant="outline" className="neumorphic-button">Cancel</Button>
            </DialogClose>
            <Button type="button" variant="neumorphic-primary" onClick={handleSaveMoodLog}>Save Mood</Button>
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
                      <div className="relative w-full sm:w-32 h-32 sm:h-auto aspect-square rounded-md overflow-hidden neumorphic-inset-sm">
                        <Image src={log.selfieDataUri} alt={`Selfie for mood ${log.mood}`} layout="fill" objectFit="cover" data-ai-hint="selfie person" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-semibold text-lg flex items-center gap-2">
                          <span className="text-3xl">{log.mood}</span>
                          <span>{moodEmojis[log.mood] ? '' : log.mood}</span> 
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
    </main>
  );
}

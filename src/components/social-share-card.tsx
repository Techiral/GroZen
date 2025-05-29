
"use client";

import React from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { MoodLog } from '@/types/wellness';
import { Share2, CalendarDays, Zap } from 'lucide-react'; 
import { format, differenceInDays, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface SocialShareCardProps {
  beforeLog: MoodLog;
  afterLog: MoodLog;
}

const SocialShareCard: React.FC<SocialShareCardProps> = ({ beforeLog, afterLog }) => {
  const { toast } = useToast();

  if (!beforeLog.selfieDataUri || !afterLog.selfieDataUri || !beforeLog.date || !afterLog.date) {
    return <p className="text-muted-foreground text-2xs sm:text-xs">Selfie data or date is missing for one or both logs. Cannot generate share card.</p>;
  }
  
  const daysBetween = differenceInDays(parseISO(afterLog.date), parseISO(beforeLog.date));

  const handleShare = async () => {
    const appUrl = typeof window !== "undefined" ? window.location.origin : "GroZenApp.com"; 
    const shareData = {
      title: 'My GroZen Progress!',
      text: `Check out my GroZen progress over ${daysBetween} days! Feeling great. Start your wellness journey with GroZen! ${appUrl} #GroZenProgress #WellnessJourney`,
      url: appUrl,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        toast({ title: 'Shared!', description: 'Your progress has been shared.' });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`);
        toast({ title: 'Copied to Clipboard', description: 'Share content copied! Paste it to share.' });
      } else {
         toast({ variant: 'default', title: 'Sharing Not Available', description: 'Your browser does not support direct sharing or clipboard access for this.' });
      }
    } catch (error) {
      console.error('Error sharing:', error);
      const errorMessage = error instanceof Error ? error.message.toLowerCase() : '';
      if (errorMessage.includes('abort') || errorMessage.includes('cancel')) {
         toast({ variant: 'default', title: 'Share Canceled', description: 'Sharing was canceled.' });
      } else if (errorMessage.includes('permission denied') || errorMessage.includes('not allowed')) {
          toast({ variant: 'default', title: 'Share Permission Denied', description: 'Could not share. Content copied to clipboard instead!', duration: 5000 });
          if (navigator.clipboard) { // Ensure clipboard is available before attempting to use it
            await navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`);
          }
      } else {
        toast({ variant: 'destructive', title: 'Error Sharing', description: 'Could not share your progress. Copied to clipboard instead.', duration: 5000 });
        if (navigator.clipboard) {
            await navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`);
        }
      }
    }
  };


  return (
    <Card className="neumorphic w-full">
      <CardHeader className="p-2 sm:p-2.5 md:p-3">
        <CardTitle className="text-sm sm:text-base font-bold text-center flex items-center justify-center gap-1 sm:gap-1.5">
            <Zap className="h-3 w-3 sm:h-3.5 sm:w-4 text-accent" /> My GroZen Progress! <Zap className="h-3 w-3 sm:h-3.5 sm:w-4 text-accent" />
        </CardTitle>
         {daysBetween >= 0 && (
            <p className="text-center text-2xs sm:text-xs text-muted-foreground mt-0.5">
                Over {daysBetween} Days!
            </p>
        )}
      </CardHeader>
      <CardContent className="space-y-2 sm:space-y-2.5 p-2 sm:p-2.5 md:p-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-2.5 items-center">
          <div className="space-y-0.5">
            <h3 className="text-2xs sm:text-xs font-semibold text-center">Before</h3>
            <div className="relative aspect-square w-full rounded-md sm:rounded-lg overflow-hidden neumorphic-inset-sm">
              <Image 
                src={beforeLog.selfieDataUri} 
                alt="Before selfie" 
                fill={true}
                className="object-cover"
                sizes="(max-width: 640px) 90vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                data-ai-hint="progress selfie" 
              />
            </div>
            <p className="text-3xs sm:text-2xs text-muted-foreground text-center flex items-center justify-center gap-0.5">
              <CalendarDays className="h-2.5 w-2.5" /> {format(parseISO(beforeLog.date), 'MMM d, yy')}
            </p>
          </div>
          <div className="space-y-0.5">
            <h3 className="text-2xs sm:text-xs font-semibold text-center">
              After
            </h3>
            <div className="relative aspect-square w-full rounded-md sm:rounded-lg overflow-hidden neumorphic-inset-sm">
              <Image 
                src={afterLog.selfieDataUri} 
                alt="After selfie" 
                fill={true}
                className="object-cover"
                sizes="(max-width: 640px) 90vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                data-ai-hint="progress selfie"
              />
            </div>
             <p className="text-3xs sm:text-2xs text-muted-foreground text-center flex items-center justify-center gap-0.5">
              <CalendarDays className="h-2.5 w-2.5" /> {format(parseISO(afterLog.date), 'MMM d, yy')}
            </p>
          </div>
        </div>
        <Button onClick={handleShare} variant="neumorphic-primary" className="w-full text-2xs px-2 py-1 h-8 sm:text-xs sm:px-2.5 sm:py-1.5 sm:h-9">
          <Share2 className="mr-1 h-2.5 w-2.5 sm:mr-1.5 sm:h-3 sm:w-3" /> Share My Progress
        </Button>
      </CardContent>
    </Card>
  );
};

export default SocialShareCard;

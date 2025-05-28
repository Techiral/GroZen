
"use client";

import React from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { MoodLog } from '@/types/wellness';
import { Share2, CalendarDays, Zap } from 'lucide-react'; // Added Zap for visual flair
import { format, differenceInDays, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface SocialShareCardProps {
  beforeLog: MoodLog;
  afterLog: MoodLog;
}

const SocialShareCard: React.FC<SocialShareCardProps> = ({ beforeLog, afterLog }) => {
  const { toast } = useToast();

  if (!beforeLog.selfieDataUri || !afterLog.selfieDataUri) {
    return <p className="text-muted-foreground text-2xs sm:text-xs">Selfie data is missing for one or both logs. Cannot generate share card.</p>;
  }
  
  const daysBetween = differenceInDays(parseISO(afterLog.date), parseISO(beforeLog.date));

  const handleShare = async () => {
    const appUrl = typeof window !== "undefined" ? window.location.origin : "GroZenApp.com"; // Fallback URL
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
      if (errorMessage.includes('share is not supported') || 
          errorMessage.includes('user denied permission') ||
          errorMessage.includes('aborted') ||
          errorMessage.includes('share canceled') || // Note: 'share Canceled' was specific, this is broader
          errorMessage.includes('cancelled')) {
         toast({ variant: 'default', title: 'Share Canceled or Unavailable', description: 'Sharing was canceled or is not available on this device/browser.' });
      } else {
        toast({ variant: 'destructive', title: 'Error Sharing', description: 'Could not share your progress at this time.' });
      }
    }
  };


  return (
    <Card className="neumorphic w-full">
      <CardHeader className="p-3 sm:p-4">
        <CardTitle className="text-sm sm:text-md md:text-lg font-bold text-center flex items-center justify-center gap-1.5">
            <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-accent" /> My GroZen Progress! <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
        </CardTitle>
         {daysBetween >= 0 && (
            <p className="text-center text-xs sm:text-sm text-muted-foreground mt-1">
                Over {daysBetween} Days!
            </p>
        )}
      </CardHeader>
      <CardContent className="space-y-2.5 sm:space-y-3 p-3 sm:p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-2.5 items-center">
          <div className="space-y-1">
            <h3 className="text-xs sm:text-sm font-semibold text-center">Before</h3>
            <div className="relative aspect-square w-full rounded-lg overflow-hidden neumorphic-inset-sm">
              <Image 
                src={beforeLog.selfieDataUri} 
                alt="Before selfie" 
                fill={true}
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 33vw"
                data-ai-hint="progress selfie" 
              />
            </div>
            <p className="text-2xs sm:text-xs text-muted-foreground text-center flex items-center justify-center gap-0.5 sm:gap-1">
              <CalendarDays className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> {format(parseISO(beforeLog.date), 'MMM d, yy')}
            </p>
          </div>
          <div className="space-y-1">
            <h3 className="text-xs sm:text-sm font-semibold text-center">
              After
            </h3>
            <div className="relative aspect-square w-full rounded-lg overflow-hidden neumorphic-inset-sm">
              <Image 
                src={afterLog.selfieDataUri} 
                alt="After selfie" 
                fill={true}
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 33vw"
                data-ai-hint="progress selfie"
              />
            </div>
             <p className="text-2xs sm:text-xs text-muted-foreground text-center flex items-center justify-center gap-0.5 sm:gap-1">
              <CalendarDays className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> {format(parseISO(afterLog.date), 'MMM d, yy')}
            </p>
          </div>
        </div>
        <Button onClick={handleShare} variant="neumorphic-primary" className="w-full text-2xs px-2.5 py-1 sm:text-xs sm:px-3 sm:py-1.5">
          <Share2 className="mr-1 h-3 w-3 sm:mr-1.5 sm:h-3.5 sm:w-3.5" /> Share My Progress
        </Button>
      </CardContent>
    </Card>
  );
};

export default SocialShareCard;

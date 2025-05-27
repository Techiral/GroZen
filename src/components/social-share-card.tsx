
"use client";

import React from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { MoodLog } from '@/types/wellness';
import { Share2, CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface SocialShareCardProps {
  beforeLog: MoodLog;
  afterLog: MoodLog;
}

const SocialShareCard: React.FC<SocialShareCardProps> = ({ beforeLog, afterLog }) => {
  const { toast } = useToast();

  const handleShare = async () => {
    const shareData = {
      title: 'My GroZen Progress!',
      text: `Check out my wellness journey with GroZen! From ${format(new Date(beforeLog.date), 'MMM d, yyyy')} to ${format(new Date(afterLog.date), 'MMM d, yyyy')}. #GroZen #WellnessJourney`,
      // url: window.location.href, // Consider sharing a link to the app's landing page or a public profile if that becomes a feature
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        toast({ title: 'Shared!', description: 'Your progress has been shared.' });
      } else {
        navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}${shareData.url ? `\n${shareData.url}` : ''}`);
        toast({ title: 'Copied to Clipboard', description: 'Share content copied. Paste it to share!' });
      }
    } catch (error) {
      console.error('Error sharing:', error);
      const errorMessage = error instanceof Error ? error.message : 'Could not share your progress.';
      // Avoid showing generic error object string in toast
      if (errorMessage.includes('share() is not available') || errorMessage.includes('The user canceled the share operation')) {
         toast({ variant: 'default', title: 'Share Canceled', description: 'Sharing was canceled or not available.' });
      } else {
        toast({ variant: 'destructive', title: 'Error Sharing', description: 'Could not share your progress at this time.' });
      }
    }
  };

  if (!beforeLog.selfieDataUri || !afterLog.selfieDataUri) {
    return <p className="text-muted-foreground text-sm sm:text-base">Selfie data is missing for one or both logs.</p>;
  }

  return (
    <Card className="neumorphic w-full">
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl font-bold text-center">My GroZen Journey!</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 items-center">
          <div className="space-y-2">
            <h3 className="text-md sm:text-lg font-semibold text-center">Before</h3>
            <div className="relative aspect-square w-full rounded-lg overflow-hidden neumorphic-inset-sm">
              <Image 
                src={beforeLog.selfieDataUri} 
                alt="Before selfie" 
                fill={true}
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                data-ai-hint="progress selfie" 
              />
            </div>
            <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
              <CalendarDays size={12} className="sm:size-14" /> {format(new Date(beforeLog.date), 'MMM d, yyyy')}
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-md sm:text-lg font-semibold text-center">
              After ({format(new Date(afterLog.date), 'MMM d')})
            </h3>
            <div className="relative aspect-square w-full rounded-lg overflow-hidden neumorphic-inset-sm">
              <Image 
                src={afterLog.selfieDataUri} 
                alt="After selfie" 
                fill={true}
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                data-ai-hint="progress selfie"
              />
            </div>
             <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
              <CalendarDays size={12} className="sm:size-14" /> {format(new Date(afterLog.date), 'MMM d, yyyy')}
            </p>
          </div>
        </div>
        <Button onClick={handleShare} variant="neumorphic-primary" className="w-full text-sm sm:text-base">
          <Share2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Share My Progress
        </Button>
      </CardContent>
    </Card>
  );
};

export default SocialShareCard;

    
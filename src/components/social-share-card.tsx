
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
      text: `Check out my wellness journey with GroZen! From ${format(new Date(beforeLog.date), 'MMM d, yyyy')} to ${format(new Date(afterLog.date), 'MMM d, yyyy')}.`,
      // url: window.location.href, // You might want to share a link to the app or a specific page
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        toast({ title: 'Shared!', description: 'Your progress has been shared.' });
      } else {
        // Fallback for browsers that do not support navigator.share
        navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}`);
        toast({ title: 'Copied to Clipboard', description: 'Share content copied. Paste it to share!' });
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast({ variant: 'destructive', title: 'Error Sharing', description: 'Could not share your progress at this time.' });
    }
  };

  if (!beforeLog.selfieDataUri || !afterLog.selfieDataUri) {
    return <p className="text-muted-foreground">Selfie data is missing for one or both logs.</p>;
  }

  return (
    <Card className="neumorphic w-full">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-center">My GroZen Journey!</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-center">Before</h3>
            <div className="relative aspect-square w-full rounded-lg overflow-hidden neumorphic-inset-sm">
              <Image 
                src={beforeLog.selfieDataUri} 
                alt="Before selfie" 
                layout="fill" 
                objectFit="cover"
                data-ai-hint="progress selfie" 
              />
            </div>
            <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
              <CalendarDays size={14} /> {format(new Date(beforeLog.date), 'MMM d, yyyy')}
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-center">
              After ({format(new Date(afterLog.date), 'MMM d, yyyy')})
            </h3>
            <div className="relative aspect-square w-full rounded-lg overflow-hidden neumorphic-inset-sm">
              <Image 
                src={afterLog.selfieDataUri} 
                alt="After selfie" 
                layout="fill" 
                objectFit="cover"
                data-ai-hint="progress selfie"
              />
            </div>
             <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
              <CalendarDays size={14} /> {format(new Date(afterLog.date), 'MMM d, yyyy')}
            </p>
          </div>
        </div>
        <Button onClick={handleShare} variant="neumorphic-primary" className="w-full">
          <Share2 className="mr-2 h-5 w-5" /> Share My Progress
        </Button>
      </CardContent>
    </Card>
  );
};

export default SocialShareCard;

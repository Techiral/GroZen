
"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePlan } from '@/contexts/plan-context';
import Logo from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';

export default function HomePage() {
  const router = useRouter();
  const { isPlanAvailable, isOnboarded, isLoadingPlan } = usePlan();
  const [isClient, setIsClient] = React.useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && !isLoadingPlan) {
      if (isPlanAvailable) {
        router.replace('/dashboard');
      } else if (isOnboarded) {
        router.replace('/onboarding'); 
      }
    }
  }, [isClient, isPlanAvailable, isOnboarded, isLoadingPlan, router]);

  if (!isClient || isLoadingPlan) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-8 text-center">
        <Logo size="text-4xl sm:text-5xl" />
        <Loader2 className="mt-6 h-10 w-10 sm:h-12 sm:w-12 animate-spin text-primary" />
        <p className="mt-4 text-md sm:text-lg">Loading your GroZen experience...</p>
      </div>
    );
  }
  
  if (isPlanAvailable || isOnboarded) {
    return ( 
       <div className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-8 text-center">
        <Logo size="text-4xl sm:text-5xl" />
        <Loader2 className="mt-6 h-10 w-10 sm:h-12 sm:w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen text-center p-4 sm:p-6 md:p-8">
      <div className="absolute inset-0 z-[-1] opacity-10">
         <Image 
          src="https://placehold.co/1200x800.png" 
          alt="Abstract background"
          data-ai-hint="wellness abstract" 
          fill={true}
          className="object-cover"
          priority
        />
      </div>
      <div className="relative z-10 p-6 md:p-8 lg:p-10 neumorphic rounded-xl max-w-md sm:max-w-lg md:max-w-2xl bg-background/80 backdrop-blur-sm">
        <div className="mb-6 sm:mb-8">
          <Logo size="text-4xl sm:text-5xl" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-foreground">
          Welcome to GroZen
        </h1>
        <p className="text-lg sm:text-xl text-muted-foreground mb-6 sm:mb-8">
          Your personalized AI wellness companion for a healthier, more balanced life. Get tailored meal plans, fitness routines, and mindfulness practices.
        </p>
        <Button 
          variant="neumorphic-primary" 
          size="lg" 
          onClick={() => router.push('/onboarding')}
          className="text-md sm:text-lg px-6 py-4 sm:px-8 sm:py-6"
        >
          Get Started
        </Button>
        <p className="mt-6 text-xs sm:text-sm text-muted-foreground">
          Already have a plan? It will load automatically if available.
        </p>
      </div>
    </main>
  );
}

    

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
  const { currentUser, isLoadingAuth, isPlanAvailable, isOnboardedState } = usePlan();
  const [isClient, setIsClient] = React.useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && !isLoadingAuth) {
      if (currentUser) {
        if (isOnboardedState) { 
          router.replace('/dashboard'); 
        } else { 
          router.replace('/onboarding');
        }
      } else {
        // No current user, stay on home page.
      }
    }
  }, [isClient, currentUser, isLoadingAuth, isPlanAvailable, isOnboardedState, router]);

  if (!isClient || isLoadingAuth || (isClient && !isLoadingAuth && currentUser)) { 
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <Logo size="text-xl sm:text-2xl md:text-3xl" />
        <Loader2 className="mt-4 h-5 w-5 sm:h-6 sm:w-6 animate-spin text-primary" />
        <p className="mt-2 text-xs sm:text-sm">Loading your GroZen experience...</p>
      </div>
    );
  }
  
  return (
    <main className="flex flex-col items-center justify-center min-h-screen text-center p-3 sm:p-4">
      <div className="absolute inset-0 z-[-1] opacity-10">
         <Image 
          src="https://placehold.co/1200x800.png" 
          alt="Abstract wellness background"
          data-ai-hint="wellness abstract" 
          fill={true}
          className="object-cover"
          priority
        />
      </div>
      <div className="relative z-10 p-4 sm:p-5 md:p-6 neumorphic rounded-xl max-w-[90vw] xs:max-w-xs sm:max-w-sm md:max-w-md bg-background/80 backdrop-blur-sm">
        <div className="mb-2 sm:mb-3">
          <Logo size="text-lg sm:text-xl" />
        </div>
        <h1 className="text-base sm:text-lg font-bold mb-1.5 sm:mb-2 text-foreground">
          Welcome to GroZen
        </h1>
        <p className="text-2xs sm:text-xs text-muted-foreground mb-3 sm:mb-4">
          Your personalized AI wellness companion for a healthier, more balanced life. Get tailored meal plans, fitness routines, and mindfulness practices.
        </p>
        <div className="flex flex-col space-y-2 sm:space-y-2.5">
            <Button 
            variant="neumorphic-primary" 
            onClick={() => router.push('/signup')}
            className="text-xs sm:text-sm px-3 py-1.5 h-8 sm:h-9"
            >
            Get Started
            </Button>
            <Button 
            variant="outline" 
            onClick={() => router.push('/login')}
            className="text-xs sm:text-sm px-3 py-1.5 h-8 sm:h-9 neumorphic-button"
            >
            Login
            </Button>
        </div>
      </div>
    </main>
  );
}


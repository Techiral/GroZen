
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
        if (isPlanAvailable) {
          router.replace('/dashboard');
        } else if (isOnboardedState) { // User is logged in, onboarded, but no plan (e.g. plan generation failed or new login)
          router.replace('/dashboard'); // Dashboard handles showing "create plan"
        }
         else { // User is logged in but not onboarded yet
          router.replace('/onboarding');
        }
      } else {
        // No current user, stay on home page.
      }
    }
  }, [isClient, currentUser, isLoadingAuth, isPlanAvailable, isOnboardedState, router]);

  if (!isClient || isLoadingAuth || (isClient && !isLoadingAuth && currentUser)) { // Show loader if not client, or loading auth, or if client but logged in (implies redirect is pending)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <Logo size="text-3xl sm:text-4xl md:text-5xl" />
        <Loader2 className="mt-5 h-8 w-8 sm:h-10 sm:w-10 animate-spin text-primary" />
        <p className="mt-3 text-sm sm:text-md">Loading your GroZen experience...</p>
      </div>
    );
  }
  
  // This content is for non-logged-in users.
  return (
    <main className="flex flex-col items-center justify-center min-h-screen text-center p-3 sm:p-4 md:p-6">
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
      <div className="relative z-10 p-4 sm:p-6 md:p-8 neumorphic rounded-xl max-w-xs sm:max-w-md md:max-w-lg bg-background/80 backdrop-blur-sm">
        <div className="mb-4 sm:mb-6">
          <Logo size="text-2xl sm:text-3xl md:text-4xl" />
        </div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 text-foreground">
          Welcome to GroZen
        </h1>
        <p className="text-xs sm:text-sm md:text-md text-muted-foreground mb-5 sm:mb-6">
          Your personalized AI wellness companion for a healthier, more balanced life. Get tailored meal plans, fitness routines, and mindfulness practices.
        </p>
        <div className="flex flex-col space-y-2.5 sm:space-y-3">
            <Button 
            variant="neumorphic-primary" 
            size="lg" 
            onClick={() => router.push('/signup')}
            className="text-xs sm:text-sm md:text-base px-4 py-2 sm:px-5 sm:py-2.5"
            >
            Get Started
            </Button>
            <Button 
            variant="outline" 
            size="lg" 
            onClick={() => router.push('/login')}
            className="text-xs sm:text-sm md:text-base px-4 py-2 sm:px-5 sm:py-2.5 neumorphic-button"
            >
            Login
            </Button>
        </div>
      </div>
    </main>
  );
}

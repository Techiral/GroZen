
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
        } else { // User is logged in but no plan or not fully onboarded yet by our app's logic
          router.replace('/onboarding');
        }
      } else {
        // No current user, stay on home page or redirect to login/signup explicitly if desired.
        // For now, home page offers "Get Started" which leads to onboarding, which will redirect to login.
      }
    }
  }, [isClient, currentUser, isLoadingAuth, isPlanAvailable, isOnboardedState, router]);

  if (!isClient || isLoadingAuth) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <Logo size="text-3xl sm:text-4xl md:text-5xl" />
        <Loader2 className="mt-5 h-8 w-8 sm:h-10 sm:w-10 animate-spin text-primary" />
        <p className="mt-3 text-sm sm:text-md">Loading your GroZen experience...</p>
      </div>
    );
  }
  
  // If user is logged in, they should have been redirected by the useEffect above.
  // This content is for non-logged-in users.
  if (currentUser) {
     return ( 
       <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <Logo size="text-3xl sm:text-4xl md:text-5xl" />
        <Loader2 className="mt-5 h-8 w-8 sm:h-10 sm:w-10 animate-spin text-primary" />
        <p className="mt-3 text-sm sm:text-md">Redirecting...</p>
      </div>
    );
  }


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
      <div className="relative z-10 p-4 md:p-6 lg:p-8 neumorphic rounded-xl max-w-sm sm:max-w-md md:max-w-lg bg-background/80 backdrop-blur-sm">
        <div className="mb-4 sm:mb-6">
          <Logo size="text-3xl sm:text-4xl" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 text-foreground">
          Welcome to GroZen
        </h1>
        <p className="text-sm sm:text-md text-muted-foreground mb-5 sm:mb-6">
          Your personalized AI wellness companion for a healthier, more balanced life. Get tailored meal plans, fitness routines, and mindfulness practices.
        </p>
        <Button 
          variant="neumorphic-primary" 
          size="lg" 
          onClick={() => router.push('/signup')} // Direct to signup, then login, then onboarding
          className="text-sm sm:text-base px-5 py-2.5 sm:px-6 sm:py-3"
        >
          Get Started
        </Button>
         <Button 
          variant="outline" 
          size="lg" 
          onClick={() => router.push('/login')}
          className="mt-3 text-sm sm:text-base px-5 py-2.5 sm:px-6 sm:py-3 neumorphic-button"
        >
          Login
        </Button>
      </div>
    </main>
  );
}

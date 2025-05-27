
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePlan } from '@/contexts/plan-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import Logo from '@/components/logo';
import { Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

// A simple Google Icon SVG (can be moved to a shared component if used elsewhere)
const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" data-ai-hint="google logo">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    <path d="M1 1h22v22H1z" fill="none"/>
  </svg>
);


export default function LoginPage() {
  const router = useRouter();
  const { loginWithEmail, signInWithGoogle, currentUser, isLoadingAuth } = usePlan();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoadingAuth && currentUser) {
      // Redirect logic is handled by PlanProvider or specific pages like dashboard/onboarding
    }
  }, [currentUser, isLoadingAuth, router]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setIsGoogleSubmitting(false);
    const user = await loginWithEmail(email, password);
    if (user) {
      router.replace('/dashboard'); 
    }
    setIsSubmitting(false);
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleSubmitting(true);
    setIsSubmitting(false);
    const user = await signInWithGoogle();
    if (user) {
      router.replace('/dashboard');
    }
    setIsGoogleSubmitting(false);
  };
  
  if (isLoadingAuth || (!isLoadingAuth && currentUser)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Logo size="text-3xl sm:text-4xl" />
        <Loader2 className="mt-4 h-8 w-8 animate-spin text-primary" />
        <p className="mt-2 text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-3 sm:p-4 md:p-6">
      <Card className="w-full max-w-sm neumorphic">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 sm:mb-4">
            <Logo size="text-xl sm:text-2xl" />
          </div>
          <CardTitle className="text-lg sm:text-xl">Login to GroZen</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Enter your credentials or sign in with Google.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEmailSubmit} className="space-y-3 sm:space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs sm:text-sm">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="text-xs sm:text-sm"
                disabled={isSubmitting || isGoogleSubmitting}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs sm:text-sm">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="text-xs sm:text-sm"
                disabled={isSubmitting || isGoogleSubmitting}
              />
            </div>
            <Button type="submit" variant="neumorphic-primary" className="w-full text-xs sm:text-sm" disabled={isSubmitting || isLoadingAuth || isGoogleSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Login with Email
            </Button>
          </form>
          <div className="my-4 sm:my-5 flex items-center">
            <Separator className="flex-grow" />
            <span className="mx-2 text-xs text-muted-foreground">OR</span>
            <Separator className="flex-grow" />
          </div>
          <Button 
            variant="outline" 
            className="w-full text-xs sm:text-sm neumorphic-button" 
            onClick={handleGoogleSignIn}
            disabled={isSubmitting || isLoadingAuth || isGoogleSubmitting}
          >
            {isGoogleSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon />}
            Sign in with Google
          </Button>
        </CardContent>
        <CardFooter className="flex flex-col items-center text-center text-xs sm:text-sm pt-4">
          <p>Don&apos;t have an account?</p>
          <Link href="/signup" className="font-medium text-primary hover:underline">
            Sign up here
          </Link>
        </CardFooter>
      </Card>
    </main>
  );
}

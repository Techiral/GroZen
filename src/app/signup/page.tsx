
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
import { useToast } from "@/hooks/use-toast";
import { Separator } from '@/components/ui/separator';

const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" data-ai-hint="google logo">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    <path d="M1 1h22v22H1z" fill="none"/>
  </svg>
);

export default function SignupPage() {
  const router = useRouter();
  const { signupWithEmail, signInWithGoogle, currentUser, isLoadingAuth } = usePlan();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoadingAuth && currentUser) {
      router.replace('/'); 
    }
  }, [currentUser, isLoadingAuth, router]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ variant: "destructive", title: "Signup Failed", description: "Passwords do not match." });
      return;
    }
    setIsSubmitting(true);
    setIsGoogleSubmitting(false); 
    await signupWithEmail(email, password);
    setIsSubmitting(false);
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleSubmitting(true);
    setIsSubmitting(false); 
    await signInWithGoogle();
    setIsGoogleSubmitting(false);
  };

  if (isLoadingAuth || (!isLoadingAuth && currentUser)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Logo size="text-xl sm:text-2xl" />
        <Loader2 className="mt-4 h-5 w-5 sm:h-6 sm:w-6 animate-spin text-primary" />
        <p className="mt-2 text-xs sm:text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-3 sm:p-4">
      <Card className="w-full max-w-[90vw] xs:max-w-xs sm:max-w-sm neumorphic">
        <CardHeader className="text-center px-4 pt-4 pb-3 sm:px-5 sm:pt-5 sm:pb-3.5">
          <div className="mx-auto mb-2 sm:mb-2.5">
            <Logo size="text-lg sm:text-xl" />
          </div>
          <CardTitle className="text-base sm:text-lg">Create your GroZen Account</CardTitle>
          <CardDescription className="text-2xs sm:text-xs">Join us to start your wellness journey.</CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-3 sm:px-5 sm:pb-4">
          <form onSubmit={handleEmailSubmit} className="space-y-3 sm:space-y-3.5">
            <div className="space-y-1">
              <Label htmlFor="email" className="text-2xs sm:text-xs">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="h-8 sm:h-9 text-xs sm:text-sm"
                disabled={isSubmitting || isGoogleSubmitting}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password" className="text-2xs sm:text-xs">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                required
                className="h-8 sm:h-9 text-xs sm:text-sm"
                disabled={isSubmitting || isGoogleSubmitting}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="confirm-password" className="text-2xs sm:text-xs">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Retype your password"
                required
                className="h-8 sm:h-9 text-xs sm:text-sm"
                disabled={isSubmitting || isGoogleSubmitting}
              />
            </div>
            <Button type="submit" variant="neumorphic-primary" className="w-full text-xs sm:text-sm h-8 sm:h-9" disabled={isSubmitting || isLoadingAuth || isGoogleSubmitting}>
              {isSubmitting ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> : null}
              Sign Up with Email
            </Button>
          </form>

          <div className="my-3 sm:my-3.5 flex items-center w-full">
            <Separator className="flex-1" />
            <span className="px-2 text-2xs sm:text-xs text-muted-foreground">OR</span>
            <Separator className="flex-1" />
          </div>

          <Button 
            variant="outline" 
            className="w-full text-xs sm:text-sm h-8 sm:h-9 neumorphic-button" 
            onClick={handleGoogleSignIn}
            disabled={isSubmitting || isLoadingAuth || isGoogleSubmitting}
          >
            {isGoogleSubmitting ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> : <GoogleIcon />}
            Sign up with Google
          </Button>
        </CardContent>
        <CardFooter className="flex flex-col items-center text-center text-2xs sm:text-xs pt-2.5 pb-3.5 px-4 sm:px-5 sm:pb-4">
          <p>Already have an account?</p>
          <Link href="/login" className="font-medium text-primary hover:underline">
            Login here
          </Link>
        </CardFooter>
      </Card>
    </main>
  );
}


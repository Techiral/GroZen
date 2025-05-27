
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

export default function SignupPage() {
  const router = useRouter();
  const { signupWithEmail, currentUser, isLoadingAuth } = usePlan();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();


  useEffect(() => {
    if (!isLoadingAuth && currentUser) {
      router.replace('/onboarding'); 
    }
  }, [currentUser, isLoadingAuth, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ variant: "destructive", title: "Signup Failed", description: "Passwords do not match." });
      return;
    }
    setIsSubmitting(true);
    const user = await signupWithEmail(email, password);
    if (user) {
      // Redirection is handled by useEffect or PlanProvider logic
    }
    setIsSubmitting(false);
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
          <CardTitle className="text-lg sm:text-xl">Create your GroZen Account</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Join us to start your wellness journey.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
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
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs sm:text-sm">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                required
                className="text-xs sm:text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-password" className="text-xs sm:text-sm">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Retype your password"
                required
                className="text-xs sm:text-sm"
              />
            </div>
            <Button type="submit" variant="neumorphic-primary" className="w-full text-xs sm:text-sm" disabled={isSubmitting || isLoadingAuth}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Sign Up
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center text-center text-xs sm:text-sm pt-4">
          <p>Already have an account?</p>
          <Link href="/login" className="font-medium text-primary hover:underline">
            Login here
          </Link>
        </CardFooter>
      </Card>
    </main>
  );
}


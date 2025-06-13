
"use client";

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { usePlan } from '@/contexts/plan-context';
import Logo from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Zap, Sparkles, ArrowRight, CheckCircle, Gift, X, Mail, User, Lock, Image as ImageIcon, Eye, EyeOff, ThumbsUp, BadgeCheck, Atom } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { addDoc, collection, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase'; // Assuming auth is exported for currentUser
import { Label } from '@/components/ui/label';

// --- Helper: Animated Text ---
const AnimatedText: React.FC<{ text: string; delay?: number; className?: string }> = ({ text, delay = 0, className = "" }) => {
  const [visibleText, setVisibleText] = useState("");
  useEffect(() => {
    let currentText = "";
    const chars = text.split("");
    const interval = setInterval(() => {
      if (chars.length > 0) {
        currentText += chars.shift();
        setVisibleText(currentText);
      } else {
        clearInterval(interval);
      }
    }, 50); // Adjust speed as needed
    return () => clearInterval(interval);
  }, [text]);

  return <span className={className}>{visibleText}</span>;
};

// --- Simplified Exit Intent Popup ---
const MinimalExitIntentPopup: React.FC<{ 
  onClose: () => void; 
  onEmailSubmit: (email: string) => Promise<void>; 
}> = ({ onClose, onEmailSubmit }) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ variant: "destructive", title: "Invalid Email", description: "Please enter a valid email address." });
      return;
    }
    setIsSubmitting(true);
    try {
      await onEmailSubmit(email);
      // Success toast is handled by the parent component
    } catch (error) {
      // Error toast is handled by the parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="neumorphic max-w-md mx-auto p-6 sm:p-8">
        <DialogHeader className="text-center">
          <Gift className="h-10 w-10 text-primary mx-auto mb-3" />
          <DialogTitle className="text-xl sm:text-2xl font-bold">Wait! One More Thing...</DialogTitle>
          <DialogDescription className="text-sm sm:text-base text-muted-foreground mt-1">
            Get an exclusive AI-generated mini-plan, just for you. Instantly.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <Input
            type="email"
            placeholder="Enter your email for your FREE gift"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 text-base neumorphic-inset"
            required
            disabled={isSubmitting}
          />
          <Button 
            type="submit" 
            className="w-full neumorphic-button-primary text-base py-3 h-12"
            disabled={isSubmitting}
          >
            {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Claim My Free Mini-Plan"}
            <Sparkles className="ml-2 h-5 w-5" />
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};


// --- Simplified Gamified Signup Modal ---
const SignupStep: React.FC<{ title: string; children: React.ReactNode; onNext?: () => Promise<boolean | void>; onPrev?: () => void; onComplete?: () => Promise<void>; currentStep: number; totalSteps: number; isCompleting?: boolean; nextText?: string; prevText?: string; completeText?: string }> = ({ title, children, onNext, onPrev, onComplete, currentStep, totalSteps, isCompleting, nextText = "Next", prevText = "Back", completeText = "Finish & Glow Up!" }) => {
  const [isLoadingNext, setIsLoadingNext] = useState(false);

  const handleNext = async () => {
    if (onNext) {
      setIsLoadingNext(true);
      const canProceed = await onNext();
      setIsLoadingNext(false);
      if (canProceed === false) return; // Explicitly stop if onNext returns false
    }
  };
  
  const handleComplete = async () => {
    if (onComplete) {
      await onComplete();
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <h3 className="text-lg sm:text-xl font-semibold text-center text-primary">{title}</h3>
      <div>{children}</div>
      <div className="flex flex-col sm:flex-row gap-2 pt-2">
        {onPrev && currentStep > 0 && (
          <Button variant="outline" onClick={onPrev} className="neumorphic-button flex-1 h-10 sm:h-11 text-sm">
            {prevText}
          </Button>
        )}
        {currentStep === 0 && !onPrev && <div className="sm:flex-1"></div>} 
        {onNext && currentStep < totalSteps - 1 && (
          <Button onClick={handleNext} className="neumorphic-button-primary flex-1 h-10 sm:h-11 text-sm" disabled={isLoadingNext}>
            {isLoadingNext ? <Loader2 className="h-4 w-4 animate-spin" /> : nextText}
            {!isLoadingNext && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
        )}
        {onComplete && currentStep === totalSteps - 1 && (
          <Button onClick={handleComplete} className="neumorphic-button-primary flex-1 h-10 sm:h-11 text-sm" disabled={isCompleting}>
            {isCompleting ? <Loader2 className="h-4 w-4 animate-spin" /> : completeText}
            {!isCompleting && <Sparkles className="ml-2 h-4 w-4" />}
          </Button>
        )}
      </div>
      <Progress value={((currentStep + 1) / totalSteps) * 100} className="h-1.5 mt-3 sm:mt-4" />
    </div>
  );
};

const AvatarOptions = [
  { id: 'avatar1', src: 'https://placehold.co/100x100/D3D3D3/000000?text=G1', alt: 'GroZen Avatar 1', hint: 'abstract geometric' },
  { id: 'avatar2', src: 'https://placehold.co/100x100/D3D3D3/000000?text=G2', alt: 'GroZen Avatar 2', hint: 'abstract minimal' },
  { id: 'avatar3', src: 'https://placehold.co/100x100/D3D3D3/000000?text=G3', alt: 'GroZen Avatar 3', hint: 'abstract modern' },
  { id: 'avatar4', src: 'https://placehold.co/100x100/D3D3D3/000000?text=G4', alt: 'GroZen Avatar 4', hint: 'abstract tech' },
];

const MinimalSignupModal: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  initialEmail?: string;
}> = ({ isOpen, onClose, initialEmail = '' }) => {
  const { signupWithDetails, currentUser } = usePlan(); // Assuming PlanProvider handles currentUser redirection
  const router = useRouter();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState(initialEmail);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AvatarOptions[0].src);
  
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [usernameError, setUsernameError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const usernameDebounceTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (initialEmail) setEmail(initialEmail);
  }, [initialEmail]);
  
  useEffect(() => { // Redirect if user becomes available (e.g. successful signup)
    if (currentUser) {
      router.push('/onboarding'); // Or /dashboard if onboarding is also handled by signupWithDetails
    }
  }, [currentUser, router]);


  const checkUsernameAvailability = useCallback(async (name: string) => {
    if (!name.trim() || name.trim().length < 3) {
      setUsernameStatus('idle');
      setUsernameError('Username must be at least 3 characters.');
      return false;
    }
    setUsernameStatus('checking');
    setUsernameError('');
    try {
      const usernameDocRef = doc(db, "usernames", name.trim().toLowerCase());
      const docSnap = await getDoc(usernameDocRef);
      if (docSnap.exists()) {
        setUsernameStatus('taken');
        setUsernameError('Bummer, that username is taken. Try another!');
        return false;
      } else {
        setUsernameStatus('available');
        setUsernameError('');
        return true;
      }
    } catch (error) {
      console.error("Error checking username:", error);
      setUsernameStatus('idle');
      setUsernameError('Could not check username. Try again.');
      return false;
    }
  }, []);

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUsername = e.target.value;
    setUsername(newUsername);
    setUsernameStatus('idle');
    setUsernameError('');
    if (usernameDebounceTimeout.current) {
      clearTimeout(usernameDebounceTimeout.current);
    }
    if (newUsername.trim().length >= 3) {
      usernameDebounceTimeout.current = setTimeout(() => {
        checkUsernameAvailability(newUsername);
      }, 700);
    } else if (newUsername.trim().length > 0) {
      setUsernameError('Needs to be at least 3 characters.');
    }
  };
  
  const evaluatePasswordStrength = (pass: string) => {
    let strength = 0;
    if (pass.length >= 8) strength += 25;
    if (/[A-Z]/.test(pass)) strength += 25;
    if (/[0-9]/.test(pass)) strength += 25;
    if (/[^A-Za-z0-9]/.test(pass)) strength += 25;
    setPasswordStrength(strength);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    evaluatePasswordStrength(newPassword);
  };

  const validateStep0 = async () => { // Email
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ variant: "destructive", title: "Invalid Email", description: "Please enter a valid email address." });
      return false;
    }
    setCurrentStep(1);
  };

  const validateStep1 = async () => { // Username
    const isAvailable = await checkUsernameAvailability(username);
    if (isAvailable) {
      setCurrentStep(2);
      return true;
    }
    return false;
  };

  const validateStep2 = async () => { // Password
    if (password.length < 6) {
      toast({ variant: "destructive", title: "Password Too Short", description: "Password must be at least 6 characters." });
      return false;
    }
    setCurrentStep(3);
  };

  const handleCompleteSignup = async () => {
    if (!email || !username || !password || !selectedAvatar) {
      toast({ variant: "destructive", title: "Missing Information", description: "Please complete all fields." });
      return;
    }
    setIsCompleting(true);
    const success = await signupWithDetails(email, password, username, selectedAvatar);
    setIsCompleting(false);
    if (success) {
      toast({
        title: "Welcome to GroZen! 🎉",
        description: "Your account is created. Let's get you set up!",
      });
      onClose(); // Close modal
      // Redirection will be handled by useEffect monitoring currentUser
    } else {
      // signupWithDetails should show its own error toast
    }
  };

  const steps = [
    { title: "Your Email to Start", content: (
      <div className="space-y-2">
        <Label htmlFor="signup-email" className="text-muted-foreground">Email Address</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input id="signup-email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 h-11 neumorphic-inset" />
        </div>
      </div>
    ), onNext: validateStep0 },
    { title: "Create Your Username", content: (
      <div className="space-y-2">
        <Label htmlFor="signup-username" className="text-muted-foreground">Username</Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input id="signup-username" type="text" placeholder="YourUniqueName" value={username} onChange={handleUsernameChange} className="pl-10 h-11 neumorphic-inset" />
          {usernameStatus === 'checking' && <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-primary" />}
          {usernameStatus === 'available' && <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />}
          {usernameStatus === 'taken' && <X className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-red-500" />}
        </div>
        {usernameError && <p className="text-xs text-red-500 text-center pt-1">{usernameError}</p>}
        {usernameStatus === 'available' && <p className="text-xs text-green-500 text-center pt-1">Awesome, it's available!</p>}
      </div>
    ), onNext: validateStep1, onPrev: () => setCurrentStep(0) },
    { title: "Secure Your Account", content: (
      <div className="space-y-2">
        <Label htmlFor="signup-password" className="text-muted-foreground">Password</Label>
        <div className="relative">
           <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
           <Input id="signup-password" type={showPassword ? "text" : "password"} placeholder="Make it strong!" value={password} onChange={handlePasswordChange} className="pl-10 pr-10 h-11 neumorphic-inset" />
           <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8" onClick={() => setShowPassword(!showPassword)}>
             {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
           </Button>
        </div>
        {password.length > 0 && (
          <div className="flex items-center gap-2 pt-1">
            <Progress value={passwordStrength} className="h-1.5 flex-1" />
            <span className="text-xs text-muted-foreground">{passwordStrength < 50 ? "Weak" : passwordStrength < 100 ? "Medium" : "Strong"}</span>
          </div>
        )}
      </div>
    ), onNext: validateStep2, onPrev: () => setCurrentStep(1) },
    { title: "Choose Your Vibe", content: (
      <div className="space-y-3">
        <p className="text-center text-muted-foreground text-xs">Pick an avatar that represents you.</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {AvatarOptions.map(avatar => (
            <button
              key={avatar.id}
              onClick={() => setSelectedAvatar(avatar.src)}
              className={cn(
                "aspect-square rounded-lg overflow-hidden transition-all duration-200 transform hover:scale-105 neumorphic",
                selectedAvatar === avatar.src ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-105 neumorphic-inset" : "neumorphic-sm"
              )}
            >
              <Image src={avatar.src} alt={avatar.alt} width={80} height={80} className="w-full h-full object-cover" data-ai-hint={avatar.hint} />
            </button>
          ))}
        </div>
      </div>
    ), onComplete: handleCompleteSignup, onPrev: () => setCurrentStep(2) },
  ];
  
  const resetModal = () => {
    setCurrentStep(0);
    setEmail(initialEmail);
    setUsername('');
    setPassword('');
    setSelectedAvatar(AvatarOptions[0].src);
    setUsernameStatus('idle');
    setUsernameError('');
    setPasswordStrength(0);
    setIsCompleting(false);
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && resetModal()}>
      <DialogContent className="neumorphic max-w-md mx-auto p-6 sm:p-8">
        <DialogHeader className="mb-2 sm:mb-4">
          <div className="mx-auto mb-2">
            <Logo size="text-lg" />
          </div>
          <DialogTitle className="text-xl sm:text-2xl font-bold text-center">Join GroZen - It's Free!</DialogTitle>
        </DialogHeader>
        <SignupStep
          title={steps[currentStep].title}
          currentStep={currentStep}
          totalSteps={steps.length}
          onNext={steps[currentStep].onNext}
          onPrev={steps[currentStep].onPrev}
          onComplete={steps[currentStep].onComplete}
          isCompleting={isCompleting}
        >
          {steps[currentStep].content}
        </SignupStep>
      </DialogContent>
    </Dialog>
  );
};

// --- Main Landing Page Component ---
export default function MinimalDopamineLandingPage() {
  const router = useRouter();
  const { currentUser, isLoadingAuth, isOnboardedState } = usePlan();
  const { toast } = useToast();

  const [isClient, setIsClient] = useState(false);
  const [showExitIntent, setShowExitIntent] = useState(false);
  const [heroEmail, setHeroEmail] = useState('');
  const [isSubmittingHeroEmail, setIsSubmittingHeroEmail] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [initialModalEmail, setInitialModalEmail] = useState('');
  
  // Refs for scroll animations
  const benefitsRef = useRef<HTMLDivElement>(null);
  const testimonialRef = useRef<HTMLDivElement>(null);
  const finalCtaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsClient(true);
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !localStorage.getItem('grozen_exit_intent_shown_today')) {
        setShowExitIntent(true);
        localStorage.setItem('grozen_exit_intent_shown_today', 'true'); 
        // For demo, show once per session/day. Real app might use more complex logic.
      }
    };
    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, []);

  useEffect(() => {
    if (isClient && !isLoadingAuth) {
      if (currentUser) {
        router.replace(isOnboardedState ? '/dashboard' : '/onboarding');
      }
    }
  }, [isClient, currentUser, isLoadingAuth, isOnboardedState, router]);

  // Scroll Animations
  useEffect(() => {
    if (!isClient) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in-up');
          }
        });
      },
      { threshold: 0.1 }
    );

    if (benefitsRef.current) observer.observe(benefitsRef.current);
    if (testimonialRef.current) observer.observe(testimonialRef.current);
    if (finalCtaRef.current) observer.observe(finalCtaRef.current);

    return () => {
      if (benefitsRef.current) observer.unobserve(benefitsRef.current);
      if (testimonialRef.current) observer.unobserve(testimonialRef.current);
      if (finalCtaRef.current) observer.unobserve(finalCtaRef.current);
    };
  }, [isClient]);

  const handleEarlyEmailSubmit = async (email: string, source: 'hero' | 'exit_intent') => {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ variant: "destructive", title: "Invalid Email", description: "Please enter a valid email address." });
      return;
    }
    if (source === 'hero') setIsSubmittingHeroEmail(true);
    
    try {
      await addDoc(collection(db, "earlyAccessSignups"), {
        email: email.trim(),
        source: source,
        createdAt: serverTimestamp()
      });
      toast({
        title: "Awesome! ✨",
        description: "Your free mini-plan is on its way to your inbox!",
        duration: 5000
      });
      if (source === 'hero') setHeroEmail('');
      if (source === 'exit_intent') setShowExitIntent(false);
      // Optionally, trigger signup modal with email prefilled
      // setInitialModalEmail(email.trim());
      // setIsSignupModalOpen(true);
    } catch (error) {
      console.error("Error saving early access email:", error);
      toast({ variant: "destructive", title: "Submission Failed", description: "Could not save your email. Please try again." });
    } finally {
      if (source === 'hero') setIsSubmittingHeroEmail(false);
    }
  };
  
  const openSignupModalWithEmail = (email?: string) => {
    setInitialModalEmail(email || '');
    setIsSignupModalOpen(true);
  }

  if (!isClient || (isLoadingAuth && !currentUser)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 text-center">
        <Logo size="text-3xl" />
        <Loader2 className="mt-6 h-8 w-8 animate-spin text-primary" />
        <p className="mt-3 text-sm text-muted-foreground">Igniting your GroZen experience...</p>
      </div>
    );
  }
  
  const CoreBenefitItem: React.FC<{icon: React.ReactNode, title: string, delay: string}> = ({icon, title, delay}) => (
    <div className={`flex flex-col items-center space-y-2 opacity-0`} style={{animationDelay: delay}}>
      <div className="p-3 bg-card rounded-full neumorphic-sm text-primary">
        {icon}
      </div>
      <span className="text-sm sm:text-base text-center">{title}</span>
    </div>
  );


  return (
    <>
      <main className="min-h-screen bg-background text-foreground overflow-x-hidden">
        {/* Hero Section */}
        <section className="min-h-screen flex flex-col items-center justify-center text-center p-4 sm:p-6 relative edge-to-edge">
          <div 
            className="absolute inset-0 opacity-20" 
            style={{
              backgroundImage: 'radial-gradient(circle at 20% 20%, hsl(var(--primary) / 0.3) 0%, transparent 30%), radial-gradient(circle at 80% 70%, hsl(var(--accent) / 0.2) 0%, transparent 25%)',
              animation: 'pulse-bg 10s infinite alternate ease-in-out'
            }}
            aria-hidden="true"
          />
          
          <div className="relative z-10 flex flex-col items-center">
            <Logo size="text-3xl sm:text-4xl mb-4 sm:mb-6" />
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-3 sm:mb-4">
              <AnimatedText text="Unlock Your" className="block" />
              <span className="gradient-text block leading-tight">Teen Superpowers.</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-md sm:max-w-lg mb-6 sm:mb-8">
              GroZen: Instant AI wellness. Feel awesome, look amazing. <span className="text-primary font-semibold">It's 100% FREE!</span>
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mb-6 sm:mb-8 w-full max-w-md">
              <Button 
                onClick={() => openSignupModalWithEmail(heroEmail)}
                variant="neumorphic-primary" 
                size="lg" 
                className="w-full sm:flex-1 text-base sm:text-lg py-3 h-14 sm:h-16 group"
              >
                Start Free Transformation <Zap className="ml-2 h-5 w-5 group-hover:animate-pulse" />
              </Button>
            </div>
            
            <form 
              onSubmit={(e) => { e.preventDefault(); handleEarlyEmailSubmit(heroEmail, 'hero'); }}
              className="flex flex-col sm:flex-row gap-2 w-full max-w-md mb-4"
            >
              <Input
                type="email"
                placeholder="Or enter email for a free AI mini-plan!"
                value={heroEmail}
                onChange={(e) => setHeroEmail(e.target.value)}
                className="h-12 text-sm sm:text-base neumorphic-inset flex-1"
                disabled={isSubmittingHeroEmail}
              />
              <Button type="submit" variant="neumorphic" size="lg" className="h-12 text-sm sm:text-base" disabled={isSubmittingHeroEmail}>
                {isSubmittingHeroEmail ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
              </Button>
            </form>

            <div className="text-xs text-muted-foreground flex items-center">
              <BadgeCheck className="h-4 w-4 mr-1.5 text-green-500" />
              Join 10,000+ teens thriving with GroZen!
            </div>
          </div>
           <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-muted-foreground opacity-50"><path d="m6 9 6 6 6-6"/></svg>
           </div>
        </section>

        {/* Core Benefits Section */}
        <section ref={benefitsRef} className="py-16 sm:py-24 px-4 sm:px-6 bg-card edge-to-edge opacity-0">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">
              Instant <span className="gradient-text">Glow Up</span>. Zero Fluff.
            </h2>
            <p className="text-muted-foreground mb-10 sm:mb-12 text-sm sm:text-base">GroZen's AI gets you. Fast results, feelin' good.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-12">
              <CoreBenefitItem icon={<Atom className="h-8 w-8 sm:h-10 sm:w-10" />} title="AI-Powered Personal Plans" delay="0.1s" />
              <CoreBenefitItem icon={<ThumbsUp className="h-8 w-8 sm:h-10 sm:w-10" />} title="Boost Confidence Daily" delay="0.25s" />
              <CoreBenefitItem icon={<Zap className="h-8 w-8 sm:h-10 sm:w-10" />} title="Unlock Your Best Self, Fast" delay="0.4s" />
            </div>
          </div>
        </section>
        
        {/* Testimonial Section (Simplified) */}
        <section ref={testimonialRef} className="py-16 sm:py-24 px-4 sm:px-6 opacity-0">
          <div className="max-w-2xl mx-auto text-center">
            <Image
              src="https://placehold.co/80x80/D3D3D3/000000?text=✨"
              alt="Happy User Example"
              width={80}
              height={80}
              className="rounded-full mx-auto mb-4 neumorphic-sm"
              data-ai-hint="teen avatar"
            />
            <blockquote className="text-lg sm:text-xl italic text-muted-foreground">
              &ldquo;GroZen actually gets it. Felt a difference in days, not weeks. Seriously life-changing!&rdquo;
            </blockquote>
            <p className="mt-3 text-sm font-semibold text-primary">- Alex R. (GroZen User)</p>
          </div>
        </section>

        {/* Final CTA Section */}
        <section ref={finalCtaRef} className="py-16 sm:py-24 px-4 sm:px-6 bg-card edge-to-edge opacity-0">
          <div className="max-w-xl mx-auto text-center">
            <Sparkles className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
              Ready for Your <span className="gradient-text">Transformation</span>?
            </h2>
            <p className="text-muted-foreground mb-8 text-sm sm:text-base">
              Stop waiting, start living. Your best self is one click away. <span className="text-primary font-semibold">And yes, it's completely FREE!</span>
            </p>
            <Button 
              onClick={() => openSignupModalWithEmail()}
              variant="neumorphic-primary" 
              size="xl" 
              className="w-full max-w-md mx-auto text-lg sm:text-xl py-4 h-16 sm:h-20 group"
            >
              Join GroZen Free Now <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform" />
            </Button>
            <p className="text-xs text-muted-foreground mt-4">No credit card. No catch. Just results.</p>
          </div>
        </section>
      </main>

      {showExitIntent && (
        <MinimalExitIntentPopup 
          onClose={() => setShowExitIntent(false)}
          onEmailSubmit={(email) => handleEarlyEmailSubmit(email, 'exit_intent')}
        />
      )}
      
      <MinimalSignupModal 
        isOpen={isSignupModalOpen}
        onClose={() => setIsSignupModalOpen(false)}
        initialEmail={initialModalEmail}
      />
    </>
  );
}

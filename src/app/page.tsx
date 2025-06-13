
"use client";

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { usePlan } from '@/contexts/plan-context';
import Logo from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2, Zap, Sparkles, ArrowRight, CheckCircle, Gift, X, Mail, User, Lock, Image as ImageIcon, Eye, EyeOff, ThumbsUp, BadgeCheck, Atom, Star, Brain, Palette } from 'lucide-react'; // Added Brain, Palette
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";
import { addDoc, collection, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// --- Helper Components ---
const AnimatedText: React.FC<{ text: string; delay?: number; className?: string; as?: keyof JSX.IntrinsicElements }> = ({ text, delay = 0, className = "", as = "span" }) => {
  const [visibleText, setVisibleText] = useState("");
  const CustomTag = as;

  useEffect(() => {
    let currentText = "";
    const chars = text.split("");
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        if (chars.length > 0) {
          currentText += chars.shift();
          setVisibleText(currentText);
        } else {
          clearInterval(interval);
        }
      }, 30);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timeout);
  }, [text, delay]);

  return <CustomTag className={className}>{visibleText}</CustomTag>;
};

// --- Exit Intent Popup (Simplified) ---
const MinimalExitIntentPopup: React.FC<{ 
  isOpen: boolean;
  onClose: () => void; 
  onEmailSubmit: (email: string) => Promise<void>; 
}> = ({ isOpen, onClose, onEmailSubmit }) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ variant: "destructive", title: "Hold Up!", description: "Please enter a valid email address." });
      return;
    }
    setIsSubmitting(true);
    try {
      await onEmailSubmit(email);
      // Success toast handled by parent
      setEmail(''); // Clear email on success
    } catch (error) {
      // Error toast handled by parent
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="neumorphic max-w-xs mx-auto p-5 sm:p-6">
        <DialogHeader className="text-center">
          <Gift className="h-8 w-8 text-primary mx-auto mb-2" />
          <DialogTitle className="text-lg sm:text-xl font-bold">Wait! Free AI Plan ✨</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-1">
            Get a sneak peek. Instant value, 100% free.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 mt-3">
          <Input
            type="email"
            placeholder="Your Email for FREE Plan"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-10 text-sm neumorphic-inset"
            required
            disabled={isSubmitting}
          />
          <Button 
            type="submit" 
            className="w-full neumorphic-button-primary text-sm py-2.5 h-10"
            disabled={isSubmitting}
            size="lg"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Claim FREE Plan"}
            <Sparkles className="ml-2 h-4 w-4" />
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// --- Hero Section ---
const HeroSection: React.FC<{onCtaClick: (email?: string) => void; onEmailSubmit: (email: string) => Promise<void>}> = ({ onCtaClick, onEmailSubmit }) => {
  const [heroEmail, setHeroEmail] = useState('');
  const [isSubmittingHeroEmail, setIsSubmittingHeroEmail] = useState(false);
  const [dynamicUserCount, setDynamicUserCount] = useState("10,000+"); // Static for now

  const handleHeroEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!heroEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(heroEmail)) {
      // Basic validation, PlanProvider might have more robust checks via useToast
      alert("Please enter a valid email."); // Simple alert for this context
      return;
    }
    setIsSubmittingHeroEmail(true);
    await onEmailSubmit(heroEmail);
    setIsSubmittingHeroEmail(false);
    setHeroEmail('');
  };
  
  return (
    <section className="min-h-screen flex flex-col items-center justify-center text-center p-4 sm:p-6 relative edge-to-edge overflow-hidden">
      <div 
        className="absolute inset-0 opacity-10" 
        style={{ 
          backgroundImage: 'radial-gradient(circle at 10% 10%, hsl(var(--primary) / 0.1) 0%, transparent 30%), radial-gradient(circle at 90% 80%, hsl(var(--accent) / 0.08) 0%, transparent 25%)',
          animation: 'pulse-bg 12s infinite alternate ease-in-out'
        }}
        aria-hidden="true"
      />
      <div className="relative z-10 flex flex-col items-center">
        <div className="mb-4 sm:mb-6">
          <Logo size="text-3xl sm:text-4xl" />
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-3 sm:mb-4">
          <AnimatedText text="Instant Teen" className="block" as="span" />
          <span className="gradient-text block leading-tight tracking-tight">Glow Up ✨</span>
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground max-w-md sm:max-w-lg mb-6 sm:mb-8">
          AI wellness that gets you. Fast results, feel awesome. <strong className="text-primary font-semibold">100% FREE!</strong>
        </p>

        <div className="flex flex-col items-center gap-3 sm:gap-4 mb-4 sm:mb-6 w-full max-w-xs">
          <Button 
            onClick={() => onCtaClick(heroEmail.trim() || undefined)} // Pass email if entered
            variant="neumorphic-primary" 
            size="xl" 
            className="w-full text-base sm:text-lg group py-3"
          >
            Start Free Transformation <Zap className="ml-2 h-5 w-5 group-hover:animate-pulse" />
          </Button>
        </div>
        
        <form 
          onSubmit={handleHeroEmailSubmit}
          className="flex flex-col sm:flex-row gap-2 w-full max-w-xs mb-4"
        >
          <Input
            type="email"
            placeholder="Or get FREE AI mini-plan!"
            value={heroEmail}
            onChange={(e) => setHeroEmail(e.target.value)}
            className="h-11 text-sm sm:text-base neumorphic-inset flex-1"
            disabled={isSubmittingHeroEmail}
            aria-label="Enter email for free mini-plan"
          />
          <Button type="submit" variant="neumorphic" size="lg" className="h-11 text-sm sm:text-base px-4" disabled={isSubmittingHeroEmail}>
            {isSubmittingHeroEmail ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
             <span className="sm:hidden ml-2">Get Plan</span>
          </Button>
        </form>

        <div className="text-xs text-muted-foreground flex items-center">
          <BadgeCheck className="h-4 w-4 mr-1.5 text-green-400" />
          {dynamicUserCount} Teens Glowing Up With GroZen!
        </div>
      </div>
    </section>
  );
};

// --- Core Benefits Section (Minimal) ---
const CoreBenefitItem: React.FC<{icon: React.ReactNode, title: string, description: string}> = ({icon, title, description}) => (
  <div className="flex flex-col items-center space-y-1">
    <div className="p-2.5 bg-card rounded-full neumorphic-sm text-primary mb-1.5">
      {React.cloneElement(icon as React.ReactElement, { className: "h-6 w-6 sm:h-7 sm:w-7" })}
    </div>
    <h3 className="text-sm sm:text-base font-semibold text-center">{title}</h3>
    <p className="text-2xs sm:text-xs text-muted-foreground text-center max-w-[180px]">{description}</p>
  </div>
);

const CoreBenefitsSection = React.forwardRef<HTMLDivElement>((props, ref) => {
  return (
    <section 
      ref={ref} 
      className="py-12 sm:py-16 px-4 sm:px-6 opacity-0" // Initial opacity for animation
    >
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-2xl sm:text-3xl font-bold mb-8 sm:mb-10">
          Unlock Your <span className="gradient-text">Best Self</span>, Fast.
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
          <CoreBenefitItem icon={<Atom />} title="AI-Personalized Plans" description="Plans that fit YOU." />
          <CoreBenefitItem icon={<Brain />} title="Daily Confidence Boost" description="Feel better, instantly." />
          <CoreBenefitItem icon={<Zap />} title="Quick Wins, Real Results" description="See progress, fast." />
        </div>
      </div>
    </section>
  );
});
CoreBenefitsSection.displayName = 'CoreBenefitsSection';


// --- Minimal Testimonial Section ---
const TestimonialSection = React.forwardRef<HTMLDivElement>((props, ref) => {
  return (
    <section ref={ref} className="py-10 sm:py-12 px-4 sm:px-6 bg-card edge-to-edge opacity-0">
      <div className="max-w-xl mx-auto text-center">
        <Image
          src="https://placehold.co/60x60/D3D3D3/000000?text=😊"
          alt="Happy GroZen User (Example)"
          width={56}
          height={56}
          className="rounded-full mx-auto mb-3 neumorphic-sm border-2 border-primary/30"
          data-ai-hint="teenager avatar"
        />
        <blockquote className="text-sm sm:text-md italic text-muted-foreground">
          &ldquo;GroZen is a total vibe. Felt the change in like, 2 days!&rdquo;
        </blockquote>
        <p className="mt-2 text-xs font-semibold text-primary">- Alex P. (Example User)</p>
      </div>
    </section>
  );
});
TestimonialSection.displayName = 'TestimonialSection';

// --- Final CTA Section ---
const FinalCtaSection = React.forwardRef<HTMLDivElement, {onCtaClick: () => void}>((props, ref) => {
  return (
    <section ref={ref} className="py-16 sm:py-20 px-4 sm:px-6 opacity-0">
      <div className="max-w-lg mx-auto text-center">
        <Sparkles className="h-10 w-10 sm:h-12 sm:w-12 text-primary mx-auto mb-4" />
        <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
          Ready for <span className="gradient-text">Your Glow Up</span>?
        </h2>
        <p className="text-muted-foreground mb-8 text-sm sm:text-base">
          Stop scrolling, start shining. Your best self is a click away. <strong className="text-primary font-semibold">And yes, it's 100% FREE!</strong>
        </p>
        <Button 
          onClick={props.onCtaClick}
          variant="neumorphic-primary" 
          size="xl" 
          className="w-full max-w-xs sm:max-w-sm mx-auto text-base sm:text-lg group py-3"
        >
          Join GroZen Free Now <ArrowRight className="ml-3 h-5 w-5 sm:h-6 sm:w-6 group-hover:translate-x-1 transition-transform" />
        </Button>
        <p className="text-xs text-muted-foreground mt-4">No card. No catch. Just results.</p>
      </div>
    </section>
  );
});
FinalCtaSection.displayName = 'FinalCtaSection';


// --- Minimal Gamified Signup Modal ---
const SignupStep: React.FC<{ title: string; children: React.ReactNode; onNext?: () => Promise<boolean | void>; onPrev?: () => void; onComplete?: () => Promise<void>; currentStep: number; totalSteps: number; isCompleting?: boolean; nextText?: string; prevText?: string; completeText?: string }> = ({ title, children, onNext, onPrev, onComplete, currentStep, totalSteps, isCompleting, nextText = "Next", prevText = "Back", completeText = "Glow Up!" }) => {
  const [isLoadingNext, setIsLoadingNext] = useState(false);

  const handleNext = async () => {
    if (onNext) {
      setIsLoadingNext(true);
      const canProceed = await onNext();
      setIsLoadingNext(false);
      if (canProceed === false) return;
    }
  };
  
  const handleComplete = async () => {
    if (onComplete) {
      await onComplete();
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      <h3 className="text-md sm:text-lg font-semibold text-center text-primary">{title}</h3>
      <div>{children}</div>
      <div className="flex flex-col sm:flex-row gap-2 pt-2">
        {onPrev && currentStep > 0 && (
          <Button variant="outline" onClick={onPrev} className="neumorphic-button flex-1 h-10 sm:h-11 text-sm">
            {prevText}
          </Button>
        )}
        {currentStep === 0 && !onPrev && <div className="sm:flex-1 hidden sm:block"></div>} 
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
  { id: 'avatar1', src: 'https://placehold.co/80x80/D3D3D3/000000?text=🌟', alt: 'GroZen Avatar Star', hint: 'star icon' },
  { id: 'avatar2', src: 'https://placehold.co/80x80/D3D3D3/000000?text=🚀', alt: 'GroZen Avatar Rocket', hint: 'rocket icon' },
  { id: 'avatar3', src: 'https://placehold.co/80x80/D3D3D3/000000?text=💡', alt: 'GroZen Avatar Idea', hint: 'lightbulb idea' },
  { id: 'avatar4', src: 'https://placehold.co/80x80/D3D3D3/000000?text=🎨', alt: 'GroZen Avatar Palette', hint: 'art palette' },
];

const MinimalSignupModal: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  initialEmail?: string;
}> = ({ isOpen, onClose, initialEmail = '' }) => {
  const { signupWithDetails, currentUser } = usePlan();
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
  }, [initialEmail, isOpen]);
  
  useEffect(() => {
    if (currentUser && isOpen) {
      router.push('/onboarding');
      onClose();
    }
  }, [currentUser, router, isOpen, onClose]);

  const checkUsernameAvailability = useCallback(async (name: string): Promise<boolean> => {
    if (!name.trim() || name.trim().length < 3) {
      setUsernameStatus('idle');
      setUsernameError('Must be 3+ chars.');
      return false;
    }
    setUsernameStatus('checking');
    setUsernameError('');
    try {
      const usernameDocRef = doc(db, "usernames", name.trim().toLowerCase());
      const docSnap = await getDoc(usernameDocRef);
      if (docSnap.exists()) {
        setUsernameStatus('taken');
        setUsernameError('Bummer, that name is taken!');
        return false;
      } else {
        setUsernameStatus('available');
        setUsernameError('');
        return true;
      }
    } catch (error) {
      console.error("Error checking username:", error);
      setUsernameStatus('idle');
      setUsernameError('Oops! Try again.');
      return false;
    }
  }, []);

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUsername = e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase(); // Allow alphanumeric and underscore
    setUsername(newUsername);
    setUsernameStatus('idle');
    setUsernameError('');
    if (usernameDebounceTimeout.current) {
      clearTimeout(usernameDebounceTimeout.current);
    }
    if (newUsername.trim().length >= 3) {
      usernameDebounceTimeout.current = setTimeout(() => {
        checkUsernameAvailability(newUsername);
      }, 600);
    } else if (newUsername.trim().length > 0 && newUsername.trim().length < 3) {
      setUsernameError('Needs 3+ characters.');
    }
  };
  
  const evaluatePasswordStrength = (pass: string) => {
    let strength = 0;
    if (pass.length >= 6) strength += 25;
    if (pass.length >= 8) strength += 25;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) strength += 25;
    if (/[0-9]/.test(pass)) strength += 15;
    if (/[^A-Za-z0-9]/.test(pass)) strength += 10;
    setPasswordStrength(Math.min(100, strength));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    evaluatePasswordStrength(newPassword);
  };

  const validateStep0 = async () => { // Email
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ variant: "destructive", title: "Hmm...", description: "That email doesn't look right." });
      return false;
    }
    setCurrentStep(1);
  };

  const validateStep1 = async () => { // Username
    if (usernameStatus === 'checking') {
        toast({variant: "default", title: "Hold on...", description: "Checking username availability."});
        return false;
    }
    const isAvailable = await checkUsernameAvailability(username);
    if (isAvailable) {
      setCurrentStep(2);
      return true;
    }
    return false; 
  };

  const validateStep2 = async () => { // Password
    if (password.length < 6) {
      toast({ variant: "destructive", title: "Weak Sauce!", description: "Password needs 6+ characters." });
      return false;
    }
    setCurrentStep(3);
  };

  const handleCompleteSignup = async () => {
    if (!email || !username || !password || !selectedAvatar) {
      toast({ variant: "destructive", title: "Oops!", description: "Please complete all fields to join." });
      return;
    }
    if (usernameStatus !== 'available') {
        toast({ variant: "destructive", title: "Username Issue", description: "Please choose an available username." });
        return;
    }
    setIsCompleting(true);
    const success = await signupWithDetails(email, password, username, selectedAvatar);
    setIsCompleting(false);
    if (success) {
      toast({
        title: "WELCOME TO GROZEN! 🎉",
        description: "You're in! Get ready to glow up.",
        duration: 5000,
      });
    } 
  };

  const stepsConfig = [
    { 
      title: "Your Email to Start", 
      content: (
        <div className="space-y-2">
          <Label htmlFor="signup-email" className="text-muted-foreground sr-only">Email Address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input id="signup-email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 h-11 neumorphic-inset text-sm" />
          </div>
        </div>
      ), 
      onNext: validateStep0 
    },
    { 
      title: "Create Your GroZen Name", 
      content: (
        <div className="space-y-2">
          <Label htmlFor="signup-username" className="text-muted-foreground sr-only">Username</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input id="signup-username" type="text" placeholder="YourUniqueName (letters, numbers, _)" value={username} onChange={handleUsernameChange} className="pl-10 h-11 neumorphic-inset text-sm" />
            {usernameStatus === 'checking' && <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-primary" />}
            {usernameStatus === 'available' && <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />}
            {usernameStatus === 'taken' && <X className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-red-500" />}
          </div>
          {usernameError && <p className="text-xs text-red-500 text-center pt-1 h-4">{usernameError}</p>}
          {usernameStatus === 'available' && <p className="text-xs text-green-500 text-center pt-1 h-4">Sweet, it's yours!</p>}
          {!usernameError && usernameStatus !== 'available' && usernameStatus !== 'checking' && <div className="h-4 pt-1"></div>}
        </div>
      ), 
      onNext: validateStep1, 
      onPrev: () => setCurrentStep(0) 
    },
    { 
      title: "Secure Your Account", 
      content: (
        <div className="space-y-2">
          <Label htmlFor="signup-password" className="text-muted-foreground sr-only">Password</Label>
          <div className="relative">
             <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
             <Input id="signup-password" type={showPassword ? "text" : "password"} placeholder="Make it strong!" value={password} onChange={handlePasswordChange} className="pl-10 pr-10 h-11 neumorphic-inset text-sm" />
             <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}>
               {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
             </Button>
          </div>
          {password.length > 0 && (
            <div className="flex items-center gap-2 pt-1">
              <Progress value={passwordStrength} className={cn("h-1.5 flex-1", passwordStrength < 50 ? "bg-red-500/50 [&>div]:bg-red-500" : passwordStrength < 75 ? "bg-yellow-500/50 [&>div]:bg-yellow-500" : "bg-green-500/50 [&>div]:bg-green-500" )} />
              <span className="text-xs text-muted-foreground w-14 text-right">{passwordStrength < 50 ? "Weak" : passwordStrength < 75 ? "Okay" : "Strong"}</span>
            </div>
          )}
           {password.length === 0 && <div className="h-[22px] pt-1"></div>} {/* Placeholder for height consistency */}
        </div>
      ), 
      onNext: validateStep2, 
      onPrev: () => setCurrentStep(1) 
    },
    { 
      title: "Choose Your Vibe", 
      content: (
        <div className="space-y-3">
          <p className="text-center text-muted-foreground text-xs">Pick an avatar that represents you.</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {AvatarOptions.map(avatar => (
              <button
                key={avatar.id}
                onClick={() => setSelectedAvatar(avatar.src)}
                className={cn(
                  "aspect-square rounded-lg overflow-hidden transition-all duration-200 transform hover:scale-105 neumorphic",
                  selectedAvatar === avatar.src ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-105 neumorphic-inset" : "neumorphic-sm"
                )}
                aria-label={`Select avatar ${avatar.alt}`}
              >
                <Image src={avatar.src} alt={avatar.alt} width={80} height={80} className="w-full h-full object-cover" data-ai-hint={avatar.hint}/>
              </button>
            ))}
          </div>
        </div>
      ), 
      onComplete: handleCompleteSignup, 
      onPrev: () => setCurrentStep(2) 
    },
  ];
  
  const resetModal = useCallback(() => {
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
  }, [initialEmail, onClose]);

  useEffect(() => {
    if (isOpen) {
      setEmail(initialEmail);
       // Reset other fields if modal reopens, to ensure clean state for signup
      if (currentStep !== 0 || username || password) {
        setUsername('');
        setPassword('');
        setSelectedAvatar(AvatarOptions[0].src);
        setUsernameStatus('idle');
        setUsernameError('');
        setPasswordStrength(0);
        setCurrentStep(0); // Reset to first step if re-opened with new email potentially
      }
    }
  }, [initialEmail, isOpen]); // Only react to initialEmail and isOpen status

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && resetModal()}>
      <DialogContent className="neumorphic max-w-sm mx-auto p-5 sm:p-6">
        <DialogHeader className="mb-2 sm:mb-3">
          <div className="mx-auto mb-2">
            <Logo size="text-lg" />
          </div>
          <DialogTitle className="text-xl sm:text-2xl font-bold text-center">Join GroZen - Quick & Free!</DialogTitle>
        </DialogHeader>
        <SignupStep
          title={stepsConfig[currentStep].title}
          currentStep={currentStep}
          totalSteps={stepsConfig.length}
          onNext={stepsConfig[currentStep].onNext}
          onPrev={stepsConfig[currentStep].onPrev}
          onComplete={stepsConfig[currentStep].onComplete}
          isCompleting={isCompleting}
        >
          {stepsConfig[currentStep].content}
        </SignupStep>
      </DialogContent>
    </Dialog>
  );
};


// --- Main Landing Page Component ---
const AddictionLandingPage: React.FC = () => {
  const { currentUser, isLoadingAuth, isOnboardedState } = usePlan(); // Removed signupWithDetails as it's now in PlanProvider
  const router = useRouter();
  const { toast } = useToast();
  
  const [isClient, setIsClient] = useState(false);
  const [showExitIntent, setShowExitIntent] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [initialModalEmail, setInitialModalEmail] = useState('');
  
  const benefitsRef = useRef<HTMLDivElement>(null);
  const testimonialRef = useRef<HTMLDivElement>(null);
  const finalCtaRef = useRef<HTMLDivElement>(null);
  const [scrolledAchievements, setScrolledAchievements] = useState<string[]>([]);


  useEffect(() => {
    setIsClient(true);
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 10 && !localStorage.getItem('grozen_exit_intent_shown_minimal_v2')) { // Increased sensitivity, new storage key
        setShowExitIntent(true);
        localStorage.setItem('grozen_exit_intent_shown_minimal_v2', 'true'); 
      }
    };
    document.documentElement.addEventListener('mouseleave', handleMouseLeave);
    return () => document.documentElement.removeEventListener('mouseleave', handleMouseLeave);
  }, []);

  useEffect(() => {
    if (isClient && !isLoadingAuth) {
      if (currentUser && isOnboardedState) {
        router.push('/dashboard');
      } else if (currentUser && !isOnboardedState) {
        router.push('/onboarding');
      }
    }
  }, [isClient, currentUser, isLoadingAuth, isOnboardedState, router]);

  useEffect(() => {
    if (!isClient) return;

    // Ensure IDs are set on the DOM elements for the observer to use
    if (benefitsRef.current) benefitsRef.current.id = "benefits-section";
    if (testimonialRef.current) testimonialRef.current.id = "testimonial-section";
    if (finalCtaRef.current) finalCtaRef.current.id = "final-cta-section";

    const elements = [benefitsRef.current, testimonialRef.current, finalCtaRef.current].filter(Boolean) as HTMLElement[];

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const targetElement = entry.target as HTMLElement;
            targetElement.classList.remove('opacity-0');
            targetElement.classList.add('animate-fade-in-up');

            const achievementId = targetElement.id;
            
            setScrolledAchievements(prevAchievements => {
              if (achievementId && !prevAchievements.includes(achievementId)) {
                let achievementText = "";
                if (achievementId === "benefits-section") achievementText = "Benefits Unlocked!";
                else if (achievementId === "testimonial-section") achievementText = "Social Proof Badge!";
                else if (achievementId === "final-cta-section") achievementText = "Final Stretch!";
                
                if (achievementText) {
                  toast({ title: "✨ Achievement!", description: achievementText, duration: 2000 });
                }
                return [...prevAchievements, achievementId];
              }
              return prevAchievements;
            });
            observer.unobserve(targetElement);
          }
        });
      },
      { threshold: 0.1 } // Trigger when 10% of the element is visible
    );

    elements.forEach(el => observer.observe(el));

    return () => {
      elements.forEach(el => { // Ensure unobserve is called on all potentially observed elements
        if (el) observer.unobserve(el);
      });
      observer.disconnect(); // Fully disconnect observer on cleanup
    };
  }, [isClient, toast]); // `toast` is stable. `setScrolledAchievements` is stable via functional update. Refs are stable.


  const handleEarlyEmailSubmit = async (email: string) => {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ variant: "destructive", title: "Hold Up!", description: "Please enter a valid email address." });
      return;
    }
    
    try {
      await addDoc(collection(db, "earlyAccessSignups"), {
        email: email.trim(),
        source: showExitIntent ? 'exit_intent_minimal' : 'hero_minimal',
        createdAt: serverTimestamp()
      });
      toast({
        title: "Awesome! ✨",
        description: "Your free AI mini-plan is on its way!",
        duration: 4000
      });
      if (showExitIntent) setShowExitIntent(false);
      setInitialModalEmail(email.trim());
      setIsSignupModalOpen(true);
    } catch (error) {
      console.error("Error saving early access email:", error);
      toast({ variant: "destructive", title: "Oh No!", description: "Could not save your email. Please try again." });
    }
  };
  
  const openSignupModalWithEmail = (email?: string) => {
    setInitialModalEmail(email || '');
    setIsSignupModalOpen(true);
  };

  if (!isClient || (isLoadingAuth && !currentUser) ) { 
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 text-center">
        <Logo size="text-3xl" />
        <Loader2 className="mt-6 h-8 w-8 animate-spin text-primary" />
        <p className="mt-3 text-sm text-muted-foreground">Igniting GroZen...</p>
      </div>
    );
  }
  
  return (
    <>
      <main className="min-h-screen bg-background text-foreground overflow-x-hidden">
        <HeroSection onCtaClick={openSignupModalWithEmail} onEmailSubmit={handleEarlyEmailSubmit}/>
        <CoreBenefitsSection ref={benefitsRef} />
        <TestimonialSection ref={testimonialRef} />
        <FinalCtaSection ref={finalCtaRef} onCtaClick={() => openSignupModalWithEmail()} />
      </main>

      <MinimalExitIntentPopup 
        isOpen={showExitIntent}
        onClose={() => setShowExitIntent(false)}
        onEmailSubmit={handleEarlyEmailSubmit}
      />
      
      <MinimalSignupModal 
        isOpen={isSignupModalOpen}
        onClose={() => setIsSignupModalOpen(false)}
        initialEmail={initialModalEmail}
      />
    </>
  );
};

export default AddictionLandingPage;

    
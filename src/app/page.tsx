
"use client";

import React, { useEffect, useState, useRef, useCallback, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { usePlan } from '@/contexts/plan-context';
import Logo from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress as ShadProgress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2, Zap, Sparkles, ArrowRight, CheckCircle, Gift, X, Mail, User, Lock, Image as ImageIcon, Eye, EyeOff, ThumbsUp, BadgeCheck, Atom, Brain, Palette, RadioTower, MessageCircle, Award, Check, AlertTriangle, UploadCloud, BarChart3, Smile, Target, ShoppingCart, Users, PaletteIcon, Rocket, BrainIcon } from 'lucide-react';
import Image from 'next/image';
import anime from 'animejs';
import { cn } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";
import { addDoc, collection, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { validateHumanFace, type ValidateHumanFaceOutput } from '@/ai/flows/validate-human-face';


<<<<<<< HEAD
// --- Helper Components ---
const MinimalExitIntentPopup: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onEmailSubmit: (email: string) => Promise<void>;
}> = ({ isOpen, onClose, onEmailSubmit }) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const dialogContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && dialogContentRef.current) {
      anime.set(dialogContentRef.current, { opacity: 0, scale: 0.9, translateY: -10 });
      anime({
        targets: dialogContentRef.current,
        opacity: 1,
        scale: 1,
        translateY: 0,
        duration: 300,
        easing: 'easeOutQuad',
=======
// --- Section Components (Lazy Loaded) ---

const HeroSection = () => {
  const router = useRouter();
  const { currentUser, isLoadingAuth } = usePlan();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  useEffect(() => {
    if (isClient && !isLoadingAuth && currentUser) {
      router.replace('/dashboard'); // Or onboarding if not completed
    }
  }, [isClient, currentUser, isLoadingAuth, router]);


  if (isLoadingAuth && !isClient) { // Show loader only if auth is loading and client hasn't mounted yet
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
        <Logo size="text-3xl sm:text-4xl" />
        <Loader2 className="mt-6 h-8 w-8 animate-spin text-light-gray" />
      </div>
    );
  }
  
  // Simulated live user count
  const [liveUsers, setLiveUsers] = useState(1337);
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveUsers(prev => prev + Math.floor(Math.random() * 3) + 1);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const parallaxOffsetFast = useParallax(0.1);
  const parallaxOffsetSlow = useParallax(0.03);


  return (
    <section id="hero" className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-black p-4 sm:p-6 text-center edge-to-edge">
      {/* Parallax Background Layers */}
      <div
        className="absolute inset-0 z-0 opacity-20"
        style={{ transform: `translateY(${parallaxOffsetFast}px)` }}
        aria-hidden="true"
      >
        <Image
          src="https://placehold.co/1920x1080/000000/111111.png?text=." // Very subtle texture
          alt="Abstract background texture"
          fill
          quality={50}
          priority
          className="object-cover"
          data-ai-hint="dark texture subtle"
        />
      </div>
       <div
        className="absolute inset-0 z-0 opacity-10"
        style={{ transform: `translateY(${parallaxOffsetSlow}px) rotate(15deg) scale(1.5)` }}
        aria-hidden="true"
      >
        <Image
          src="https://placehold.co/1920x1080/0D0D0D/1A1A1A.png?text=." // Another subtle texture
          alt="Abstract background pattern"
          fill
          quality={50}
          priority
          className="object-cover"
          data-ai-hint="abstract pattern dark"
        />
      </div>

      <div className="relative z-10 flex flex-col items-center">
        <AnimatedCard className="p-6 sm:p-8 md:p-10 bg-card/80 backdrop-blur-md rounded-xl shadow-2xl max-w-md sm:max-w-lg md:max-w-xl neumorphic-accent-border">
          <div className="mb-4 sm:mb-6">
            <Logo size="text-3xl sm:text-4xl" />
          </div>

          <AnimatedText tag="h1" className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 text-transparent bg-clip-text bg-gradient-to-r from-accent via-foreground to-accent" stagger={50}>
            Unlock Your GroZen Mode.
          </AnimatedText>

          <AnimatedText tag="p" className="text-base sm:text-lg text-muted-foreground mb-6 sm:mb-8" stagger={30}>
            AI-powered plans. Epic challenges. Real results. Level up your vibe, no cap.
          </AnimatedText>

          <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-6 sm:mb-8 text-sm sm:text-base">
            <div className="flex items-center space-x-2 text-foreground"><Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-accent"/><span>Custom AI Plans</span></div>
            <div className="flex items-center space-x-2 text-foreground"><Crown className="h-4 w-4 sm:h-5 sm:w-5 text-accent"/><span>Dopamine Challenges</span></div>
            <div className="flex items-center space-x-2 text-foreground"><UserPlus className="h-4 w-4 sm:h-5 sm:w-5 text-accent"/><span>Instant Friend Connect</span></div>
            <div className="flex items-center space-x-2 text-foreground"><Gift className="h-4 w-4 sm:h-5 sm:w-5 text-accent"/><span>Daily Streaks & Rewards</span></div>
          </div>

          <div className="flex flex-col space-y-3 sm:space-y-4">
            <Button
              variant="primary"
              size="lg"
              className="w-full text-base sm:text-lg"
              onClick={() => router.push('/signup')}
            >
              <Zap className="mr-2 h-5 w-5" /> Get Started - It&apos;s Free!
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full text-base sm:text-lg"
              onClick={() => router.push('/login')}
            >
              I Already Have an Account
            </Button>
          </div>
          <div className="mt-6 text-xs text-muted-foreground">
            <Users className="inline h-3 w-3 mr-1" />
            Join <span className="font-bold text-foreground">{liveUsers.toLocaleString()}</span> GroZen Masters!
          </div>
        </AnimatedCard>
      </div>
    </section>
  );
};

const FeatureHighlightSection = () => {
  const features = [
    { icon: Zap, title: "AI That Gets YOU", description: "Personalized plans adapt as you grow. No more boring routines.", hint:"ai brain" },
    { icon: Crown, title: "Crush Challenges, Earn Loot", description: "Gamified goals that are actually fun. Unlock badges & bragging rights.", hint:"trophy gold" },
    { icon: Star, title: "Streak It Up!", description: "Daily check-ins keep you hooked. Build habits, get rewards.", hint:"flame streak" },
    { icon: Users, title: "Squad Up!", description: "Connect with friends, climb leaderboards. Who's the GroZen GOAT?", hint:"team friends" }
  ];

  return (
    <section id="features" className="relative w-full bg-black py-16 sm:py-24 px-4 edge-to-edge overflow-hidden">
      {/* Angled background element */}
      <div className="absolute top-0 left-0 w-full h-full opacity-5 transform -skew-y-3 bg-gradient-to-br from-card to-black" aria-hidden="true"></div>
      
      <div className="relative container mx-auto max-w-5xl text-center">
        <AnimatedText tag="h2" className="text-3xl sm:text-4xl font-bold mb-2 text-foreground" stagger={40}>
          GroZen Isn&apos;t Just an App.
        </AnimatedText>
        <AnimatedText tag="p" className="text-xl sm:text-2xl text-accent mb-12 sm:mb-16" stagger={30}>
          It&apos;s Your New Secret Weapon.
        </AnimatedText>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10">
          {features.map((feature, index) => (
            <AnimatedCard key={feature.title} delay={`${index * 0.15}s`} className="bg-card p-6 rounded-lg shadow-xl neumorphic-accent-border hover:transform hover:scale-105 transition-transform duration-300">
              <div className="flex justify-center mb-4">
                <feature.icon className="h-10 w-10 sm:h-12 sm:w-12 text-accent" />
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold mb-2 text-foreground">{feature.title}</h3>
              <p className="text-muted-foreground text-sm sm:text-base">{feature.description}</p>
            </AnimatedCard>
          ))}
        </div>
      </div>
    </section>
  );
};

const GamifiedSignupSection = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameLoading, setUsernameLoading] = useState(false);

  const passwordStrength = () => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength; // Max 5
  };

  const avatars = [
    "https://placehold.co/100x100/D3D3D3/000000.png?text=🚀",
    "https://placehold.co/100x100/D3D3D3/000000.png?text=🔥",
    "https://placehold.co/100x100/D3D3D3/000000.png?text=✨",
    "https://placehold.co/100x100/D3D3D3/000000.png?text=🎮",
    "https://placehold.co/100x100/D3D3D3/000000.png?text=💡",
    "https://placehold.co/100x100/D3D3D3/000000.png?text=🤖",
  ];
  const avatarHints = ["rocket", "fire", "sparkles", "controller", "idea", "robot"];


  const handleNextStep = async () => {
    setIsLoading(true);
    // Simulate API calls / validation
    await new Promise(resolve => setTimeout(resolve, 500));

    if (step === 1 && !email.includes('@')) {
      toast({ title: "Hold Up!", description: "Enter a valid email, fam.", variant: "destructive" });
      setIsLoading(false);
      return;
    }
    if (step === 2) {
      if (!username || username.length < 3) {
        toast({ title: "Username Glitch!", description: "Needs to be at least 3 chars.", variant: "destructive" });
        setIsLoading(false);
        return;
      }
      // Simulate username check
      setUsernameLoading(true);
      await new Promise(resolve => setTimeout(resolve, 700));
      const isTaken = Math.random() > 0.5; // Simulate taken/available
      setUsernameAvailable(!isTaken);
      setUsernameLoading(false);
      if (isTaken) {
         toast({ title: "Oof, Name Taken!", description: `"${username}" is already snagged. Try another?`, variant: "destructive" });
         setIsLoading(false);
         return;
      }
       toast({ title: "Sweet Name!", description: `"${username}" is yours!`, variant: "default" });
    }
    if (step === 3 && passwordStrength() < 3) {
      toast({ title: "Weak Sauce Password!", description: "Make it stronger to protect your loot!", variant: "destructive" });
      setIsLoading(false);
      return;
    }
    setIsLoading(false);
    if (step < 4) {
      setStep(prev => prev + 1);
      if(step + 1 === 2) { // Just got email
        toast({ title: "🎁 Reward Unlocked!", description: "Early Access Badge added to your profile!", variant: "default" });
      }
    } else {
      // Final step - redirect to actual signup
      toast({ title: "Let's Gooo!", description: "Redirecting to full signup...", variant: "default" });
      router.push(`/signup?email=${encodeURIComponent(email)}&username=${encodeURIComponent(username)}`);
    }
  };
  
  const PasswordStrengthIndicator = ({ strength }: { strength: number }) => (
    <div className="flex space-x-1 mt-1">
      {Array(5).fill(0).map((_, i) => (
        <div key={i} className={cn("h-1.5 rounded-full flex-1", i < strength ? (strength <=2 ? 'bg-red-500' : strength <=4 ? 'bg-yellow-400' : 'bg-green-400') : 'bg-muted/30')} />
      ))}
    </div>
  );

  const renderStepContent = () => {
    switch (step) {
      case 1: // Email
        return (
          <>
            <Label htmlFor="email-signup" className="text-accent text-sm">Your Email (Unlock First Reward!)</Label>
            <Input
              id="email-signup"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@domain.com"
              className="bg-card/50 border-accent/30 text-foreground placeholder-muted-foreground focus:border-accent"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">Enter your email to claim an "Early Bird" badge!</p>
          </>
        );
      case 2: // Username
        return (
          <>
            <Label htmlFor="username-signup" className="text-accent text-sm">Create Your Legend Name</Label>
            <div className="relative">
              <Input
                id="username-signup"
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setUsernameAvailable(null); }}
                placeholder="e.g., GroZenNinja_77"
                className="bg-card/50 border-accent/30 text-foreground placeholder-muted-foreground focus:border-accent"
                required
              />
              {usernameLoading && <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-accent"/>}
              {!usernameLoading && usernameAvailable === true && <CheckCircle className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-green-400"/>}
              {!usernameLoading && usernameAvailable === false && username.length > 0 && <XCircle className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-red-400"/>}
            </div>
             {usernameAvailable === false && <p className="text-xs text-red-400 mt-1">Bummer, that's taken. Try another!</p>}
             {usernameAvailable === true && <p className="text-xs text-green-400 mt-1">Nice! It's available.</p>}
          </>
        );
      case 3: // Password
        return (
          <>
            <Label htmlFor="password-signup" className="text-accent text-sm">Secure Your Account (Fort Knox Style!)</Label>
            <div className="relative">
              <Input
                id="password-signup"
                type={passwordVisible ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Make it super strong!"
                className="bg-card/50 border-accent/30 text-foreground placeholder-muted-foreground focus:border-accent pr-10"
                required
              />
              <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-accent" onClick={() => setPasswordVisible(!passwordVisible)}>
                {passwordVisible ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
              </Button>
            </div>
            <PasswordStrengthIndicator strength={passwordStrength()} />
            {passwordStrength() > 0 && passwordStrength() <=2 && <p className="text-xs text-red-400 mt-1">Hmm, needs more power!</p>}
            {passwordStrength() > 2 && passwordStrength() <=4 && <p className="text-xs text-yellow-400 mt-1">Getting there! Stronger is better.</p>}
            {passwordStrength() === 5 && <p className="text-xs text-green-400 mt-1">Awesome! That's a vault-level password!</p>}
          </>
        );
      case 4: // Avatar
        return (
          <>
            <p className="text-accent text-sm mb-2 text-center">Choose Your Vibe!</p>
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              {avatars.map((src, index) => (
                <button
                  key={src}
                  type="button"
                  className={cn(
                    "relative aspect-square rounded-full overflow-hidden border-2 transition-all duration-200 hover:scale-110",
                    avatar === src ? "border-accent ring-2 ring-accent ring-offset-2 ring-offset-card" : "border-muted-foreground/50"
                  )}
                  onClick={() => setAvatar(src)}
                >
                  <Image src={src} alt={`Avatar option ${index + 1}`} fill className="object-cover" data-ai-hint={avatarHints[index]} quality={75} />
                </button>
              ))}
            </div>
             {avatar && <p className="text-xs text-green-400 mt-2 text-center">Cool choice!</p>}
          </>
        );
      default:
        return null;
    }
  };

  return (
    <section id="gamified-signup" className="relative w-full bg-gradient-to-b from-black via-card to-black py-16 sm:py-24 px-4 edge-to-edge overflow-hidden">
       <Sparkles className="absolute top-1/4 left-1/4 h-8 w-8 text-accent/20 animate-pulse transform-gpu -translate-x-1/2 -translate-y-1/2" style={{ animationDuration: '4s'}} />
       <Zap className="absolute bottom-1/4 right-1/4 h-10 w-10 text-accent/10 animate-ping transform-gpu" style={{ animationDuration: '5s'}} />
       <Crown className="absolute top-1/3 right-1/5 h-6 w-6 text-accent/15 animate-bounce transform-gpu" style={{ animationDuration: '6s'}}/>

      <div className="relative container mx-auto max-w-md text-center">
        <AnimatedText tag="h2" className="text-3xl sm:text-4xl font-bold mb-4 text-foreground" stagger={40}>
          Ready to Join the Elite?
        </AnimatedText>
        <AnimatedText tag="p" className="text-lg text-accent mb-8 sm:mb-10" stagger={30}>
          Quick signup. Instant perks. Zero hassle.
        </AnimatedText>

        <AnimatedCard className="bg-card/90 backdrop-blur-sm p-6 sm:p-8 rounded-xl shadow-2xl neumorphic-accent-border">
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">Step {step} of 4:
              <span className="text-foreground font-semibold ml-1">
                {step === 1 && "Secure Your Email"}
                {step === 2 && "Claim Your Username"}
                {step === 3 && "Fortify Your Password"}
                {step === 4 && "Pick Your Avatar"}
              </span>
            </p>
            <div className="w-full bg-muted-foreground/30 rounded-full h-1.5 sm:h-2 mt-1.5">
              <div
                className="bg-accent h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </div>
          </div>

          <div className="space-y-4 text-left">
            {renderStepContent()}
          </div>

          <Button
            variant="primary"
            size="lg"
            className="w-full mt-6 sm:mt-8 text-base"
            onClick={handleNextStep}
            disabled={isLoading || (step ===2 && usernameLoading)}
          >
            {isLoading || usernameLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ArrowRight className="mr-2 h-5 w-5" />}
            {step < 4 ? (isLoading ? "Verifying..." : "Next Step") : (isLoading ? "Finalizing..." : "Complete Signup & Enter!")}
          </Button>
        </AnimatedCard>
      </div>
    </section>
  );
};

const SocialProofSection = () => {
  const testimonials = [
    { quote: "GroZen literally changed my life. My energy is through the roof!", name: "Kai T.", imageHint: "teenager gaming", avatarText: "🎮" },
    { quote: "Finally, a wellness app that doesn't suck. The challenges are fire!", name: "Mia S.", imageHint: "teenager music", avatarText: "🔥"  },
    { quote: "I actually look forward to my workouts now. Plus, the AI meal plans? Chef's kiss.", name: "Leo R.", imageHint: "teenager sports", avatarText: "💪"  }
  ];
  
  const [challengesCompleted, setChallengesCompleted] = useState(10283);
  const [activeStreaks, setActiveStreaks] = useState(5672);

  useEffect(() => {
    const interval1 = setInterval(() => setChallengesCompleted(p => p + Math.floor(Math.random() * 10) + 5), 3000);
    const interval2 = setInterval(() => setActiveStreaks(p => p + Math.floor(Math.random() * 5) + 2), 4500);
    return () => { clearInterval(interval1); clearInterval(interval2); };
  }, []);

  return (
    <section id="social-proof" className="relative w-full bg-black py-16 sm:py-24 px-4 edge-to-edge overflow-hidden">
      <div className="absolute -top-16 left-0 w-full h-32 bg-card transform skew-y-[-2deg] z-0" aria-hidden="true"></div>
      
      <div className="relative container mx-auto max-w-5xl text-center z-10">
        <AnimatedText tag="h2" className="text-3xl sm:text-4xl font-bold mb-10 text-foreground" stagger={40}>
          Don&apos;t Just Take Our Word For It.
        </AnimatedText>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {testimonials.map((testimonial, index) => (
            <AnimatedCard key={index} delay={`${index * 0.2}s`} className="bg-card p-6 rounded-lg shadow-xl neumorphic-accent-border">
              <div className="flex items-center mb-3">
                <div className="relative w-12 h-12 rounded-full overflow-hidden mr-3 border-2 border-accent">
                  <Image src={`https://placehold.co/80x80/D3D3D3/000000.png?text=${testimonial.avatarText}`} alt={testimonial.name} fill data-ai-hint={testimonial.imageHint} className="object-cover" />
                </div>
                <span className="font-semibold text-foreground">{testimonial.name}</span>
              </div>
              <p className="text-muted-foreground italic text-sm">&quot;{testimonial.quote}&quot;</p>
            </AnimatedCard>
          ))}
        </div>

        <AnimatedCard delay="0.5s" className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <div className="bg-card/50 p-4 rounded-lg neumorphic-accent-border-sm">
                <p className="text-3xl font-bold text-accent">{challengesCompleted.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Challenges Conquered</p>
            </div>
            <div className="bg-card/50 p-4 rounded-lg neumorphic-accent-border-sm">
                <p className="text-3xl font-bold text-accent">{activeStreaks.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Active Daily Streaks</p>
            </div>
        </AnimatedCard>
         <AnimatedText tag="p" className="text-muted-foreground mt-8 text-sm" stagger={20}>
            As seen on <span className="text-accent font-semibold">NerdOutLoud</span> &amp; <span className="text-accent font-semibold">ViralVibeZ</span> (Teen Influencer Endorsements - Placeholder)
        </AnimatedText>
      </div>
    </section>
  );
};

const FinalCTASection = () => {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState({ minutes: 29, seconds: 59 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { minutes: prev.minutes - 1, seconds: 59 };
        return { minutes: 0, seconds: 0 }; 
>>>>>>> fd980d6 (I see this error with the app, reported by NextJS, please fix it. The error is reported as HTML but presented visually to the user).)
      });
    }
  }, [isOpen]);

<<<<<<< HEAD
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ variant: "destructive", title: "Hold Up!", description: "Please enter a valid email address." });
      return;
    }
    setIsSubmitting(true);
    try {
      await onEmailSubmit(email);
      setEmail('');
    } catch (error) {
      // Error toast handled by parent
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent ref={dialogContentRef} className="neumorphic max-w-xs mx-auto p-5 sm:p-6">
        <DialogHeader className="text-center">
          <Gift className="h-8 w-8 text-primary mx-auto mb-2 animate-bounce" />
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
            className="h-10 text-sm neumorphic-inset focus:animate-input-pulse"
            required
            disabled={isSubmitting}
          />
          <Button
            type="submit"
            className="w-full neumorphic-button-primary text-sm py-2.5 h-10 active:animate-button-press"
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

// --- Minimal Signup Modal ---
const SignupStep: React.FC<{ title: string; children: React.ReactNode; onNext?: () => Promise<boolean | void>; onPrev?: () => void; onComplete?: () => Promise<void>; currentStep: number; totalSteps: number; isCompleting?: boolean; nextText?: string; prevText?: string; completeText?: string; nextDisabled?: boolean; }> = ({ title, children, onNext, onPrev, onComplete, currentStep, totalSteps, isCompleting, nextText = "Next", prevText = "Back", completeText = "Glow Up!", nextDisabled = false }) => {
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
          <Button variant="outline" onClick={onPrev} className="neumorphic-button flex-1 h-10 sm:h-11 text-sm active:animate-button-press">
            {prevText}
          </Button>
        )}
        {currentStep === 0 && !onPrev && <div className="sm:flex-1 hidden sm:block"></div>} {/* Spacer for first step */}
        {onNext && currentStep < totalSteps - 1 && (
          <Button onClick={handleNext} className="neumorphic-button-primary flex-1 h-10 sm:h-11 text-sm active:animate-button-press" disabled={isLoadingNext || nextDisabled}>
            {isLoadingNext ? <Loader2 className="h-4 w-4 animate-spin" /> : nextText}
            {!isLoadingNext && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
        )}
        {onComplete && currentStep === totalSteps - 1 && (
          <Button onClick={handleComplete} className="neumorphic-button-primary flex-1 h-10 sm:h-11 text-sm active:animate-button-press" disabled={isCompleting}>
            {isCompleting ? <Loader2 className="h-4 w-4 animate-spin" /> : completeText}
            {!isCompleting && <Sparkles className="ml-2 h-4 w-4 animate-ping" />}
          </Button>
        )}
      </div>
      <ShadProgress value={((currentStep + 1) / totalSteps) * 100} className="h-1.5 mt-3 sm:mt-4 bg-gradient-to-r from-accent to-primary transition-all duration-300" />
=======
  return (
    <section id="final-cta" className="relative w-full bg-gradient-to-t from-black via-card to-black py-20 sm:py-32 px-4 edge-to-edge text-center">
      <div className="absolute inset-0 z-0 opacity-5">
         <Image 
          src="https://placehold.co/1920x1080/0A0A0A/1A1A1A.png?text=." 
          alt="Abstract dark texture"
          data-ai-hint="dark texture abstract" 
          fill={true}
          className="object-cover"
        />
      </div>
      <div className="relative z-10 container mx-auto max-w-2xl">
        <AnimatedText tag="h2" className="text-4xl sm:text-5xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-accent via-foreground to-accent" stagger={50}>
          Your Level-Up Awaits.
        </AnimatedText>
        <AnimatedText tag="p" className="text-lg sm:text-xl text-muted-foreground mb-8" stagger={30}>
          Stop scrolling, start evolving. The ultimate AI wellness sidekick is one click away.
        </AnimatedText>

        <AnimatedCard delay="0.3s" className="mb-8">
          <div className="bg-accent/10 border border-accent/30 p-3 rounded-lg inline-block">
             <p className="text-sm text-accent">🔥 Limited Time: <span className="font-bold text-foreground">Founders Pack</span> Unlocks Bonus Gear!</p>
             <p className="text-2xl font-bold text-foreground my-1">{formatTime(timeLeft.minutes)}:{formatTime(timeLeft.seconds)}</p>
             <p className="text-xs text-muted-foreground">Left to Claim</p>
          </div>
        </AnimatedCard>

        <AnimatedCard delay="0.5s" className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <Button
            variant="primary"
            size="xl"
            className="w-full sm:w-auto text-lg sm:text-xl px-8 py-4"
            onClick={() => router.push('/signup')}
          >
            <Zap className="mr-2 h-6 w-6" /> Claim Your Spot NOW
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full sm:w-auto text-md"
            onClick={() => { alert("Demo/Learn More clicked!"); }}
          >
            <PlayCircle className="mr-2 h-5 w-5" /> See How It Works
          </Button>
        </AnimatedCard>
        
        <AnimatedCard delay="0.7s" className="mt-10 flex justify-center items-center space-x-4">
            <ShieldCheck className="h-5 w-5 text-green-400"/>
            <p className="text-sm text-muted-foreground">SSL Secured | 30-Day Risk-Free Trial | Privacy First</p>
        </AnimatedCard>
      </div>
    </section>
  );
};

const ExitIntentPopup = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-out opacity-100">
      <AnimatedCard className="bg-card p-6 sm:p-8 rounded-xl shadow-2xl max-w-md w-full neumorphic-accent-border text-center">
        <button onClick={onClose} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors">
          <XCircle className="h-6 w-6"/>
        </button>
        <Sparkles className="h-12 w-12 text-accent mx-auto mb-4"/>
        <h3 className="text-2xl font-bold text-foreground mb-3">Wait! Don&apos;t Go Empty-Handed!</h3>
        <p className="text-muted-foreground mb-5">Grab an <span className="text-accent font-semibold">Exclusive Starter Pack</span> (extra AI credits + rare avatar) just for considering GroZen!</p>
        <Input type="email" placeholder="Your Email for the Goodies..." className="mb-3 bg-black/30 border-accent/30 text-foreground placeholder-muted-foreground focus:border-accent"/>
        <Button variant="primary" size="lg" className="w-full" onClick={() => { alert('Bonus claimed (simulated)!'); onClose(); }}>
          <Gift className="mr-2"/> Gimme The Bonus!
        </Button>
        <p className="text-xs text-muted-foreground mt-3">No spam, just pure awesome. Promise.</p>
      </AnimatedCard>
>>>>>>> fd980d6 (I see this error with the app, reported by NextJS, please fix it. The error is reported as HTML but presented visually to the user).)
    </div>
  );
};


const MinimalSignupModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: string;
}> = ({ isOpen, onClose, initialEmail = '' }) => {
  const { signupWithDetails, currentUser } = usePlan();
  const router = useRouter();
<<<<<<< HEAD
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState(initialEmail);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [uploadedImageFile, setUploadedImageFile] = useState<File | null>(null);
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);
  const [selectedAvatar, setSelectedAvatar] = useState<string | undefined>(undefined);
  const [photoValidationStatus, setPhotoValidationStatus] = useState<'idle' | 'uploading' | 'validating' | 'validated' | 'error'>('idle');
  const [photoValidationError, setPhotoValidationError] = useState<string>('');

  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [usernameError, setUsernameError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordMessage, setPasswordMessage] = useState('');
  const usernameDebounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dialogContentRef = useRef<HTMLDivElement>(null);

  const resetAvatarState = useCallback(() => {
    setUploadedImageFile(null);
    setUploadedImagePreview(null);
    setSelectedAvatar(undefined);
    setPhotoValidationStatus('idle');
    setPhotoValidationError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);
  
  useEffect(() => {
    if (isOpen && dialogContentRef.current) {
      anime.set(dialogContentRef.current, { opacity: 0, scale: 0.9, translateY: -20 });
      anime({
        targets: dialogContentRef.current,
        opacity: 1,
        scale: 1,
        translateY: 0,
        duration: 300, 
        easing: 'easeOutQuad', 
      });
    }
  }, [isOpen]);


  useEffect(() => {
    if (isOpen) {
      setEmail(initialEmail || '');
      setUsername('');
      setPassword('');
      resetAvatarState();
      setCurrentStep(0);
      setUsernameStatus('idle');
      setUsernameError('');
      setPasswordStrength(0);
      setPasswordMessage('');
      setShowPassword(false);
    }
  }, [isOpen, initialEmail, resetAvatarState]);

  useEffect(() => {
    if (currentUser && isOpen) {
      router.push('/onboarding');
      onClose();
    }
  }, [currentUser, router, isOpen, onClose]);


  const checkUsernameAvailability = useCallback(async (name: string): Promise<boolean> => {
    if (!name.trim() || name.trim().length < 3) {
      setUsernameStatus('idle');
      setUsernameError('Must be 3+ cool characters.');
      return false;
    }
    setUsernameStatus('checking');
    setUsernameError('');
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const usernameDocRef = doc(db, "usernames", name.trim().toLowerCase());
      const docSnap = await getDoc(usernameDocRef);
      if (docSnap.exists()) {
        setUsernameStatus('taken');
        setUsernameError('Bummer, that name is snatched!');
        return false;
      } else {
        setUsernameStatus('available');
        setUsernameError('');
        return true;
      }
    } catch (error) {
      console.error("Error checking username:", error);
      setUsernameStatus('idle');
      setUsernameError('Oops! Network glitch. Try again.');
      return false;
    }
  }, []);

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUsername = e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
    setUsername(newUsername);
    setUsernameStatus('idle');
    setUsernameError('');
    if (usernameDebounceTimeout.current) {
      clearTimeout(usernameDebounceTimeout.current);
=======
  const [isClient, setIsClient] = useState(false);
  const [showExitIntent, setShowExitIntent] = useState(false);
  const exitIntentTriggered = useRef(false);
  const [scrolledAchievements, setScrolledAchievements] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
    if (typeof document !== "undefined") {
        document.title = "GroZen: Level Up Your Life ⚡";
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
            metaDesc.setAttribute("content", "Stop scrolling, start Evolving! GroZen's AI crafts hyper-personalized wellness plans & addictive challenges. Unlock your peak. FOMO is real.");
        } else {
            const newMetaDesc = document.createElement('meta');
            newMetaDesc.name = "description";
            newMetaDesc.content = "Stop scrolling, start Evolving! GroZen's AI crafts hyper-personalized wellness plans & addictive challenges. Unlock your peak. FOMO is real.";
            document.head.appendChild(newMetaDesc);
        }
    }
  }, []);

  useEffect(() => {
    if (isClient && !isLoadingAuth) {
      if (currentUser) {
        if (isOnboardedState && isPlanAvailable) {
          router.replace('/dashboard');
        } else if(isOnboardedState && !isPlanAvailable && !isLoadingAuth){ 
            router.replace('/onboarding'); 
        }
         else {
          router.replace('/onboarding');
        }
      }
>>>>>>> fd980d6 (I see this error with the app, reported by NextJS, please fix it. The error is reported as HTML but presented visually to the user).)
    }
    if (newUsername.trim().length >= 3) {
      usernameDebounceTimeout.current = setTimeout(() => {
        checkUsernameAvailability(newUsername);
      }, 700);
    } else if (newUsername.trim().length > 0 && newUsername.trim().length < 3) {
      setUsernameError('Needs 3+ cool characters.');
    }
  };

  const evaluatePasswordStrength = (pass: string) => {
    let strength = 0;
    let msg = "";
    if (pass.length < 6) { msg = "Too short!"; strength = 10; }
    else if (pass.length < 8) { msg = "Getting there..."; strength = 40; }
    else { msg = "Nice!"; strength = 60; }

    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) { strength += 20; if (strength > 60) msg = "Solid!"; }
    if (/[0-9]/.test(pass)) { strength += 10; if (strength > 70) msg = "Strong!";}
    if (/[^A-Za-z0-9]/.test(pass)) { strength += 10; if (strength > 80) msg = "Super Strong! 💪";}

    setPasswordStrength(Math.min(100, strength));
    setPasswordMessage(msg);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    evaluatePasswordStrength(newPassword);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setPhotoValidationError("Max file size is 2MB. Please choose a smaller image.");
        setPhotoValidationStatus('error');
        setUploadedImageFile(null);
        setUploadedImagePreview(null);
        setSelectedAvatar(undefined);
        return;
      }
      setUploadedImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string' && reader.result.trim() !== "") {
            setUploadedImagePreview(reader.result as string);
            setPhotoValidationStatus('idle');
            setPhotoValidationError('');
            setSelectedAvatar(undefined);
        } else {
            setPhotoValidationError("Could not read the selected file. Please try another image.");
            setPhotoValidationStatus('error');
            setUploadedImageFile(null);
            setUploadedImagePreview(null);
            setSelectedAvatar(undefined);
        }
      };
      reader.onerror = () => {
        setPhotoValidationError("Error reading file. Please try another image.");
        setPhotoValidationStatus('error');
        setUploadedImageFile(null);
        setUploadedImagePreview(null);
        setSelectedAvatar(undefined);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleValidatePhoto = async () => {
    if (!uploadedImagePreview || typeof uploadedImagePreview !== 'string' || uploadedImagePreview.trim() === "") {
      setPhotoValidationError("Please select or upload a valid image first.");
      setPhotoValidationStatus('error');
      setSelectedAvatar(undefined);
      return;
    }
    setPhotoValidationStatus('validating');
    setPhotoValidationError('');
    try {
      const result: ValidateHumanFaceOutput = await validateHumanFace({ imageDataUri: uploadedImagePreview });
      if (result.isHumanFace) {
        setSelectedAvatar(uploadedImagePreview);
        setPhotoValidationStatus('validated');
        toast({ title: "Face Detected! 👍", description: "Looks good! You can proceed." });
      } else {
        setPhotoValidationStatus('error');
        setPhotoValidationError(result.reason || "This doesn't look like a human face. Please upload a clear photo of your face.");
        setSelectedAvatar(undefined);
      }
    } catch (error) {
      console.error("Error validating photo:", error);
      setPhotoValidationStatus('error');
      setPhotoValidationError("Validation failed. Please try again or use a different photo.");
      setSelectedAvatar(undefined);
    }
  };

  const validateStep0 = async () => {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ variant: "destructive", title: "Hmm...", description: "That email doesn't look quite right." });
      return false;
    }
    setCurrentStep(1);
    return true;
  };

  const validateStep1 = async () => {
    if (usernameStatus === 'checking') {
        toast({variant: "default", title: "Hold on...", description: "Checking if this awesome name is free..."});
        return false;
    }
    const isAvailable = await checkUsernameAvailability(username);
    if (isAvailable) {
      setCurrentStep(2);
      return true;
    }
    return false;
  };

  const validateStep2 = async () => {
    if (password.length < 6) {
      toast({ variant: "destructive", title: "Weak Sauce!", description: "Password needs to be at least 6 characters." });
      return false;
    }
    setCurrentStep(3);
    return true;
  };

  const validateStep3AndProceed = async () => {
    if (photoValidationStatus === 'validated' && selectedAvatar && typeof selectedAvatar === 'string' && selectedAvatar.trim() !== "") {
      setCurrentStep(4);
      return true;
    }
    toast({ variant: "destructive", title: "Photo Required", description: "Please upload, validate your face photo, and ensure it's correctly processed to continue." });
    return false;
  };


  const handleCompleteSignup = async () => {
    setIsCompleting(true);
    if (!selectedAvatar || typeof selectedAvatar !== 'string' || selectedAvatar.trim() === "") {
      toast({
        variant: "destructive",
        title: "Avatar Required",
        description: "A validated profile photo is essential. Please go back, upload your photo, ensure it's validated, and make sure it's correctly processed.",
      });
      setIsCompleting(false);
      return; 
    }
     if (!email || !username || !password ) {
      toast({ variant: "destructive", title: "Missing Info", description: "Email, username, or password missing." });
      setIsCompleting(false);
      return;
    }
    if (usernameStatus !== 'available') {
        toast({ variant: "destructive", title: "Username Issue", description: "Please pick an available username first." });
        setIsCompleting(false);
        return;
    }

    const success = await signupWithDetails(email, password, username, selectedAvatar);
    setIsCompleting(false);
    if (success) {
      toast({
        title: "WELCOME TO GROZEN! 🎉",
        description: "You're officially in! Get ready to unleash your awesome.",
        duration: 6000,
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
            <Input id="signup-email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 h-11 neumorphic-inset text-sm focus:animate-input-pulse" />
          </div>
        </div>
      ),
      onNext: validateStep0
    },
    { 
      title: "Create Your GroZen Username",
      content: (
        <div className="space-y-2">
          <Label htmlFor="signup-username" className="text-muted-foreground sr-only">Username</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="signup-username"
              type="text"
              placeholder="YourUniqueName (letters, numbers, _)"
              value={username}
              onChange={handleUsernameChange}
              className={cn(
                "pl-10 h-11 neumorphic-inset text-sm focus:animate-input-pulse",
                usernameStatus === 'available' && "border-green-500 animate-pulse-green",
                usernameStatus === 'taken' && "border-red-500 animate-pulse-red"
              )}
            />
            {usernameStatus === 'checking' && <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 animate-spin text-primary" />}
            {usernameStatus === 'available' && <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" />}
            {usernameStatus === 'taken' && <AlertTriangle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-red-500" />}
          </div>
          {usernameError && <p className="text-xs text-red-500 text-center pt-1 h-4">{usernameError}</p>}
          {usernameStatus === 'available' && <p className="text-xs text-green-500 text-center pt-1 h-4">Sweet, it's yours! ✨</p>}
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
             <Input id="signup-password" type={showPassword ? "text" : "password"} placeholder="Make it strong!" value={password} onChange={handlePasswordChange} className="pl-10 pr-10 h-11 neumorphic-inset text-sm focus:animate-input-pulse" />
             <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 hover:bg-transparent active:bg-transparent" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}>
               {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground hover:text-primary" /> : <Eye className="h-4 w-4 text-muted-foreground hover:text-primary" />}
             </Button>
          </div>
          {password.length > 0 && (
            <div className="space-y-1 pt-1">
              <ShadProgress
                value={passwordStrength}
                className={cn(
                  "h-1.5 flex-1 transition-all duration-300",
                  passwordStrength < 30 ? "[&>div]:bg-red-500" :
                  passwordStrength < 60 ? "[&>div]:bg-yellow-500" :
                  passwordStrength < 80 ? "[&>div]:bg-green-400" :
                  "[&>div]:bg-gradient-to-r [&>div]:from-green-400 [&>div]:to-primary"
                )}
              />
              <p className="text-xs text-muted-foreground text-center h-4">
                {passwordMessage || (password.length > 0 && "Keep typing...")}
              </p>
            </div>
          )}
           {password.length === 0 && <div className="h-[30px] pt-1"></div>}
        </div>
      ),
      onNext: validateStep2,
      onPrev: () => setCurrentStep(1)
    },
    { 
      title: "Upload Your Profile Photo",
      content: (
        <div className="space-y-3">
          <p className="text-center text-muted-foreground text-xs">
            A clear photo of your face is required. No cartoons, objects, or heavily obscured faces please.
          </p>
          <Input
            id="avatar-upload"
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/webp"
            onChange={handleFileChange}
            className="h-auto p-2 text-xs file:mr-2 file:py-1.5 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/20 file:text-primary hover:file:bg-primary/30 neumorphic-inset"
            disabled={photoValidationStatus === 'validating'}
          />
          {uploadedImagePreview && (
            <div className="mt-3 space-y-2 text-center">
              <Image src={uploadedImagePreview} alt="Avatar preview" width={100} height={100} className={cn("rounded-lg mx-auto neumorphic-sm object-cover ring-2", photoValidationStatus === 'validated' ? "ring-green-500" : "ring-transparent")} data-ai-hint="user avatar preview" />
              {photoValidationStatus !== 'validated' && (
                <Button
                  onClick={handleValidatePhoto}
                  className="neumorphic-button text-xs h-9 w-full sm:w-auto"
                  disabled={photoValidationStatus === 'validating' || photoValidationStatus === 'uploading' || !uploadedImagePreview}
                >
                  {photoValidationStatus === 'validating' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CheckCircle className="mr-2 h-4 w-4" />}
                  Validate Photo
                </Button>
              )}
            </div>
          )}
          {photoValidationStatus === 'validating' && <p className="text-xs text-primary text-center flex items-center justify-center"><Loader2 className="h-4 w-4 animate-spin mr-2" />Validating with AI...</p>}
          {photoValidationStatus === 'validated' && <p className="text-xs text-green-500 text-center flex items-center justify-center"><ThumbsUp className="h-4 w-4 mr-2" />Face Detected! Looks Great.</p>}
          {photoValidationError && <p className="text-xs text-red-500 text-center pt-1">{photoValidationError}</p>}
          { (uploadedImagePreview || photoValidationError) && (
            <Button
                variant="outline"
                size="sm"
                onClick={resetAvatarState}
                className="neumorphic-button text-xs h-8 w-full sm:w-auto mt-2"
                disabled={photoValidationStatus === 'validating'}
            >
                <X className="mr-2 h-3 w-3" /> Clear Photo / Try Another
            </Button>
          )}
        </div>
      ),
      onNext: validateStep3AndProceed,
      onPrev: () => setCurrentStep(2),
      nextDisabled: photoValidationStatus !== 'validated' || !selectedAvatar
    },
    { 
      title: "You're All Set!",
      content: (
        <div className="text-center space-y-3">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto animate-bounce-slow" />
          <p>Your GroZen profile is ready!</p>
          {selectedAvatar && <Image src={selectedAvatar} alt="Your selected avatar" width={80} height={80} className="rounded-full mx-auto neumorphic-sm object-cover ring-4 ring-primary/50 shadow-2xl" data-ai-hint="user avatar" />}
          <p className="text-xs text-muted-foreground">Click "Glow Up!" to start your journey.</p>
        </div>
      ),
      onComplete: handleCompleteSignup,
      onPrev: () => {
        setCurrentStep(3);
      }
    },
  ];

  const resetModalAndClose = useCallback(() => {
    setCurrentStep(0);
    setUsername('');
    setPassword('');
    resetAvatarState();
    setUsernameStatus('idle');
    setUsernameError('');
    setPasswordStrength(0);
    setPasswordMessage('');
    setIsCompleting(false);
    onClose();
  }, [onClose, resetAvatarState]);


  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && resetModalAndClose()}>
      <DialogContent ref={dialogContentRef} className="neumorphic max-w-sm mx-auto p-5 sm:p-6 overflow-hidden">
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
          nextDisabled={stepsConfig[currentStep].nextDisabled}
        >
          {stepsConfig[currentStep].content}
        </SignupStep>
      </DialogContent>
    </Dialog>
  );
};

// --- Discovery Path Definition ---
const discoveryStepsContent = [
  {
    icon: <Atom className="h-10 w-10 sm:h-12 sm:w-12" />,
    title: "Your AI Blueprint",
    description: "GroZen's AI crafts a unique wellness plan—fitness, food, and focus—all personalized just for YOU after a few quick insights.",
    ctaText: "Next: Vibe Checks!",
  },
  {
    icon: <Smile className="h-10 w-10 sm:h-12 sm:w-12" />,
    title: "Vibe Checks & Wins",
    description: "Log your mood, snap a selfie, and get instant, supportive AI feedback. Visualize your progress and celebrate every win!",
    ctaText: "Next: Fun Challenges!",
  },
  {
    icon: <Award className="h-10 w-10 sm:h-12 sm:w-12" />,
    title: "Challenges & Habits",
    description: "Join exciting challenges, build healthy habits, and see how you stack up on the leaderboard. Wellness made fun!",
    ctaText: "Claim Your Free Plan!",
  },
];

// --- Main Landing Page Component ---
const LandingPage: React.FC = () => {
  const { currentUser, isLoadingAuth, isOnboardedState } = usePlan();
  const router = useRouter();
  const { toast } = useToast();

  const [isClient, setIsClient] = useState(false);
  const [showExitIntent, setShowExitIntent] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [initialModalEmail, setInitialModalEmail] = useState('');
  
  const [currentDiscoveryStep, setCurrentDiscoveryStep] = useState(0);
  const [showDiscovery, setShowDiscovery] = useState(false);

  const heroContentRef = useRef<HTMLDivElement>(null);
  const discoveryContainerRef = useRef<HTMLDivElement>(null);
  const stepContentRefs = useRef<(HTMLDivElement | null)[]>([]);
  const progressBarFillRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    setIsClient(true);
    const handleMouseLeave = (e: MouseEvent) => {
<<<<<<< HEAD
      if (!isSignupModalOpen && !showDiscovery && e.clientY <= 10 && !localStorage.getItem('grozen_exit_intent_shown_minimal_v5')) {
=======
      if (e.clientY <= 0 && !exitIntentTriggered.current && !currentUser) { 
>>>>>>> fd980d6 (I see this error with the app, reported by NextJS, please fix it. The error is reported as HTML but presented visually to the user).)
        setShowExitIntent(true);
        localStorage.setItem('grozen_exit_intent_shown_minimal_v5', 'true');
      }
    };
    
    if (typeof window !== "undefined") {
        document.documentElement.addEventListener('mouseleave', handleMouseLeave);
        return () => {
          document.documentElement.removeEventListener('mouseleave', handleMouseLeave);
        };
    }
  }, [isSignupModalOpen, showDiscovery]);

  useEffect(() => {
    if (isClient && !isLoadingAuth) {
      if (currentUser && isOnboardedState) {
        router.push('/dashboard');
      } else if (currentUser && !isOnboardedState) {
        router.push('/onboarding');
      }
    }
  }, [isClient, currentUser, isLoadingAuth, isOnboardedState, router]);

  const handleEarlyEmailSubmit = async (email: string) => {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ variant: "destructive", title: "Hold Up!", description: "Please enter a valid email address." });
      return;
    }
    try {
      await addDoc(collection(db, "earlyAccessSignups"), {
        email: email.trim(),
        source: 'exit_intent_minimal_v5',
        createdAt: serverTimestamp()
      });
      toast({
        title: "Awesome! ✨",
        description: "Your free AI mini-plan is on its way! Now, let's create your account.",
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

  const startDiscovery = () => {
    if (heroContentRef.current) { // Removed discoveryContainerRef check as it's not needed for hero animation out
      anime({ // Animate hero out
        targets: heroContentRef.current,
        opacity: 0,
        translateY: -30,
        scale: 0.95,
        duration: 400,
        easing: 'easeInExpo',
        complete: () => {
          if (heroContentRef.current) anime.set(heroContentRef.current, { pointerEvents: 'none' });
          setShowDiscovery(true); // Set state to show discovery path
        }
      });
    } else {
      setShowDiscovery(true); // Fallback if hero ref isn't ready
    }
    setCurrentDiscoveryStep(0);
  };


  const handleNextDiscoveryStep = () => {
    const currentStepRef = stepContentRefs.current[currentDiscoveryStep];

    if (currentDiscoveryStep < discoveryStepsContent.length - 1) {
      if (currentStepRef) {
        anime({
          targets: currentStepRef,
          opacity: 0,
          scale: 0.9,
          translateY: -20,
          duration: 350,
          easing: 'easeInExpo',
          begin: () => { if(currentStepRef) currentStepRef.style.pointerEvents = 'none'; },
          complete: () => {
            setCurrentDiscoveryStep(prev => prev + 1);
          }
        });
      } else {
         // If ref is somehow null, just advance state
        setCurrentDiscoveryStep(prev => prev + 1);
      }
    } else {
      // Last step, open signup modal
      openSignupModalWithEmail(initialModalEmail);
    }
  };

  // Effect for Hero Content Animation In
  useEffect(() => {
    if (isClient && heroContentRef.current && !showDiscovery) {
      anime.set(heroContentRef.current, { opacity: 0, translateY: 20, scale: 0.98 });
      anime({
        targets: heroContentRef.current,
        opacity: 1,
        translateY: 0,
        scale: 1,
        duration: 800,
        delay: 100,
        easing: 'easeOutQuad',
      });
    } else if (heroContentRef.current && showDiscovery) {
      // Ensure hero is hidden if discovery is shown
      anime.set(heroContentRef.current, { opacity: 0, pointerEvents: 'none' });
    }
  }, [isClient, showDiscovery]);

  // Effect for Discovery Path Container Animation In
  useEffect(() => {
    if (showDiscovery && discoveryContainerRef.current && isClient) {
      anime.set(discoveryContainerRef.current, { opacity: 0, translateY: 30, scale: 0.95 });
      anime({
        targets: discoveryContainerRef.current,
        opacity: 1,
        translateY: 0,
        scale: 1,
        duration: 600,
        easing: 'easeOutExpo',
      });
    }
  }, [showDiscovery, isClient]);

  // Effect for Discovery Step Content & Progress Bar Animation
 useEffect(() => {
    if (showDiscovery && isClient) {
      stepContentRefs.current.forEach((ref, index) => {
        if (ref) {
          if (index === currentDiscoveryStep) {
            anime.set(ref, { opacity: 0, scale: 0.9, translateY: 20, pointerEvents: 'none' });
            anime({
              targets: ref,
              opacity: 1,
              scale: 1,
              translateY: 0,
              duration: 500,
              easing: 'easeOutExpo',
              delay: 150,
              begin: () => { ref.style.pointerEvents = 'auto'; }
            });
          } else {
            // Ensure other steps are hidden and non-interactive
             anime.set(ref, { opacity: 0, scale: 0.9, translateY: -20, pointerEvents: 'none' });
          }
        }
      });

      if (progressBarFillRef.current) {
        const progressPercentage = ((currentDiscoveryStep + 1) / discoveryStepsContent.length) * 100;
        anime({
          targets: progressBarFillRef.current,
          width: `${progressPercentage}%`,
          duration: 400,
          easing: 'easeInOutQuad',
        });
      }
    }
  }, [currentDiscoveryStep, showDiscovery, isClient]);


<<<<<<< HEAD
  if (!isClient || (isLoadingAuth && !currentUser) ) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 text-center">
        <Logo size="text-3xl" />
        <Loader2 className="mt-6 h-8 w-8 animate-spin text-primary" />
        <p className="mt-3 text-sm text-muted-foreground">Loading GroZen...</p>
=======
  const handleScrollAchievements = () => {
    if (typeof window !== "undefined") {
        const scrollPercentage = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
        
        if (scrollPercentage > 25 && !scrolledAchievements.includes("Explorer")) {
            setScrolledAchievements(prev => [...prev, "Explorer"]);
            toast({ title: "🏆 Badge Unlocked: Explorer!", description: "You've ventured forth!", variant: "default" });
        }
        if (scrollPercentage > 60 && !scrolledAchievements.includes("Deep Diver")) {
            setScrolledAchievements(prev => [...prev, "Deep Diver"]);
            toast({ title: "💎 Badge Unlocked: Deep Diver!", description: "You're digging the details!", variant: "default" });
        }
         if (scrollPercentage > 95 && !scrolledAchievements.includes("Completionist")) {
            setScrolledAchievements(prev => [...prev, "Completionist"]);
            toast({ title: "🌟 Badge Unlocked: Page Conqueror!", description: "You've seen it all!", variant: "default" });
        }
    }
  };
  
  useEffect(() => {
    if (typeof window !== "undefined") {
        window.addEventListener('scroll', handleScrollAchievements, { passive: true });
        return () => window.removeEventListener('scroll', handleScrollAchievements);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrolledAchievements]); 


  if (!isClient || (isLoadingAuth && !currentUser) ) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
        <Logo size="text-3xl sm:text-4xl" />
        <Loader2 className="mt-6 h-8 w-8 animate-spin text-accent" />
        <p className="mt-3 text-muted-foreground">Loading The Future of You...</p>
      </div>
    );
  }
  
  if (isClient && !isLoadingAuth && currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
        <Logo size="text-3xl sm:text-4xl" />
        <Loader2 className="mt-6 h-8 w-8 animate-spin text-accent" />
        <p className="mt-3 text-muted-foreground">Warping to your dashboard...</p>
>>>>>>> fd980d6 (I see this error with the app, reported by NextJS, please fix it. The error is reported as HTML but presented visually to the user).)
      </div>
    );
  }

  return (
<<<<<<< HEAD
    <>
      <main className="min-h-screen bg-background text-foreground overflow-x-hidden">
        {!showDiscovery && (
          <section
            ref={heroContentRef}
            className="min-h-[80vh] sm:min-h-screen flex flex-col items-center justify-center text-center p-4 sm:p-6 relative"
            style={{ perspective: '1000px' }}
          >
            <div className="relative z-10 flex flex-col items-center">
              <div className="mb-4 sm:mb-6">
                <Logo size="text-3xl sm:text-4xl md:text-5xl" />
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-3 sm:mb-4 leading-tight">
                Unlock Your <span className="gradient-text">GroZen Power!</span>
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-md sm:max-w-xl mb-6 sm:mb-8">
                Discover your personalized AI wellness journey. It's fun, fast, and <strong className="text-primary font-semibold">100% Free.</strong>
              </p>
              <Button
                onClick={startDiscovery}
                variant="neumorphic-primary"
                size="xl"
                className="w-full max-w-xs text-base sm:text-lg group py-3 mb-3 hover:scale-105 hover:shadow-xl active:animate-button-press transform transition-all duration-300"
              >
                Begin Your Journey <Zap className="ml-2 h-5 w-5 group-hover:animate-pulse-slow" />
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                No card. No catch. Just results.
              </p>
            </div>
          </section>
        )}

        {showDiscovery && (
          <section
            ref={discoveryContainerRef}
            className="py-10 sm:py-16 px-4 sm:px-6 flex flex-col items-center min-h-[80vh] justify-center"
            style={{ perspective: '1000px' }}
          >
            <div className="w-full max-w-lg mx-auto text-center">
              <div className="w-full bg-muted rounded-full h-2.5 mb-6 sm:mb-10 neumorphic-inset-sm overflow-hidden">
                <div ref={progressBarFillRef} className="bg-gradient-to-r from-primary via-accent to-primary/70 h-2.5 rounded-full" style={{ width: '0%' }}></div>
              </div>

              <div className="relative min-h-[280px] sm:min-h-[320px] mb-6 sm:mb-10">
                {discoveryStepsContent.map((step, index) => (
                  <div
                    key={index}
                    ref={el => stepContentRefs.current[index] = el}
                    className={cn(
                      "absolute inset-0 flex flex-col items-center justify-start p-2 space-y-3 sm:space-y-4",
                    )}
                  >
                    <div className="p-3 sm:p-4 bg-primary/10 rounded-full text-primary mb-2 sm:mb-3 group-hover:scale-110 transition-transform duration-300 animate-pulse-slow">
                      {step.icon}
                    </div>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold">{step.title}</h2>
                    <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto">{step.description}</p>
                  </div>
                ))}
              </div>

              <Button
                onClick={handleNextDiscoveryStep}
                variant="neumorphic-primary"
                size="lg"
                className="w-full max-w-xs text-base sm:text-lg group py-2.5 hover:scale-105 active:animate-button-press transform transition-all duration-300"
              >
                {discoveryStepsContent[currentDiscoveryStep].ctaText}
                {currentDiscoveryStep < discoveryStepsContent.length - 1 && <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />}
                {currentDiscoveryStep === discoveryStepsContent.length - 1 && <Sparkles className="ml-2 h-5 w-5 group-hover:animate-ping-slow" />}
              </Button>
            </div>
          </section>
        )}
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

export default LandingPage;
=======
    <div className="bg-black text-foreground min-h-screen w-full selection:bg-accent selection:text-accent-foreground">
      <style jsx global>{`
        .edge-to-edge {
          width: 100vw;
          margin-left: calc(50% - 50vw);
          margin-right: calc(50% - 50vw);
        }
        .neumorphic-accent-border {
          border: 1px solid hsl(var(--accent) / 0.2);
          box-shadow: 
            5px 5px 10px hsl(var(--background) / 0.7), 
            -5px -5px 10px hsl(var(--card) / 0.3),
            inset 1px 1px 2px hsl(var(--accent) / 0.1),
            inset -1px -1px 2px hsl(var(--background) / 0.5);
        }
         .neumorphic-accent-border-sm {
          border: 1px solid hsl(var(--accent) / 0.15);
          box-shadow: 
            3px 3px 6px hsl(var(--background) / 0.6), 
            -3px -3px 6px hsl(var(--card) / 0.25),
            inset 1px 1px 1px hsl(var(--accent) / 0.05),
            inset -1px -1px 1px hsl(var(--background) / 0.4);
        }
      `}</style>
      
      <HeroSection />
      <FeatureHighlightSection />
      <GamifiedSignupSection />
      <SocialProofSection />
      <FinalCTASection />
      
      <ExitIntentPopup isOpen={showExitIntent} onClose={() => setShowExitIntent(false)} />

      {isClient && typeof window !== "undefined" && window.scrollY > 500 && !currentUser && (
         <AnimatedCard className="fixed bottom-4 right-4 z-40">
             <Button variant="primary" size="sm" onClick={() => router.push('/signup')}>
                <Zap className="mr-1.5 h-4 w-4"/> Quick Sign Up
             </Button>
         </AnimatedCard>
      )}
    </div>
  );
}
>>>>>>> fd980d6 (I see this error with the app, reported by NextJS, please fix it. The error is reported as HTML but presented visually to the user).)

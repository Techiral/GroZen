"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { usePlan } from '@/contexts/plan-context';
import Logo from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Loader2, Zap, Star, Users, Clock, CheckCircle, ArrowRight, Sparkles, Target, TrendingUp, Heart, Brain, Dumbbell, Apple, Trophy, Gift, X, Play, Volume2, VolumeX } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

// Real-time user counter simulation
const useRealTimeUsers = () => {
  const [userCount, setUserCount] = useState(2847);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setUserCount(prev => prev + Math.floor(Math.random() * 3));
    }, 3000);
    return () => clearInterval(interval);
  }, []);
  
  return userCount;
};

// Countdown timer for FOMO
const useCountdown = (initialMinutes: number) => {
  const [timeLeft, setTimeLeft] = useState(initialMinutes * 60);
  
  useEffect(() => {
    if (timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeLeft]);
  
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  
  return { minutes, seconds, expired: timeLeft <= 0 };
};

// Progress tracking for micro-commitments
const useProgressTracking = () => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  
  const steps = [
    "Discover your wellness potential",
    "See personalized recommendations", 
    "Join thousands of teens transforming",
    "Start your journey today"
  ];
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep(prev => {
        const next = (prev + 1) % steps.length;
        setProgress((next + 1) * 25);
        return next;
      });
    }, 2000);
    
    return () => clearInterval(interval);
  }, [steps.length]);
  
  return { progress, currentStep, steps };
};

// Testimonials data
const testimonials = [
  {
    name: "Alex Chen",
    age: 17,
    avatar: "https://placehold.co/60x60/D3D3D3/000000?text=AC",
    text: "GroZen literally changed my life! Lost 15 lbs and feel amazing 💪",
    verified: true,
    followers: "12.3K"
  },
  {
    name: "Maya Rodriguez", 
    age: 16,
    avatar: "https://placehold.co/60x60/D3D3D3/000000?text=MR",
    text: "Finally found something that actually works! My anxiety is so much better ✨",
    verified: true,
    followers: "8.7K"
  },
  {
    name: "Jordan Kim",
    age: 18,
    avatar: "https://placehold.co/60x60/D3D3D3/000000?text=JK",
    text: "The AI coach is like having a personal trainer in your pocket 🔥",
    verified: true,
    followers: "15.1K"
  }
];

// Interactive elements
const InteractiveCard: React.FC<{ 
  icon: React.ReactNode; 
  title: string; 
  description: string;
  delay: number;
  onClick: () => void;
}> = ({ icon, title, description, delay, onClick }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);
  
  return (
    <Card 
      className={cn(
        "neumorphic cursor-pointer transition-all duration-500 hover:scale-105 hover:shadow-lg",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <CardContent className="p-4 sm:p-6 text-center">
        <div className={cn(
          "mx-auto mb-3 transition-all duration-300",
          isHovered ? "scale-110 rotate-12" : "scale-100 rotate-0"
        )}>
          {icon}
        </div>
        <h3 className="font-bold text-sm sm:text-base mb-2">{title}</h3>
        <p className="text-xs sm:text-sm text-muted-foreground">{description}</p>
        {isHovered && (
          <div className="mt-3 flex items-center justify-center text-primary text-xs">
            <span>Tap to explore</span>
            <ArrowRight className="ml-1 h-3 w-3" />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Exit intent popup
const ExitIntentPopup: React.FC<{ onClose: () => void; onSignUp: () => void }> = ({ onClose, onSignUp }) => {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="neumorphic max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <Gift className="h-5 w-5 text-accent" />
            Wait! Don't Miss Out! 🎁
          </DialogTitle>
          <DialogDescription className="text-sm">
            Get exclusive access to our premium AI wellness coach - FREE for the first 100 teens today!
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-4 rounded-lg">
            <h4 className="font-semibold text-sm mb-2">🔥 Limited Time Offer:</h4>
            <ul className="text-xs space-y-1">
              <li>✅ Personalized meal plans worth $49</li>
              <li>✅ AI mood tracking & insights worth $29</li>
              <li>✅ Exclusive teen community access worth $19</li>
            </ul>
            <p className="text-primary font-bold text-sm mt-2">Total Value: $97 - Yours FREE!</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={onSignUp} className="flex-1 neumorphic-button-primary">
              <Sparkles className="mr-2 h-4 w-4" />
              Claim My Free Access
            </Button>
            <Button onClick={onClose} variant="outline" className="neumorphic-button">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Video hero component
const VideoHero: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };
  
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };
  
  return (
    <div className="relative w-full h-[300px] sm:h-[400px] rounded-xl overflow-hidden neumorphic-inset">
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        poster="https://placehold.co/800x400/D3D3D3/000000?text=Teens+Achieving+Success"
        muted={isMuted}
        loop
        playsInline
      >
        <source src="https://placehold.co/800x400/D3D3D3/000000?text=Video+Not+Available" type="video/mp4" />
      </video>
      
      {/* Video overlay with controls */}
      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
        <div className="flex gap-4">
          <Button
            onClick={togglePlay}
            className="neumorphic-button-primary rounded-full w-12 h-12 p-0"
          >
            <Play className={cn("h-6 w-6", isPlaying && "hidden")} />
            <div className={cn("w-4 h-4 bg-current", !isPlaying && "hidden")} />
          </Button>
          <Button
            onClick={toggleMute}
            variant="outline"
            className="neumorphic-button rounded-full w-12 h-12 p-0"
          >
            {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </Button>
        </div>
      </div>
      
      {/* Success metrics overlay */}
      <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg p-2">
        <div className="text-white text-xs font-semibold">
          <div className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            <span>2,847 teens transformed</span>
          </div>
          <div className="text-green-400 text-2xs">+127 this week</div>
        </div>
      </div>
    </div>
  );
};

export default function HomePage() {
  const router = useRouter();
  const { currentUser, isLoadingAuth, isPlanAvailable, isOnboardedState } = usePlan();
  const [isClient, setIsClient] = useState(false);
  const [showExitIntent, setShowExitIntent] = useState(false);
  const [email, setEmail] = useState('');
  const [hasInteracted, setHasInteracted] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  
  const userCount = useRealTimeUsers();
  const countdown = useCountdown(15); // 15 minute countdown
  const progressTracking = useProgressTracking();

  useEffect(() => {
    setIsClient(true);
    
    // Track scroll progress
    const handleScroll = () => {
      const scrolled = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrolled / maxScroll) * 100;
      setScrollProgress(progress);
    };
    
    // Exit intent detection
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !hasInteracted) {
        setShowExitIntent(true);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    document.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [hasInteracted]);

  useEffect(() => {
    if (isClient && !isLoadingAuth) {
      if (currentUser) {
        if (isOnboardedState) { 
          router.replace('/dashboard'); 
        } else { 
          router.replace('/onboarding');
        }
      }
    }
  }, [isClient, currentUser, isLoadingAuth, isPlanAvailable, isOnboardedState, router]);

  const handleInteraction = () => {
    setHasInteracted(true);
  };

  const handleSignUp = () => {
    handleInteraction();
    router.push('/signup');
  };

  const handleLogin = () => {
    handleInteraction();
    router.push('/login');
  };

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
    <>
      {/* Progress bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-muted z-50">
        <div 
          className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
          {/* Animated background */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary rounded-full animate-pulse" />
            <div className="absolute top-3/4 right-1/4 w-24 h-24 bg-accent rounded-full animate-bounce" />
            <div className="absolute bottom-1/4 left-1/3 w-16 h-16 bg-primary rounded-full animate-ping" />
          </div>

          <div className="relative z-10 max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 items-center">
            {/* Left Column - Content */}
            <div className="text-center lg:text-left space-y-6">
              {/* Real-time social proof */}
              <div className="flex items-center justify-center lg:justify-start gap-2 text-xs">
                <div className="flex items-center gap-1 bg-green-500/10 text-green-400 px-2 py-1 rounded-full">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span>{userCount.toLocaleString()} teens online now</span>
                </div>
                <Badge variant="outline" className="text-2xs">
                  <Star className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-400" />
                  4.9/5 rating
                </Badge>
              </div>

              {/* Hook headline */}
              <div className="space-y-3">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
                  Get Rid Of Your{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                    Body Insecurities
                  </span>{' '}
                  in 5 Minutes
                </h1>
                <p className="text-lg sm:text-xl text-muted-foreground">
                  Join 10,000+ teens who transformed their lives with AI-powered wellness coaching. 
                  <span className="text-primary font-semibold"> No BS, just results.</span>
                </p>
              </div>

              {/* FOMO countdown */}
              {!countdown.expired && (
                <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-lg p-4">
                  <div className="flex items-center justify-center lg:justify-start gap-2 text-sm">
                    <Clock className="h-4 w-4 text-red-400" />
                    <span className="text-red-400 font-semibold">
                      Limited Time: Free Premium Access expires in {countdown.minutes}:{countdown.seconds.toString().padStart(2, '0')}
                    </span>
                  </div>
                </div>
              )}

              {/* Progress tracking */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Your wellness journey</span>
                  <span className="text-primary font-semibold">{progressTracking.progress}%</span>
                </div>
                <Progress value={progressTracking.progress} className="h-2" />
                <p className="text-xs text-center lg:text-left text-muted-foreground">
                  {progressTracking.steps[progressTracking.currentStep]}
                </p>
              </div>

              {/* CTAs */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    onClick={handleSignUp}
                    className="flex-1 neumorphic-button-primary text-base py-6 group"
                  >
                    <Zap className="mr-2 h-5 w-5 group-hover:animate-pulse" />
                    Start Free Transformation
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  <Button 
                    onClick={handleLogin}
                    variant="outline"
                    className="flex-1 neumorphic-button text-base py-6"
                  >
                    I Already Have an Account
                  </Button>
                </div>
                
                {/* Email capture for micro-commitment */}
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="Enter your email for instant access"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1"
                    onFocus={handleInteraction}
                  />
                  <Button 
                    onClick={handleSignUp}
                    disabled={!email}
                    className="neumorphic-button-primary"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
                
                <p className="text-2xs text-muted-foreground text-center lg:text-left">
                  ✅ No credit card required • ✅ Cancel anytime • ✅ 100% teen-safe
                </p>
              </div>

              {/* Social proof */}
              <div className="flex items-center justify-center lg:justify-start gap-4 text-xs">
                <div className="flex -space-x-2">
                  {testimonials.slice(0, 3).map((testimonial, i) => (
                    <Image
                      key={i}
                      src={testimonial.avatar}
                      alt={`${testimonial.name} avatar`}
                      width={32}
                      height={32}
                      className="rounded-full border-2 border-background"
                      data-ai-hint="teen avatar"
                    />
                  ))}
                </div>
                <div>
                  <p className="font-semibold">Join 10,000+ teens</p>
                  <p className="text-muted-foreground">who already transformed</p>
                </div>
              </div>
            </div>

            {/* Right Column - Video Hero */}
            <div className="order-first lg:order-last">
              <VideoHero />
            </div>
          </div>
        </section>

        {/* Interactive Features Section */}
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                Why 10,000+ Teens Choose GroZen
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Real results, real fast. Our AI-powered platform adapts to your lifestyle and goals.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <InteractiveCard
                icon={<Brain className="h-8 w-8 text-primary" />}
                title="AI Wellness Coach"
                description="Get personalized advice 24/7 from our smart AI that learns your habits"
                delay={0}
                onClick={handleInteraction}
              />
              <InteractiveCard
                icon={<Apple className="h-8 w-8 text-green-500" />}
                title="Custom Meal Plans"
                description="Delicious, teen-friendly meals that fit your schedule and budget"
                delay={200}
                onClick={handleInteraction}
              />
              <InteractiveCard
                icon={<Dumbbell className="h-8 w-8 text-blue-500" />}
                title="Fun Workouts"
                description="Quick, effective exercises you can do anywhere - no gym required"
                delay={400}
                onClick={handleInteraction}
              />
              <InteractiveCard
                icon={<Heart className="h-8 w-8 text-red-500" />}
                title="Mood Tracking"
                description="Track your mental health and get insights to feel your best"
                delay={600}
                onClick={handleInteraction}
              />
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-16 px-4 bg-muted/20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                Real Teens, Real Results 🔥
              </h2>
              <p className="text-muted-foreground">
                See what your peers are saying about their GroZen transformation
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {testimonials.map((testimonial, i) => (
                <Card key={i} className="neumorphic hover:scale-105 transition-transform duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3 mb-4">
                      <Image
                        src={testimonial.avatar}
                        alt={`${testimonial.name} avatar`}
                        width={48}
                        height={48}
                        className="rounded-full"
                        data-ai-hint="teen avatar"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-sm">{testimonial.name}</h4>
                          {testimonial.verified && (
                            <CheckCircle className="h-4 w-4 text-blue-500" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Age {testimonial.age} • {testimonial.followers} followers
                        </p>
                      </div>
                    </div>
                    <p className="text-sm">{testimonial.text}</p>
                    <div className="flex items-center gap-1 mt-3">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Gamification Section */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                  Level Up Your Life 🎮
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Earn points, unlock achievements, and compete with friends on your wellness journey
                </p>
              </div>

              <div className="grid sm:grid-cols-3 gap-6">
                <div className="neumorphic p-6 rounded-xl">
                  <Trophy className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                  <h3 className="font-bold mb-2">Daily Challenges</h3>
                  <p className="text-sm text-muted-foreground">
                    Complete fun daily tasks and earn XP points
                  </p>
                </div>
                <div className="neumorphic p-6 rounded-xl">
                  <Users className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                  <h3 className="font-bold mb-2">Teen Community</h3>
                  <p className="text-sm text-muted-foreground">
                    Connect with like-minded teens on the same journey
                  </p>
                </div>
                <div className="neumorphic p-6 rounded-xl">
                  <Gift className="h-12 w-12 text-purple-500 mx-auto mb-4" />
                  <h3 className="font-bold mb-2">Unlock Rewards</h3>
                  <p className="text-sm text-muted-foreground">
                    Get exclusive content and real-world prizes
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-16 px-4 bg-gradient-to-r from-primary/10 to-accent/10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                Ready to Transform Your Life? 🚀
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Join thousands of teens who are already living their best life with GroZen
              </p>
            </div>

            <div className="space-y-6">
              <Button 
                onClick={handleSignUp}
                className="neumorphic-button-primary text-lg py-8 px-12 group"
              >
                <Sparkles className="mr-3 h-6 w-6 group-hover:animate-spin" />
                Start My Free Transformation Now
                <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-2 transition-transform" />
              </Button>

              <div className="flex items-center justify-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Free forever plan</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>No credit card needed</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Cancel anytime</span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                🔒 Your privacy is protected. We never share your data.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Exit Intent Popup */}
      {showExitIntent && (
        <ExitIntentPopup 
          onClose={() => setShowExitIntent(false)}
          onSignUp={handleSignUp}
        />
      )}
    </>
  );
}

"use client";

import React, { useEffect, useState, useRef, useCallback, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { usePlan } from '@/contexts/plan-context';
import Logo from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2, Zap, Sparkles, ArrowRight, CheckCircle, Gift, X, Mail, User, Lock, Image as ImageIcon, Eye, EyeOff, ThumbsUp, BadgeCheck, Atom, Brain, Palette, RadioTower, MessageCircle, Award, Check, AlertTriangle, UploadCloud } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";
import { addDoc, collection, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { validateHumanFace, type ValidateHumanFaceOutput } from '@/ai/flows/validate-human-face';


// --- Helper Components ---
const AnimatedText: React.FC<{ text: string; delay?: number; className?: string; as?: keyof JSX.IntrinsicElements; charDelay?: number; onComplete?: () => void; }> = ({ text, delay = 0, className = "", as = "span", charDelay = 30, onComplete }) => {
  const [visibleText, setVisibleText] = useState("");
  const CustomTag = as;

  useEffect(() => {
    setVisibleText(""); 
    let currentText = "";
    const chars = text.split("");
    const initialTimeout = setTimeout(() => {
      if (chars.length === 0 && onComplete) {
        onComplete();
        return;
      }
      const charInterval = setInterval(() => {
        if (chars.length > 0) {
          currentText += chars.shift();
          setVisibleText(currentText);
        } else {
          clearInterval(charInterval);
          if (onComplete) {
            onComplete();
          }
        }
      }, charDelay);
      return () => clearInterval(charInterval);
    }, delay);
    return () => clearTimeout(initialTimeout);
  }, [text, delay, charDelay, onComplete]);

  return <CustomTag className={className}>{visibleText}{visibleText.length === text.length ? '' : <span className="inline-block w-0.5 h-[1em] bg-primary animate-ping ml-0.5 opacity-70"></span>}</CustomTag>;
};


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
      <DialogContent className="neumorphic max-w-xs mx-auto p-5 sm:p-6">
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
      <Progress value={((currentStep + 1) / totalSteps) * 100} className="h-1.5 mt-3 sm:mt-4 [&>div]:bg-gradient-to-r [&>div]:from-accent [&>div]:to-primary transition-all duration-300" />
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
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState(initialEmail);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // For avatar upload
  const [uploadedImageFile, setUploadedImageFile] = useState<File | null>(null);
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);
  const [selectedAvatar, setSelectedAvatar] = useState<string | undefined>(undefined); // This will store the validated Data URI
  const [photoValidationStatus, setPhotoValidationStatus] = useState<'idle' | 'uploading' | 'validating' | 'validated' | 'error'>('idle');
  const [photoValidationError, setPhotoValidationError] = useState<string>('');

  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [usernameError, setUsernameError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordMessage, setPasswordMessage] = useState('');
  const usernameDebounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);


  const resetAvatarState = () => {
    setUploadedImageFile(null);
    setUploadedImagePreview(null);
    setSelectedAvatar(undefined);
    setPhotoValidationStatus('idle');
    setPhotoValidationError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Reset file input
    }
  };

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
  }, [isOpen, initialEmail]);

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
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
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
        setUploadedImagePreview(reader.result as string);
        setPhotoValidationStatus('idle'); // Reset to idle, ready for validation
        setPhotoValidationError('');
        setSelectedAvatar(undefined); // Clear previously validated avatar
      };
      reader.readAsDataURL(file);
    }
  };

  const handleValidatePhoto = async () => {
    if (!uploadedImagePreview) {
      setPhotoValidationError("Please select an image first.");
      setPhotoValidationStatus('error');
      return;
    }
    setPhotoValidationStatus('validating');
    setPhotoValidationError('');
    try {
      const result: ValidateHumanFaceOutput = await validateHumanFace({ imageDataUri: uploadedImagePreview });
      if (result.isHumanFace) {
        setSelectedAvatar(uploadedImagePreview); // Store the Data URI of the validated face
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

  const validateStep0 = async () => { // Email
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ variant: "destructive", title: "Hmm...", description: "That email doesn't look quite right." });
      return false;
    }
    setCurrentStep(1);
    return true;
  };

  const validateStep1 = async () => { // Username
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

  const validateStep2 = async () => { // Password
    if (password.length < 6) {
      toast({ variant: "destructive", title: "Weak Sauce!", description: "Password needs to be at least 6 characters." });
      return false;
    }
    setCurrentStep(3); // Move to avatar step
    return true;
  };
  
  const validateStep3AndProceed = async () => { // Avatar validation step
    if (photoValidationStatus === 'validated' && selectedAvatar) {
      setCurrentStep(4); // Proceed to final confirmation step
      return true;
    }
    toast({ variant: "destructive", title: "Photo Required", description: "Please upload and validate your face photo to continue." });
    return false;
  };


  const handleCompleteSignup = async () => {
    setIsCompleting(true);
    if (!email || !username || !password ) {
      toast({ variant: "destructive", title: "Oops!", description: "Email, username, or password missing." });
      setIsCompleting(false);
      return;
    }
    if (usernameStatus !== 'available') {
        toast({ variant: "destructive", title: "Username Issue", description: "Please pick an available username first." });
        setIsCompleting(false);
        return;
    }
    if (typeof selectedAvatar !== 'string' || !selectedAvatar) {
      toast({ variant: "destructive", title: "Photo Error", description: "A validated profile photo is required. Please go back and complete that step." });
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
      // Router push to onboarding/dashboard will be handled by PlanProvider's useEffect
    }
    // Error toasts are handled within signupWithDetails
  };

  const stepsConfig = [
    { // Step 0: Email
      title: "Your Email to Start the Magic",
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
    { // Step 1: Username
      title: "Create Your GroZen Alias",
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
    { // Step 2: Password
      title: "Secure Your Glow Up Zone",
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
              <Progress 
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
    { // Step 3: Avatar Upload & Validation
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
              <Image src={uploadedImagePreview} alt="Avatar preview" width={100} height={100} className="rounded-lg mx-auto neumorphic-sm object-cover" data-ai-hint="user avatar preview"/>
              {photoValidationStatus !== 'validated' && (
                <Button 
                  onClick={handleValidatePhoto} 
                  className="neumorphic-button text-xs h-9 w-full sm:w-auto" 
                  disabled={photoValidationStatus === 'validating' || photoValidationStatus === 'uploading'}
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
           <Button 
                variant="outline"
                size="sm"
                onClick={resetAvatarState} 
                className="neumorphic-button text-xs h-8 w-full sm:w-auto mt-2"
                disabled={photoValidationStatus === 'validating'}
            >
                <X className="mr-2 h-3 w-3" /> Clear Photo / Try Another
            </Button>
        </div>
      ),
      onNext: validateStep3AndProceed,
      onPrev: () => setCurrentStep(2),
      nextDisabled: photoValidationStatus !== 'validated' // Disable "Next" if photo not validated
    },
    { // Step 4: Final Confirmation
      title: "You're All Set!",
      content: (
        <div className="text-center space-y-3">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto animate-bounce" />
          <p>Your GroZen profile is ready!</p>
          {selectedAvatar && <Image src={selectedAvatar} alt="Your selected avatar" width={80} height={80} className="rounded-full mx-auto neumorphic-sm object-cover" data-ai-hint="user avatar" />}
          <p className="text-xs text-muted-foreground">Click "Glow Up!" to start your journey.</p>
        </div>
      ),
      onComplete: handleCompleteSignup,
      onPrev: () => {
        // When going back from final confirmation, reset to avatar step
        // No need to reset photoValidationStatus here as user might want to keep the validated photo
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
  }, [onClose]);


  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && resetModalAndClose()}>
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
          nextDisabled={stepsConfig[currentStep].nextDisabled}
        >
          {stepsConfig[currentStep].content}
        </SignupStep>
      </DialogContent>
    </Dialog>
  );
};


// --- Main Landing Page Component ---
const AddictionLandingPage: React.FC = () => {
  const { currentUser, isLoadingAuth, isOnboardedState } = usePlan();
  const router = useRouter();
  const { toast } = useToast();

  const [isClient, setIsClient] = useState(false);
  const [showExitIntent, setShowExitIntent] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [initialModalEmail, setInitialModalEmail] = useState('');
  
  const [heroHeadline, setHeroHeadline] = useState("Instant Teen");
  const [heroTagline, setHeroTagline] = useState("");
  const [showSubheadline, setShowSubheadline] = useState(false);
  const [showHeroCTA, setShowHeroCTA] = useState(false);
  const [showSocialProof, setShowSocialProof] = useState(false);
  const [showFreebie, setShowFreebie] = useState(false);
  const [showBenefits, setShowBenefits] = useState(false);
  const [showTestimonial, setShowTestimonial] = useState(false);
  const [showFinalCTA, setShowFinalCTA] = useState(false);


  useEffect(() => {
    setIsClient(true);
    const handleMouseLeave = (e: MouseEvent) => {
      if (!isSignupModalOpen && e.clientY <= 10 && !localStorage.getItem('grozen_exit_intent_shown_minimal_v4')) {
        setShowExitIntent(true);
        localStorage.setItem('grozen_exit_intent_shown_minimal_v4', 'true');
      }
    };
    if (typeof window !== "undefined") {
        document.documentElement.addEventListener('mouseleave', handleMouseLeave);
        return () => document.documentElement.removeEventListener('mouseleave', handleMouseLeave);
    }
  }, [isSignupModalOpen]);

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
        source: 'exit_intent_minimal_v4_avatar_upload', 
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

  if (!isClient || isLoadingAuth) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 text-center">
        <Logo size="text-3xl" />
        <Loader2 className="mt-6 h-8 w-8 animate-spin text-primary" />
        <p className="mt-3 text-sm text-muted-foreground">Igniting GroZen...</p>
      </div>
    );
  }

  const BenefitItem: React.FC<{icon: React.ReactNode, title: string, description: string, show: boolean, delay: string}> = ({icon, title, description, show, delay}) => (
    <div className={cn("flex flex-col items-center space-y-1 text-center opacity-0", show && "animate-fade-in-up")} style={{animationDelay: delay}}>
      <div className="p-2.5 bg-card rounded-full neumorphic-sm text-primary mb-1.5 transition-all duration-300 ease-out hover:scale-110 hover:shadow-lg hover:text-accent">
        {React.cloneElement(icon as React.ReactElement, { className: "h-6 w-6 sm:h-7 sm:w-7" })}
      </div>
      <h3 className="text-sm sm:text-base font-semibold">{title}</h3>
      <p className="text-2xs sm:text-xs text-muted-foreground max-w-[200px]">{description}</p>
    </div>
  );

  return (
    <>
      <main className="min-h-screen bg-background text-foreground">
        {/* Hero Section */}
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
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-1 sm:mb-2">
              <AnimatedText text={heroHeadline} className="block" as="span" onComplete={() => setHeroTagline("Glow Up ✨")} charDelay={50} />
              {heroTagline && <span className="gradient-text block leading-tight tracking-tight"><AnimatedText text={heroTagline} delay={100} onComplete={() => setShowSubheadline(true)} charDelay={60}/></span>}
            </h1>
            {showSubheadline && (
              <p className="text-base sm:text-lg text-muted-foreground max-w-md sm:max-w-lg mb-6 sm:mb-8 opacity-0 animate-fade-in-up" style={{animationDelay: '0.2s'}} onAnimationEnd={() => setShowHeroCTA(true)}>
                AI wellness that gets you. Fast results, feel awesome. <strong className="text-primary font-semibold">100% FREE!</strong>
              </p>
            )}
            {showHeroCTA && (
              <div className={cn("opacity-0", showHeroCTA && "animate-fade-in-up")} style={{animationDelay: '0.4s'}} onAnimationEnd={() => setShowSocialProof(true)}>
                <Button
                  onClick={() => openSignupModalWithEmail()}
                  variant="neumorphic-primary"
                  size="xl"
                  className="w-full max-w-xs text-base sm:text-lg group py-3 mb-3 active:animate-button-press hover:animate-button-hover"
                >
                  Start Free Transformation <Zap className="ml-2 h-5 w-5 group-hover:animate-pulse" />
                </Button>
              </div>
            )}
            {showSocialProof && (
              <div className={cn("text-xs text-muted-foreground flex items-center opacity-0", showSocialProof && "animate-fade-in-up")} style={{animationDelay: '0.6s'}} onAnimationEnd={() => setShowFreebie(true)}>
                <BadgeCheck className="h-4 w-4 mr-1.5 text-green-400 animate-bounce-slow" />
                10,000+ Teens Glowing Up With GroZen!
              </div>
            )}
             {showFreebie && (
                <p className={cn("text-xs text-muted-foreground mt-2 opacity-0", showFreebie && "animate-fade-in-up")} style={{animationDelay: '0.7s'}} onAnimationEnd={() => setShowBenefits(true)}>It's Completely FREE Right Now!</p>
             )}
          </div>
        </section>

        {/* Why GroZen Section */}
        <section id="why-grozen" className="py-12 sm:py-16 px-4 sm:px-6 bg-card">
          <div className="max-w-3xl mx-auto text-center">
             <h2 className={cn("text-2xl sm:text-3xl font-bold mb-8 sm:mb-10 opacity-0", showBenefits && "animate-fade-in-up")} style={{animationDelay: '0s'}}>
              Unlock Your <span className="gradient-text">Best Self</span>, Instantly.
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
              <BenefitItem icon={<Atom />} title="AI-Personalized Plans" description="Plans that get YOU. Fast." show={showBenefits} delay="0.2s"/>
              <BenefitItem icon={<Brain />} title="Daily Confidence Boost" description="Feel better, instantly." show={showBenefits} delay="0.4s"/>
              <BenefitItem icon={<Zap />} title="Quick Wins, Real Results" description="See progress, quick." show={showBenefits} delay="0.6s" />
            </div>
          </div>
        </section>
        
        {/* Testimonial Section */}
        <section id="testimonial" className={cn("py-10 sm:py-12 px-4 sm:px-6 bg-background opacity-0", showBenefits && "animate-fade-in-up")} style={{animationDelay: '0.8s'}} onAnimationEnd={() => setShowTestimonial(true)}>
          <div className="max-w-xl mx-auto text-center">
            <Image
              src="https://placehold.co/60x60.png" 
              alt="Happy GroZen User (Example)"
              width={56}
              height={56}
              className="rounded-full mx-auto mb-3 neumorphic-sm border-2 border-primary/30 transition-transform duration-300 hover:scale-110"
              data-ai-hint="teenager avatar happy"
            />
            <blockquote className="text-sm sm:text-md italic text-muted-foreground">
              &ldquo;GroZen is a total game-changer. Felt the glow up in like, 2 days! So much fun too!&rdquo; (Example)
            </blockquote>
            <p className="mt-2 text-xs font-semibold text-primary">- Alex P. (Example User)</p>
          </div>
        </section>

        {/* Final CTA Section */}
        <section id="final-cta" className={cn("py-16 sm:py-20 px-4 sm:px-6 bg-card opacity-0", showTestimonial && "animate-fade-in-up")} style={{animationDelay: '0.2s'}} onAnimationEnd={() => setShowFinalCTA(true)}>
          <div className="max-w-lg mx-auto text-center">
            <Sparkles className="h-10 w-10 sm:h-12 sm:w-12 text-primary mx-auto mb-4 animate-ping-slow" />
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
              Ready for <span className="gradient-text">Your Glow Up</span>?
            </h2>
            <p className="text-muted-foreground mb-8 text-sm sm:text-base">
              Stop scrolling, start shining. Your best self is one click away. <strong className="text-primary font-semibold">And yes, it's 100% FREE!</strong>
            </p>
            <Button
              onClick={() => openSignupModalWithEmail()}
              variant="neumorphic-primary"
              size="xl"
              className="w-full max-w-xs sm:max-w-sm mx-auto text-base sm:text-lg group py-3 active:animate-button-press hover:animate-button-hover"
            >
              Join GroZen Free Now <ArrowRight className="ml-3 h-5 w-5 sm:h-6 sm:w-6 group-hover:translate-x-1 transition-transform" />
            </Button>
            <p className="text-xs text-muted-foreground mt-4">No card. No catch. Just results. It's Completely FREE Right Now!</p>
          </div>
        </section>
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

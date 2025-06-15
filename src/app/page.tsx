
"use client";

import React, { useEffect, useState, useRef, useCallback, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { usePlan } from '@/contexts/plan-context';
import Logo from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress as ShadProgress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Zap, Sparkles, ArrowRight, CheckCircle, Gift, X, Mail, User, Lock, Image as ImageIcon, Eye, EyeOff, ThumbsUp, PaletteIcon, Rocket, Brain as BrainIcon, Atom, Smile, Award, Users, AlertTriangle, LogIn } from 'lucide-react';
import Image from 'next/image';
import anime from 'animejs';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { validateHumanFace, type ValidateHumanFaceOutput } from '@/ai/flows/validate-human-face';


const MinimalExitIntentPopup: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onEmailSubmit: (email: string) => Promise<void>;
}> = ({ isOpen, onClose, onEmailSubmit }) => {
  const dialogContentRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

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
      });
    }
  }, [isOpen]);

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
      // Error toast handled by parent or onEmailSubmit
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

const SignupStep: React.FC<{
  title: string;
  children: React.ReactNode;
  onNext?: () => Promise<boolean | void>;
  onPrev?: () => void;
  onComplete?: () => Promise<void>;
  currentStep: number;
  totalSteps: number;
  isCompleting?: boolean;
  nextText?: string;
  prevText?: string;
  completeText?: string;
  nextDisabled?: boolean;
}> = ({ title, children, onNext, onPrev, onComplete, currentStep, totalSteps, isCompleting, nextText = "Next", prevText = "Back", completeText = "Glow Up!", nextDisabled = false }) => {
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
        {currentStep === 0 && !onPrev && <div className="sm:flex-1 hidden sm:block"></div>}
        {onNext && currentStep < totalSteps - 1 && (
          <Button onClick={handleNext} className="neumorphic-button-primary flex-1 h-10 sm:h-11 text-sm active:animate-button-press" disabled={isLoadingNext || nextDisabled}>
            {isLoadingNext ? <Loader2 className="h-4 w-4 animate-spin" /> : nextText}
            {!isLoadingNext && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
        )}
        {onComplete && currentStep === totalSteps - 1 && (
          <Button onClick={handleComplete} className="neumorphic-button-primary flex-1 h-10 sm:h-11 text-sm active:animate-button-press" disabled={isCompleting}>
            {isCompleting ? <Loader2 className="h-4 w-4 animate-spin" /> : completeText}
            {!isCompleting && <Sparkles className="ml-2 h-4 w-4 animate-ping-slow" />}
          </Button>
        )}
      </div>
      <ShadProgress value={((currentStep + 1) / totalSteps) * 100} className="h-1.5 mt-3 sm:mt-4 bg-gradient-to-r from-accent to-primary transition-all duration-300" />
    </div>
  );
};

const MinimalSignupModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: string;
  onSwitchToLogin: () => void;
}> = ({ isOpen, onClose, initialEmail = '', onSwitchToLogin }) => {
  const { signupWithDetails, currentUser } = usePlan();
  const router = useRouter();
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
      anime.set(dialogContentRef.current, { opacity: 0, scale: 0.9, translateY: -10 });
      anime({
        targets: dialogContentRef.current,
        opacity: 1,
        scale: 1,
        translateY: 0,
        duration: 350, 
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
    toast({ variant: "destructive", title: "Photo Required", description: "Please upload and validate your face photo to continue." });
    return false;
  };

  const handleCompleteSignup = async () => {
    setIsCompleting(true);
    if (!selectedAvatar || typeof selectedAvatar !== 'string' || selectedAvatar.trim() === "") {
      toast({
        variant: "destructive",
        title: "Avatar Required",
        description: "A validated profile photo is essential. Please ensure it's uploaded and validated.",
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
      onPrev: () => setCurrentStep(0),
      nextDisabled: usernameStatus !== 'available'
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
      onPrev: () => setCurrentStep(3)
    },
  ];

  const resetModalAndClose = useCallback(() => {
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
    setIsCompleting(false); 
    onClose(); 
  }, [onClose, initialEmail, resetAvatarState]);

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
        <div className="text-center mt-4">
          <button
            onClick={onSwitchToLogin}
            className="text-xs text-primary hover:underline"
          >
            Already have an account? Login
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const MinimalLoginModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSwitchToSignup: () => void;
}> = ({ isOpen, onClose, onSwitchToSignup }) => {
  const { loginWithEmail, sendPasswordReset, currentUser } = usePlan();
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [isSendingReset, setIsSendingReset] = useState(false);

  const dialogContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && dialogContentRef.current) {
      anime.set(dialogContentRef.current, { opacity: 0, scale: 0.9, translateY: -10 });
      anime({
        targets: dialogContentRef.current,
        opacity: 1,
        scale: 1,
        translateY: 0,
        duration: 350,
        easing: 'easeOutQuad',
      });
    }
  }, [isOpen]);
  
  useEffect(() => {
    if (currentUser && isOpen) {
      router.push('/dashboard'); // Or onboarding if not completed
      onClose();
    }
  }, [currentUser, router, isOpen, onClose]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast({ variant: "destructive", title: "Oops!", description: "Email and password are required." });
      return;
    }
    setIsLoggingIn(true);
    const success = await loginWithEmail(email, password);
    setIsLoggingIn(false);
    if (success) {
      // Navigation is handled by PlanContext's onAuthStateChanged
      onClose();
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotPasswordEmail.trim()) {
      toast({ variant: "destructive", title: "Email Required", description: "Please enter your email." });
      return;
    }
    setIsSendingReset(true);
    const success = await sendPasswordReset(forgotPasswordEmail);
    setIsSendingReset(false);
    if (success) {
      setIsForgotPasswordOpen(false);
      setForgotPasswordEmail('');
    }
  };

  const resetModalAndClose = () => {
    setEmail('');
    setPassword('');
    setShowPassword(false);
    setIsLoggingIn(false);
    setForgotPasswordEmail('');
    setIsForgotPasswordOpen(false);
    setIsSendingReset(false);
    onClose();
  };


  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && resetModalAndClose()}>
        <DialogContent ref={dialogContentRef} className="neumorphic max-w-sm mx-auto p-5 sm:p-6">
          <DialogHeader className="mb-3">
            <div className="mx-auto mb-2">
              <Logo size="text-lg" />
            </div>
            <DialogTitle className="text-xl sm:text-2xl font-bold text-center">Welcome Back to GroZen!</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="login-email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="login-email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 h-11 neumorphic-inset text-sm" />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="login-password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="login-password" type={showPassword ? "text" : "password"} placeholder="Your Password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10 h-11 neumorphic-inset text-sm" />
                <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 hover:bg-transparent active:bg-transparent" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground hover:text-primary" /> : <Eye className="h-4 w-4 text-muted-foreground hover:text-primary" />}
                </Button>
              </div>
            </div>
            <Button type="submit" className="w-full neumorphic-button-primary h-11 text-sm" disabled={isLoggingIn}>
              {isLoggingIn ? <Loader2 className="h-5 w-5 animate-spin" /> : "Login Securely"}
              {!isLoggingIn && <LogIn className="ml-2 h-4 w-4" />}
            </Button>
          </form>
          <div className="text-center mt-4 space-y-2">
            <button
              onClick={() => setIsForgotPasswordOpen(true)}
              className="text-xs text-primary hover:underline"
            >
              Forgot Password?
            </button>
            <p className="text-xs text-muted-foreground">
              New to GroZen?{' '}
              <button
                onClick={onSwitchToSignup}
                className="font-semibold text-primary hover:underline"
              >
                Create an Account
              </button>
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Forgot Password Dialog */}
      <Dialog open={isForgotPasswordOpen} onOpenChange={setIsForgotPasswordOpen}>
        <DialogContent className="neumorphic max-w-xs mx-auto p-5 sm:p-6">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Enter your email and we'll send you a link to reset your password.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleForgotPasswordSubmit} className="space-y-4 pt-2">
            <div>
              <Label htmlFor="forgot-password-email">Email</Label>
              <Input
                id="forgot-password-email"
                type="email"
                placeholder="you@example.com"
                value={forgotPasswordEmail}
                onChange={(e) => setForgotPasswordEmail(e.target.value)}
                disabled={isSendingReset}
                className="h-10 neumorphic-inset text-sm"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsForgotPasswordOpen(false)} className="neumorphic-button h-10 text-sm">Cancel</Button>
              <Button type="submit" className="neumorphic-button-primary h-10 text-sm" disabled={isSendingReset}>
                {isSendingReset ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Reset Link"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};


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
    ctaText: "Claim Your Free Plan & Sign Up",
  },
];

const LandingPage: React.FC = () => {
  const { currentUser, isLoadingAuth, isOnboardedState } = usePlan();
  const router = useRouter();
  const { toast } = useToast();

  const [isClient, setIsClient] = useState(false);
  const [showExitIntent, setShowExitIntent] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [initialModalEmail, setInitialModalEmail] = useState('');
  
  const [showDiscovery, setShowDiscovery] = useState(false);
  const [currentDiscoveryStep, setCurrentDiscoveryStep] = useState(0);

  const heroContentRef = useRef<HTMLDivElement>(null);
  const discoveryContainerRef = useRef<HTMLDivElement>(null);
  const discoveryStepContentRef = useRef<HTMLDivElement>(null); 
  const progressBarFillRef = useRef<HTMLDivElement>(null);
  const parallaxBg1Ref = useRef<HTMLDivElement>(null);
  const parallaxBg2Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsClient(true);
    const handleMouseLeave = (e: MouseEvent) => {
      if (!isSignupModalOpen && !isLoginModalOpen && !showDiscovery && e.clientY <= 10 && !localStorage.getItem('grozen_exit_intent_shown_minimal_v5')) {
        setShowExitIntent(true);
        localStorage.setItem('grozen_exit_intent_shown_minimal_v5', 'true');
      }
    };
    
    if (typeof window !== "undefined") { 
        document.documentElement.addEventListener('mouseleave', handleMouseLeave);

        const handleScroll = () => {
          if (parallaxBg1Ref.current && parallaxBg2Ref.current) {
            const scrollY = window.scrollY;
            anime({ targets: parallaxBg1Ref.current, translateY: scrollY * 0.2, easing: 'linear', duration: 50 });
            anime({ targets: parallaxBg2Ref.current, translateY: scrollY * 0.1, easing: 'linear', duration: 50 });
          }
        };
        window.addEventListener('scroll', handleScroll);
        
        return () => {
          document.documentElement.removeEventListener('mouseleave', handleMouseLeave);
          window.removeEventListener('scroll', handleScroll);
        };
    }
  }, [isSignupModalOpen, isLoginModalOpen, showDiscovery]); 

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

  const openSignupModal = (email?: string) => {
    setInitialModalEmail(email || '');
    setIsSignupModalOpen(true);
    setIsLoginModalOpen(false);
  };

  const openLoginModal = () => {
    setIsLoginModalOpen(true);
    setIsSignupModalOpen(false);
  };

  const startDiscovery = () => {
    if (heroContentRef.current) {
      anime({
        targets: heroContentRef.current,
        opacity: [1, 0],
        translateY: [0, -30],
        scale: [1, 0.95],
        duration: 400,
        easing: 'easeInExpo',
        begin: () => {
          if (heroContentRef.current) heroContentRef.current.style.pointerEvents = 'none';
        },
        complete: () => {
          setShowDiscovery(true);
        }
      });
    } else {
       setShowDiscovery(true);
    }
    setCurrentDiscoveryStep(0);
  };

  const handleNextDiscoveryStep = () => {
    if (discoveryStepContentRef.current) {
      anime({ 
        targets: discoveryStepContentRef.current,
        opacity: 0,
        scale: 0.9,
        translateY: -20,
        duration: 350,
        easing: 'easeInExpo',
        complete: () => {
          if (currentDiscoveryStep < discoveryStepsContent.length - 1) {
            setCurrentDiscoveryStep(prev => prev + 1);
          } else {
            openSignupModal(initialModalEmail);
          }
        }
      });
    } else if (currentDiscoveryStep < discoveryStepsContent.length - 1) {
        setCurrentDiscoveryStep(prev => prev + 1);
    } else {
        openSignupModal(initialModalEmail);
    }
  };

  useEffect(() => {
    if (isClient && heroContentRef.current && !showDiscovery) {
      anime({
        targets: heroContentRef.current,
        opacity: [0,1],
        translateY: [20,0],
        duration: 600,
        delay: 100,
        easing: 'easeOutQuad',
      });
    }
  }, [isClient, showDiscovery]);


  useEffect(() => {
    if (showDiscovery && discoveryContainerRef.current) {
      anime.set(discoveryContainerRef.current, { opacity: 0, translateY: 30, scale: 0.95 });
      anime({
          targets: discoveryContainerRef.current,
          opacity: 1,
          translateY: 0,
          scale: 1,
          duration: 600,
          easing: 'easeOutExpo',
      });
    } else if (!showDiscovery && discoveryContainerRef.current) {
        anime.set(discoveryContainerRef.current, { opacity: 0 });
    }
  }, [showDiscovery, isClient]);

  useEffect(() => {
    if (showDiscovery) { 
      if (discoveryStepContentRef.current) {
        anime.set(discoveryStepContentRef.current, { opacity: 0, scale: 0.9, translateY: 20 });
        anime({
          targets: discoveryStepContentRef.current,
          opacity: 1,
          scale: 1,
          translateY: 0,
          duration: 500,
          easing: 'easeOutExpo',
          delay: 50, 
        });
      }

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


  if (!isClient || (isLoadingAuth && !currentUser) ) { 
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 text-center">
        <Logo size="text-3xl" />
        <Loader2 className="mt-6 h-8 w-8 animate-spin text-primary" />
        <p className="mt-3 text-sm text-muted-foreground">Loading GroZen...</p>
      </div>
    );
  }

  const currentStepData = discoveryStepsContent[currentDiscoveryStep];

  return (
    <>
      <main className="min-h-screen bg-background text-foreground overflow-x-hidden">
        {!showDiscovery && (
          <section
            ref={heroContentRef}
            className="min-h-[80vh] sm:min-h-screen flex flex-col items-center justify-center text-center p-4 sm:p-6 relative"
            style={{ perspective: '1000px' }} 
          >
            <div ref={parallaxBg1Ref} className="absolute -top-20 -left-20 w-72 h-72 bg-primary/5 rounded-full animate-pulse-bg opacity-50 " data-ai-hint="abstract shape"></div>
            <div ref={parallaxBg2Ref} className="absolute -bottom-20 -right-20 w-60 h-60 bg-accent/5 rounded-full animate-pulse-bg opacity-50 " data-ai-hint="abstract shape"></div>

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
              
              <div ref={discoveryStepContentRef} className="relative min-h-[280px] sm:min-h-[320px] mb-6 sm:mb-10">
                {currentStepData && (
                  <div className="flex flex-col items-center justify-start p-2 space-y-3 sm:space-y-4">
                    <div className="p-3 sm:p-4 bg-primary/10 rounded-full text-primary mb-2 sm:mb-3 animate-pulse-slow group">
                       {React.cloneElement(currentStepData.icon, { className: cn(currentStepData.icon.props.className, "group-hover:scale-110 transition-transform")})}
                    </div>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold">
                      {currentStepData.title}
                    </h2>
                    <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
                      {currentStepData.description}
                    </p>
                  </div>
                )}
              </div>

              <Button
                onClick={handleNextDiscoveryStep}
                variant="neumorphic-primary"
                size="lg"
                className="w-full max-w-xs text-base sm:text-lg group py-2.5 hover:scale-105 active:animate-button-press transform transition-all duration-300"
              >
                {currentStepData?.ctaText || "Next"}
                {currentDiscoveryStep < discoveryStepsContent.length - 1 && <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />}
                {currentDiscoveryStep === discoveryStepsContent.length - 1 && <Sparkles className="ml-2 h-5 w-5 group-hover:animate-ping-slow" />}
              </Button>
              
              {currentDiscoveryStep === discoveryStepsContent.length - 1 && (
                <p className="mt-4 text-xs">
                  <button onClick={openLoginModal} className="text-primary hover:underline">
                    Already have an account? Login
                  </button>
                </p>
              )}
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
        onSwitchToLogin={() => {
          setIsSignupModalOpen(false);
          setIsLoginModalOpen(true);
        }}
      />
      <MinimalLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSwitchToSignup={() => {
          setIsLoginModalOpen(false);
          setIsSignupModalOpen(true);
        }}
      />
    </>
  );
};

export default LandingPage;

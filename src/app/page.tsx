
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
import { Loader2, Zap, Sparkles, ArrowRight, CheckCircle, Gift, X, Mail, User, Lock, Image as ImageIcon, Eye, EyeOff, ThumbsUp, PaletteIcon, Rocket, BrainIcon, BarChart3, Smile, Target, ShoppingCart, Award, Users, Atom } from 'lucide-react';
import Image from 'next/image';
import anime from 'animejs';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase'; // For early access and username check
import { validateHumanFace, type ValidateHumanFaceOutput } from '@/ai/flows/validate-human-face';


// Helper: Minimal Exit Intent Popup
const MinimalExitIntentPopup: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onEmailSubmit: (email: string) => Promise<void>;
}> = ({ isOpen, onClose, onEmailSubmit }) => {
  const dialogContentRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && dialogContentRef.current) {
      anime.set(dialogContentRef.current, { opacity: 0, scale: 0.9, translateY: -20 }); // Initial state
      anime({
        targets: dialogContentRef.current,
        opacity: 1,
        scale: 1,
        translateY: 0,
        duration: 300, // Quick and simple
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


// Helper: Signup Step Component (for MinimalSignupModal)
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
            {!isCompleting && <Sparkles className="ml-2 h-4 w-4 animate-ping-slow" />}
          </Button>
        )}
      </div>
      <ShadProgress value={((currentStep + 1) / totalSteps) * 100} className="h-1.5 mt-3 sm:mt-4 bg-gradient-to-r from-accent to-primary transition-all duration-300" />
    </div>
  );
};

// Helper: Minimal Signup Modal
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
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
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
      if (file.size > 2 * 1024 * 1024) { // Max 2MB
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
            setSelectedAvatar(undefined); // Reset selected avatar until validation
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
      setSelectedAvatar(undefined); // Ensure avatar is undefined if no valid preview
      return;
    }
    setPhotoValidationStatus('validating');
    setPhotoValidationError('');
    try {
      const result: ValidateHumanFaceOutput = await validateHumanFace({ imageDataUri: uploadedImagePreview });
      if (result.isHumanFace) {
        setSelectedAvatar(uploadedImagePreview); // Set the valid preview as the avatar
        setPhotoValidationStatus('validated');
        toast({ title: "Face Detected! 👍", description: "Looks good! You can proceed." });
      } else {
        setPhotoValidationStatus('error');
        setPhotoValidationError(result.reason || "This doesn't look like a human face. Please upload a clear photo of your face.");
        setSelectedAvatar(undefined); // Clear avatar if validation fails
      }
    } catch (error) {
      console.error("Error validating photo:", error);
      setPhotoValidationStatus('error');
      setPhotoValidationError("Validation failed. Please try again or use a different photo.");
      setSelectedAvatar(undefined); // Clear avatar on error
    }
  };

  // Step validation functions
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
        return false; // Don't proceed while checking
    }
    const isAvailable = await checkUsernameAvailability(username); // Re-check on next click if needed
    if (isAvailable) {
      setCurrentStep(2);
      return true;
    }
    return false; // Stay on this step if not available or error
  };

  const validateStep2 = async () => { // Password
    if (password.length < 6) {
      toast({ variant: "destructive", title: "Weak Sauce!", description: "Password needs to be at least 6 characters." });
      return false;
    }
    setCurrentStep(3);
    return true;
  };
  
  const validateStep3AndProceed = async () => { // Avatar
    // Ensure avatar is actually set from a validated photo
    if (photoValidationStatus === 'validated' && selectedAvatar && typeof selectedAvatar === 'string' && selectedAvatar.trim() !== "") {
      setCurrentStep(4); // Proceed to final confirmation step
      return true;
    }
    // If not validated or no avatar selected from a validated photo
    toast({ variant: "destructive", title: "Photo Required", description: "Please upload, validate your face photo, and ensure it's correctly processed to continue." });
    return false;
  };


  const handleCompleteSignup = async () => {
    setIsCompleting(true);
    // Final check for selectedAvatar before submission
    if (!selectedAvatar || typeof selectedAvatar !== 'string' || selectedAvatar.trim() === "") {
      toast({
        variant: "destructive",
        title: "Avatar Required",
        description: "A validated profile photo is essential. Please go back, upload your photo, ensure it's validated, and make sure it's correctly processed.",
      });
      setIsCompleting(false);
      return; 
    }
     if (!email || !username || !password ) { // Basic check
      toast({ variant: "destructive", title: "Missing Info", description: "Email, username, or password missing." });
      setIsCompleting(false);
      return;
    }
    if (usernameStatus !== 'available') { // Ensure username is confirmed available
        toast({ variant: "destructive", title: "Username Issue", description: "Please pick an available username first." });
        setIsCompleting(false);
        return;
    }

    const success = await signupWithDetails(email, password, username, selectedAvatar);
    setIsCompleting(false);
    if (success) {
      // The useEffect for currentUser will handle redirect to onboarding
      toast({
        title: "WELCOME TO GROZEN! 🎉",
        description: "You're officially in! Get ready to unleash your awesome.",
        duration: 6000,
      });
      // onClose will be handled by currentUser effect typically
    }
    // If signup fails, user stays on modal, error toast shown by signupWithDetails
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
                usernameStatus === 'available' && "border-green-500 animate-pulse-green", // Visual feedback
                usernameStatus === 'taken' && "border-red-500 animate-pulse-red"
              )}
            />
            {usernameStatus === 'checking' && <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 animate-spin text-primary" />}
            {usernameStatus === 'available' && <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" />}
            {usernameStatus === 'taken' && <AlertTriangle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-red-500" />}
          </div>
          {usernameError && <p className="text-xs text-red-500 text-center pt-1 h-4">{usernameError}</p>}
          {usernameStatus === 'available' && <p className="text-xs text-green-500 text-center pt-1 h-4">Sweet, it's yours! ✨</p>}
          {!usernameError && usernameStatus !== 'available' && usernameStatus !== 'checking' && <div className="h-4 pt-1"></div>} {/* Placeholder for consistent height */}
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
           {password.length === 0 && <div className="h-[30px] pt-1"></div>} {/* Placeholder for consistent height */}
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
              {photoValidationStatus !== 'validated' && ( // Only show validate button if not yet validated or if re-uploading
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
          {/* Button to clear/reset photo selection */}
          { (uploadedImagePreview || photoValidationError) && ( // Show if there's a preview or an error related to a photo
            <Button
                variant="outline"
                size="sm"
                onClick={resetAvatarState}
                className="neumorphic-button text-xs h-8 w-full sm:w-auto mt-2"
                disabled={photoValidationStatus === 'validating'} // Disable if currently validating
            >
                <X className="mr-2 h-3 w-3" /> Clear Photo / Try Another
            </Button>
          )}
        </div>
      ),
      onNext: validateStep3AndProceed, // Use this to move to the final confirmation step
      onPrev: () => setCurrentStep(2),
      nextDisabled: photoValidationStatus !== 'validated' || !selectedAvatar // Disable next if photo not validated and selected
    },
    { 
      title: "You're All Set!",
      content: (
        <div className="text-center space-y-3">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto animate-bounce-slow" />
          <p>Your GroZen profile is ready!</p>
          {/* Display the validated and selected avatar here */}
          {selectedAvatar && <Image src={selectedAvatar} alt="Your selected avatar" width={80} height={80} className="rounded-full mx-auto neumorphic-sm object-cover ring-4 ring-primary/50 shadow-2xl" data-ai-hint="user avatar" />}
          <p className="text-xs text-muted-foreground">Click "Glow Up!" to start your journey.</p>
        </div>
      ),
      onComplete: handleCompleteSignup, // Final action
      onPrev: () => {
        // Potentially reset avatar state if going back from final confirmation
        // or just go back to the photo upload step.
        // For simplicity, just go back to photo upload.
        // If they change their mind about the photo, they can re-upload/validate.
        setCurrentStep(3);
      }
    },
  ];

  const resetModalAndClose = useCallback(() => {
    // Reset all state related to the modal form
    setEmail(initialEmail || ''); // Reset email or use initial if provided
    setUsername('');
    setPassword('');
    resetAvatarState(); // Resets all avatar-related states
    setCurrentStep(0);
    setUsernameStatus('idle');
    setUsernameError('');
    setPasswordStrength(0);
    setPasswordMessage('');
    setShowPassword(false);
    setIsCompleting(false); // Ensure completing flag is reset
    onClose(); // Call the passed onClose handler
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
          nextDisabled={stepsConfig[currentStep].nextDisabled} // Pass this down
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
      if (!isSignupModalOpen && !showDiscovery && e.clientY <= 10 && !localStorage.getItem('grozen_exit_intent_shown_minimal_v5')) {
        setShowExitIntent(true);
        localStorage.setItem('grozen_exit_intent_shown_minimal_v5', 'true');
      }
    };
    
    if (typeof window !== "undefined") { // Ensure window is defined
        document.documentElement.addEventListener('mouseleave', handleMouseLeave);
        return () => {
          document.documentElement.removeEventListener('mouseleave', handleMouseLeave);
        };
    }
  }, [isSignupModalOpen, showDiscovery]); // Dependencies

  useEffect(() => {
    if (isClient && !isLoadingAuth) {
      if (currentUser && isOnboardedState) {
        router.push('/dashboard');
      } else if (currentUser && !isOnboardedState) {
        router.push('/onboarding');
      }
      // If !currentUser, stay on landing page
    }
  }, [isClient, currentUser, isLoadingAuth, isOnboardedState, router]);

  const handleEarlyEmailSubmit = async (email: string) => {
    // Basic client-side validation
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ variant: "destructive", title: "Hold Up!", description: "Please enter a valid email address." });
      return;
    }
    try {
      // Simulate saving to a "soft" list (e.g., local state, or Firestore if rules allow unauth writes to a specific collection)
      // For this example, we'll use Firestore for 'earlyAccessSignups'
      await addDoc(collection(db, "earlyAccessSignups"), {
        email: email.trim(),
        source: 'exit_intent_minimal_v5', // Differentiate this source
        createdAt: serverTimestamp()
      });
      toast({
        title: "Awesome! ✨",
        description: "Your free AI mini-plan is on its way! Now, let's create your account.",
        duration: 4000
      });
      if (showExitIntent) setShowExitIntent(false); // Close exit intent
      setInitialModalEmail(email.trim()); // Pre-fill email in the main signup
      setIsSignupModalOpen(true); // Open main signup modal
    } catch (error) {
      console.error("Error saving early access email:", error);
      toast({ variant: "destructive", title: "Oh No!", description: "Could not save your email. Please try again." });
    }
  };

  const openSignupModalWithEmail = (email?: string) => {
    setInitialModalEmail(email || '');
    setIsSignupModalOpen(true);
  };

  // --- Gamified Discovery Path Logic ---
  const startDiscovery = () => {
    if (heroContentRef.current && discoveryContainerRef.current) {
      anime({ // Animate hero out
        targets: heroContentRef.current,
        opacity: 0,
        translateY: -30,
        scale: 0.95,
        duration: 400,
        easing: 'easeInExpo',
        begin: () => {
          if (heroContentRef.current) heroContentRef.current.style.pointerEvents = 'none';
        },
        complete: () => {
          setShowDiscovery(true); // Set state to show discovery path
          // Animate discovery path in AFTER hero is out and state is set
          anime.set(discoveryContainerRef.current!, { opacity: 0, translateY: 30, scale: 0.95 });
          anime({
            targets: discoveryContainerRef.current,
            opacity: 1,
            translateY: 0,
            scale: 1,
            duration: 600,
            easing: 'easeOutExpo',
          });
        }
      });
    } else { // Fallback if refs aren't ready (less likely with proper timing)
      setShowDiscovery(true);
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

  // Effect for Hero Content Animation In (Only if not showing discovery)
  useEffect(() => {
    if (isClient && heroContentRef.current && !showDiscovery) {
      anime.set(heroContentRef.current, { opacity: 0, translateY: 20, scale: 0.98 });
      anime({
        targets: heroContentRef.current,
        opacity: 1,
        translateY: 0,
        scale: 1,
        duration: 800,
        delay: 100, // Small delay after mount
        easing: 'easeOutQuad',
      });
    } else if (heroContentRef.current && showDiscovery) {
      // Ensure hero is hidden if discovery is shown
      anime.set(heroContentRef.current, { opacity: 0, pointerEvents: 'none' });
    }
  }, [isClient, showDiscovery]);


  // Effect for Discovery Step Content & Progress Bar Animation
 useEffect(() => {
    if (showDiscovery && isClient) {
      // Animate current step in
      const currentStepRef = stepContentRefs.current[currentDiscoveryStep];
      if (currentStepRef) {
        // Ensure it's visible and interactive before animation
        currentStepRef.style.opacity = '0';
        currentStepRef.style.pointerEvents = 'auto'; 
        anime({
          targets: currentStepRef,
          opacity: 1,
          scale: [0.95, 1],
          translateY: [15, 0],
          duration: 500,
          easing: 'easeOutExpo',
          delay: 50, // Slight delay for smoother transition
        });
      }

      // Update progress bar
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


  if (!isClient || (isLoadingAuth && !currentUser) ) { // Show loading only if not client or loading auth for non-user
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 text-center">
        <Logo size="text-3xl" />
        <Loader2 className="mt-6 h-8 w-8 animate-spin text-primary" />
        <p className="mt-3 text-sm text-muted-foreground">Loading GroZen...</p>
      </div>
    );
  }

  return (
    <>
      <main className="min-h-screen bg-background text-foreground overflow-x-hidden">
        {!showDiscovery && (
          <section
            ref={heroContentRef}
            className="min-h-[80vh] sm:min-h-screen flex flex-col items-center justify-center text-center p-4 sm:p-6 relative"
            style={{ perspective: '1000px' }} // For potential 3D transforms on children
          >
            {/* Initial content here, ensures heroContentRef is part of layout before animation */}
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
            className="py-10 sm:py-16 px-4 sm:px-6 flex flex-col items-center min-h-[80vh] justify-center opacity-0" // Start hidden, JS will animate
            style={{ perspective: '1000px' }}
          >
            <div className="w-full max-w-lg mx-auto text-center">
              {/* Progress Bar */}
              <div className="w-full bg-muted rounded-full h-2.5 mb-6 sm:mb-10 neumorphic-inset-sm overflow-hidden">
                <div ref={progressBarFillRef} className="bg-gradient-to-r from-primary via-accent to-primary/70 h-2.5 rounded-full" style={{ width: '0%' }}></div>
              </div>

              {/* Step Content Area - relative positioning for absolute children */}
              <div className="relative min-h-[280px] sm:min-h-[320px] mb-6 sm:mb-10">
                {discoveryStepsContent.map((step, index) => (
                  <div
                    key={index}
                    ref={el => stepContentRefs.current[index] = el}
                    className={cn(
                      "absolute inset-0 flex flex-col items-center justify-start p-2 space-y-3 sm:space-y-4 opacity-0", // Start hidden
                      // currentDiscoveryStep === index ? "opacity-100" : "opacity-0 pointer-events-none" // JS handles opacity now
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

              {/* Navigation Button */}
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

    
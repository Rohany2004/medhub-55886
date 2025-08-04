import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Lock, UserPlus } from 'lucide-react';

interface TrialLimitModalProps {
  open: boolean;
  onClose: () => void;
}

const TrialLimitModal: React.FC<TrialLimitModalProps> = ({ open, onClose }) => {
  const handleSignUp = () => {
    window.location.href = '/auth';
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="text-center text-2xl">
            Free Trial Limit Reached
          </DialogTitle>
          <DialogDescription className="text-center text-lg">
            You've used your 2 free trials. Create an account to continue using all features of our medical platform.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 mt-6">
          <Button onClick={handleSignUp} className="w-full text-lg py-3">
            <UserPlus className="w-5 h-5 mr-2" />
            Sign Up Free
          </Button>
          
          <div className="text-center">
            <span className="text-sm text-muted-foreground">
              Already have an account?{' '}
            </span>
            <Button variant="link" className="p-0 h-auto" onClick={handleSignUp}>
              Sign In
            </Button>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="font-semibold mb-2">✨ Benefits of signing up:</h4>
          <ul className="text-sm space-y-1">
            <li>• Unlimited medicine analysis</li>
            <li>• Save your medical history</li>
            <li>• Personalized recommendations</li>
            <li>• Advanced features access</li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TrialLimitModal;
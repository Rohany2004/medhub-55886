import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { Settings, Upload } from 'lucide-react';
interface UserProfileProps {
  user: User;
}
interface Profile {
  id: string;
  name: string;
  avatar_url?: string;
}
const UserProfile: React.FC<UserProfileProps> = ({
  user
}) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const {
    toast
  } = useToast();
  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);
  const loadProfile = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      if (data) {
        setProfile(data);
        setName(data.name);
      }
    } catch (error: any) {
      console.error('Error loading profile:', error);
    }
  };
  const updateProfile = async () => {
    setIsLoading(true);
    try {
      const updates = {
        id: user.id,
        name,
        updated_at: new Date().toISOString()
      };
      const {
        error
      } = await supabase.from('profiles').upsert(updates);
      if (error) throw error;
      setProfile({
        ...profile!,
        name
      });
      setIsOpen(false);
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully."
      });
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  const handleSignOut = async () => {
    try {
      const {
        error
      } = await supabase.auth.signOut();
      if (error) throw error;
      toast({
        title: "Signed out",
        description: "You have been signed out successfully."
      });
    } catch (error: any) {
      toast({
        title: "Sign out failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  if (!profile) {
    return <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>
        <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
      </div>;
  }
  return <div className="flex items-center gap-3">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <button className="flex items-center gap-3 hover-lift rounded-lg p-2 hover:bg-white/10 transition-colors">
            <Avatar className="w-8 h-8">
              <AvatarImage src={profile.avatar_url} alt={profile.name} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-sm">
                {profile.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
          </button>
        </DialogTrigger>
        
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Avatar Section */}
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="w-20 h-20">
                <AvatarImage src={profile.avatar_url} alt={profile.name} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-2xl">
                  {profile.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <Button variant="outline" size="sm" className="flex items-center gap-2" disabled>
                <Upload className="w-4 h-4" />
                Upload Photo (Coming Soon)
              </Button>
            </div>

            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="profile-name">Display Name</Label>
              <Input id="profile-name" value={name} onChange={e => setName(e.target.value)} placeholder="Enter your display name" />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2">
              <Button onClick={updateProfile} disabled={isLoading || !name.trim()} className="w-full">
                {isLoading ? 'Updating...' : 'Update Profile'}
              </Button>
              
              <Button onClick={handleSignOut} variant="outline" className="w-full">
                Sign Out
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>;
};
export default UserProfile;
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, User, Camera } from 'lucide-react';
import { useSession } from '@/lib/auth-client';

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  bio: string | null;
  status: 'ONLINE' | 'OFFLINE' | 'AWAY' | 'BUSY' | 'DO_NOT_DISTURB';
  createdAt: string;
  updatedAt: string;
}

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusOptions = [
  { value: 'ONLINE', label: 'Online', color: 'bg-green-500' },
  { value: 'OFFLINE', label: 'Offline', color: 'bg-gray-400' },
  { value: 'AWAY', label: 'Away', color: 'bg-yellow-500' },
  { value: 'BUSY', label: 'Busy', color: 'bg-red-500' },
  { value: 'DO_NOT_DISTURB', label: 'Do Not Disturb', color: 'bg-purple-500' },
];

export function ProfileDialog({ open, onOpenChange }: ProfileDialogProps) {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    status: 'ONLINE' as UserProfile['status'], // Default to ONLINE instead of OFFLINE
  });

  // Load profile when dialog opens
  useEffect(() => {
    if (open && session?.user?.id) {
      fetchProfile();
    }
  }, [open, session?.user?.id]);

  // Auto-refresh profile data every 30 seconds to get updated status
  useEffect(() => {
    if (!open || !session?.user?.id) return;

    const interval = setInterval(() => {
      fetchProfile();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [open, session?.user?.id]);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/profile');
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setFormData({
          name: data.name || '',
          bio: data.bio || '',
          status: data.status || 'ONLINE',
        });
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    try {
      setIsSaving(true);
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        setProfile(updatedProfile);
        onOpenChange(false);
      } else {
        const error = await response.json();
        console.error('Failed to update profile:', error);
        alert('Failed to update profile. Please try again.');
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusInfo = (status: UserProfile['status']) => {
    return (
      statusOptions.find(option => option.value === status) || statusOptions[1]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle>Profile Settings</DialogTitle>
          <DialogDescription>
            Manage your profile information and status
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className='flex items-center justify-center py-8'>
            <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
          </div>
        ) : profile ? (
          <div className='space-y-6'>
            {/* Profile Picture Section */}
            <div className='flex flex-col items-center space-y-4'>
              <div className='relative'>
                <Avatar className='h-20 w-20'>
                  <AvatarImage src={profile.image || undefined} />
                  <AvatarFallback className='text-lg'>
                    <User className='h-8 w-8' />
                  </AvatarFallback>
                </Avatar>
                <Button
                  size='icon'
                  variant='secondary'
                  className='absolute -bottom-2 -right-2 h-8 w-8 rounded-full'
                  disabled
                  title='Profile picture upload coming soon'
                >
                  <Camera className='h-4 w-4' />
                </Button>
              </div>
              <div className='text-center'>
                <p className='font-medium'>{profile.name || 'Unnamed User'}</p>
                <p className='text-sm text-muted-foreground'>{profile.email}</p>
              </div>
            </div>

            {/* Profile Form */}
            <div className='space-y-4'>
              {/* Display Name */}
              <div className='space-y-2'>
                <Label htmlFor='name'>Display Name</Label>
                <Input
                  id='name'
                  value={formData.name}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, name: e.target.value }))
                  }
                  placeholder='Enter your display name'
                  maxLength={50}
                />
              </div>

              {/* Bio */}
              <div className='space-y-2'>
                <Label htmlFor='bio'>Bio</Label>
                <Textarea
                  id='bio'
                  value={formData.bio}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, bio: e.target.value }))
                  }
                  placeholder='Tell others about yourself...'
                  maxLength={500}
                  rows={3}
                />
                <p className='text-xs text-muted-foreground text-right'>
                  {formData.bio?.length || 0}/500
                </p>
              </div>

              {/* Status */}
              <div className='space-y-2'>
                <Label htmlFor='status'>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: UserProfile['status']) =>
                    setFormData(prev => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className='flex items-center gap-2'>
                          <div
                            className={`w-2 h-2 rounded-full ${option.color}`}
                          />
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Current Status Display */}
              <div className='flex items-center gap-2 p-3 rounded-lg bg-muted/50'>
                <div
                  className={`w-2 h-2 rounded-full ${
                    getStatusInfo(formData.status).color
                  }`}
                />
                <span className='text-sm font-medium'>
                  Current: {getStatusInfo(formData.status).label}
                </span>
              </div>
            </div>

            {/* Save Button */}
            <div className='flex justify-end gap-2 pt-4'>
              <Button
                variant='outline'
                onClick={() => onOpenChange(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className='text-center py-8 text-muted-foreground'>
            Failed to load profile
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

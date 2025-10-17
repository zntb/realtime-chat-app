'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Loader2, Users, MessageSquare } from 'lucide-react';
import type { User } from '@/types/chat';

interface NewConversationDialogProps {
  onConversationCreated: (conversationId: string) => void;
  children: React.ReactNode;
  availableUsers?: User[];
}

export function NewConversationDialog({
  onConversationCreated,
  children,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  availableUsers = [],
}: NewConversationDialogProps) {
  const [open, setOpen] = useState(false);
  const [isGroup, setIsGroup] = useState(false);
  const [name, setName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [userEmail, setUserEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAddUser = () => {
    if (!userEmail.trim()) return;
    if (selectedUsers.includes(userEmail)) {
      setError('User already added');
      return;
    }
    setSelectedUsers([...selectedUsers, userEmail]);
    setUserEmail('');
    setError('');
  };

  const handleRemoveUser = (email: string) => {
    setSelectedUsers(selectedUsers.filter(e => e !== email));
  };

  const handleCreate = async () => {
    setError('');
    setIsLoading(true);

    try {
      if (isGroup && !name.trim()) {
        setError('Group name is required');
        setIsLoading(false);
        return;
      }

      if (selectedUsers.length === 0) {
        setError('Select at least one participant');
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: isGroup ? name : null,
          participants: selectedUsers,
          isGroup,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create conversation');
      }

      const conversation = await response.json();
      setOpen(false);
      setName('');
      setSelectedUsers([]);
      setUserEmail('');
      onConversationCreated(conversation.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Start a new conversation</DialogTitle>
        </DialogHeader>

        <div className='space-y-4'>
          {/* Conversation Type */}
          <div className='space-y-2'>
            <Label>Conversation Type</Label>
            <div className='flex gap-2'>
              <button
                onClick={() => setIsGroup(false)}
                className={`flex-1 flex items-center justify-center gap-2 rounded-lg border-2 p-3 transition-colors ${
                  !isGroup
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <MessageSquare className='h-4 w-4' />
                Direct Message
              </button>
              <button
                onClick={() => setIsGroup(true)}
                className={`flex-1 flex items-center justify-center gap-2 rounded-lg border-2 p-3 transition-colors ${
                  isGroup
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <Users className='h-4 w-4' />
                Group Chat
              </button>
            </div>
          </div>

          {/* Group Name */}
          {isGroup && (
            <div className='space-y-2'>
              <Label htmlFor='group-name'>Group Name</Label>
              <Input
                id='group-name'
                placeholder='e.g., Project Team'
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
          )}

          {/* User Selection */}
          <div className='space-y-2'>
            <Label htmlFor='user-email'>Add Participant</Label>
            <div className='flex gap-2'>
              <Input
                id='user-email'
                placeholder='Enter email address'
                value={userEmail}
                onChange={e => setUserEmail(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleAddUser()}
              />
              <Button
                onClick={handleAddUser}
                disabled={!userEmail.trim()}
                variant='outline'
              >
                Add
              </Button>
            </div>
          </div>

          {/* Selected Users */}
          {selectedUsers.length > 0 && (
            <div className='space-y-2'>
              <Label>Participants ({selectedUsers.length})</Label>
              <div className='space-y-2'>
                {selectedUsers.map(email => (
                  <div
                    key={email}
                    className='flex items-center justify-between rounded-lg border border-border bg-muted/30 p-2'
                  >
                    <span className='text-sm'>{email}</span>
                    <Button
                      onClick={() => handleRemoveUser(email)}
                      variant='ghost'
                      size='sm'
                      className='h-6 w-6 p-0'
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className='text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3'>
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className='flex justify-end gap-2 pt-4'>
            <Button
              onClick={() => setOpen(false)}
              variant='outline'
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Creating...
                </>
              ) : (
                'Create'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

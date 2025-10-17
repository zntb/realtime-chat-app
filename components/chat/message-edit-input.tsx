'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Check } from 'lucide-react';
import { toast } from 'sonner';

interface MessageEditInputProps {
  messageId: string;
  conversationId: string;
  initialContent: string;
  onSave: (newContent: string) => void;
  onCancel: () => void;
}

export function MessageEditInput({
  messageId,
  conversationId,
  initialContent,
  onSave,
  onCancel,
}: MessageEditInputProps) {
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!content.trim()) {
      toast.error('Message cannot be empty');
      return;
    }

    if (content === initialContent) {
      onCancel();
      return;
    }

    try {
      setIsSaving(true);
      const response = await fetch(
        `/api/conversations/${conversationId}/messages/${messageId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content }),
        },
      );

      if (!response.ok) {
        toast.error('Failed to update message');
        return;
      }

      const updatedMessage = await response.json();
      onSave(updatedMessage.content);
      toast.success('Message updated');
    } catch (error) {
      toast.error('Failed to update message');
      console.error('Edit error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className='flex gap-2 items-center w-full'>
      <Input
        value={content}
        onChange={e => setContent(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSave();
          }
          if (e.key === 'Escape') {
            onCancel();
          }
        }}
        className='flex-1'
        autoFocus
      />
      <Button
        size='sm'
        onClick={handleSave}
        disabled={isSaving}
        className='bg-green-600 hover:bg-green-700'
      >
        <Check className='h-4 w-4' />
      </Button>
      <Button
        size='sm'
        variant='outline'
        onClick={onCancel}
        disabled={isSaving}
      >
        <X className='h-4 w-4' />
      </Button>
    </div>
  );
}

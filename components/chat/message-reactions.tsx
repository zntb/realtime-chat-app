/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Smile } from 'lucide-react';
import { toast } from 'sonner';

interface ReactionData {
  emoji: string;
  count: number;
  userReacted: boolean;
  users: string[];
}

interface MessageReactionsProps {
  messageId: string;
  conversationId: string;
  reactions: Record<string, ReactionData>;
  onReactionAdded: (reactions: Record<string, ReactionData>) => void;
}

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

export function MessageReactions({
  messageId,
  conversationId,
  reactions,
  onReactionAdded,
}: MessageReactionsProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [pickerPosition, setPickerPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (showEmojiPicker && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;

      // Picker dimensions
      const pickerWidth = 160; // approx width of the picker
      const pickerHeight = 160; // approx height of the picker

      // Calculate left position - ensure it doesn't go off screen
      let left = buttonRect.left;

      // If picker would go off right side of screen, align to right
      if (left + pickerWidth > viewportWidth) {
        left = viewportWidth - pickerWidth - 10; // 10px padding from edge
      }

      // If picker would go off left side of screen, align to left
      if (left < 10) {
        left = 10;
      }

      // Position above the button
      const top = buttonRect.top - pickerHeight - 8;

      setPickerPosition({ top, left });
    }
  }, [showEmojiPicker]);

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showEmojiPicker]);

  const handleReaction = async (emoji: string) => {
    try {
      const response = await fetch(
        `/api/conversations/${conversationId}/messages/${messageId}/reactions`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emoji }),
        },
      );

      if (!response.ok) {
        toast.error('Failed to add reaction');
        return;
      }

      const data = await response.json();
      const groupedReactions = data.reactions.reduce(
        (acc: Record<string, ReactionData>, reaction: any) => {
          if (!acc[reaction.emoji]) {
            acc[reaction.emoji] = {
              emoji: reaction.emoji,
              count: 0,
              userReacted: false,
              users: [],
            };
          }
          acc[reaction.emoji].count++;
          acc[reaction.emoji].users.push(reaction.userName);
          return acc;
        },
        {} as Record<string, ReactionData>,
      );

      onReactionAdded(groupedReactions);
      setShowEmojiPicker(false);
    } catch (error) {
      toast.error('Failed to add reaction');
      console.error('Reaction error:', error);
    }
  };

  return (
    <div className='relative inline-block'>
      <div className='flex items-center gap-1 flex-wrap'>
        {Object.values(reactions).map(reaction => (
          <button
            key={reaction.emoji}
            onClick={() => handleReaction(reaction.emoji)}
            className={`px-2 py-1 rounded-full text-sm transition-colors ${
              reaction.userReacted
                ? 'bg-primary/20 border border-primary'
                : 'bg-muted hover:bg-accent border border-transparent'
            }`}
            title={`${reaction.users.join(', ')}`}
          >
            <span className='mr-1'>{reaction.emoji}</span>
            <span className='text-xs'>{reaction.count}</span>
          </button>
        ))}

        <div className='relative inline-block'>
          <Button
            ref={buttonRef}
            variant='ghost'
            size='icon'
            className='h-6 w-6 p-0'
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          >
            <Smile className='h-4 w-4' />
          </Button>

          {showEmojiPicker && (
            <div
              className='fixed bg-card border border-border rounded-lg p-3 grid grid-cols-3 gap-2 shadow-lg z-50 w-max'
              style={{
                top: `${pickerPosition.top}px`,
                left: `${pickerPosition.left}px`,
              }}
            >
              {QUICK_REACTIONS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  className='p-2 hover:bg-accent rounded transition-colors text-lg w-10 h-10 flex items-center justify-center'
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

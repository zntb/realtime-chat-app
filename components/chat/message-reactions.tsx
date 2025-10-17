/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
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

export function MessageReactions({
  messageId,
  conversationId,
  reactions,
  onReactionAdded,
}: MessageReactionsProps) {
  const [isLoadingReaction, setIsLoadingReaction] = useState(false);

  const handleReaction = async (emoji: string) => {
    if (isLoadingReaction) return;

    setIsLoadingReaction(true);
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
        const error = await response.json();
        toast.error(error.error || 'Failed to add reaction');
        setIsLoadingReaction(false);
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
    } catch (error) {
      console.error('Reaction error:', error);
      toast.error('Failed to add reaction');
    } finally {
      setIsLoadingReaction(false);
    }
  };

  return (
    <div className='flex items-center gap-1 flex-wrap mt-2'>
      {Object.values(reactions).map(reaction => (
        <button
          key={reaction.emoji}
          onClick={() => handleReaction(reaction.emoji)}
          className='px-2 py-1 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-1 group'
          style={{
            backgroundColor: reaction.userReacted
              ? 'rgba(59, 130, 246, 0.1)'
              : 'rgba(100, 116, 139, 0.1)',
            border: reaction.userReacted
              ? '1px solid rgb(59, 130, 246)'
              : '1px solid transparent',
          }}
          title={`Reacted by: ${reaction.users.join(', ')}`}
        >
          <span className='text-base group-hover:scale-110 transition-transform'>
            {reaction.emoji}
          </span>
          <span className='text-xs font-semibold'>{reaction.count}</span>
        </button>
      ))}
    </div>
  );
}

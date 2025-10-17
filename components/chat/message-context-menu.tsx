'use client';

import { Message, User } from '@/types/chat';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreVertical, Edit2, Trash2, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface MessageContextMenuProps {
  message: Message;
  currentUser: User;
  onEdit: (message: Message) => void;
  onDelete: (messageId: string) => void;
  isEditing: boolean;
}

export function MessageContextMenu({
  message,
  currentUser,
  onEdit,
  onDelete,
  isEditing,
}: MessageContextMenuProps) {
  const isOwner = message.senderId === currentUser.id;
  const isDeleted = message.content === '[This message was deleted]';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    toast.success('Message copied to clipboard');
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(
        `/api/conversations/${message.conversationId}/messages/${message.id}`,
        { method: 'DELETE' },
      );

      if (!response.ok) {
        toast.error('Failed to delete message');
        return;
      }

      onDelete(message.id);
      toast.success('Message deleted');
    } catch (error) {
      toast.error('Failed to delete message');
      console.error('Delete error:', error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          size='icon'
          className='h-6 w-6 opacity-0 group-hover:opacity-100'
        >
          <MoreVertical className='h-4 w-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuItem onClick={handleCopy}>
          <Copy className='mr-2 h-4 w-4' />
          Copy
        </DropdownMenuItem>

        {isOwner && !isDeleted && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onEdit(message)}
              disabled={isEditing}
            >
              <Edit2 className='mr-2 h-4 w-4' />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDelete} variant='destructive'>
              <Trash2 className='mr-2 h-4 w-4' />
              Delete
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

'use client';

import { useState, useRef, useEffect } from 'react';
import { Message, User } from '@/types/chat';
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
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const isOwner = message.senderId === currentUser.id;
  const isDeleted = message.content === '[This message was deleted]';

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    toast.success('Message copied to clipboard');
    setIsOpen(false);
  };

  const handleEdit = () => {
    onEdit(message);
    setIsOpen(false);
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
      setIsOpen(false);
    } catch (error) {
      toast.error('Failed to delete message');
      console.error('Delete error:', error);
    }
  };

  return (
    <div className='relative'>
      <Button
        ref={buttonRef}
        variant='ghost'
        size='icon'
        className='h-7 w-7 p-0'
        onClick={() => setIsOpen(!isOpen)}
      >
        <MoreVertical className='h-4 w-4' />
      </Button>

      {isOpen && (
        <div
          ref={menuRef}
          className='absolute right-0 top-full mt-1 bg-popover border border-border rounded-lg shadow-lg py-1 min-w-max z-50'
        >
          <button
            onClick={handleCopy}
            className='flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent w-full text-left transition-colors'
          >
            <Copy className='h-4 w-4' />
            Copy
          </button>

          {isOwner && !isDeleted && (
            <>
              <div className='h-px bg-border my-1' />
              <button
                onClick={handleEdit}
                disabled={isEditing}
                className='flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent w-full text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
              >
                <Edit2 className='h-4 w-4' />
                Edit
              </button>
              <button
                onClick={handleDelete}
                className='flex items-center gap-2 px-4 py-2 text-sm hover:bg-destructive/10 text-destructive w-full text-left transition-colors'
              >
                <Trash2 className='h-4 w-4' />
                Delete
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

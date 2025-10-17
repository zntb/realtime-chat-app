import { Button } from '@/components/ui/button';
import { Reply } from 'lucide-react';

interface MessageReplyButtonProps {
  onReply: () => void;
}

export function MessageReplyButton({ onReply }: MessageReplyButtonProps) {
  return (
    <Button
      variant='ghost'
      size='icon'
      className='h-6 w-6 p-0 opacity-0 group-hover:opacity-100'
      onClick={onReply}
    >
      <Reply className='h-4 w-4' />
    </Button>
  );
}

import type { QuotedMessage } from '@/types/chat';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QuotedMessagePreviewProps {
  quotedMessage: QuotedMessage;
  onRemove: () => void;
}

export function QuotedMessagePreview({
  quotedMessage,
  onRemove,
}: QuotedMessagePreviewProps) {
  return (
    <div className='flex items-start gap-2 p-3 bg-muted/50 border-l-4 border-primary rounded-md mb-3'>
      <div className='flex-1 min-w-0'>
        <p className='text-xs font-semibold text-primary mb-1'>
          Replying to {quotedMessage.senderName}
        </p>
        <p className='text-sm text-muted-foreground truncate'>
          {quotedMessage.content.length > 100
            ? `${quotedMessage.content.substring(0, 100)}...`
            : quotedMessage.content}
        </p>
      </div>
      <Button
        type='button'
        variant='ghost'
        size='icon'
        className='h-6 w-6 p-0 flex-shrink-0'
        onClick={onRemove}
      >
        <X className='h-4 w-4' />
      </Button>
    </div>
  );
}

import type { QuotedMessage } from '@/types/chat';

interface QuotedMessageDisplayProps {
  quotedMessage: QuotedMessage;
}

export function QuotedMessageDisplay({
  quotedMessage,
}: QuotedMessageDisplayProps) {
  return (
    <div className='mb-2 p-2 border-l-4 border-primary/50 bg-background/50 rounded text-sm'>
      <p className='text-xs font-semibold text-primary/70 mb-1'>
        {quotedMessage.senderName}
      </p>
      <p className='text-muted-foreground line-clamp-2'>
        {quotedMessage.content}
      </p>
    </div>
  );
}

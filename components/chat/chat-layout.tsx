'use client';

import { useEffect, useState } from 'react';
import { ConversationSidebar } from './conversation-sidebar';
import { ChatArea } from './chat-area';
import { useSession } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export function ChatLayout() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);

  // Handle redirect in useEffect, not during render
  useEffect(() => {
    if (!isPending && !session) {
      router.push('/sign-in');
    }
  }, [session, isPending, router]);

  if (isPending) {
    return (
      <div className='h-screen flex items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className='h-dvh flex bg-background chat-container'>
      <ConversationSidebar
        selectedConversationId={selectedConversationId}
        onSelectConversation={setSelectedConversationId}
        currentUser={session.user}
      />
      <ChatArea
        conversationId={selectedConversationId}
        currentUser={session.user}
      />
    </div>
  );
}

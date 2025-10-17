'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Plus, Search, LogOut, Users } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { signOut } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import type { Conversation, User } from '@/types/chat';
import { NewConversationDialog } from './new-conversation-dialog';

interface ConversationSidebarProps {
  selectedConversationId: string | null;
  onSelectConversation: (id: string) => void;
  currentUser: User;
}

export function ConversationSidebar({
  selectedConversationId,
  onSelectConversation,
  currentUser,
}: ConversationSidebarProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/conversations');
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const handleConversationCreated = (conversationId: string) => {
    // Refresh conversations list
    fetchConversations();
    // Select the new conversation
    onSelectConversation(conversationId);
  };

  const getConversationName = (conversation: Conversation) => {
    if (conversation.isGroup) {
      return conversation.name || 'Group Chat';
    }
    const otherParticipant = conversation.participants.find(
      p => p.userId !== currentUser.id,
    );
    return otherParticipant?.user.name || 'Unknown User';
  };

  const getLastMessage = (conversation: Conversation) => {
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    return lastMessage?.content || 'No messages yet';
  };

  const filteredConversations = conversations.filter(conv =>
    getConversationName(conv).toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className='w-80 border-r border-border flex flex-col bg-card'>
      {/* Header */}
      <div className='p-4 border-b border-border'>
        <div className='flex items-center justify-between mb-4'>
          <div className='flex items-center gap-2'>
            <MessageSquare className='h-5 w-5 text-primary' />
            <span className='font-semibold'>ChatFlow</span>
          </div>
          <div className='flex items-center gap-1'>
            <ThemeToggle />
            <Button
              variant='ghost'
              size='icon'
              onClick={handleSignOut}
              title='Sign out'
            >
              <LogOut className='h-4 w-4' />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className='relative'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
          <Input
            placeholder='Search conversations...'
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className='pl-9'
          />
        </div>
      </div>

      {/* Conversations List */}
      <ScrollArea className='flex-1'>
        <div className='p-2'>
          {isLoading ? (
            <div className='flex items-center justify-center py-8 text-muted-foreground'>
              <p className='text-sm'>Loading conversations...</p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-8 text-muted-foreground'>
              <MessageSquare className='h-8 w-8 mb-2 opacity-50' />
              <p className='text-sm text-center'>
                {conversations.length === 0
                  ? 'No conversations yet. Start a new chat!'
                  : 'No conversations match your search'}
              </p>
            </div>
          ) : (
            filteredConversations.map(conversation => (
              <button
                key={conversation.id}
                onClick={() => onSelectConversation(conversation.id)}
                className={`w-full flex items-start gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-left ${
                  selectedConversationId === conversation.id ? 'bg-accent' : ''
                }`}
              >
                <Avatar className='h-10 w-10 flex-shrink-0'>
                  <AvatarImage
                    src={conversation.participants[0]?.user.image || undefined}
                  />
                  <AvatarFallback>
                    {conversation.isGroup ? (
                      <Users className='h-5 w-5' />
                    ) : (
                      getConversationName(conversation).charAt(0).toUpperCase()
                    )}
                  </AvatarFallback>
                </Avatar>
                <div className='flex-1 min-w-0'>
                  <div className='flex items-center justify-between mb-1'>
                    <span className='font-medium text-sm truncate'>
                      {getConversationName(conversation)}
                    </span>
                    <span className='text-xs text-muted-foreground'>
                      {conversation.messages.length > 0
                        ? new Date(
                            conversation.messages[
                              conversation.messages.length - 1
                            ].createdAt,
                          ).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : ''}
                    </span>
                  </div>
                  <p className='text-sm text-muted-foreground truncate'>
                    {getLastMessage(conversation)}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>

      {/* New Chat Button */}
      <div className='p-4 border-t border-border'>
        <NewConversationDialog
          onConversationCreated={handleConversationCreated}
        >
          <Button className='w-full' variant='outline'>
            <Plus className='h-4 w-4 mr-2' />
            New Chat
          </Button>
        </NewConversationDialog>
      </div>
    </div>
  );
}

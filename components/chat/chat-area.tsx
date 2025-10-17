/* eslint-disable @next/next/no-img-element */
'use client';

import type React from 'react';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Send,
  Paperclip,
  MoreVertical,
  Phone,
  Video,
  FileIcon,
  Download,
} from 'lucide-react';
import type { Message, User } from '@/types/chat';
import { useWebSocket } from '@/hooks/use-websocket';
import { FileUploadDialog } from './file-upload-dialog';

interface ChatAreaProps {
  conversationId: string | null;
  currentUser: User;
}

export function ChatArea({ conversationId, currentUser }: ChatAreaProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messageIdCounterRef = useRef<number>(0);

  const ws = useWebSocket(currentUser.id);

  useEffect(() => {
    if (!conversationId) return;

    const unsubscribeMessage = ws.onMessage?.(message => {
      if (message.conversationId === conversationId) {
        setMessages(prev => [...prev, message]);
      }
    });

    const unsubscribeTyping = ws.onTyping?.(status => {
      if (
        status.conversationId === conversationId &&
        status.userId !== currentUser.id
      ) {
        setIsTyping(status.isTyping);
      }
    });

    ws.joinConversation?.(conversationId);

    return () => {
      unsubscribeMessage?.();
      unsubscribeTyping?.();
      ws.leaveConversation?.(conversationId);
    };
  }, [conversationId, currentUser.id, ws]);

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    // Clear messages and reset counter when conversation changes
    messageIdCounterRef.current = 0;
    setMessages([]);

    // Load mock messages for demo
    if (conversationId === '1') {
      const mockMessages: Message[] = [
        {
          id: 'mock-conv1-msg1',
          content: 'Hey! How are you?',
          conversationId: '1',
          senderId: 'u1',
          sender: {
            id: 'u1',
            email: 'alice@example.com',
            name: 'Alice Johnson',
            image: null,
          },
          createdAt: new Date(Date.now() - 3600000),
          updatedAt: new Date(Date.now() - 3600000),
        },
        {
          id: 'mock-conv1-msg2',
          content: "I'm doing great! Just working on the new project.",
          conversationId: '1',
          senderId: currentUser.id,
          sender: currentUser,
          createdAt: new Date(Date.now() - 3000000),
          updatedAt: new Date(Date.now() - 3000000),
        },
        {
          id: 'mock-conv1-msg3',
          content: 'That sounds exciting! Tell me more about it.',
          conversationId: '1',
          senderId: 'u1',
          sender: {
            id: 'u1',
            email: 'alice@example.com',
            name: 'Alice Johnson',
            image: null,
          },
          createdAt: new Date(Date.now() - 1800000),
          updatedAt: new Date(Date.now() - 1800000),
        },
      ];
      setMessages(mockMessages);
    } else if (conversationId === '2') {
      const mockMessages: Message[] = [
        {
          id: 'mock-conv2-msg1',
          content: "Let's schedule a meeting for tomorrow",
          conversationId: '2',
          senderId: 'u2',
          sender: {
            id: 'u2',
            email: 'bob@example.com',
            name: 'Bob Smith',
            image: null,
          },
          createdAt: new Date(Date.now() - 7200000),
          updatedAt: new Date(Date.now() - 7200000),
        },
        {
          id: 'mock-conv2-msg2',
          content: 'Sounds good! What time works for everyone?',
          conversationId: '2',
          senderId: 'u3',
          sender: {
            id: 'u3',
            email: 'carol@example.com',
            name: 'Carol White',
            image: null,
          },
          createdAt: new Date(Date.now() - 3600000),
          updatedAt: new Date(Date.now() - 3600000),
        },
      ];
      setMessages(mockMessages);
    }
  }, [conversationId, currentUser]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);

    if (conversationId) {
      ws.sendTypingStatus?.(conversationId, true);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        ws.sendTypingStatus?.(conversationId, false);
      }, 1000);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversationId) return;

    messageIdCounterRef.current++;
    const message: Message = {
      id: `msg-${conversationId}-${messageIdCounterRef.current}`,
      content: newMessage,
      conversationId,
      senderId: currentUser.id,
      sender: currentUser,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setMessages([...messages, message]);
    ws.sendMessage?.(conversationId, newMessage, {
      id: message.id,
      sender: currentUser,
    });
    setNewMessage('');

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    ws.sendTypingStatus?.(conversationId, false);
  };

  const handleFileUpload = (file: File, caption: string) => {
    if (!conversationId) return;

    messageIdCounterRef.current++;
    const message: Message = {
      id: `msg-${conversationId}-${messageIdCounterRef.current}`,
      content: caption || `Shared ${file.name}`,
      conversationId,
      senderId: currentUser.id,
      sender: currentUser,
      fileUrl: URL.createObjectURL(file),
      fileName: file.name,
      fileType: file.type,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setMessages([...messages, message]);
    ws.sendMessage?.(conversationId, message.content, {
      id: message.id,
      sender: currentUser,
      fileUrl: message.fileUrl,
      fileName: message.fileName,
      fileType: message.fileType,
    });
  };

  if (!conversationId) {
    return (
      <div className='flex-1 flex items-center justify-center bg-muted/30'>
        <div className='text-center'>
          <div className='w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4'>
            <Send className='h-8 w-8 text-primary' />
          </div>
          <h3 className='text-lg font-semibold mb-2'>Select a conversation</h3>
          <p className='text-muted-foreground'>
            Choose a conversation from the sidebar to start chatting
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='flex-1 flex flex-col'>
      {/* Chat Header */}
      <div className='h-16 border-b border-border flex items-center justify-between px-6 bg-card'>
        <div className='flex items-center gap-3'>
          <Avatar className='h-9 w-9'>
            <AvatarImage src={'/file.svg'} />
            <AvatarFallback>A</AvatarFallback>
          </Avatar>
          <div>
            <h2 className='font-semibold text-sm'>
              {conversationId === '1' ? 'Alice Johnson' : 'Project Team'}
            </h2>
            <p className='text-xs text-muted-foreground'>
              {isTyping
                ? 'typing...'
                : conversationId === '1'
                ? 'Online'
                : '3 members'}
            </p>
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <Button variant='ghost' size='icon'>
            <Phone className='h-4 w-4' />
          </Button>
          <Button variant='ghost' size='icon'>
            <Video className='h-4 w-4' />
          </Button>
          <Button variant='ghost' size='icon'>
            <MoreVertical className='h-4 w-4' />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className='flex-1 p-6' ref={scrollRef}>
        <div className='space-y-4'>
          {messages.map(message => {
            const isCurrentUser = message.senderId === currentUser.id;
            const hasFile = message.fileUrl && message.fileName;
            return (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  isCurrentUser ? 'flex-row-reverse' : ''
                }`}
              >
                {!isCurrentUser && (
                  <Avatar className='h-8 w-8 flex-shrink-0'>
                    <AvatarImage src={message.sender.image || undefined} />
                    <AvatarFallback>
                      {message.sender.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`flex flex-col ${
                    isCurrentUser ? 'items-end' : 'items-start'
                  } max-w-[70%]`}
                >
                  {!isCurrentUser && (
                    <span className='text-xs text-muted-foreground mb-1'>
                      {message.sender.name}
                    </span>
                  )}
                  <div
                    className={`rounded-2xl px-4 py-2 ${
                      isCurrentUser
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {hasFile && (
                      <div className='mb-2'>
                        {message.fileType?.startsWith('image/') ? (
                          <img
                            src={message.fileUrl || ''}
                            alt={message.fileName || ''}
                            className='max-w-full rounded-lg mb-2'
                          />
                        ) : (
                          <div className='flex items-center gap-2 p-2 bg-background/10 rounded-lg mb-2'>
                            <FileIcon className='h-5 w-5' />
                            <span className='text-sm flex-1'>
                              {message.fileName}
                            </span>
                            <Button
                              variant='ghost'
                              size='icon'
                              className='h-6 w-6'
                            >
                              <Download className='h-3 w-3' />
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                    <p className='text-sm'>{message.content}</p>
                  </div>
                  <span className='text-xs text-muted-foreground mt-1'>
                    {message.createdAt.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className='border-t border-border p-4 bg-card'>
        <form onSubmit={handleSendMessage} className='flex items-end gap-2'>
          <FileUploadDialog onUpload={handleFileUpload}>
            <Button
              type='button'
              variant='ghost'
              size='icon'
              className='flex-shrink-0'
            >
              <Paperclip className='h-5 w-5' />
            </Button>
          </FileUploadDialog>
          <div className='flex-1 relative'>
            <Input
              placeholder='Type a message...'
              value={newMessage}
              onChange={handleInputChange}
              className='pr-4'
            />
          </div>
          <Button
            type='submit'
            size='icon'
            disabled={!newMessage.trim()}
            className='flex-shrink-0'
          >
            <Send className='h-4 w-4' />
          </Button>
        </form>
      </div>
    </div>
  );
}

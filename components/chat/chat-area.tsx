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
import { MessageContextMenu } from './message-context-menu';
import { MessageEditInput } from './message-edit-input';
import { toast } from 'sonner';

interface ChatAreaProps {
  conversationId: string | null;
  currentUser: User;
}

export function ChatArea({ conversationId, currentUser }: ChatAreaProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const ws = useWebSocket(currentUser.id);

  // Fetch messages from database
  const fetchMessages = async () => {
    if (!conversationId) return;

    try {
      setIsLoadingMessages(true);
      const response = await fetch(
        `/api/conversations/${conversationId}/messages`,
      );
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Load messages when conversation changes
  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setEditingMessageId(null);
      return;
    }

    fetchMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  // Setup WebSocket listeners
  useEffect(() => {
    if (!conversationId) return;

    const unsubscribeMessage = ws.onMessage?.(incomingMessage => {
      if (incomingMessage.conversationId !== conversationId) return;

      setMessages(prev => {
        // Avoid duplicates
        if (prev.some(m => m.id === incomingMessage.id)) return prev;
        return [...prev, incomingMessage];
      });
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

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      setTimeout(() => {
        scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
      }, 0);
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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversationId) return;

    const messageContent = newMessage;
    setNewMessage('');

    try {
      const response = await fetch(
        `/api/conversations/${conversationId}/messages`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: messageContent,
          }),
        },
      );

      if (!response.ok) {
        toast.error('Failed to send message');
        setNewMessage(messageContent);
        return;
      }

      const sentMessage = await response.json();

      // Add to local state immediately
      setMessages(prev => {
        if (prev.some(m => m.id === sentMessage.id)) return prev;
        return [...prev, sentMessage];
      });

      // Send via WebSocket for real-time updates
      ws.sendMessage?.(conversationId, messageContent, {
        id: sentMessage.id,
        sender: currentUser,
      });

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      ws.sendTypingStatus?.(conversationId, false);
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
      setNewMessage(messageContent);
    }
  };

  const handleEditMessage = (message: Message) => {
    setEditingMessageId(message.id);
  };

  const handleSaveEdit = (newContent: string) => {
    setMessages(prev =>
      prev.map(msg =>
        msg.id === editingMessageId
          ? {
              ...msg,
              content: newContent,
              isEdited: true,
              editedAt: new Date(),
            }
          : msg,
      ),
    );
    setEditingMessageId(null);
  };

  const handleDeleteMessage = (messageId: string) => {
    setMessages(prev =>
      prev.map(msg =>
        msg.id === messageId
          ? {
              ...msg,
              content: '[This message was deleted]',
              deletedAt: new Date(),
            }
          : msg,
      ),
    );
  };

  const handleFileUpload = async (file: File, caption: string) => {
    if (!conversationId) return;

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('caption', caption);

      const uploadResponse = await fetch(
        `/api/conversations/${conversationId}/messages`,
        {
          method: 'POST',
          body: formData,
        },
      );

      if (!uploadResponse.ok) {
        toast.error('Failed to upload file');
        return;
      }

      const sentMessage = await uploadResponse.json();

      setMessages(prev => {
        if (prev.some(m => m.id === sentMessage.id)) return prev;
        return [...prev, sentMessage];
      });

      ws.sendMessage?.(conversationId, sentMessage.content, {
        id: sentMessage.id,
        sender: currentUser,
        fileUrl: sentMessage.fileUrl,
        fileName: sentMessage.fileName,
        fileType: sentMessage.fileType,
      });
    } catch (error) {
      console.error('Failed to upload file:', error);
      toast.error('Failed to upload file');
    }
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
            <AvatarFallback>C</AvatarFallback>
          </Avatar>
          <div>
            <h2 className='font-semibold text-sm'>
              {conversationId === '1'
                ? 'Alice Johnson'
                : conversationId === '2'
                ? 'Project Team'
                : 'Chat'}
            </h2>
            <p className='text-xs text-muted-foreground'>
              {isTyping ? 'typing...' : 'Online'}
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
          {isLoadingMessages ? (
            <div className='flex items-center justify-center py-8'>
              <p className='text-sm text-muted-foreground'>
                Loading messages...
              </p>
            </div>
          ) : messages.length === 0 ? (
            <div className='flex items-center justify-center py-8'>
              <p className='text-sm text-muted-foreground'>
                No messages yet. Start the conversation!
              </p>
            </div>
          ) : (
            messages.map(message => {
              const isCurrentUser = message.senderId === currentUser.id;
              const hasFile = message.fileUrl && message.fileName;
              const isDeleted =
                message.content === '[This message was deleted]';
              const isEditing = editingMessageId === message.id;

              return (
                <div
                  key={message.id}
                  className={`flex gap-3 group ${
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

                    {isEditing ? (
                      <MessageEditInput
                        messageId={message.id}
                        conversationId={conversationId}
                        initialContent={message.content}
                        onSave={handleSaveEdit}
                        onCancel={() => setEditingMessageId(null)}
                      />
                    ) : (
                      <div className='flex gap-2 items-start'>
                        <div
                          className={`rounded-2xl px-4 py-2 ${
                            isCurrentUser
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          } ${isDeleted ? 'italic opacity-50' : ''}`}
                        >
                          {hasFile && !isDeleted && (
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
                                    className='h-6 w-6 p-0'
                                  >
                                    <Download className='h-3 w-3' />
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}
                          <p className='text-sm'>{message.content}</p>
                        </div>

                        {!isDeleted && (
                          <MessageContextMenu
                            message={message}
                            currentUser={currentUser}
                            onEdit={handleEditMessage}
                            onDelete={handleDeleteMessage}
                            isEditing={isEditing}
                          />
                        )}
                      </div>
                    )}

                    <div className='flex gap-2 text-xs text-muted-foreground mt-1'>
                      <span>
                        {new Date(message.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {message.isEdited && <span>(edited)</span>}
                    </div>
                  </div>
                </div>
              );
            })
          )}
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

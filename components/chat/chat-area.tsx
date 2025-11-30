/* eslint-disable @typescript-eslint/no-explicit-any */
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
  Phone,
  Video,
  MoreVertical,
  FileIcon,
  Download,
  Smile,
} from 'lucide-react';
import type { Message, User, QuotedMessage } from '@/types/chat';
import { useWebSocket } from '@/hooks/use-websocket';
import { FileUploadDialog } from './file-upload-dialog';
import { MessageContextMenu } from './message-context-menu';
import { MessageEditInput } from './message-edit-input';
import { MessageReactions } from './message-reactions';
import { QuotedMessagePreview } from './quoted-message-preview';
import { QuotedMessageDisplay } from './quoted-message-display';
import { MessageReplyButton } from './message-reply-button';
import { toast } from 'sonner';

interface ChatAreaProps {
  conversationId: string | null;
  currentUser: User;
}

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

export function ChatArea({ conversationId, currentUser }: ChatAreaProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [quotedMessage, setQuotedMessage] = useState<QuotedMessage | null>(
    null,
  );
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const ws = useWebSocket(currentUser.id);

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
      toast.error('Failed to load messages');
    } finally {
      setIsLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setEditingMessageId(null);
      setQuotedMessage(null);
      return;
    }

    fetchMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId) return;

    const unsubscribeMessage = ws.onMessage?.(incomingMessage => {
      if (incomingMessage.conversationId !== conversationId) return;

      setMessages(prev => {
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
    const replyingTo = quotedMessage;
    setNewMessage('');
    setQuotedMessage(null);

    try {
      const quotedMsg = replyingTo
        ? messages.find(
            m =>
              m.sender.name === replyingTo.senderName &&
              m.content === replyingTo.content,
          )
        : null;

      const response = await fetch(
        `/api/conversations/${conversationId}/messages`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: messageContent,
            quotedMessageId: quotedMsg?.id || null,
          }),
        },
      );

      if (!response.ok) {
        toast.error('Failed to send message');
        setNewMessage(messageContent);
        setQuotedMessage(replyingTo);
        return;
      }

      const sentMessage = await response.json();

      setMessages(prev => {
        if (prev.some(m => m.id === sentMessage.id)) return prev;
        return [...prev, sentMessage];
      });

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      ws.sendTypingStatus?.(conversationId, false);
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
      setNewMessage(messageContent);
      setQuotedMessage(replyingTo);
    }
  };

  const handleReplyClick = (message: Message) => {
    setQuotedMessage({
      id: message.id,
      content: message.content,
      senderName: message.sender.name || 'Unknown User',
      senderId: message.senderId,
    });
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
      if (quotedMessage) {
        const quotedMsg = messages.find(
          m =>
            m.sender.name === quotedMessage.senderName &&
            m.content === quotedMessage.content,
        );
        if (quotedMsg) {
          formData.append('quotedMessageId', quotedMsg.id);
        }
      }

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

      setQuotedMessage(null);
    } catch (error) {
      console.error('Failed to upload file:', error);
      toast.error('Failed to upload file');
    }
  };

  const handleQuickReaction = async (messageId: string, emoji: string) => {
    if (!conversationId) return;

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
        toast.error('Failed to add reaction');
        return;
      }

      const data = await response.json();
      const groupedReactions = data.reactions.reduce(
        (acc: Record<string, any>, reaction: any) => {
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
        {} as Record<string, any>,
      );

      setMessages(prev =>
        prev.map(m =>
          m.id === messageId ? { ...m, reactions: groupedReactions } : m,
        ),
      );

      setShowEmojiPicker(null);
      toast.success('Reaction added');
    } catch (error) {
      console.error('Reaction error:', error);
      toast.error('Failed to add reaction');
    }
  };

  if (!conversationId) {
    return (
      <div className='flex-1 flex items-center justify-center bg-gradient-to-br from-background to-muted/20'>
        <div className='text-center'>
          <div className='w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6'>
            <Send className='h-10 w-10 text-primary/60' />
          </div>
          <h3 className='text-2xl font-bold mb-2'>Select a conversation</h3>
          <p className='text-muted-foreground text-lg'>
            Choose a chat from the sidebar to start messaging
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='flex-1 flex flex-col h-full bg-background chat-messages-area'>
      {/* Chat Header */}
      <div className='h-16 border-b border-border/50 flex items-center justify-between px-6 bg-card/50 backdrop-blur-sm flex-shrink-0'>
        <div className='flex items-center gap-3'>
          <Avatar className='h-10 w-10 ring-2 ring-primary/20'>
            <AvatarImage src={'/file.svg'} />
            <AvatarFallback>C</AvatarFallback>
          </Avatar>
          <div>
            <h2 className='font-semibold text-base'>
              {conversationId === '1'
                ? 'Alice Johnson'
                : conversationId === '2'
                ? 'Project Team'
                : 'Chat'}
            </h2>
            <p className='text-xs text-muted-foreground'>
              {isTyping ? (
                <span className='flex items-center gap-1'>
                  typing
                  <span className='flex gap-0.5'>
                    <span className='w-1 h-1 bg-muted-foreground rounded-full animate-bounce' />
                    <span className='w-1 h-1 bg-muted-foreground rounded-full animate-bounce delay-100' />
                    <span className='w-1 h-1 bg-muted-foreground rounded-full animate-bounce delay-200' />
                  </span>
                </span>
              ) : (
                'Online'
              )}
            </p>
          </div>
        </div>
        <div className='flex items-center gap-1'>
          <Button variant='ghost' size='icon' className='hover:bg-accent'>
            <Phone className='h-4 w-4' />
          </Button>
          <Button variant='ghost' size='icon' className='hover:bg-accent'>
            <Video className='h-4 w-4' />
          </Button>
          <Button variant='ghost' size='icon' className='hover:bg-accent'>
            <MoreVertical className='h-4 w-4' />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className='flex-1 min-h-0 p-6 scroll-smooth' ref={scrollRef}>
        <div className='space-y-3 max-w-4xl mx-auto'>
          {isLoadingMessages ? (
            <div className='flex items-center justify-center py-12'>
              <p className='text-sm text-muted-foreground'>
                Loading messages...
              </p>
            </div>
          ) : messages.length === 0 ? (
            <div className='flex items-center justify-center py-12'>
              <p className='text-sm text-muted-foreground'>
                No messages yet. Start the conversation!
              </p>
            </div>
          ) : (
            messages.map((message, index) => {
              const isCurrentUser = message.senderId === currentUser.id;
              const hasFile = message.fileUrl && message.fileName;
              const isDeleted =
                message.content === '[This message was deleted]';
              const isEditing = editingMessageId === message.id;
              const prevMessage = index > 0 ? messages[index - 1] : null;
              const showAvatar =
                !prevMessage ||
                prevMessage.senderId !== message.senderId ||
                new Date(message.createdAt).getTime() -
                  new Date(prevMessage.createdAt).getTime() >
                  60000;

              return (
                <div
                  key={message.id}
                  className={`flex gap-3 group ${
                    isCurrentUser ? 'flex-row-reverse' : ''
                  } animate-slide-up`}
                  onMouseEnter={() => setHoveredMessageId(message.id)}
                  onMouseLeave={() => setHoveredMessageId(null)}
                >
                  {!isCurrentUser && (
                    <div className='flex-shrink-0 w-8 h-8'>
                      {showAvatar ? (
                        <Avatar className='h-8 w-8'>
                          <AvatarImage
                            src={message.sender.image || undefined}
                          />
                          <AvatarFallback>
                            {message.sender.name?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className='w-8' />
                      )}
                    </div>
                  )}

                  <div
                    className={`flex flex-col ${
                      isCurrentUser ? 'items-end' : 'items-start'
                    } max-w-xs lg:max-w-md gap-1`}
                  >
                    {showAvatar && !isCurrentUser && (
                      <span className='text-xs font-medium text-muted-foreground px-3 mb-0.5'>
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
                      <div
                        className={`rounded-2xl px-4 py-2.5 ${
                          isCurrentUser
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md hover:shadow-lg'
                            : 'bg-slate-100 dark:bg-slate-800 text-foreground shadow-sm hover:shadow-md'
                        } transition-all ${
                          isDeleted ? 'italic opacity-60' : ''
                        }`}
                      >
                        {message.quotedMessage && !isDeleted && (
                          <QuotedMessageDisplay
                            quotedMessage={message.quotedMessage}
                          />
                        )}

                        {hasFile && !isDeleted && (
                          <div className='mb-2'>
                            {message.fileType?.startsWith('image/') ? (
                              <img
                                src={message.fileUrl || ''}
                                alt={message.fileName || ''}
                                className='max-w-full max-h-64 rounded-lg mb-2'
                              />
                            ) : (
                              <div className='flex items-center gap-2 p-2 bg-white/10 dark:bg-black/20 rounded-lg mb-2'>
                                <FileIcon className='h-5 w-5 flex-shrink-0' />
                                <span className='text-sm flex-1 truncate'>
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
                        <p className='text-sm leading-relaxed break-words'>
                          {message.content}
                        </p>
                      </div>
                    )}

                    {!isDeleted && (
                      <MessageReactions
                        messageId={message.id}
                        conversationId={conversationId}
                        reactions={message.reactions || {}}
                        onReactionAdded={updatedReactions => {
                          setMessages(prev =>
                            prev.map(m =>
                              m.id === message.id
                                ? { ...m, reactions: updatedReactions }
                                : m,
                            ),
                          );
                        }}
                      />
                    )}

                    {!isDeleted && (
                      <div
                        className={`flex gap-1 items-center mt-1.5 ${
                          isCurrentUser ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div className='relative'>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='h-7 w-7'
                            onClick={() =>
                              setShowEmojiPicker(
                                showEmojiPicker === message.id
                                  ? null
                                  : message.id,
                              )
                            }
                          >
                            <Smile className='h-3.5 w-3.5' />
                          </Button>
                          {showEmojiPicker === message.id && (
                            <div
                              className={`absolute top-full mt-2 ${
                                isCurrentUser ? 'right-0' : 'left-0'
                              } bg-card border border-border rounded-lg p-2 shadow-lg flex gap-1 z-50`}
                            >
                              {QUICK_REACTIONS.map(emoji => (
                                <button
                                  key={emoji}
                                  onClick={() =>
                                    handleQuickReaction(message.id, emoji)
                                  }
                                  className='text-xl hover:scale-125 transition-transform hover:bg-accent p-1 rounded'
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <MessageReplyButton
                          onReply={() => handleReplyClick(message)}
                        />
                        <MessageContextMenu
                          message={message}
                          currentUser={currentUser}
                          onEdit={handleEditMessage}
                          onDelete={handleDeleteMessage}
                          isEditing={isEditing}
                        />
                      </div>
                    )}

                    <div
                      className={`flex gap-2 text-xs text-muted-foreground ${
                        isCurrentUser ? 'flex-row-reverse' : ''
                      }`}
                    >
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
      <div className='border-t border-border/50 p-4 bg-card/50 backdrop-blur-sm flex-shrink-0 chat-input-area'>
        {quotedMessage && (
          <QuotedMessagePreview
            quotedMessage={quotedMessage}
            onRemove={() => setQuotedMessage(null)}
          />
        )}

        <form
          onSubmit={handleSendMessage}
          className='flex items-end gap-2 mb-4'
        >
          <FileUploadDialog onUpload={handleFileUpload}>
            <Button
              type='button'
              variant='ghost'
              size='icon'
              className='flex-shrink-0 hover:bg-accent'
            >
              <Paperclip className='h-5 w-5' />
            </Button>
          </FileUploadDialog>
          <div className='flex-1'>
            <Input
              placeholder='Type a message...'
              value={newMessage}
              onChange={handleInputChange}
              className='rounded-full px-4 bg-muted/50 border-border/50 focus-visible:ring-primary/50'
            />
          </div>
          <Button
            type='submit'
            size='icon'
            disabled={!newMessage.trim()}
            className='flex-shrink-0 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
          >
            <Send className='h-4 w-4' />
          </Button>
        </form>
      </div>
    </div>
  );
}

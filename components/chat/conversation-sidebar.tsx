"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageSquare, Plus, Search, LogOut, Users } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { signOut } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import type { Conversation, User } from "@/types/chat"

interface ConversationSidebarProps {
  selectedConversationId: string | null
  onSelectConversation: (id: string) => void
  currentUser: User
}

export function ConversationSidebar({
  selectedConversationId,
  onSelectConversation,
  currentUser,
}: ConversationSidebarProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [conversations, setConversations] = useState<Conversation[]>([])

  // Mock conversations for demo
  useEffect(() => {
    const mockConversations: Conversation[] = [
      {
        id: "1",
        name: null,
        isGroup: false,
        participants: [
          {
            id: "p1",
            conversationId: "1",
            userId: "u1",
            user: {
              id: "u1",
              email: "alice@example.com",
              name: "Alice Johnson",
              image: null,
            },
            joinedAt: new Date(),
          },
        ],
        messages: [
          {
            id: "m1",
            content: "Hey! How are you?",
            conversationId: "1",
            senderId: "u1",
            sender: {
              id: "u1",
              email: "alice@example.com",
              name: "Alice Johnson",
              image: null,
            },
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "2",
        name: "Project Team",
        isGroup: true,
        participants: [
          {
            id: "p2",
            conversationId: "2",
            userId: "u2",
            user: {
              id: "u2",
              email: "bob@example.com",
              name: "Bob Smith",
              image: null,
            },
            joinedAt: new Date(),
          },
          {
            id: "p3",
            conversationId: "2",
            userId: "u3",
            user: {
              id: "u3",
              email: "carol@example.com",
              name: "Carol White",
              image: null,
            },
            joinedAt: new Date(),
          },
        ],
        messages: [
          {
            id: "m2",
            content: "Let's schedule a meeting for tomorrow",
            conversationId: "2",
            senderId: "u2",
            sender: {
              id: "u2",
              email: "bob@example.com",
              name: "Bob Smith",
              image: null,
            },
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]
    setConversations(mockConversations)
  }, [])

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
  }

  const getConversationName = (conversation: Conversation) => {
    if (conversation.isGroup) {
      return conversation.name || "Group Chat"
    }
    const otherParticipant = conversation.participants.find((p) => p.userId !== currentUser.id)
    return otherParticipant?.user.name || "Unknown User"
  }

  const getLastMessage = (conversation: Conversation) => {
    const lastMessage = conversation.messages[conversation.messages.length - 1]
    return lastMessage?.content || "No messages yet"
  }

  const filteredConversations = conversations.filter((conv) =>
    getConversationName(conv).toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="w-80 border-r border-border flex flex-col bg-card">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <span className="font-semibold">ChatFlow</span>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {filteredConversations.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => onSelectConversation(conversation.id)}
              className={`w-full flex items-start gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-left ${
                selectedConversationId === conversation.id ? "bg-accent" : ""
              }`}
            >
              <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarImage src={conversation.participants[0]?.user.image || undefined} />
                <AvatarFallback>
                  {conversation.isGroup ? (
                    <Users className="h-5 w-5" />
                  ) : (
                    getConversationName(conversation).charAt(0).toUpperCase()
                  )}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm truncate">{getConversationName(conversation)}</span>
                  <span className="text-xs text-muted-foreground">2m</span>
                </div>
                <p className="text-sm text-muted-foreground truncate">{getLastMessage(conversation)}</p>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>

      {/* New Chat Button */}
      <div className="p-4 border-t border-border">
        <Button className="w-full bg-transparent" variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      </div>
    </div>
  )
}

"use client"

import { useState } from "react"
import { ConversationSidebar } from "./conversation-sidebar"
import { ChatArea } from "./chat-area"
import { useSession } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export function ChatLayout() {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)

  if (isPending) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!session) {
    router.push("/sign-in")
    return null
  }

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      <ConversationSidebar
        selectedConversationId={selectedConversationId}
        onSelectConversation={setSelectedConversationId}
        currentUser={session.user}
      />
      <ChatArea conversationId={selectedConversationId} currentUser={session.user} />
    </div>
  )
}

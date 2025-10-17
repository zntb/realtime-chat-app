export interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
}

export interface Message {
  id: string;
  content: string;
  conversationId: string;
  senderId: string;
  sender: User;
  fileUrl?: string | null;
  fileName?: string | null;
  fileType?: string | null;
  isEdited: boolean;
  editedAt?: Date | null;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Conversation {
  id: string;
  name: string | null;
  isGroup: boolean;
  participants: ConversationParticipant[];
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationParticipant {
  id: string;
  conversationId: string;
  userId: string;
  user: User;
  joinedAt: Date;
}

export interface TypingStatus {
  conversationId: string;
  userId: string;
  isTyping: boolean;
}

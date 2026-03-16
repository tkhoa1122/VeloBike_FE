import { User } from './User';
import { Listing } from './Listing';

export interface Conversation {
  _id: string;
  participants: string[]; // Array of User IDs
  listingId?: string | Listing; // Context listing being discussed
  
  // Metadata
  type: 'DIRECT' | 'SUPPORT' | 'GROUP';
  title?: string; // For group conversations
  
  // Last message info for listing
  lastMessage?: {
    content: string;
    senderId: string;
    sentAt: Date;
    type: MessageType;
  };
  
  // Status
  isActive: boolean;
  
  // Read status per participant
  readStatus: Record<string, Date>; // userId -> lastReadAt
  
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  _id: string;
  conversationId: string;
  senderId: string | User;
  receiverId: string | User;
  
  // Content
  content: string;
  type: MessageType;
  
  // Attachments
  attachments?: MessageAttachment[];
  
  // Reply/Thread
  replyToMessageId?: string;
  
  // Status tracking
  status: MessageStatus;
  deliveredAt?: Date;
  readAt?: Date;
  
  // Special message types
  systemMessage?: SystemMessageData;
  
  sentAt: Date;
  editedAt?: Date;
}

export type MessageType = 
  | 'TEXT'           // Regular text
  | 'IMAGE'          // Image with optional caption
  | 'VIDEO'          // Video with optional caption
  | 'AUDIO'          // Voice message
  | 'DOCUMENT'       // PDF, etc.
  | 'LOCATION'       // Shared location
  | 'LISTING_SHARE'  // Shared listing
  | 'SYSTEM'         // System generated message
  | 'STICKER'        // Emoji/sticker
  | 'CONTACT'        // Contact card
  ;

export type MessageStatus = 
  | 'SENDING'    // Being sent
  | 'SENT'       // Delivered to server
  | 'DELIVERED'  // Delivered to recipient device
  | 'READ'       // Read by recipient
  | 'FAILED'     // Failed to send
  ;

export interface MessageAttachment {
  type: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT';
  url: string;
  filename: string;
  size: number; // bytes
  mimeType: string;
  
  // For images/videos
  dimensions?: {
    width: number;
    height: number;
  };
  
  // Thumbnail for videos/documents
  thumbnailUrl?: string;
  
  // For audio
  duration?: number; // seconds
}

export interface SystemMessageData {
  type: 'ORDER_CREATED' | 'ORDER_STATUS_CHANGED' | 'LISTING_SOLD' | 'INSPECTION_SCHEDULED' | 'PAYMENT_RECEIVED';
  data: Record<string, any>; // Associated data
  
  // UI display
  template: string; // Template for rendering
  action?: {
    label: string;
    url: string;
    type: 'INTERNAL' | 'EXTERNAL';
  };
}

// For sending messages
export interface SendMessageData {
  conversationId?: string; // If not provided, will find/create conversation
  receiverId: string;
  content: string;
  type: MessageType;
  attachments?: {
    type: MessageAttachment['type'];
    url: string;
    filename: string;
  }[];
  replyToMessageId?: string;
  
  // Context (for creating conversation if needed)
  listingId?: string;
}

// For conversation queries
export interface ConversationFilters {
  type?: Conversation['type'];
  hasUnread?: boolean;
  listingId?: string;
  participantId?: string;
}

export interface ConversationSearchParams {
  filters?: ConversationFilters;
  sort?: {
    field: 'updatedAt' | 'createdAt' | 'lastMessageAt';
    order: 'asc' | 'desc';
  };
  page: number;
  limit: number;
}

// For message queries
export interface MessageFilters {
  conversationId: string;
  type?: MessageType;
  fromDate?: Date;
  toDate?: Date;
  senderId?: string;
  hasAttachments?: boolean;
}

export interface MessageSearchParams {
  filters: MessageFilters;
  sort?: {
    field: 'sentAt';
    order: 'asc' | 'desc';
  };
  page: number;
  limit: number;
}

// Real-time events
export interface TypingIndicator {
  conversationId: string;
  userId: string;
  isTyping: boolean;
}

export interface MessageDeliveryStatus {
  messageId: string;
  status: MessageStatus;
  timestamp: Date;
}

// Chatbot specific
export interface ChatbotConversation {
  _id: string;
  userId: string;
  
  messages: ChatbotMessage[];
  
  // Context for AI
  context: {
    userQueries: string[];
    userProfile?: {
      height?: number;
      weight?: number;
      experienceLevel?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
      preferences?: string[];
    };
    currentListingContext?: string; // If user is asking about specific listing
  };
  
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatbotMessage {
  id?: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  timestamp: Date;
  
  // For assistant responses
  confidence?: number; // 0-1
  suggestedActions?: ChatbotAction[];
  
  // For tracking
  wasHelpful?: boolean;
}

export interface ChatbotAction {
  type: 'VIEW_LISTING' | 'SEARCH_LISTINGS' | 'CONTACT_SELLER' | 'START_ORDER' | 'BOOK_INSPECTION';
  label: string;
  data: Record<string, any>;
}

export interface SendChatbotMessageData {
  message: string;
  context?: {
    listingId?: string;
    userProfile?: ChatbotConversation['context']['userProfile'];
  };
}
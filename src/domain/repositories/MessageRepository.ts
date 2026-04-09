import { 
  Conversation, 
  Message, 
  SendMessageData,
  ConversationSearchParams,
  MessageSearchParams,
  ChatbotConversation,
  SendChatbotMessageData,
  ChatbotListingItem,
} from '../entities/Message';
import { ApiResponse, PaginatedResponse } from '../entities/Common';

export interface MessageRepository {
  // Conversations
  getConversations(params?: ConversationSearchParams): Promise<PaginatedResponse<Conversation>>;
  getOrCreateConversation(userId: string, listingId?: string): Promise<ApiResponse<Conversation>>;
  getConversationById(id: string): Promise<ApiResponse<Conversation>>;
  
  // Messages
  sendMessage(data: SendMessageData): Promise<ApiResponse<Message>>;
  getMessages(params: MessageSearchParams): Promise<PaginatedResponse<Message>>;
  
  // Message status
  markMessageAsRead(messageId: string): Promise<ApiResponse>;
  markConversationAsRead(conversationId: string): Promise<ApiResponse>;
  
  // Typing indicators
  sendTypingIndicator(conversationId: string, isTyping: boolean): Promise<void>;
  
  // Message actions
  editMessage(messageId: string, newContent: string): Promise<ApiResponse<Message>>;
  deleteMessage(messageId: string): Promise<ApiResponse>;
  
  // File handling
  sendImage(conversationId: string, imageUrl: string, caption?: string): Promise<ApiResponse<Message>>;
  sendVideo(conversationId: string, videoUrl: string, caption?: string): Promise<ApiResponse<Message>>;
  sendAudio(conversationId: string, audioUrl: string, duration: number): Promise<ApiResponse<Message>>;
  
  // Chatbot
  sendChatbotMessage(
    data: SendChatbotMessageData,
  ): Promise<ApiResponse<{ reply: string; listings?: ChatbotListingItem[] }>>;
  getChatbotHistory(page?: number, limit?: number): Promise<PaginatedResponse<ChatbotConversation>>;
  
  // Real-time subscriptions
  subscribeToConversation(conversationId: string): void;
  unsubscribeFromConversation(conversationId: string): void;
  
  // Search
  searchMessages(query: string, conversationId?: string): Promise<ApiResponse<Message[]>>;
}
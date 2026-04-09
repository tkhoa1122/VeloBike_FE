import { BaseApiClient } from './BaseApiClient';
import { ENDPOINTS } from '../../config/api';
import { UserModel } from '../models/UserModel';

// Response models — BE: Conversation có buyerId + sellerId (populate), không có participants
export interface ConversationResponseModel {
  _id: string;
  participants?: (string | UserModel)[];
  buyerId?: string | UserModel;
  sellerId?: string | UserModel;
  listingId?: string | { _id?: string };
  orderId?: string | { _id?: string };
  lastMessage?: string | { content: string; timestamp: string; senderId?: string };
  lastMessageAt?: string;
  unreadCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface MessageResponseModel {
  _id: string;
  conversationId: string;
  senderId: string | UserModel;
  receiverId: string | UserModel;
  content: string;
  attachments?: string[];
  /** BE dùng createdAt; một số client cũ dùng timestamp */
  timestamp?: string;
  createdAt?: string;
  isRead?: boolean;
  readStatus?: 'SENT' | 'DELIVERED' | 'READ';
}

export interface ConversationListResponseModel {
  success: boolean;
  data: ConversationResponseModel[];
  totalPages?: number;
  currentPage?: number;
  message?: string;
}

export interface MessageListResponseModel {
  success: boolean;
  data: MessageResponseModel[];
  totalPages?: number;
  currentPage?: number;
  /** BE trả pagination.pages / pagination.page */
  pagination?: { total: number; page: number; limit: number; pages: number };
  message?: string;
}

export class MessageApiClient extends BaseApiClient {
  /**
   * Get or create conversation with a user
   */
  async getOrCreateConversation(
    userId: string,
    listingId?: string,
    orderId?: string,
  ): Promise<{ success: boolean; data: ConversationResponseModel }> {
    const params: Record<string, string> = {};
    if (listingId) params.listingId = listingId;
    if (orderId) params.orderId = orderId;
    return this.get(ENDPOINTS.MESSAGES.CONVERSATION(userId), params);
  }

  /**
   * Get all conversations
   */
  async getConversations(params?: {
    page?: number;
    limit?: number;
  }): Promise<ConversationListResponseModel> {
    return this.get(ENDPOINTS.MESSAGES.CONVERSATIONS, params);
  }

  /**
   * Send a message
   */
  async sendMessage(data: {
    conversationId: string;
    receiverId: string;
    content: string;
    attachments?: string[];
  }): Promise<{ success: boolean; data: MessageResponseModel }> {
    return this.post(ENDPOINTS.MESSAGES.SEND, data);
  }

  /**
   * Get messages in a conversation
   */
  async getMessages(
    conversationId: string,
    params?: { page?: number; limit?: number },
  ): Promise<MessageListResponseModel> {
    return this.get(ENDPOINTS.MESSAGES.LIST(conversationId), params);
  }

  /**
   * Mark message as read
   */
  async markAsRead(messageId: string): Promise<{ success: boolean; message: string }> {
    return this.put(ENDPOINTS.MESSAGES.MARK_READ(messageId));
  }

  /**
   * Get unread message summary
   */
  async getUnreadCount(): Promise<{ success: boolean; data?: { unreadCount: number } }> {
    return this.get('/messages/unread');
  }

  /**
   * Delete one message
   */
  async deleteMessage(messageId: string): Promise<{ success: boolean; message?: string }> {
    return this.delete(`/messages/${messageId}`);
  }

  /**
   * Close conversation
   */
  async closeConversation(conversationId: string): Promise<{ success: boolean; message?: string }> {
    return this.put(`/messages/conversation/${conversationId}/close`);
  }

  /**
   * Send chatbot message
   */
  async sendChatbotMessage(data: {
    message: string;
    context?: Record<string, any>;
  }): Promise<{
    success: boolean;
    reply?: string;
    /** BE VeloBike: kèm listing gợi ý (đắt nhất, tìm theo từ khóa, …) */
    listings?: Array<{
      id: string;
      title: string;
      price: number;
      image: string;
      url: string;
      brand?: string;
      model?: string;
      type?: string;
    }>;
    data?: { reply?: string };
    message?: string;
  }> {
    return this.post(ENDPOINTS.CHATBOT.MESSAGE, data);
  }

  /**
   * Get chatbot history
   */
  async getChatbotHistory(params?: { page?: number; limit?: number }): Promise<{ success: boolean; data: any[]; totalPages?: number; currentPage?: number }> {
    return this.get(ENDPOINTS.CHATBOT.HISTORY, params);
  }

  /** GET /chatbot/quota — hạn mức tin nhắn trong ngày (BE: protect) */
  async getChatbotQuota(): Promise<{
    success: boolean;
    data?: { remaining: number; unlimited: boolean; message?: string };
    message?: string;
  }> {
    return this.get(ENDPOINTS.CHATBOT.QUOTA);
  }
}

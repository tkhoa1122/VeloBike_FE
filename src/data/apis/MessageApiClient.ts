import { BaseApiClient } from './BaseApiClient';
import { ENDPOINTS } from '../../config/api';
import { UserModel } from '../models/UserModel';

// Response models
export interface ConversationResponseModel {
  _id: string;
  participants: (string | UserModel)[];
  listingId?: string;
  orderId?: string;
  lastMessage?: {
    content: string;
    timestamp: string;
    senderId?: string;
  };
  unreadCount: number;
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
  timestamp: string;
  readStatus: 'SENT' | 'DELIVERED' | 'READ';
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
  totalPages: number;
  currentPage: number;
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
}

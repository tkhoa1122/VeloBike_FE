import { MessageApiClient, ConversationResponseModel, MessageResponseModel } from '../apis/MessageApiClient';
import { ApiResponse, PaginatedResponse } from '../../domain/entities/Common';
import { ChatbotConversation, ChatbotMessage, SendChatbotMessageData } from '../../domain/entities/Message';

// Presentation-friendly models
export interface ConversationEntry {
  _id: string;
  participantId: string;
  participantName: string;
  participantAvatar?: string;
  listingId?: string;
  orderId?: string;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: number;
  isOnline?: boolean;
  createdAt: Date;
}

export interface MessageEntry {
  _id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  attachments?: string[];
  timestamp: Date;
  readStatus: 'SENT' | 'DELIVERED' | 'READ';
}

export class MessageRepositoryImpl {
  constructor(private messageApiClient: MessageApiClient) {}

  async getConversations(params?: {
    page?: number;
    limit?: number;
  }): Promise<{ success: boolean; data: ConversationEntry[] }> {
    try {
      const response = await this.messageApiClient.getConversations(params);
      if (response.success) {
        const entries = response.data.map(c => this.mapConversation(c));
        return { success: true, data: entries };
      }
      return { success: false, data: [] };
    } catch {
      return { success: false, data: [] };
    }
  }

  async getOrCreateConversation(
    userId: string,
    listingId?: string,
    orderId?: string,
  ): Promise<ApiResponse<ConversationEntry>> {
    try {
      const response = await this.messageApiClient.getOrCreateConversation(userId, listingId, orderId);
      if (response.success) {
        return {
          success: true,
          data: this.mapConversation(response.data),
          message: 'Conversation ready',
        };
      }
      return { success: false, message: 'Failed to get conversation' };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Failed to get conversation' };
    }
  }

  async getMessages(
    conversationId: string,
    params?: { page?: number; limit?: number },
  ): Promise<{ success: boolean; data: MessageEntry[]; totalPages: number; currentPage: number }> {
    try {
      const response = await this.messageApiClient.getMessages(conversationId, params);
      if (response.success) {
        const entries = response.data.map(m => this.mapMessage(m));
        return {
          success: true,
          data: entries,
          totalPages: response.totalPages,
          currentPage: response.currentPage,
        };
      }
      return { success: false, data: [], totalPages: 0, currentPage: 1 };
    } catch {
      return { success: false, data: [], totalPages: 0, currentPage: 1 };
    }
  }

  async sendMessage(data: {
    conversationId: string;
    receiverId: string;
    content: string;
    attachments?: string[];
  }): Promise<ApiResponse<MessageEntry>> {
    try {
      const response = await this.messageApiClient.sendMessage(data);
      if (response.success) {
        return {
          success: true,
          data: this.mapMessage(response.data),
          message: 'Message sent',
        };
      }
      return { success: false, message: 'Failed to send message' };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Failed to send message' };
    }
  }

  async markAsRead(messageId: string): Promise<ApiResponse> {
    try {
      return await this.messageApiClient.markAsRead(messageId);
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Failed to mark as read' };
    }
  }

  async sendChatbotMessage(data: SendChatbotMessageData): Promise<ApiResponse<{ reply: string }>> {
    try {
      const response = await this.messageApiClient.sendChatbotMessage(data);
      const reply = response.reply || response.data?.reply;

      if (response.success && reply) {
        return {
          success: true,
          data: { reply },
          message: 'Chatbot replied',
        };
      }

      return { success: false, message: 'Chatbot không phản hồi' };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Không thể gửi tin nhắn chatbot',
      };
    }
  }

  async getChatbotHistory(page: number = 1, limit: number = 50): Promise<PaginatedResponse<ChatbotConversation>> {
    try {
      const response = await this.messageApiClient.getChatbotHistory({ page, limit });
      const conversations = Array.isArray(response.data)
        ? response.data.map((item) => this.mapChatbotConversation(item))
        : [];

      return {
        success: response.success,
        data: conversations,
        page: response.currentPage ?? page,
        currentPage: response.currentPage ?? page,
        totalPages: response.totalPages ?? 1,
        count: conversations.length,
      };
    } catch {
      return {
        success: false,
        data: [],
        page,
        currentPage: page,
        totalPages: 0,
        count: 0,
      };
    }
  }

  // =========================================================================
  // MAPPERS
  // =========================================================================

  private mapConversation(model: ConversationResponseModel): ConversationEntry {
    // Determine the other participant (not current user)
    const otherParticipant = model.participants.find(p => typeof p === 'object') as any;
    
    return {
      _id: model._id,
      participantId: otherParticipant?._id || (typeof model.participants[0] === 'string' ? model.participants[0] : ''),
      participantName: otherParticipant?.fullName || 'User',
      participantAvatar: otherParticipant?.avatar,
      listingId: model.listingId,
      orderId: model.orderId,
      lastMessage: model.lastMessage?.content,
      lastMessageTime: model.lastMessage?.timestamp ? new Date(model.lastMessage.timestamp) : undefined,
      unreadCount: model.unreadCount,
      createdAt: new Date(model.createdAt),
    };
  }

  private mapMessage(model: MessageResponseModel): MessageEntry {
    return {
      _id: model._id,
      conversationId: model.conversationId,
      senderId: typeof model.senderId === 'string' ? model.senderId : (model.senderId as any)._id,
      receiverId: typeof model.receiverId === 'string' ? model.receiverId : (model.receiverId as any)._id,
      content: model.content,
      attachments: model.attachments,
      timestamp: new Date(model.timestamp),
      readStatus: model.readStatus,
    };
  }

  private mapChatbotConversation(model: any): ChatbotConversation {
    return {
      _id: String(model?._id || Date.now()),
      userId: String(model?.userId || ''),
      messages: Array.isArray(model?.messages)
        ? model.messages.map((message: any) => this.mapChatbotMessage(message))
        : [],
      context: {
        userQueries: Array.isArray(model?.context?.userQueries) ? model.context.userQueries : [],
        userProfile: model?.context?.userProfile,
        currentListingContext: model?.context?.currentListingContext,
      },
      isActive: Boolean(model?.isActive),
      createdAt: model?.createdAt ? new Date(model.createdAt) : new Date(),
      updatedAt: model?.updatedAt ? new Date(model.updatedAt) : new Date(),
    };
  }

  private mapChatbotMessage(model: any): ChatbotMessage {
    return {
      id: String(model?._id || model?.id || Date.now()),
      role: model?.role === 'USER' ? 'USER' : 'ASSISTANT',
      content: String(model?.content || ''),
      timestamp: model?.timestamp ? new Date(model.timestamp) : new Date(),
      confidence: typeof model?.confidence === 'number' ? model.confidence : undefined,
      suggestedActions: Array.isArray(model?.suggestedActions) ? model.suggestedActions : undefined,
      wasHelpful: typeof model?.wasHelpful === 'boolean' ? model.wasHelpful : undefined,
    };
  }
}

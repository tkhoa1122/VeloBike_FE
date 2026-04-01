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

function extractRefId(ref: unknown): string {
  if (ref == null) return '';
  if (typeof ref === 'string') return ref;
  if (typeof ref === 'object' && ref !== null && '_id' in ref) {
    const id = (ref as { _id?: unknown })._id;
    return id != null ? String(id) : '';
  }
  return '';
}

export class MessageRepositoryImpl {
  constructor(private messageApiClient: MessageApiClient) {}

  async getConversations(
    params?: {
      page?: number;
      limit?: number;
    },
    currentUserId?: string,
  ): Promise<{ success: boolean; data: ConversationEntry[] }> {
    try {
      const response = await this.messageApiClient.getConversations(params);
      if (response.success && response.data) {
        let uid = currentUserId ?? '';
        if (!uid) {
          uid = await this.messageApiClient.getUserIdFromStoredAccessToken();
        }
        const entries = response.data.map(c => this.mapConversation(c, uid));
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
    currentUserId?: string,
  ): Promise<ApiResponse<ConversationEntry>> {
    try {
      const response = await this.messageApiClient.getOrCreateConversation(userId, listingId, orderId);
      if (response.success && response.data) {
        let uid = currentUserId ?? '';
        if (!uid) {
          uid = await this.messageApiClient.getUserIdFromStoredAccessToken();
        }
        return {
          success: true,
          data: this.mapConversation(response.data, uid, userId),
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
      if (response.success && response.data) {
        const entries = response.data.map(m => this.mapMessage(m));
        const pg = response.pagination;
        const totalPages = response.totalPages ?? pg?.pages ?? 1;
        const currentPage = response.currentPage ?? pg?.page ?? 1;
        return {
          success: true,
          data: entries,
          totalPages,
          currentPage,
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

  /**
   * BE (VeloBike_BE): Conversation có buyerId + sellerId đã populate — giống WEB `mapBeConversationToFe`.
   * @param peerContactId userId của đối tác khi gọi GET /conversation/:userId — luôn map đúng dù AuthStore chưa có _id
   */
  private mapConversation(model: ConversationResponseModel, currentUserId: string, peerContactId?: string): ConversationEntry {
    const participants = model.participants;
    if (Array.isArray(participants) && participants.length > 0) {
      const otherParticipant = participants.find(p => typeof p === 'object') as { _id?: string; fullName?: string; avatar?: string } | undefined;
      const fallbackId =
        otherParticipant?._id ?? (typeof participants[0] === 'string' ? participants[0] : '');
      const lastMsg = model.lastMessage;
      const lastText = typeof lastMsg === 'string' ? lastMsg : lastMsg?.content;
      const lastTime =
        typeof lastMsg === 'object' && lastMsg?.timestamp
          ? new Date(lastMsg.timestamp)
          : model.lastMessageAt
            ? new Date(model.lastMessageAt)
            : undefined;
      return {
        _id: model._id,
        participantId: fallbackId,
        participantName: otherParticipant?.fullName || 'User',
        participantAvatar: otherParticipant?.avatar,
        listingId: typeof model.listingId === 'string' ? model.listingId : (model.listingId as { _id?: string } | undefined)?._id,
        orderId: typeof model.orderId === 'string' ? model.orderId : (model.orderId as { _id?: string } | undefined)?._id,
        lastMessage: lastText,
        lastMessageTime: lastTime,
        unreadCount: model.unreadCount ?? 0,
        createdAt: new Date(model.createdAt),
      };
    }

    const buyerRef = model.buyerId;
    const sellerRef = model.sellerId;
    const buyerId = extractRefId(buyerRef);
    const sellerId = extractRefId(sellerRef);

    let participantId = '';
    let otherObj: { fullName?: string; avatar?: string } | null = null;

    const peer = peerContactId != null && String(peerContactId).length > 0 ? String(peerContactId) : '';
    if (peer) {
      if (buyerId && peer === String(buyerId)) {
        participantId = String(buyerId);
        otherObj =
          typeof buyerRef === 'object' && buyerRef ? (buyerRef as { fullName?: string; avatar?: string }) : null;
      } else if (sellerId && peer === String(sellerId)) {
        participantId = String(sellerId);
        otherObj =
          typeof sellerRef === 'object' && sellerRef ? (sellerRef as { fullName?: string; avatar?: string }) : null;
      }
    }

    if (!participantId && currentUserId) {
      const isCurrentBuyer = String(buyerId) === String(currentUserId);
      participantId = isCurrentBuyer ? String(sellerId) : String(buyerId);
      const otherRef = isCurrentBuyer ? sellerRef : buyerRef;
      otherObj =
        typeof otherRef === 'object' && otherRef ? (otherRef as { fullName?: string; avatar?: string }) : null;
    }

    if (!participantId) {
      participantId = String(sellerId || buyerId || '');
      const otherRef = String(buyerId) === participantId ? buyerRef : sellerRef;
      otherObj =
        typeof otherRef === 'object' && otherRef ? (otherRef as { fullName?: string; avatar?: string }) : null;
    }

    const lastMsg = model.lastMessage;
    const lastText = typeof lastMsg === 'string' ? lastMsg : lastMsg?.content;
    const lastTime = model.lastMessageAt ? new Date(model.lastMessageAt) : undefined;

    return {
      _id: model._id,
      participantId,
      participantName: otherObj?.fullName || 'User',
      participantAvatar: otherObj?.avatar,
      listingId: typeof model.listingId === 'string' ? model.listingId : (model.listingId as { _id?: string } | undefined)?._id,
      orderId: typeof model.orderId === 'string' ? model.orderId : (model.orderId as { _id?: string } | undefined)?._id,
      lastMessage: lastText,
      lastMessageTime: lastTime,
      unreadCount: model.unreadCount ?? 0,
      createdAt: new Date(model.createdAt),
    };
  }

  /** BE Message: createdAt, isRead — không có timestamp/readStatus */
  private mapMessage(model: MessageResponseModel): MessageEntry {
    const tsRaw = model.timestamp ?? model.createdAt;
    const ts = tsRaw ? new Date(tsRaw) : new Date();
    let readStatus: MessageEntry['readStatus'] = 'DELIVERED';
    if (model.readStatus) {
      readStatus = model.readStatus;
    } else if (model.isRead === true) {
      readStatus = 'READ';
    } else if (model.isRead === false) {
      readStatus = 'SENT';
    }

    const convId =
      typeof model.conversationId === 'string'
        ? model.conversationId
        : String((model as { conversationId?: { toString?: () => string } }).conversationId);

    const senderRaw = typeof model.senderId === 'string' ? model.senderId : (model.senderId as { _id?: string })?._id;
    const receiverRaw =
      typeof model.receiverId === 'string' ? model.receiverId : (model.receiverId as { _id?: string })?._id;

    return {
      _id: model._id,
      conversationId: convId,
      senderId: String(senderRaw ?? ''),
      receiverId: String(receiverRaw ?? ''),
      content: model.content,
      attachments: model.attachments,
      timestamp: ts,
      readStatus,
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

import { create } from 'zustand';
import { LoadingState } from '../../domain/entities/Common';
import { container } from '../../di/Container';
import type { ConversationEntry, MessageEntry } from '../../data/repositories/MessageRepositoryImpl';
import type { ChatbotConversation, SendChatbotMessageData } from '../../domain/entities/Message';

interface MessageState {
  conversations: ConversationEntry[];
  currentMessages: MessageEntry[];
  loadingState: LoadingState;
  sendingState: LoadingState;
  error: string | null;

  // Actions
  getConversations: () => Promise<void>;
  getMessages: (conversationId: string, page?: number) => Promise<void>;
  sendMessage: (data: {
    conversationId: string;
    receiverId: string;
    content: string;
    attachments?: string[];
  }) => Promise<boolean>;
  sendChatbotMessage: (data: SendChatbotMessageData) => Promise<string | null>;
  getChatbotHistory: (page?: number, limit?: number) => Promise<ChatbotConversation[]>;
  markAsRead: (messageId: string) => Promise<void>;
  clearMessages: () => void;
  clearError: () => void;
}

export const useMessageStore = create<MessageState>((set, get) => ({
  conversations: [],
  currentMessages: [],
  loadingState: 'idle',
  sendingState: 'idle',
  error: null,

  getConversations: async (): Promise<void> => {
    set({ loadingState: 'loading', error: null });
    try {
      const repo = container().messageRepository;
      const result = await repo.getConversations();
      if (result.success) {
        set({ conversations: result.data, loadingState: 'success' });
      } else {
        set({ loadingState: 'error', error: 'Không thể tải cuộc trò chuyện' });
      }
    } catch (error) {
      set({ loadingState: 'error', error: error instanceof Error ? error.message : 'Lỗi tải tin nhắn' });
    }
  },

  getMessages: async (conversationId: string, page: number = 1): Promise<void> => {
    set({ loadingState: 'loading', error: null });
    try {
      const repo = container().messageRepository;
      const result = await repo.getMessages(conversationId, { page, limit: 50 });
      if (result.success) {
        set({ currentMessages: result.data, loadingState: 'success' });
      } else {
        set({ loadingState: 'error', error: 'Không thể tải tin nhắn' });
      }
    } catch (error) {
      set({ loadingState: 'error', error: error instanceof Error ? error.message : 'Lỗi tải tin nhắn' });
    }
  },

  sendMessage: async (data): Promise<boolean> => {
    set({ sendingState: 'loading' });
    try {
      const repo = container().messageRepository;
      const result = await repo.sendMessage(data);
      if (result.success && result.data) {
        set(s => ({
          currentMessages: [...s.currentMessages, result.data!],
          sendingState: 'success',
        }));
        return true;
      }
      set({ sendingState: 'error', error: result.message });
      return false;
    } catch (error) {
      set({ sendingState: 'error', error: error instanceof Error ? error.message : 'Không gửi được tin nhắn' });
      return false;
    }
  },

  sendChatbotMessage: async (data): Promise<string | null> => {
    try {
      const repo = container().messageRepository;
      const result = await repo.sendChatbotMessage(data);
      return result.success && result.data ? result.data.reply : null;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Không gửi được tin nhắn chatbot' });
      return null;
    }
  },

  getChatbotHistory: async (page: number = 1, limit: number = 50): Promise<ChatbotConversation[]> => {
    try {
      const repo = container().messageRepository;
      const result = await repo.getChatbotHistory(page, limit);
      return result.success && result.data ? result.data : [];
    } catch {
      return [];
    }
  },

  markAsRead: async (messageId: string): Promise<void> => {
    try {
      const repo = container().messageRepository;
      await repo.markAsRead(messageId);
    } catch {
      // silent fail
    }
  },

  clearMessages: () => set({ currentMessages: [], error: null }),
  clearError: () => set({ error: null }),
}));

// Selectors
export const useConversations = () => useMessageStore(s => s.conversations);
export const useCurrentMessages = () => useMessageStore(s => s.currentMessages);
export const useMessageLoading = () => useMessageStore(s => s.loadingState === 'loading');

import { create } from 'zustand';
import { Order, OrderSearchParams } from '../../domain/entities/Order';
import { LoadingState } from '../../domain/entities/Common';
import { container } from '../../di/Container';

interface OrderState {
  // State
  orders: Order[];
  currentOrder: Order | null;
  
  // Pagination
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasMore: boolean;
  
  // UI State
  loadingState: LoadingState;
  error: string | null;
  
  lastParams: OrderSearchParams | null;
  
  // Actions
  getMyOrders: (params: OrderSearchParams) => Promise<void>;
  loadMoreOrders: () => Promise<void>;
  getOrderById: (id: string) => Promise<Order | null>;
  confirmDelivery: (orderId: string) => Promise<boolean>;
  cancelOrder: (orderId: string, reason: string) => Promise<boolean>;
  clearOrders: () => void;
  clearError: () => void;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  currentOrder: null,
  currentPage: 1,
  totalPages: 1,
  totalCount: 0,
  hasMore: false,
  loadingState: 'idle',
  error: null,
  lastParams: null,

  getMyOrders: async (params: OrderSearchParams): Promise<void> => {
    set({ loadingState: 'loading', error: null, lastParams: params });
    try {
      const repo = container().orderRepository;
      const result = await repo.getMyOrders(params);
      if (result.success) {
        const data = result.data ?? [];
        const currentPage = result.page ?? result.currentPage ?? 1;
        const totalPages = result.totalPages ?? 1;
        set({
          orders: data,
          currentPage,
          totalPages,
          totalCount: result.count ?? data.length,
          hasMore: currentPage < totalPages,
          loadingState: 'success',
        });
      } else {
        set({ loadingState: 'error', error: result.message || 'Không thể tải danh sách đơn hàng' });
      }
    } catch (error) {
      set({ loadingState: 'error', error: error instanceof Error ? error.message : 'Lỗi khi tải đơn hàng' });
    }
  },

  loadMoreOrders: async (): Promise<void> => {
    const { lastParams, hasMore, loadingState, currentPage: currentPageState } = get();
    if (!hasMore || loadingState === 'loading' || !lastParams) return;
    
    const nextParams = { ...lastParams, page: currentPageState + 1 };
    set({ loadingState: 'loading' });
    try {
      const repo = container().orderRepository;
      const result = await repo.getMyOrders(nextParams);
      if (result.success) {
        const data = result.data ?? [];
        const currentPage = result.page ?? result.currentPage ?? currentPageState;
        const totalPages = result.totalPages ?? get().totalPages;
        set(s => ({
          orders: [...s.orders, ...data],
          currentPage,
          totalPages,
          hasMore: currentPage < totalPages,
          loadingState: 'success',
        }));
      } else {
        set({ loadingState: 'error', error: result.message });
      }
    } catch (error) {
      set({ loadingState: 'error', error: error instanceof Error ? error.message : 'Lỗi tải thêm' });
    }
  },

  getOrderById: async (id: string): Promise<Order | null> => {
    set({ loadingState: 'loading', error: null });
    try {
      const repo = container().orderRepository;
      const result = await repo.getOrderById(id);
      if (result.success && result.data) {
        set({ currentOrder: result.data, loadingState: 'success' });
        return result.data;
      }
      set({ loadingState: 'error', error: result.message });
      return null;
    } catch (error) {
      set({ loadingState: 'error', error: error instanceof Error ? error.message : 'Lỗi tải đơn hàng' });
      return null;
    }
  },

  confirmDelivery: async (orderId: string): Promise<boolean> => {
    try {
      const repo = container().orderRepository;
      const result = await repo.confirmDelivery(orderId);
      if (result.success) {
        set({ error: null });
        // Refresh orders
        const { lastParams } = get();
        if (lastParams) get().getMyOrders(lastParams);
      } else {
        set({ error: result.message || 'Không thể xác nhận đã nhận hàng' });
      }
      return result.success;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Không thể xác nhận đã nhận hàng' });
      return false;
    }
  },

  cancelOrder: async (orderId: string, reason: string): Promise<boolean> => {
    try {
      const repo = container().orderRepository;
      const result = await repo.cancelOrder(orderId, reason);
      if (result.success) {
        const { lastParams } = get();
        if (lastParams) get().getMyOrders(lastParams);
      }
      return result.success;
    } catch {
      return false;
    }
  },

  clearOrders: () => set({
    orders: [],
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasMore: false,
    lastParams: null,
    error: null,
  }),

  clearError: () => set({ error: null }),
}));

// Selectors
export const useOrders = () => useOrderStore(s => s.orders);
export const useCurrentOrder = () => useOrderStore(s => s.currentOrder);
export const useOrderLoading = () => useOrderStore(s => s.loadingState === 'loading');
export const useOrderError = () => useOrderStore(s => s.error);

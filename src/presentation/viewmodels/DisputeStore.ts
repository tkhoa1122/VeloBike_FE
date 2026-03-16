import { create } from 'zustand';
import { LoadingState } from '../../domain/entities/Common';
import { Dispute, CreateDisputeData, AddDisputeCommentData, DisputeSearchParams } from '../../domain/entities/Dispute';
import { container } from '../../di/Container';

interface DisputeState {
  // Dispute data
  disputes: Dispute[];
  currentDispute: Dispute | null;
  totalPages: number;
  currentPage: number;

  // States
  loadingState: LoadingState;
  error: string | null;

  // Actions
  createDispute: (data: CreateDisputeData) => Promise<boolean>;
  getMyDisputes: (params?: DisputeSearchParams) => Promise<void>;
  getDisputeById: (id: string) => Promise<void>;
  addComment: (data: AddDisputeCommentData) => Promise<boolean>;
  clearError: () => void;
  reset: () => void;
}

export const useDisputeStore = create<DisputeState>((set, get) => ({
  disputes: [],
  currentDispute: null,
  totalPages: 1,
  currentPage: 1,
  loadingState: 'idle',
  error: null,

  createDispute: async (data: CreateDisputeData): Promise<boolean> => {
    set({ loadingState: 'loading', error: null });
    try {
      const useCase = container().createDisputeUseCase;
      const result = await useCase.execute(data);

      if (result.success && result.data) {
        set((state) => ({
          disputes: [result.data!, ...state.disputes],
          loadingState: 'success',
        }));
        return true;
      } else {
        set({
          loadingState: 'error',
          error: result.error || 'Không thể tạo khiếu nại',
        });
        return false;
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Lỗi không xác định';
      set({ loadingState: 'error', error: errorMsg });
      return false;
    }
  },

  getMyDisputes: async (params?: DisputeSearchParams): Promise<void> => {
    set({ loadingState: 'loading', error: null });
    try {
      const useCase = container().getMyDisputesUseCase;
      const result = await useCase.execute(params);

      if (result.success) {
        set({
          disputes: result.data,
          totalPages: result.totalPages || 1,
          currentPage: result.currentPage || 1,
          loadingState: 'success',
        });
      } else {
        set({
          loadingState: 'error',
          error: result.error || 'Không thể tải danh sách khiếu nại',
        });
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Lỗi không xác định';
      set({ loadingState: 'error', error: errorMsg });
    }
  },

  getDisputeById: async (id: string): Promise<void> => {
    set({ loadingState: 'loading', error: null });
    try {
      const repo = container().disputeRepository;
      const result = await repo.getDisputeById(id);

      if (result.success && result.data) {
        set({
          currentDispute: result.data,
          loadingState: 'success',
        });
      } else {
        set({
          loadingState: 'error',
          error: result.error || 'Không thể tải chi tiết khiếu nại',
        });
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Lỗi không xác định';
      set({ loadingState: 'error', error: errorMsg });
    }
  },

  addComment: async (data: AddDisputeCommentData): Promise<boolean> => {
    set({ loadingState: 'loading', error: null });
    try {
      const useCase = container().addDisputeCommentUseCase;
      const result = await useCase.execute(data);

      if (result.success && result.data) {
        set({
          currentDispute: result.data,
          loadingState: 'success',
        });
        return true;
      } else {
        set({
          loadingState: 'error',
          error: result.error || 'Không thể thêm bình luận',
        });
        return false;
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Lỗi không xác định';
      set({ loadingState: 'error', error: errorMsg });
      return false;
    }
  },

  clearError: () => set({ error: null }),

  reset: () =>
    set({
      disputes: [],
      currentDispute: null,
      totalPages: 1,
      currentPage: 1,
      loadingState: 'idle',
      error: null,
    }),
}));

// Selectors
export const useDisputes = () => useDisputeStore((s) => s.disputes);
export const useCurrentDispute = () => useDisputeStore((s) => s.currentDispute);
export const useDisputeLoading = () => useDisputeStore((s) => s.loadingState === 'loading');
export const useDisputeError = () => useDisputeStore((s) => s.error);

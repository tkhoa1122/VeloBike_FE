import { create } from 'zustand';
import { LoadingState } from '../../domain/entities/Common';
import { InspectionReport } from '../../domain/entities/Inspection';
import { container } from '../../di/Container';

interface InspectionState {
  // Inspection data
  currentInspection: InspectionReport | null;
  inspections: InspectionReport[];

  // States
  loadingState: LoadingState;
  error: string | null;

  // Actions
  getInspectionByOrderId: (orderId: string) => Promise<void>;
  getInspectionByListingId: (listingId: string) => Promise<void>;
  getInspectionById: (id: string) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

export const useInspectionStore = create<InspectionState>((set, get) => ({
  currentInspection: null,
  inspections: [],
  loadingState: 'idle',
  error: null,

  getInspectionByOrderId: async (orderId: string): Promise<void> => {
    set({ loadingState: 'loading', error: null });
    try {
      const repo = container().inspectionRepository;
      const result = await repo.getInspectionByOrderId(orderId);

      if (result.success && result.data) {
        set({
          currentInspection: result.data,
          loadingState: 'success',
        });
      } else {
        set({
          loadingState: 'error',
          error: result.error || 'Không thể tải báo cáo kiểm định',
        });
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Lỗi không xác định';
      set({ loadingState: 'error', error: errorMsg });
    }
  },

  getInspectionByListingId: async (listingId: string): Promise<void> => {
    set({ loadingState: 'loading', error: null });
    try {
      const repo = container().inspectionRepository;
      const result = await repo.getInspectionByListingId(listingId);

      if (result.success && result.data) {
        set({
          currentInspection: result.data,
          loadingState: 'success',
        });
      } else {
        set({
          loadingState: 'error',
          error: result.error || 'Không thể tải báo cáo kiểm định',
        });
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Lỗi không xác định';
      set({ loadingState: 'error', error: errorMsg });
    }
  },

  getInspectionById: async (id: string): Promise<void> => {
    set({ loadingState: 'loading', error: null });
    try {
      const repo = container().inspectionRepository;
      const result = await repo.getInspectionById(id);

      if (result.success && result.data) {
        set({
          currentInspection: result.data,
          loadingState: 'success',
        });
      } else {
        set({
          loadingState: 'error',
          error: result.error || 'Không thể tải báo cáo kiểm định',
        });
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Lỗi không xác định';
      set({ loadingState: 'error', error: errorMsg });
    }
  },

  clearError: () => set({ error: null }),

  reset: () => set({
    currentInspection: null,
    inspections: [],
    loadingState: 'idle',
    error: null,
  }),
}));

// Selectors
export const useCurrentInspection = () => useInspectionStore(s => s.currentInspection);
export const useInspectionLoading = () => useInspectionStore(s => s.loadingState === 'loading');
export const useInspectionError = () => useInspectionStore(s => s.error);

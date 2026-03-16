import { create } from 'zustand';
import { LoadingState } from '../../domain/entities/Common';
import { UploadFileData } from '../../domain/entities/Upload';
import { container } from '../../di/Container';

interface UploadState {
  // Upload states
  uploadedUrls: string[];
  currentUploadProgress: number;
  loadingState: LoadingState;
  error: string | null;

  // Actions
  uploadFile: (file: UploadFileData) => Promise<string | null>;
  uploadMultiple: (files: UploadFileData[]) => Promise<string[] | null>;
  deleteFile: (url: string) => Promise<boolean>;
  clearUploadedUrls: () => void;
  clearError: () => void;
  reset: () => void;
}

export const useUploadStore = create<UploadState>((set, get) => ({
  uploadedUrls: [],
  currentUploadProgress: 0,
  loadingState: 'idle',
  error: null,

  uploadFile: async (file: UploadFileData): Promise<string | null> => {
    set({ loadingState: 'loading', error: null, currentUploadProgress: 0 });
    try {
      const repo = container().uploadRepository;
      const result = await repo.uploadFile(file);

      if (result.success && result.data) {
        set((state) => ({
          uploadedUrls: [...state.uploadedUrls, result.data!.url],
          loadingState: 'success',
          currentUploadProgress: 100,
        }));
        return result.data.url;
      } else {
        set({
          loadingState: 'error',
          error: result.error || 'Không thể upload file',
        });
        return null;
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Lỗi không xác định';
      set({ loadingState: 'error', error: errorMsg });
      return null;
    }
  },

  uploadMultiple: async (files: UploadFileData[]): Promise<string[] | null> => {
    set({ loadingState: 'loading', error: null, currentUploadProgress: 0 });
    try {
      const repo = container().uploadRepository;
      const result = await repo.uploadMultiple(files);

      if (result.success && result.data) {
        set((state) => ({
          uploadedUrls: [...state.uploadedUrls, ...result.data!.urls],
          loadingState: 'success',
          currentUploadProgress: 100,
        }));
        return result.data.urls;
      } else {
        set({
          loadingState: 'error',
          error: result.error || 'Không thể upload files',
        });
        return null;
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Lỗi không xác định';
      set({ loadingState: 'error', error: errorMsg });
      return null;
    }
  },

  deleteFile: async (url: string): Promise<boolean> => {
    set({ loadingState: 'loading', error: null });
    try {
      const repo = container().uploadRepository;
      const result = await repo.deleteFile(url);

      if (result.success) {
        set((state) => ({
          uploadedUrls: state.uploadedUrls.filter((u) => u !== url),
          loadingState: 'success',
        }));
        return true;
      } else {
        set({
          loadingState: 'error',
          error: result.error || 'Không thể xóa file',
        });
        return false;
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Lỗi không xác định';
      set({ loadingState: 'error', error: errorMsg });
      return false;
    }
  },

  clearUploadedUrls: () => set({ uploadedUrls: [] }),
  clearError: () => set({ error: null }),
  reset: () =>
    set({
      uploadedUrls: [],
      currentUploadProgress: 0,
      loadingState: 'idle',
      error: null,
    }),
}));

// Selectors
export const useUploadedUrls = () => useUploadStore((s) => s.uploadedUrls);
export const useUploadLoading = () => useUploadStore((s) => s.loadingState === 'loading');
export const useUploadError = () => useUploadStore((s) => s.error);
export const useUploadProgress = () => useUploadStore((s) => s.currentUploadProgress);

import { create } from 'zustand';
import { LoadingState } from '../../domain/entities/Common';
import { Review, CreateReviewData, ReviewStats } from '../../domain/entities/Review';
import { container } from '../../di/Container';

interface ReviewState {
  // Reviews data
  reviews: Review[];
  myReviews: Review[];
  stats: ReviewStats | null;
  currentReview: Review | null;

  // Pagination
  totalPages: number;
  currentPage: number;

  // States
  loadingState: LoadingState;
  error: string | null;

  // Actions
  createReview: (data: CreateReviewData) => Promise<boolean>;
  getReviewsForUser: (userId: string, page?: number, limit?: number) => Promise<void>;
  getMyReviews: (page?: number, limit?: number) => Promise<void>;
  voteReview: (reviewId: string, helpful: boolean) => Promise<boolean>;
  clearError: () => void;
  reset: () => void;
}

export const useReviewStore = create<ReviewState>((set, get) => ({
  reviews: [],
  myReviews: [],
  stats: null,
  currentReview: null,
  totalPages: 1,
  currentPage: 1,
  loadingState: 'idle',
  error: null,

  createReview: async (data: CreateReviewData): Promise<boolean> => {
    set({ loadingState: 'loading', error: null });
    try {
      const repo = container().reviewRepository;
      const result = await repo.createReview(data);

      if (result.success && result.data) {
        set({
          currentReview: result.data,
          loadingState: 'success',
        });
        // Refresh my reviews list
        get().getMyReviews();
        return true;
      } else {
        set({
          loadingState: 'error',
          error: result.error || 'Không thể tạo đánh giá',
        });
        return false;
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Lỗi không xác định';
      set({ loadingState: 'error', error: errorMsg });
      return false;
    }
  },

  getReviewsForUser: async (userId: string, page: number = 1, limit: number = 20): Promise<void> => {
    set({ loadingState: 'loading', error: null });
    try {
      const repo = container().reviewRepository;
      const result = await repo.getReviewsForUser({
        userId,
        page,
        limit,
      });

      if (result.success && result.data) {
        set({
          reviews: result.data.reviews,
          stats: result.data.stats,
          totalPages: result.data.totalPages,
          currentPage: result.data.currentPage,
          loadingState: 'success',
        });
      } else {
        set({
          loadingState: 'error',
          error: result.error || 'Không thể tải đánh giá',
        });
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Lỗi không xác định';
      set({ loadingState: 'error', error: errorMsg });
    }
  },

  getMyReviews: async (page: number = 1, limit: number = 20): Promise<void> => {
    set({ loadingState: 'loading', error: null });
    try {
      const repo = container().reviewRepository;
      const result = await repo.getMyReviews(page, limit);

      if (result.success && result.data) {
        set({
          myReviews: result.data,
          loadingState: 'success',
        });
      } else {
        set({
          loadingState: 'error',
          error: result.error || 'Không thể tải đánh giá của bạn',
        });
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Lỗi không xác định';
      set({ loadingState: 'error', error: errorMsg });
    }
  },

  voteReview: async (reviewId: string, helpful: boolean): Promise<boolean> => {
    try {
      const repo = container().reviewRepository;
      const result = await repo.voteReview(reviewId, helpful);

      if (result.success) {
        // Update local state
        set(state => ({
          reviews: state.reviews.map(review =>
            review._id === reviewId
              ? {
                  ...review,
                  helpful: helpful ? review.helpful + 1 : review.helpful,
                  notHelpful: !helpful ? review.notHelpful + 1 : review.notHelpful,
                }
              : review
          ),
        }));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  clearError: () => set({ error: null }),

  reset: () => set({
    reviews: [],
    myReviews: [],
    stats: null,
    currentReview: null,
    totalPages: 1,
    currentPage: 1,
    loadingState: 'idle',
    error: null,
  }),
}));

// Selectors
export const useReviews = () => useReviewStore(s => s.reviews);
export const useMyReviews = () => useReviewStore(s => s.myReviews);
export const useReviewStats = () => useReviewStore(s => s.stats);
export const useReviewLoading = () => useReviewStore(s => s.loadingState === 'loading');
export const useReviewError = () => useReviewStore(s => s.error);

import { ApiResponse } from '../entities/Common';
import { Review, CreateReviewData, ReviewSearchParams, ReviewStats } from '../entities/Review';

export interface ReviewRepository {
  /**
   * Create a new review
   */
  createReview(data: CreateReviewData): Promise<ApiResponse<Review>>;

  /**
   * Get reviews for a user (seller)
   */
  getReviewsForUser(params: ReviewSearchParams): Promise<ApiResponse<{
    reviews: Review[];
    stats: ReviewStats;
    totalPages: number;
    currentPage: number;
  }>>;

  /**
   * Get review by ID
   */
  getReviewById(id: string): Promise<ApiResponse<Review>>;

  /**
   * Mark review as helpful/not helpful
   */
  voteReview(reviewId: string, helpful: boolean): Promise<ApiResponse>;

  /**
   * Seller response to review
   */
  respondToReview(reviewId: string, response: string): Promise<ApiResponse>;

  /**
   * Get buyer's own reviews
   */
  getMyReviews(page?: number, limit?: number): Promise<ApiResponse<Review[]>>;

  /**
   * Update review (within 24 hours)
   */
  updateReview(reviewId: string, data: Partial<CreateReviewData>): Promise<ApiResponse<Review>>;

  /**
   * Delete review
   */
  deleteReview(reviewId: string): Promise<ApiResponse>;
}

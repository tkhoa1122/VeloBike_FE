import { 
  Review, 
  CreateReviewData,
  UpdateReviewData,
  ReviewSearchParams,
  ReviewStats,
  ReviewResponseData,
  ReportReviewData 
} from '../entities/Review';
import { ApiResponse, PaginatedResponse } from '../entities/Common';

export interface ReviewRepository {
  // Review CRUD
  createReview(data: CreateReviewData): Promise<ApiResponse<Review>>;
  getReview(reviewId: string): Promise<ApiResponse<Review>>;
  updateReview(reviewId: string, data: UpdateReviewData): Promise<ApiResponse<Review>>;
  deleteReview(reviewId: string): Promise<ApiResponse>;
  
  // Get reviews
  getReviews(params: ReviewSearchParams): Promise<PaginatedResponse<Review>>;
  getUserReviews(userId: string, params?: ReviewSearchParams): Promise<PaginatedResponse<Review>>;
  getMyReviews(params?: ReviewSearchParams): Promise<PaginatedResponse<Review>>;
  
  // Review statistics
  getReviewStats(userId: string): Promise<ApiResponse<ReviewStats>>;
  
  // Review interactions
  respondToReview(data: ReviewResponseData): Promise<ApiResponse<Review>>;
  reportReview(data: ReportReviewData): Promise<ApiResponse>;
  likeReview(reviewId: string): Promise<ApiResponse>;
  unlikeReview(reviewId: string): Promise<ApiResponse>;
  
  // Verification
  verifyReview(reviewId: string): Promise<ApiResponse>;
}
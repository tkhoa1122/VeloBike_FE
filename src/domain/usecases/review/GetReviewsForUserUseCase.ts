import { ReviewRepository } from '../../repositories/ReviewRepository';
import { ApiResponse } from '../../entities/Common';
import { Review, ReviewSearchParams, ReviewStats } from '../../entities/Review';

/**
 * Get Reviews For User UseCase
 * Lấy danh sách đánh giá của một seller
 */
export class GetReviewsForUserUseCase {
  constructor(private reviewRepository: ReviewRepository) {}

  async execute(params: ReviewSearchParams): Promise<ApiResponse<{
    reviews: Review[];
    stats: ReviewStats;
    totalPages: number;
    currentPage: number;
  }>> {
    if (!params.userId && !params.sellerId) {
      return {
        success: false,
        error: 'User ID hoặc Seller ID là bắt buộc',
      };
    }

    return await this.reviewRepository.getReviewsForUser(params);
  }
}

import { ReviewRepository } from '../../repositories/ReviewRepository';
import { ApiResponse } from '../../entities/Common';
import { Review } from '../../entities/Review';

/**
 * Get My Reviews UseCase
 * Lấy danh sách đánh giá của buyer đã viết
 */
export class GetMyReviewsUseCase {
  constructor(private reviewRepository: ReviewRepository) {}

  async execute(page: number = 1, limit: number = 20): Promise<ApiResponse<Review[]>> {
    return await this.reviewRepository.getMyReviews(page, limit);
  }
}

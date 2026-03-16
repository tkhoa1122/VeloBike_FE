import { ReviewRepository } from '../../repositories/ReviewRepository';
import { ApiResponse } from '../../entities/Common';
import { Review, CreateReviewData } from '../../entities/Review';

/**
 * Create Review UseCase
 * Tạo đánh giá sau khi hoàn thành đơn hàng
 */
export class CreateReviewUseCase {
  constructor(private reviewRepository: ReviewRepository) {}

  async execute(data: CreateReviewData): Promise<ApiResponse<Review>> {
    // Validate rating
    if (data.rating < 1 || data.rating > 5) {
      return {
        success: false,
        error: 'Đánh giá phải từ 1-5 sao',
      };
    }

    // Validate categories
    const categories = Object.values(data.categories);
    if (categories.some(rating => rating < 1 || rating > 5)) {
      return {
        success: false,
        error: 'Đánh giá chi tiết phải từ 1-5 sao',
      };
    }

    // Validate comment
    if (!data.comment || data.comment.trim().length < 10) {
      return {
        success: false,
        error: 'Nhận xét phải có ít nhất 10 ký tự',
      };
    }

    return await this.reviewRepository.createReview(data);
  }
}

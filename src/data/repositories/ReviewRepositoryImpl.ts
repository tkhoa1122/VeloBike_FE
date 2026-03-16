import { ReviewRepository } from '../../domain/repositories/ReviewRepository';
import { ReviewApiClient } from '../apis/ReviewApiClient';
import { ApiResponse } from '../../domain/entities/Common';
import { Review, CreateReviewData, ReviewSearchParams, ReviewStats } from '../../domain/entities/Review';

export class ReviewRepositoryImpl implements ReviewRepository {
  constructor(private apiClient: ReviewApiClient) {}

  async createReview(data: CreateReviewData): Promise<ApiResponse<Review>> {
    try {
      const response = await this.apiClient.createReview(data);
      return {
        success: response.success,
        data: this.mapReviewFromApi(response.data),
        message: response.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Không thể tạo đánh giá',
      };
    }
  }

  async getReviewsForUser(params: ReviewSearchParams): Promise<ApiResponse<{
    reviews: Review[];
    stats: ReviewStats;
    totalPages: number;
    currentPage: number;
  }>> {
    try {
      const userId = params.userId || params.sellerId;
      if (!userId) {
        return {
          success: false,
          error: 'User ID is required',
        };
      }

      const response = await this.apiClient.getReviewsForUser(userId, {
        page: params.page,
        limit: params.limit,
        minRating: params.minRating,
      });

      const reviews = response.data.map(r => this.mapReviewFromApi(r));
      const stats: ReviewStats = {
        averageRating: response.averageRating,
        totalReviews: response.totalReviews,
        ratingBreakdown: response.ratingBreakdown || {
          5: 0, 4: 0, 3: 0, 2: 0, 1: 0,
        },
        categoryAverages: response.categoryAverages || {
          itemAccuracy: 0,
          communication: 0,
          shipping: 0,
          packaging: 0,
        },
      };

      return {
        success: response.success,
        data: {
          reviews,
          stats,
          totalPages: response.totalPages || 1,
          currentPage: response.currentPage || 1,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Không thể tải đánh giá',
      };
    }
  }

  async getReviewById(id: string): Promise<ApiResponse<Review>> {
    try {
      const response = await this.apiClient.getReviewById(id);
      return {
        success: response.success,
        data: this.mapReviewFromApi(response.data),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Không thể tải đánh giá',
      };
    }
  }

  async voteReview(reviewId: string, helpful: boolean): Promise<ApiResponse> {
    try {
      const response = helpful
        ? await this.apiClient.voteReviewHelpful(reviewId)
        : await this.apiClient.voteReviewNotHelpful(reviewId);
      
      return {
        success: response.success,
        message: response.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Không thể vote đánh giá',
      };
    }
  }

  async respondToReview(reviewId: string, response: string): Promise<ApiResponse> {
    try {
      const result = await this.apiClient.respondToReview(reviewId, response);
      return {
        success: result.success,
        message: result.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Không thể phản hồi đánh giá',
      };
    }
  }

  async getMyReviews(page?: number, limit?: number): Promise<ApiResponse<Review[]>> {
    try {
      const response = await this.apiClient.getMyReviews({ page, limit });
      const reviews = response.data.map(r => this.mapReviewFromApi(r));
      return {
        success: response.success,
        data: reviews,
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Không thể tải đánh giá của bạn',
      };
    }
  }

  async updateReview(reviewId: string, data: Partial<CreateReviewData>): Promise<ApiResponse<Review>> {
    try {
      const response = await this.apiClient.updateReview(reviewId, data);
      return {
        success: response.success,
        data: this.mapReviewFromApi(response.data),
        message: response.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Không thể cập nhật đánh giá',
      };
    }
  }

  async deleteReview(reviewId: string): Promise<ApiResponse> {
    try {
      const response = await this.apiClient.deleteReview(reviewId);
      return {
        success: response.success,
        message: response.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Không thể xóa đánh giá',
      };
    }
  }

  /**
   * Helper: Map API response to Review entity
   */
  private mapReviewFromApi(data: any): Review {
    return {
      _id: data._id,
      orderId: data.orderId,
      buyerId: data.buyerId,
      sellerId: data.sellerId,
      rating: data.rating,
      comment: data.comment,
      categories: data.categories,
      photos: data.photos,
      response: data.response ? {
        content: data.response.content,
        respondedAt: new Date(data.response.respondedAt),
      } : undefined,
      helpful: data.helpful || 0,
      notHelpful: data.notHelpful || 0,
      createdAt: new Date(data.createdAt),
      updatedAt: data.updatedAt ? new Date(data.updatedAt) : undefined,
    };
  }
}

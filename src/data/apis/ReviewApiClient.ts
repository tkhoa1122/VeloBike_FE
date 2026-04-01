import { BaseApiClient } from './BaseApiClient';

/** Phản hồi tạo review — BE trả document Review (reviewerId, revieweeId, …) */
export interface ReviewCreateResponse {
  success: boolean;
  message?: string;
  data?: Record<string, unknown>;
}

/** GET /reviews/:userId — BE: { success, data: Review[], pagination } */
export interface ReviewsListApiResponse {
  success: boolean;
  data: Record<string, unknown>[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

/** GET /reviews/my-reviews — BE: { success, data: { reviews, rating }, pagination } */
export interface MyReviewsApiResponse {
  success: boolean;
  data: {
    reviews: Array<Record<string, unknown>>;
    rating?: {
      averageRating: number;
      totalReviews: number;
      ratingDistribution?: Record<number, number>;
    };
  };
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export class ReviewApiClient extends BaseApiClient {
  async createReview(data: {
    orderId: string;
    rating: number;
    comment: string;
    categories: {
      itemAccuracy: number;
      communication: number;
      shipping: number;
      packaging: number;
    };
    photos?: string[];
  }): Promise<ReviewCreateResponse> {
    return this.post('/reviews', data);
  }

  /** Đánh giá người bán (public, có phân trang) — query listingId lọc theo đơn của tin */
  async getReviewsForUser(
    userId: string,
    params?: { page?: number; limit?: number; listingId?: string },
  ): Promise<ReviewsListApiResponse> {
    return this.get(`/reviews/${userId}`, params);
  }

  /** Người bán xem đánh giá nhận được */
  async getMyReviews(params?: { page?: number; limit?: number }): Promise<MyReviewsApiResponse> {
    return this.get('/reviews/my-reviews', params);
  }

  /** Buyer kiểm tra đã review đơn chưa */
  async checkReviewed(orderId: string): Promise<{ success: boolean; reviewed: boolean }> {
    return this.get(`/reviews/check/${orderId}`);
  }

  /** Người bán phản hồi đánh giá */
  async replyToReview(reviewId: string, reply: string): Promise<ReviewCreateResponse> {
    return this.post(`/reviews/${reviewId}/reply`, { reply });
  }
}

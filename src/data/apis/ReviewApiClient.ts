import { BaseApiClient } from './BaseApiClient';
import { ENDPOINTS } from '../../config/api';

// Response models
export interface ReviewResponseModel {
  success: boolean;
  message?: string;
  data: {
    _id: string;
    orderId: string;
    buyerId: any;
    sellerId: any;
    rating: number;
    comment: string;
    categories: {
      itemAccuracy: number;
      communication: number;
      shipping: number;
      packaging: number;
    };
    photos?: string[];
    response?: {
      content: string;
      respondedAt: string;
    };
    helpful: number;
    notHelpful: number;
    createdAt: string;
    updatedAt?: string;
  };
}

export interface ReviewListResponseModel {
  success: boolean;
  data: Array<{
    _id: string;
    orderId: string;
    buyerId: any;
    sellerId: any;
    rating: number;
    comment: string;
    categories: {
      itemAccuracy: number;
      communication: number;
      shipping: number;
      packaging: number;
    };
    photos?: string[];
    response?: {
      content: string;
      respondedAt: string;
    };
    helpful: number;
    notHelpful: number;
    createdAt: string;
  }>;
  averageRating: number;
  totalReviews: number;
  ratingBreakdown?: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  categoryAverages?: {
    itemAccuracy: number;
    communication: number;
    shipping: number;
    packaging: number;
  };
  totalPages?: number;
  currentPage?: number;
}

export class ReviewApiClient extends BaseApiClient {
  /**
   * Create new review
   */
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
  }): Promise<ReviewResponseModel> {
    return this.post('/reviews', data);
  }

  /**
   * Get reviews for a user (seller)
   */
  async getReviewsForUser(userId: string, params?: {
    page?: number;
    limit?: number;
    minRating?: number;
  }): Promise<ReviewListResponseModel> {
    return this.get(`/reviews/${userId}`, params);
  }

  /**
   * Get review by ID
   */
  async getReviewById(id: string): Promise<ReviewResponseModel> {
    return this.get(`/reviews/detail/${id}`);
  }

  /**
   * Mark review as helpful
   */
  async voteReviewHelpful(reviewId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    return this.post(`/reviews/${reviewId}/helpful`);
  }

  /**
   * Mark review as not helpful
   */
  async voteReviewNotHelpful(reviewId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    return this.post(`/reviews/${reviewId}/not-helpful`);
  }

  /**
   * Seller responds to review
   */
  async respondToReview(reviewId: string, response: string): Promise<ReviewResponseModel> {
    return this.post(`/reviews/${reviewId}/respond`, { response });
  }

  /**
   * Get my reviews (as buyer)
   */
  async getMyReviews(params?: {
    page?: number;
    limit?: number;
  }): Promise<ReviewListResponseModel> {
    return this.get('/reviews/my-reviews', params);
  }

  /**
   * Update review
   */
  async updateReview(reviewId: string, data: {
    rating?: number;
    comment?: string;
    categories?: {
      itemAccuracy?: number;
      communication?: number;
      shipping?: number;
      packaging?: number;
    };
    photos?: string[];
  }): Promise<ReviewResponseModel> {
    return this.put(`/reviews/${reviewId}`, data);
  }

  /**
   * Delete review
   */
  async deleteReview(reviewId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    return this.delete(`/reviews/${reviewId}`);
  }
}

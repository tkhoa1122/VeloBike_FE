/**
 * Review Entity
 * Đánh giá sau khi hoàn thành đơn hàng
 */

export interface Review {
  _id: string;
  orderId: string;
  buyerId: string | {
    _id: string;
    fullName: string;
    avatar?: string;
  };
  sellerId: string | {
    _id: string;
    fullName: string;
    avatar?: string;
  };
  rating: number; // 1-5 stars
  comment: string;
  categories: {
    itemAccuracy: number; // 1-5
    communication: number; // 1-5
    shipping: number; // 1-5
    packaging: number; // 1-5
  };
  photos?: string[]; // Review photos
  response?: {
    content: string;
    respondedAt: Date;
  };
  helpful: number; // Count of helpful votes
  notHelpful: number; // Count of not helpful votes
  createdAt: Date;
  updatedAt?: Date;
}

export interface CreateReviewData {
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
}

export interface ReviewSearchParams {
  userId?: string;
  sellerId?: string;
  buyerId?: string;
  /** Lọc đánh giá theo đơn của tin đăng (BE) */
  listingId?: string;
  minRating?: number;
  maxRating?: number;
  page?: number;
  limit?: number;
  sort?: {
    field: 'createdAt' | 'rating' | 'helpful';
    order: 'asc' | 'desc';
  };
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingBreakdown: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  categoryAverages: {
    itemAccuracy: number;
    communication: number;
    shipping: number;
    packaging: number;
  };
}

import { User } from './User';
import { Listing } from './Listing';
import { Order } from './Order';

export interface Review {
  _id: string;
  orderId: string | Order;
  
  // Parties
  reviewerId: string | User; // Person giving the review
  revieweeId: string | User; // Person being reviewed
  
  // Review content
  rating: number; // 1-5 stars
  comment: string;
  
  // Category ratings
  categories: {
    itemAccuracy: number;    // How accurate was the listing description
    communication: number;   // How good was communication
    shipping: number;        // How was the shipping/delivery
    packaging: number;       // How was the packaging
  };
  
  // Evidence
  photos?: string[];
  
  // Status
  isPublic: boolean;
  isVerified: boolean; // Verified purchase
  
  // Response from reviewee
  response?: {
    message: string;
    respondedAt: Date;
  };
  
  // Moderation
  isReported: boolean;
  reportCount: number;
  moderationStatus: 'APPROVED' | 'PENDING' | 'REJECTED' | 'UNDER_REVIEW';
  
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateReviewData {
  orderId: string;
  rating: number;
  comment: string;
  categories: Review['categories'];
  photos?: string[];
}

export interface UpdateReviewData {
  rating?: number;
  comment?: string;
  categories?: Review['categories'];
  photos?: string[];
}

export interface ReviewFilters {
  revieweeId?: string;
  reviewerId?: string;
  orderId?: string;
  minRating?: number;
  maxRating?: number;
  hasPhotos?: boolean;
  isVerified?: boolean;
  fromDate?: Date;
  toDate?: Date;
}

export interface ReviewSearchParams {
  filters?: ReviewFilters;
  sort?: {
    field: 'createdAt' | 'rating' | 'helpful';
    order: 'asc' | 'desc';
  };
  page: number;
  limit: number;
}

// Review statistics
export interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  
  categoryAverages: {
    itemAccuracy: number;
    communication: number;
    shipping: number;
    packaging: number;
  };
  
  verifiedReviewsCount: number;
  photoReviewsCount: number;
}

// Review response
export interface ReviewResponseData {
  reviewId: string;
  message: string;
}

// Report review
export interface ReportReviewData {
  reviewId: string;
  reason: 'FAKE' | 'INAPPROPRIATE' | 'SPAM' | 'HARASSMENT' | 'OTHER';
  details?: string;
}
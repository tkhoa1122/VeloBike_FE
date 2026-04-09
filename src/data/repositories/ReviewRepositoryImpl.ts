import { ReviewRepository } from '../../domain/repositories/ReviewRepository';
import { ReviewApiClient } from '../apis/ReviewApiClient';
import { ApiResponse } from '../../domain/entities/Common';
import { Review, CreateReviewData, ReviewSearchParams, ReviewStats } from '../../domain/entities/Review';

export class ReviewRepositoryImpl implements ReviewRepository {
  constructor(private apiClient: ReviewApiClient) {}

  async createReview(data: CreateReviewData): Promise<ApiResponse<Review>> {
    try {
      const response = await this.apiClient.createReview(data);
      const isSuccess = response.success !== false && !response.error;
      const responseData = response.data as Record<string, unknown> | undefined;
      const payload = responseData?.review ?? responseData ?? response.review ?? response;

      if (isSuccess) {
        return {
          success: true,
          data: payload
            ? this.mapReviewFromApi(payload)
            : {
                _id: '',
                orderId: data.orderId,
                buyerId: '',
                sellerId: '',
                rating: data.rating,
                comment: data.comment,
                categories: data.categories,
                photos: data.photos,
                helpful: 0,
                notHelpful: 0,
                createdAt: new Date(),
              },
          message: response.message || 'Tạo đánh giá thành công',
        };
      }
      return {
        success: false,
        message: response.message || 'Không thể tạo đánh giá',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Không thể tạo đánh giá',
      };
    }
  }

  async checkReviewed(orderId: string): Promise<ApiResponse<boolean>> {
    try {
      const r = await this.apiClient.checkReviewed(orderId);
      const reviewedRaw =
        (r as any).reviewed ??
        (r as any).data?.reviewed ??
        (r as any).data?.isReviewed ??
        (typeof (r as any).data === 'boolean' ? (r as any).data : undefined);

      return {
        success: (r as any).success !== false,
        data: reviewedRaw === true,
      };
    } catch (error) {
      return {
        success: false,
        data: false,
        message: error instanceof Error ? error.message : 'Không kiểm tra được đánh giá',
      };
    }
  }

  async getReviewsForUser(params: ReviewSearchParams): Promise<
    ApiResponse<{
      reviews: Review[];
      stats: ReviewStats;
      totalPages: number;
      currentPage: number;
    }>
  > {
    try {
      const userId = params.userId || params.sellerId;
      if (!userId) {
        return { success: false, message: 'Thiếu userId' };
      }

      const response = await this.apiClient.getReviewsForUser(userId, {
        page: params.page,
        limit: params.limit,
        listingId: params.listingId,
      });

      const rawList = Array.isArray(response.data) ? response.data : [];
      const reviews = rawList.map(r => this.mapReviewFromApi(r));
      const pg = response.pagination;
      const totalReviews = pg?.total ?? reviews.length;
      const totalPages = pg?.pages ?? 1;
      const currentPage = pg?.page ?? 1;

      const stats = this.computeStatsFromReviews(reviews, totalReviews);

      return {
        success: response.success,
        data: {
          reviews,
          stats,
          totalPages,
          currentPage,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Không thể tải đánh giá',
      };
    }
  }

  async getReviewById(_id: string): Promise<ApiResponse<Review>> {
    return { success: false, message: 'API không hỗ trợ' };
  }

  async voteReview(_reviewId: string, _helpful: boolean): Promise<ApiResponse> {
    return { success: false, message: 'API không hỗ trợ' };
  }

  async respondToReview(reviewId: string, responseText: string): Promise<ApiResponse> {
    try {
      const result = await this.apiClient.replyToReview(reviewId, responseText);
      return {
        success: !!result.success,
        message: result.message,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Không thể phản hồi',
      };
    }
  }

  async getMyReviews(page?: number, limit?: number): Promise<ApiResponse<Review[]>> {
    try {
      const response = await this.apiClient.getMyReviews({ page, limit });
      const inner = response.data?.reviews;
      const rawList = Array.isArray(inner) ? inner : [];
      const reviews = rawList.map(r => this.mapSellerInboxRowToReview(r));
      return {
        success: response.success,
        data: reviews,
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        message: error instanceof Error ? error.message : 'Không thể tải đánh giá',
      };
    }
  }

  async updateReview(_reviewId: string, _data: Partial<CreateReviewData>): Promise<ApiResponse<Review>> {
    return { success: false, message: 'API không hỗ trợ' };
  }

  async deleteReview(_reviewId: string): Promise<ApiResponse> {
    return { success: false, message: 'API không hỗ trợ' };
  }

  private computeStatsFromReviews(reviews: Review[], totalFromServer: number): ReviewStats {
    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 as number };
    for (const r of reviews) {
      const k = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
      breakdown[k] += 1;
    }
    const avg =
      reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
    const cat = { itemAccuracy: 0, communication: 0, shipping: 0, packaging: 0 };
    if (reviews.length > 0) {
      for (const r of reviews) {
        cat.itemAccuracy += r.categories.itemAccuracy;
        cat.communication += r.categories.communication;
        cat.shipping += r.categories.shipping;
        cat.packaging += r.categories.packaging;
      }
      const n = reviews.length;
      cat.itemAccuracy = Math.round((cat.itemAccuracy / n) * 10) / 10;
      cat.communication = Math.round((cat.communication / n) * 10) / 10;
      cat.shipping = Math.round((cat.shipping / n) * 10) / 10;
      cat.packaging = Math.round((cat.packaging / n) * 10) / 10;
    }
    return {
      averageRating: Math.round(avg * 10) / 10,
      totalReviews: totalFromServer,
      ratingBreakdown: breakdown,
      categoryAverages: cat,
    };
  }

  /** BE Review: reviewerId, revieweeId (buyer đánh giá seller → reviewer = buyer) */
  private mapReviewFromApi(data: any): Review {
    const reviewer = data.reviewerId ?? data.buyerId;
    const reviewee = data.revieweeId ?? data.sellerId;
    return {
      _id: String(data._id ?? data.id ?? ''),
      orderId: String(data.orderId?._id ?? data.orderId ?? ''),
      buyerId: reviewer as Review['buyerId'],
      sellerId: reviewee as Review['sellerId'],
      rating: Number(data.rating ?? 0),
      comment: String(data.comment ?? ''),
      categories: {
        itemAccuracy: Number(data.categories?.itemAccuracy ?? data.rating ?? 5),
        communication: Number(data.categories?.communication ?? data.rating ?? 5),
        shipping: Number(data.categories?.shipping ?? data.rating ?? 5),
        packaging: Number(data.categories?.packaging ?? data.rating ?? 5),
      },
      photos: data.photos,
      response:
        data.reply != null
          ? {
              content: String(data.reply),
              respondedAt: new Date(data.replyDate ?? Date.now()),
            }
          : data.response
            ? {
                content: data.response.content,
                respondedAt: new Date(data.response.respondedAt),
              }
            : undefined,
      helpful: data.helpful ?? 0,
      notHelpful: data.notHelpful ?? 0,
      createdAt: new Date(data.createdAt),
      updatedAt: data.updatedAt ? new Date(data.updatedAt) : undefined,
    };
  }

  /** GET /reviews/my-reviews — mỗi dòng: buyerName, rating, comment, productTitle, … */
  private mapSellerInboxRowToReview(row: Record<string, unknown>): Review {
    const rid = String(row.id ?? row._id ?? '');
    return {
      _id: rid,
      orderId: '',
      buyerId: {
        _id: '',
        fullName: String(row.buyerName ?? 'Người mua'),
        avatar: row.buyerAvatar as string | undefined,
      },
      sellerId: '',
      rating: Number(row.rating ?? 0),
      comment: String(row.comment ?? row.content ?? ''),
      categories: {
        itemAccuracy: Number((row.categories as any)?.itemAccuracy ?? row.rating ?? 5),
        communication: Number((row.categories as any)?.communication ?? row.rating ?? 5),
        shipping: Number((row.categories as any)?.shipping ?? row.rating ?? 5),
        packaging: Number((row.categories as any)?.packaging ?? row.rating ?? 5),
      },
      response:
        row.reply != null
          ? {
              content: String(row.reply),
              respondedAt: new Date((row.replyDate as string) ?? Date.now()),
            }
          : undefined,
      helpful: 0,
      notHelpful: 0,
      createdAt: new Date((row.createdAt as string) ?? Date.now()),
    };
  }
}

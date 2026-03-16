import { ApiResponse, PaginatedResponse } from '../entities/Common';
import { Dispute, CreateDisputeData, AddDisputeCommentData, DisputeSearchParams } from '../entities/Dispute';

export interface DisputeRepository {
  /**
   * Create new dispute
   */
  createDispute(data: CreateDisputeData): Promise<ApiResponse<Dispute>>;

  /**
   * Get my disputes (buyer or seller)
   */
  getMyDisputes(params?: DisputeSearchParams): Promise<PaginatedResponse<Dispute>>;

  /**
   * Get dispute by ID
   */
  getDisputeById(id: string): Promise<ApiResponse<Dispute>>;

  /**
   * Add comment to dispute
   */
  addComment(data: AddDisputeCommentData): Promise<ApiResponse<Dispute>>;
}

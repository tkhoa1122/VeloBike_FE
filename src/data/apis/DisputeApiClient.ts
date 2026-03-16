import { BaseApiClient } from './BaseApiClient';
import { ENDPOINTS } from '../../config/api';

export interface DisputeCommentModel {
  _id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  comment: string;
  attachments?: string[];
  createdAt: string;
}

export interface DisputeModel {
  _id: string;
  orderId: string;
  buyerId: string;
  sellerId: string;
  reason: string;
  description: string;
  evidence: string[];
  status: 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'CLOSED';
  comments: DisputeCommentModel[];
  resolution?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface DisputeResponseModel {
  success: boolean;
  message?: string;
  data: DisputeModel;
}

export interface DisputeListResponseModel {
  success: boolean;
  data: DisputeModel[];
  totalPages?: number;
  currentPage?: number;
}

export class DisputeApiClient extends BaseApiClient {
  /**
   * Create new dispute
   * POST /disputes
   */
  async createDispute(data: {
    orderId: string;
    reason: string;
    description: string;
    evidence?: string[];
  }): Promise<DisputeResponseModel> {
    return this.post(ENDPOINTS.DISPUTES.LIST, data);
  }

  /**
   * Get my disputes
   * GET /disputes?status=OPEN&page=1&limit=20
   */
  async getMyDisputes(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<DisputeListResponseModel> {
    return this.get(ENDPOINTS.DISPUTES.LIST, params);
  }

  /**
   * Get dispute by ID
   * GET /disputes/:id
   */
  async getDisputeById(id: string): Promise<DisputeResponseModel> {
    return this.get(ENDPOINTS.DISPUTES.DETAIL(id));
  }

  /**
   * Add evidence/comment payload to dispute
   * BE route: POST /disputes/:disputeId/evidence
   */
  async addComment(
    disputeId: string,
    data: {
      comment: string;
      attachments?: string[];
    }
  ): Promise<DisputeResponseModel> {
    return this.post(ENDPOINTS.DISPUTES.EVIDENCE(disputeId), {
      comment: data.comment,
      evidence: data.attachments ?? [],
    });
  }
}

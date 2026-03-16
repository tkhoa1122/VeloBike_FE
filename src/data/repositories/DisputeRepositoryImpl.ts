import { DisputeRepository } from '../../domain/repositories/DisputeRepository';
import { DisputeApiClient } from '../apis/DisputeApiClient';
import { ApiResponse, PaginatedResponse } from '../../domain/entities/Common';
import { Dispute, CreateDisputeData, AddDisputeCommentData, DisputeSearchParams } from '../../domain/entities/Dispute';

export class DisputeRepositoryImpl implements DisputeRepository {
  constructor(private apiClient: DisputeApiClient) {}

  async createDispute(data: CreateDisputeData): Promise<ApiResponse<Dispute>> {
    try {
      const response = await this.apiClient.createDispute(data);
      return {
        success: response.success,
        data: this.mapDisputeFromApi(response.data),
        message: response.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Không thể tạo khiếu nại',
      };
    }
  }

  async getMyDisputes(params?: DisputeSearchParams): Promise<PaginatedResponse<Dispute>> {
    try {
      const response = await this.apiClient.getMyDisputes(params);
      const disputes = response.data.map((d) => this.mapDisputeFromApi(d));
      return {
        success: response.success,
        data: disputes,
        totalPages: response.totalPages,
        currentPage: response.currentPage,
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Không thể tải danh sách khiếu nại',
      };
    }
  }

  async getDisputeById(id: string): Promise<ApiResponse<Dispute>> {
    try {
      const response = await this.apiClient.getDisputeById(id);
      return {
        success: response.success,
        data: this.mapDisputeFromApi(response.data),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Không thể tải chi tiết khiếu nại',
      };
    }
  }

  async addComment(data: AddDisputeCommentData): Promise<ApiResponse<Dispute>> {
    try {
      const response = await this.apiClient.addComment(data.disputeId, {
        comment: data.comment,
        attachments: data.attachments,
      });
      return {
        success: response.success,
        data: this.mapDisputeFromApi(response.data),
        message: response.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Không thể thêm bình luận',
      };
    }
  }

  private mapDisputeFromApi(data: any): Dispute {
    return {
      _id: data._id,
      orderId: data.orderId,
      buyerId: data.buyerId,
      sellerId: data.sellerId,
      reason: data.reason,
      description: data.description,
      evidence: data.evidence,
      status: data.status,
      comments: data.comments.map((c: any) => ({
        _id: c._id,
        userId: c.userId,
        userName: c.userName,
        userAvatar: c.userAvatar,
        comment: c.comment,
        attachments: c.attachments,
        createdAt: new Date(c.createdAt),
      })),
      resolution: data.resolution,
      resolvedBy: data.resolvedBy,
      resolvedAt: data.resolvedAt ? new Date(data.resolvedAt) : undefined,
      createdAt: new Date(data.createdAt),
      updatedAt: data.updatedAt ? new Date(data.updatedAt) : undefined,
    };
  }
}

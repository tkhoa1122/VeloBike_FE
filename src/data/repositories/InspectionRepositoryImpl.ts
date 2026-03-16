import { InspectionRepository } from '../../domain/repositories/InspectionRepository';
import { InspectionApiClient } from '../apis/InspectionApiClient';
import { ApiResponse } from '../../domain/entities/Common';
import { InspectionReport, InspectionSearchParams, CreateInspectionData } from '../../domain/entities/Inspection';

export class InspectionRepositoryImpl implements InspectionRepository {
  constructor(private apiClient: InspectionApiClient) {}

  async submitInspectionReport(data: CreateInspectionData): Promise<ApiResponse<InspectionReport>> {
    try {
      const response = await this.apiClient.submitInspectionReport(data);
      return {
        success: response.success,
        data: this.mapInspectionFromApi(response.data),
        message: response.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Không thể gửi báo cáo kiểm định',
      };
    }
  }

  async getInspectionReports(params: InspectionSearchParams): Promise<ApiResponse<InspectionReport[]>> {
    try {
      const response = await this.apiClient.getInspectionReports({
        page: params.page,
        limit: params.limit,
        orderId: params.orderId,
        listingId: params.listingId,
        inspectorId: params.inspectorId,
      });

      const reports = response.data.map(r => this.mapInspectionFromApi(r));
      return {
        success: response.success,
        data: reports,
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Không thể tải báo cáo kiểm định',
      };
    }
  }

  async getInspectionById(id: string): Promise<ApiResponse<InspectionReport>> {
    try {
      const response = await this.apiClient.getInspectionById(id);
      return {
        success: response.success,
        data: this.mapInspectionFromApi(response.data),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Không thể tải báo cáo kiểm định',
      };
    }
  }

  async getInspectionByOrderId(orderId: string): Promise<ApiResponse<InspectionReport>> {
    try {
      const response = await this.apiClient.getInspectionByOrderId(orderId);
      return {
        success: response.success,
        data: this.mapInspectionFromApi(response.data),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Không thể tải báo cáo kiểm định',
      };
    }
  }

  async getInspectionByListingId(listingId: string): Promise<ApiResponse<InspectionReport>> {
    try {
      const response = await this.apiClient.getInspectionByListingId(listingId);
      return {
        success: response.success,
        data: this.mapInspectionFromApi(response.data),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Không thể tải báo cáo kiểm định',
      };
    }
  }

  /**
   * Helper: Map API response to InspectionReport entity
   */
  private mapInspectionFromApi(data: any): InspectionReport {
    return {
      _id: data._id,
      orderId: data.orderId,
      inspectorId: data.inspectorId,
      listingId: data.listingId,
      checkpoints: data.checkpoints,
      overallVerdict: data.overallVerdict,
      overallScore: data.overallScore,
      grade: data.grade,
      inspectorNote: data.inspectorNote,
      photos: data.photos,
      createdAt: new Date(data.createdAt),
      updatedAt: data.updatedAt ? new Date(data.updatedAt) : undefined,
    };
  }
}

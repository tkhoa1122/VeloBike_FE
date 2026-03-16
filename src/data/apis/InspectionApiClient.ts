import { BaseApiClient } from './BaseApiClient';

// Response models
export interface InspectionCheckpointModel {
  component: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  observation: string;
  photos?: string[];
}

export interface InspectionReportModel {
  _id: string;
  orderId: string;
  inspectorId: any;
  listingId?: string;
  checkpoints: InspectionCheckpointModel[];
  overallVerdict: 'PASSED' | 'FAILED' | 'SUGGEST_ADJUSTMENT';
  overallScore: number;
  grade?: 'A' | 'B' | 'C' | 'D' | 'F';
  inspectorNote: string;
  photos?: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface InspectionResponseModel {
  success: boolean;
  message?: string;
  data: InspectionReportModel;
}

export interface InspectionListResponseModel {
  success: boolean;
  data: InspectionReportModel[];
  totalPages?: number;
  currentPage?: number;
}

export class InspectionApiClient extends BaseApiClient {
  /**
   * Submit inspection report (Inspectors only)
   */
  async submitInspectionReport(data: {
    orderId: string;
    checkpoints: InspectionCheckpointModel[];
    overallVerdict: 'PASSED' | 'FAILED' | 'SUGGEST_ADJUSTMENT';
    overallScore: number;
    inspectorNote: string;
    photos?: string[];
  }): Promise<InspectionResponseModel> {
    return this.post('/inspections', data);
  }

  /**
   * Get inspection reports list
   */
  async getInspectionReports(params?: {
    page?: number;
    limit?: number;
    orderId?: string;
    listingId?: string;
    inspectorId?: string;
  }): Promise<InspectionListResponseModel> {
    return this.get('/inspections', params);
  }

  /**
   * Get inspection report by ID
   */
  async getInspectionById(id: string): Promise<InspectionResponseModel> {
    return this.get(`/inspections/${id}`);
  }

  /**
   * Get inspection report by order ID
   */
  async getInspectionByOrderId(orderId: string): Promise<InspectionResponseModel> {
    return this.get(`/inspections/order/${orderId}`);
  }

  /**
   * Get inspection report by listing ID
   */
  async getInspectionByListingId(listingId: string): Promise<InspectionResponseModel> {
    return this.get(`/inspections/listing/${listingId}`);
  }

  /**
   * Update inspection report
   */
  async updateInspectionReport(
    id: string,
    data: Partial<{
      checkpoints: InspectionCheckpointModel[];
      overallVerdict: 'PASSED' | 'FAILED' | 'SUGGEST_ADJUSTMENT';
      overallScore: number;
      inspectorNote: string;
      photos: string[];
    }>
  ): Promise<InspectionResponseModel> {
    return this.put(`/inspections/${id}`, data);
  }

  /**
   * Delete inspection report
   */
  async deleteInspectionReport(id: string): Promise<{
    success: boolean;
    message: string;
  }> {
    return this.delete(`/inspections/${id}`);
  }
}

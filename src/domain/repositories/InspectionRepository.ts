import { ApiResponse } from '../entities/Common';
import { InspectionReport, InspectionSearchParams, CreateInspectionData } from '../entities/Inspection';

export interface InspectionRepository {
  /**
   * Submit inspection report (Inspectors only)
   */
  submitInspectionReport(data: CreateInspectionData): Promise<ApiResponse<InspectionReport>>;

  /**
   * Get inspection reports list
   */
  getInspectionReports(params: InspectionSearchParams): Promise<ApiResponse<InspectionReport[]>>;

  /**
   * Get inspection report by ID
   */
  getInspectionById(id: string): Promise<ApiResponse<InspectionReport>>;

  /**
   * Get inspection report by order ID
   */
  getInspectionByOrderId(orderId: string): Promise<ApiResponse<InspectionReport>>;

  /**
   * Get inspection report by listing ID
   */
  getInspectionByListingId(listingId: string): Promise<ApiResponse<InspectionReport>>;
}

/**
 * Inspection Entity
 * Báo cáo kiểm định xe đạp
 */

export type InspectionCheckpointStatus = 'PASS' | 'WARN' | 'FAIL';
export type InspectionSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type InspectionVerdict = 'PASSED' | 'FAILED' | 'SUGGEST_ADJUSTMENT';

export interface InspectionCheckpoint {
  component: string; // e.g. "Frame - Overall Condition"
  status: InspectionCheckpointStatus;
  severity?: InspectionSeverity; // Only for WARN/FAIL
  observation: string;
  photos?: string[];
}

export interface InspectionReport {
  _id: string;
  orderId: string;
  inspectorId: string | {
    _id: string;
    fullName: string;
    avatar?: string;
    credentials?: string;
  };
  listingId?: string;
  checkpoints: InspectionCheckpoint[];
  overallVerdict: InspectionVerdict;
  overallScore: number; // 0-10
  grade?: 'A' | 'B' | 'C' | 'D' | 'F';
  inspectorNote: string;
  photos?: string[]; // General inspection photos
  createdAt: Date;
  updatedAt?: Date;
}

export interface InspectionSearchParams {
  orderId?: string;
  listingId?: string;
  inspectorId?: string;
  page?: number;
  limit?: number;
}

export interface CreateInspectionData {
  orderId: string;
  checkpoints: InspectionCheckpoint[];
  overallVerdict: InspectionVerdict;
  overallScore: number;
  inspectorNote: string;
  photos?: string[];
}

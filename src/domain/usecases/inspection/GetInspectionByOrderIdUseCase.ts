import { InspectionRepository } from '../../repositories/InspectionRepository';
import { ApiResponse } from '../../entities/Common';
import { InspectionReport } from '../../entities/Inspection';

/**
 * Get Inspection By Order ID UseCase
 * Lấy báo cáo kiểm định theo order ID
 */
export class GetInspectionByOrderIdUseCase {
  constructor(private inspectionRepository: InspectionRepository) {}

  async execute(orderId: string): Promise<ApiResponse<InspectionReport>> {
    if (!orderId || orderId.trim() === '') {
      return {
        success: false,
        error: 'Order ID không hợp lệ',
      };
    }

    return await this.inspectionRepository.getInspectionByOrderId(orderId);
  }
}

import { InspectionRepository } from '../../repositories/InspectionRepository';
import { ApiResponse } from '../../entities/Common';
import { InspectionReport } from '../../entities/Inspection';

/**
 * Get Inspection By Listing ID UseCase
 * Lấy báo cáo kiểm định theo listing ID
 */
export class GetInspectionByListingIdUseCase {
  constructor(private inspectionRepository: InspectionRepository) {}

  async execute(listingId: string): Promise<ApiResponse<InspectionReport>> {
    if (!listingId || listingId.trim() === '') {
      return {
        success: false,
        error: 'Listing ID không hợp lệ',
      };
    }

    return await this.inspectionRepository.getInspectionByListingId(listingId);
  }
}

import { DisputeRepository } from '../../repositories/DisputeRepository';
import { ApiResponse } from '../../entities/Common';
import { Dispute, CreateDisputeData } from '../../entities/Dispute';

export class CreateDisputeUseCase {
  constructor(private disputeRepository: DisputeRepository) {}

  async execute(data: CreateDisputeData): Promise<ApiResponse<Dispute>> {
    // Validation
    if (!data.orderId || !data.orderId.trim()) {
      return { success: false, error: 'Order ID là bắt buộc' };
    }

    if (!data.reason) {
      return { success: false, error: 'Vui lòng chọn lý do khiếu nại' };
    }

    if (!data.description || data.description.trim().length < 10) {
      return { success: false, error: 'Mô tả phải có ít nhất 10 ký tự' };
    }

    return await this.disputeRepository.createDispute(data);
  }
}

import { DisputeRepository } from '../../repositories/DisputeRepository';
import { ApiResponse } from '../../entities/Common';
import { Dispute, AddDisputeCommentData } from '../../entities/Dispute';

export class AddDisputeCommentUseCase {
  constructor(private disputeRepository: DisputeRepository) {}

  async execute(data: AddDisputeCommentData): Promise<ApiResponse<Dispute>> {
    // Validation
    if (!data.disputeId || !data.disputeId.trim()) {
      return { success: false, error: 'Dispute ID là bắt buộc' };
    }

    if (!data.comment || data.comment.trim().length < 5) {
      return { success: false, error: 'Bình luận phải có ít nhất 5 ký tự' };
    }

    return await this.disputeRepository.addComment(data);
  }
}

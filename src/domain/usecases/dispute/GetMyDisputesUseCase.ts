import { DisputeRepository } from '../../repositories/DisputeRepository';
import { PaginatedResponse } from '../../entities/Common';
import { Dispute, DisputeSearchParams } from '../../entities/Dispute';

export class GetMyDisputesUseCase {
  constructor(private disputeRepository: DisputeRepository) {}

  async execute(params?: DisputeSearchParams): Promise<PaginatedResponse<Dispute>> {
    return await this.disputeRepository.getMyDisputes(params);
  }
}

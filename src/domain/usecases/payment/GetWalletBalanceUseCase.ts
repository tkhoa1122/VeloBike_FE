import { PaymentRepository } from '../../repositories/PaymentRepository';
import { ApiResponse } from '../../entities/Common';

/**
 * Get Wallet Balance UseCase
 */
export class GetWalletBalanceUseCase {
  constructor(private paymentRepository: PaymentRepository) {}

  async execute(): Promise<ApiResponse<{
    balance: number;
    currency: string;
    pendingAmount: number;
  }>> {
    return await this.paymentRepository.getWalletBalance();
  }
}

import { PaymentRepository } from '../../repositories/PaymentRepository';
import { ApiResponse } from '../../entities/Common';

/**
 * Create Payment Link UseCase
 * Generates PayOS payment link for an order
 */
export class CreatePaymentLinkUseCase {
  constructor(private paymentRepository: PaymentRepository) {}

  async execute(orderId: string): Promise<ApiResponse<{
    paymentLink: string;
    orderCode: number;
  }>> {
    if (!orderId || orderId.trim() === '') {
      return {
        success: false,
        error: 'Order ID không hợp lệ',
      };
    }

    return await this.paymentRepository.createPaymentLink(orderId);
  }
}

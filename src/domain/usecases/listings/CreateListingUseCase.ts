import { ListingRepository } from '../../repositories/ListingRepository';
import { CreateListingData, Listing } from '../../entities/Listing';
import { ApiResponse } from '../../entities/Common';

export class CreateListingUseCase {
  constructor(private listingRepository: ListingRepository) {}

  async execute(data: CreateListingData): Promise<ApiResponse<Listing>> {
    // Validation
    const validation = this.validateListingData(data);
    if (!validation.isValid) {
      return {
        success: false,
        message: validation.message!,
      };
    }

    try {
      return await this.listingRepository.createListing(data);
    } catch (error) {
      return {
        success: false,
        message: 'Không thể tạo tin đăng. Vui lòng thử lại.',
      };
    }
  }

  private validateListingData(data: CreateListingData): {
    isValid: boolean;
    message?: string;
  } {
    // Required fields
    if (!data.title?.trim()) {
      return { isValid: false, message: 'Tiêu đề là bắt buộc' };
    }
    
    if (!data.description?.trim()) {
      return { isValid: false, message: 'Mô tả là bắt buộc' };
    }

    if (!data.type) {
      return { isValid: false, message: 'Loại xe là bắt buộc' };
    }

    // General info validation
    if (!data.generalInfo.brand?.trim()) {
      return { isValid: false, message: 'Thương hiệu là bắt buộc' };
    }

    if (!data.generalInfo.model?.trim()) {
      return { isValid: false, message: 'Model là bắt buộc' };
    }

    if (!data.generalInfo.year || data.generalInfo.year < 1990 || data.generalInfo.year > new Date().getFullYear() + 1) {
      return { isValid: false, message: 'Năm sản xuất không hợp lệ' };
    }

    if (!data.generalInfo.size?.trim()) {
      return { isValid: false, message: 'Kích cỡ là bắt buộc' };
    }

    if (!data.generalInfo.condition) {
      return { isValid: false, message: 'Tình trạng xe là bắt buộc' };
    }

    // Pricing validation
    if (!data.pricing.amount || data.pricing.amount <= 0) {
      return { isValid: false, message: 'Giá bán phải lớn hơn 0' };
    }

    if (data.pricing.amount > 1000000000) { // 1 billion VND
      return { isValid: false, message: 'Giá bán quá cao' };
    }

    if (data.pricing.originalPrice && data.pricing.originalPrice < data.pricing.amount) {
      return { isValid: false, message: 'Giá gốc không thể thấp hơn giá bán' };
    }

    // Media validation
    if (!data.media.thumbnails || data.media.thumbnails.length === 0) {
      return { isValid: false, message: 'Ít nhất 1 ảnh là bắt buộc' };
    }

    if (data.media.thumbnails.length > 20) {
      return { isValid: false, message: 'Tối đa 20 ảnh' };
    }

    // Location validation
    if (!data.location.address?.trim()) {
      return { isValid: false, message: 'Địa chỉ là bắt buộc' };
    }

    if (!data.location.coordinates || data.location.coordinates.length !== 2) {
      return { isValid: false, message: 'Vị trí địa lý là bắt buộc' };
    }

    // Title length
    if (data.title.length < 10) {
      return { isValid: false, message: 'Tiêu đề phải có ít nhất 10 ký tự' };
    }

    if (data.title.length > 100) {
      return { isValid: false, message: 'Tiêu đề không được quá 100 ký tự' };
    }

    // Description length
    if (data.description.length < 50) {
      return { isValid: false, message: 'Mô tả phải có ít nhất 50 ký tự' };
    }

    if (data.description.length > 2000) {
      return { isValid: false, message: 'Mô tả không được quá 2000 ký tự' };
    }

    return { isValid: true };
  }
}
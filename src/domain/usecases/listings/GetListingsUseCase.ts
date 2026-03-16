import { ListingRepository } from '../../repositories/ListingRepository';
import { Listing, ListingSearchParams } from '../../entities/Listing';
import { PaginatedResponse } from '../../entities/Common';

export class GetListingsUseCase {
  constructor(private listingRepository: ListingRepository) {}

  async execute(params: ListingSearchParams): Promise<PaginatedResponse<Listing>> {
    try {
      // Apply default values
      const searchParams: ListingSearchParams = {
        ...params,
        page: params.page || 1,
        limit: Math.min(params.limit || 20, 50), // Max 50 items per page
      };

      // Additional business rules
      if (searchParams.filters) {
        // Ensure price range is valid
        if (searchParams.filters.minPrice && searchParams.filters.maxPrice) {
          if (searchParams.filters.minPrice > searchParams.filters.maxPrice) {
            return {
              success: false,
              count: 0,
              page: 1,
              totalPages: 0,
              data: [],
              message: 'Giá tối thiểu không thể lớn hơn giá tối đa',
            };
          }
        }

        // Set reasonable price bounds
        if (searchParams.filters.maxPrice && searchParams.filters.maxPrice > 1000000000) {
          searchParams.filters.maxPrice = 1000000000; // 1 billion VND max
        }
      }

      const result = await this.listingRepository.getListings(searchParams);
      return result;
    } catch (error) {
      return {
        success: false,
        count: 0,
        page: params.page || 1,
        totalPages: 0,
        data: [],
        message: 'Không thể tải danh sách xe đạp. Vui lòng thử lại.',
      };
    }
  }
}
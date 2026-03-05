import { ListingRepository } from '../../domain/repositories/ListingRepository';
import { 
  Listing, 
  CreateListingData, 
  UpdateListingData, 
  ListingSearchParams, 
  BoostListingParams 
} from '../../domain/entities/Listing';
import { ApiResponse, PaginatedResponse } from '../../domain/entities/Common';
import { ListingApiClient } from '../apis/ListingApiClient';
import { ListingModel } from '../models/ListingModel';

export class ListingRepositoryImpl implements ListingRepository {
  constructor(private listingApiClient: ListingApiClient) {}

  async getListings(params: ListingSearchParams): Promise<PaginatedResponse<Listing>> {
    try {
      const response = await this.listingApiClient.getListings(params);
      
      const mappedData = response.data.map(model => this.mapListingModelToEntity(model));
      
      return {
        success: response.success,
        count: response.count,
        page: response.currentPage,
        totalPages: response.totalPages,
        data: mappedData,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        count: 0,
        page: params.page,
        totalPages: 0,
        data: [],
        message: error instanceof Error ? error.message : 'Failed to fetch listings'
      };
    }
  }

  async getListingById(id: string): Promise<ApiResponse<Listing>> {
    try {
      const response = await this.listingApiClient.getListingById(id);
      
      if (response.success) {
        const listing = this.mapListingModelToEntity(response.data);
        return {
          success: true,
          data: listing,
          message: 'Listing retrieved successfully'
        };
      }
      
      return {
        success: false,
        message: response.message || 'Failed to fetch listing'
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch listing'
      };
    }
  }

  async createListing(data: CreateListingData): Promise<ApiResponse<Listing>> {
    try {
      const response = await this.listingApiClient.createListing(data);
      
      if (response.success) {
        const listing = this.mapListingModelToEntity(response.data);
        return {
          success: true,
          data: listing,
          message: 'Listing created successfully'
        };
      }
      
      return {
        success: false,
        message: response.message || 'Failed to create listing'
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create listing'
      };
    }
  }

  async updateListing(id: string, data: UpdateListingData): Promise<ApiResponse<Listing>> {
    try {
      const response = await this.listingApiClient.updateListing(id, data);
      
      if (response.success) {
        const listing = this.mapListingModelToEntity(response.data);
        return {
          success: true,
          data: listing,
          message: 'Listing updated successfully'
        };
      }
      
      return {
        success: false,
        message: response.message || 'Failed to update listing'
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update listing'
      };
    }
  }

  async deleteListing(id: string): Promise<ApiResponse> {
    try {
      const response = await this.listingApiClient.deleteListing(id);
      return response;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete listing'
      };
    }
  }

  async getMyListings(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Listing>> {
    try {
      const response = await this.listingApiClient.getMyListings(params);
      
      const mappedData = response.data.map(model => this.mapListingModelToEntity(model));
      
      return {
        success: response.success,
        count: response.count,
        page: response.currentPage,
        totalPages: response.totalPages,
        data: mappedData,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        count: 0,
        page: params?.page || 1,
        totalPages: 0,
        data: [],
        message: error instanceof Error ? error.message : 'Failed to fetch your listings'
      };
    }
  }

  async getFeaturedListings(limit?: number): Promise<ApiResponse<Listing[]>> {
    try {
      const response = await this.listingApiClient.getFeaturedListings(limit);
      
      if (response.success) {
        const listings = response.data.map(model => this.mapListingModelToEntity(model));
        return {
          success: true,
          data: listings,
          message: 'Featured listings retrieved successfully'
        };
      }
      
      return {
        success: false,
        message: 'Failed to fetch featured listings'
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch featured listings'
      };
    }
  }

  async getNearbyListings(lat: number, lon: number, radius?: number): Promise<ApiResponse<Listing[]>> {
    try {
      const response = await this.listingApiClient.getNearbyListings(lat, lon, radius);
      
      if (response.success) {
        const listings = response.data.map(model => this.mapListingModelToEntity(model));
        return {
          success: true,
          data: listings,
          message: 'Nearby listings retrieved successfully'
        };
      }
      
      return {
        success: false,
        message: 'Failed to fetch nearby listings'
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch nearby listings'
      };
    }
  }

  async boostListing(params: BoostListingParams): Promise<ApiResponse> {
    try {
      const response = await this.listingApiClient.boostListing(params);
      return response;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to boost listing'
      };
    }
  }

  async searchListings(query: string, filters?: any): Promise<PaginatedResponse<Listing>> {
    try {
      const response = await this.listingApiClient.searchListings(query, filters);
      
      const mappedData = response.data.map(model => this.mapListingModelToEntity(model));
      
      return {
        success: response.success,
        count: response.count,
        page: response.currentPage,
        totalPages: response.totalPages,
        data: mappedData,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        count: 0,
        page: 1,
        totalPages: 0,
        data: [],
        message: error instanceof Error ? error.message : 'Search failed'
      };
    }
  }

  async getRecommendedListings(limit?: number): Promise<ApiResponse<Listing[]>> {
    try {
      const response = await this.listingApiClient.getRecommendedListings(limit);
      
      if (response.success) {
        const listings = response.data.map(model => this.mapListingModelToEntity(model));
        return {
          success: true,
          data: listings,
          message: 'Recommended listings retrieved successfully'
        };
      }
      
      return {
        success: false,
        message: 'Failed to fetch recommended listings'
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch recommended listings'
      };
    }
  }

  async getListingAnalytics(id: string): Promise<ApiResponse<{
    views: number;
    saves: number;
    inquiries: number;
    conversionRate: number;
    viewHistory: Array<{ date: string; count: number }>;
  }>> {
    try {
      const response = await this.listingApiClient.getListingAnalytics(id);
      return response;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch analytics'
      };
    }
  }

  async getBrands(): Promise<ApiResponse<string[]>> {
    try {
      const response = await this.listingApiClient.getBrands();
      return response;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch brands'
      };
    }
  }

  async getModels(brand: string): Promise<ApiResponse<string[]>> {
    try {
      const response = await this.listingApiClient.getModels(brand);
      return response;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch models'
      };
    }
  }

  async getPopularSearches(): Promise<ApiResponse<string[]>> {
    try {
      const response = await this.listingApiClient.getPopularSearches();
      return response;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch popular searches'
      };
    }
  }

  /**
   * Map ListingModel to Listing entity
   */
  private mapListingModelToEntity(model: ListingModel): Listing {
    return {
      _id: model._id,
      title: model.title,
      description: model.description,
      type: model.type as any,
      status: model.status as any,
      generalInfo: {
        ...model.generalInfo,
        condition: model.generalInfo.condition as any,
        assemblyDate: model.generalInfo.assemblyDate ? new Date(model.generalInfo.assemblyDate) : undefined,
        lastServiceDate: model.generalInfo.lastServiceDate ? new Date(model.generalInfo.lastServiceDate) : undefined
      },
      specs: model.specs,
      geometry: model.geometry,
      pricing: model.pricing,
      media: model.media,
      location: model.location,
      sellerId: typeof model.sellerId === 'string' ? model.sellerId : model.sellerId._id,
      views: model.views,
      saves: model.saves,
      boostedUntil: model.boostedUntil ? new Date(model.boostedUntil) : undefined,
      featured: model.featured,
      badge: model.badge,
      inspectionRequired: model.inspectionRequired,
      inspectionScore: model.inspectionScore,
      inspectionReportId: model.inspectionReportId,
      isActive: model.isActive,
      isAvailable: model.isAvailable,
      soldAt: model.soldAt ? new Date(model.soldAt) : undefined,
      soldToUserId: model.soldToUserId,
      createdAt: new Date(model.createdAt),
      updatedAt: new Date(model.updatedAt)
    };
  }
}
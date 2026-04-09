import { BaseApiClient } from './BaseApiClient';
import { ENDPOINTS } from '../../config/api';
import { ListingListResponseModel, ListingResponseModel, ListingModel } from '../models/ListingModel';
import { 
  CreateListingData, 
  UpdateListingData, 
  ListingSearchParams, 
  BoostListingParams 
} from '../../domain/entities/Listing';

export class ListingApiClient extends BaseApiClient {
  /**
   * Get listings with search and filters
   */
  async getListings(params: ListingSearchParams): Promise<ListingListResponseModel> {
    const queryParams = this.buildListingQueryParams(params);
    return this.get(ENDPOINTS.LISTINGS.LIST, queryParams);
  }

  /**
   * Get single listing by ID
   */
  async getListingById(id: string): Promise<ListingResponseModel> {
    return this.get(ENDPOINTS.LISTINGS.DETAIL(id));
  }

  /**
   * Create new listing
   */
  async createListing(data: CreateListingData): Promise<ListingResponseModel> {
    return this.post(ENDPOINTS.LISTINGS.CREATE, data);
  }

  /**
   * Update existing listing
   */
  async updateListing(id: string, data: UpdateListingData): Promise<ListingResponseModel> {
    return this.put(ENDPOINTS.LISTINGS.UPDATE(id), data);
  }

  /**
   * Delete listing
   */
  async deleteListing(id: string): Promise<{ success: boolean; message: string }> {
    return this.delete(ENDPOINTS.LISTINGS.DELETE(id));
  }

  /**
   * Get user's own listings
   */
  async getMyListings(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<ListingListResponseModel> {
    return this.get(ENDPOINTS.LISTINGS.MY_LISTINGS, params);
  }

  /**
   * Get featured listings
   */
  async getFeaturedListings(limit: number = 10): Promise<{ success: boolean; data: ListingModel[] }> {
    return this.get(ENDPOINTS.LISTINGS.FEATURED, { limit });
  }

  /**
   * Get nearby listings
   */
  async getNearbyListings(
    lat: number, 
    lon: number, 
    radius: number = 50
  ): Promise<{ success: boolean; data: ListingModel[] }> {
    return this.get(ENDPOINTS.LISTINGS.NEARBY, { lat, lon, radius });
  }

  /**
   * Boost listing (premium feature)
   */
  async boostListing(params: BoostListingParams): Promise<{
    success: boolean;
    message: string;
    data?: {
      listing?: {
        _id: string;
        title?: string;
        boostedUntil?: string;
        boostCount?: number;
      };
      boostUsage?: {
        used: number;
        limit: number;
        remaining: number;
      };
    };
  }> {
    return this.post(ENDPOINTS.LISTINGS.BOOST(params.listingId), {
      days: params.days
    });
  }

  /**
   * Search listings by text query
   */
  async searchListings(
    query: string, 
    filters?: any, 
    page: number = 1, 
    limit: number = 20
  ): Promise<ListingListResponseModel> {
    const params = {
      q: query,
      page,
      limit,
      ...filters
    };
    return this.get(ENDPOINTS.LISTINGS.LIST, params);
  }

  /**
   * Get recommended listings for user
   */
  async getRecommendedListings(limit: number = 10): Promise<{ success: boolean; data: ListingModel[] }> {
    return this.get('/recommendations/bikes', { limit });
  }

  /**
   * Get listing analytics
   */
  async getListingAnalytics(id: string): Promise<{
    success: boolean;
    data: {
      views: number;
      saves: number;
      inquiries: number;
      conversionRate: number;
      viewHistory: Array<{ date: string; count: number }>;
    };
  }> {
    return this.get(ENDPOINTS.ANALYTICS.LISTING(id));
  }

  /**
   * Get available brands
   */
  async getBrands(): Promise<{ success: boolean; data: string[] }> {
    return this.get('/brands');
  }

  /**
   * Get models for a specific brand
   */
  async getModels(brand: string): Promise<{ success: boolean; data: string[] }> {
    return this.get('/brands/models', { brand });
  }

  /**
   * Get popular search terms
   */
  async getPopularSearches(): Promise<{ success: boolean; data: string[] }> {
    return this.get('/listings/search/suggestions');
  }

  /**
   * Helper: Build query parameters for listing search
   */
  private buildListingQueryParams(params: ListingSearchParams): Record<string, any> {
    const queryParams: Record<string, any> = {
      page: params.page,
      limit: params.limit,
    };

    // Add search query
    if (params.query) {
      queryParams.q = params.query;
    }

    // Add filters
    if (params.filters) {
      Object.entries(params.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === 'nearCoordinates' && Array.isArray(value)) {
            queryParams.lat = value[1]; // latitude
            queryParams.lon = value[0]; // longitude
          } else if (key === 'size' && Array.isArray(value)) {
            queryParams.size = value.join(',');
          } else if (key === 'materials' && Array.isArray(value)) {
            queryParams.materials = value.join(',');
          } else if (key === 'yearRange') {
            queryParams.minYear = value.min;
            queryParams.maxYear = value.max;
          } else {
            queryParams[key] = value;
          }
        }
      });
    }

    // Add sorting
    if (params.sort) {
      queryParams.sort = `${params.sort.order === 'desc' ? '-' : ''}${params.sort.field}`;
    }

    return queryParams;
  }
}
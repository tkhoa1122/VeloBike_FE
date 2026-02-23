import { 
  Listing, 
  CreateListingData, 
  UpdateListingData, 
  ListingSearchParams, 
  BoostListingParams 
} from '../entities/Listing';
import { ApiResponse, PaginatedResponse } from '../entities/Common';

export interface ListingRepository {
  // CRUD operations
  getListings(params: ListingSearchParams): Promise<PaginatedResponse<Listing>>;
  getListingById(id: string): Promise<ApiResponse<Listing>>;
  createListing(data: CreateListingData): Promise<ApiResponse<Listing>>;
  updateListing(id: string, data: UpdateListingData): Promise<ApiResponse<Listing>>;
  deleteListing(id: string): Promise<ApiResponse>;
  
  // User's listings
  getMyListings(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Listing>>;
  
  // Special listing types
  getFeaturedListings(limit?: number): Promise<ApiResponse<Listing[]>>;
  getNearbyListings(lat: number, lon: number, radius?: number): Promise<ApiResponse<Listing[]>>;
  
  // Premium features
  boostListing(params: BoostListingParams): Promise<ApiResponse>;
  
  // Search & Discovery
  searchListings(query: string, filters?: any): Promise<PaginatedResponse<Listing>>;
  getRecommendedListings(limit?: number): Promise<ApiResponse<Listing[]>>;
  
  // Analytics
  getListingAnalytics(id: string): Promise<ApiResponse<{
    views: number;
    saves: number;
    inquiries: number;
    conversionRate: number;
    viewHistory: Array<{ date: string; count: number }>;
  }>>;
  
  // Metadata
  getBrands(): Promise<ApiResponse<string[]>>;
  getModels(brand: string): Promise<ApiResponse<string[]>>;
  getPopularSearches(): Promise<ApiResponse<string[]>>;
}
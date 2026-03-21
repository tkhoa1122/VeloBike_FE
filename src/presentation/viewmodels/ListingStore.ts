import { create } from 'zustand';
import { Listing, ListingSearchParams, CreateListingData } from '../../domain/entities/Listing';
import { useCase } from '../../di/Container';
import { LoadingState, PaginatedResponse } from '../../domain/entities/Common';

interface ListingState {
  // State
  listings: Listing[];
  featuredListings: Listing[];
  currentListing: Listing | null;
  listingCache: Record<string, Listing>;
  
  // Pagination
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasMore: boolean;
  
  // UI State
  loadingState: LoadingState;
  createLoadingState: LoadingState;
  error: string | null;
  
  // Last search params for pagination
  lastSearchParams: ListingSearchParams | null;
  
  // Actions
  getListings: (params: ListingSearchParams) => Promise<void>;
  loadMoreListings: () => Promise<void>;
  getListingById: (id: string) => Promise<Listing | null>;
  getFeaturedListings: (limit?: number) => Promise<void>;
  createListing: (data: CreateListingData) => Promise<boolean>;
  searchListings: (query: string, filters?: any) => Promise<void>;
  clearListings: () => void;
  clearError: () => void;
  
  // UI helpers
  isLoading: () => boolean;
  isCreateLoading: () => boolean;
}

export const useListingStore = create<ListingState>((set, get) => ({
  // Initial state
  listings: [],
  featuredListings: [],
  currentListing: null,
  listingCache: {},
  currentPage: 1,
  totalPages: 1,
  totalCount: 0,
  hasMore: false,
  loadingState: 'idle',
  createLoadingState: 'idle',
  error: null,
  lastSearchParams: null,

  // Actions
  getListings: async (params: ListingSearchParams): Promise<void> => {
    set({ loadingState: 'loading', error: null, lastSearchParams: params });
    
    try {
      const result = await useCase.getListings().execute(params);
      
      if (result.success) {
        const data = result.data ?? [];
        const currentPage = result.page ?? result.currentPage ?? 1;
        const totalPages = result.totalPages ?? 1;
        set({
          listings: data,
          currentPage,
          totalPages,
          totalCount: result.count ?? data.length,
          hasMore: currentPage < totalPages,
          loadingState: 'success',
          error: null
        });
      } else {
        set({
          loadingState: 'error',
          error: result.message || 'Failed to load listings'
        });
      }
    } catch (error) {
      set({
        loadingState: 'error',
        error: error instanceof Error ? error.message : 'Failed to load listings'
      });
    }
  },

  loadMoreListings: async (): Promise<void> => {
    const { lastSearchParams, hasMore, loadingState, currentPage: currentPageState } = get();
    
    if (!hasMore || loadingState === 'loading' || !lastSearchParams) {
      return;
    }
    
    const nextPageParams = {
      ...lastSearchParams,
      page: currentPageState + 1
    };
    
    set({ loadingState: 'loading' });
    
    try {
      const result = await useCase.getListings().execute(nextPageParams);
      
      if (result.success) {
        const data = result.data ?? [];
        const currentPage = result.page ?? result.currentPage ?? currentPageState;
        const totalPages = result.totalPages ?? get().totalPages;
        set(state => ({
          listings: [...state.listings, ...data],
          currentPage,
          totalPages,
          hasMore: currentPage < totalPages,
          loadingState: 'success',
          error: null
        }));
      } else {
        set({
          loadingState: 'error',
          error: result.message || 'Failed to load more listings'
        });
      }
    } catch (error) {
      set({
        loadingState: 'error',
        error: error instanceof Error ? error.message : 'Failed to load more listings'
      });
    }
  },

  getListingById: async (id: string): Promise<Listing | null> => {
    const cached = get().listingCache[id];
    if (cached) {
      set({ currentListing: cached });
      return cached;
    }

    try {
      const result = await useCase.listing().getListingById(id);
      
      if (result.success && result.data) {
        set(state => ({
          currentListing: result.data,
          listingCache: {
            ...state.listingCache,
            [id]: result.data!,
          },
        }));
        return result.data;
      }
      
      return null;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to load listing' });
      return null;
    }
  },

  getFeaturedListings: async (limit: number = 10): Promise<void> => {
    try {
      const result = await useCase.listing().getFeaturedListings(limit);
      
      if (result.success && result.data) {
        set({ featuredListings: result.data });
      }
    } catch (error) {
      console.warn('Failed to load featured listings:', error);
    }
  },

  createListing: async (data: CreateListingData): Promise<boolean> => {
    set({ createLoadingState: 'loading', error: null });
    
    try {
      const result = await useCase.createListing().execute(data);
      
      if (result.success) {
        set({ createLoadingState: 'success' });
        
        // Optionally add to listings if it matches current filter
        if (result.data) {
          set(state => ({
            listings: [result.data!, ...state.listings],
            totalCount: state.totalCount + 1
          }));
        }
        
        return true;
      } else {
        set({ 
          createLoadingState: 'error',
          error: result.message || 'Failed to create listing'
        });
        return false;
      }
    } catch (error) {
      set({ 
        createLoadingState: 'error',
        error: error instanceof Error ? error.message : 'Failed to create listing'
      });
      return false;
    }
  },

  searchListings: async (query: string, filters?: any): Promise<void> => {
    const params: ListingSearchParams = {
      query,
      filters,
      page: 1,
      limit: 20
    };
    
    await get().getListings(params);
  },

  clearListings: () => {
    set({
      listings: [],
      currentPage: 1,
      totalPages: 1,
      totalCount: 0,
      hasMore: false,
      lastSearchParams: null,
      error: null
    });
  },

  clearError: () => {
    set({ error: null });
  },

  // UI helpers
  isLoading: (): boolean => {
    return get().loadingState === 'loading';
  },

  isCreateLoading: (): boolean => {
    return get().createLoadingState === 'loading';
  },
}));

// Selectors
export const useListings = () => useListingStore(state => state.listings);
export const useFeaturedListings = () => useListingStore(state => state.featuredListings);
export const useCurrentListing = () => useListingStore(state => state.currentListing);
export const useListingLoading = () => useListingStore(state => state.loadingState === 'loading');
export const useListingError = () => useListingStore(state => state.error);
export const useHasMoreListings = () => useListingStore(state => state.hasMore);
/**
 * Listing Model - Maps server response to domain entity
 */
export interface ListingModel {
  _id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  
  generalInfo: {
    brand: string;
    model: string;
    year: number;
    size: string;
    condition: string;
    color?: string;
    serialNumber?: string;
    assemblyDate?: string;
    lastServiceDate?: string;
  };
  
  specs: {
    frameMaterial?: string;
    groupset?: string;
    wheelset?: string;
    brakeType?: string;
    weight?: number;
    cassette?: string;
    chainring?: string;
    chain?: string;
    saddle?: string;
    handlebar?: string;
    stem?: string;
    seatpost?: string;
    pedals?: string;
    frontWheel?: string;
    rearWheel?: string;
    frontTire?: string;
    rearTire?: string;
    motor?: string;
    battery?: string;
    range?: number;
  };
  
  geometry?: {
    stack?: number;
    reach?: number;
    topTubeLength?: number;
    seatTubeLength?: number;
    headTubeAngle?: number;
    seatTubeAngle?: number;
    wheelbase?: number;
    chainstayLength?: number;
  };
  
  pricing: {
    amount: number;
    currency: string;
    originalPrice?: number;
    negotiable: boolean;
  };
  
  media: {
    thumbnails: string[];
    spin360Urls?: string[];
    videoUrl?: string;
    imageGroups?: {
      overview: string[];
      details: string[];
      components: string[];
      defects: string[];
    };
  };
  
  location: {
    coordinates: [number, number];
    address: string;
    showExactLocation: boolean;
    pickupAvailable: boolean;
    shippingAvailable: boolean;
    meetupLocations?: string[];
  };
  
  sellerId: string | {
    _id: string;
    fullName: string;
    reputation: {
      score: number;
      reviewCount: number;
    };
    badge?: string;
  };
  
  views: number;
  saves: number;
  boostedUntil?: string; // ISO string
  featured: boolean;
  badge?: string;
  
  inspectionRequired: boolean;
  inspectionScore?: number;
  inspectionReportId?: string;
  
  isActive: boolean;
  isAvailable: boolean;
  soldAt?: string; // ISO string
  soldToUserId?: string;
  
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

// List response
export interface ListingListResponseModel {
  success: boolean;
  count: number;
  page: number;
  totalPages: number;
  data: ListingModel[];
  message?: string;
}

// Single listing response
export interface ListingResponseModel {
  success: boolean;
  data: ListingModel;
  message?: string;
}
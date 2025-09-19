// Amadeus API Types
export interface AmadeusTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface AmadeusHotelOffer {
  id: string;
  hotel: {
    hotelId: string;
    name: string;
    cityCode?: string;
    latitude?: number;
    longitude?: number;
  };
  offers: Array<{
    id: string;
    price: {
      currency: string;
      total: string;
      base?: string;
    };
    policies?: {
      cancellation?: any;
      guarantee?: any;
    };
  }>;
  available: boolean;
}

export interface AmadeusHotelContent {
  hotelId: string;
  name: string;
  description?: {
    text: string;
  };
  amenities?: Array<{
    code: string;
    description: string;
  }>;
  media?: Array<{
    uri: string;
    category: string;
  }>;
  contact?: {
    phone?: string;
    fax?: string;
    email?: string;
  };
  address?: {
    lines: string[];
    postalCode?: string;
    cityName?: string;
    countryCode?: string;
  };
}

// Internal App Types
export interface HotelCard {
  id: string;
  name: string;
  city: string;
  country: string;
  coords?: {
    lat: number;
    lng: number;
  };
  price?: {
    amount: string;
    currency: string;
  };
  description: string;
  amenityTags: string[];
  photos: string[];
  heroPhoto: string;
  bookingUrl: string;
  rating?: number;
}

export interface PersonalizationData {
  countryAffinity: Record<string, number>;
  amenityAffinity: Record<string, number>;
  seenHotels: Set<string>;
}

export interface SeedCity {
  name: string;
  cityCode: string;
  countryCode: string;
  coords: {
    lat: number;
    lng: number;
  };
} 
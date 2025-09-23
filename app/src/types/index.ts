// Hotel data types (matching API response)
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

// API response types
export interface HotelsResponse {
  hotels: HotelCard[];
  total: number;
  hasMore: boolean;
  message?: string;
}

export interface ApiResponse<T> {
  success?: boolean;
  error?: string;
  message?: string;
  data?: T;
}

// Personalization types
export interface PersonalizationData {
  countryAffinity: Record<string, number>;
  amenityAffinity: Record<string, number>;
  seenHotels: string[];
}

// Swipe actions
export type SwipeAction = 'like' | 'dismiss' | 'superlike' | 'details';

export interface SwipeEvent {
  hotelId: string;
  action: SwipeAction;
  hotel: HotelCard;
}

// Navigation types
export type RootStackParamList = {
  Home: undefined;
  Details: { hotel: HotelCard };
  Saved: undefined;
};

// Store types
export interface AppState {
  hotels: HotelCard[];
  currentIndex: number;
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  personalization: PersonalizationData;
  savedHotels: {
    liked: HotelCard[];
    superliked: HotelCard[];
  };
}

// Gesture types for swipe deck
export interface SwipeGestureEvent {
  nativeEvent: {
    translationX: number;
    translationY: number;
    velocityX: number;
    velocityY: number;
  };
} 
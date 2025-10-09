import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HotelCard, PersonalizationData, SwipeAction, AppState, User, AuthState, OTPRequest, OTPVerification, AuthResponse } from '../types';
import apiClient from '../api/client';

interface AppStore extends AppState, AuthState {
  // Additional auth state
  isVerifyingOTP: boolean;
  otpEmail: string | null;
  
  // Hotel Actions
  loadHotels: (refresh?: boolean) => Promise<void>;
  swipeHotel: (hotelId: string, action: SwipeAction) => Promise<void>;
  saveHotel: (hotel: HotelCard, type: 'like' | 'superlike') => void;
  removeSavedHotel: (hotelId: string, type: 'like' | 'superlike') => void;
  updatePersonalization: (country: string, amenityTags: string[], action: SwipeAction) => void;
  loadPersistedData: () => Promise<void>;
  persistData: () => Promise<void>;
  seedHotels: () => Promise<void>;
  resetError: () => void;
  
  // Auth Actions
  requestOTP: (email: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  verifyOTP: (email: string, code: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
  clearAuthError: () => void;
  setVerifyingOTP: (verifying: boolean) => void;
  setOTPEmail: (email: string | null) => void;
}

// Storage keys
const STORAGE_KEYS = {
  PERSONALIZATION: '@glintz_personalization',
  SAVED_HOTELS: '@glintz_saved_hotels',
  SEEN_HOTELS: '@glintz_seen_hotels',
  AUTH_TOKEN: '@glintz_auth_token',
  USER_DATA: '@glintz_user_data',
};

export const useAppStore = create<AppStore>((set, get) => ({
  // Initial state - Hotels
  hotels: [],
  currentIndex: 0,
  loading: false,
  error: null,
  hasMore: true,
  personalization: {
    countryAffinity: {},
    amenityAffinity: {},
    seenHotels: [],
  },
  savedHotels: {
    liked: [],
    superliked: [],
  },

  // Initial state - Auth
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isVerifyingOTP: false,
  otpEmail: null,

  // Load hotels from API
  loadHotels: async (refresh = false) => {
    const state = get();
    
    if (state.loading) return;
    
    set({ loading: true, error: null });

    try {
      // Validate connection on first load
      if (state.hotels.length === 0 && !refresh) {
        console.log('🔍 First load - validating API connection...');
        const validation = await apiClient.validateConnection();
        
        if (!validation.connected) {
          set({ 
            error: `Cannot connect to server: ${validation.message}. Please check server is running and IP is correct.`,
            loading: false 
          });
          return;
        }
      }
      
      const offset = refresh ? 0 : state.hotels.length;
      const response = await apiClient.getHotels({
        limit: 20,
        offset,
        personalization: state.personalization,
      });

      if (response.message && response.hotels.length === 0) {
        // Database not seeded
        set({ 
          error: response.message,
          loading: false 
        });
        return;
      }

      let hotelsToAdd = response.hotels;

      // DEV MODE: Create infinite loop of hotels by duplicating them
      if (response.hotels.length > 0) {
        const baseHotels = response.hotels;
        
        // If we don't have more hotels from API, or if we're loading additional batches
        if (!response.hasMore || !refresh) {
          // Calculate how many loops we need to create ~20 hotels
          const targetCount = 20;
          const loopCount = Math.ceil(targetCount / baseHotels.length);
          
          hotelsToAdd = [];
          const currentTime = Date.now();
          
          for (let i = 0; i < loopCount; i++) {
            const duplicatedHotels = baseHotels.map((hotel, hotelIndex) => ({
              ...hotel,
              // Create unique ID using timestamp, loop iteration, and hotel index
              id: `${hotel.id}-${currentTime}-${i}-${hotelIndex}`,
            }));
            hotelsToAdd.push(...duplicatedHotels);
          }
          
          // Trim to exactly the target count
          hotelsToAdd = hotelsToAdd.slice(0, targetCount);
        }
      }

      // Preload hero images for better performance
      const heroImages = hotelsToAdd.map(hotel => hotel.heroPhoto);
      apiClient.preloadImages(heroImages).catch(console.warn);

      set({
        hotels: refresh ? hotelsToAdd : [...state.hotels, ...hotelsToAdd],
        hasMore: true, // Always true in dev mode for infinite scrolling
        currentIndex: refresh ? 0 : state.currentIndex,
        loading: false,
      });
    } catch (error) {
      console.error('Failed to load hotels:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load hotels',
        loading: false 
      });
    }
  },

  // Handle swipe actions
  swipeHotel: async (hotelId: string, action: SwipeAction) => {
    const state = get();
    const hotel = state.hotels.find(h => h.id === hotelId);
    
    if (!hotel) return;

    // Update seen hotels
    const newSeenHotels = [...state.personalization.seenHotels, hotelId];
    
    // Update personalization based on action
    if (action !== 'details') {
      get().updatePersonalization(hotel.country, hotel.amenityTags, action);
      
      // Send to API for server-side tracking
      try {
        await apiClient.updatePersonalization({
          hotelId,
          action: action as 'like' | 'dismiss' | 'superlike',
          country: hotel.country,
          amenityTags: hotel.amenityTags,
        });
      } catch (error) {
        console.warn('Failed to update server personalization:', error);
      }
    }

    // Save hotel if liked or superliked
    if (action === 'like') {
      get().saveHotel(hotel, 'like');
    } else if (action === 'superlike') {
      get().saveHotel(hotel, 'superlike');
    }

    // Update current index and seen hotels
    set({
      currentIndex: state.currentIndex + 1,
      personalization: {
        ...state.personalization,
        seenHotels: newSeenHotels,
      },
    });

    // Load more hotels if running low
    if (state.currentIndex + 5 >= state.hotels.length && state.hasMore) {
      get().loadHotels();
    }

    // Persist data
    get().persistData();
  },

  // Save hotel to favorites
  saveHotel: (hotel: HotelCard, type: 'like' | 'superlike') => {
    const state = get();
    const existingIndex = state.savedHotels[type === 'like' ? 'liked' : 'superliked']
      .findIndex(h => h.id === hotel.id);

    if (existingIndex === -1) {
      set({
        savedHotels: {
          ...state.savedHotels,
          [type === 'like' ? 'liked' : 'superliked']: [
            ...state.savedHotels[type === 'like' ? 'liked' : 'superliked'],
            hotel,
          ],
        },
      });
      
      // Persist data immediately
      get().persistData();
    }
  },

  // Remove saved hotel
  removeSavedHotel: (hotelId: string, type: 'like' | 'superlike') => {
    const state = get();
    const key = type === 'like' ? 'liked' : 'superliked';
    
    set({
      savedHotels: {
        ...state.savedHotels,
        [key]: state.savedHotels[key].filter(h => h.id !== hotelId),
      },
    });
    
    get().persistData();
  },

  // Update personalization scores
  updatePersonalization: (country: string, amenityTags: string[], action: SwipeAction) => {
    const state = get();
    const { countryAffinity, amenityAffinity } = state.personalization;

    let countryDelta = 0;
    let amenityDelta = 0;

    switch (action) {
      case 'like':
        countryDelta = 0.1;
        amenityDelta = 0.05;
        break;
      case 'superlike':
        countryDelta = 0.2;
        amenityDelta = 0.1;
        break;
      case 'dismiss':
        countryDelta = -0.05;
        amenityDelta = -0.02;
        break;
    }

    // Update country affinity
    const newCountryAffinity = {
      ...countryAffinity,
      [country]: Math.max(0, Math.min(1, (countryAffinity[country] || 0) + countryDelta)),
    };

    // Update amenity affinity
    const newAmenityAffinity = { ...amenityAffinity };
    amenityTags.forEach(tag => {
      newAmenityAffinity[tag] = Math.max(0, Math.min(1, (amenityAffinity[tag] || 0) + amenityDelta));
    });

    set({
      personalization: {
        ...state.personalization,
        countryAffinity: newCountryAffinity,
        amenityAffinity: newAmenityAffinity,
      },
    });
  },

  // Load persisted data from AsyncStorage
  loadPersistedData: async () => {
    try {
      const [personalizationData, savedHotelsData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.PERSONALIZATION),
        AsyncStorage.getItem(STORAGE_KEYS.SAVED_HOTELS),
      ]);

      if (personalizationData) {
        const personalization = JSON.parse(personalizationData);
        set({ personalization });
      }

      if (savedHotelsData) {
        const savedHotels = JSON.parse(savedHotelsData);
        set({ savedHotels });
      }
    } catch (error) {
      console.error('Failed to load persisted data:', error);
    }
  },

  // Persist data to AsyncStorage
  persistData: async () => {
    try {
      const state = get();
      await Promise.all([
        AsyncStorage.setItem(
          STORAGE_KEYS.PERSONALIZATION,
          JSON.stringify(state.personalization)
        ),
        AsyncStorage.setItem(
          STORAGE_KEYS.SAVED_HOTELS,
          JSON.stringify(state.savedHotels)
        ),
      ]);
    } catch (error) {
      console.error('Failed to persist data:', error);
    }
  },

  // Seed hotels via API
  seedHotels: async () => {
    set({ loading: true, error: null });
    
    try {
      await apiClient.seedHotels();
      // After seeding, load the hotels
      await get().loadHotels(true);
    } catch (error) {
      console.error('Failed to seed hotels:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to seed hotels',
        loading: false 
      });
    }
  },

  // Reset error state
  resetError: () => set({ error: null }),

  // AUTH METHODS

  // Request OTP code via email
  requestOTP: async (email: string) => {
    console.log('🏪 Store: Starting OTP request for', email);
    set({ isLoading: true, error: null });
    
    try {
      console.log('🏪 Store: Calling API client...');
      const response = await apiClient.requestOTP({ email });
      console.log('🏪 Store: API client response:', response);
      
      set({ isLoading: false });
      
      const result = {
        success: response.success || false,
        message: response.message,
        error: response.error,
      };
      
      console.log('🏪 Store: Returning result:', result);
      return result;
    } catch (error) {
      console.log('🏪 Store: API client threw error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send OTP';
      set({ 
        isLoading: false,
        error: errorMessage,
      });
      
      const result = {
        success: false,
        error: errorMessage,
      };
      
      console.log('🏪 Store: Returning error result:', result);
      return result;
    }
  },

  // Verify OTP code and authenticate user
  verifyOTP: async (email: string, code: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await apiClient.verifyOTP({ email, code });
      
      if (response.success && response.user && response.token) {
        // Store auth data
        await Promise.all([
          AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.token),
          AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(response.user)),
        ]);
        
        // Set auth token in API client
        apiClient.setAuthToken(response.token);
        
        // Update state
        set({
          user: response.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        
        return {
          success: true,
          message: response.message,
        };
      } else {
        set({ 
          isLoading: false,
          error: response.error || 'Invalid verification code',
        });
        
        return {
          success: false,
          error: response.error || 'Invalid verification code',
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to verify OTP';
      set({ 
        isLoading: false,
        error: errorMessage,
      });
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  // Logout user
  logout: async () => {
    try {
      // Clear stored auth data
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA),
      ]);
      
      // Clear auth token from API client
      apiClient.setAuthToken(null);
      
      // Reset auth state
      set({
        user: null,
        isAuthenticated: false,
        error: null,
      });
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  },

  // Check if user is already authenticated (on app startup)
  checkAuthStatus: async () => {
    set({ isLoading: true });
    
    try {
      const [token, userData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.USER_DATA),
      ]);
      
      if (token && userData) {
        const user = JSON.parse(userData);
        
        // Verify token is still valid with API
        try {
          const isValid = await apiClient.verifyToken(token);
          
          if (isValid) {
            // Set auth token in API client
            apiClient.setAuthToken(token);
            
            set({
              user,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            // Token expired, clear auth data
            await get().logout();
            set({ isLoading: false });
          }
        } catch (error) {
          // If verification fails, assume token is invalid
          await get().logout();
          set({ isLoading: false });
        }
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Failed to check auth status:', error);
      set({ isLoading: false });
    }
  },

  // Clear authentication error
  clearAuthError: () => set({ error: null }),

  // Set OTP verification state
  setVerifyingOTP: (verifying: boolean) => set({ isVerifyingOTP: verifying }),

  // Set OTP email
  setOTPEmail: (email: string | null) => set({ otpEmail: email }),
})); 
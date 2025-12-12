import { ImageSourcePropType } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiConfig } from '../config/api';

// AsyncStorage keys
const BG_INDEX_KEY = '@glintz_bgIndex';
const BG_LAST_CHANGE_KEY = '@glintz_lastBgChange';
const BG_PHOTOS_CACHE_KEY = '@glintz_bgPhotosCache';
const BG_PHOTOS_FETCH_TIME_KEY = '@glintz_bgPhotosFetchTime';

// Rotation interval: 6 hours in milliseconds (more frequent updates)
const ROTATION_INTERVAL = 6 * 60 * 60 * 1000;

// Cache photos list for 12 hours (refresh twice daily to get new photos)
const PHOTOS_CACHE_DURATION = 12 * 60 * 60 * 1000;

// Number of random photos to fetch (will use all available if more)
const PHOTO_POOL_SIZE = 50;

// API Configuration - initialized with default, updated asynchronously
let API_BASE_URL = 'http://localhost:3001'; // Default fallback

// Initialize API configuration
(async () => {
  try {
    const config = await getApiConfig();
    API_BASE_URL = config.baseUrl;
    console.log(`✅ Background rotation using API: ${API_BASE_URL}`);
  } catch (error) {
    console.error('⚠️  Failed to get API config for backgrounds, using default:', API_BASE_URL);
  }
})();

export type BgPhoto = {
  url: string;
  width: number;
  hotelName: string;
  city: string;
  country: string;
  caption: string;
};

export type BgRotationResult = {
  imageSource: ImageSourcePropType;
  index: number;
  caption: string;
  hotelName: string;
};

/**
 * Fetch best quality photos from API
 */
const fetchBestQualityPhotos = async (): Promise<BgPhoto[]> => {
  try {
    // Ensure we have the latest API configuration
    if (API_BASE_URL === 'http://localhost:3001') {
      console.log('🔄 Re-checking API configuration...');
      try {
        const config = await getApiConfig();
        API_BASE_URL = config.baseUrl;
        console.log(`✅ Updated API URL: ${API_BASE_URL}`);
      } catch (configError) {
        console.warn('⚠️  Could not update API config, using:', API_BASE_URL);
      }
    }
    
    const apiUrl = `${API_BASE_URL}/api/onboarding/photos?limit=${PHOTO_POOL_SIZE}`;
    console.log(`📸 Fetching ${PHOTO_POOL_SIZE} best quality photos from: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log(`📸 API Response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API error response: ${errorText}`);
      throw new Error(`API returned ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    
    if (!data.photos || !Array.isArray(data.photos) || data.photos.length === 0) {
      throw new Error('No photos returned from API');
    }
    
    console.log(`✅ Fetched ${data.photos.length} best quality hotel photos`);
    const avgWidth = Math.round(data.photos.reduce((sum: number, p: BgPhoto) => sum + p.width, 0) / data.photos.length);
    console.log(`📏 Average width: ${avgWidth}px`);
    console.log(`📸 First photo: ${data.photos[0].hotelName} (${data.photos[0].city})`);
    
    return data.photos;
  } catch (error) {
    console.error('❌ Failed to fetch photos from API:', error);
    console.error(`❌ API URL used: ${API_BASE_URL}/api/onboarding/photos`);
    if (error instanceof Error) {
      console.error(`❌ Error message: ${error.message}`);
    }
    
    // If endpoint doesn't exist (404), return empty array instead of throwing
    // This allows the app to use fallback backgrounds
    if (error instanceof Error && error.message.includes('404')) {
      console.warn('⚠️  Onboarding photos endpoint not available, using fallback');
      return [];
    }
    
    throw error;
  }
};

/**
 * Get cached photos or fetch new ones
 */
const getPhotoPool = async (): Promise<BgPhoto[]> => {
  try {
    // Check if we have cached photos
    const cachedPhotosStr = await AsyncStorage.getItem(BG_PHOTOS_CACHE_KEY);
    const cachedTimeStr = await AsyncStorage.getItem(BG_PHOTOS_FETCH_TIME_KEY);
    
    const now = Date.now();
    const cachedTime = cachedTimeStr ? parseInt(cachedTimeStr, 10) : 0;
    const timeSinceFetch = now - cachedTime;
    
    // Use cache if less than 24 hours old AND not empty
    if (cachedPhotosStr && timeSinceFetch < PHOTOS_CACHE_DURATION) {
      const cachedPhotos = JSON.parse(cachedPhotosStr);
      // Don't use empty cache - it was from a failed fetch
      if (cachedPhotos.length > 0) {
        console.log(`📦 Using cached photos (fetched ${Math.round(timeSinceFetch / 3600000)}h ago)`);
        return cachedPhotos;
      } else {
        console.warn('⚠️  Cached photos is empty, clearing bad cache');
        await AsyncStorage.removeItem(BG_PHOTOS_CACHE_KEY);
        await AsyncStorage.removeItem(BG_PHOTOS_FETCH_TIME_KEY);
      }
    }
    
    // Fetch fresh photos
    const photos = await fetchBestQualityPhotos();
    
    // If no photos returned (endpoint doesn't exist), return empty array
    // Don't cache empty results - they would cause repeated failures
    if (photos.length === 0) {
      console.warn('⚠️  No photos available from API, will use fallback');
      // Clear any bad cache
      await AsyncStorage.removeItem(BG_PHOTOS_CACHE_KEY);
      await AsyncStorage.removeItem(BG_PHOTOS_FETCH_TIME_KEY);
      return [];
    }
    
    // Only cache if we have actual photos
    await AsyncStorage.setItem(BG_PHOTOS_CACHE_KEY, JSON.stringify(photos));
    await AsyncStorage.setItem(BG_PHOTOS_FETCH_TIME_KEY, now.toString());
    
    console.log(`✅ Cached ${photos.length} photos for future use`);
    
    return photos;
  } catch (error) {
    console.error('Error getting photo pool:', error);
    
    // Try to use old cache as fallback
    const cachedPhotosStr = await AsyncStorage.getItem(BG_PHOTOS_CACHE_KEY);
    if (cachedPhotosStr) {
      console.log('📦 Using old cached photos as fallback');
      return JSON.parse(cachedPhotosStr);
    }
    
    // If no cache and error, return empty array (will trigger fallback in getCurrentBackground)
    console.warn('⚠️  No photos available, will use fallback background');
    return [];
  }
};

/**
 * Get the current background image based on 12h rotation logic
 * - If last change was < 12h ago, reuse saved index
 * - Otherwise, pick a new random index from the photo pool
 */
export const getCurrentBackground = async (): Promise<BgRotationResult> => {
  try {
    // Get photo pool (cached or fresh)
    const photoPool = await getPhotoPool();
    
    if (photoPool.length === 0) {
      // Return fallback instead of throwing
      console.warn('⚠️  No photos in pool, using fallback background');
      return {
        imageSource: require('../../assets/icon.png'),
        index: 0,
        caption: 'Welcome to Glintz',
        hotelName: 'Glintz',
      };
    }
    
    const savedIndexStr = await AsyncStorage.getItem(BG_INDEX_KEY);
    const savedTimeStr = await AsyncStorage.getItem(BG_LAST_CHANGE_KEY);
    
    const now = Date.now();
    const savedTime = savedTimeStr ? parseInt(savedTimeStr, 10) : 0;
    const timeSinceLastChange = now - savedTime;
    
    let currentIndex: number;
    
    // If we have a saved index and it's been less than rotation interval, reuse it
    if (savedIndexStr !== null && timeSinceLastChange < ROTATION_INTERVAL) {
      currentIndex = parseInt(savedIndexStr, 10);
      // Make sure index is valid for current photo pool
      if (currentIndex >= photoPool.length) {
        // Pool grew, pick new random index
        currentIndex = Math.floor(Math.random() * photoPool.length);
        await AsyncStorage.setItem(BG_INDEX_KEY, currentIndex.toString());
        await AsyncStorage.setItem(BG_LAST_CHANGE_KEY, now.toString());
        console.log(`🖼️ Pool grew, new random background: ${currentIndex}`);
      } else {
        console.log(`🖼️ Reusing background ${currentIndex} (last changed ${Math.round(timeSinceLastChange / 3600000)}h ago)`);
      }
    } else {
      // Pick a new random index (ensuring it's different from last one if possible)
      let newIndex = Math.floor(Math.random() * photoPool.length);
      
      // If pool is large enough, try to avoid showing the same photo
      if (photoPool.length > 1 && savedIndexStr !== null) {
        const lastIndex = parseInt(savedIndexStr, 10);
        // If we picked the same index, try once more
        if (newIndex === lastIndex) {
          newIndex = Math.floor(Math.random() * photoPool.length);
        }
      }
      
      currentIndex = newIndex;
      
      // Save the new index and timestamp
      await AsyncStorage.setItem(BG_INDEX_KEY, currentIndex.toString());
      await AsyncStorage.setItem(BG_LAST_CHANGE_KEY, now.toString());
      
      console.log(`🖼️ New random background selected: ${currentIndex} of ${photoPool.length} (rotation triggered)`);
    }
    
    const selectedPhoto = photoPool[currentIndex];
    
    console.log(`📸 Selected photo: ${selectedPhoto.hotelName}, ${selectedPhoto.city} (${selectedPhoto.width}px)`);
    
    return {
      imageSource: { uri: selectedPhoto.url },
      index: currentIndex,
      caption: selectedPhoto.caption,
      hotelName: selectedPhoto.hotelName,
    };
  } catch (error) {
    console.error('Error in background rotation:', error);
    
    // Return a fallback background instead of throwing
    // This allows the app to continue working even if photos can't be loaded
    console.warn('⚠️  Using fallback background due to error');
    
    return {
      imageSource: require('../../assets/icon.png'), // Fallback to app icon
      index: 0,
      caption: 'Welcome to Glintz',
      hotelName: 'Glintz',
    };
  }
};

/**
 * Preload the current background image for smooth display
 * Returns immediately - expo-image handles caching and progressive loading
 */
export const preloadBackground = async (): Promise<BgRotationResult> => {
  try {
    console.log('🖼️  Getting background (expo-image will handle caching)...');
    const bgData = await getCurrentBackground();
    
    // With expo-image, we don't need to prefetch - it handles caching automatically
    // Just return the data immediately so UI can show
    const isRemoteImage = bgData.imageSource && 
      typeof bgData.imageSource === 'object' && 
      'uri' in bgData.imageSource;
    
    if (isRemoteImage) {
      const imageUri = (bgData.imageSource as { uri: string }).uri;
      console.log(`🖼️  Background image: ${imageUri.substring(0, 80)}...`);
      console.log('✅ expo-image will cache and load progressively');
    } else {
      console.log('✅ Using local fallback background');
    }
    
    // Return immediately - expo-image will handle loading/caching
    return bgData;
  } catch (error) {
    console.error('❌ Failed to get background:', error);
    if (error instanceof Error) {
      console.error('❌ Error details:', error.message);
    }
    
    // Return fallback instead of throwing
    console.warn('⚠️  Returning fallback background due to error');
    return {
      imageSource: require('../../assets/icon.png'),
      index: 0,
      caption: 'Welcome to Glintz',
      hotelName: 'Glintz',
    };
  }
};

/**
 * Force refresh the photo pool (useful for testing)
 */
export const refreshPhotoPool = async (): Promise<void> => {
  console.log('🔄 Force refreshing photo pool...');
  await AsyncStorage.removeItem(BG_PHOTOS_CACHE_KEY);
  await AsyncStorage.removeItem(BG_PHOTOS_FETCH_TIME_KEY);
  await getPhotoPool();
};


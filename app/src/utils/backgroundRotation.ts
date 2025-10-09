import { ImageSourcePropType } from 'react-native';
import { Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiConfig } from '../config/api';

// AsyncStorage keys
const BG_INDEX_KEY = '@glintz_bgIndex';
const BG_LAST_CHANGE_KEY = '@glintz_lastBgChange';
const BG_PHOTOS_CACHE_KEY = '@glintz_bgPhotosCache';
const BG_PHOTOS_FETCH_TIME_KEY = '@glintz_bgPhotosFetchTime';

// Rotation interval: 12 hours in milliseconds
const ROTATION_INTERVAL = 12 * 60 * 60 * 1000;

// Cache photos list for 24 hours (refresh daily)
const PHOTOS_CACHE_DURATION = 24 * 60 * 60 * 1000;

// Number of best quality photos to fetch
const PHOTO_POOL_SIZE = 30;

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
    
    // Use cache if less than 24 hours old
    if (cachedPhotosStr && timeSinceFetch < PHOTOS_CACHE_DURATION) {
      const cachedPhotos = JSON.parse(cachedPhotosStr);
      console.log(`📦 Using cached photos (fetched ${Math.round(timeSinceFetch / 3600000)}h ago)`);
      return cachedPhotos;
    }
    
    // Fetch fresh photos
    const photos = await fetchBestQualityPhotos();
    
    // Cache them
    await AsyncStorage.setItem(BG_PHOTOS_CACHE_KEY, JSON.stringify(photos));
    await AsyncStorage.setItem(BG_PHOTOS_FETCH_TIME_KEY, now.toString());
    
    console.log(`✅ Cached ${photos.length} photos for future use`);
    
    return photos;
  } catch (error) {
    console.error('Error getting photo pool:', error);
    
    // Try to use old cache as fallback
    const cachedPhotosStr = await AsyncStorage.getItem(BG_PHOTOS_CACHE_KEY);
    if (cachedPhotosStr) {
      console.log('⚠️ Using stale cache as fallback');
      return JSON.parse(cachedPhotosStr);
    }
    
    throw error;
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
      throw new Error('No photos available');
    }
    
    const savedIndexStr = await AsyncStorage.getItem(BG_INDEX_KEY);
    const savedTimeStr = await AsyncStorage.getItem(BG_LAST_CHANGE_KEY);
    
    const now = Date.now();
    const savedTime = savedTimeStr ? parseInt(savedTimeStr, 10) : 0;
    const timeSinceLastChange = now - savedTime;
    
    let currentIndex: number;
    
    // If we have a saved index and it's been less than 12 hours, reuse it
    if (savedIndexStr !== null && timeSinceLastChange < ROTATION_INTERVAL) {
      currentIndex = parseInt(savedIndexStr, 10);
      // Make sure index is valid for current photo pool
      if (currentIndex >= photoPool.length) {
        currentIndex = 0;
      }
      console.log(`🖼️ Reusing background ${currentIndex} (last changed ${Math.round(timeSinceLastChange / 3600000)}h ago)`);
    } else {
      // Pick a new random index
      currentIndex = Math.floor(Math.random() * photoPool.length);
      
      // Save the new index and timestamp
      await AsyncStorage.setItem(BG_INDEX_KEY, currentIndex.toString());
      await AsyncStorage.setItem(BG_LAST_CHANGE_KEY, now.toString());
      
      console.log(`🖼️ New background selected: ${currentIndex} (rotation triggered)`);
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
    
    // Return a placeholder or throw
    throw new Error('Failed to load background image');
  }
};

/**
 * Preload the current background image for smooth display
 */
export const preloadBackground = async (): Promise<BgRotationResult> => {
  try {
    console.log('🖼️  Starting background preload...');
    const bgData = await getCurrentBackground();
    
    // Preload the image for smooth display
    if (bgData.imageSource && 'uri' in bgData.imageSource && bgData.imageSource.uri) {
      const imageUri = bgData.imageSource.uri;
      console.log(`🖼️  Preloading image: ${imageUri.substring(0, 100)}...`);
      
      try {
        await Image.prefetch(imageUri);
        console.log('✅ Background image preloaded successfully');
      } catch (prefetchError) {
        console.warn('⚠️  Image prefetch failed, but will still try to display:', prefetchError);
        // Don't throw - the image might still load when displayed
      }
    }
    
    return bgData;
  } catch (error) {
    console.error('❌ Failed to preload background:', error);
    if (error instanceof Error) {
      console.error('❌ Error details:', error.message);
      console.error('❌ Error stack:', error.stack);
    }
    throw new Error('Failed to load background image');
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


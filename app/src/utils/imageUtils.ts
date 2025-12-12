export const getImageUrl = (photo: any): string => {
  // If it's a JSON string, try to parse it and extract URL
  if (typeof photo === 'string' && photo.startsWith('{')) {
    try {
      const parsed = JSON.parse(photo);
      if (parsed.url) {
        return parsed.url;
      }
    } catch (e) {
      // If parsing fails, fall through to direct usage
    }
  }
  
  // If it's an object with url property
  if (typeof photo === 'object' && photo && photo.url) {
    return photo.url;
  }
  
  // If it's already a string URL, use it directly
  if (typeof photo === 'string') {
    return photo;
  }
  
  // Fallback
  return '';
};

export const getImageSource = (photo: any) => {
  const url = getImageUrl(photo);
  
  if (!url || url.trim() === '') {
    console.warn('⚠️ getImageSource: Empty URL provided', photo);
    return { uri: '' };
  }
  
  // Validate URL format
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    console.warn('⚠️ getImageSource: Invalid URL format', url);
    return { uri: '' };
  }
  
  // expo-image expects simple { uri: string } format
  // Caching is handled by the Image component's cachePolicy prop
  return { uri: url };
};

export const getPhotoSource = (photo: any): string => {
  if (typeof photo === 'string' && photo.startsWith('{')) {
    try {
      const parsed = JSON.parse(photo);
      if (parsed.source) {
        return parsed.source;
      }
    } catch (e) {
      // fall through
    }
  }
  
  if (typeof photo === 'object' && photo && photo.source) {
    return photo.source;
  }
  
  if (typeof photo === 'string') {
    if (photo.includes('maps.googleapis.com')) {
      return 'Google Places';
    } else if (photo.includes('unsplash.com')) {
      return 'Unsplash';
    } else if (photo.includes('serpapi')) {
      return 'SerpAPI';
    }
  }
  
  return 'Unknown';
};


// Image preloading utility for better performance
export const preloadImages = async (urls: string[]): Promise<void> => {
  const validUrls = urls.filter(url => url && typeof url === 'string' && url.trim() !== '');
  
  if (validUrls.length === 0) {
    return;
  }

  // Batch preload with concurrency limit
  const batchSize = 3;
  for (let i = 0; i < validUrls.length; i += batchSize) {
    const batch = validUrls.slice(i, i + batchSize);
    await Promise.allSettled(
      batch.map(async (url) => {
        try {
          // Preload using expo-image
          const { Image } = require('expo-image');
          await Image.prefetch(url);
        } catch (error) {
          console.warn(`Failed to preload image ${url}:`, error);
        }
      })
    );
  }
};
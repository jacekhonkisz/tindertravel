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
      console.warn('Failed to parse photo JSON in getImageUrl');
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

export const getPhotoSource = (photo: any): string => {
  // First, try to parse JSON string to get source metadata
  if (typeof photo === 'string' && photo.startsWith('{')) {
    try {
      const parsed = JSON.parse(photo);
      if (parsed.source) {
        return parsed.source;
      }
      // If no source in parsed object, check the URL
      if (parsed.url) {
        return detectSourceFromUrl(parsed.url);
      }
    } catch (e) {
      // fall through to URL detection
    }
  }
  
  // If it's an object with source property, use it
  if (typeof photo === 'object' && photo && photo.source) {
    return photo.source;
  }
  
  // If it's an object with URL, check the URL
  if (typeof photo === 'object' && photo && photo.url) {
    return detectSourceFromUrl(photo.url);
  }
  
  // If it's a plain string URL, detect from URL patterns
  if (typeof photo === 'string') {
    return detectSourceFromUrl(photo);
  }
  
  return 'Unknown';
};

// Helper function to detect source from URL patterns
const detectSourceFromUrl = (url: string): string => {
  if (url.includes('maps.googleapis.com')) {
    return 'Google Places';
  } else if (url.includes('images.unsplash.com') || url.includes('unsplash.com')) {
    return 'Unsplash';
  } else if (url.includes('serpapi')) {
    return 'SerpAPI';
  } else if (url.includes('pexels.com')) {
    return 'Pexels';
  } else if (url.includes('pixabay.com')) {
    return 'Pixabay';
  }
  return 'Unknown';
};

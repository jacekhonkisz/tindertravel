import React, { useState } from 'react';
import { Image, ImageProps } from 'expo-image';
import { View, StyleSheet } from 'react-native';

interface UnsplashImageProps extends Omit<ImageProps, 'source'> {
  source: any;
  fallbackSource?: any;
}

const UnsplashImage: React.FC<UnsplashImageProps> = ({ 
  source, 
  fallbackSource,
  onError,
  ...props 
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleError = (error: any) => {
    console.log('Image load error:', error);
    setHasError(true);
    setIsLoading(false);
    onError?.(error);
  };

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  // If there's an error and we have a fallback, use it
  if (hasError && fallbackSource) {
    return (
      <Image
        source={fallbackSource}
        onError={handleError}
        onLoad={handleLoad}
        {...props}
      />
    );
  }

  // If there's an error and no fallback, show a placeholder
  if (hasError) {
    return (
      <View style={[styles.placeholder, props.style]}>
        {/* You can add a placeholder image or text here */}
      </View>
    );
  }

  return (
    <Image
      source={source}
      onError={handleError}
      onLoad={handleLoad}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default UnsplashImage;

/**
 * Example Usage: Hotel Feed Screen with Photo View System
 * Demonstrates integration of the 3-mode photo view system
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SwipePhotoCard } from '../components/SwipePhotoCard';
import { usePhotoViewMode } from '../hooks/usePhotoViewMode';
import { PhotoMetadata } from '../types/photoView';
import { inferPhotoTag } from '../utils/photoAnchor';

// Example hotel data
interface Hotel {
  id: string;
  name: string;
  location: string;
  photos: PhotoMetadata[];
}

/**
 * Hotel Feed Screen - Tinder-style swipe interface
 */
export function HotelFeedScreen() {
  const { viewMode, setViewMode, isLoading } = usePhotoViewMode();
  const [currentIndex, setCurrentIndex] = React.useState(0);

  // Mock data - replace with real data
  const hotels: Hotel[] = [
    {
      id: '1',
      name: 'Gran Hotel Bahia del Duque',
      location: 'Tenerife, Spain',
      photos: [
        {
          uri: 'https://example.com/photo1.jpg',
          width: 1920,
          height: 1080,
          tag: 'exterior',
        },
        {
          uri: 'https://example.com/photo2.jpg',
          width: 1920,
          height: 1280,
          tag: 'pool',
        },
      ],
    },
    // Add more hotels...
  ];

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const currentHotel = hotels[currentIndex];
  const currentPhoto = currentHotel?.photos[0];

  if (!currentPhoto) {
    return null;
  }

  // Infer photo tag if not provided
  if (!currentPhoto.tag) {
    currentPhoto.tag = inferPhotoTag(currentPhoto.uri);
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % hotels.length);
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + hotels.length) % hotels.length);
  };

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <SwipePhotoCard
          photo={currentPhoto}
          viewMode={viewMode}
          onModeChange={setViewMode}
          showDebug={__DEV__}
          hotelInfo={
            <View style={styles.hotelInfo}>
              <View style={styles.infoContent}>
                <Text style={styles.hotelName}>{currentHotel.name}</Text>
                <Text style={styles.hotelLocation}>
                  {currentHotel.location}
                </Text>
              </View>
              
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.button, styles.rejectButton]}
                  onPress={handlePrevious}
                >
                  <Text style={styles.buttonIcon}>✕</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.button, styles.likeButton]}
                  onPress={handleNext}
                >
                  <Text style={styles.buttonIcon}>♥</Text>
                </TouchableOpacity>
              </View>
            </View>
          }
        />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hotelInfo: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  infoContent: {
    marginBottom: 20,
  },
  hotelName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  hotelLocation: {
    fontSize: 16,
    color: '#666666',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 'auto',
  },
  button: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  rejectButton: {
    backgroundColor: '#FF4458',
  },
  likeButton: {
    backgroundColor: '#00D68F',
  },
  buttonIcon: {
    fontSize: 28,
    color: '#FFFFFF',
  },
});


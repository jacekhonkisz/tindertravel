import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Text,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import SwipeDeck from '../components/SwipeDeck';
import IOSHaptics from '../utils/IOSHaptics';
import { useAppStore } from '../store';
import { RootStackParamList, SwipeAction } from '../types';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  
  const {
    hotels,
    currentIndex,
    loading,
    error,
    hasMore,
    loadHotels,
    swipeHotel,
    seedHotels,
    resetError,
    loadPersistedData,
  } = useAppStore();

  // Load persisted data and hotels on mount
  useEffect(() => {
    const initializeApp = async () => {
      await loadPersistedData();
      await loadHotels();
    };
    
    initializeApp();
  }, []);

  // Handle swipe actions
  const handleSwipe = async (hotelId: string, action: SwipeAction) => {
    // Details are now handled within SwipeDeck component
    // No navigation needed - just process the swipe action
    await swipeHotel(hotelId, action);
  };

  // Handle seed hotels
  const handleSeedHotels = () => {
    Alert.alert(
      'Seed Hotels',
      'This will fetch fresh hotel data from Amadeus. This may take a few moments.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Seed', onPress: seedHotels },
      ]
    );
  };

  // Handle error retry
  const handleRetry = () => {
    resetError();
    loadHotels(true);
  };

  // Show error state
  if (error && !loading) {
    const isNotSeeded = error.includes('seed');
    
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>
            {isNotSeeded ? 'Welcome to Glintz!' : 'Oops!'}
          </Text>
          <Text style={styles.errorMessage}>{error}</Text>
          
          <View style={styles.errorActions}>
            {isNotSeeded ? (
              <TouchableOpacity style={styles.seedButton} onPress={handleSeedHotels}>
                <Text style={styles.seedButtonText}>Discover Hotels</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Swipe Deck - Fullscreen */}
      <SwipeDeck
        hotels={hotels}
        currentIndex={currentIndex}
        onSwipe={handleSwipe}
        loading={loading}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 15,
  },
  errorMessage: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  errorActions: {
    alignItems: 'center',
  },
  seedButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    minWidth: 200,
  },
  seedButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    minWidth: 200,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default HomeScreen; 
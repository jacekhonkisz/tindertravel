import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Text,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import SwipeDeck from '../components/SwipeDeck';
import IOSHaptics from '../utils/IOSHaptics';
import { useAppStore } from '../store';
import { RootStackParamList, SwipeAction } from '../types';
import { useTheme } from '../theme';
import { Button } from '../ui';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  
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

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.bg,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.xxl + theme.spacing.s,
    },
    errorTitle: {
      fontSize: 28,
      fontWeight: '600',
      color: theme.textPrimary,
      textAlign: 'center',
      marginBottom: theme.spacing.l,
    },
    errorMessage: {
      fontSize: 17,
      color: theme.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: theme.spacing.xl,
    },
    errorActions: {
      alignItems: 'center',
      width: '100%',
    },
  });

  // Show error state
  if (error && !loading) {
    const isNotSeeded = error.includes('seed');
    
    return (
      <View style={styles.container}>
        <StatusBar 
          barStyle="light-content"
          backgroundColor={theme.bg}
          hidden={true} // Hide status bar for consistency
        />
        
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>
            {isNotSeeded ? 'Welcome to Glintz!' : 'Oops!'}
          </Text>
          <Text style={styles.errorMessage}>{error}</Text>
          
          <View style={styles.errorActions}>
            {isNotSeeded ? (
              <Button 
                title="Discover Hotels" 
                onPress={handleSeedHotels}
                variant="primary"
              />
            ) : (
              <Button 
                title="Try Again" 
                onPress={handleRetry}
                variant="secondary"
              />
            )}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle="light-content"
        backgroundColor={theme.bg}
        hidden={true} // Hide status bar for true full-screen photos
      />
      
      {/* Swipe Deck - Fullscreen */}
      <SwipeDeck
        hotels={hotels}
        currentIndex={currentIndex}
        onSwipe={handleSwipe}
        loading={loading}
        navigation={navigation}
      />
    </View>
  );
};



export default HomeScreen; 
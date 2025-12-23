import React, { useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Text,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import SwipeDeck from '../components/SwipeDeck';
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
    loadHotels,
    swipeHotel,
    seedHotels,
    resetError,
  } = useAppStore();

  // Load hotels on mount only if not already loaded (App.tsx preloads)
  useEffect(() => {
    if (hotels.length === 0 && !loading) {
      loadHotels();
    }
  }, []);

  // Handle swipe actions - synchronous for instant UI response
  const handleSwipe = (hotelId: string, action: SwipeAction) => {
    // Details are now handled within SwipeDeck component
    // No navigation needed - just process the swipe action
    swipeHotel(hotelId, action);
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

  // Memoize styles to prevent recreation on every render
  const styles = useMemo(() => StyleSheet.create({
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
  }), [theme]); // Only recreate if theme changes

  // Show error state
  if (error && !loading) {
    const isNotSeeded = error.includes('seed');
    
    return (
      <View style={styles.container}>
        <StatusBar 
          barStyle="dark-content"
          backgroundColor={theme.bg}
          hidden={false} // Show status bar
        />
        
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>
            {isNotSeeded ? 'Your next stay is waiting ✦' : 'Oops!'}
          </Text>
          <Text style={styles.errorMessage}>
            {isNotSeeded 
              ? 'Swipe to discover, tap to fall in love with your perfect boutique hotel.' 
              : error
            }
          </Text>
          
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
        hidden={true} // Hide status bar for true full-screen hotel photos
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
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, HotelCard } from '../types';
import { useAppStore } from '../store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type HotelCollectionScreenRouteProp = RouteProp<RootStackParamList, 'HotelCollection'>;
type HotelCollectionScreenNavigationProp = StackNavigationProp<RootStackParamList, 'HotelCollection'>;

const HotelCollectionScreen: React.FC = () => {
  const navigation = useNavigation<HotelCollectionScreenNavigationProp>();
  const route = useRoute<HotelCollectionScreenRouteProp>();
  const { type, title } = route.params;
  
  const { savedHotels, removeSavedHotel } = useAppStore();
  
  const hotels = type === 'superlike' ? savedHotels.superliked : savedHotels.liked;

  const formatPrice = (price?: { amount: string; currency: string }) => {
    if (!price) return 'Price on request';
    
    const amount = parseFloat(price.amount);
    const currency = price.currency === 'EUR' ? '€' : price.currency;
    
    return `${currency}${Math.round(amount)}`;
  };

  const handleHotelPress = (hotel: HotelCard) => {
    navigation.navigate('Details', { hotel });
  };

  const handleRemoveHotel = (hotelId: string) => {
    Alert.alert(
      'Remove Hotel',
      `Are you sure you want to remove this hotel from your ${type === 'superlike' ? 'super liked' : 'liked'} collection?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => removeSavedHotel(hotelId, type)
        },
      ]
    );
  };

  const renderHotelCard = (hotel: HotelCard) => (
    <TouchableOpacity
      key={hotel.id}
      style={styles.hotelCard}
      onPress={() => handleHotelPress(hotel)}
      onLongPress={() => handleRemoveHotel(hotel.id)}
    >
      <Image
        source={{ uri: hotel.heroPhoto }}
        style={styles.hotelImage}
        contentFit="cover"
      />
      
      <View style={styles.hotelInfo}>
        <Text style={styles.hotelName} numberOfLines={2}>
          {hotel.name}
        </Text>
        <Text style={styles.hotelLocation} numberOfLines={1}>
          {hotel.city}, {hotel.country}
        </Text>
        {hotel.price && (
          <Text style={styles.hotelPrice}>
            from {formatPrice(hotel.price)}/night
          </Text>
        )}
      </View>

      {/* Type indicator */}
      <View style={[
        styles.typeIndicator,
        type === 'superlike' ? styles.superlikeIndicator : styles.likeIndicator
      ]}>
        <Text style={styles.typeIndicatorText}>
          {type === 'superlike' ? '★' : '♡'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>{title}</Text>
        
        <View style={styles.headerRight}>
          <Text style={styles.totalCount}>{hotels.length}</Text>
        </View>
      </View>

      {hotels.length === 0 ? (
        // Empty state
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No {type === 'superlike' ? 'Super Liked' : 'Liked'} Hotels</Text>
          <Text style={styles.emptyDescription}>
            You haven't {type === 'superlike' ? 'super liked' : 'liked'} any hotels yet.{'\n'}
            {type === 'superlike' 
              ? 'Swipe down on hotels you absolutely love!' 
              : 'Swipe right on hotels you like!'
            }
          </Text>
          <TouchableOpacity
            style={styles.discoverButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.discoverButtonText}>Discover Hotels</Text>
          </TouchableOpacity>
        </View>
      ) : (
        // Hotels list
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.hotelsGrid}>
            {hotels.map(hotel => renderHotelCard(hotel))}
          </View>
          
          {/* Instructions */}
          <View style={styles.instructions}>
            <Text style={styles.instructionText}>
              Tap to view details • Long press to remove
            </Text>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerRight: {
    width: 40,
    alignItems: 'center',
  },
  totalCount: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  hotelsGrid: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  hotelCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    marginBottom: 15,
    overflow: 'hidden',
  },
  hotelImage: {
    width: 100,
    height: 100,
  },
  hotelInfo: {
    flex: 1,
    padding: 15,
    justifyContent: 'center',
  },
  hotelName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  hotelLocation: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    marginBottom: 5,
  },
  hotelPrice: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '500',
  },
  typeIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  superlikeIndicator: {
    backgroundColor: '#FF6B35',
  },
  likeIndicator: {
    backgroundColor: '#4CAF50',
  },
  typeIndicatorText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  emptyDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  discoverButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  discoverButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  instructions: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  instructionText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default HotelCollectionScreen; 
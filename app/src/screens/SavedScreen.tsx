import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, HotelCard } from '../types';
import { useAppStore } from '../store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 60) / 2; // 2 cards per row with margins

type SavedScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Saved'>;

const SavedScreen: React.FC = () => {
  const navigation = useNavigation<SavedScreenNavigationProp>();
  const { savedHotels, removeSavedHotel } = useAppStore();

  const formatPrice = (price?: { amount: string; currency: string }) => {
    if (!price) return null;
    
    const amount = parseFloat(price.amount);
    const currency = price.currency === 'EUR' ? '€' : price.currency;
    
    return `${currency}${Math.round(amount)}`;
  };

  const handleHotelPress = (hotel: HotelCard) => {
    navigation.navigate('Details', { hotel });
  };

  const handleRemoveHotel = (hotelId: string, type: 'like' | 'superlike') => {
    Alert.alert(
      'Remove Hotel',
      'Are you sure you want to remove this hotel from your saved list?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeSavedHotel(hotelId, type),
        },
      ]
    );
  };

  const renderHotelCard = (hotel: HotelCard, type: 'like' | 'superlike') => (
    <TouchableOpacity
      key={hotel.id}
      style={styles.hotelCard}
      onPress={() => handleHotelPress(hotel)}
      onLongPress={() => handleRemoveHotel(hotel.id, type)}
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

  const renderSection = (title: string, hotels: HotelCard[], type: 'like' | 'superlike') => {
    if (hotels.length === 0) {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <View style={styles.emptySection}>
            <Text style={styles.emptyText}>
              No {type === 'superlike' ? 'super liked' : 'liked'} hotels yet
            </Text>
            <Text style={styles.emptySubtext}>
              {type === 'superlike' 
                ? 'Swipe down on hotels you absolutely love!' 
                : 'Swipe right on hotels you like!'
              }
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title} ({hotels.length})</Text>
        <View style={styles.hotelsGrid}>
          {hotels.map(hotel => renderHotelCard(hotel, type))}
        </View>
      </View>
    );
  };

  const totalSaved = savedHotels.liked.length + savedHotels.superliked.length;

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
        
        <Text style={styles.headerTitle}>Saved Hotels</Text>
        
        <View style={styles.headerRight}>
          {totalSaved > 0 && (
            <Text style={styles.totalCount}>{totalSaved}</Text>
          )}
        </View>
      </View>

      {totalSaved === 0 ? (
        // Empty state
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No saved hotels yet</Text>
          <Text style={styles.emptyDescription}>
            Start swiping to discover amazing hotels!{'\n'}
            Swipe right to like, swipe down to super like.
          </Text>
          <TouchableOpacity
            style={styles.discoverButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.discoverButtonText}>Discover Hotels</Text>
          </TouchableOpacity>
        </View>
      ) : (
        // Hotels list
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Super Liked Section */}
          {renderSection('Super Liked', savedHotels.superliked, 'superlike')}
          
          {/* Liked Section */}
          {renderSection('Liked', savedHotels.liked, 'like')}
          
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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerRight: {
    width: 44,
    alignItems: 'center',
  },
  totalCount: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  hotelsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 15,
  },
  hotelCard: {
    width: CARD_WIDTH,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 15,
    position: 'relative',
  },
  hotelImage: {
    width: '100%',
    height: 120,
  },
  hotelInfo: {
    padding: 12,
  },
  hotelName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  hotelLocation: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 6,
  },
  hotelPrice: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  typeIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  likeIndicator: {
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
  },
  superlikeIndicator: {
    backgroundColor: 'rgba(33, 150, 243, 0.9)',
  },
  typeIndicatorText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptySection: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
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
    fontSize: 18,
    fontWeight: '600',
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

export default SavedScreen; 
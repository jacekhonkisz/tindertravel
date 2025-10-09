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
import { useTheme } from '../theme';
import { Button, Card, Chip } from '../ui';
import { getImageSource } from '../utils/imageUtils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 60) / 2; // 2 cards per row with margins

type SavedScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Saved'>;

const SavedScreen: React.FC = () => {
  const navigation = useNavigation<SavedScreenNavigationProp>();
  const theme = useTheme();
  const { savedHotels, removeSavedHotel, logout, user } = useAppStore();

  const formatPrice = (price?: { amount: string; currency: string }) => {
    if (!price) return null;
    
    const amount = parseFloat(price.amount);
    const currency = price.currency === 'EUR' ? '€' : price.currency;
    
    return `${currency}${Math.round(amount)}`;
  };

  const handleHotelPress = (hotel: HotelCard) => {
    navigation.navigate('Details', { hotel });
  };

  const handleSeeAll = (type: 'like' | 'superlike') => {
    const categoryName = type === 'superlike' ? 'Super Liked' : 'Liked';
    
    navigation.navigate('HotelCollection', {
      type,
      title: `${categoryName} Hotels`
    });
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            await logout();
          }
        }
      ]
    );
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
      <Card variant="surface">
        <Image
          source={getImageSource(hotel.heroPhoto)}
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
          { backgroundColor: type === 'superlike' ? '#2196F3' : theme.success }
        ]}>
          <Text style={styles.typeIndicatorText}>
            {type === 'superlike' ? '★' : '♡'}
          </Text>
        </View>
      </Card>
    </TouchableOpacity>
  );

  const renderCompactHotelCard = (hotel: HotelCard, type: 'like' | 'superlike') => (
    <TouchableOpacity
      key={hotel.id}
      style={styles.compactHotelCard}
      onPress={() => handleHotelPress(hotel)}
      onLongPress={() => handleRemoveHotel(hotel.id, type)}
    >
      <Image
        source={getImageSource(hotel.heroPhoto)}
        style={styles.compactHotelImage}
        contentFit="cover"
      />
      
      <View style={styles.compactHotelBadge}>
        <Text style={styles.compactHotelBadgeText}>
          {type === 'superlike' ? '★' : '♡'}
        </Text>
      </View>
      
      <View style={styles.compactHotelInfo}>
        <Text style={styles.compactHotelName} numberOfLines={1}>
          {hotel.name}
        </Text>
        <Text style={styles.compactHotelLocation} numberOfLines={1}>
          {hotel.city}, {hotel.country}
        </Text>
        {hotel.price && (
          <Text style={styles.compactHotelPrice}>
            from {formatPrice(hotel.price)}/night
          </Text>
        )}
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

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.bg,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.xl,
      paddingVertical: theme.spacing.l,
    },
    backButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.chipBg,
      justifyContent: 'center',
      alignItems: 'center',
    },
    backButtonText: {
      fontSize: 24,
      color: theme.textPrimary,
      fontWeight: 'bold',
    },
    headerCenter: {
      flex: 1,
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: theme.typography?.titleSize || 22,
      fontWeight: '600',
      color: theme.textPrimary,
      letterSpacing: theme.typography?.letterSpacing || 0.01,
      lineHeight: theme.typography?.titleLineHeight || 28,
    },
    userEmail: {
      fontSize: theme.typography?.captionSize || 13,
      color: theme.textSecondary,
      marginTop: 2,
      letterSpacing: theme.typography?.letterSpacing || 0.01,
    },
    headerRight: {
      width: 80,
      alignItems: 'center',
    },
    logoutButton: {
      paddingHorizontal: theme.spacing.m,
      paddingVertical: theme.spacing.xs,
      backgroundColor: theme.chipBg,
      borderRadius: theme.spacing.xs,
    },
    logoutText: {
      fontSize: 13,
      color: theme.textPrimary,
      fontWeight: '500',
    },
    content: {
      flex: 1,
    },
    hotelCard: {
      width: CARD_WIDTH,
      marginBottom: theme.spacing.l,
    },
    hotelImage: {
      width: '100%',
      height: 120,
      borderTopLeftRadius: theme.radius.card,
      borderTopRightRadius: theme.radius.card,
    },
    hotelInfo: {
      padding: theme.spacing.m,
    },
    hotelName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.textPrimary,
      marginBottom: theme.spacing.xs,
      letterSpacing: theme.typography?.letterSpacing || 0.01,
    },
    hotelLocation: {
      fontSize: theme.typography?.captionSize || 13,
      color: theme.textSecondary,
      marginBottom: theme.spacing.xs,
      letterSpacing: theme.typography?.letterSpacing || 0.01,
    },
    hotelPrice: {
      fontSize: theme.typography?.captionSize || 13,
      color: theme.accent,
      fontWeight: '500',
      letterSpacing: theme.typography?.letterSpacing || 0.01,
    },
    typeIndicator: {
      position: 'absolute',
      top: theme.spacing.s,
      right: theme.spacing.s,
      width: 24,
      height: 24,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    typeIndicatorText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: 'bold',
    },
    profileStats: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      backgroundColor: theme.surface,
      marginHorizontal: theme.spacing.xl,
      marginVertical: theme.spacing.l,
      paddingVertical: theme.spacing.xl,
      borderRadius: theme.radius.card,
      ...theme.shadow.card,
    },
    statItem: {
      alignItems: 'center',
      flex: 1,
    },
    statNumber: {
      color: theme.textPrimary,
      fontSize: 24,
      fontWeight: '600',
      marginBottom: theme.spacing.xs,
      letterSpacing: theme.typography?.letterSpacing || 0.01,
    },
    statLabel: {
      color: theme.textSecondary,
      fontSize: theme.typography?.captionSize || 13,
      textAlign: 'center',
      letterSpacing: theme.typography?.letterSpacing || 0.01,
    },
    statDivider: {
      width: 1,
      height: 30,
      backgroundColor: theme.chipBorder,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.xxl + theme.spacing.s,
    },
    emptyTitle: {
      fontSize: 28,
      fontWeight: '600',
      color: theme.textPrimary,
      textAlign: 'center',
      marginBottom: theme.spacing.l,
      letterSpacing: theme.typography?.letterSpacing || 0.01,
    },
    emptyDescription: {
      fontSize: theme.typography?.bodySize || 17,
      color: theme.textSecondary,
      textAlign: 'center',
      lineHeight: theme.typography?.bodyLineHeight || 24,
      marginBottom: theme.spacing.xl,
      letterSpacing: theme.typography?.letterSpacing || 0.01,
    },
    categorySection: {
      marginBottom: theme.spacing.xl,
    },
    categoryHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.xl,
      marginBottom: theme.spacing.l,
    },
    categoryTitle: {
      color: theme.textPrimary,
      fontSize: theme.typography?.titleSize || 22,
      fontWeight: '600',
      letterSpacing: theme.typography?.letterSpacing || 0.01,
      lineHeight: theme.typography?.titleLineHeight || 28,
    },
    seeAllButton: {
      backgroundColor: theme.chipBg,
      paddingHorizontal: theme.spacing.m,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.radius.chip,
    },
    seeAllText: {
      color: theme.textPrimary,
      fontSize: 13,
      fontWeight: '500',
    },
    hotelScrollView: {
      paddingLeft: theme.spacing.xl,
    },
    hotelScrollContent: {
      paddingRight: theme.spacing.xl,
    },
    emptyRowMessage: {
      width: SCREEN_WIDTH - 40,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.xxl + theme.spacing.s,
      backgroundColor: theme.surface,
      borderRadius: theme.radius.card,
    },
    emptyRowText: {
      color: theme.textPrimary,
      fontSize: 16,
      fontWeight: '500',
      marginBottom: theme.spacing.xs,
    },
    emptyRowSubtext: {
      color: theme.textSecondary,
      fontSize: 13,
      textAlign: 'center',
    },
    compactHotelCard: {
      width: 160,
      backgroundColor: theme.surface,
      borderRadius: theme.radius.card,
      overflow: 'hidden',
      marginRight: theme.spacing.l,
      ...theme.shadow.card,
    },
    compactHotelImage: {
      width: '100%',
      height: 120,
    },
    compactHotelBadge: {
      position: 'absolute',
      top: theme.spacing.s,
      right: theme.spacing.s,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      borderRadius: 12,
      width: 24,
      height: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    compactHotelBadgeText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: 'bold',
    },
    compactHotelInfo: {
      padding: theme.spacing.m,
    },
    compactHotelName: {
      color: theme.textPrimary,
      fontSize: 13,
      fontWeight: '600',
      marginBottom: theme.spacing.xs,
    },
    compactHotelLocation: {
      color: theme.textSecondary,
      fontSize: 12,
      marginBottom: theme.spacing.xs,
    },
    compactHotelPrice: {
      color: theme.accent,
      fontSize: 12,
      fontWeight: '500',
    },
    scrollContainer: {
      position: 'relative',
    },
    scrollIndicator: {
      position: 'absolute',
      right: 10,
      top: '50%',
      transform: [{ translateY: -12 }],
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      borderRadius: 12,
      width: 24,
      height: 24,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1,
    },
    scrollIndicatorText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: 'bold',
    },
    instructions: {
      alignItems: 'center',
      paddingVertical: theme.spacing.xl,
    },
    instructionText: {
      color: theme.textSecondary,
      fontSize: 13,
      textAlign: 'center',
      opacity: 0.8,
    },
    section: {
      paddingHorizontal: theme.spacing.xl,
      paddingBottom: theme.spacing.xl,
    },
    sectionTitle: {
      fontSize: 24,
      fontWeight: '600',
      color: theme.textPrimary,
      marginBottom: theme.spacing.xl,
      letterSpacing: theme.typography?.letterSpacing || 0.01,
    },
    hotelsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: theme.spacing.l,
    },
    emptySection: {
      alignItems: 'center',
      paddingVertical: theme.spacing.xxl + theme.spacing.s,
    },
    emptyText: {
      fontSize: 17,
      color: theme.textSecondary,
      textAlign: 'center',
      marginBottom: theme.spacing.s,
    },
    emptySubtext: {
      fontSize: 13,
      color: theme.textSecondary,
      textAlign: 'center',
      opacity: 0.7,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor={theme.bg} 
      />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>My Profile</Text>
          {user && (
            <Text style={styles.userEmail}>{user.email}</Text>
          )}
        </View>
        
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Profile Stats Section */}
      <View style={styles.profileStats}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{savedHotels.superliked.length}</Text>
          <Text style={styles.statLabel}>Super Liked</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{savedHotels.liked.length}</Text>
          <Text style={styles.statLabel}>Liked</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{totalSaved}</Text>
          <Text style={styles.statLabel}>Total Saved</Text>
        </View>
      </View>

      {totalSaved === 0 ? (
        // Empty state
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Your journey awaits ✦</Text>
          <Text style={styles.emptyDescription}>
            Start swiping to discover boutique hotels that speak to you.{'\n'}
            Like what you see? Save it for later. Love it? Give it a superlike.
          </Text>
          <Button
            title="Start Discovering"
            onPress={() => navigation.goBack()}
            variant="primary"
          />
        </View>
      ) : (
        // Hotels list
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Super Liked Row */}
          <View style={styles.categorySection}>
            <View style={styles.categoryHeader}>
              <Text style={styles.categoryTitle}>Super Liked ({savedHotels.superliked.length})</Text>
              {savedHotels.superliked.length > 3 && (
                <TouchableOpacity 
                  style={styles.seeAllButton}
                  onPress={() => handleSeeAll('superlike')}
                >
                  <Text style={styles.seeAllText}>View List</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.scrollContainer}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.hotelScrollView}
                contentContainerStyle={styles.hotelScrollContent}
              >
                {savedHotels.superliked.length === 0 ? (
                  <View style={styles.emptyRowMessage}>
                    <Text style={styles.emptyRowText}>Your favorites will appear here</Text>
                    <Text style={styles.emptyRowSubtext}>Swipe down on hotels that make your heart skip ♡</Text>
                  </View>
                ) : (
                  savedHotels.superliked.map(hotel => renderCompactHotelCard(hotel, 'superlike'))
                )}
              </ScrollView>
              {savedHotels.superliked.length > 2 && (
                <View style={styles.scrollIndicator}>
                  <Text style={styles.scrollIndicatorText}>→</Text>
                </View>
              )}
            </View>
          </View>

          {/* Liked Row */}
          <View style={styles.categorySection}>
            <View style={styles.categoryHeader}>
              <Text style={styles.categoryTitle}>Liked ({savedHotels.liked.length})</Text>
              {savedHotels.liked.length > 3 && (
                <TouchableOpacity 
                  style={styles.seeAllButton}
                  onPress={() => handleSeeAll('like')}
                >
                  <Text style={styles.seeAllText}>View List</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.scrollContainer}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.hotelScrollView}
                contentContainerStyle={styles.hotelScrollContent}
              >
                {savedHotels.liked.length === 0 ? (
                  <View style={styles.emptyRowMessage}>
                    <Text style={styles.emptyRowText}>Hotels you like live here</Text>
                    <Text style={styles.emptyRowSubtext}>Swipe right when something catches your eye</Text>
                  </View>
                ) : (
                  savedHotels.liked.map(hotel => renderCompactHotelCard(hotel, 'like'))
                )}
              </ScrollView>
              {savedHotels.liked.length > 2 && (
                <View style={styles.scrollIndicator}>
                  <Text style={styles.scrollIndicatorText}>→</Text>
                </View>
              )}
            </View>
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



export default SavedScreen; 
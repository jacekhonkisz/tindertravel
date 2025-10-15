import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HotelCard } from '../types';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';

// Conditionally import react-native-maps for native platforms only
let MapView: any;
let Marker: any;
let PROVIDER_GOOGLE: any;

try {
  // Only import on native platforms
  if (Platform.OS !== 'web') {
    const maps = require('react-native-maps');
    MapView = maps.default || maps.MapView;
    Marker = maps.Marker;
    PROVIDER_GOOGLE = maps.PROVIDER_GOOGLE;
  }
} catch (error) {
  // MapView will be undefined on web - we'll handle this in the component
}

interface HotelMapViewProps {
  coords: {
    lat: number;
    lng: number;
  };
  hotelName: string;
  city?: string;
  country?: string;
  hotel?: HotelCard; // Full hotel data for modal preview
}

// Custom Pin Marker Component
const CustomPinMarker = () => (
  <View style={styles.customPin}>
    <View style={styles.pinHead} />
    <View style={styles.pinTail} />
  </View>
);

type HotelMapViewNavigationProp = StackNavigationProp<RootStackParamList>;

const HotelMapView: React.FC<HotelMapViewProps> = ({ coords, hotelName, city, country, hotel }) => {
  const navigation = useNavigation<HotelMapViewNavigationProp>();
  
  // Debug coordinates
  useEffect(() => {
    console.log('🗺️ HotelMapView Debug Info:');
    console.log('Hotel Name:', hotelName);
    console.log('Coordinates:', coords);
    console.log('City:', city);
    console.log('Country:', country);
    
    // Validate coordinates
    if (!coords || typeof coords.lat !== 'number' || typeof coords.lng !== 'number') {
      console.error('❌ Invalid coordinates:', coords);
    } else if (coords.lat < -90 || coords.lat > 90 || coords.lng < -180 || coords.lng > 180) {
      console.error('❌ Coordinates out of range:', coords);
    } else {
      console.log('✅ Coordinates are valid');
    }
  }, [coords, hotelName, city, country]);
  
  const handleOpenInMaps = () => {
    // Use coordinates with hotel name for better precision
    const hotelQuery = encodeURIComponent(hotelName);
    const url = `https://www.google.com/maps/search/?api=1&query=${hotelQuery}&center=${coords.lat},${coords.lng}&zoom=15`;
    
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Alert.alert('Error', 'Unable to open maps application');
        }
      })
      .catch((err) => console.error('Error opening maps:', err));
  };

  const handleViewOnMap = () => {
    // Use coordinates for precise location, with hotel name as search term
    const hotelQuery = encodeURIComponent(hotelName);
    const appleMapsUrl = `http://maps.apple.com/?q=${hotelQuery}&ll=${coords.lat},${coords.lng}&z=15`;
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${hotelQuery}&center=${coords.lat},${coords.lng}&zoom=15`;
    
    // Try Apple Maps first (iOS), then Google Maps
    Linking.canOpenURL(appleMapsUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(appleMapsUrl);
        } else {
          Linking.openURL(googleMapsUrl);
        }
      })
      .catch(() => {
        Linking.openURL(googleMapsUrl);
      });
  };

  // Validate coordinates before rendering
  if (!coords || typeof coords.lat !== 'number' || typeof coords.lng !== 'number') {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Location</Text>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Location data unavailable</Text>
          <Text style={styles.errorSubtext}>Unable to display map for this hotel</Text>
        </View>
      </View>
    );
  }

  // Tighter zoom level for more precise pin positioning
  const latitudeDelta = 0.002;
  const longitudeDelta = 0.002;
  
  const mapRegion = {
    latitude: coords.lat,
    longitude: coords.lng,
    latitudeDelta,
    longitudeDelta,
  };
  
  // Show placeholder for web builds
  if (Platform.OS === 'web' || !MapView) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Location</Text>

        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapPlaceholderText}>📍 Interactive Map</Text>
          <Text style={styles.mapPlaceholderSubtext}>Available on mobile app</Text>
          <TouchableOpacity onPress={handleOpenInMaps}>
            <Text style={styles.directionsLink}>Get directions in Maps</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Location</Text>

      <View style={styles.mapContainer}>
        {/* Interactive MapView with dragging enabled */}
        {/* On iOS: Uses Apple Maps (default, no additional setup needed) */}
        {/* On Android: Uses Google Maps via PROVIDER_GOOGLE */}
        <MapView
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          style={styles.map}
          initialRegion={mapRegion}
          scrollEnabled={true} // Enable dragging
          zoomEnabled={true}
          pitchEnabled={false}
          rotateEnabled={false}
          showsUserLocation={false}
          showsMyLocationButton={false}
          showsCompass={false}
          showsScale={false}
          showsBuildings={true}
          showsTraffic={false}
          showsIndoors={true}
          mapType="standard"
          moveOnMarkerPress={false}
          loadingEnabled={true}
          loadingIndicatorColor="#007AFF"
          loadingBackgroundColor="#FFFFFF"
          onMapReady={() => {
            console.log('🗺️ Map is ready, coordinates:', coords);
          }}
          onRegionChange={(region) => {
            console.log('🗺️ Map region changed:', region);
          }}
        >
          <Marker
            coordinate={{
              latitude: coords.lat,
              longitude: coords.lng,
            }}
            title={hotelName}
            description={`${city ? `${city}, ` : ''}${country || ''}`}
          >
            <CustomPinMarker />
          </Marker>
        </MapView>
      </View>
      
      <TouchableOpacity onPress={handleOpenInMaps}>
        <Text style={styles.directionsLink}>Get directions in Maps</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000', // Changed from white to black
    marginBottom: 8,
    textAlign: 'center',
  },
  mapContainer: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
    position: 'relative',
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  // Custom Pin Marker Styles
  customPin: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinHead: {
    width: 24,
    height: 24,
    backgroundColor: '#FF3B30', // Red color similar to the image
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  pinTail: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 0,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#FF3B30',
    marginTop: -1,
  },
  directionsLink: {
    color: '#8C7B6A',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  errorContainer: {
    padding: 20,
    backgroundColor: '#FF4444',
    borderRadius: 10,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  mapPlaceholder: {
    height: 200,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  mapPlaceholderText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  mapPlaceholderSubtext: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
});

export default HotelMapView; 
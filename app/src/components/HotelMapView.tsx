import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert, Platform } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

interface HotelMapViewProps {
  coords: {
    lat: number;
    lng: number;
  };
  hotelName: string;
  city?: string;
  country?: string;
}

// Custom Pin Marker Component
const CustomPinMarker = () => (
  <View style={styles.customPin}>
    <View style={styles.pinHead} />
    <View style={styles.pinTail} />
  </View>
);

const HotelMapView: React.FC<HotelMapViewProps> = ({ coords, hotelName, city, country }) => {
  const [isDetailedView, setIsDetailedView] = useState(false);
  
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

  // Single zoom level - closer view for better detail
  const latitudeDelta = 0.005;
  const longitudeDelta = 0.005;
  
  const mapRegion = {
    latitude: coords.lat,
    longitude: coords.lng,
    latitudeDelta,
    longitudeDelta,
  };
  
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
      
      <TouchableOpacity style={styles.directionsButton} onPress={handleOpenInMaps}>
        <Text style={styles.directionsText}>Get Directions</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  mapContainer: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
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
  directionsButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  directionsText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
});

export default HotelMapView; 
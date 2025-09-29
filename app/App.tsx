import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, StatusBar, Platform, View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// IMMEDIATE LOG TO VERIFY CODE IS LOADING
console.log('🚨🚨🚨 APP.TSX FILE IS LOADING - NEW CODE VERSION 4.0 🚨🚨🚨');

// Screens
import HomeScreen from './src/screens/HomeScreen';
import DetailsScreen from './src/screens/DetailsScreen';
import SavedScreen from './src/screens/SavedScreen';
import HotelCollectionScreen from './src/screens/HotelCollectionScreen';
import SimpleDevAuthScreen from './src/screens/SimpleDevAuthScreen';

// Types
import { RootStackParamList } from './src/types';

// Store
import { useAppStore } from './src/store';

const Stack = createStackNavigator<RootStackParamList>();

const AuthStack = () => <SimpleDevAuthScreen />;

const MainStack = () => (
  <Stack.Navigator
    initialRouteName="Home"
    screenOptions={{
      headerShown: false,
      gestureEnabled: true,
      gestureDirection: 'horizontal',
      presentation: 'card',
      animationTypeForReplace: 'push',
      cardStyleInterpolator: ({ current, next, layouts }) => {
        return {
          cardStyle: {
            transform: [
              {
                translateX: current.progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [layouts.screen.width, 0],
                  extrapolate: 'clamp',
                }),
              },
            ],
            opacity: current.progress.interpolate({
              inputRange: [0, 0.5, 0.9, 1],
              outputRange: [0, 0.25, 0.7, 1],
            }),
          },
          overlayStyle: {
            opacity: current.progress.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.5],
              extrapolate: 'clamp',
            }),
          },
        };
      },
    }}
  >
    <Stack.Screen 
      name="Home" 
      component={HomeScreen}
      options={{
        title: 'Glintz',
      }}
    />
    <Stack.Screen 
      name="Details" 
      component={DetailsScreen}
      options={{
        title: 'Hotel Details',
        presentation: 'modal',
        gestureDirection: 'vertical',
        cardStyleInterpolator: ({ current, layouts }) => {
          return {
            cardStyle: {
              transform: [
                {
                  translateY: current.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [layouts.screen.height, 0],
                    extrapolate: 'clamp',
                  }),
                },
                {
                  scale: current.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.9, 1],
                    extrapolate: 'clamp',
                  }),
                },
              ],
              borderRadius: current.progress.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
                extrapolate: 'clamp',
              }),
            },
          };
        },
      }}
    />
    <Stack.Screen 
      name="Saved" 
      component={SavedScreen}
      options={{
        title: 'Saved Hotels',
      }}
    />
    <Stack.Screen 
      name="HotelCollection" 
      component={HotelCollectionScreen}
      options={{
        title: 'Hotel Collection',
      }}
    />
  </Stack.Navigator>
);

const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#667eea" />
  </View>
);

export default function App() {
  const { isAuthenticated, isLoading, checkAuthStatus, loadPersistedData } = useAppStore();
  
  console.log('🏠 App render - isAuthenticated:', isAuthenticated, 'isLoading:', isLoading);
  console.log('🏠 APP LOADED WITH NEW CODE - VERSION 3.0 (SIMPLIFIED)');
  
  // Log which stack we're showing
  console.log('🏠 Showing stack:', isAuthenticated ? 'MainStack' : 'AuthStack');

  useEffect(() => {
    const initializeApp = async () => {
      // Load persisted data (preferences, saved hotels, etc.)
      await loadPersistedData();
      
      // Check if user is already authenticated
      await checkAuthStatus();
    };

    initializeApp();
  }, [checkAuthStatus, loadPersistedData]);

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <SafeAreaProvider>
        <GestureHandlerRootView style={styles.container}>
          <StatusBar 
            barStyle="light-content" 
            backgroundColor="transparent"
            translucent={true}
            hidden={true} // Hide status bar for consistency
          />
          <LoadingScreen />
        </GestureHandlerRootView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={styles.container}>
        <StatusBar 
          barStyle="light-content" 
          backgroundColor="transparent"
          translucent={true}
          hidden={true} // Hide status bar for true full-screen photos
        />
        <NavigationContainer>
          {isAuthenticated ? <MainStack /> : <AuthStack />}
        </NavigationContainer>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
});

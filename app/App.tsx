import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, StatusBar, Platform, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import GlintzLogo from './src/components/GlintzLogo';

// App loaded

// Screens
import HomeScreen from './src/screens/HomeScreen';
import DetailsScreen from './src/screens/DetailsScreen';
import SavedScreen from './src/screens/SavedScreen';
import HotelCollectionScreen from './src/screens/HotelCollectionScreen';
import AuthScreen from './src/screens/AuthScreen';

// Types
import { RootStackParamList } from './src/types';

// Store
import { useAppStore } from './src/store';

const Stack = createStackNavigator<RootStackParamList>();

const AuthStack = () => <AuthScreen />;

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
    <GlintzLogo width={200} height={115} />
  </View>
);

export default function App() {
  const { isAuthenticated, isLoading, loading: hotelsLoading, checkAuthStatus, loadPersistedData, loadHotels } = useAppStore();

  // Initialize app ONCE on mount - no dependencies to prevent infinite loops
  useEffect(() => {
    const initializeApp = async () => {
      // Load persisted data (preferences, saved hotels, etc.)
      await loadPersistedData();
      
      // Check if user is already authenticated
      await checkAuthStatus();
      
      // Preload hotels if authenticated to prevent second loading screen
      const state = useAppStore.getState();
      if (state.isAuthenticated && state.hotels.length === 0) {
        await loadHotels();
      }
    };

    initializeApp();
  }, []); // Empty deps - run only once on mount

  // Show loading screen while checking authentication OR loading initial hotels
  if (isLoading || (isAuthenticated && hotelsLoading && useAppStore.getState().hotels.length === 0)) {
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
    backgroundColor: '#E5DED5', // Sand color from brandbook (api/design.tsx)
  },
});

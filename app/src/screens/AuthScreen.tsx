import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppStore } from '../store';
import { apiClient } from '../api/client';
import AuthBackground from '../components/AuthBackground';
import GlassCard from '../components/GlassCard';
import MonogramGlow from '../components/MonogramGlow';
import { preloadBackground, BgRotationResult } from '../utils/backgroundRotation';
import {
  COLOR_TEXT,
  COLOR_TEXT_MID,
  COLOR_INPUT,
  COLOR_ACCENT,
  RADIUS_M,
  DUR_FAST,
  DUR_MED,
  EASING_SMOOTH,
  FONT_SIZES,
  FONT_WEIGHTS,
  SPACING,
  SHADOW_BUTTON,
} from '../ui/tokens';

type Step = 'email' | 'otp';

const AuthScreen: React.FC = () => {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [bgData, setBgData] = useState<BgRotationResult | null>(null);
  const [loading, setLoading] = useState(true);

  // Animations
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;
  const otpSuccessAnim = useRef(new Animated.Value(1)).current;

  // Load background on mount
  useEffect(() => {
    const loadBackground = async () => {
      try {
        console.log('🎨 AuthScreen: Loading background...');
        const bg = await preloadBackground();
        console.log('🎨 AuthScreen: Background loaded successfully');
        setBgData(bg);
        setLoading(false);
      } catch (error) {
        console.error('🎨 AuthScreen: Failed to load background:', error);
        // Show error to user and allow them to continue without background
        Alert.alert(
          'Background Loading Error',
          'Could not load background photo. This might be due to network connectivity. You can continue without it or retry.',
          [
            {
              text: 'Continue Anyway',
              style: 'default',
              onPress: () => {
                // Provide a fallback solid color background
                setBgData({
                  imageSource: require('../../assets/icon.png'), // Fallback to app icon
                  index: 0,
                  caption: 'Photo: Glintz',
                  hotelName: 'Glintz',
                });
                setLoading(false);
              }
            },
            {
              text: 'Retry',
              style: 'cancel',
              onPress: () => {
                setLoading(true);
                setTimeout(() => loadBackground(), 500); // Retry after small delay
              }
            }
          ]
        );
      }
    };
    loadBackground();
  }, []);

  // Animate step transitions
  const animateTransition = (callback: () => void) => {
    // Fade out + slide up slightly
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: DUR_MED,
        easing: EASING_SMOOTH,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: -8,
        duration: DUR_MED,
        easing: EASING_SMOOTH,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Change step
      callback();
      
      // Fade in + slide back
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: DUR_MED,
          easing: EASING_SMOOTH,
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: 0,
          duration: DUR_MED,
          easing: EASING_SMOOTH,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  // Handle continue from email
  const handleContinue = async () => {
    if (!email || email.trim() === '') {
      Alert.alert('Error', 'Please enter your email');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Request OTP from backend
      const response = await apiClient.requestOTP({ email });

      if (response.success) {
        animateTransition(() => setStep('otp'));
      } else {
        Alert.alert('Error', response.error || 'Failed to send OTP code');
      }
    } catch (error) {
      console.error('Failed to request OTP:', error);
      Alert.alert('Error', 'Failed to send OTP code. Please try again.');
    }
  };

  // Handle OTP entry
  const handleOTPChange = (text: string) => {
    setOtp(text);
    
    // Auto-submit when 6 digits entered
    if (text.length === 6) {
      // Success animation
      Animated.sequence([
        Animated.timing(otpSuccessAnim, {
          toValue: 1.02,
          duration: DUR_FAST,
          useNativeDriver: true,
        }),
        Animated.timing(otpSuccessAnim, {
          toValue: 1,
          duration: DUR_FAST,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Trigger login after animation
      setTimeout(() => handleLogin(), 200);
    }
  };

  // Handle login
  const handleLogin = async () => {
    if (!otp || otp.length !== 6) {
      Alert.alert('Error', 'Please enter the 6-digit code');
      return;
    }

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Verify OTP with backend
      const response = await apiClient.verifyOTP({ email, code: otp });

      if (response.success && response.user && response.token) {
        // Store auth data
        await AsyncStorage.setItem('@glintz_auth_token', response.token);
        await AsyncStorage.setItem('@glintz_user_data', JSON.stringify(response.user));

        // Set auth token in API client
        apiClient.setAuthToken(response.token);

        // Update store
        useAppStore.setState({
          user: response.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });

        console.log('✅ Authentication successful!');
      } else {
        Alert.alert('Error', response.error || 'Invalid verification code');
      }
    } catch (error) {
      console.error('Failed to verify OTP:', error);
      Alert.alert('Error', 'Failed to verify code. Please try again.');
    }
  };

  // Handle back to email
  const handleBackToEmail = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setOtp('');
    animateTransition(() => setStep('email'));
  };

  // Button press animation
  const handleButtonPressIn = () => {
    Animated.timing(buttonScaleAnim, {
      toValue: 0.98,
      duration: 80,
      useNativeDriver: true,
    }).start();
  };

  const handleButtonPressOut = () => {
    Animated.timing(buttonScaleAnim, {
      toValue: 1,
      duration: 80,
      useNativeDriver: true,
    }).start();
  };

  if (loading || !bgData) {
    return (
      <View style={styles.loadingContainer}>
        <MonogramGlow 
          letter="G" 
          size={120} 
          tone="light"
        />
      </View>
    );
  }

  return (
    <AuthBackground imageSource={bgData.imageSource}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          {/* Title & Subtitle */}
          <View style={styles.header}>
            <Text style={styles.title}>Welcome to Glintz</Text>
            <Text style={styles.subtitle}>
              {step === 'email' ? 'Discover your next stay' : 'Enter the code we just sent you'}
            </Text>
          </View>

          {/* Glass Card with Form */}
          <View style={styles.cardContainer}>
            <GlassCard>
              <Animated.View
                style={{
                  opacity: fadeAnim,
                  transform: [
                    { translateY: translateYAnim },
                    { scale: step === 'otp' ? otpSuccessAnim : 1 },
                  ],
                }}
              >
                {step === 'email' ? (
                  // Email Step
                  <View>
                    <Text style={styles.label}>Email Address</Text>
                    <TextInput
                      style={styles.input}
                      value={email}
                      onChangeText={setEmail}
                      placeholder="your@email.com"
                      placeholderTextColor="rgba(0,0,0,0.35)"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      autoFocus
                    />

                    <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
                      <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={handleContinue}
                        onPressIn={handleButtonPressIn}
                        onPressOut={handleButtonPressOut}
                        activeOpacity={0.9}
                      >
                        <Text style={styles.buttonText}>Continue</Text>
                      </TouchableOpacity>
                    </Animated.View>
                  </View>
                ) : (
                  // OTP Step
                  <View>
                    <Text style={styles.label}>Verification Code</Text>
                    <TextInput
                      style={styles.input}
                      value={otp}
                      onChangeText={handleOTPChange}
                      placeholder="Enter 6-digit code"
                      placeholderTextColor="rgba(0,0,0,0.35)"
                      keyboardType="numeric"
                      maxLength={6}
                      autoFocus
                    />

                    <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
                      <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={handleLogin}
                        onPressIn={handleButtonPressIn}
                        onPressOut={handleButtonPressOut}
                        activeOpacity={0.9}
                      >
                        <Text style={styles.buttonText}>Login</Text>
                      </TouchableOpacity>
                    </Animated.View>

                    {/* Back to Email Link */}
                    <TouchableOpacity
                      style={styles.backLink}
                      onPress={handleBackToEmail}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.backLinkText}>← Back to Email</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </Animated.View>
            </GlassCard>
          </View>

          {/* Legal Links */}
          <View style={styles.legalContainer}>
            <Text style={styles.legalText}>
              By continuing, you agree to our{' '}
              <Text
                style={styles.legalLink}
                onPress={() => Linking.openURL('https://jacekhonkisz.github.io/glintz-legal/terms.html')}
              >
                Terms
              </Text>
              {' & '}
              <Text
                style={styles.legalLink}
                onPress={() => Linking.openURL('https://jacekhonkisz.github.io/glintz-legal/privacy.html')}
              >
                Privacy Policy
              </Text>
            </Text>
          </View>

          {/* Photo Credit */}
          <View style={styles.footer}>
            <Text style={styles.photoCredit}>{bgData.caption || `Photo: ${bgData.hotelName}`}</Text>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </AuthBackground>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAF8F5',
  },
  loadingText: {
    fontSize: 16,
    color: COLOR_TEXT_MID,
  },
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.xxl,
  },
  header: {
    marginBottom: SPACING.xxxl,
    alignItems: 'center',
  },
  title: {
    fontSize: FONT_SIZES.title,
    fontWeight: FONT_WEIGHTS.semibold,
    color: '#FFFFFF', // White text for contrast against dark background
    marginBottom: SPACING.s,
    letterSpacing: -0.3,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)', // Subtle shadow for better readability
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: FONT_SIZES.subtitle,
    fontWeight: FONT_WEIGHTS.regular,
    color: 'rgba(255,255,255,0.85)', // Semi-transparent white for contrast
    textAlign: 'center',
    letterSpacing: 0,
    textShadowColor: 'rgba(0,0,0,0.3)', // Subtle shadow for better readability
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  cardContainer: {
    width: '100%',
  },
  label: {
    fontSize: FONT_SIZES.label,
    fontWeight: FONT_WEIGHTS.medium,
    color: '#2E2E2E',
    marginBottom: SPACING.s,
    letterSpacing: 0,
  },
  input: {
    backgroundColor: COLOR_INPUT,
    borderRadius: RADIUS_M,
    padding: 14,
    fontSize: FONT_SIZES.input,
    color: COLOR_TEXT,
    marginBottom: SPACING.l,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  primaryButton: {
    backgroundColor: COLOR_ACCENT,
    borderRadius: RADIUS_M,
    paddingVertical: 14,
    alignItems: 'center',
    ...SHADOW_BUTTON,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.button,
    fontWeight: FONT_WEIGHTS.semibold,
    letterSpacing: 0.2,
  },
  backLink: {
    marginTop: SPACING.l,
    alignItems: 'center',
    paddingVertical: SPACING.m,
  },
  backLinkText: {
    fontSize: FONT_SIZES.link,
    color: COLOR_TEXT_MID,
    fontWeight: FONT_WEIGHTS.regular,
    letterSpacing: 0,
  },
  legalContainer: {
    marginTop: SPACING.xxl,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
  },
  legalText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    lineHeight: 18,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  legalLink: {
    color: '#FDBA74',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  footer: {
    position: 'absolute',
    bottom: SPACING.xl,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  photoCredit: {
    fontSize: FONT_SIZES.caption,
    color: 'rgba(255,255,255,0.7)', // White text for contrast against dark background
    letterSpacing: 0.4,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)', // Subtle shadow for better readability
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export default AuthScreen;


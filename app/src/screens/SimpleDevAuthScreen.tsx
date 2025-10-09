import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Alert,
  StatusBar,
} from 'react-native';
import { useAppStore } from '../store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../api/client';
import { useTheme } from '../theme';
import { Button, Card, DebugBadge } from '../ui';

const SimpleDevAuthScreen: React.FC = () => {
  const theme = useTheme();
  const [showOTP, setShowOTP] = useState(false);
  const [email, setEmail] = useState('test@glintz.io');
  const [otp, setOtp] = useState('');

  const handleSendOTP = () => {
    console.log('📧 Moving to OTP screen');
    setShowOTP(true);
  };

  const handleVerifyOTP = async () => {
    if (otp !== '123456') {
      Alert.alert('Error', 'Invalid OTP. Use 123456 in dev mode.');
      return;
    }

    console.log('🔑 Dev mode: Authenticating user');
    
    // Create simple dev user and token
    const user = {
      id: 'test-user-id',
      email: 'test@glintz.io',
      name: 'Test User',
    };
    
    const token = 'dev-token-' + Date.now();
    
    // Store auth data directly
    try {
      await AsyncStorage.setItem('@glintz_auth_token', token);
      await AsyncStorage.setItem('@glintz_user_data', JSON.stringify(user));
      
      // Set auth token in API client
      apiClient.setAuthToken(token);
      console.log('🔑 Auth token set in API client:', token);
      
      // Update store directly
      const { user: storeUser, isAuthenticated, isLoading, ...store } = useAppStore.getState();
      useAppStore.setState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      
      console.log('✅ Authentication successful!');
    } catch (error) {
      console.error('Failed to store auth data:', error);
      Alert.alert('Error', 'Failed to authenticate');
    }
  };

  const handleGoBack = () => {
    setShowOTP(false);
    setOtp('');
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.bg,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.xl,
    },
    header: {
      alignItems: 'center',
      marginBottom: theme.spacing.xxxl || theme.spacing.xxl + theme.spacing.l,
    },
    title: {
      fontSize: theme.typography?.displaySize || 34,
      fontWeight: '600',
      color: theme.textPrimary,
      marginBottom: theme.spacing.m,
      textAlign: 'center',
      letterSpacing: theme.typography?.letterSpacing || 0.01,
      lineHeight: theme.typography?.displayLineHeight || 41,
    },
    subtitle: {
      fontSize: theme.typography?.bodySize || 17,
      color: theme.textSecondary,
      textAlign: 'center',
      lineHeight: theme.typography?.bodyLineHeight || 24,
      letterSpacing: theme.typography?.letterSpacing || 0.01,
    },
    formContainer: {
      width: '100%',
      maxWidth: 400,
    },
    form: {
      padding: theme.spacing.xl + theme.spacing.s,
    },
    inputContainer: {
      marginBottom: theme.spacing.xl + theme.spacing.s,
    },
    inputLabel: {
      fontSize: theme.typography?.captionSize || 13,
      fontWeight: '600',
      color: theme.textPrimary,
      marginBottom: theme.spacing.s,
      letterSpacing: theme.typography?.letterSpacing || 0.01,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.chipBorder,
      borderRadius: theme.radius.input,
      paddingHorizontal: theme.spacing.l + theme.spacing.s,
      paddingVertical: 16,
      fontSize: theme.typography?.bodySize || 17,
      backgroundColor: theme.surfaceElev,
      color: theme.textPrimary,
      letterSpacing: theme.typography?.letterSpacing || 0.01,
    },
    backButtonContainer: {
      marginTop: theme.spacing.xl + theme.spacing.s,
      alignItems: 'center',
    },
    backButtonText: {
      color: theme.accent,
      fontSize: theme.typography?.captionSize || 13,
      fontWeight: '500',
      letterSpacing: theme.typography?.letterSpacing || 0.01,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar 
        barStyle="dark-content"
        backgroundColor={theme.bg} 
      />
      
      <DebugBadge />
      
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Welcome to Glintz</Text>
          <Text style={styles.subtitle}>
            {!showOTP 
              ? 'Dev Mode: Click to continue' 
              : 'Enter OTP: 123456'
            }
          </Text>
        </View>

        {/* Form */}
        <Card withBlur blurIntensity={30} style={styles.formContainer}>
          <View style={styles.form}>
            {!showOTP ? (
              <>
                {/* Email Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Email Address</Text>
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="test@glintz.io"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={false} // Make it read-only in dev mode
                  />
                </View>

                {/* Send OTP Button */}
                <Button
                  title="Continue to OTP"
                  onPress={handleSendOTP}
                  fullWidth
                />
              </>
            ) : (
              <>
                {/* OTP Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Verification Code</Text>
                  <TextInput
                    style={styles.input}
                    value={otp}
                    onChangeText={setOtp}
                    placeholder="123456"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="numeric"
                    maxLength={6}
                    autoFocus
                  />
                </View>

                {/* Verify Button */}
                <Button
                  title="Login"
                  onPress={handleVerifyOTP}
                  fullWidth
                />

                {/* Back Button */}
                <View style={styles.backButtonContainer}>
                  <Button
                    title="← Back to Email"
                    variant="secondary"
                    onPress={handleGoBack}
                  />
                </View>
              </>
            )}
          </View>
        </Card>
      </View>
    </SafeAreaView>
  );
};



export default SimpleDevAuthScreen; 
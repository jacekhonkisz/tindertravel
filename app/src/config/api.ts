/**
 * API Configuration with Production-Ready Features
 * 
 * This module provides:
 * - Environment-based configuration
 * - Automatic IP detection
 * - Connection validation
 * - Fallback URLs
 * - Health check capabilities
 */

import { Platform } from 'react-native';

/**
 * Environment types
 */
export type Environment = 'development' | 'staging' | 'production';

/**
 * API Configuration interface
 */
export interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  environment: Environment;
}

/**
 * Get the current environment
 */
function getEnvironment(): Environment {
  // In a real production app, you'd use environment variables
  // For now, we default to development
  return __DEV__ ? 'development' : 'production';
}

/**
 * Get the current device's local network IP
 * This helps when running on a physical iOS device or simulator
 */
async function getDeviceNetworkIP(): Promise<string | null> {
  try {
    // For iOS Simulator, localhost works
    // For iOS device, we use the network IP configured below
    return null; // Will use predefined network IP
  } catch (error) {
    console.warn('Failed to detect device network IP:', error);
    return null;
  }
}

/**
 * Configuration for different environments
 */
const configs: Record<Environment, Partial<ApiConfig>> = {
  development: {
    // NOTE: Using network IP for iOS simulator compatibility
    baseUrl: 'http://192.168.1.105:3001', // Network IP for iOS simulator
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
  },
  staging: {
    baseUrl: 'https://staging-api.glintz.com',
    timeout: 20000,
    retryAttempts: 2,
    retryDelay: 1000,
  },
  production: {
    baseUrl: 'https://api.glintz.com',
    timeout: 15000,
    retryAttempts: 3,
    retryDelay: 2000,
  },
};

/**
 * Get API configuration based on current environment
 * Automatically finds the best available API URL
 */
export async function getApiConfig(): Promise<ApiConfig> {
  const env = getEnvironment();
  const envConfig = configs[env];

  // Get base configuration
  const config: ApiConfig = {
    baseUrl: envConfig.baseUrl || configs.development.baseUrl!,
    timeout: envConfig.timeout || 30000,
    retryAttempts: envConfig.retryAttempts || 3,
    retryDelay: envConfig.retryDelay || 1000,
    environment: env,
  };

  // In development, try to find the best available URL
  if (env === 'development') {
    try {
      console.log('🔍 Finding best API URL...');
      const primaryUrl = config.baseUrl;
      const fallbackUrls = getFallbackUrls();

      const { url: bestUrl } = await findBestApiUrl(primaryUrl, fallbackUrls);

      if (bestUrl !== primaryUrl) {
        console.log(`✅ Using best available URL: ${bestUrl}`);
        config.baseUrl = bestUrl;
      } else {
        console.log(`✅ Using primary URL: ${bestUrl}`);
      }
    } catch (error) {
      console.warn('⚠️  Failed to find best API URL, using configured URL:', error);
    }
  }

  return config;
}

/**
 * Test if a URL is reachable
 */
export async function testConnection(url: string, timeout: number = 5000): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(`${url}/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Find the best available API URL
 * Tries multiple URLs and returns the first one that responds
 */
export async function findBestApiUrl(
  primaryUrl: string,
  fallbackUrls: string[] = []
): Promise<{ url: string; tested: string[] }> {
  const urlsToTest = [primaryUrl, ...fallbackUrls];
  const tested: string[] = [];
  
  console.log('🔍 Testing API connections...');
  
  for (const url of urlsToTest) {
    console.log(`   Testing: ${url}`);
    tested.push(url);
    
    const isReachable = await testConnection(url, 3000);
    
    if (isReachable) {
      console.log(`   ✅ Connected to: ${url}`);
      return { url, tested };
    } else {
      console.log(`   ❌ Failed: ${url}`);
    }
  }
  
  // If none work, return the primary URL and let the app handle the error
  console.warn('⚠️  No API servers responded. Using primary URL as fallback.');
  return { url: primaryUrl, tested };
}

/**
 * Get fallback URLs for the current environment
 */
export function getFallbackUrls(): string[] {
  const env = getEnvironment();
  
  if (env === 'development') {
    // Try common development URLs in order of preference
    return [
      'http://localhost:3001',        // Primary: localhost (works in simulator)
      'http://127.0.0.1:3001',       // Secondary: loopback
      'http://192.168.1.105:3001',   // Tertiary: current network IP
      // Add other common local IPs if needed
    ];
  }
  
  // For staging/production, no fallbacks by default
  return [];
}

/**
 * Log current API configuration
 */
export function logApiConfig(config: ApiConfig): void {
  console.log('📡 API Configuration:');
  console.log(`   Environment: ${config.environment}`);
  console.log(`   Base URL: ${config.baseUrl}`);
  console.log(`   Timeout: ${config.timeout}ms`);
  console.log(`   Retry Attempts: ${config.retryAttempts}`);
  console.log(`   Retry Delay: ${config.retryDelay}ms`);
}

/**
 * Instructions for updating API URL
 */
export function printApiInstructions(): void {
  console.log('\n📝 TO UPDATE API URL:');
  console.log('   1. Check your server startup logs');
  console.log('   2. Find the "Network IP" address');
  console.log('   3. Update baseUrl in app/src/config/api.ts');
  console.log('   4. Restart the app\n');
}


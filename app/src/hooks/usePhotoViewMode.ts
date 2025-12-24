/**
 * Photo View Mode Preference Hook
 * Manages global view mode preference with persistence
 */

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ViewMode, DEFAULT_VIEW_MODE } from '../types/photoView';

const STORAGE_KEY = 'glintz.feedViewMode';

/**
 * Hook to manage global photo view mode preference
 * Persists across sessions using AsyncStorage
 */
export function usePhotoViewMode() {
  const [viewMode, setViewMode] = useState<ViewMode>(DEFAULT_VIEW_MODE);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved preference on mount
  useEffect(() => {
    loadViewMode();
  }, []);

  const loadViewMode = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved && isValidViewMode(saved)) {
        setViewMode(saved as ViewMode);
      }
    } catch (error) {
      console.warn('Failed to load view mode preference:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveViewMode = useCallback(async (mode: ViewMode) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, mode);
      setViewMode(mode);
    } catch (error) {
      console.error('Failed to save view mode preference:', error);
      // Still update state even if storage fails
      setViewMode(mode);
    }
  }, []);

  return {
    viewMode,
    setViewMode: saveViewMode,
    isLoading,
  };
}

/**
 * Validate that a string is a valid ViewMode
 */
function isValidViewMode(value: string): boolean {
  return (
    value === 'FULL_VERTICAL_SCREEN' ||
    value === 'ORIGINAL_FULL' ||
    value === 'BALANCED'
  );
}


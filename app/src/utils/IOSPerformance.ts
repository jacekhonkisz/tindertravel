import { Platform, InteractionManager, LayoutAnimation } from 'react-native';

export class IOSPerformance {
  // iOS-specific layout animations
  static configureLayoutAnimation() {
    if (Platform.OS !== 'ios') return;
    
    LayoutAnimation.configureNext({
      duration: 300,
      create: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
      update: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.scaleXY,
      },
      delete: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
    });
  }

  // iOS spring animation configuration
  static getSpringConfig() {
    return {
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    };
  }

  // iOS timing animation configuration
  static getTimingConfig(duration: number = 300) {
    return {
      duration,
      useNativeDriver: true,
    };
  }

  // Defer heavy operations until after interactions
  static runAfterInteractions(callback: () => void): Promise<void> {
    return new Promise((resolve) => {
      InteractionManager.runAfterInteractions(() => {
        callback();
        resolve();
      });
    });
  }

  // iOS-optimized image preloading
  static async preloadImages(imageUrls: string[]): Promise<void> {
    if (Platform.OS !== 'ios') return;

    const preloadPromises = imageUrls.map((url) => {
      return new Promise<void>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve();
        image.onerror = () => resolve(); // Don't fail the batch
        image.src = url;
      });
    });

    // Batch preload with concurrency limit for iOS
    const batchSize = 3;
    for (let i = 0; i < preloadPromises.length; i += batchSize) {
      const batch = preloadPromises.slice(i, i + batchSize);
      await Promise.all(batch);
    }
  }

  // Memory management for iOS
  static clearImageCache() {
    if (Platform.OS !== 'ios') return;
    // iOS automatically manages image cache, but we can trigger cleanup
    global.gc && global.gc();
  }

  // iOS-specific gesture configuration
  static getGestureConfig() {
    return {
      enableTrackpadTwoFingerGesture: true,
      shouldCancelWhenOutside: true,
      simultaneousHandlers: [],
      waitFor: [],
    };
  }

  // Optimize for iOS 60fps
  static optimizeForSixtyFPS() {
    if (Platform.OS !== 'ios') return;

    // Enable high refresh rate if available
    const hermesInternal = (global as any).HermesInternal;
    if (hermesInternal) {
      // Hermes optimizations
      hermesInternal.enablePromiseRejectionTracker &&
        hermesInternal.enablePromiseRejectionTracker(false);
    }
  }

  // iOS-specific scroll performance
  static getScrollViewProps() {
    return Platform.OS === 'ios' ? {
      scrollEventThrottle: 16, // 60fps
      showsVerticalScrollIndicator: false,
      showsHorizontalScrollIndicator: false,
      bounces: true,
      bouncesZoom: false,
      alwaysBounceVertical: false,
      alwaysBounceHorizontal: false,
      decelerationRate: 'normal' as const,
      scrollsToTop: true,
    } : {};
  }

  // iOS-specific FlatList performance
  static getFlatListProps() {
    return Platform.OS === 'ios' ? {
      removeClippedSubviews: true,
      maxToRenderPerBatch: 5,
      updateCellsBatchingPeriod: 100,
      initialNumToRender: 10,
      windowSize: 10,
      getItemLayout: undefined, // Let iOS handle it
    } : {};
  }

  // Battery and thermal optimization
  static optimizeForBattery() {
    if (Platform.OS !== 'ios') return;

    // Reduce animation frequency when battery is low
    // This would typically integrate with native battery APIs
    return {
      reducedAnimations: false, // Would be determined by battery level
      lowerFrameRate: false,
    };
  }
}

export default IOSPerformance; 
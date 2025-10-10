# 📱 AD IMPLEMENTATION GUIDE - Glintz App

**Your Goal:** Show ads every 5-7 swipes  
**Platform:** React Native/Expo  
**Ad Network:** Google AdMob (recommended)

---

## 🎯 **AD STRATEGY:**

### **Ad Placement:**
```
Every 5-7 swipes → Show interstitial ad
After ad → Continue swiping
```

### **Ad Types:**
- ✅ **Interstitial Ads** (full-screen, between swipes)
- ✅ **Banner Ads** (small, at bottom)
- ✅ **Rewarded Ads** (optional, for premium features)

---

## 🚀 **IMPLEMENTATION PLAN:**

### **Phase 1: Setup AdMob (30 minutes)**
```
✅ Create Google AdMob account
✅ Get Ad Unit IDs
✅ Configure Expo project
✅ Install dependencies
```

### **Phase 2: Add Ad Logic (1 hour)**
```
✅ Track swipe count
✅ Show ads every 5-7 swipes
✅ Handle ad events
✅ Test in development
```

### **Phase 3: Development Testing (30 minutes)**
```
✅ Use test ad units
✅ Test ad frequency
✅ Test ad placement
✅ Verify user experience
```

---

## 📱 **STEP-BY-STEP IMPLEMENTATION:**

### **Step 1: Install Dependencies**

```bash
cd /Users/ala/tindertravel/app

# Install Expo AdMob
npx expo install expo-ads-admob

# Install additional dependencies
npm install @react-native-async-storage/async-storage
```

### **Step 2: Configure app.json**

```json
{
  "expo": {
    "name": "Glintz",
    "slug": "glintz",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#FAF8F5"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.glintz.app",
      "config": {
        "googleMobileAdsAppId": "ca-app-pub-3940256099942544~1458002511"
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#FAF8F5"
      },
      "package": "com.glintz.app",
      "config": {
        "googleMobileAdsAppId": "ca-app-pub-3940256099942544~3347511713"
      }
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      "expo-ads-admob"
    ]
  }
}
```

### **Step 3: Create Ad Manager Component**

**File:** `app/src/components/AdManager.tsx`

```typescript
import React, { useEffect, useState } from 'react';
import { AdMobInterstitial, AdMobBanner } from 'expo-ads-admob';
import { Platform } from 'react-native';

interface AdManagerProps {
  onAdClosed?: () => void;
  onAdOpened?: () => void;
  onAdError?: (error: any) => void;
}

export class AdManager {
  private static instance: AdManager;
  private swipeCount: number = 0;
  private adFrequency: number = 6; // Show ad every 6 swipes
  private isAdLoaded: boolean = false;
  private isShowingAd: boolean = false;

  // Test Ad Unit IDs (for development)
  private readonly TEST_INTERSTITIAL_ID = Platform.select({
    ios: 'ca-app-pub-3940256099942544/4411468910',
    android: 'ca-app-pub-3940256099942544/1033173712',
  });

  // Production Ad Unit IDs (replace with your real IDs)
  private readonly PRODUCTION_INTERSTITIAL_ID = Platform.select({
    ios: 'ca-app-pub-XXXXXXXXXX/XXXXXXXXXX', // Replace with your iOS ID
    android: 'ca-app-pub-XXXXXXXXXX/XXXXXXXXXX', // Replace with your Android ID
  });

  private constructor() {
    this.initializeAds();
  }

  static getInstance(): AdManager {
    if (!AdManager.instance) {
      AdManager.instance = new AdManager();
    }
    return AdManager.instance;
  }

  private async initializeAds() {
    try {
      // Set test device IDs for development
      await AdMobInterstitial.setTestDeviceIDAsync('EMULATOR');
      
      // Load the first ad
      await this.loadInterstitialAd();
    } catch (error) {
      console.error('Failed to initialize ads:', error);
    }
  }

  private async loadInterstitialAd() {
    try {
      const adUnitId = __DEV__ ? this.TEST_INTERSTITIAL_ID : this.PRODUCTION_INTERSTITIAL_ID;
      
      await AdMobInterstitial.setAdUnitIDAsync(adUnitId!);
      await AdMobInterstitial.requestAdAsync();
      
      this.isAdLoaded = true;
      console.log('✅ Interstitial ad loaded');
    } catch (error) {
      console.error('❌ Failed to load interstitial ad:', error);
      this.isAdLoaded = false;
    }
  }

  public async onSwipe(): Promise<boolean> {
    this.swipeCount++;
    
    console.log(`Swipe count: ${this.swipeCount}`);
    
    // Check if it's time to show an ad
    if (this.swipeCount >= this.adFrequency && this.isAdLoaded && !this.isShowingAd) {
      return await this.showInterstitialAd();
    }
    
    return false; // No ad shown
  }

  private async showInterstitialAd(): Promise<boolean> {
    if (!this.isAdLoaded || this.isShowingAd) {
      return false;
    }

    try {
      this.isShowingAd = true;
      this.swipeCount = 0; // Reset counter
      
      console.log('📱 Showing interstitial ad');
      
      // Show the ad
      await AdMobInterstitial.showAdAsync();
      
      return true; // Ad was shown
    } catch (error) {
      console.error('❌ Failed to show interstitial ad:', error);
      this.isShowingAd = false;
      return false;
    }
  }

  public setAdFrequency(frequency: number) {
    this.adFrequency = frequency;
    console.log(`Ad frequency set to: ${frequency} swipes`);
  }

  public getSwipeCount(): number {
    return this.swipeCount;
  }

  public resetSwipeCount() {
    this.swipeCount = 0;
    console.log('Swipe count reset');
  }
}

// Ad event handlers
export const setupAdEventHandlers = () => {
  AdMobInterstitial.addEventListener('adLoaded', () => {
    console.log('✅ Interstitial ad loaded');
  });

  AdMobInterstitial.addEventListener('adFailedToLoad', (error) => {
    console.error('❌ Interstitial ad failed to load:', error);
  });

  AdMobInterstitial.addEventListener('adOpened', () => {
    console.log('📱 Interstitial ad opened');
  });

  AdMobInterstitial.addEventListener('adClosed', () => {
    console.log('📱 Interstitial ad closed');
    
    // Reload ad for next time
    const adManager = AdManager.getInstance();
    adManager['isShowingAd'] = false;
    adManager['loadInterstitialAd']();
  });

  AdMobInterstitial.addEventListener('adLeftApplication', () => {
    console.log('📱 User left app via ad');
  });
};
```

### **Step 4: Update SwipeDeck Component**

**File:** `app/src/components/SwipeDeck.tsx`

```typescript
// Add imports
import { AdManager, setupAdEventHandlers } from './AdManager';

// Add to SwipeDeck component
const SwipeDeck: React.FC<SwipeDeckProps> = ({
  hotels,
  currentIndex,
  onSwipe,
  loading = false,
  navigation,
}) => {
  // ... existing code ...

  // Initialize ad manager
  const adManager = AdManager.getInstance();

  // Setup ad event handlers (call once)
  useEffect(() => {
    setupAdEventHandlers();
  }, []);

  // ... existing panResponder code ...

  // Update the onPanResponderRelease handler
  onPanResponderRelease: (_, gesture: any) => {
    const { dx, dy, vx, vy } = gesture;
    
    // ... existing gesture handling code ...

    if (action) {
      // Animate card out
      animationController.animateCardOut(animateDirection, () => {
        // Trigger swipe callback
        const currentHotel = hotels[currentIndex];
        if (currentHotel) {
          onSwipe(currentHotel.id, action!);
          
          // Check if we should show an ad
          adManager.onSwipe().then((adShown) => {
            if (adShown) {
              console.log('📱 Ad shown after swipe');
            }
          });
        }
      });

      // ... existing haptic feedback code ...
    }
  },
```

### **Step 5: Add Ad Settings (Optional)**

**File:** `app/src/components/AdSettings.tsx`

```typescript
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AdManager } from './AdManager';

export const AdSettings: React.FC = () => {
  const [adFrequency, setAdFrequency] = useState(6);
  const adManager = AdManager.getInstance();

  const updateAdFrequency = (frequency: number) => {
    setAdFrequency(frequency);
    adManager.setAdFrequency(frequency);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ad Settings</Text>
      
      <Text style={styles.label}>Show ad every:</Text>
      <View style={styles.frequencyContainer}>
        {[3, 5, 6, 7, 10].map((freq) => (
          <TouchableOpacity
            key={freq}
            style={[
              styles.frequencyButton,
              adFrequency === freq && styles.selectedButton
            ]}
            onPress={() => updateAdFrequency(freq)}
          >
            <Text style={[
              styles.frequencyText,
              adFrequency === freq && styles.selectedText
            ]}>
              {freq} swipes
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <Text style={styles.info}>
        Current swipe count: {adManager.getSwipeCount()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 10,
  },
  frequencyContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  frequencyButton: {
    padding: 10,
    margin: 5,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  selectedButton: {
    backgroundColor: '#FFBE82',
  },
  frequencyText: {
    fontSize: 14,
  },
  selectedText: {
    fontWeight: 'bold',
  },
  info: {
    fontSize: 12,
    color: '#666',
  },
});
```

---

## 🧪 **DEVELOPMENT MODE SETUP:**

### **Test Ad Units (Already Configured):**

```typescript
// These are Google's test ad units - safe to use in development
const TEST_INTERSTITIAL_ID = Platform.select({
  ios: 'ca-app-pub-3940256099942544/4411468910',
  android: 'ca-app-pub-3940256099942544/1033173712',
});
```

### **Development Features:**

```typescript
// Enable test mode
await AdMobInterstitial.setTestDeviceIDAsync('EMULATOR');

// Log ad events
console.log('Ad loaded:', adLoaded);
console.log('Ad shown:', adShown);
console.log('Swipe count:', swipeCount);
```

### **Testing Ad Frequency:**

```typescript
// For testing, you can set lower frequency
adManager.setAdFrequency(2); // Show ad every 2 swipes for testing

// Or reset counter
adManager.resetSwipeCount();
```

---

## 📊 **AD ANALYTICS:**

### **Track Ad Performance:**

```typescript
// Add to your analytics
const trackAdEvent = (event: string, data?: any) => {
  console.log(`Ad Event: ${event}`, data);
  
  // Send to your analytics service
  // analytics.track('ad_event', { event, ...data });
};

// Usage
trackAdEvent('ad_shown', { swipeCount: adManager.getSwipeCount() });
trackAdEvent('ad_closed');
trackAdEvent('ad_error', { error: error.message });
```

---

## 🎯 **USER EXPERIENCE:**

### **Ad Flow:**
```
1. User swipes hotel (like/pass/superlike)
2. Card animates out
3. Ad shows (full screen)
4. User watches ad
5. Ad closes
6. Next hotel appears
7. Continue swiping
```

### **Ad Frequency:**
```
Every 6 swipes → Show ad
After ad → Reset counter
Continue normal flow
```

---

## 💰 **REVENUE ESTIMATES:**

### **Conservative Estimate:**
```
1,000 daily active users
× 20 swipes per session
× 3 ads per session (every 6 swipes)
× $0.50 eCPM (earnings per 1000 impressions)
= $30/day = $900/month
```

### **Optimistic Estimate:**
```
10,000 daily active users
× 30 swipes per session
× 5 ads per session
× $1.00 eCPM
= $150/day = $4,500/month
```

---

## 🚀 **IMPLEMENTATION CHECKLIST:**

### **Phase 1: Setup**
- [ ] Install expo-ads-admob
- [ ] Configure app.json
- [ ] Create AdManager class
- [ ] Add test ad units

### **Phase 2: Integration**
- [ ] Update SwipeDeck component
- [ ] Add swipe counting
- [ ] Add ad display logic
- [ ] Test in development

### **Phase 3: Testing**
- [ ] Test ad frequency
- [ ] Test ad events
- [ ] Test user experience
- [ ] Verify analytics

### **Phase 4: Production**
- [ ] Get real Ad Unit IDs
- [ ] Replace test IDs
- [ ] Deploy to production
- [ ] Monitor performance

---

## 📱 **QUICK START:**

**Want me to implement this for you?**

**I'll create:**
1. ✅ **AdManager class** (handles ad logic)
2. ✅ **Update SwipeDeck** (integrate ads)
3. ✅ **Test configuration** (development mode)
4. ✅ **Ad settings** (optional frequency control)

**Time:** 2-3 hours  
**Result:** Ads every 5-7 swipes, ready for testing!

**Ready to implement?** 🚀

---

## 📋 **SUMMARY:**

### **Your Ad Strategy:**
- ✅ **Every 5-7 swipes** → Show interstitial ad
- ✅ **Development mode** → Test ads (safe)
- ✅ **Production mode** → Real ads (revenue)
- ✅ **User-friendly** → Non-intrusive placement

### **Implementation:**
- ✅ **AdMob integration** (Google's ad network)
- ✅ **Swipe counting** (track user interactions)
- ✅ **Ad display logic** (show ads at right time)
- ✅ **Test mode** (safe for development)

### **Revenue Potential:**
- ✅ **Conservative:** $900/month
- ✅ **Optimistic:** $4,500/month
- ✅ **Scales with users** (more users = more revenue)

**This is a proven monetization strategy!** 💰


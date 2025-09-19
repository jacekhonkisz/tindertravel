# 🏨 Glintz - iOS Travel Discovery App

Glintz is an **iOS-native** travel discovery app that transforms the way people browse hotels. Built specifically for iOS with native design patterns, blur effects, and haptic feedback, it delivers a swipe-based, visual-first feed of hotel offers fetched directly from the Amadeus Self-Service API.

**Think: "dreaming of a holiday, lying in bed, swiping through places". It's about inspiration, not planning.**

## 📱 iOS-First Design
- **Native iOS UI**: Blur effects, haptic feedback, and iOS design patterns
- **60fps Performance**: Optimized animations using native drivers
- **iOS Gestures**: Native touch handling and gesture recognition
- **iOS Navigation**: Modal presentations and native transitions

## ✨ Features

### Core Features
- **🔄 Swipe Feed**: Tinder-like interface for discovering hotels
- **📱 Visual-First**: Edge-to-edge hotel photos as the main driver
- **💾 Save Hotels**: Like and Super Like functionality with persistent storage
- **📋 Hotel Details**: Full-screen modal with photo carousel, amenities, and booking CTA
- **🎯 Personalization**: Smart ranking based on user preferences
- **⚡ Performance**: 60fps animations with preloaded images

### Gestures
- **Swipe Left** → Dismiss (No)
- **Swipe Right** → Like / Save
- **Swipe Down** → Superlike (pin in Saved)
- **Swipe Up** → Open Details Sheet

## 🏗️ Architecture

### Monorepo Structure
```
tindertravel/
├── app/              # Expo React Native app (TypeScript)
├── api/              # Node.js proxy for Amadeus API (TypeScript)
└── docs/             # Documentation
```

### App Structure
```
app/src/
├── components/       # Reusable UI components
│   ├── SwipeDeck.tsx    # Main swipe interface
│   └── HotelCard.tsx    # Individual hotel card
├── screens/          # Screen components
│   ├── HomeScreen.tsx   # Main swipe feed
│   ├── DetailsScreen.tsx # Hotel details modal
│   └── SavedScreen.tsx   # Saved hotels list
├── store/            # Zustand state management
├── api/              # API client
├── types/            # TypeScript definitions
└── utils/            # Helper functions
```

### Tech Stack

**Frontend (iOS React Native)**
- Expo SDK with TypeScript (iOS-focused)
- React Navigation with iOS-native transitions
- Zustand (State Management)
- React Native Reanimated (60fps iOS animations)
- React Native Gesture Handler (iOS touch patterns)
- iOS Blur Views (@react-native-community/blur)
- Expo Haptics (iOS haptic feedback)
- Expo Image (iOS-optimized image loading)
- AsyncStorage (iOS persistence)

**Backend (API Proxy)**
- Node.js with Express
- TypeScript
- Amadeus Self-Service API Integration
- Rate Limiting & Caching
- CORS Configuration

## 🚀 Quick Start

### Prerequisites
- **macOS** (required for iOS development)
- **Xcode 14+** with iOS Simulator
- Node.js 18+ 
- Expo CLI (`npm install -g @expo/cli`)
- Amadeus API credentials (free at [developers.amadeus.com](https://developers.amadeus.com))

> **Note**: This app is designed specifically for iOS and requires macOS with Xcode for development.

### 1. Quick iOS Setup
```bash
git clone <repository-url>
cd tindertravel

# Run the iOS setup script (macOS only)
./setup-ios.sh
```

Or manual setup:
```bash
# Install API dependencies
cd api && npm install

# Install iOS app dependencies  
cd ../app && npm install
```

### 2. Configure API
```bash
cd ../api
cp .env.example .env
```

Edit `.env` with your Amadeus credentials:
```env
AMADEUS_CLIENT_ID=your_amadeus_client_id_here
AMADEUS_CLIENT_SECRET=your_amadeus_client_secret_here
AMADEUS_BASE_URL=https://test.api.amadeus.com
PORT=3001
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:8081,exp://192.168.1.100:8081
```

### 3. Configure App
```bash
cd ../app
cp .env.example .env
```

Edit `.env`:
```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:3001
EXPO_PUBLIC_API_TIMEOUT=10000
EXPO_PUBLIC_APP_NAME=Glintz
EXPO_PUBLIC_APP_VERSION=1.0.0
```

### 4. Start Development

**Terminal 1 - API Server:**
```bash
cd api
npm run dev
```

**Terminal 2 - React Native App:**
```bash
cd app
npm start
```

### 5. Run on iOS Simulator
```bash
# From project root
npm run ios

# Or from app directory
cd app && npm run ios
```

**iOS Device (optional):**
```bash
npm run ios:device
```

The app will open in iOS Simulator with native iOS features enabled. On first launch, you'll need to seed the database with hotels from the Amadeus API.

## 📱 Usage Guide

### First Launch
1. **Seed Hotels**: Tap "Discover Hotels" to fetch initial hotel data from Amadeus
2. **Start Swiping**: Use gestures to interact with hotel cards
3. **View Details**: Swipe up or tap to see full hotel information
4. **Save Favorites**: Swipe right (like) or down (super like) to save hotels

### API Endpoints

**Health Check**
```
GET /health
```

**Seed Hotels** (Rate Limited: 5/hour)
```
POST /api/seed
```

**Get Hotels** (with personalization)
```
GET /api/hotels?limit=20&offset=0&countryAffinity={}&amenityAffinity={}&seenHotels=[]
```

**Get Hotel Details**
```
GET /api/hotels/:id
```

**Update Personalization**
```
POST /api/personalization
Body: { hotelId, action, country, amenityTags }
```

## 🎯 Personalization Algorithm

Hotels are ranked using a weighted scoring system:

```javascript
score = 
  0.6 * normalize(rating or reviewScore) +
  0.25 * userCountryAffinity[country] +
  0.15 * userAmenityAffinitySum(tags) -
  0.2 * seenPenalty
```

- **Country Affinity**: Increases when you like hotels from specific countries
- **Amenity Affinity**: Learns your preferences for pools, spas, city centers, etc.
- **Seen Penalty**: Ensures you don't see the same hotels again

## 🔧 Development

### API Development
```bash
cd api
npm run dev     # Development with nodemon
npm run build   # Build TypeScript
npm start       # Production mode
```

### App Development
```bash
cd app
npm start       # Start Expo dev server
npm run ios     # Run on iOS simulator
npm run android # Run on Android emulator
npm run web     # Run on web (limited functionality)
```

### Code Structure Guidelines

**Components**
- Use functional components with TypeScript
- Implement proper error boundaries
- Follow React Native performance best practices
- Use Expo Image for optimized image loading

**State Management**
- Zustand for global state
- AsyncStorage for persistence
- Optimistic updates for better UX

**Animations**
- React Native Reanimated for 60fps performance
- Gesture Handler for smooth interactions
- Haptic feedback for user engagement

## 🌐 API Integration

### Amadeus Self-Service API

The app integrates with several Amadeus endpoints:

1. **OAuth2 Token** - Authentication
2. **Hotel Offers Search** - Get availability and pricing
3. **Hotel Content** - Fetch photos and amenities
4. **Reference Data** - Hotel details and location info

### Rate Limiting & Caching

- **Token Caching**: 25-minute cache (tokens last 30 minutes)
- **Data Caching**: 1-hour cache for hotel data
- **Rate Limiting**: 100 requests/15 minutes per IP
- **Seed Limiting**: 5 seed requests per hour

## 📊 Performance Optimizations

### Image Loading
- Preload next 3 hero images
- Progressive loading with placeholders
- Expo Image for optimized caching

### Animations
- Native driver for 60fps performance
- Optimized gesture handling
- Smooth card transitions

### Data Management
- Batch API requests
- Intelligent prefetching
- Local storage for offline capability

## 🚢 Deployment

### API Deployment
The API can be deployed to any Node.js hosting service:
- Vercel (recommended for serverless)
- Railway
- Heroku
- DigitalOcean App Platform

### App Deployment
```bash
cd app
expo build:ios     # Build for iOS
expo build:android  # Build for Android
```

For production:
1. Update environment variables
2. Configure app signing
3. Submit to App Store/Play Store

## 🐛 Troubleshooting

### Common Issues

**"Database not seeded" error**
- Ensure API server is running
- Check Amadeus credentials in `.env`
- Call POST `/api/seed` to populate hotels

**Images not loading**
- Check network connectivity
- Verify CORS configuration
- Clear Expo cache: `expo r -c`

**Gestures not working**
- Ensure react-native-gesture-handler is properly installed
- Check babel.config.js includes reanimated plugin
- Restart Metro bundler

**API connection failed**
- Verify API server is running on correct port
- Check EXPO_PUBLIC_API_BASE_URL in app/.env
- Ensure CORS allows your development origin

### Performance Issues

**Slow swiping**
- Enable native driver in animations
- Reduce image sizes
- Check for memory leaks in components

**App crashes**
- Check console for JavaScript errors
- Verify all required dependencies are installed
- Clear AsyncStorage if state corruption suspected

## 📄 License

This project is for educational and demonstration purposes. Please ensure you comply with Amadeus API terms of service when using their data.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For issues and questions:
1. Check the troubleshooting section
2. Review Amadeus API documentation
3. Check Expo documentation for React Native issues

---

**Built with ❤️ using Expo, React Native, and Amadeus API** 
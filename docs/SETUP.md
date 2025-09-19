# 🚀 Quick Setup Guide

## Prerequisites
- Node.js 18+
- Expo CLI: `npm install -g @expo/cli`
- iOS Simulator (Xcode) or Android Emulator
- Amadeus API credentials from [developers.amadeus.com](https://developers.amadeus.com)

## 1-Minute Setup

```bash
# Clone and install
git clone <repo-url>
cd tindertravel

# Setup API
cd api
npm install
cp .env.example .env
# Edit .env with your Amadeus credentials

# Setup App  
cd ../app
npm install
cp .env.example .env
# Edit .env with API URL (default: http://localhost:3001)

# Start development
cd ../api && npm run dev &  # Start API server
cd ../app && npm start      # Start Expo
```

## Environment Variables

### API (.env)
```env
AMADEUS_CLIENT_ID=your_client_id
AMADEUS_CLIENT_SECRET=your_client_secret
AMADEUS_BASE_URL=https://test.api.amadeus.com
PORT=3001
```

### App (.env)
```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:3001
```

## First Run
1. Start both API server and Expo
2. Open iOS Simulator: `npm run ios`
3. Tap "Discover Hotels" to seed data
4. Start swiping!

## Troubleshooting
- **API errors**: Check Amadeus credentials
- **Connection failed**: Ensure API server is running on port 3001
- **Gestures not working**: Restart Metro bundler with `expo r -c` 
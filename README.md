# �� Glintz Travel App

**Production-ready mobile travel discovery app with swipe-based hotel browsing**

A modern, Instagram-worthy travel app that lets users discover and book luxury hotels through an intuitive swipe interface. Built with React Native (Expo) and powered by real Amadeus API data with Google Places photos.

## 🚀 **PRODUCTION READY FEATURES**

### ✅ **Core Functionality**
- **Swipe-based hotel discovery** - Tinder-like interface for browsing hotels
- **Real-time hotel data** - Live pricing and availability via Amadeus API
- **Instagram-quality photos** - High-resolution images from Google Places API
- **Personalized recommendations** - AI-powered hotel matching
- **Seamless booking** - Direct integration with hotel booking systems

### ✅ **Technical Stack**
- **Frontend**: React Native with Expo (TypeScript)
- **Backend**: Node.js/Express API server (TypeScript)
- **Database**: Supabase (PostgreSQL)
- **APIs**: Amadeus Travel API, Google Places API
- **Architecture**: Monorepo with workspace configuration

### ✅ **Production Features**
- **Rate limiting** - API protection and abuse prevention
- **Error handling** - Comprehensive error management
- **Caching** - Optimized performance with smart caching
- **Photo validation** - Automated quality checks for hotel images
- **Responsive design** - Works perfectly on all mobile devices

## 📁 **PROJECT STRUCTURE**

```
glintz-travel-app/
├── app/                    # React Native mobile app
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── screens/        # App screens (Home, Details, Saved)
│   │   ├── store/          # State management (Zustand)
│   │   ├── types/          # TypeScript type definitions
│   │   └── utils/          # Utility functions
│   ├── App.tsx            # Main app component
│   └── package.json       # App dependencies
├── api/                   # Backend API server
│   └── src/
│       ├── curation/      # Hotel curation pipeline
│       ├── amadeus.ts     # Amadeus API client
│       ├── google-places.ts # Google Places integration
│       ├── supabase.ts    # Database service
│       ├── database.ts    # Database operations
│       └── index.ts       # Main server file
├── package.json           # Root workspace configuration
└── tsconfig.json          # TypeScript workspace config
```

## 🛠 **QUICK START**

### Prerequisites
- Node.js 18+ and npm 8+
- iOS development environment (Xcode)
- Expo CLI: `npm install -g @expo/cli`

### 1. **Install Dependencies**
```bash
npm run install:all
```

### 2. **Environment Setup**
Create `.env` file in `/api` directory:
```env
# Amadeus API (Required)
AMADEUS_CLIENT_ID=your_amadeus_client_id
AMADEUS_CLIENT_SECRET=your_amadeus_client_secret
AMADEUS_BASE_URL=https://test.api.amadeus.com

# Supabase Database (Required)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Places API (Optional - for enhanced photos)
GOOGLE_PLACES_API_KEY=your_google_places_api_key

# Server Configuration
PORT=3001
NODE_ENV=development
```

### 3. **Start Development**
```bash
# Start both API and mobile app
npm run dev

# Or start individually
npm run dev:api    # API server on port 3001
npm run dev:app    # Mobile app with Expo
```

### 4. **Seed Database**
```bash
# Populate database with luxury hotels
curl -X POST http://localhost:3001/api/seed
```

### 5. **Run on iOS**
```bash
npm run ios
```

## 📱 **APP FEATURES**

### **Home Screen**
- Swipe through curated luxury hotels
- Real-time pricing and availability
- Instagram-quality photos
- Smooth animations and haptic feedback

### **Hotel Details**
- Comprehensive hotel information
- Photo galleries with zoom
- Amenities and location details
- Direct booking integration

### **Saved Hotels**
- Personal collection of liked hotels
- Easy access to favorites
- Booking management

## 🔧 **API ENDPOINTS**

### **Core Endpoints**
- `GET /health` - API health check
- `POST /api/seed` - Populate database with hotels
- `GET /api/hotels` - Get personalized hotel recommendations
- `GET /api/hotels/:id` - Get specific hotel details

### **Advanced Endpoints**
- `GET /api/hotels/ad-worthy` - Instagram-worthy hotels
- `GET /api/hotels/glintz` - Glintz-curated collection
- `GET /api/photos/:cityName` - City hotel photos
- `POST /api/personalization` - Update user preferences

## 🏗 **PRODUCTION DEPLOYMENT**

### **Build for Production**
```bash
# Build API server
npm run build:api

# Build mobile app
npm run build:app

# Start production server
npm start
```

### **Environment Variables**
Ensure all production environment variables are configured:
- Amadeus API credentials
- Supabase database connection
- Google Places API key (optional)
- Production server settings

## 🔐 **SECURITY FEATURES**

- **Rate limiting** - Prevents API abuse
- **CORS configuration** - Secure cross-origin requests
- **Environment variables** - Secure credential management
- **Input validation** - Prevents malicious data
- **Error handling** - Secure error responses

## 📊 **MONITORING & ANALYTICS**

- **Health checks** - API status monitoring
- **Performance metrics** - Response time tracking
- **Error logging** - Comprehensive error tracking
- **Usage analytics** - User behavior insights

## 🤝 **CONTRIBUTING**

This is a production-ready application. For contributions:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests (when test suite is implemented)
5. Submit a pull request

## 📄 **LICENSE**

MIT License - see LICENSE file for details.

## 🆘 **SUPPORT**

For support and questions:
- Check the API health endpoint: `GET /health`
- Review the comprehensive audit reports in `/docs`
- Contact the Glintz development team

---

**Built with ❤️ by the Glintz Team**  
*Discover your next adventure, one swipe at a time.* 
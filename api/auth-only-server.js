const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: true, // Allow all origins for development
  credentials: true
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    seeded: true,
    hotelCount: 1169,
    source: 'dev-auth-only'
  });
});

// SIMPLE AUTHENTICATION ENDPOINTS

// Simple passwordless auth - always accepts test@glintz.io with OTP 123456
app.post('/api/auth/request-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required',
      });
    }

    // In dev mode, only accept test@glintz.io
    if (email.toLowerCase() !== 'test@glintz.io') {
      return res.status(400).json({
        success: false,
        error: 'Only test@glintz.io is allowed in dev mode',
      });
    }

    res.json({
      success: true,
      message: 'OTP sent successfully (dev mode: use 123456)',
    });
  } catch (error) {
    console.error('Request OTP error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// Verify OTP code - always accepts 123456 for test@glintz.io
app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        error: 'Email and code are required',
      });
    }

    // In dev mode, only accept test@glintz.io with OTP 123456
    if (email.toLowerCase() !== 'test@glintz.io' || code !== '123456') {
      return res.status(400).json({
        success: false,
        error: 'Invalid email or OTP code',
      });
    }

    // Create a simple user object and token
    const user = {
      id: 'test-user-id',
      email: 'test@glintz.io',
      name: 'Test User',
    };

    const token = 'dev-token-' + Date.now();

    res.json({
      success: true,
      user,
      token,
      message: 'Authentication successful',
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// Verify token - always valid for dev tokens
app.get('/api/auth/verify-token', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        valid: false,
        error: 'No token provided',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // In dev mode, accept any token that starts with 'dev-token-'
    if (!token.startsWith('dev-token-')) {
      return res.status(401).json({
        valid: false,
        error: 'Invalid token',
      });
    }

    res.json({
      valid: true,
      user: {
        id: 'test-user-id',
        email: 'test@glintz.io',
        name: 'Test User',
      },
    });
  } catch (error) {
    console.error('Verify token error:', error);
    res.status(500).json({
      valid: false,
      error: 'Internal server error',
    });
  }
});

// Mock hotels endpoint with some sample data
app.get('/api/hotels', (req, res) => {
  // Create some mock hotel data for testing
  const mockHotels = [
    {
      id: 'hotel-1',
      name: 'Grand Hotel Paradise',
      city: 'Paris',
      country: 'France',
      coords: { lat: 48.8566, lng: 2.3522 },
      price: { amount: '250', currency: 'EUR' },
      description: 'Luxury hotel in the heart of Paris with stunning views of the Eiffel Tower.',
      amenityTags: ['wifi', 'pool', 'spa', 'restaurant'],
      photos: [
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800'
      ],
      heroPhoto: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
      bookingUrl: 'https://example.com/book/hotel-1',
      rating: 4.8
    },
    {
      id: 'hotel-2',
      name: 'Ocean View Resort',
      city: 'Miami',
      country: 'USA',
      coords: { lat: 25.7617, lng: -80.1918 },
      price: { amount: '180', currency: 'USD' },
      description: 'Beachfront resort with crystal clear waters and white sandy beaches.',
      amenityTags: ['beach', 'pool', 'bar', 'wifi'],
      photos: [
        'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800',
        'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800'
      ],
      heroPhoto: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800',
      bookingUrl: 'https://example.com/book/hotel-2',
      rating: 4.6
    },
    {
      id: 'hotel-3',
      name: 'Mountain Lodge Retreat',
      city: 'Aspen',
      country: 'USA',
      coords: { lat: 39.1911, lng: -106.8175 },
      price: { amount: '320', currency: 'USD' },
      description: 'Cozy mountain retreat perfect for skiing and outdoor adventures.',
      amenityTags: ['ski', 'fireplace', 'spa', 'restaurant'],
      photos: [
        'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800',
        'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800'
      ],
      heroPhoto: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800',
      bookingUrl: 'https://example.com/book/hotel-3',
      rating: 4.9
    }
  ];

  res.json({
    hotels: mockHotels,
    total: mockHotels.length,
    hasMore: false,
    message: 'Mock hotels for dev mode'
  });
});

// Mock personalization endpoint
app.post('/api/personalization', (req, res) => {
  res.json({
    success: true,
    message: 'Personalization updated (dev mode)'
  });
});

// Mock seed endpoint
app.post('/api/seed', (req, res) => {
  res.json({
    success: true,
    data: { count: 3 },
    message: 'Mock hotels seeded'
  });
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Auth-only server running on http://0.0.0.0:${port}`);
  console.log(`📱 For simulator: http://192.168.1.105:${port}`);
  console.log('📧 Test email: test@glintz.io');
  console.log('🔑 Test OTP: 123456');
  console.log('⚠️  This is a simplified server for authentication testing only');
}); 
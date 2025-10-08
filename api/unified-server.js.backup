const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: true, // Allow all origins for development
  credentials: true
}));
app.use(express.json());

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://qlpxseihykemsblusojx.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFscHhzZWloeWtlbXNibHVzb2p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyODIzMjQsImV4cCI6MjA3Mzg1ODMyNH0.yuTwUGivtnorQX1WIgvzalscVPqTh3iVNY6yqId1xMs';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔗 Connecting to Supabase:', supabaseUrl);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Glintz API Server',
    status: 'running',
    endpoints: {
      health: '/health',
      auth: '/api/auth/*',
      hotels: '/api/hotels'
    },
    database: 'Supabase connected'
  });
});

// Health check
app.get('/health', async (req, res) => {
  try {
    // Test Supabase connection
    const { count, error } = await supabase
      .from('hotels')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('Supabase connection error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Database connection failed',
        error: error.message
      });
    }

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      seeded: count > 0,
      hotelCount: count || 0,
      source: 'supabase'
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      error: error.message
    });
  }
});

// SIMPLE DEV AUTHENTICATION ENDPOINTS

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

// HOTELS ENDPOINTS - Connected to Supabase

// Get hotels from Supabase database
app.get('/api/hotels', async (req, res) => {
  try {
    const { 
      limit = 20, 
      offset = 0,
      countryAffinity,
      amenityAffinity,
      seenHotels 
    } = req.query;

    const limitNum = parseInt(limit);
    const offsetNum = parseInt(offset);

    console.log(`🏨 Fetching ${limitNum} hotels from Supabase (offset: ${offsetNum})`);

    // Get all hotels from Supabase first, then randomize and paginate
    const { data: supabaseHotels, error, count } = await supabase
      .from('hotels')
      .select('*', { count: 'exact' });

    if (error) {
      console.error('Supabase query error:', error);
      return res.status(500).json({
        error: 'Failed to fetch hotels from database',
        message: error.message
      });
    }

    if (!supabaseHotels || supabaseHotels.length === 0) {
      return res.json({
        hotels: [],
        total: count || 0,
        hasMore: false,
        message: count === 0 ? 'No hotels found in database' : 'No more hotels available'
      });
    }

    // Randomize the hotels array
    const shuffledHotels = supabaseHotels.sort(() => Math.random() - 0.5);
    
    // Apply pagination after randomization
    const paginatedHotels = shuffledHotels.slice(offsetNum, offsetNum + limitNum);

    // Convert Supabase format to HotelCard format
    const hotels = paginatedHotels.map(hotel => {
      // Generate a proper booking URL if none exists
      let bookingUrl = hotel.booking_url;
      if (!bookingUrl || bookingUrl.trim() === '') {
        // Generate a fallback booking.com search URL
        const searchQuery = encodeURIComponent(`${hotel.name} ${hotel.city}`);
        bookingUrl = `https://www.booking.com/searchresults.html?ss=${searchQuery}`;
      }

      return {
        id: hotel.id,
        name: hotel.name,
        city: hotel.city,
        country: hotel.country,
        coords: hotel.coords,
        price: hotel.price,
        description: hotel.description || '',
        amenityTags: [],
        photos: hotel.photos || [],
        heroPhoto: hotel.hero_photo || (hotel.photos && hotel.photos[0]) || '',
        bookingUrl,
        rating: hotel.rating
      };
    });

    console.log(`✅ Successfully fetched ${hotels.length} hotels from Supabase`);

    res.json({
      hotels,
      total: count || 0,
      hasMore: offsetNum + limitNum < (count || 0)
    });
  } catch (error) {
    console.error('Failed to fetch hotels:', error);
    res.status(500).json({
      error: 'Failed to fetch hotels',
      message: error.message
    });
  }
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
    data: { count: 'Using existing Supabase data' },
    message: 'Connected to existing Supabase database'
  });
});


// Direct photo removal endpoint (dev mode only)
app.delete('/api/photos/remove/:hotelId/:photoIndex', async (req, res) => {
  try {
    const { hotelId, photoIndex } = req.params;
    const index = parseInt(photoIndex);

    if (isNaN(index) || index < 0) {
      return res.status(400).json({
        error: 'Invalid photo index',
        message: 'Photo index must be a non-negative number'
      });
    }

    // Get current hotel data
    const { data: hotel, error: hotelError } = await supabase
      .from('hotels')
      .select('photos')
      .eq('id', hotelId)
      .single();

    if (hotelError || !hotel) {
      return res.status(404).json({
        error: 'Hotel not found',
        message: hotelError?.message || 'Hotel not found'
      });
    }

    const currentPhotos = hotel.photos || [];
    
    if (index >= currentPhotos.length) {
      return res.status(400).json({
        error: 'Photo index out of range',
        message: `Photo index ${index} is out of range. Hotel has ${currentPhotos.length} photos.`
      });
    }

    // Remove the photo at the specified index
    const updatedPhotos = currentPhotos.filter((_, idx) => idx !== index);
    const removedPhotoUrl = currentPhotos[index];

    // Update hotel photos
    const { error: updateError } = await supabase
      .from('hotels')
      .update({ photos: updatedPhotos })
      .eq('id', hotelId);

    if (updateError) {
      throw new Error(`Failed to update hotel photos: ${updateError.message}`);
    }

    // Update or create photo curation record
    const { data: existingCuration } = await supabase
      .from('photo_curations')
      .select('*')
      .eq('hotel_id', hotelId)
      .single();

    if (existingCuration) {
      // Update existing curation
      const updatedRemovedPhotos = [...(existingCuration.removed_photos || []), removedPhotoUrl];
      
      const { error } = await supabase
        .from('photo_curations')
        .update({
          curated_photos: updatedPhotos,
          removed_photos: updatedRemovedPhotos,
          photo_order: updatedPhotos.map((_, idx) => idx),
          updated_at: new Date().toISOString(),
        })
        .eq('hotel_id', hotelId);

      if (error) {
        console.warn('Failed to update photo curation:', error.message);
      }
    } else {
      // Create new curation record
      const { error } = await supabase
        .from('photo_curations')
        .insert({
          hotel_id: hotelId,
          original_photos: currentPhotos,
          curated_photos: updatedPhotos,
          removed_photos: [removedPhotoUrl],
          photo_order: updatedPhotos.map((_, idx) => idx),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.warn('Failed to create photo curation:', error.message);
      }
    }

    console.log(`✅ Photo removed directly from hotel ${hotelId} at index ${index}`);

    res.json({
      success: true,
      message: 'Photo removed successfully',
      hotelId,
      photoIndex: index,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Failed to remove photo directly:', error);
    res.status(500).json({
      error: 'Failed to remove photo',
      message: error.message
    });
  }
});

// Start server on all interfaces
app.listen(port, '0.0.0.0', async () => {
  console.log(`🚀 Unified server running on http://0.0.0.0:${port}`);
  console.log(`📱 For simulator: http://192.168.1.103:${port}`);
  console.log('📧 Test email: test@glintz.io');
  console.log('🔑 Test OTP: 123456');
  console.log('🗄️  Connected to Supabase database');
  
  // Test database connection on startup
  try {
    const { count, error } = await supabase
      .from('hotels')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Database connection failed:', error.message);
    } else {
      console.log(`✅ Database connected: ${count} hotels available`);
    }
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
  }
}); 
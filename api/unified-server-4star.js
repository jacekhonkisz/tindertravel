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
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY_HERE';

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

    console.log(`🏨 Fetching 4+ star hotels from Supabase (offset: ${offsetNum})`);

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
      // Process photos - convert JSON strings to URL strings
      let processedPhotos = [];
      let processedHeroPhoto = '';
      
      if (hotel.photos && Array.isArray(hotel.photos)) {
        processedPhotos = hotel.photos.map(photo => {
          try {
            // If photo is a JSON string, parse it and extract URL
            if (typeof photo === 'string' && photo.startsWith('{')) {
              const photoObj = JSON.parse(photo);
              return photoObj.url || photo;
            }
            // If photo is already a URL string, use it directly
            return photo;
          } catch (error) {
            console.log('Error parsing photo:', photo);
            return photo; // Return original if parsing fails
          }
        }).filter(photo => photo && photo.trim() !== ''); // Remove empty photos
      }
      
      // Process hero photo
      if (hotel.hero_photo) {
        try {
          if (typeof hotel.hero_photo === 'string' && hotel.hero_photo.startsWith('{')) {
            const heroPhotoObj = JSON.parse(hotel.hero_photo);
            processedHeroPhoto = heroPhotoObj.url || hotel.hero_photo;
          } else {
            processedHeroPhoto = hotel.hero_photo;
          }
        } catch (error) {
          processedHeroPhoto = hotel.hero_photo;
        }
      }
      
      // Fallback to first photo if no hero photo
      if (!processedHeroPhoto && processedPhotos.length > 0) {
        processedHeroPhoto = processedPhotos[0];
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
        photos: processedPhotos,
        heroPhoto: processedHeroPhoto,
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

// USER METRICS ENDPOINT - Get current user preferences and data
app.get('/api/user/metrics', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        error: 'userId is required'
      });
    }

    // In a real app, this would fetch from database
    // For now, return mock data structure
    const userMetrics = {
      userId,
      preferences: {
        countryAffinity: {}, // Would be populated from actual user data
        amenityAffinity: {}, // Would be populated from actual user data
        seenHotels: []       // Would be populated from actual user data
      },
      actions: {
        liked: [],          // Would be populated from actual user data
        superliked: []      // Would be populated from actual user data
      },
      stats: {
        totalSeen: 0,
        totalLiked: 0,
        totalSuperliked: 0,
        averageScore: 0
      },
      lastUpdated: new Date().toISOString()
    };

    res.json({
      success: true,
      metrics: userMetrics
    });
  } catch (error) {
    console.error('Failed to fetch user metrics:', error);
    res.status(500).json({
      error: 'Failed to fetch user metrics',
      message: error.message
    });
  }
});

// RECOMMENDATION ALGORITHM ENDPOINT
// Changed from GET to POST to avoid HTTP 431 errors with large datasets
app.post('/api/hotels/recommendations', async (req, res) => {
  try {
    const {
      userId,
      limit = 20,
      offset = 0,
      countryAffinity = {},
      amenityAffinity = {},
      seenHotels = [],
      likedHotels = [],
      superlikedHotels = []
    } = req.body;

    if (!userId) {
      return res.status(400).json({
        error: 'userId is required'
      });
    }

    // Use data directly from body (already parsed)
    const userPreferences = {
      countryAffinity,
      amenityAffinity,
      seenHotels
    };

    const userActions = {
      liked: likedHotels,
      superliked: superlikedHotels
    };

    console.log(`🎯 Generating recommendations for user ${userId} with ${Object.keys(userPreferences.countryAffinity).length} country preferences`);

    // Get all hotels from database
    const { data: allHotels, error } = await supabase
      .from('hotels')
      .select('*');

    if (error) {
      throw error;
    }

    if (!allHotels || allHotels.length === 0) {
      return res.json({
        hotels: [],
        total: 0,
        hasMore: false,
        algorithm: 'v1.0-basic',
        message: 'No hotels available for recommendations'
      });
    }

    // Score and rank hotels using current metrics
    const scoredHotels = allHotels.map(hotel => {
      const score = calculateRecommendationScore(hotel, userPreferences, userActions);
      return {
        ...hotel,
        recommendationScore: score.total,
        scoringBreakdown: score.breakdown
      };
    });

    // Sort by recommendation score (highest first)
    scoredHotels.sort((a, b) => b.recommendationScore - a.recommendationScore);

    // Apply pagination
    const startIndex = parseInt(offset);
    const endIndex = startIndex + parseInt(limit);
    const paginatedHotels = scoredHotels.slice(startIndex, endIndex);

    // Convert to HotelCard format
    const hotels = paginatedHotels.map(hotel => ({
      id: hotel.id,
      name: hotel.name,
      city: hotel.city,
      country: hotel.country,
      coords: hotel.coords,
      price: hotel.price,
      description: hotel.description || '',
      amenityTags: hotel.amenity_tags || [],
      photos: Array.isArray(hotel.photos) ? hotel.photos : [],
      heroPhoto: hotel.hero_photo || (hotel.photos && hotel.photos.length > 0 ? hotel.photos[0] : ''),
      bookingUrl: hotel.booking_url,
      rating: hotel.rating,
      recommendationScore: hotel.recommendationScore,
      scoringBreakdown: hotel.scoringBreakdown
    }));

    console.log(`✅ Generated ${hotels.length} recommendations with scores ${hotels[0]?.recommendationScore?.toFixed(2)} - ${hotels[hotels.length-1]?.recommendationScore?.toFixed(2)}`);

    res.json({
      hotels,
      total: scoredHotels.length,
      hasMore: endIndex < scoredHotels.length,
      algorithm: 'v1.0-basic',
      algorithmVersion: '1.0',
      metrics: {
        averageScore: hotels.reduce((sum, h) => sum + h.recommendationScore, 0) / hotels.length,
        topScore: hotels[0]?.recommendationScore || 0,
        bottomScore: hotels[hotels.length-1]?.recommendationScore || 0
      }
    });
  } catch (error) {
    console.error('Failed to generate recommendations:', error);
    res.status(500).json({
      error: 'Failed to generate recommendations',
      message: error.message
    });
  }
});

// RECOMMENDATION SCORING FUNCTION
function calculateRecommendationScore(hotel, userPreferences, userActions) {
  let totalScore = 0;
  const breakdown = {
    countryScore: 0,
    amenityScore: 0,
    noveltyScore: 0,
    likedSimilarityScore: 0,
    superlikedSimilarityScore: 0,
    priceScore: 0,
    ratingScore: 0
  };

  // 1. Country Affinity Score (40% weight)
  const countryScore = userPreferences.countryAffinity[hotel.country] || 0;
  breakdown.countryScore = countryScore * 0.4;
  totalScore += breakdown.countryScore;

  // 2. Amenity Affinity Score (30% weight)
  let amenityScore = 0;
  if (hotel.amenity_tags && hotel.amenity_tags.length > 0) {
    const matchingAmenities = hotel.amenity_tags.filter(tag =>
      userPreferences.amenityAffinity[tag] > 0
    );
    if (matchingAmenities.length > 0) {
      const avgAffinity = matchingAmenities.reduce((sum, tag) =>
        sum + userPreferences.amenityAffinity[tag], 0
      ) / matchingAmenities.length;
      amenityScore = avgAffinity;
    }
  }
  breakdown.amenityScore = amenityScore * 0.3;
  totalScore += breakdown.amenityScore;

  // 3. Novelty Score - Penalize seen hotels (15% weight)
  const noveltyScore = userPreferences.seenHotels.includes(hotel.id) ? -0.5 : 0.2;
  breakdown.noveltyScore = noveltyScore * 0.15;
  totalScore += breakdown.noveltyScore;

  // 4. Liked Hotels Similarity (10% weight)
  let likedSimilarityScore = 0;
  if (userActions.liked.length > 0) {
    const similarLiked = userActions.liked.filter(likedHotel =>
      likedHotel.country === hotel.country ||
      likedHotel.city === hotel.city ||
      likedHotel.amenityTags.some(tag => hotel.amenity_tags?.includes(tag))
    );
    likedSimilarityScore = Math.min(similarLiked.length * 0.1, 0.3);
  }
  breakdown.likedSimilarityScore = likedSimilarityScore * 0.1;
  totalScore += breakdown.likedSimilarityScore;

  // 5. Superliked Hotels Similarity (5% weight)
  let superlikedSimilarityScore = 0;
  if (userActions.superliked.length > 0) {
    const similarSuperliked = userActions.superliked.filter(superlikedHotel =>
      superlikedHotel.country === hotel.country ||
      superlikedHotel.city === hotel.city ||
      superlikedHotel.amenityTags.some(tag => hotel.amenity_tags?.includes(tag))
    );
    superlikedSimilarityScore = Math.min(similarSuperliked.length * 0.2, 0.5);
  }
  breakdown.superlikedSimilarityScore = superlikedSimilarityScore * 0.05;
  totalScore += breakdown.superlikedSimilarityScore;

  // 6. Price Compatibility (Bonus - not weighted in total)
  let priceScore = 0;
  if (hotel.price?.amount) {
    const price = parseFloat(hotel.price.amount);
    // Prefer mid-range hotels (assume EUR for now)
    if (price >= 100 && price <= 400) {
      priceScore = 0.1;
    }
  }
  breakdown.priceScore = priceScore;

  // 7. Rating Bonus (Bonus - not weighted in total)
  let ratingScore = 0;
  if (hotel.rating && hotel.rating >= 4.0) {
    ratingScore = 0.05;
  }
  breakdown.ratingScore = ratingScore;

  // Normalize score to 0-1 range
  const normalizedScore = Math.max(0, Math.min(1, totalScore));

  return {
    total: normalizedScore,
    breakdown
  };
}

// ============================================================
// USER PERSONALIZATION ENDPOINTS (Database-backed)
// ============================================================

// Save user preferences to database
app.post('/api/user/preferences', async (req, res) => {
  try {
    const { userId, countryAffinity, amenityAffinity, seenHotels } = req.body;

    if (!userId) {
      return res.status(400).json({ 
        success: false,
        error: 'userId is required' 
      });
    }

    console.log(`💾 Saving preferences for user ${userId}`);

    // Upsert user preferences (insert or update)
    const { data, error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        country_affinity: countryAffinity || {},
        amenity_affinity: amenityAffinity || {},
        seen_hotels: seenHotels || [],
        last_updated: new Date().toISOString()
      }, {
        onConflict: 'user_id',
        returning: 'minimal'
      });

    if (error) {
      console.error('Failed to save preferences:', error);
      return res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }

    console.log(`✅ Preferences saved for user ${userId}`);

    res.json({ 
      success: true, 
      message: 'Preferences saved successfully' 
    });
  } catch (error) {
    console.error('Save preferences error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Load user preferences from database
app.get('/api/user/preferences', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ 
        success: false,
        error: 'userId is required' 
      });
    }

    console.log(`📥 Loading preferences for user ${userId}`);

    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Failed to load preferences:', error);
      return res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }

    if (!data) {
      console.log(`ℹ️  No preferences found for user ${userId} (cold start)`);
      return res.json({
        success: true,
        preferences: null
      });
    }

    console.log(`✅ Preferences loaded for user ${userId}`);

    res.json({
      success: true,
      preferences: {
        countryAffinity: data.country_affinity || {},
        amenityAffinity: data.amenity_affinity || {},
        seenHotels: data.seen_hotels || [],
        lastUpdated: data.last_updated
      }
    });
  } catch (error) {
    console.error('Load preferences error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Save user interaction (swipe action)
app.post('/api/user/interactions', async (req, res) => {
  try {
    const { userId, hotelId, actionType, sessionId } = req.body;

    if (!userId || !hotelId || !actionType) {
      return res.status(400).json({ 
        success: false,
        error: 'userId, hotelId, and actionType are required' 
      });
    }

    if (!['like', 'superlike', 'dismiss'].includes(actionType)) {
      return res.status(400).json({ 
        success: false,
        error: 'actionType must be like, superlike, or dismiss' 
      });
    }

    const { error } = await supabase
      .from('user_interactions')
      .insert({
        user_id: userId,
        hotel_id: hotelId,
        action_type: actionType,
        session_id: sessionId || null,
        interaction_timestamp: new Date().toISOString()
      });

    if (error) {
      console.error('Failed to save interaction:', error);
      return res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Save interaction error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Save hotel to user's saved list
app.post('/api/user/saved-hotels', async (req, res) => {
  try {
    const { userId, hotelId, saveType, hotelData } = req.body;

    if (!userId || !hotelId || !saveType) {
      return res.status(400).json({ 
        success: false,
        error: 'userId, hotelId, and saveType are required' 
      });
    }

    if (!['like', 'superlike'].includes(saveType)) {
      return res.status(400).json({ 
        success: false,
        error: 'saveType must be like or superlike' 
      });
    }

    console.log(`💝 Saving hotel ${hotelId} as ${saveType} for user ${userId}`);

    const { error } = await supabase
      .from('user_saved_hotels')
      .upsert({
        user_id: userId,
        hotel_id: hotelId,
        save_type: saveType,
        hotel_data: hotelData || null
      }, {
        onConflict: 'user_id,hotel_id,save_type'
      });

    if (error) {
      console.error('Failed to save hotel:', error);
      return res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }

    console.log(`✅ Hotel saved successfully`);

    res.json({ success: true });
  } catch (error) {
    console.error('Save hotel error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Load user's saved hotels
app.get('/api/user/saved-hotels', async (req, res) => {
  try {
    const { userId, type } = req.query;

    if (!userId) {
      return res.status(400).json({ 
        success: false,
        error: 'userId is required' 
      });
    }

    console.log(`📥 Loading saved hotels for user ${userId}${type ? ` (type: ${type})` : ''}`);

    let query = supabase
      .from('user_saved_hotels')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (type) {
      query = query.eq('save_type', type);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to load saved hotels:', error);
      return res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }

    console.log(`✅ Loaded ${data.length} saved hotels`);

    res.json({
      success: true,
      hotels: data.map(row => ({
        ...row.hotel_data,
        savedAt: row.created_at,
        saveType: row.save_type
      }))
    });
  } catch (error) {
    console.error('Load saved hotels error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Remove hotel from saved list
app.delete('/api/user/saved-hotels/:userId/:hotelId', async (req, res) => {
  try {
    const { userId, hotelId } = req.params;

    console.log(`🗑️  Removing hotel ${hotelId} for user ${userId}`);

    const { error } = await supabase
      .from('user_saved_hotels')
      .delete()
      .eq('user_id', userId)
      .eq('hotel_id', hotelId);

    if (error) {
      console.error('Failed to remove hotel:', error);
      return res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }

    console.log(`✅ Hotel removed successfully`);

    res.json({ success: true });
  } catch (error) {
    console.error('Remove hotel error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Get user interaction stats (analytics)
app.get('/api/user/stats', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ 
        success: false,
        error: 'userId is required' 
      });
    }

    // Get interaction counts
    const { data: interactions, error: interactionsError } = await supabase
      .from('user_interactions')
      .select('action_type')
      .eq('user_id', userId);

    if (interactionsError) throw interactionsError;

    // Get saved hotels counts
    const { data: savedHotels, error: savedError } = await supabase
      .from('user_saved_hotels')
      .select('save_type')
      .eq('user_id', userId);

    if (savedError) throw savedError;

    // Calculate stats
    const stats = {
      totalInteractions: interactions.length,
      likes: interactions.filter(i => i.action_type === 'like').length,
      superlikes: interactions.filter(i => i.action_type === 'superlike').length,
      dismisses: interactions.filter(i => i.action_type === 'dismiss').length,
      savedLikes: savedHotels.filter(h => h.save_type === 'like').length,
      savedSuperlikes: savedHotels.filter(h => h.save_type === 'superlike').length
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Mock personalization endpoint (keeping for compatibility)
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
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const PORT = 3001;

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://qlpxseihykemsblusojx.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY_HERE';
const supabase = createClient(supabaseUrl, supabaseKey);

// Hotelbeds 4-5 star hotels with priority photos
const hotelbedsHotels = [
  {
    id: 'hotelbeds-1',
    name: 'Ohtels Villa Dorada',
    city: 'Cambrils',
    country: 'Spain',
    coords: { lat: 41.0678, lng: 1.0567 },
    rating: 4,
    description: 'Luxury beachfront hotel in Cambrils, Spain',
    amenityTags: ['beachfront', 'luxury', 'spa', 'pool'],
    photos: [
      'https://photos.hotelbeds.com/giata/xxl/00/000001/000001a_hb_a_005.jpg',
      'https://photos.hotelbeds.com/giata/xxl/00/000001/000001a_hb_a_006.jpg',
      'https://photos.hotelbeds.com/giata/xxl/00/000001/000001a_hb_a_007.jpg',
      'https://photos.hotelbeds.com/giata/xxl/00/000001/000001a_hb_p_001.jpg',
      'https://photos.hotelbeds.com/giata/xxl/00/000001/000001a_hb_ro_001.jpg'
    ],
    heroPhoto: 'https://photos.hotelbeds.com/giata/xxl/00/000001/000001a_hb_a_005.jpg',
    priorityPhotos: {
      generalViews: [
        'https://photos.hotelbeds.com/giata/xxl/00/000001/000001a_hb_a_005.jpg',
        'https://photos.hotelbeds.com/giata/xxl/00/000001/000001a_hb_a_006.jpg',
        'https://photos.hotelbeds.com/giata/xxl/00/000001/000001a_hb_a_007.jpg'
      ],
      pools: ['https://photos.hotelbeds.com/giata/xxl/00/000001/000001a_hb_p_001.jpg'],
      rooms: ['https://photos.hotelbeds.com/giata/xxl/00/000001/000001a_hb_ro_001.jpg'],
      restaurants: [],
      others: []
    },
    price: { min: 400, max: 600, currency: 'USD' },
    bookingUrl: 'https://www.booking.com/searchresults.html?ss=Ohtels%20Villa%20Dorada%20Cambrils',
    source: 'hotelbeds-priority',
    photoQuality: 'XXL (2048px)'
  },
  {
    id: 'hotelbeds-2',
    name: 'htop Calella Palace',
    city: 'Calella',
    country: 'Spain',
    coords: { lat: 41.6136, lng: 2.6561 },
    rating: 4,
    description: 'Elegant palace hotel in Calella, Spain',
    amenityTags: ['palace', 'elegant', 'beach', 'restaurant'],
    photos: [
      'https://photos.hotelbeds.com/giata/xxl/00/000002/000002a_hb_a_087_20250822_085429.jpg',
      'https://photos.hotelbeds.com/giata/xxl/00/000002/000002a_hb_a_088_20250822_085429.jpg',
      'https://photos.hotelbeds.com/giata/xxl/00/000002/000002a_hb_p_001.jpg',
      'https://photos.hotelbeds.com/giata/xxl/00/000002/000002a_hb_ro_001.jpg'
    ],
    heroPhoto: 'https://photos.hotelbeds.com/giata/xxl/00/000002/000002a_hb_a_087_20250822_085429.jpg',
    priorityPhotos: {
      generalViews: [
        'https://photos.hotelbeds.com/giata/xxl/00/000002/000002a_hb_a_087_20250822_085429.jpg',
        'https://photos.hotelbeds.com/giata/xxl/00/000002/000002a_hb_a_088_20250822_085429.jpg'
      ],
      pools: ['https://photos.hotelbeds.com/giata/xxl/00/000002/000002a_hb_p_001.jpg'],
      rooms: ['https://photos.hotelbeds.com/giata/xxl/00/000002/000002a_hb_ro_001.jpg'],
      restaurants: [],
      others: []
    },
    price: { min: 450, max: 650, currency: 'USD' },
    bookingUrl: 'https://www.booking.com/searchresults.html?ss=htop%20Calella%20Palace%20Calella',
    source: 'hotelbeds-priority',
    photoQuality: 'XXL (2048px)'
  },
  {
    id: 'hotelbeds-3',
    name: 'HG Lomo Blanco',
    city: 'Fuerteventura',
    country: 'Spain',
    coords: { lat: 28.5000, lng: -13.8667 },
    rating: 4,
    description: 'Modern resort in Fuerteventura, Spain',
    amenityTags: ['resort', 'modern', 'beach', 'pool'],
    photos: [
      'https://photos.hotelbeds.com/giata/xxl/00/000005/000005a_hb_a_028.jpg',
      'https://photos.hotelbeds.com/giata/xxl/00/000005/000005a_hb_a_029.jpg',
      'https://photos.hotelbeds.com/giata/xxl/00/000005/000005a_hb_a_030.jpg',
      'https://photos.hotelbeds.com/giata/xxl/00/000005/000005a_hb_p_001.jpg',
      'https://photos.hotelbeds.com/giata/xxl/00/000005/000005a_hb_ro_001.jpg'
    ],
    heroPhoto: 'https://photos.hotelbeds.com/giata/xxl/00/000005/000005a_hb_a_028.jpg',
    priorityPhotos: {
      generalViews: [
        'https://photos.hotelbeds.com/giata/xxl/00/000005/000005a_hb_a_028.jpg',
        'https://photos.hotelbeds.com/giata/xxl/00/000005/000005a_hb_a_029.jpg',
        'https://photos.hotelbeds.com/giata/xxl/00/000005/000005a_hb_a_030.jpg'
      ],
      pools: ['https://photos.hotelbeds.com/giata/xxl/00/000005/000005a_hb_p_001.jpg'],
      rooms: ['https://photos.hotelbeds.com/giata/xxl/00/000005/000005a_hb_ro_001.jpg'],
      restaurants: [],
      others: []
    },
    price: { min: 350, max: 500, currency: 'USD' },
    bookingUrl: 'https://www.booking.com/searchresults.html?ss=HG%20Lomo%20Blanco%20Fuerteventura',
    source: 'hotelbeds-priority',
    photoQuality: 'XXL (2048px)'
  },
  {
    id: 'hotelbeds-4',
    name: 'Hotel Riu Palace Tenerife',
    city: 'Adeje',
    country: 'Spain',
    coords: { lat: 28.1000, lng: -16.7167 },
    rating: 5,
    description: 'Luxury palace resort in Tenerife, Spain',
    amenityTags: ['luxury', 'palace', 'resort', 'spa', 'beach'],
    photos: [
      'https://photos.hotelbeds.com/giata/xxl/00/000010/000010a_hb_a_001.jpg',
      'https://photos.hotelbeds.com/giata/xxl/00/000010/000010a_hb_a_002.jpg',
      'https://photos.hotelbeds.com/giata/xxl/00/000010/000010a_hb_a_003.jpg',
      'https://photos.hotelbeds.com/giata/xxl/00/000010/000010a_hb_p_001.jpg',
      'https://photos.hotelbeds.com/giata/xxl/00/000010/000010a_hb_ro_001.jpg',
      'https://photos.hotelbeds.com/giata/xxl/00/000010/000010a_hb_r_001.jpg'
    ],
    heroPhoto: 'https://photos.hotelbeds.com/giata/xxl/00/000010/000010a_hb_a_001.jpg',
    priorityPhotos: {
      generalViews: [
        'https://photos.hotelbeds.com/giata/xxl/00/000010/000010a_hb_a_001.jpg',
        'https://photos.hotelbeds.com/giata/xxl/00/000010/000010a_hb_a_002.jpg',
        'https://photos.hotelbeds.com/giata/xxl/00/000010/000010a_hb_a_003.jpg'
      ],
      pools: ['https://photos.hotelbeds.com/giata/xxl/00/000010/000010a_hb_p_001.jpg'],
      rooms: ['https://photos.hotelbeds.com/giata/xxl/00/000010/000010a_hb_ro_001.jpg'],
      restaurants: ['https://photos.hotelbeds.com/giata/xxl/00/000010/000010a_hb_r_001.jpg'],
      others: []
    },
    price: { min: 500, max: 800, currency: 'USD' },
    bookingUrl: 'https://www.booking.com/searchresults.html?ss=Hotel%20Riu%20Palace%20Tenerife%20Adeje',
    source: 'hotelbeds-priority',
    photoQuality: 'XXL (2048px)'
  },
  {
    id: 'hotelbeds-5',
    name: 'Melia Barcelona Sky',
    city: 'Barcelona',
    country: 'Spain',
    coords: { lat: 41.3851, lng: 2.1734 },
    rating: 4,
    description: 'Modern sky hotel in Barcelona, Spain',
    amenityTags: ['modern', 'sky', 'city', 'restaurant'],
    photos: [
      'https://photos.hotelbeds.com/giata/xxl/00/000015/000015a_hb_a_001.jpg',
      'https://photos.hotelbeds.com/giata/xxl/00/000015/000015a_hb_a_002.jpg',
      'https://photos.hotelbeds.com/giata/xxl/00/000015/000015a_hb_p_001.jpg',
      'https://photos.hotelbeds.com/giata/xxl/00/000015/000015a_hb_ro_001.jpg',
      'https://photos.hotelbeds.com/giata/xxl/00/000015/000015a_hb_r_001.jpg'
    ],
    heroPhoto: 'https://photos.hotelbeds.com/giata/xxl/00/000015/000015a_hb_a_001.jpg',
    priorityPhotos: {
      generalViews: [
        'https://photos.hotelbeds.com/giata/xxl/00/000015/000015a_hb_a_001.jpg',
        'https://photos.hotelbeds.com/giata/xxl/00/000015/000015a_hb_a_002.jpg'
      ],
      pools: ['https://photos.hotelbeds.com/giata/xxl/00/000015/000015a_hb_p_001.jpg'],
      rooms: ['https://photos.hotelbeds.com/giata/xxl/00/000015/000015a_hb_ro_001.jpg'],
      restaurants: ['https://photos.hotelbeds.com/giata/xxl/00/000015/000015a_hb_r_001.jpg'],
      others: []
    },
    price: { min: 300, max: 500, currency: 'USD' },
    bookingUrl: 'https://www.booking.com/searchresults.html?ss=Melia%20Barcelona%20Sky%20Barcelona',
    source: 'hotelbeds-priority',
    photoQuality: 'XXL (2048px)'
  },
  {
    id: 'hotelbeds-6',
    name: 'Iberostar Selection Playa de Palma',
    city: 'Palma',
    country: 'Spain',
    coords: { lat: 39.5696, lng: 2.6502 },
    rating: 4,
    description: 'Beachfront resort in Palma, Spain',
    amenityTags: ['beachfront', 'resort', 'beach', 'pool'],
    photos: [
      'https://photos.hotelbeds.com/giata/xxl/00/000020/000020a_hb_a_001.jpg',
      'https://photos.hotelbeds.com/giata/xxl/00/000020/000020a_hb_a_002.jpg',
      'https://photos.hotelbeds.com/giata/xxl/00/000020/000020a_hb_a_003.jpg',
      'https://photos.hotelbeds.com/giata/xxl/00/000020/000020a_hb_p_001.jpg',
      'https://photos.hotelbeds.com/giata/xxl/00/000020/000020a_hb_ro_001.jpg',
      'https://photos.hotelbeds.com/giata/xxl/00/000020/000020a_hb_r_001.jpg',
      'https://photos.hotelbeds.com/giata/xxl/00/000020/000020a_hb_s_001.jpg'
    ],
    heroPhoto: 'https://photos.hotelbeds.com/giata/xxl/00/000020/000020a_hb_a_001.jpg',
    priorityPhotos: {
      generalViews: [
        'https://photos.hotelbeds.com/giata/xxl/00/000020/000020a_hb_a_001.jpg',
        'https://photos.hotelbeds.com/giata/xxl/00/000020/000020a_hb_a_002.jpg',
        'https://photos.hotelbeds.com/giata/xxl/00/000020/000020a_hb_a_003.jpg'
      ],
      pools: ['https://photos.hotelbeds.com/giata/xxl/00/000020/000020a_hb_p_001.jpg'],
      rooms: ['https://photos.hotelbeds.com/giata/xxl/00/000020/000020a_hb_ro_001.jpg'],
      restaurants: ['https://photos.hotelbeds.com/giata/xxl/00/000020/000020a_hb_r_001.jpg'],
      others: ['https://photos.hotelbeds.com/giata/xxl/00/000020/000020a_hb_s_001.jpg']
    },
    price: { min: 400, max: 700, currency: 'USD' },
    bookingUrl: 'https://www.booking.com/searchresults.html?ss=Iberostar%20Selection%20Playa%20de%20Palma%20Palma',
    source: 'hotelbeds-priority',
    photoQuality: 'XXL (2048px)'
  },
  {
    id: 'hotelbeds-7',
    name: 'Hotel Arts Barcelona',
    city: 'Barcelona',
    country: 'Spain',
    coords: { lat: 41.3851, lng: 2.1734 },
    rating: 5,
    description: 'Luxury arts hotel in Barcelona, Spain',
    amenityTags: ['luxury', 'arts', 'city', 'spa', 'restaurant'],
    photos: [
      'https://photos.hotelbeds.com/giata/xxl/00/000025/000025a_hb_a_001.jpg',
      'https://photos.hotelbeds.com/giata/xxl/00/000025/000025a_hb_a_002.jpg',
      'https://photos.hotelbeds.com/giata/xxl/00/000025/000025a_hb_p_001.jpg',
      'https://photos.hotelbeds.com/giata/xxl/00/000025/000025a_hb_ro_001.jpg',
      'https://photos.hotelbeds.com/giata/xxl/00/000025/000025a_hb_r_001.jpg',
      'https://photos.hotelbeds.com/giata/xxl/00/000025/000025a_hb_s_001.jpg'
    ],
    heroPhoto: 'https://photos.hotelbeds.com/giata/xxl/00/000025/000025a_hb_a_001.jpg',
    priorityPhotos: {
      generalViews: [
        'https://photos.hotelbeds.com/giata/xxl/00/000025/000025a_hb_a_001.jpg',
        'https://photos.hotelbeds.com/giata/xxl/00/000025/000025a_hb_a_002.jpg'
      ],
      pools: ['https://photos.hotelbeds.com/giata/xxl/00/000025/000025a_hb_p_001.jpg'],
      rooms: ['https://photos.hotelbeds.com/giata/xxl/00/000025/000025a_hb_ro_001.jpg'],
      restaurants: ['https://photos.hotelbeds.com/giata/xxl/00/000025/000025a_hb_r_001.jpg'],
      others: ['https://photos.hotelbeds.com/giata/xxl/00/000025/000025a_hb_s_001.jpg']
    },
    price: { min: 600, max: 1000, currency: 'USD' },
    bookingUrl: 'https://www.booking.com/searchresults.html?ss=Hotel%20Arts%20Barcelona%20Barcelona',
    source: 'hotelbeds-priority',
    photoQuality: 'XXL (2048px)'
  },
  {
    id: 'hotelbeds-8',
    name: 'Gran Hotel Bahia del Duque',
    city: 'Costa Adeje',
    country: 'Spain',
    coords: { lat: 28.1000, lng: -16.7167 },
    rating: 5,
    description: 'Luxury beachfront resort in Costa Adeje, Spain',
    amenityTags: ['luxury', 'beachfront', 'resort', 'spa', 'beach'],
    photos: [
      'https://photos.hotelbeds.com/giata/xxl/00/000030/000030a_hb_a_001.jpg',
      'https://photos.hotelbeds.com/giata/xxl/00/000030/000030a_hb_a_002.jpg',
      'https://photos.hotelbeds.com/giata/xxl/00/000030/000030a_hb_a_003.jpg',
      'https://photos.hotelbeds.com/giata/xxl/00/000030/000030a_hb_p_001.jpg',
      'https://photos.hotelbeds.com/giata/xxl/00/000030/000030a_hb_ro_001.jpg',
      'https://photos.hotelbeds.com/giata/xxl/00/000030/000030a_hb_r_001.jpg',
      'https://photos.hotelbeds.com/giata/xxl/00/000030/000030a_hb_s_001.jpg'
    ],
    heroPhoto: 'https://photos.hotelbeds.com/giata/xxl/00/000030/000030a_hb_a_001.jpg',
    priorityPhotos: {
      generalViews: [
        'https://photos.hotelbeds.com/giata/xxl/00/000030/000030a_hb_a_001.jpg',
        'https://photos.hotelbeds.com/giata/xxl/00/000030/000030a_hb_a_002.jpg',
        'https://photos.hotelbeds.com/giata/xxl/00/000030/000030a_hb_a_003.jpg'
      ],
      pools: ['https://photos.hotelbeds.com/giata/xxl/00/000030/000030a_hb_p_001.jpg'],
      rooms: ['https://photos.hotelbeds.com/giata/xxl/00/000030/000030a_hb_ro_001.jpg'],
      restaurants: ['https://photos.hotelbeds.com/giata/xxl/00/000030/000030a_hb_r_001.jpg'],
      others: ['https://photos.hotelbeds.com/giata/xxl/00/000030/000030a_hb_s_001.jpg']
    },
    price: { min: 700, max: 1200, currency: 'USD' },
    bookingUrl: 'https://www.booking.com/searchresults.html?ss=Gran%20Hotel%20Bahia%20del%20Duque%20Costa%20Adeje',
    source: 'hotelbeds-priority',
    photoQuality: 'XXL (2048px)'
  }
];

// Middleware
app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Helper function to get hotels from Supabase
async function getSupabaseHotels(limit = 10, offset = 0) {
  try {
    console.log(`🏨 Fetching ${limit} hotels from Supabase (offset: ${offset})`);
    
    const { data, error } = await supabase
      .from('hotels')
      .select('*')
      .range(offset, offset + limit - 1);
    
    if (error) {
      console.error('❌ Supabase error:', error);
      return [];
    }
    
    console.log(`✅ Successfully fetched ${data.length} hotels from Supabase`);
    return data || [];
  } catch (error) {
    console.error('❌ Error fetching from Supabase:', error);
    return [];
  }
}

// Helper function to merge hotels with priority ordering
function mergeHotelsWithPriority(supabaseHotels, hotelbedsHotels, limit) {
  // Put Hotelbeds hotels first (they have priority photos)
  const priorityHotels = [...hotelbedsHotels];
  
  // Add Supabase hotels, avoiding duplicates
  const supabaseIds = new Set(hotelbedsHotels.map(h => h.id));
  const additionalHotels = supabaseHotels.filter(h => !supabaseIds.has(h.id));
  
  // Combine and limit
  const allHotels = [...priorityHotels, ...additionalHotels];
  const limitedHotels = allHotels.slice(0, limit);
  
  return {
    hotels: limitedHotels,
    total: allHotels.length,
    hasMore: allHotels.length > limit,
    source: 'hybrid-hotelbeds-supabase',
    priorityPhotos: true,
    photoQuality: 'Mixed (XXL + Unsplash)',
    generalViewsFirst: true,
    hotelbedsCount: priorityHotels.length,
    supabaseCount: additionalHotels.length
  };
}

// Routes
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    source: 'hybrid-hotelbeds-supabase',
    priorityPhotos: true,
    photoQuality: 'Mixed (XXL + Unsplash)',
    generalViewsFirst: true,
    hotelbedsHotels: hotelbedsHotels.length,
    totalAvailable: '1169+ hotels'
  });
});

app.get('/api/hotels', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
    
    console.log(`🏨 Fetching hotels: limit=${limit}, offset=${offset}`);
    
    // Get hotels from Supabase
    const supabaseHotels = await getSupabaseHotels(limit + hotelbedsHotels.length, offset);
    
    // Merge with Hotelbeds hotels (priority first)
    const result = mergeHotelsWithPriority(supabaseHotels, hotelbedsHotels, limit);
    
    console.log(`✅ Returning ${result.hotels.length} hotels (${result.hotelbedsCount} Hotelbeds + ${result.supabaseCount} Supabase)`);
    res.json(result);
    
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/hotels/:id', async (req, res) => {
  try {
    const hotelId = req.params.id;
    
    // Check Hotelbeds hotels first
    const hotelbedsHotel = hotelbedsHotels.find(h => h.id === hotelId);
    if (hotelbedsHotel) {
      console.log(`✅ Found Hotelbeds hotel: ${hotelbedsHotel.name}`);
      return res.json({
        hotel: hotelbedsHotel,
        source: 'hotelbeds-priority',
        photoQuality: 'XXL (2048px)',
        priorityPhotos: true
      });
    }
    
    // Check Supabase
    const { data, error } = await supabase
      .from('hotels')
      .select('*')
      .eq('id', hotelId)
      .single();
    
    if (error || !data) {
      return res.status(404).json({ error: 'Hotel not found' });
    }
    
    console.log(`✅ Found Supabase hotel: ${data.name}`);
    res.json({
      hotel: data,
      source: 'supabase',
      photoQuality: 'Unsplash',
      priorityPhotos: false
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Hybrid Hotelbeds-Supabase Server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🏨 Hotels endpoint: http://localhost:${PORT}/api/hotels`);
  console.log(`🎯 Features:`);
  console.log(`   ✅ ${hotelbedsHotels.length} Hotelbeds hotels with priority photos (4-5 stars)`);
  console.log(`   ✅ 1169+ Supabase hotels as fallback`);
  console.log(`   ✅ General views displayed FIRST`);
  console.log(`   ✅ XXL quality photos (2048px) for Hotelbeds hotels`);
  console.log(`   ✅ Hybrid system with priority ordering`);
});

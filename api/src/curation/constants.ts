// Glintz Hotel Curation Constants
// Visual-first, boutique hotel filtering and scoring

export const BLACKLIST_CHAINS = [
  // Economy chains - must exclude
  'IB', // Ibis
  'BW', // Best Western
  'HI', // Holiday Inn
  'EH', // Extended Stay Hotels
  'CI', // Comfort Inn
  'DI', // Days Inn
  'S8', // Super 8
  'M6', // Motel 6
  'RR', // Red Roof Inn
  'LQ', // La Quinta
  'HM', // Hampton Inn
  'CY', // Courtyard by Marriott
  'FI', // Fairfield Inn
  'RI', // Residence Inn
  'HS', // Homewood Suites
  'CW', // Candlewood Suites
  'CP', // Crowne Plaza
  'DT', // DoubleTree
  'ES', // Embassy Suites
  'TL', // Travelodge
  'PI', // Premier Inn
];

export const PREMIUM_CHAINS = [
  // Ultra-luxury brands - highest score
  'RC', // Ritz Carlton
  'FS', // Four Seasons
  'MO', // Mandarin Oriental
  'SR', // St. Regis
  'AK', // Aman Hotels
  'RW', // Rosewood
  'BU', // Bulgari
  'AR', // Armani
  'ED', // Edition
  'PH', // Park Hyatt
  'GH', // Grand Hyatt
  'WA', // Waldorf Astoria
  'LX', // Luxury Collection
];

export const BOUTIQUE_PROGRAMS = [
  // Boutique luxury collections - medium-high score
  'AC', // Autograph Collection
  'CU', // Curio Collection
  'TP', // Tribute Portfolio
  'UC', // Unbound Collection
  'RH', // Relais & Chateaux
  'SL', // Small Luxury Hotels
  'LH', // Leading Hotels
  'PH', // Preferred Hotels
  'DH', // Design Hotels
  'MG', // MGallery
  'SO', // Sofitel
  'PU', // Pullman
  'KE', // Kempinski
  'OB', // Oberoi
  'TJ', // Taj Hotels
];

export const WOW_AMENITY_CODES = [
  // Water & Views - highest visual appeal
  'BEACH',
  'POOL',
  'OUTDOOR_POOL',
  'INDOOR_POOL',
  'SWIMMING_POOL',
  'HOT_TUB',
  'WHIRLPOOL',
  'JACUZZI',
  'BALCONY',
  
  // Wellness & Spa
  'SPA',
  'SAUNA',
  'STEAM_ROOM',
  'HEALTH_CLUB',
  'MASSAGE',
  'EXERCISE_GYM',
  
  // Luxury Services
  'VALET_PARKING',
  'ROOM_SERVICE',
  'RESTAURANT',
  'LOUNGE',
  'GOLF',
  'TENNIS',
  
  // Premium Amenities
  'ALL_INCLUSIVE',
  'MINIBAR',
  'TWENTY_FOUR_HOUR_FRONT_DESK',
];

export const DESCRIPTION_KEYWORDS = {
  // Design & Heritage
  design: [
    'design', 'boutique', 'contemporary', 'modern', 'architectural',
    'heritage', 'historic', 'palace', 'castle', 'manor', 'villa',
    'cave', 'monastery', 'converted', 'restored', 'colonial',
    'art deco', 'minimalist', 'luxury collection', 'curated'
  ],
  
  // Views & Locations
  views: [
    'infinity', 'rooftop', 'sea view', 'ocean view', 'oceanfront',
    'beachfront', 'lakefront', 'lake view', 'mountain view',
    'cliff', 'clifftop', 'caldera', 'panoramic', 'scenic',
    'waterfront', 'harbor view', 'sunset', 'sunrise'
  ],
  
  // Romance & Adults
  romance: [
    'adults only', 'adults-only', 'honeymoon', 'romantic',
    'intimate', 'couples', 'private', 'secluded', 'exclusive'
  ],
  
  // Nature & Unique Locations
  nature: [
    'vineyard', 'winery', 'mountain', 'forest', 'jungle',
    'desert', 'safari', 'island', 'tropical', 'eco',
    'sustainable', 'organic', 'farm', 'ranch', 'retreat'
  ],
  
  // Luxury Indicators
  luxury: [
    'michelin', 'fine dining', 'gourmet', 'butler', 'concierge',
    'helicopter', 'yacht', 'private jet', 'limousine',
    'champagne', 'caviar', 'truffle', 'sommelier'
  ]
};

export const TOP_INSPO_CITIES = [
  // Europe - Mediterranean & Iconic
  'santorini', 'mykonos', 'amalfi', 'positano', 'capri', 'ibiza',
  'florence', 'rome', 'venice', 'paris', 'barcelona', 'dubrovnik',
  
  // Asia - Tropical & Cultural
  'bali', 'phuket', 'maldives', 'kyoto', 'tokyo', 'singapore',
  'langkawi', 'boracay', 'koh samui', 'mumbai', 'goa',
  
  // Americas - Luxury Destinations
  'hawaii', 'maui', 'napa', 'aspen', 'miami', 'cartagena',
  'rio de janeiro', 'buenos aires', 'costa rica', 'tulum',
  
  // Africa & Middle East - Safari & Desert
  'cape town', 'marrakech', 'serengeti', 'dubai', 'seychelles',
  'mauritius', 'zanzibar', 'cairo', 'istanbul',
  
  // Oceania - Natural Beauty
  'sydney', 'queenstown', 'fiji', 'tahiti', 'bora bora'
];

export const HOTEL_CATEGORIES = [
  'Beach/Island',
  'Infinity & Rooftop', 
  'Design/Heritage',
  'Wellness',
  'Scenic Nature',
  'City View',
  'Villas/Suites'
];

export const SCORING_WEIGHTS = {
  visual: 0.35,
  amenity: 0.25,
  brand: 0.15,
  location: 0.15,
  rating: 0.10,
  price: 0.10 // penalty weight
};

export const SCORING_THRESHOLDS = {
  minScore: 0.55,
  minPhotos: 3,
  minRating: 4.0,
  maxPrice: 2000,
  minQualityRating: 3.0
};

export const BRAND_KEYWORDS = {
  premium: [
    'ritz carlton', 'four seasons', 'mandarin oriental', 'st regis', 'st. regis',
    'aman', 'rosewood', 'bulgari', 'armani', 'edition', 'park hyatt',
    'grand hyatt', 'waldorf astoria', 'luxury collection'
  ],
  
  boutique: [
    'autograph collection', 'curio collection', 'tribute portfolio',
    'unbound collection', 'relais & chateaux', 'small luxury hotels',
    'leading hotels', 'preferred hotels', 'design hotels',
    'mgallery', 'sofitel', 'pullman', 'kempinski', 'oberoi', 'taj'
  ],
  
  blacklist: [
    'ibis', 'best western', 'holiday inn', 'comfort inn', 'days inn',
    'super 8', 'motel 6', 'red roof', 'la quinta', 'hampton inn',
    'courtyard', 'fairfield inn', 'residence inn', 'extended stay',
    'homewood suites', 'candlewood suites', 'crowne plaza',
    'doubletree', 'embassy suites', 'travelodge', 'premier inn'
  ]
};

export const PHOTO_CATEGORIES = [
  'EXTERIOR',
  'ROOM', 
  'SUITE',
  'LOBBY',
  'RESTAURANT',
  'POOL',
  'SPA',
  'BEACH',
  'VIEW'
];

export const AMENITY_SCORES = {
  // Water & Views - highest appeal
  beach: 0.5,
  infinity: 0.5,
  rooftop: 0.5,
  
  // Wellness
  spa: 0.3,
  sauna: 0.3,
  steam: 0.3,
  
  // Design & Heritage
  design: 0.3,
  heritage: 0.3,
  boutique: 0.3,
  
  // Romance
  adults: 0.2,
  private: 0.2,
  
  // Nature
  nature: 0.2,
  eco: 0.2
};

export const LOCATION_SCORES = {
  beach: 0.5,
  mountain: 0.3,
  lake: 0.3,
  cliff: 0.3,
  city: 0.2,
  vineyard: 0.2
}; 
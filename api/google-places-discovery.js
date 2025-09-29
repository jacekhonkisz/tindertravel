const axios = require('axios');

class GooglePlacesDiscovery {
  constructor() {
    this.apiBase = 'http://localhost:3001/api';
    this.discoveryStrategies = [
      {
        name: 'Luxury Hotel Brands',
        searchTerms: [
          'Four Seasons hotel', 'Ritz Carlton hotel', 'St Regis hotel', 'Park Hyatt hotel',
          'Aman resort', 'Belmond hotel', 'Rosewood hotel', 'Mandarin Oriental hotel',
          'Shangri-La hotel', 'Conrad hotel', 'W Hotel luxury', 'Le Meridien hotel'
        ]
      },
      {
        name: 'Unique Properties',
        searchTerms: [
          'overwater villa resort', 'treehouse hotel', 'cave hotel', 'ice hotel',
          'desert camp luxury', 'safari lodge', 'castle hotel', 'boutique hotel unique'
        ]
      },
      {
        name: 'Exotic Destinations',
        searchTerms: [
          'Bhutan luxury hotel', 'Madagascar resort', 'Faroe Islands hotel',
          'Easter Island hotel', 'Azores luxury resort', 'Lofoten Islands hotel',
          'Svalbard hotel', 'Greenland hotel', 'Papua New Guinea resort',
          'Solomon Islands hotel', 'Vanuatu resort', 'Mongolia luxury camp'
        ]
      },
      {
        name: 'Hidden Gems',
        searchTerms: [
          'Salar de Uyuni hotel', 'Zhangye Danxia hotel', 'Marble Caves Chile hotel',
          'Antelope Canyon hotel', 'Glowworm Caves hotel', 'Raja Ampat resort',
          'Chocolate Hills Bohol hotel', 'Kawah Ijen hotel', 'Pink Lake hotel'
        ]
      },
      {
        name: 'UNESCO Wonders',
        searchTerms: [
          'Machu Picchu hotel', 'Angkor Wat luxury hotel', 'Petra resort Jordan',
          'Taj Mahal hotel Agra', 'Great Wall hotel China', 'Galapagos cruise hotel',
          'Amazon lodge luxury', 'Victoria Falls hotel', 'Iguazu Falls resort',
          'Northern Lights hotel', 'Aurora Borealis lodge', 'Serengeti safari lodge'
        ]
      },
      {
        name: 'Island Paradises',
        searchTerms: [
          'Maldives resort', 'Seychelles hotel', 'Bora Bora resort', 'Fiji resort',
          'Cook Islands hotel', 'Palau resort', 'Marshall Islands hotel',
          'Kiribati hotel', 'Tuvalu hotel', 'Tristan da Cunha hotel'
        ]
      }
    ];
  }

  async discoverHotels(targetCount = 1000) {
    console.log(`🌍 Starting Google Places Hotel Discovery`);
    console.log(`🎯 Target: ${targetCount} exceptional hotels worldwide`);
    console.log(`🔍 Using ${this.discoveryStrategies.length} discovery strategies\n`);

    let currentCount = 0;
    const discoveredHotels = [];

    for (const strategy of this.discoveryStrategies) {
      if (currentCount >= targetCount) break;
      
      console.log(`🔍 Strategy: ${strategy.name}`);
      
      for (const searchTerm of strategy.searchTerms) {
        if (currentCount >= targetCount) break;
        
        try {
          console.log(`🏨 Searching: "${searchTerm}"`);
          
          // Use the existing Google Places search endpoint
          const response = await axios.get(`${this.apiBase}/google-places/search`, {
            params: {
              query: searchTerm,
              limit: 10
            }
          });
          
          if (response.data.success && response.data.hotels) {
            const hotels = response.data.hotels;
            
            for (const hotel of hotels) {
              if (currentCount >= targetCount) break;
              
              // Validate hotel quality
              if (this.isQualityHotel(hotel)) {
                discoveredHotels.push({
                  ...hotel,
                  discoveredBy: searchTerm,
                  strategy: strategy.name
                });
                
                currentCount++;
                console.log(`✅ Added: ${hotel.name} (${hotel.address})`);
                console.log(`📊 Progress: ${currentCount}/${targetCount}\n`);
              }
            }
          }
          
          // Rate limiting
          await this.sleep(1000);
          
        } catch (error) {
          console.error(`❌ Error searching "${searchTerm}":`, error.message);
        }
      }
    }

    console.log(`\n🎉 Discovery Complete!`);
    console.log(`📊 Total Hotels Found: ${currentCount}`);
    console.log(`��️  Strategies Used: ${this.discoveryStrategies.length}`);
    
    // Show sample results
    console.log(`\n🌟 Sample Discoveries:`);
    discoveredHotels.slice(0, 10).forEach((hotel, i) => {
      console.log(`${i + 1}. ${hotel.name} - ${hotel.address} (via ${hotel.strategy})`);
    });

    return discoveredHotels;
  }

  isQualityHotel(hotel) {
    // Check rating
    if (hotel.rating && hotel.rating < 4.0) return false;
    
    // Check if has photos
    if (!hotel.photos || hotel.photos.length < 4) return false;
    
    // Check for luxury indicators
    const luxuryKeywords = [
      'luxury', 'resort', 'spa', 'boutique', 'palace', 'manor', 'villa',
      'retreat', 'lodge', 'collection', 'heritage', 'premium', 'exclusive',
      'private', 'royal', 'grand', 'deluxe', 'ritz', 'four seasons'
    ];
    
    const nameAndAddress = `${hotel.name} ${hotel.address}`.toLowerCase();
    return luxuryKeywords.some(keyword => nameAndAddress.includes(keyword));
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the discovery
async function runDiscovery() {
  const discovery = new GooglePlacesDiscovery();
  try {
    await discovery.discoverHotels(1000);
  } catch (error) {
    console.error('❌ Discovery failed:', error.message);
  }
}

runDiscovery();

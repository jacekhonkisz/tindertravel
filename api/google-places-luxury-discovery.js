const axios = require('axios');

class GooglePlacesLuxuryDiscovery {
  constructor() {
    this.apiBase = 'http://localhost:3001/api';
    
    // Target destinations based on our gap analysis
    this.targetDestinations = [
      // CRITICAL URBAN LUXURY GAPS
      {
        name: 'New York City',
        country: 'United States',
        type: 'urban',
        priority: 'critical',
        targetHotels: 20,
        searchTerms: [
          'luxury hotel Manhattan New York',
          'boutique hotel NYC Manhattan',
          'five star hotel New York City',
          'premium hotel Manhattan NYC',
          'exclusive hotel New York Manhattan',
          'luxury boutique hotel NYC',
          'high end hotel Manhattan',
          'designer hotel New York'
        ]
      },
      {
        name: 'London',
        country: 'United Kingdom',
        type: 'urban',
        priority: 'critical',
        targetHotels: 20,
        searchTerms: [
          'luxury hotel London Mayfair',
          'boutique hotel London Knightsbridge',
          'five star hotel London',
          'premium hotel London Covent Garden',
          'exclusive hotel London',
          'luxury boutique hotel London',
          'high end hotel London',
          'designer hotel London'
        ]
      },
      {
        name: 'Paris',
        country: 'France',
        type: 'urban',
        priority: 'critical',
        targetHotels: 20,
        searchTerms: [
          'luxury hotel Paris Champs Elysees',
          'boutique hotel Paris Saint Germain',
          'five star hotel Paris',
          'premium hotel Paris Marais',
          'exclusive hotel Paris',
          'luxury boutique hotel Paris',
          'high end hotel Paris',
          'designer hotel Paris'
        ]
      },
      {
        name: 'Singapore',
        country: 'Singapore',
        type: 'urban',
        priority: 'critical',
        targetHotels: 15,
        searchTerms: [
          'luxury hotel Singapore Marina Bay',
          'boutique hotel Singapore',
          'five star hotel Singapore',
          'premium hotel Singapore Orchard Road',
          'exclusive hotel Singapore',
          'luxury boutique hotel Singapore',
          'high end hotel Singapore'
        ]
      },
      {
        name: 'St. Moritz',
        country: 'Switzerland',
        type: 'alpine',
        priority: 'critical',
        targetHotels: 15,
        searchTerms: [
          'luxury hotel St Moritz Switzerland',
          'boutique ski resort St Moritz',
          'five star alpine hotel St Moritz',
          'premium mountain resort St Moritz',
          'exclusive ski hotel St Moritz',
          'luxury chalet St Moritz'
        ]
      },
      {
        name: 'St. Barts',
        country: 'Saint Barthélemy',
        type: 'caribbean',
        priority: 'critical',
        targetHotels: 15,
        searchTerms: [
          'luxury hotel St Barts Caribbean',
          'boutique resort St Barts',
          'five star villa St Barts',
          'premium beach resort St Barts',
          'exclusive Caribbean St Barts',
          'luxury villa St Barts'
        ]
      },
      // UNDER-REPRESENTED EXPANSIONS
      {
        name: 'Rome',
        country: 'Italy',
        type: 'urban',
        priority: 'high',
        targetHotels: 12,
        searchTerms: [
          'luxury hotel Rome Italy',
          'boutique palazzo Rome',
          'five star historic hotel Rome',
          'premium villa Rome',
          'exclusive hotel Rome',
          'luxury boutique hotel Rome'
        ]
      },
      {
        name: 'Tokyo',
        country: 'Japan',
        type: 'urban',
        priority: 'high',
        targetHotels: 12,
        searchTerms: [
          'luxury hotel Tokyo Japan',
          'boutique ryokan Tokyo',
          'five star hotel Tokyo',
          'premium modern hotel Tokyo',
          'exclusive traditional hotel Tokyo',
          'luxury boutique hotel Tokyo'
        ]
      },
      {
        name: 'Dubai',
        country: 'UAE',
        type: 'urban',
        priority: 'high',
        targetHotels: 12,
        searchTerms: [
          'luxury hotel Dubai UAE',
          'boutique hotel Dubai Marina',
          'five star hotel Burj Dubai',
          'premium Palm Jumeirah hotel',
          'exclusive desert resort Dubai',
          'luxury boutique hotel Dubai'
        ]
      }
    ];
  }

  async discoverLuxuryHotels() {
    console.log('🎯 Starting Google Places Luxury Discovery');
    console.log(`📍 Targeting ${this.targetDestinations.length} under-represented destinations`);
    console.log('🏨 Focus: Beautiful, luxurious, boutique properties only\n');

    let totalFound = 0;
    let totalProcessed = 0;
    let totalStored = 0;

    for (const destination of this.targetDestinations) {
      console.log(`\n🔍 Processing: ${destination.name}, ${destination.country}`);
      console.log(`🎯 Priority: ${destination.priority.toUpperCase()}`);
      console.log(`📊 Target: ${destination.targetHotels} hotels`);
      console.log(`🏷️  Type: ${destination.type}`);

      let destinationHotels = [];

      for (const searchTerm of destination.searchTerms) {
        try {
          console.log(`   🔍 "${searchTerm}"`);
          
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
              // Validate hotel quality
              if (this.isLuxuryHotel(hotel, destination)) {
                destinationHotels.push({
                  ...hotel,
                  discoveredBy: searchTerm,
                  destination: destination.name,
                  country: destination.country,
                  type: destination.type
                });
                
                console.log(`      ✅ ${hotel.name} (${hotel.rating}⭐, ${hotel.photos?.length || 0} photos)`);
              } else {
                console.log(`      ❌ ${hotel.name} - Not luxury/insufficient photos`);
              }
            }
          }
          
          // Rate limiting
          await this.sleep(1000);
          
        } catch (error) {
          console.error(`   ❌ Error searching "${searchTerm}":`, error.message);
        }
      }

      // Remove duplicates
      const uniqueHotels = this.removeDuplicates(destinationHotels);
      
      console.log(`\n📊 ${destination.name} Results:`);
      console.log(`   Found: ${destinationHotels.length} hotels`);
      console.log(`   Unique: ${uniqueHotels.length} hotels`);
      console.log(`   Target: ${destination.targetHotels} hotels`);
      
      totalFound += uniqueHotels.length;
      totalProcessed++;
      
      // Here you would store the hotels to database
      // For now, just count them
      totalStored += uniqueHotels.length;
      
      console.log(`   ✅ Would store: ${uniqueHotels.length} luxury hotels`);
    }

    console.log(`\n🎉 Discovery Complete!`);
    console.log(`📊 Final Results:`);
    console.log(`   Destinations Processed: ${totalProcessed}`);
    console.log(`   Total Hotels Found: ${totalFound}`);
    console.log(`   Total Hotels to Store: ${totalStored}`);
    
    return {
      destinationsProcessed: totalProcessed,
      hotelsFound: totalFound,
      hotelsToStore: totalStored
    };
  }

  isLuxuryHotel(hotel, destination) {
    // Check rating (minimum 4.0 for luxury)
    if (hotel.rating && hotel.rating < 4.0) return false;
    
    // Check if has minimum 4 photos
    if (!hotel.photos || hotel.photos.length < 4) return false;
    
    // Check for luxury indicators in name
    const luxuryKeywords = [
      'luxury', 'boutique', 'five star', 'premium', 'exclusive', 
      'resort', 'spa', 'palace', 'manor', 'villa', 'heritage', 
      'collection', 'royal', 'grand', 'deluxe', 'ritz', 'four seasons',
      'mandarin', 'shangri', 'conrad', 'hyatt', 'marriott', 'hilton'
    ];
    
    const nameAndAddress = `${hotel.name} ${hotel.address || ''}`.toLowerCase();
    const hasLuxuryKeywords = luxuryKeywords.some(keyword => 
      nameAndAddress.includes(keyword)
    );
    
    // Check price level (should be high-end for Google Places)
    const hasHighPriceLevel = !hotel.priceLevel || hotel.priceLevel >= 3;
    
    return hasLuxuryKeywords && hasHighPriceLevel;
  }

  removeDuplicates(hotels) {
    const seen = new Set();
    return hotels.filter(hotel => {
      const key = `${hotel.name}_${hotel.address}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the discovery
async function runLuxuryDiscovery() {
  console.log('🎯 TARGETED LUXURY HOTEL DISCOVERY');
  console.log('==================================\n');
  
  console.log('📋 DISCOVERY CRITERIA:');
  console.log('✅ Beautiful, luxurious, boutique properties ONLY');
  console.log('✅ Minimum 4 high-quality photos');
  console.log('✅ Rating 4.0+ stars');
  console.log('✅ Google Places luxury search');
  console.log('✅ Focus on under-represented destinations\n');
  
  const discovery = new GooglePlacesLuxuryDiscovery();
  
  try {
    const results = await discovery.discoverLuxuryHotels();
    console.log('\n🎉 SUCCESS! Luxury discovery completed.');
    
  } catch (error) {
    console.error('❌ Discovery failed:', error.message);
  }
}

runLuxuryDiscovery();

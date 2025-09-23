// Enhanced Hotel Data Generator
// Generates realistic amenities and longer descriptions based on hotel characteristics

export interface HotelCharacteristics {
  name: string;
  city: string;
  country: string;
  chainCode?: string;
  priceRange?: { min: number; max: number; currency: string };
  category?: 'luxury' | 'boutique' | 'business' | 'resort' | 'urban' | 'heritage';
  location?: 'beachfront' | 'city-center' | 'airport' | 'mountain' | 'countryside';
}

export interface EnhancedHotelData {
  amenityTags: string[];
  description: string;
  highlights: string[];
  nearbyAttractions: string[];
}

export class EnhancedHotelGenerator {
  
  /**
   * Generate comprehensive hotel data based on characteristics
   */
  generateEnhancedData(characteristics: HotelCharacteristics): EnhancedHotelData {
    const category = this.inferCategory(characteristics);
    const location = this.inferLocation(characteristics);
    
    return {
      amenityTags: this.generateAmenities(category, location, characteristics),
      description: this.generateLongDescription(characteristics, category, location),
      highlights: this.generateHighlights(characteristics, category),
      nearbyAttractions: this.generateNearbyAttractions(characteristics.city, characteristics.country)
    };
  }

  /**
   * Infer hotel category from name and chain code
   */
  private inferCategory(characteristics: HotelCharacteristics): string {
    const name = characteristics.name.toLowerCase();
    const chainCode = characteristics.chainCode?.toLowerCase() || '';
    
    // Luxury indicators
    if (name.includes('four seasons') || name.includes('ritz') || name.includes('st. regis') ||
        name.includes('mandarin') || name.includes('peninsula') || name.includes('aman') ||
        chainCode === 'fs' || chainCode === 'rc' || chainCode === 'lx') {
      return 'luxury';
    }
    
    // Boutique indicators
    if (name.includes('boutique') || name.includes('design') || name.includes('collection') ||
        name.includes('autograph') || name.includes('curio')) {
      return 'boutique';
    }
    
    // Resort indicators
    if (name.includes('resort') || name.includes('spa') || name.includes('beach') ||
        name.includes('island') || name.includes('club')) {
      return 'resort';
    }
    
    // Business indicators
    if (name.includes('marriott') || name.includes('hilton') || name.includes('hyatt') ||
        name.includes('sheraton') || chainCode === 'mc' || chainCode === 'hi') {
      return 'business';
    }
    
    // Heritage indicators
    if (name.includes('historic') || name.includes('heritage') || name.includes('palace') ||
        name.includes('grand') || name.includes('royal')) {
      return 'heritage';
    }
    
    return 'urban';
  }

  /**
   * Infer location type from city and hotel name
   */
  private inferLocation(characteristics: HotelCharacteristics): string {
    const name = characteristics.name.toLowerCase();
    const city = characteristics.city.toLowerCase();
    
    if (name.includes('beach') || name.includes('ocean') || name.includes('sea') ||
        name.includes('island') || name.includes('bay')) {
      return 'beachfront';
    }
    
    if (name.includes('airport') || name.includes('terminal')) {
      return 'airport';
    }
    
    if (name.includes('mountain') || name.includes('alpine') || name.includes('ski') ||
        city.includes('aspen') || city.includes('zermatt') || city.includes('chamonix')) {
      return 'mountain';
    }
    
    if (name.includes('park') || name.includes('garden') || name.includes('countryside')) {
      return 'countryside';
    }
    
    return 'city-center';
  }

  /**
   * Generate realistic amenities based on category and location
   */
  private generateAmenities(category: string, location: string, characteristics: HotelCharacteristics): string[] {
    const baseAmenities = ['wifi', 'concierge', '24-hour-reception'];
    
    const categoryAmenities = {
      luxury: ['spa-sanctuary', 'michelin-dining', 'butler-service', 'private-pool', 'wine-cellar', 'golf-course'],
      boutique: ['design-hotel', 'artisan-dining', 'rooftop-bar', 'local-experiences', 'unique-design'],
      business: ['business-center', 'meeting-rooms', 'fitness-center', 'restaurant', 'bar', 'parking'],
      resort: ['multiple-pools', 'spa', 'beach-access', 'water-sports', 'kids-club', 'tennis-court'],
      heritage: ['historic-building', 'heritage-rooms', 'traditional-dining', 'cultural-tours', 'antique-furnishing'],
      urban: ['city-views', 'restaurant', 'fitness-center', 'business-facilities', 'parking']
    };
    
    const locationAmenities = {
      beachfront: ['private-beach', 'beach-club', 'water-sports', 'sunset-views', 'beach-bar'],
      'city-center': ['city-views', 'shopping-nearby', 'cultural-attractions', 'public-transport'],
      airport: ['airport-shuttle', 'express-checkin', 'business-lounge', 'parking'],
      mountain: ['mountain-views', 'ski-access', 'hiking-trails', 'fireplace', 'alpine-spa'],
      countryside: ['garden-views', 'nature-walks', 'peaceful-setting', 'local-cuisine']
    };
    
    const chainSpecificAmenities = {
      'mc': ['marriott-rewards', 'executive-lounge', 'premium-bedding'],
      'hi': ['hilton-honors', 'digital-key', 'fitness-center'],
      'hy': ['world-of-hyatt', 'grand-club', 'spa-services'],
      'fs': ['four-seasons-service', 'luxury-spa', 'fine-dining'],
      'rc': ['ritz-carlton-service', 'club-level', 'luxury-amenities']
    };
    
    let amenities = [...baseAmenities];
    
    // Add category-specific amenities
    if (categoryAmenities[category as keyof typeof categoryAmenities]) {
      amenities.push(...categoryAmenities[category as keyof typeof categoryAmenities].slice(0, 4));
    }
    
    // Add location-specific amenities
    if (locationAmenities[location as keyof typeof locationAmenities]) {
      amenities.push(...locationAmenities[location as keyof typeof locationAmenities].slice(0, 3));
    }
    
    // Add chain-specific amenities
    if (characteristics.chainCode && chainSpecificAmenities[characteristics.chainCode.toLowerCase() as keyof typeof chainSpecificAmenities]) {
      amenities.push(...chainSpecificAmenities[characteristics.chainCode.toLowerCase() as keyof typeof chainSpecificAmenities].slice(0, 2));
    }
    
    // Remove duplicates and limit to 8 amenities
    return [...new Set(amenities)].slice(0, 8);
  }

  /**
   * Generate long, detailed description (2-3x longer than current)
   */
  private generateLongDescription(characteristics: HotelCharacteristics, category: string, location: string): string {
    const { name, city, country } = characteristics;
    
    const introTemplates = {
      luxury: `Experience unparalleled luxury at ${name}, an exquisite ${category} hotel nestled in the heart of ${city}, ${country}.`,
      boutique: `Discover the unique charm of ${name}, a distinctive ${category} hotel that captures the essence of ${city}, ${country}.`,
      business: `${name} offers sophisticated accommodations and world-class business facilities in ${city}, ${country}.`,
      resort: `Escape to ${name}, a stunning ${category} destination that showcases the natural beauty of ${city}, ${country}.`,
      heritage: `Step into history at ${name}, a magnificent ${category} hotel that preserves the cultural heritage of ${city}, ${country}.`,
      urban: `${name} provides contemporary comfort and convenience in the vibrant city of ${city}, ${country}.`
    };
    
    const locationDescriptions = {
      beachfront: `With direct access to pristine beaches and breathtaking ocean views, guests can enjoy water sports, beachside dining, and spectacular sunsets. The hotel's beachfront location offers the perfect blend of relaxation and adventure.`,
      'city-center': `Located in the bustling city center, guests have easy access to major attractions, shopping districts, and cultural landmarks. The hotel serves as an ideal base for exploring the rich history and vibrant culture of the area.`,
      airport: `Strategically positioned near the airport, this hotel offers unmatched convenience for business and leisure travelers. Despite its proximity to transportation hubs, guests enjoy a peaceful retreat with soundproof rooms and premium amenities.`,
      mountain: `Surrounded by majestic mountains and pristine nature, the hotel offers breathtaking alpine views and access to outdoor activities. Guests can enjoy hiking trails, ski slopes, and the tranquil beauty of the mountain landscape.`,
      countryside: `Set amidst rolling hills and peaceful countryside, this hotel provides a serene escape from urban life. Guests can explore local vineyards, enjoy farm-to-table dining, and experience the authentic charm of rural hospitality.`
    };
    
    const amenityDescriptions = {
      luxury: `The hotel features world-class amenities including a luxury spa sanctuary, Michelin-starred dining, private pools, and personalized butler service. Every detail has been carefully crafted to exceed the expectations of discerning travelers.`,
      boutique: `Thoughtfully designed spaces showcase local artistry and culture, while the hotel's restaurant serves innovative cuisine using locally-sourced ingredients. Each room is uniquely decorated, offering guests an authentic and memorable experience.`,
      business: `Professional facilities include state-of-the-art meeting rooms, a fully-equipped business center, and high-speed internet throughout the property. The hotel's executive floors offer additional privacy and exclusive amenities for business travelers.`,
      resort: `Resort amenities include multiple swimming pools, a full-service spa, championship golf course, and various recreational activities. Families will appreciate the kids' club and teen programs, while adults can enjoy the adults-only pool area.`,
      heritage: `The hotel preserves its historical architecture while offering modern comforts. Guests can dine in restored heritage rooms, explore the hotel's museum, and participate in cultural tours that showcase the property's rich history.`,
      urban: `Modern amenities include a rooftop fitness center with city views, contemporary dining options, and flexible meeting spaces. The hotel's design reflects the dynamic energy of the city while providing a comfortable retreat.`
    };
    
    const closingTemplates = {
      luxury: `Whether visiting for business or leisure, ${name} promises an unforgettable experience where luxury meets exceptional service, creating memories that will last a lifetime.`,
      boutique: `At ${name}, every stay is a unique journey that celebrates local culture, artistic expression, and personalized hospitality in an intimate and stylish setting.`,
      business: `${name} combines professional excellence with comfortable accommodations, ensuring that both business and leisure travelers enjoy a productive and relaxing stay.`,
      resort: `From sunrise to sunset, ${name} offers endless opportunities for relaxation, adventure, and creating cherished memories with family and friends.`,
      heritage: `Experience the perfect harmony of historical grandeur and modern luxury at ${name}, where every guest becomes part of the hotel's continuing story.`,
      urban: `${name} stands as a beacon of contemporary hospitality, offering guests a sophisticated urban experience with easy access to everything the city has to offer.`
    };
    
    return [
      introTemplates[category as keyof typeof introTemplates] || introTemplates.urban,
      locationDescriptions[location as keyof typeof locationDescriptions] || locationDescriptions['city-center'],
      amenityDescriptions[category as keyof typeof amenityDescriptions] || amenityDescriptions.urban,
      closingTemplates[category as keyof typeof closingTemplates] || closingTemplates.urban
    ].join(' ');
  }

  /**
   * Generate hotel highlights
   */
  private generateHighlights(characteristics: HotelCharacteristics, category: string): string[] {
    const highlights = [];
    
    if (category === 'luxury') {
      highlights.push('Michelin-starred dining', 'Luxury spa treatments', 'Personalized concierge service');
    } else if (category === 'boutique') {
      highlights.push('Unique design elements', 'Local cultural experiences', 'Artisan dining');
    } else if (category === 'resort') {
      highlights.push('Multiple pools and water features', 'Championship golf course', 'Full-service spa');
    }
    
    return highlights;
  }

  /**
   * Generate nearby attractions based on city
   */
  private generateNearbyAttractions(city: string, country: string): string[] {
    const cityAttractions: Record<string, string[]> = {
      'paris': ['Eiffel Tower', 'Louvre Museum', 'Champs-Élysées', 'Notre-Dame Cathedral'],
      'london': ['Big Ben', 'Tower of London', 'British Museum', 'Buckingham Palace'],
      'rome': ['Colosseum', 'Vatican City', 'Trevi Fountain', 'Roman Forum'],
      'new york': ['Central Park', 'Times Square', 'Statue of Liberty', 'Empire State Building'],
      'tokyo': ['Senso-ji Temple', 'Tokyo Skytree', 'Imperial Palace', 'Shibuya Crossing']
    };
    
    return cityAttractions[city.toLowerCase()] || ['City Center', 'Local Museums', 'Shopping District', 'Cultural Sites'];
  }
}

// Export singleton instance
export const enhancedHotelGenerator = new EnhancedHotelGenerator(); 
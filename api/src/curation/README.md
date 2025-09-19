# Glintz Hotel Curation System

A visual-first, Instagram-worthy hotel curation pipeline that transforms raw hotel data into a swipeable feed of beautiful stays.

## Overview

The Glintz curation system applies a sophisticated 6-component scoring algorithm with hard gates to ensure only the most visually appealing, boutique, and unique hotels make it to the final feed.

## Architecture

```
Raw Hotels → Hard Gates → Scoring → Threshold → Diversification → Curated Feed
```

### Components

1. **Constants** (`constants.ts`) - All configuration and criteria
2. **Extract** (`extract.ts`) - Data extraction and validation utilities  
3. **Score** (`score.ts`) - 6-component scoring algorithm
4. **Filter** (`filter.ts`) - Hard gates and main curation pipeline
5. **Diversify** (`diversify.ts`) - Bucket shuffle for variety
6. **Index** (`index.ts`) - Main integration module

## Hard Gates (Must Pass All)

### 1. Photo Gate
- **Requirement**: ≥3 photos with at least one EXTERIOR or ROOM
- **Purpose**: Ensure visual content for Instagram-worthy feed
- **Failure Rate**: ~40-60% of hotels

### 2. Brand Gate  
- **Requirement**: Not blacklisted economy chain
- **Excluded**: Ibis, Best Western, Holiday Inn Express, etc.
- **Purpose**: Maintain boutique/luxury positioning

### 3. Quality Gate
- **Requirement**: Rating ≥4.0 OR (photos + wow amenities)
- **Purpose**: Ensure guest satisfaction
- **Flexibility**: Allows unrated unique properties with wow factor

### 4. Price Extremes
- **Requirement**: If price >$2000, must have wow amenities
- **Purpose**: Avoid overpriced hotels without justification

## Scoring Algorithm (0-1.0 scale)

### Formula
```
score = 0.35×visual + 0.25×amenity + 0.15×brand + 0.15×location + 0.10×rating + 0.10×price
```

### Components

#### Visual Score (35% weight)
- **Base**: min(photos, 6) / 6
- **Bonus**: +0.2 for EXTERIOR + ROOM photos
- **Bonus**: +0.1 for high-resolution (1200×800+)
- **Bonus**: +0.1 for diverse categories (4+ types)

#### Amenity Score (25% weight)
- **Beach/Infinity/Rooftop**: +0.5 (premium water features)
- **Spa/Wellness**: +0.3 (wellness amenities)
- **Design/Heritage**: +0.3 (boutique keywords)
- **Premium Services**: +0.2 (golf, valet, etc.)
- **Luxury Keywords**: +0.2 (Michelin, butler, etc.)

#### Brand Score (15% weight)
- **Premium Chains**: 0.6 (Ritz Carlton, Four Seasons, etc.)
- **Boutique Programs**: 0.3 (Autograph, Curio, etc.)
- **Luxury Indicators**: 0.2 (independent with luxury keywords)
- **Blacklisted**: 0.0 (economy chains)

#### Location Appeal (15% weight)
- **Top Inspiration Cities**: +0.5 (Santorini, Bali, etc.)
- **Beach/Ocean**: +0.5 (coastal locations)
- **Mountain/Lake/Cliff**: +0.3 (scenic locations)
- **Wine Regions**: +0.2 (vineyard settings)
- **Historic/Cultural**: +0.2 (heritage sites)

#### Rating Score (10% weight)
- **5.0**: 1.0
- **4.5+**: 0.8
- **4.0+**: 0.6
- **3.5+**: 0.4
- **3.0+**: 0.2
- **<3.0**: -0.2 (penalty)

#### Price Penalty (10% weight)
- **No penalty** if hotel has wow amenities
- **>$1500**: -0.4 penalty
- **>$1000**: -0.2 penalty  
- **>$500**: -0.1 penalty

### Score Threshold
- **Minimum**: 0.55 (55%) to appear in feed
- **Typical Range**: 0.55-0.95
- **Top Tier**: 0.80+ (premium boutique hotels)

## Diversification

### Bucket Shuffle Algorithm
1. Sort by score (highest first)
2. Avoid >2 consecutive same city/brand
3. Prefer variety while maintaining score order
4. Final pass to fix any remaining violations

### Diversity Metrics
- **Unique Cities**: Target 8-10 different cities per 20 cards
- **Unique Brands**: Target 6-8 different brands per 20 cards
- **Max Consecutive**: ≤2 same city/brand in a row
- **Diversity Score**: 0-1.0 (higher = more diverse)

## Tag Categories

Hotels are automatically tagged with up to 3 categories:

- **Beach/Island** - Coastal and island properties
- **Infinity & Rooftop** - Premium pool experiences  
- **Design/Heritage** - Boutique and historic properties
- **Wellness** - Spa and retreat focused
- **Scenic Nature** - Mountain, vineyard, forest settings
- **City View** - Urban skyline properties
- **Villas/Suites** - Spacious accommodations

## Configuration

### Tunable Constants

#### Scoring Weights (`SCORING_WEIGHTS`)
```typescript
{
  visual: 0.35,    // Photo quality/quantity
  amenity: 0.25,   // Wow amenities
  brand: 0.15,     // Chain prestige  
  location: 0.15,  // Destination appeal
  rating: 0.10,    // Guest reviews
  price: 0.10      // Price penalty
}
```

#### Thresholds (`SCORING_THRESHOLDS`)
```typescript
{
  minScore: 0.55,        // Minimum to appear
  minPhotos: 3,          // Photo gate requirement
  minRating: 4.0,        // Quality gate rating
  maxPrice: 2000,        // Price extreme threshold
  minQualityRating: 3.0  // Absolute minimum rating
}
```

#### Brand Lists
- **Premium Chains**: Ultra-luxury brands (RC, FS, MO, etc.)
- **Boutique Programs**: Curated collections (AC, CU, RH, etc.)  
- **Blacklist**: Economy chains to exclude

#### Amenity Codes
- **Wow Amenities**: Visual/luxury features that boost score
- **Description Keywords**: Text patterns for different categories

## Usage

### Basic Integration
```typescript
import { glintzCurate, RawHotel } from './curation';

const rawHotels: RawHotel[] = [/* hotel data */];
const result = await glintzCurate(rawHotels);

console.log(`Curated ${result.cards.length} hotels`);
console.log(result.summary);
```

### API Endpoint
```
GET /api/hotels/glintz?cityCode=PAR&limit=20
```

### Response Format
```json
{
  "hotels": [...],
  "total": 15,
  "hasMore": false,
  "curation": {
    "stats": {
      "totalProcessed": 50,
      "finalCurated": 15,
      "averageScore": 0.72
    },
    "diversity": {
      "uniqueCities": 8,
      "diversityScore": 0.85
    },
    "summary": "Glintz curation: 15 Instagram-worthy hotels..."
  }
}
```

## Performance

### Typical Conversion Rates
- **Photo Gate**: 40-60% pass
- **Brand Gate**: 70-80% pass  
- **Quality Gate**: 60-70% pass
- **Price Gate**: 90-95% pass
- **Score Threshold**: 20-40% pass
- **Overall**: 5-15% of input hotels make final feed

### Optimization Tips
1. **Batch Processing**: Process 100-200 hotels at once
2. **Content Caching**: Cache hotel content for 24h
3. **Score Caching**: Cache scores for 1h
4. **Parallel Fetching**: Fetch content in parallel

## Monitoring

### Key Metrics
- **Conversion Rate**: Final cards / input hotels
- **Average Score**: Quality indicator
- **Diversity Score**: Variety indicator  
- **Photo Gate Pass Rate**: Content quality
- **Brand Distribution**: Portfolio balance

### Alerts
- Conversion rate <5% (too strict)
- Average score <0.6 (low quality)
- Diversity score <0.5 (too repetitive)

## Future Enhancements

### Planned Features
1. **Personalization**: User preference learning
2. **Seasonal Scoring**: Adjust for travel seasons
3. **Real-time Updates**: Live scoring updates
4. **A/B Testing**: Score weight optimization
5. **ML Enhancement**: Photo quality AI scoring

### Experimental
- **Sentiment Analysis**: Review text analysis
- **Social Media**: Instagram hashtag popularity
- **Booking Patterns**: Demand-based scoring
- **Weather Integration**: Seasonal adjustments

## Troubleshooting

### Common Issues

#### Low Conversion Rates
- Check photo availability in source data
- Verify brand blacklist isn't too aggressive  
- Lower score threshold temporarily
- Review amenity keyword matching

#### Poor Diversity
- Increase input hotel variety
- Adjust diversification algorithm
- Check for data clustering by location

#### Score Inconsistencies  
- Verify amenity code mappings
- Check description keyword extraction
- Review brand classification logic

### Debug Tools
```typescript
import { explainScore, getCurationSummary } from './curation';

// Debug individual hotel score
const score = scoreHotel(hotel, content, offers);
console.log(explainScore(score));

// Debug pipeline stats
const { stats } = curate(rawHotels);
console.log(getCurationSummary(stats));
``` 
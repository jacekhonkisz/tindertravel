# Hotel Filtering Criteria Documentation

## Current Filtering Criteria (As Implemented)

### 1. **Boutique & Unique Amenities** (Primary Filter)
Currently checking for these amenity tags in hotel names/descriptions:

#### Boutique & Unique Architecture
- `boutique-hotel`
- `design-hotel` 
- `historic-building`
- `castle-hotel`
- `villa-hotel`
- `manor-house`
- `heritage-building`
- `art-hotel`
- `cave-hotel`
- `treehouse`
- `historic-palace`
- `converted-monastery`

#### Unique Locations & Views
- `clifftop-location`
- `overwater-villa`
- `private-island`
- `vineyard-hotel`
- `mountain-retreat`
- `desert-camp`
- `safari-lodge`
- `lakefront`
- `ocean-view`
- `mountain-view`
- `sunset-views`
- `panoramic-views`

#### Luxury Amenities & Experiences
- `infinity-pool`
- `rooftop-pool`
- `private-pool`
- `spa-sanctuary`
- `wellness-center`
- `michelin-dining`
- `wine-cellar`
- `private-chef`
- `butler-service`
- `concierge-service`
- `private-beach`
- `beach-club`
- `yacht-access`
- `helicopter-pad`
- `golf-course`

#### Cultural & Experiential
- `cultural-immersion`
- `local-experiences`
- `art-gallery`
- `cooking-classes`
- `wine-tasting`
- `adventure-sports`
- `eco-lodge`
- `sustainable-luxury`
- `wellness-retreat`
- `yoga-pavilion`
- `meditation-center`
- `spiritual-retreat`

#### Romantic & Intimate
- `adults-only`
- `romantic-getaway`
- `honeymoon-suite`
- `private-villa`
- `intimate-setting`
- `couples-spa`
- `sunset-dining`
- `private-terrace`

#### Unique Features
- `rooftop-bar`
- `secret-garden`
- `hidden-courtyard`
- `fireplace`
- `library`
- `observatory`
- `wine-bar`
- `jazz-lounge`

### 2. **Brand Filtering**

#### ✅ **INCLUDED Boutique Luxury Brands**
- Ultra-luxury: `ritz carlton`, `four seasons`, `mandarin oriental`, `st. regis`, `aman`, `rosewood`, `bulgari`, `armani`, `edition`, `park hyatt`, `grand hyatt`, `waldorf astoria`, `luxury collection`, `autograph collection`
- Boutique luxury: `design hotels`, `relais & chateaux`, `small luxury hotels`, `preferred hotels`, `leading hotels`, `curio collection`, `tribute portfolio`, `unbound collection`, `mgallery`, `sofitel`, `pullman`, `kempinski`, `oberoi`, `taj hotels`
- Independent luxury indicators: `boutique`, `palace`, `castle`, `villa`, `manor`, `heritage`, `historic`, `grand hotel`, `royal`, `imperial`, `luxury`, `premium`, `collection`, `resort`, `retreat`, `sanctuary`, `lodge`, `estate`

#### ❌ **EXCLUDED Basic Chain Hotels**
- `ibis`, `travelodge`, `premier inn`, `holiday inn express`, `comfort inn`, `best western`, `days inn`, `super 8`, `motel 6`, `red roof inn`, `la quinta`, `hampton inn`, `courtyard by marriott`, `fairfield inn`, `residence inn`, `extended stay`, `homewood suites`, `candlewood suites`, `holiday inn`, `crowne plaza`, `doubletree`, `embassy suites`

### 3. **Rating Criteria**
- **Minimum Rating**: 4.2/5.0 (for boutique quality)
- **Unrated Properties**: Allowed (many unique boutique hotels don't have ratings)

### 4. **Price Criteria**
- **Maximum Price**: €2000 per night (reasonable luxury ceiling)
- **Minimum Price**: €80 per night (quality floor)
- **Currency**: Flexible (EUR, USD, local currencies)

### 5. **Visual Appeal Scoring** (0-100 points)
- **Global Location Appeal**: 30 points max
- **Boutique Amenities**: 35 points max  
- **Architecture & Design**: 25 points max
- **Brand Prestige**: 10 points max
- **Minimum Threshold**: 25 points (lowered for global boutique variety)

---

## Available Amadeus API Parameters & Data

### 1. **Hotel Search API (`/v3/shopping/hotel-offers`)**

#### **Available Search Parameters:**
- `cityCode` (IATA city code - required)
- `latitude` & `longitude` (alternative to cityCode)
- `radius` (search radius in km)
- `radiusUnit` (KM or MILE)
- `chainCodes` (hotel chain codes)
- `amenities` (amenity codes)
- `ratings` (1-5 star ratings)
- `priceRange` (min-max price)
- `currency` (EUR, USD, etc.)
- `checkInDate` & `checkOutDate`
- `adults` (number of adults)
- `roomQuantity`
- `paymentPolicy` (GUARANTEE, DEPOSIT, etc.)
- `includeClosed` (include closed hotels)
- `bestRateOnly` (best rate per hotel)
- `view` (FULL, LIGHT)
- `sort` (PRICE, NONE)

#### **Available Response Data:**
```json
{
  "hotel": {
    "hotelId": "string",
    "chainCode": "string",
    "dupeId": "string", 
    "name": "string",
    "rating": "number",
    "cityCode": "string",
    "latitude": "number",
    "longitude": "number"
  },
  "available": "boolean",
  "offers": [{
    "id": "string",
    "checkInDate": "date",
    "checkOutDate": "date", 
    "rateCode": "string",
    "rateFamilyEstimated": {
      "code": "string",
      "type": "string"
    },
    "room": {
      "type": "string",
      "typeEstimated": {
        "category": "string",
        "beds": "number",
        "bedType": "string"
      },
      "description": {
        "text": "string",
        "lang": "string"
      }
    },
    "guests": {
      "adults": "number"
    },
    "price": {
      "currency": "string",
      "base": "string",
      "total": "string",
      "taxes": [{
        "amount": "string",
        "currency": "string",
        "code": "string",
        "percentage": "string",
        "included": "boolean",
        "description": "string",
        "pricingFrequency": "string",
        "pricingMode": "string"
      }],
      "markups": [{
        "amount": "string"
      }]
    },
    "policies": {
      "paymentType": "string",
      "guarantee": {
        "acceptedPayments": {
          "creditCards": ["string"],
          "methods": ["string"]
        }
      },
      "deposit": {
        "acceptedPayments": {
          "creditCards": ["string"],
          "methods": ["string"]
        },
        "amount": "string",
        "deadline": "string",
        "description": "string"
      },
      "prepay": {
        "acceptedPayments": {
          "creditCards": ["string"],
          "methods": ["string"]
        },
        "amount": "string",
        "deadline": "string",
        "description": "string"
      },
      "holdTime": "string",
      "cancellation": {
        "deadline": "string",
        "amount": "string",
        "type": "string",
        "description": "string"
      }
    },
    "self": "string"
  }]
}
```

### 2. **Hotel Content API (`/v1/reference-data/locations/hotels/by-hotels`)**

#### **Available Parameters:**
- `hotelIds` (comma-separated hotel IDs)
- `lang` (language code)

#### **Available Response Data:**
```json
{
  "hotelId": "string",
  "chainCode": "string",
  "iataCode": "string",
  "dupeId": "string",
  "name": "string",
  "hotelDistance": {
    "distance": "number",
    "distanceUnit": "string"
  },
  "address": {
    "lines": ["string"],
    "postalCode": "string",
    "cityName": "string",
    "countryCode": "string",
    "stateCode": "string"
  },
  "contact": {
    "phone": "string",
    "fax": "string",
    "email": "string"
  },
  "description": {
    "lang": "string",
    "text": "string"
  },
  "amenities": ["string"],
  "awards": [{
    "provider": "string",
    "rating": "string"
  }],
  "media": [{
    "uri": "string",
    "category": "string"
  }],
  "ratings": [{
    "provider": "string",
    "rating": "string"
  }],
  "hotelDistance": {
    "distance": "number", 
    "distanceUnit": "string"
  }
}
```

### 3. **Available Amadeus Amenity Codes**
```
1BEDROOM, 2BEDROOM, 3BEDROOM, 4BEDROOM, ACCESSIBLE_ROOM, 
AIR_CONDITIONING, AIRPORT_TRANSPORTATION, ALL_INCLUSIVE,
BABYSITTING, BALCONY, BEACH, BEAUTY_SALON, BICYCLE_RENTAL,
BUSINESS_CENTER, CAR_RENTAL, CASINO, CHILD_CARE, CONFERENCE_ROOM,
CONNECTING_ROOMS, CURRENCY_EXCHANGE, DISABLED_FACILITIES, 
DOCTOR_ON_CALL, DRY_CLEANING, ELEVATORS, EXERCISE_GYM, 
FAMILY_PLAN, FREE_AIRPORT_TRANSPORTATION, FREE_BREAKFAST,
FREE_INTERNET, FREE_PARKING, FREE_WIFI, GIFT_SHOP, GOLF,
HAIRDRYER, HANDICAPPED_ROOM, HEALTH_CLUB, HOT_TUB, 
INDOOR_POOL, INTERNET, JACUZZI, KIDS_WELCOME, KITCHENETTE,
LAUNDRY_SERVICE, LOUNGE, MASSAGE, MEETING_FACILITIES, 
MINIBAR, NO_ADULT_TV, NO_KID_UNDER_16, NO_PORN_FILMS,
NO_SMOKING, OUTDOOR_POOL, PARKING, PETS_ALLOWED, POOL,
RESTAURANT, ROOM_SERVICE, SAFE, SAUNA, SPA, STEAM_ROOM,
SUPERVISED_CHILD_ACTIVITIES, SWIMMING_POOL, TENNIS, 
TWENTY_FOUR_HOUR_FRONT_DESK, VALET_PARKING, WHIRLPOOL,
WIRELESS_INTERNET
```

### 4. **Available Chain Codes (Sample)**
```
AC - Marriott Autograph Collection
AK - Aman Hotels
BW - Best Western  
CU - Curio Collection
EH - Extended Stay Hotels
FS - Four Seasons
GH - Grand Hyatt
HI - Holiday Inn
HY - Hyatt Hotels
IB - Ibis Hotels
IC - InterContinental
LX - Luxury Collection
MO - Mandarin Oriental
PH - Park Hyatt
RC - Ritz Carlton
RE - Renaissance Hotels
RH - Relais & Chateaux
SH - Sheraton
SI - Starwood Hotels
SL - Small Luxury Hotels
SR - St. Regis
WA - Waldorf Astoria
```

---

## Current Limitations & Opportunities

### **What We Can Improve:**
1. **Exact Amenity Matching**: Use Amadeus amenity codes instead of text matching
2. **Chain Code Filtering**: Use exact chain codes for precise brand filtering  
3. **Rating Provider Selection**: Choose specific rating providers (TripAdvisor, Google, etc.)
4. **Geographic Precision**: Use lat/lng with radius for better location targeting
5. **Price Range Optimization**: Set exact min/max prices per region
6. **Room Type Filtering**: Target specific room categories (suites, villas, etc.)

### **What We Need from You:**
1. **Exact amenity priorities** (which Amadeus amenity codes are most important)
2. **Preferred chain codes** (which specific chains to include/exclude)
3. **Rating thresholds** by region (different standards for different markets)
4. **Price ranges** by destination type (beach vs city vs safari)
5. **Room type preferences** (standard rooms vs suites vs villas)
6. **Geographic priorities** (which regions/cities are most important)

---

## Next Steps

Please review this documentation and provide:

1. **Priority amenities** from the Amadeus amenity codes list
2. **Exact chain codes** you want included/excluded  
3. **Rating criteria** by region/market
4. **Price ranges** by destination category
5. **Any additional criteria** not covered above

This will allow me to implement precise, API-native filtering instead of text-based matching. 
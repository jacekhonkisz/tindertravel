"use strict";
// Global Hotel Fetcher - Comprehensive Worldwide Coverage
// Fetch boutique hotels from EVERY country and major city globally
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalHotelFetcher = void 0;
const amadeus_1 = require("./amadeus");
const supabase_1 = require("./supabase");
const google_places_1 = require("./google-places");
const curation_1 = require("./curation");
// Photo validation now handled by GooglePlacesClient
// Comprehensive global destinations - EVERY country with major cities
const GLOBAL_DESTINATIONS = {
    // EUROPE - All countries
    europe: {
        'AD': ['Andorra la Vella'], // Andorra
        'AL': ['Tirana', 'Saranda', 'Vlora'], // Albania
        'AT': ['Vienna', 'Salzburg', 'Innsbruck', 'Hallstatt'], // Austria
        'BA': ['Sarajevo', 'Mostar', 'Banja Luka'], // Bosnia and Herzegovina
        'BE': ['Brussels', 'Bruges', 'Antwerp', 'Ghent'], // Belgium
        'BG': ['Sofia', 'Plovdiv', 'Varna', 'Burgas'], // Bulgaria
        'BY': ['Minsk', 'Brest', 'Grodno'], // Belarus
        'CH': ['Zurich', 'Geneva', 'Bern', 'Lucerne', 'Zermatt', 'St. Moritz'], // Switzerland
        'CY': ['Nicosia', 'Limassol', 'Paphos', 'Larnaca'], // Cyprus
        'CZ': ['Prague', 'Brno', 'Cesky Krumlov', 'Karlovy Vary'], // Czech Republic
        'DE': ['Berlin', 'Munich', 'Hamburg', 'Frankfurt', 'Cologne', 'Dresden', 'Heidelberg'], // Germany
        'DK': ['Copenhagen', 'Aarhus', 'Odense', 'Aalborg'], // Denmark
        'EE': ['Tallinn', 'Tartu', 'Parnu'], // Estonia
        'ES': ['Madrid', 'Barcelona', 'Seville', 'Valencia', 'Bilbao', 'Granada', 'San Sebastian', 'Ibiza', 'Mallorca'], // Spain
        'FI': ['Helsinki', 'Tampere', 'Turku', 'Rovaniemi'], // Finland
        'FR': ['Paris', 'Lyon', 'Marseille', 'Nice', 'Cannes', 'Bordeaux', 'Strasbourg', 'Toulouse', 'Nantes'], // France
        'GB': ['London', 'Edinburgh', 'Manchester', 'Liverpool', 'Bath', 'Oxford', 'Cambridge', 'York'], // United Kingdom
        'GE': ['Tbilisi', 'Batumi', 'Kutaisi'], // Georgia
        'GR': ['Athens', 'Thessaloniki', 'Mykonos', 'Santorini', 'Rhodes', 'Crete', 'Corfu'], // Greece
        'HR': ['Zagreb', 'Dubrovnik', 'Split', 'Pula', 'Zadar'], // Croatia
        'HU': ['Budapest', 'Debrecen', 'Szeged'], // Hungary
        'IE': ['Dublin', 'Cork', 'Galway', 'Killarney'], // Ireland
        'IS': ['Reykjavik', 'Akureyri'], // Iceland
        'IT': ['Rome', 'Milan', 'Venice', 'Florence', 'Naples', 'Turin', 'Bologna', 'Amalfi', 'Positano', 'Cinque Terre'], // Italy
        'LI': ['Vaduz'], // Liechtenstein
        'LT': ['Vilnius', 'Kaunas', 'Klaipeda'], // Lithuania
        'LU': ['Luxembourg City'], // Luxembourg
        'LV': ['Riga', 'Jurmala'], // Latvia
        'MC': ['Monaco'], // Monaco
        'MD': ['Chisinau'], // Moldova
        'ME': ['Podgorica', 'Kotor', 'Budva'], // Montenegro
        'MK': ['Skopje', 'Ohrid'], // North Macedonia
        'MT': ['Valletta', 'Sliema', 'St. Julians'], // Malta
        'NL': ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht'], // Netherlands
        'NO': ['Oslo', 'Bergen', 'Trondheim', 'Stavanger', 'Tromso'], // Norway
        'PL': ['Warsaw', 'Krakow', 'Gdansk', 'Wroclaw', 'Poznan'], // Poland
        'PT': ['Lisbon', 'Porto', 'Faro', 'Madeira', 'Azores'], // Portugal
        'RO': ['Bucharest', 'Cluj-Napoca', 'Timisoara', 'Brasov'], // Romania
        'RS': ['Belgrade', 'Novi Sad', 'Nis'], // Serbia
        'RU': ['Moscow', 'St. Petersburg', 'Sochi', 'Kazan', 'Yekaterinburg'], // Russia
        'SE': ['Stockholm', 'Gothenburg', 'Malmo', 'Uppsala'], // Sweden
        'SI': ['Ljubljana', 'Bled', 'Piran'], // Slovenia
        'SK': ['Bratislava', 'Kosice'], // Slovakia
        'SM': ['San Marino'], // San Marino
        'UA': ['Kiev', 'Lviv', 'Odessa'], // Ukraine
        'VA': ['Vatican City'], // Vatican City
    },
    // ASIA - All countries
    asia: {
        'AE': ['Dubai', 'Abu Dhabi', 'Sharjah'], // UAE
        'AF': ['Kabul', 'Herat'], // Afghanistan
        'AM': ['Yerevan'], // Armenia
        'AZ': ['Baku'], // Azerbaijan
        'BD': ['Dhaka', 'Chittagong', 'Sylhet'], // Bangladesh
        'BH': ['Manama'], // Bahrain
        'BN': ['Bandar Seri Begawan'], // Brunei
        'BT': ['Thimphu', 'Paro'], // Bhutan
        'CN': ['Beijing', 'Shanghai', 'Guangzhou', 'Shenzhen', 'Chengdu', 'Hangzhou', 'Suzhou', 'Xian'], // China
        'ID': ['Jakarta', 'Bali', 'Yogyakarta', 'Bandung', 'Surabaya', 'Lombok', 'Flores'], // Indonesia
        'IL': ['Tel Aviv', 'Jerusalem', 'Haifa', 'Eilat'], // Israel
        'IN': ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Jaipur', 'Goa', 'Kerala'], // India
        'IQ': ['Baghdad', 'Basra'], // Iraq
        'IR': ['Tehran', 'Isfahan', 'Shiraz'], // Iran
        'JO': ['Amman', 'Petra', 'Aqaba', 'Wadi Rum'], // Jordan
        'JP': ['Tokyo', 'Osaka', 'Kyoto', 'Hiroshima', 'Sapporo', 'Fukuoka', 'Nara'], // Japan
        'KG': ['Bishkek'], // Kyrgyzstan
        'KH': ['Phnom Penh', 'Siem Reap', 'Sihanoukville'], // Cambodia
        'KP': ['Pyongyang'], // North Korea
        'KR': ['Seoul', 'Busan', 'Incheon', 'Jeju'], // South Korea
        'KW': ['Kuwait City'], // Kuwait
        'KZ': ['Almaty', 'Nur-Sultan'], // Kazakhstan
        'LA': ['Vientiane', 'Luang Prabang'], // Laos
        'LB': ['Beirut', 'Baalbek'], // Lebanon
        'LK': ['Colombo', 'Kandy', 'Galle', 'Ella'], // Sri Lanka
        'MM': ['Yangon', 'Mandalay', 'Bagan'], // Myanmar
        'MN': ['Ulaanbaatar'], // Mongolia
        'MV': ['Male', 'Addu'], // Maldives
        'MY': ['Kuala Lumpur', 'Penang', 'Langkawi', 'Kota Kinabalu', 'Malacca'], // Malaysia
        'NP': ['Kathmandu', 'Pokhara'], // Nepal
        'OM': ['Muscat', 'Nizwa', 'Salalah'], // Oman
        'PH': ['Manila', 'Cebu', 'Davao', 'Boracay', 'Palawan', 'Bohol'], // Philippines
        'PK': ['Karachi', 'Lahore', 'Islamabad'], // Pakistan
        'PS': ['Ramallah', 'Bethlehem'], // Palestine
        'QA': ['Doha'], // Qatar
        'SA': ['Riyadh', 'Jeddah', 'Mecca', 'Medina'], // Saudi Arabia
        'SG': ['Singapore'], // Singapore
        'SY': ['Damascus', 'Aleppo'], // Syria
        'TH': ['Bangkok', 'Chiang Mai', 'Phuket', 'Koh Samui', 'Krabi', 'Pattaya'], // Thailand
        'TJ': ['Dushanbe'], // Tajikistan
        'TL': ['Dili'], // East Timor
        'TM': ['Ashgabat'], // Turkmenistan
        'TR': ['Istanbul', 'Ankara', 'Antalya', 'Izmir', 'Cappadocia'], // Turkey
        'TW': ['Taipei', 'Kaohsiung', 'Taichung'], // Taiwan
        'UZ': ['Tashkent', 'Samarkand', 'Bukhara'], // Uzbekistan
        'VN': ['Ho Chi Minh City', 'Hanoi', 'Da Nang', 'Hoi An', 'Nha Trang'], // Vietnam
        'YE': ['Sanaa', 'Aden'], // Yemen
    },
    // AFRICA - All countries
    africa: {
        'AO': ['Luanda'], // Angola
        'BF': ['Ouagadougou'], // Burkina Faso
        'BI': ['Bujumbura'], // Burundi
        'BJ': ['Cotonou'], // Benin
        'BW': ['Gaborone', 'Maun'], // Botswana
        'CD': ['Kinshasa'], // Democratic Republic of Congo
        'CF': ['Bangui'], // Central African Republic
        'CG': ['Brazzaville'], // Republic of Congo
        'CI': ['Abidjan', 'Yamoussoukro'], // Ivory Coast
        'CM': ['Douala', 'Yaounde'], // Cameroon
        'CV': ['Praia'], // Cape Verde
        'DJ': ['Djibouti'], // Djibouti
        'DZ': ['Algiers', 'Oran'], // Algeria
        'EG': ['Cairo', 'Alexandria', 'Luxor', 'Aswan', 'Sharm El Sheikh'], // Egypt
        'ER': ['Asmara'], // Eritrea
        'ET': ['Addis Ababa'], // Ethiopia
        'GA': ['Libreville'], // Gabon
        'GH': ['Accra', 'Kumasi'], // Ghana
        'GM': ['Banjul'], // Gambia
        'GN': ['Conakry'], // Guinea
        'GQ': ['Malabo'], // Equatorial Guinea
        'GW': ['Bissau'], // Guinea-Bissau
        'KE': ['Nairobi', 'Mombasa', 'Kisumu'], // Kenya
        'KM': ['Moroni'], // Comoros
        'LR': ['Monrovia'], // Liberia
        'LS': ['Maseru'], // Lesotho
        'LY': ['Tripoli', 'Benghazi'], // Libya
        'MA': ['Casablanca', 'Marrakech', 'Rabat', 'Fez', 'Tangier'], // Morocco
        'MG': ['Antananarivo'], // Madagascar
        'ML': ['Bamako'], // Mali
        'MR': ['Nouakchott'], // Mauritania
        'MU': ['Port Louis'], // Mauritius
        'MW': ['Lilongwe', 'Blantyre'], // Malawi
        'MZ': ['Maputo'], // Mozambique
        'NA': ['Windhoek'], // Namibia
        'NE': ['Niamey'], // Niger
        'NG': ['Lagos', 'Abuja', 'Kano'], // Nigeria
        'RW': ['Kigali'], // Rwanda
        'SC': ['Victoria'], // Seychelles
        'SD': ['Khartoum'], // Sudan
        'SL': ['Freetown'], // Sierra Leone
        'SN': ['Dakar'], // Senegal
        'SO': ['Mogadishu'], // Somalia
        'SS': ['Juba'], // South Sudan
        'ST': ['Sao Tome'], // Sao Tome and Principe
        'SZ': ['Mbabane'], // Eswatini
        'TD': ['N\'Djamena'], // Chad
        'TG': ['Lome'], // Togo
        'TN': ['Tunis', 'Sousse'], // Tunisia
        'TZ': ['Dar es Salaam', 'Arusha', 'Zanzibar'], // Tanzania
        'UG': ['Kampala'], // Uganda
        'ZA': ['Cape Town', 'Johannesburg', 'Durban', 'Kruger'], // South Africa
        'ZM': ['Lusaka'], // Zambia
        'ZW': ['Harare', 'Victoria Falls'], // Zimbabwe
    },
    // NORTH AMERICA - All countries
    northAmerica: {
        'AG': ['St. John\'s'], // Antigua and Barbuda
        'BB': ['Bridgetown'], // Barbados
        'BZ': ['Belize City'], // Belize
        'BS': ['Nassau'], // Bahamas
        'CA': ['Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa', 'Quebec City', 'Halifax', 'Winnipeg'], // Canada
        'CR': ['San Jose', 'Manuel Antonio', 'Monteverde'], // Costa Rica
        'CU': ['Havana', 'Santiago de Cuba'], // Cuba
        'DM': ['Roseau'], // Dominica
        'DO': ['Santo Domingo', 'Punta Cana'], // Dominican Republic
        'GD': ['St. George\'s'], // Grenada
        'GT': ['Guatemala City', 'Antigua'], // Guatemala
        'HN': ['Tegucigalpa'], // Honduras
        'HT': ['Port-au-Prince'], // Haiti
        'JM': ['Kingston', 'Montego Bay', 'Negril'], // Jamaica
        'KN': ['Basseterre'], // Saint Kitts and Nevis
        'LC': ['Castries'], // Saint Lucia
        'MX': ['Mexico City', 'Cancun', 'Playa del Carmen', 'Tulum', 'Puerto Vallarta', 'Guadalajara', 'Oaxaca'], // Mexico
        'NI': ['Managua'], // Nicaragua
        'PA': ['Panama City'], // Panama
        'SV': ['San Salvador'], // El Salvador
        'TT': ['Port of Spain'], // Trinidad and Tobago
        'US': ['New York', 'Los Angeles', 'Chicago', 'Miami', 'San Francisco', 'Las Vegas', 'Boston', 'Seattle', 'Hawaii'], // United States
        'VC': ['Kingstown'], // Saint Vincent and the Grenadines
    },
    // SOUTH AMERICA - All countries
    southAmerica: {
        'AR': ['Buenos Aires', 'Mendoza', 'Bariloche', 'Salta', 'Ushuaia'], // Argentina
        'BO': ['La Paz', 'Santa Cruz', 'Sucre'], // Bolivia
        'BR': ['Rio de Janeiro', 'Sao Paulo', 'Salvador', 'Brasilia', 'Recife', 'Fortaleza', 'Manaus'], // Brazil
        'CL': ['Santiago', 'Valparaiso', 'Atacama', 'Torres del Paine'], // Chile
        'CO': ['Bogota', 'Medellin', 'Cartagena', 'Cali'], // Colombia
        'EC': ['Quito', 'Guayaquil', 'Cuenca', 'Galapagos'], // Ecuador
        'FK': ['Stanley'], // Falkland Islands
        'GF': ['Cayenne'], // French Guiana
        'GY': ['Georgetown'], // Guyana
        'PE': ['Lima', 'Cusco', 'Arequipa', 'Machu Picchu'], // Peru
        'PY': ['Asuncion'], // Paraguay
        'SR': ['Paramaribo'], // Suriname
        'UY': ['Montevideo', 'Punta del Este'], // Uruguay
        'VE': ['Caracas', 'Maracaibo'], // Venezuela
    },
    // OCEANIA - All countries
    oceania: {
        'AS': ['Pago Pago'], // American Samoa
        'AU': ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Darwin', 'Cairns', 'Gold Coast'], // Australia
        'CK': ['Avarua'], // Cook Islands
        'FJ': ['Suva', 'Nadi'], // Fiji
        'FM': ['Palikir'], // Micronesia
        'GU': ['Hagatna'], // Guam
        'KI': ['Tarawa'], // Kiribati
        'MH': ['Majuro'], // Marshall Islands
        'MP': ['Saipan'], // Northern Mariana Islands
        'NC': ['Noumea'], // New Caledonia
        'NR': ['Yaren'], // Nauru
        'NU': ['Alofi'], // Niue
        'NZ': ['Auckland', 'Wellington', 'Christchurch', 'Queenstown', 'Rotorua'], // New Zealand
        'PF': ['Papeete', 'Bora Bora'], // French Polynesia
        'PG': ['Port Moresby'], // Papua New Guinea
        'PN': ['Adamstown'], // Pitcairn Islands
        'PW': ['Ngerulmud'], // Palau
        'SB': ['Honiara'], // Solomon Islands
        'TK': ['Nukunonu'], // Tokelau
        'TO': ['Nuku\'alofa'], // Tonga
        'TV': ['Funafuti'], // Tuvalu
        'VU': ['Port Vila'], // Vanuatu
        'WF': ['Mata-Utu'], // Wallis and Futuna
        'WS': ['Apia'], // Samoa
    }
};
class GlobalHotelFetcher {
    constructor() {
        this.processedCities = new Set();
        this.totalProcessed = 0;
        this.totalAdded = 0;
        this.totalPhotosValidated = 0;
        this.totalPhotosRejected = 0;
        this.amadeusClient = new amadeus_1.AmadeusClient();
        this.supabaseService = new supabase_1.SupabaseService();
        this.googlePlacesClient = new google_places_1.GooglePlacesClient();
    }
    /**
     * Fetch hotels from ALL countries globally
     */
    async fetchGlobalHotels(options = {}) {
        const { batchSize = 50, maxHotelsPerCity = 20, continents = ['europe', 'asia', 'africa', 'northAmerica', 'southAmerica', 'oceania'], skipExisting = true } = options;
        console.log('🌍 Starting GLOBAL hotel fetching from ALL countries...');
        console.log(`📊 Target: ${continents.join(', ')} continents`);
        const results = {
            processed: 0,
            added: 0,
            failed: 0,
            countries: [],
            cities: []
        };
        // Get existing hotels to avoid duplicates
        let existingHotels = new Set();
        if (skipExisting) {
            const existing = await this.supabaseService.getHotels(10000, 0);
            existingHotels = new Set(existing.map(h => h.id));
            console.log(`📋 Found ${existingHotels.size} existing hotels to skip`);
        }
        // Process each continent
        for (const continent of continents) {
            if (!GLOBAL_DESTINATIONS[continent]) {
                console.log(`❌ Unknown continent: ${continent}`);
                continue;
            }
            console.log(`\n🌍 Processing ${continent.toUpperCase()}...`);
            const countries = GLOBAL_DESTINATIONS[continent];
            // Process each country
            for (const [countryCode, cities] of Object.entries(countries)) {
                console.log(`\n🏳️  Processing ${countryCode} (${cities.length} cities)...`);
                results.countries.push(countryCode);
                // Process each city in the country
                for (const city of cities) {
                    try {
                        const cityKey = `${city}-${countryCode}`;
                        if (this.processedCities.has(cityKey)) {
                            console.log(`⏭️  Skipping already processed: ${city}`);
                            continue;
                        }
                        console.log(`\n📍 Fetching hotels from ${city}, ${countryCode}...`);
                        // Fetch hotels from Amadeus
                        const amadeusCityCode = await this.getCityCode(city, countryCode);
                        if (!amadeusCityCode) {
                            console.log(`❌ Could not find city code for ${city}`);
                            results.failed++;
                            continue;
                        }
                        const rawHotels = await this.fetchCityHotels(amadeusCityCode, maxHotelsPerCity);
                        console.log(`📊 Found ${rawHotels.length} raw hotels in ${city}`);
                        if (rawHotels.length === 0) {
                            console.log(`⚠️  No hotels found in ${city}`);
                            continue;
                        }
                        // Apply Glintz curation
                        console.log(`🎯 Applying Glintz curation to ${rawHotels.length} hotels...`);
                        const curationResult = await (0, curation_1.glintzCurate)(rawHotels);
                        console.log(`✅ Glintz curation: ${curationResult.cards.length} hotels passed (${((curationResult.cards.length / rawHotels.length) * 100).toFixed(1)}% success rate)`);
                        // Filter out existing hotels
                        const newHotels = curationResult.cards.filter(hotel => !existingHotels.has(hotel.id));
                        console.log(`🆕 ${newHotels.length} new hotels after deduplication`);
                        // Fetch and validate real photos from Google Places
                        console.log(`📸 Fetching real photos from Google Places for ${newHotels.length} hotels...`);
                        const hotelsWithValidPhotos = await this.fetchAndValidatePhotos(newHotels, city, countryCode);
                        console.log(`📊 Photo validation: ${hotelsWithValidPhotos.length}/${newHotels.length} hotels have 4+ high-quality photos`);
                        // Save to database in batches (only hotels with valid photos)
                        if (hotelsWithValidPhotos.length > 0) {
                            const hotelData = hotelsWithValidPhotos.map(card => ({
                                id: card.id,
                                name: card.name,
                                city: card.city,
                                country: card.country,
                                coords: card.coords,
                                price: card.price,
                                description: card.description,
                                amenity_tags: card.tags.map((tag) => tag.label),
                                photos: card.photos, // Now contains validated high-quality Google Photos
                                hero_photo: card.heroPhoto,
                                booking_url: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(card.name + ' ' + card.city)}`,
                                rating: card.rating || 4.5
                            }));
                            await this.supabaseService.insertHotels(hotelData);
                            results.added += hotelsWithValidPhotos.length;
                            // Add to existing set to avoid future duplicates
                            hotelsWithValidPhotos.forEach(hotel => existingHotels.add(hotel.id));
                        }
                        results.processed += rawHotels.length;
                        results.cities.push(city);
                        this.processedCities.add(cityKey);
                        // Progress update
                        this.totalProcessed += rawHotels.length;
                        this.totalAdded += hotelsWithValidPhotos.length;
                        console.log(`📈 Progress: ${this.totalAdded} total hotels added from ${results.cities.length} cities`);
                        console.log(`📸 Photo Stats: ${this.totalPhotosValidated} validated, ${this.totalPhotosRejected} rejected`);
                        // Rate limiting - respect API limits
                        await this.sleep(2000);
                        // Batch checkpoint
                        if (results.cities.length % 10 === 0) {
                            console.log(`\n🔄 Checkpoint: Processed ${results.cities.length} cities, added ${results.added} hotels`);
                            await this.sleep(5000); // Longer pause every 10 cities
                        }
                    }
                    catch (error) {
                        console.error(`❌ Error processing ${city}, ${countryCode}:`, error);
                        results.failed++;
                    }
                }
                // Country completion
                console.log(`✅ Completed ${countryCode}: processed ${cities.length} cities`);
            }
            // Continent completion
            console.log(`\n🎉 Completed ${continent.toUpperCase()}!`);
            console.log(`📊 Stats: ${results.added} hotels added from ${results.cities.length} cities`);
        }
        console.log(`\n🌍 GLOBAL HOTEL FETCHING COMPLETE!`);
        console.log(`📊 Final Results:`);
        console.log(`   • Countries processed: ${results.countries.length}`);
        console.log(`   • Cities processed: ${results.cities.length}`);
        console.log(`   • Hotels processed: ${results.processed}`);
        console.log(`   • Hotels added: ${results.added}`);
        console.log(`   • Failed cities: ${results.failed}`);
        console.log(`   • Success rate: ${((results.added / results.processed) * 100).toFixed(1)}%`);
        console.log(`📸 Photo Quality Results:`);
        console.log(`   • Photos validated: ${this.totalPhotosValidated}`);
        console.log(`   • Photos rejected: ${this.totalPhotosRejected}`);
        console.log(`   • Photo success rate: ${((this.totalPhotosValidated / (this.totalPhotosValidated + this.totalPhotosRejected)) * 100).toFixed(1)}%`);
        console.log(`   • Average photos per hotel: ${(this.totalPhotosValidated / results.added).toFixed(1)}`);
        return results;
    }
    /**
     * Fetch and validate real photos from Google Places for hotels
     */
    async fetchAndValidatePhotos(hotels, city, countryCode) {
        const hotelsWithValidPhotos = [];
        for (const hotel of hotels) {
            try {
                console.log(`📸 Fetching photos for ${hotel.name}...`);
                // Search for the hotel on Google Places
                const searchQuery = `${hotel.name} hotel ${city} ${countryCode}`;
                const googleHotels = await this.googlePlacesClient.searchHotels(searchQuery, 1);
                if (googleHotels.length === 0) {
                    console.log(`❌ No Google Places results for ${hotel.name}`);
                    continue;
                }
                const googleHotel = googleHotels[0];
                if (!googleHotel.photos || googleHotel.photos.length === 0) {
                    console.log(`❌ No photos found for ${hotel.name} on Google Places`);
                    continue;
                }
                // Extract photo URLs (Google Places already provides high-quality photos)
                const photoUrls = googleHotel.photos.slice(0, 8); // Take up to 8 photos
                // Check if we have enough photos (minimum 4)
                if (photoUrls.length < 4) {
                    console.log(`❌ ${hotel.name}: Only ${photoUrls.length}/4 photos found`);
                    continue;
                }
                // Update hotel with photos
                const updatedHotel = {
                    ...hotel,
                    photos: photoUrls,
                    heroPhoto: photoUrls[0]
                };
                hotelsWithValidPhotos.push(updatedHotel);
                this.totalPhotosValidated += photoUrls.length;
                console.log(`✅ ${hotel.name}: ${photoUrls.length} photos added`);
                // Rate limiting for Google Places API
                await this.sleep(1000);
            }
            catch (error) {
                console.error(`❌ Error fetching photos for ${hotel.name}:`, error);
            }
        }
        return hotelsWithValidPhotos;
    }
    /**
     * Fetch hotels from a specific city using Amadeus
     */
    async fetchCityHotels(cityCode, maxHotels) {
        try {
            const amadeusCityHotels = await this.amadeusClient.getHotelsByCity(cityCode, maxHotels);
            const rawHotels = [];
            for (const hotelOffer of amadeusCityHotels) {
                try {
                    // Get hotel content (photos, amenities, description)
                    const content = await this.amadeusClient.getHotelContent(hotelOffer.hotel.hotelId);
                    if (content && content.media && content.media.length >= 3) {
                        rawHotels.push({
                            hotel: {
                                hotelId: hotelOffer.hotel.hotelId,
                                name: hotelOffer.hotel.name,
                                chainCode: undefined,
                                rating: undefined,
                                cityCode: cityCode,
                                latitude: hotelOffer.hotel.latitude || 0,
                                longitude: hotelOffer.hotel.longitude || 0
                            },
                            content: {
                                hotelId: content.hotelId,
                                name: content.name,
                                description: content.description ? { text: content.description.text, lang: 'en' } : undefined,
                                amenities: (content.amenities || []).map(amenity => amenity.code),
                                media: content.media || [],
                                ratings: undefined
                            },
                            offers: hotelOffer.offers || []
                        });
                    }
                }
                catch (error) {
                    console.error(`Failed to get content for hotel ${hotelOffer.hotel.hotelId}:`, error);
                }
            }
            return rawHotels;
        }
        catch (error) {
            console.error(`Failed to fetch hotels for city ${cityCode}:`, error);
            return [];
        }
    }
    /**
     * Get Amadeus city code for a city name
     */
    async getCityCode(cityName, countryCode) {
        // Simple mapping - in production, you'd use Amadeus location API
        const cityMappings = {
            'London': 'LON',
            'Paris': 'PAR',
            'New York': 'NYC',
            'Tokyo': 'TYO',
            'Dubai': 'DXB',
            'Singapore': 'SIN',
            'Hong Kong': 'HKG',
            'Bangkok': 'BKK',
            'Istanbul': 'IST',
            'Rome': 'ROM',
            'Barcelona': 'BCN',
            'Amsterdam': 'AMS',
            'Berlin': 'BER',
            'Madrid': 'MAD',
            'Vienna': 'VIE',
            'Prague': 'PRG',
            'Budapest': 'BUD',
            'Warsaw': 'WAW',
            'Stockholm': 'STO',
            'Copenhagen': 'CPH',
            'Oslo': 'OSL',
            'Helsinki': 'HEL',
            'Zurich': 'ZUR',
            'Geneva': 'GVA',
            'Milan': 'MIL',
            'Venice': 'VCE',
            'Florence': 'FLR',
            'Naples': 'NAP',
            'Athens': 'ATH',
            'Lisbon': 'LIS',
            'Porto': 'OPO',
            'Dublin': 'DUB',
            'Edinburgh': 'EDI',
            'Brussels': 'BRU',
            'Munich': 'MUC',
            'Frankfurt': 'FRA',
            'Hamburg': 'HAM',
            'Cologne': 'CGN',
            'Lyon': 'LYS',
            'Marseille': 'MRS',
            'Nice': 'NCE',
            'Toulouse': 'TLS',
            'Bordeaux': 'BOD',
            'Strasbourg': 'SXB',
            'Nantes': 'NTE'
        };
        // Try direct mapping first
        if (cityMappings[cityName]) {
            return cityMappings[cityName];
        }
        // Generate a simple 3-letter code from city name
        const code = cityName.substring(0, 3).toUpperCase();
        return code;
    }
    /**
     * Sleep utility for rate limiting
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /**
     * Get comprehensive statistics
     */
    async getGlobalStats() {
        const hotels = await this.supabaseService.getHotels(10000, 0);
        const countries = new Set(hotels.map(h => h.country));
        const cities = new Set(hotels.map(h => h.city));
        // Simple continent mapping based on country
        const continentBreakdown = {
            Europe: 0,
            Asia: 0,
            Africa: 0,
            'North America': 0,
            'South America': 0,
            Oceania: 0
        };
        hotels.forEach(hotel => {
            // Simple continent detection based on country names
            const country = hotel.country.toLowerCase();
            if (['italy', 'france', 'spain', 'germany', 'uk', 'greece', 'portugal', 'croatia'].some(c => country.includes(c))) {
                continentBreakdown.Europe++;
            }
            else if (['japan', 'thailand', 'indonesia', 'china', 'singapore', 'malaysia'].some(c => country.includes(c))) {
                continentBreakdown.Asia++;
            }
            else if (['south africa', 'tanzania', 'morocco', 'egypt', 'kenya'].some(c => country.includes(c))) {
                continentBreakdown.Africa++;
            }
            else if (['united states', 'canada', 'mexico', 'jamaica'].some(c => country.includes(c))) {
                continentBreakdown['North America']++;
            }
            else if (['brazil', 'argentina', 'chile', 'peru', 'colombia'].some(c => country.includes(c))) {
                continentBreakdown['South America']++;
            }
            else if (['australia', 'new zealand', 'fiji', 'tahiti'].some(c => country.includes(c))) {
                continentBreakdown.Oceania++;
            }
        });
        return {
            totalHotels: hotels.length,
            countriesRepresented: countries.size,
            citiesRepresented: cities.size,
            continentBreakdown
        };
    }
}
exports.GlobalHotelFetcher = GlobalHotelFetcher;
// CLI execution
if (require.main === module) {
    const fetcher = new GlobalHotelFetcher();
    const args = process.argv.slice(2);
    const continent = args[0];
    const maxHotelsPerCity = parseInt(args[1]) || 10;
    const continents = continent ? [continent] : ['europe', 'asia', 'africa', 'northAmerica', 'southAmerica', 'oceania'];
    fetcher.fetchGlobalHotels({
        continents,
        maxHotelsPerCity,
        batchSize: 50,
        skipExisting: true
    })
        .then(results => {
        console.log('\n🎉 Global hotel fetching completed!');
        console.log('Results:', results);
        process.exit(0);
    })
        .catch(error => {
        console.error('❌ Global hotel fetching failed:', error);
        process.exit(1);
    });
}
// GlobalHotelFetcher already exported above 
//# sourceMappingURL=global-hotel-fetcher.js.map
"use strict";
// Global Hotel Fetcher - Comprehensive Worldwide Coverage
// Fetch boutique hotels from EVERY country and major city globally
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalHotelFetcher = void 0;
var amadeus_1 = require("./amadeus");
var supabase_1 = require("./supabase");
var google_places_1 = require("./google-places");
var curation_1 = require("./curation");
var photo_validator_1 = require("./photo-validator");
// Comprehensive global destinations - EVERY country with major cities
var GLOBAL_DESTINATIONS = {
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
var GlobalHotelFetcher = /** @class */ (function () {
    function GlobalHotelFetcher() {
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
    GlobalHotelFetcher.prototype.fetchGlobalHotels = function () {
        return __awaiter(this, arguments, void 0, function (options) {
            var _a, batchSize, _b, maxHotelsPerCity, _c, continents, _d, skipExisting, results, existingHotels, existing, _i, continents_1, continent, countries, _e, _f, _g, countryCode, cities, _h, cities_1, city, cityKey, amadeusCityCode, rawHotels, curationResult, newHotels, hotelsWithValidPhotos, hotelData, error_1;
            if (options === void 0) { options = {}; }
            return __generator(this, function (_j) {
                switch (_j.label) {
                    case 0:
                        _a = options.batchSize, batchSize = _a === void 0 ? 50 : _a, _b = options.maxHotelsPerCity, maxHotelsPerCity = _b === void 0 ? 20 : _b, _c = options.continents, continents = _c === void 0 ? ['europe', 'asia', 'africa', 'northAmerica', 'southAmerica', 'oceania'] : _c, _d = options.skipExisting, skipExisting = _d === void 0 ? true : _d;
                        console.log('🌍 Starting GLOBAL hotel fetching from ALL countries...');
                        console.log("\uD83D\uDCCA Target: ".concat(continents.join(', '), " continents"));
                        results = {
                            processed: 0,
                            added: 0,
                            failed: 0,
                            countries: [],
                            cities: []
                        };
                        existingHotels = new Set();
                        if (!skipExisting) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.supabaseService.getHotels(10000, 0)];
                    case 1:
                        existing = _j.sent();
                        existingHotels = new Set(existing.map(function (h) { return h.id; }));
                        console.log("\uD83D\uDCCB Found ".concat(existingHotels.size, " existing hotels to skip"));
                        _j.label = 2;
                    case 2:
                        _i = 0, continents_1 = continents;
                        _j.label = 3;
                    case 3:
                        if (!(_i < continents_1.length)) return [3 /*break*/, 22];
                        continent = continents_1[_i];
                        if (!GLOBAL_DESTINATIONS[continent]) {
                            console.log("\u274C Unknown continent: ".concat(continent));
                            return [3 /*break*/, 21];
                        }
                        console.log("\n\uD83C\uDF0D Processing ".concat(continent.toUpperCase(), "..."));
                        countries = GLOBAL_DESTINATIONS[continent];
                        _e = 0, _f = Object.entries(countries);
                        _j.label = 4;
                    case 4:
                        if (!(_e < _f.length)) return [3 /*break*/, 20];
                        _g = _f[_e], countryCode = _g[0], cities = _g[1];
                        console.log("\n\uD83C\uDFF3\uFE0F  Processing ".concat(countryCode, " (").concat(cities.length, " cities)..."));
                        results.countries.push(countryCode);
                        _h = 0, cities_1 = cities;
                        _j.label = 5;
                    case 5:
                        if (!(_h < cities_1.length)) return [3 /*break*/, 18];
                        city = cities_1[_h];
                        _j.label = 6;
                    case 6:
                        _j.trys.push([6, 16, , 17]);
                        cityKey = "".concat(city, "-").concat(countryCode);
                        if (this.processedCities.has(cityKey)) {
                            console.log("\u23ED\uFE0F  Skipping already processed: ".concat(city));
                            return [3 /*break*/, 17];
                        }
                        console.log("\n\uD83D\uDCCD Fetching hotels from ".concat(city, ", ").concat(countryCode, "..."));
                        return [4 /*yield*/, this.getCityCode(city, countryCode)];
                    case 7:
                        amadeusCityCode = _j.sent();
                        if (!amadeusCityCode) {
                            console.log("\u274C Could not find city code for ".concat(city));
                            results.failed++;
                            return [3 /*break*/, 17];
                        }
                        return [4 /*yield*/, this.fetchCityHotels(amadeusCityCode, maxHotelsPerCity)];
                    case 8:
                        rawHotels = _j.sent();
                        console.log("\uD83D\uDCCA Found ".concat(rawHotels.length, " raw hotels in ").concat(city));
                        if (rawHotels.length === 0) {
                            console.log("\u26A0\uFE0F  No hotels found in ".concat(city));
                            return [3 /*break*/, 17];
                        }
                        // Apply Glintz curation
                        console.log("\uD83C\uDFAF Applying Glintz curation to ".concat(rawHotels.length, " hotels..."));
                        return [4 /*yield*/, (0, curation_1.glintzCurate)(rawHotels)];
                    case 9:
                        curationResult = _j.sent();
                        console.log("\u2705 Glintz curation: ".concat(curationResult.cards.length, " hotels passed (").concat(((curationResult.cards.length / rawHotels.length) * 100).toFixed(1), "% success rate)"));
                        newHotels = curationResult.cards.filter(function (hotel) { return !existingHotels.has(hotel.id); });
                        console.log("\uD83C\uDD95 ".concat(newHotels.length, " new hotels after deduplication"));
                        // Fetch and validate real photos from Google Places
                        console.log("\uD83D\uDCF8 Fetching real photos from Google Places for ".concat(newHotels.length, " hotels..."));
                        return [4 /*yield*/, this.fetchAndValidatePhotos(newHotels, city, countryCode)];
                    case 10:
                        hotelsWithValidPhotos = _j.sent();
                        console.log("\uD83D\uDCCA Photo validation: ".concat(hotelsWithValidPhotos.length, "/").concat(newHotels.length, " hotels have 4+ high-quality photos"));
                        if (!(hotelsWithValidPhotos.length > 0)) return [3 /*break*/, 12];
                        hotelData = hotelsWithValidPhotos.map(function (card) { return ({
                            id: card.id,
                            name: card.name,
                            city: card.city,
                            country: card.country,
                            coords: card.coords,
                            price: card.price,
                            description: card.description,
                            amenity_tags: card.tags.map(function (tag) { return tag.label; }),
                            photos: card.photos, // Now contains validated high-quality Google Photos
                            hero_photo: card.heroPhoto,
                            booking_url: "https://www.booking.com/searchresults.html?ss=".concat(encodeURIComponent(card.name + ' ' + card.city)),
                            rating: card.rating || 4.5
                        }); });
                        return [4 /*yield*/, this.supabaseService.insertHotels(hotelData)];
                    case 11:
                        _j.sent();
                        results.added += hotelsWithValidPhotos.length;
                        // Add to existing set to avoid future duplicates
                        hotelsWithValidPhotos.forEach(function (hotel) { return existingHotels.add(hotel.id); });
                        _j.label = 12;
                    case 12:
                        results.processed += rawHotels.length;
                        results.cities.push(city);
                        this.processedCities.add(cityKey);
                        // Progress update
                        this.totalProcessed += rawHotels.length;
                        this.totalAdded += hotelsWithValidPhotos.length;
                        console.log("\uD83D\uDCC8 Progress: ".concat(this.totalAdded, " total hotels added from ").concat(results.cities.length, " cities"));
                        console.log("\uD83D\uDCF8 Photo Stats: ".concat(this.totalPhotosValidated, " validated, ").concat(this.totalPhotosRejected, " rejected"));
                        // Rate limiting - respect API limits
                        return [4 /*yield*/, this.sleep(2000)];
                    case 13:
                        // Rate limiting - respect API limits
                        _j.sent();
                        if (!(results.cities.length % 10 === 0)) return [3 /*break*/, 15];
                        console.log("\n\uD83D\uDD04 Checkpoint: Processed ".concat(results.cities.length, " cities, added ").concat(results.added, " hotels"));
                        return [4 /*yield*/, this.sleep(5000)];
                    case 14:
                        _j.sent(); // Longer pause every 10 cities
                        _j.label = 15;
                    case 15: return [3 /*break*/, 17];
                    case 16:
                        error_1 = _j.sent();
                        console.error("\u274C Error processing ".concat(city, ", ").concat(countryCode, ":"), error_1);
                        results.failed++;
                        return [3 /*break*/, 17];
                    case 17:
                        _h++;
                        return [3 /*break*/, 5];
                    case 18:
                        // Country completion
                        console.log("\u2705 Completed ".concat(countryCode, ": processed ").concat(cities.length, " cities"));
                        _j.label = 19;
                    case 19:
                        _e++;
                        return [3 /*break*/, 4];
                    case 20:
                        // Continent completion
                        console.log("\n\uD83C\uDF89 Completed ".concat(continent.toUpperCase(), "!"));
                        console.log("\uD83D\uDCCA Stats: ".concat(results.added, " hotels added from ").concat(results.cities.length, " cities"));
                        _j.label = 21;
                    case 21:
                        _i++;
                        return [3 /*break*/, 3];
                    case 22:
                        console.log("\n\uD83C\uDF0D GLOBAL HOTEL FETCHING COMPLETE!");
                        console.log("\uD83D\uDCCA Final Results:");
                        console.log("   \u2022 Countries processed: ".concat(results.countries.length));
                        console.log("   \u2022 Cities processed: ".concat(results.cities.length));
                        console.log("   \u2022 Hotels processed: ".concat(results.processed));
                        console.log("   \u2022 Hotels added: ".concat(results.added));
                        console.log("   \u2022 Failed cities: ".concat(results.failed));
                        console.log("   \u2022 Success rate: ".concat(((results.added / results.processed) * 100).toFixed(1), "%"));
                        console.log("\uD83D\uDCF8 Photo Quality Results:");
                        console.log("   \u2022 Photos validated: ".concat(this.totalPhotosValidated));
                        console.log("   \u2022 Photos rejected: ".concat(this.totalPhotosRejected));
                        console.log("   \u2022 Photo success rate: ".concat(((this.totalPhotosValidated / (this.totalPhotosValidated + this.totalPhotosRejected)) * 100).toFixed(1), "%"));
                        console.log("   \u2022 Average photos per hotel: ".concat((this.totalPhotosValidated / results.added).toFixed(1)));
                        return [2 /*return*/, results];
                }
            });
        });
    };
    /**
     * Fetch and validate real photos from Google Places for hotels
     */
    GlobalHotelFetcher.prototype.fetchAndValidatePhotos = function (hotels, city, countryCode) {
        return __awaiter(this, void 0, void 0, function () {
            var hotelsWithValidPhotos, _i, hotels_1, hotel, searchQuery, googleHotels, googleHotel, photoUrls, validatedPhotos, updatedHotel, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        hotelsWithValidPhotos = [];
                        _i = 0, hotels_1 = hotels;
                        _a.label = 1;
                    case 1:
                        if (!(_i < hotels_1.length)) return [3 /*break*/, 8];
                        hotel = hotels_1[_i];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 6, , 7]);
                        console.log("\uD83D\uDCF8 Fetching photos for ".concat(hotel.name, "..."));
                        searchQuery = "".concat(hotel.name, " hotel ").concat(city, " ").concat(countryCode);
                        return [4 /*yield*/, this.googlePlacesClient.searchHotels(searchQuery, 1)];
                    case 3:
                        googleHotels = _a.sent();
                        if (googleHotels.length === 0) {
                            console.log("\u274C No Google Places results for ".concat(hotel.name));
                            return [3 /*break*/, 7];
                        }
                        googleHotel = googleHotels[0];
                        if (!googleHotel.photos || googleHotel.photos.length === 0) {
                            console.log("\u274C No photos found for ".concat(hotel.name, " on Google Places"));
                            return [3 /*break*/, 7];
                        }
                        photoUrls = googleHotel.photos.map(function (photo) {
                            return photo_validator_1.PhotoValidator.optimizePhotoUrl(photo.url, 1920, 1080);
                        });
                        return [4 /*yield*/, photo_validator_1.PhotoValidator.validatePhotos(photoUrls)];
                    case 4:
                        validatedPhotos = _a.sent();
                        // Check if we have enough high-quality photos (minimum 4)
                        if (!photo_validator_1.PhotoValidator.hasEnoughQualityPhotos(validatedPhotos, 4)) {
                            console.log("\u274C ".concat(hotel.name, ": Only ").concat(validatedPhotos.length, "/4 high-quality photos found"));
                            this.totalPhotosRejected += photoUrls.length - validatedPhotos.length;
                            return [3 /*break*/, 7];
                        }
                        updatedHotel = __assign(__assign({}, hotel), { photos: validatedPhotos.map(function (photo) { return photo.url; }), heroPhoto: validatedPhotos[0].url, photoQuality: photo_validator_1.PhotoValidator.getPhotoQualitySummary(validatedPhotos) });
                        hotelsWithValidPhotos.push(updatedHotel);
                        this.totalPhotosValidated += validatedPhotos.length;
                        console.log("\u2705 ".concat(hotel.name, ": ").concat(validatedPhotos.length, " high-quality photos validated"));
                        // Rate limiting for Google Places API
                        return [4 /*yield*/, this.sleep(1000)];
                    case 5:
                        // Rate limiting for Google Places API
                        _a.sent();
                        return [3 /*break*/, 7];
                    case 6:
                        error_2 = _a.sent();
                        console.error("\u274C Error fetching photos for ".concat(hotel.name, ":"), error_2);
                        return [3 /*break*/, 7];
                    case 7:
                        _i++;
                        return [3 /*break*/, 1];
                    case 8: return [2 /*return*/, hotelsWithValidPhotos];
                }
            });
        });
    };
    /**
     * Fetch hotels from a specific city using Amadeus
     */
    GlobalHotelFetcher.prototype.fetchCityHotels = function (cityCode, maxHotels) {
        return __awaiter(this, void 0, void 0, function () {
            var amadeusCityHotels, rawHotels, _i, amadeusCityHotels_1, hotelOffer, content, error_3, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 8, , 9]);
                        return [4 /*yield*/, this.amadeusClient.getHotelsByCity(cityCode, maxHotels)];
                    case 1:
                        amadeusCityHotels = _a.sent();
                        rawHotels = [];
                        _i = 0, amadeusCityHotels_1 = amadeusCityHotels;
                        _a.label = 2;
                    case 2:
                        if (!(_i < amadeusCityHotels_1.length)) return [3 /*break*/, 7];
                        hotelOffer = amadeusCityHotels_1[_i];
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 5, , 6]);
                        return [4 /*yield*/, this.amadeusClient.getHotelContent(hotelOffer.hotel.hotelId)];
                    case 4:
                        content = _a.sent();
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
                                    amenities: (content.amenities || []).map(function (amenity) { return amenity.code; }),
                                    media: content.media || [],
                                    ratings: undefined
                                },
                                offers: hotelOffer.offers || []
                            });
                        }
                        return [3 /*break*/, 6];
                    case 5:
                        error_3 = _a.sent();
                        console.error("Failed to get content for hotel ".concat(hotelOffer.hotel.hotelId, ":"), error_3);
                        return [3 /*break*/, 6];
                    case 6:
                        _i++;
                        return [3 /*break*/, 2];
                    case 7: return [2 /*return*/, rawHotels];
                    case 8:
                        error_4 = _a.sent();
                        console.error("Failed to fetch hotels for city ".concat(cityCode, ":"), error_4);
                        return [2 /*return*/, []];
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get Amadeus city code for a city name
     */
    GlobalHotelFetcher.prototype.getCityCode = function (cityName, countryCode) {
        return __awaiter(this, void 0, void 0, function () {
            var cityMappings, code;
            return __generator(this, function (_a) {
                cityMappings = {
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
                    return [2 /*return*/, cityMappings[cityName]];
                }
                code = cityName.substring(0, 3).toUpperCase();
                return [2 /*return*/, code];
            });
        });
    };
    /**
     * Sleep utility for rate limiting
     */
    GlobalHotelFetcher.prototype.sleep = function (ms) {
        return new Promise(function (resolve) { return setTimeout(resolve, ms); });
    };
    /**
     * Get comprehensive statistics
     */
    GlobalHotelFetcher.prototype.getGlobalStats = function () {
        return __awaiter(this, void 0, void 0, function () {
            var hotels, countries, cities, continentBreakdown;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.supabaseService.getHotels(10000, 0)];
                    case 1:
                        hotels = _a.sent();
                        countries = new Set(hotels.map(function (h) { return h.country; }));
                        cities = new Set(hotels.map(function (h) { return h.city; }));
                        continentBreakdown = {
                            Europe: 0,
                            Asia: 0,
                            Africa: 0,
                            'North America': 0,
                            'South America': 0,
                            Oceania: 0
                        };
                        hotels.forEach(function (hotel) {
                            // Simple continent detection based on country names
                            var country = hotel.country.toLowerCase();
                            if (['italy', 'france', 'spain', 'germany', 'uk', 'greece', 'portugal', 'croatia'].some(function (c) { return country.includes(c); })) {
                                continentBreakdown.Europe++;
                            }
                            else if (['japan', 'thailand', 'indonesia', 'china', 'singapore', 'malaysia'].some(function (c) { return country.includes(c); })) {
                                continentBreakdown.Asia++;
                            }
                            else if (['south africa', 'tanzania', 'morocco', 'egypt', 'kenya'].some(function (c) { return country.includes(c); })) {
                                continentBreakdown.Africa++;
                            }
                            else if (['united states', 'canada', 'mexico', 'jamaica'].some(function (c) { return country.includes(c); })) {
                                continentBreakdown['North America']++;
                            }
                            else if (['brazil', 'argentina', 'chile', 'peru', 'colombia'].some(function (c) { return country.includes(c); })) {
                                continentBreakdown['South America']++;
                            }
                            else if (['australia', 'new zealand', 'fiji', 'tahiti'].some(function (c) { return country.includes(c); })) {
                                continentBreakdown.Oceania++;
                            }
                        });
                        return [2 /*return*/, {
                                totalHotels: hotels.length,
                                countriesRepresented: countries.size,
                                citiesRepresented: cities.size,
                                continentBreakdown: continentBreakdown
                            }];
                }
            });
        });
    };
    return GlobalHotelFetcher;
}());
exports.GlobalHotelFetcher = GlobalHotelFetcher;
// CLI execution
if (require.main === module) {
    var fetcher = new GlobalHotelFetcher();
    var args = process.argv.slice(2);
    var continent = args[0];
    var maxHotelsPerCity = parseInt(args[1]) || 10;
    var continents = continent ? [continent] : ['europe', 'asia', 'africa', 'northAmerica', 'southAmerica', 'oceania'];
    fetcher.fetchGlobalHotels({
        continents: continents,
        maxHotelsPerCity: maxHotelsPerCity,
        batchSize: 50,
        skipExisting: true
    })
        .then(function (results) {
        console.log('\n🎉 Global hotel fetching completed!');
        console.log('Results:', results);
        process.exit(0);
    })
        .catch(function (error) {
        console.error('❌ Global hotel fetching failed:', error);
        process.exit(1);
    });
}
// GlobalHotelFetcher already exported above 

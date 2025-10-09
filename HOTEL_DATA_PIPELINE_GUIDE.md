# 🏨 COMPREHENSIVE HOTEL DATA PIPELINE GUIDE

## 🎯 Overview

This system implements a sophisticated hotel data pipeline that combines three powerful data sources:

1. **🌐 Web Scraping** - Discover hotels from major booking sites (Booking.com, TripAdvisor, Expedia, Hotels.com)
2. **💰 Amadeus API** - Get detailed hotel data, live pricing, and amenities
3. **📸 Google Places** - Fetch stunning, authentic hotel photos

The pipeline automatically processes hotels through all three phases, creating comprehensive hotel profiles with rich data and high-quality photos.

## 🚀 Quick Start

### 1. Start the API Server

```bash
cd /Users/ala/tindertravel/api
npm start
```

The server will run on `http://localhost:3001`

### 2. Run a Test Pipeline

```bash
# Test the pipeline with sample data
curl -X POST http://localhost:3001/api/pipeline/test
```

### 3. Run Full Pipeline for Specific Cities

```bash
# Process hotels for Paris, London, and Tokyo
curl -X POST http://localhost:3001/api/pipeline/run \
  -H "Content-Type: application/json" \
  -d '{
    "cities": ["Paris", "London", "Tokyo"],
    "maxHotelsPerCity": 25,
    "enableScraping": true,
    "enableAmadeusEnrichment": true,
    "enableGooglePhotos": true,
    "batchSize": 5
  }'
```

## 📋 API Endpoints

### Pipeline Status
```bash
GET /api/pipeline/status
```
Returns current pipeline status and statistics.

### Reset Pipeline
```bash
POST /api/pipeline/reset
```
Resets pipeline statistics and clears cache.

### Run Full Pipeline
```bash
POST /api/pipeline/run
```
Runs the complete pipeline with custom configuration.

**Parameters:**
- `cities` (array): Cities to process (default: ["Paris", "London", "New York", "Tokyo", "Rome"])
- `maxHotelsPerCity` (number): Max hotels per city (default: 50)
- `enableScraping` (boolean): Enable web scraping (default: true)
- `enableAmadeusEnrichment` (boolean): Enable Amadeus data enrichment (default: true)
- `enableGooglePhotos` (boolean): Enable Google Places photos (default: true)
- `batchSize` (number): Processing batch size (default: 10)

### Run Pipeline for Specific City
```bash
POST /api/pipeline/city/{cityName}
```
Process hotels for a specific city.

**Example:**
```bash
curl -X POST http://localhost:3001/api/pipeline/city/Paris \
  -H "Content-Type: application/json" \
  -d '{
    "maxHotels": 20,
    "batchSize": 3
  }'
```

### Test Pipeline
```bash
POST /api/pipeline/test
```
Run a small test with sample data.

## 🔧 Pipeline Architecture

### Phase 1: Web Scraping (🌐)
- Scrapes multiple hotel booking sites simultaneously
- Extracts hotel names, locations, and basic information
- Implements rate limiting and error handling
- Deduplicates results across sources

### Phase 2: Amadeus Enrichment (💰)
- Searches Amadeus API for matching hotels
- Retrieves live pricing, ratings, amenities
- Gets detailed hotel descriptions and coordinates
- Handles API rate limits and authentication

### Phase 3: Google Places Photos (📸)
- Finds exact hotel matches in Google Places
- Downloads high-quality photos (up to 8 per hotel)
- Validates photo quality and resolution
- Stores photos with metadata

### Phase 4: Database Storage (💾)
- Stores complete hotel profiles in Supabase
- Updates existing records or creates new ones
- Maintains data consistency and relationships

## 📊 Pipeline Statistics

The system tracks comprehensive statistics:

```json
{
  "total": 150,
  "successful": 135,
  "failed": 15,
  "sources": {
    "booking": 45,
    "tripadvisor": 38,
    "expedia": 42,
    "hotels": 25
  },
  "enriched": 120,
  "withPhotos": 110,
  "duplicates": 8,
  "errors": {
    "scraping": 3,
    "amadeus": 5,
    "googlePlaces": 7,
    "database": 0
  }
}
```

## 🛠️ Configuration Options

### Performance Tuning

```javascript
{
  // Concurrency and rate limiting
  "maxConcurrency": 3,
  "delayBetweenRequests": 1000,

  // Retry logic
  "maxRetries": 3,
  "timeout": 30000,

  // Processing options
  "batchSize": 10,
  "maxHotelsPerCity": 50
}
```

### Feature Toggles

```javascript
{
  // Enable/disable pipeline phases
  "enableScraping": true,
  "enableAmadeusEnrichment": true,
  "enableGooglePhotos": true,

  // Data source preferences
  "preferredSources": ["booking", "tripadvisor"],
  "skipDuplicates": true
}
```

## 🧪 Testing Framework

Run comprehensive tests:

```bash
cd /Users/ala/tindertravel/api
node test-hotel-pipeline.js
```

### Test Coverage

1. **Pipeline Status Check** - Verifies pipeline initialization
2. **Pipeline Reset** - Tests statistics reset functionality
3. **Small Pipeline Test** - Validates basic pipeline operation
4. **City-Specific Test** - Tests city-focused processing
5. **Configuration Validation** - Tests custom configurations
6. **Error Handling** - Validates error scenarios
7. **Performance Testing** - Measures processing speed

## 📈 Monitoring and Logging

### Real-time Monitoring

The pipeline provides real-time statistics:

```bash
# Get current status
curl http://localhost:3001/api/pipeline/status
```

### Performance Metrics

- **Hotels per second**: Processing throughput
- **Success rate**: Percentage of successful operations
- **Error breakdown**: Categorization of failures
- **Source distribution**: Hotels found per data source

### Logging

All pipeline operations are logged with:
- Timestamps and operation details
- Error messages and stack traces
- Performance metrics and statistics
- Data source attribution

## 🔍 Advanced Usage

### Custom City Processing

```bash
# Process only luxury hotels in specific cities
curl -X POST http://localhost:3001/api/pipeline/run \
  -H "Content-Type: application/json" \
  -d '{
    "cities": ["Dubai", "Singapore", "Hong Kong"],
    "maxHotelsPerCity": 30,
    "filterLuxury": true
  }'
```

### Batch Processing Optimization

```bash
# Optimize for large-scale processing
curl -X POST http://localhost:3001/api/pipeline/run \
  -H "Content-Type: application/json" \
  -d '{
    "cities": ["New York", "Los Angeles", "Chicago", "Miami"],
    "maxHotelsPerCity": 100,
    "batchSize": 20,
    "delayBetweenBatches": 5000
  }'
```

### Photo Quality Control

```bash
# Focus on high-quality photo fetching
curl -X POST http://localhost:3001/api/pipeline/run \
  -H "Content-Type: application/json" \
  -d '{
    "cities": ["Tokyo"],
    "maxHotelsPerCity": 15,
    "minPhotoQuality": "high",
    "maxPhotosPerHotel": 8
  }'
```

## 🚨 Error Handling

### Common Issues

1. **Rate Limiting**: Pipeline respects API limits and includes delays
2. **Network Errors**: Automatic retries with exponential backoff
3. **Duplicate Detection**: Intelligent deduplication prevents data conflicts
4. **Data Validation**: Input validation and error recovery

### Recovery Strategies

- **Partial Failures**: Continue processing other hotels if one fails
- **Retry Logic**: Automatic retries for transient errors
- **Graceful Degradation**: Continue with available data sources
- **Comprehensive Logging**: Detailed error reporting for debugging

## 📋 Integration Examples

### React Native App Integration

```javascript
// Fetch pipeline results in your app
const fetchPipelineResults = async () => {
  try {
    const response = await fetch('http://localhost:3001/api/pipeline/status');
    const data = await response.json();

    if (data.status === 'idle') {
      // Run pipeline
      const pipelineResponse = await fetch('http://localhost:3001/api/pipeline/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cities: ['Paris', 'London'],
          maxHotelsPerCity: 20
        })
      });

      const results = await pipelineResponse.json();
      console.log('Pipeline completed:', results);
    }
  } catch (error) {
    console.error('Pipeline integration error:', error);
  }
};
```

### Automated Scheduling

```bash
#!/bin/bash
# Daily pipeline run script

# Run pipeline for major cities
curl -X POST http://localhost:3001/api/pipeline/run \
  -H "Content-Type: application/json" \
  -d '{
    "cities": ["Paris", "London", "New York", "Tokyo", "Rome", "Barcelona"],
    "maxHotelsPerCity": 50,
    "enableScraping": true,
    "enableAmadeusEnrichment": true,
    "enableGooglePhotos": true
  }'

# Log results
echo "$(date): Pipeline completed" >> pipeline.log

# Reset stats for next run
curl -X POST http://localhost:3001/api/pipeline/reset
```

## 🎯 Best Practices

### 1. Start Small
- Begin with test runs using `/api/pipeline/test`
- Process one city at a time initially
- Monitor performance and adjust batch sizes

### 2. Monitor Resources
- Watch API rate limits and quotas
- Monitor database storage and performance
- Track memory usage for large batch processing

### 3. Data Quality
- Regularly review scraped data for accuracy
- Validate photo quality and relevance
- Monitor duplicate detection effectiveness

### 4. Error Recovery
- Implement proper error handling in your application
- Use retry logic for transient failures
- Log errors for debugging and monitoring

## 🚀 Production Deployment

### Environment Variables

```bash
# API Keys and Configuration
AMADEUS_CLIENT_ID=your_amadeus_client_id
AMADEUS_CLIENT_SECRET=your_amadeus_client_secret
GOOGLE_PLACES_API_KEY=your_google_places_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key

# Pipeline Configuration
PIPELINE_MAX_CONCURRENCY=3
PIPELINE_DELAY_BETWEEN_REQUESTS=1000
PIPELINE_MAX_RETRIES=3
PIPELINE_TIMEOUT=30000
```

### Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3001
CMD ["npm", "start"]
```

### Health Monitoring

```bash
#!/bin/bash
# Health check script

STATUS=$(curl -s http://localhost:3001/health | jq -r '.status')

if [ "$STATUS" = "ok" ]; then
    echo "✅ API is healthy"

    # Check pipeline status
    PIPELINE_STATUS=$(curl -s http://localhost:3001/api/pipeline/status | jq -r '.status')

    if [ "$PIPELINE_STATUS" != "null" ]; then
        echo "✅ Pipeline is available"
    else
        echo "❌ Pipeline not available"
    fi
else
    echo "❌ API is not healthy"
    exit 1
fi
```

## 📚 Troubleshooting

### Common Issues

1. **Pipeline Not Starting**
   - Check API server logs for initialization errors
   - Verify environment variables are set correctly
   - Ensure all required services (Amadeus, Google Places, Supabase) are accessible

2. **Slow Performance**
   - Reduce batch size (`batchSize: 5` or lower)
   - Increase delays between requests
   - Check network connectivity and API response times

3. **High Error Rates**
   - Review error logs for specific failure patterns
   - Check API quotas and rate limits
   - Verify data source availability

4. **Duplicate Hotels**
   - Review deduplication logic and hotel keys
   - Check for variations in hotel naming
   - Monitor cache effectiveness

### Debug Mode

Enable detailed logging:

```bash
DEBUG=pipeline:* npm start
```

### Log Analysis

```bash
# Check for errors
tail -f /path/to/api/logs | grep ERROR

# Monitor performance
tail -f /path/to/api/logs | grep "Processing time"

# Track success rates
tail -f /path/to/api/logs | grep -E "(✅|❌)"
```

## 🔮 Future Enhancements

### Planned Features

1. **Advanced Filtering**: Filter by hotel type, price range, amenities
2. **Real-time Updates**: Scheduled pipeline runs with incremental updates
3. **Machine Learning**: Smart hotel matching and quality scoring
4. **Caching Layer**: Redis integration for improved performance
5. **Analytics Dashboard**: Visual monitoring and reporting interface

### Integration Opportunities

1. **External APIs**: Integration with additional hotel data sources
2. **Content Enhancement**: AI-powered description generation
3. **Image Processing**: Advanced photo optimization and compression
4. **Geospatial Features**: Location-based filtering and mapping

## 💬 Support

For issues or questions:

1. Check the troubleshooting guide above
2. Review API logs for error details
3. Test with the provided test framework
4. Monitor pipeline statistics for performance insights

---

**🎉 Happy Hotel Hunting!** The comprehensive hotel data pipeline is ready to discover and enrich hotel data from multiple sources, providing your application with rich, accurate, and visually appealing hotel information.

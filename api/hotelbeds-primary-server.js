const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { createHotelbedsPrimaryEndpoint } = require('./src/hotelbeds-primary-endpoint.js');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Hotelbeds Primary Endpoint
app.use('/api/hotels', createHotelbedsPrimaryEndpoint());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    source: 'hotelbeds-primary',
    priorityPhotos: true,
    photoQuality: 'XXL (2048px)',
    generalViewsFirst: true
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Hotelbeds Primary API Server',
    version: '1.0.0',
    features: [
      'Priority Photos (General Views First)',
      'XXL Quality (2048px)',
      'Graceful Fallback',
      'Rate Limit Handling'
    ],
    endpoints: {
      hotels: '/api/hotels',
      status: '/api/hotels/status',
      seed: 'POST /api/hotels/seed',
      health: '/health'
    }
  });
});

// Start server
app.listen(port, () => {
  console.log('🏨 HOTELBEDS PRIMARY API SERVER');
  console.log('=' .repeat(50));
  console.log(`🚀 Server running on port ${port}`);
  console.log(`📡 API endpoint: http://localhost:${port}/api/hotels`);
  console.log(`🔍 Status: http://localhost:${port}/api/hotels/status`);
  console.log(`🌱 Seed: POST http://localhost:${port}/api/hotels/seed`);
  console.log(`❤️ Health: http://localhost:${port}/health`);
  console.log('=' .repeat(50));
  console.log('✅ READY TO SERVE HOTELS WITH PRIORITY PHOTOS!');
  console.log('🔥 General views will be displayed FIRST');
  console.log('📸 XXL quality (2048px) for maximum resolution');
  console.log('🔄 Graceful fallback on rate limits');
  console.log('🎯 Perfect for your app integration');
  console.log('=' .repeat(50));
});

module.exports = app;

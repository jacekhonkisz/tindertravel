const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { createHotelbedsEndpoint } = require('./src/hotelbeds-endpoint.js');

const app = express();
const port = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Hotelbeds endpoint
app.use('/api/hotels', createHotelbedsEndpoint());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    source: 'hotelbeds',
    priorityPhotos: true,
    photoQuality: 'XXL (2048px)'
  });
});

// Start server
app.listen(port, () => {
  console.log('🏨 Hotelbeds Primary API Server');
  console.log('=' .repeat(40));
  console.log(`🚀 Server running on port ${port}`);
  console.log(`📡 API endpoint: http://localhost:${port}/api/hotels`);
  console.log(`🔍 Status: http://localhost:${port}/api/hotels/status`);
  console.log(`🌱 Seed: POST http://localhost:${port}/api/hotels/seed`);
  console.log('=' .repeat(40));
  console.log('✅ Ready to serve hotels with priority photos!');
  console.log('🔥 General views will be displayed FIRST');
  console.log('📸 XXL quality (2048px) for maximum resolution');
});

module.exports = app;

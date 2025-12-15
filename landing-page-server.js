const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Enable CORS for API calls
app.use(cors());

// Serve static files
app.use(express.static('.'));

// Serve the landing page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'landing-page.html'));
});

// Mock API endpoint for demonstration (when real API is not available)
app.get('/api/hotels', (req, res) => {
    const limit = parseInt(req.query.limit) || 4;
    
    // Mock luxury hotel data with real photo URLs
    const mockHotels = [
        {
            id: 'luxury-1',
            name: 'Gran Hotel Bahia del Duque',
            city: 'Costa Adeje',
            country: 'Spain',
            rating: 5,
            price: { min: 700, max: 1200, currency: 'USD' },
            photos: [
                'https://photos.hotelbeds.com/giata/xxl/00/000030/000030a_hb_a_001.jpg',
                'https://photos.hotelbeds.com/giata/xxl/00/000030/000030a_hb_a_002.jpg',
                'https://photos.hotelbeds.com/giata/xxl/00/000030/000030a_hb_p_001.jpg'
            ],
            description: 'Exclusive beachfront resort with luxury amenities'
        },
        {
            id: 'luxury-2',
            name: 'Hotel Arts Barcelona',
            city: 'Barcelona',
            country: 'Spain',
            rating: 5,
            price: { min: 600, max: 1000, currency: 'USD' },
            photos: [
                'https://photos.hotelbeds.com/giata/xxl/00/000025/000025a_hb_a_001.jpg',
                'https://photos.hotelbeds.com/giata/xxl/00/000025/000025a_hb_a_002.jpg',
                'https://photos.hotelbeds.com/giata/xxl/00/000025/000025a_hb_ro_001.jpg'
            ],
            description: 'Luxury beachfront hotel with Michelin-starred dining'
        },
        {
            id: 'luxury-3',
            name: 'Hotel Riu Palace Tenerife',
            city: 'Adeje',
            country: 'Spain',
            rating: 5,
            price: { min: 500, max: 800, currency: 'USD' },
            photos: [
                'https://photos.hotelbeds.com/giata/xxl/00/000010/000010a_hb_a_001.jpg',
                'https://photos.hotelbeds.com/giata/xxl/00/000010/000010a_hb_a_002.jpg',
                'https://photos.hotelbeds.com/giata/xxl/00/000010/000010a_hb_p_001.jpg'
            ],
            description: 'Luxury beachfront resort with stunning ocean views'
        },
        {
            id: 'luxury-4',
            name: 'Iberostar Selection Playa de Palma',
            city: 'Palma',
            country: 'Spain',
            rating: 4,
            price: { min: 400, max: 700, currency: 'USD' },
            photos: [
                'https://photos.hotelbeds.com/giata/xxl/00/000020/000020a_hb_a_001.jpg',
                'https://photos.hotelbeds.com/giata/xxl/00/000020/000020a_hb_a_002.jpg',
                'https://photos.hotelbeds.com/giata/xxl/00/000020/000020a_hb_p_001.jpg'
            ],
            description: 'Beachfront resort with all-inclusive luxury'
        }
    ];
    
    res.json({
        hotels: mockHotels.slice(0, limit),
        total: mockHotels.length,
        limit: limit,
        source: 'mock-luxury-hotels',
        message: 'Luxury hotels for landing page mockup'
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 Landing page server running at http://localhost:${PORT}`);
    console.log(`📱 Open http://localhost:${PORT} to see the mockup`);
    console.log(`🔗 API endpoint: http://localhost:${PORT}/api/hotels`);
});

module.exports = app;


const express = require('express');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const app = express();

// Import items data
const items = require('./items.json');

// Basic security headers
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Enable CORS
app.use(cors());

// API Routes

// GET /api/items - Get all items
app.get('/api/items', (req, res) => {
    const { name, members, shop } = req.query;
    let filteredItems = items.items;

    // Filter by name
    if (name) {
        filteredItems = filteredItems.filter(item => 
            item.name.toLowerCase().includes(name.toLowerCase())
        );
    }

    // Filter by members
    if (members !== undefined) {
        filteredItems = filteredItems.filter(item => 
            item.members === members.toString()
        );
    }

    // Filter by shop availability
    if (shop !== undefined) {
        filteredItems = filteredItems.filter(item => 
            item.shop === shop.toString()
        );
    }

    res.json({
        total: filteredItems.length,
        items: filteredItems
    });
});

// GET /api/items/:name - Get specific item by name
app.get('/api/items/:name', (req, res) => {
    const item = items.items.find(item => 
        item.name.toLowerCase() === req.params.name.toLowerCase()
    );
    
    if (!item) {
        return res.status(404).json({ error: 'Item not found' });
    }
    
    res.json(item);
});

// API Documentation route
app.get('/', (req, res) => {
    res.send(`
        <h1>RuneScape Items API</h1>
        <h2>Available Endpoints:</h2>
        <ul>
            <li>GET /api/items - Get all items</li>
            <li>GET /api/items?name={search} - Search items by name</li>
            <li>GET /api/items?members={true/false} - Filter by member status</li>
            <li>GET /api/items?shop={true/false} - Filter by shop availability</li>
            <li>GET /api/items/:name - Get specific item by exact name</li>
        </ul>
    `);
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something broke!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();

// Enable CORS for all requests
app.use(cors());

// Rate limiting configuration
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per window
});
app.use(limiter);

// Load items data
const itemsData = require('./items.json');

// Utility function to parse numeric values from string
const parseNumericValue = (value) => {
    if (!value) return 0;
    // Remove commas and any non-numeric characters except decimals
    return parseInt(value.replace(/[^0-9.]/g, ''));
};

// Homepage with API documentation
app.get('/', (req, res) => {
    res.send(`
        <html>
            <head>
                <title>RuneScape Items API</title>
                <style>
                    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
                    code { background: #f4f4f4; padding: 2px 5px; border-radius: 3px; }
                    .example { margin-top: 10px; }
                </style>
            </head>
            <body>
                <h1>RuneScape Items API</h1>
                <h2>Available Endpoints</h2>
                
                <h3>GET /api/items</h3>
                <p>Get all items with optional filtering</p>
                <p>Query Parameters:</p>
                <ul>
                    <li><code>name</code> - Filter items by name (case-insensitive)</li>
                    <li><code>members</code> - Filter by members-only status (true/false)</li>
                    <li><code>shop</code> - Filter by shop availability (true/false)</li>
                    <li><code>minStreetPrice</code> - Filter items with street price >= value</li>
                    <li><code>maxStreetPrice</code> - Filter items with street price <= value</li>
                    <li><code>minHighAlch</code> - Filter items with high alchemy >= value</li>
                    <li><code>maxHighAlch</code> - Filter items with high alchemy <= value</li>
                    <li><code>minLowAlch</code> - Filter items with low alchemy >= value</li>
                    <li><code>maxLowAlch</code> - Filter items with low alchemy <= value</li>
                </ul>

                <div class="example">
                    <h4>Example Requests:</h4>
                    <ul>
                        <li><code>/api/items?name=rune</code> - Search for rune items</li>
                        <li><code>/api/items?minStreetPrice=10000</code> - Items worth 10k or more</li>
                        <li><code>/api/items?minHighAlch=5000&maxHighAlch=10000</code> - Items with high alchemy between 5k-10k</li>
                        <li><code>/api/items?name=rune&members=false&minStreetPrice=20000</code> - Non-member rune items worth 20k+</li>
                    </ul>
                </div>

                <h3>GET /api/items/:name</h3>
                <p>Get a specific item by exact name</p>
                <p>Example: <code>/api/items/Rune%20Sword</code></p>
            </body>
        </html>
    `);
});

// GET /api/items - Get all items with optional filtering
app.get('/api/items', (req, res) => {
    try {
        const { 
            name, 
            members, 
            shop,
            minStreetPrice,
            maxStreetPrice,
            minHighAlch,
            maxHighAlch,
            minLowAlch,
            maxLowAlch
        } = req.query;

        let filteredItems = itemsData.items;

        // Basic filters
        if (name) {
            filteredItems = filteredItems.filter(item => 
                item.name.toLowerCase().includes(name.toLowerCase())
            );
        }

        if (members !== undefined) {
            filteredItems = filteredItems.filter(item => 
                item.members === members.toString()
            );
        }

        if (shop !== undefined) {
            filteredItems = filteredItems.filter(item => 
                item.shop === shop.toString()
            );
        }

        // Price filters
        if (minStreetPrice !== undefined) {
            filteredItems = filteredItems.filter(item => 
                parseNumericValue(item.street_price) >= parseInt(minStreetPrice)
            );
        }

        if (maxStreetPrice !== undefined) {
            filteredItems = filteredItems.filter(item => 
                parseNumericValue(item.street_price) <= parseInt(maxStreetPrice)
            );
        }

        // High alchemy filters
        if (minHighAlch !== undefined) {
            filteredItems = filteredItems.filter(item => 
                parseNumericValue(item.high_alchemy) >= parseInt(minHighAlch)
            );
        }

        if (maxHighAlch !== undefined) {
            filteredItems = filteredItems.filter(item => 
                parseNumericValue(item.high_alchemy) <= parseInt(maxHighAlch)
            );
        }

        // Low alchemy filters
        if (minLowAlch !== undefined) {
            filteredItems = filteredItems.filter(item => 
                parseNumericValue(item.low_alchemy) >= parseInt(minLowAlch)
            );
        }

        if (maxLowAlch !== undefined) {
            filteredItems = filteredItems.filter(item => 
                parseNumericValue(item.low_alchemy) <= parseInt(maxLowAlch)
            );
        }

        res.json({
            total: filteredItems.length,
            items: filteredItems
        });
    } catch (error) {
        console.error('Error processing items request:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
});

// GET /api/items/:name - Get specific item by name
app.get('/api/items/:name', (req, res) => {
    try {
        const requestedName = req.params.name.toLowerCase();
        const item = itemsData.items.find(item => 
            item.name.toLowerCase() === requestedName
        );

        if (!item) {
            return res.status(404).json({ 
                error: 'Item not found',
                message: `No item found with name: ${req.params.name}`
            });
        }

        res.json(item);
    } catch (error) {
        console.error('Error fetching specific item:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
});

// Handle 404 errors for any unmatched routes
app.use((req, res) => {
    res.status(404).json({ 
        error: 'Not Found',
        message: 'The requested endpoint does not exist'
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: 'Internal Server Error',
        message: 'Something went wrong on the server'
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Total items loaded: ${itemsData.total_items}`);
});
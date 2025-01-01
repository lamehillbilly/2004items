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

// Homepage with API documentation
app.get('/', (req, res) => {
    res.send(`
        <html>
            <head>
                <title>RuneScape Items API</title>
                <style>
                    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
                    code { background: #f4f4f4; padding: 2px 5px; border-radius: 3px; }
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
                </ul>
                <p>Example: <code>/api/items?name=rune&members=false</code></p>

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
        const { name, members, shop } = req.query;
        let filteredItems = itemsData.items;

        // Apply filters if provided
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

        res.json({
            total: filteredItems.length,
            items: filteredItems
        });
    } catch (error) {
        console.error('Error processing items request:', error);
        res.status(500).json({ error: 'Internal server error' });
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
        res.status(500).json({ error: 'Internal server error' });
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
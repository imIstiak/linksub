const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve static files from current directory

// Initialize SQLite database
const db = new sqlite3.Database('./products.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
    
    // Create products table if it doesn't exist
    db.run(`CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_code TEXT UNIQUE NOT NULL,
      link TEXT NOT NULL,
      rmb_price REAL NOT NULL,
      weight REAL NOT NULL,
      selling_price REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
  }
});

// Generate product code in format #LT001, #LT002, etc.
function generateProductCode() {
  const randomNum = Math.floor(Math.random() * 999) + 1;
  return `#LT${randomNum.toString().padStart(3, '0')}`;
}

// Helper function to check if product code exists
function checkProductCodeExists(productCode) {
  return new Promise((resolve, reject) => {
    db.get('SELECT product_code FROM products WHERE product_code = ?', [productCode], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(!!row);
      }
    });
  });
}

// Generate unique product code
async function generateUniqueProductCode() {
  let productCode;
  let exists = true;
  
  while (exists) {
    productCode = generateProductCode();
    exists = await checkProductCodeExists(productCode);
  }
  
  return productCode;
}

// Routes

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Save new product
app.post('/api/products', async (req, res) => {
  try {
    const { link, rmbPrice, weight, sellingPrice } = req.body;
    
    // Validation
    if (!link || !rmbPrice || !weight || !sellingPrice) {
      return res.status(400).json({ 
        message: 'Missing required fields: link, rmbPrice, weight, sellingPrice' 
      });
    }

    // Generate unique product code
    const productCode = await generateUniqueProductCode();
    
    // Insert into database
    db.run(
      'INSERT INTO products (product_code, link, rmb_price, weight, selling_price) VALUES (?, ?, ?, ?, ?)',
      [productCode, link, rmbPrice, weight, sellingPrice],
      function(err) {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ message: 'Database error' });
        }
        
        res.json({
          success: true,
          productCode: productCode,
          id: this.lastID,
          message: 'Product saved successfully'
        });
      }
    );
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all products
app.get('/api/products', (req, res) => {
  db.all(
    'SELECT * FROM products ORDER BY created_at DESC',
    [],
    (err, rows) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Database error' });
      }
      
      res.json(rows);
    }
  );
});

// Get product by code
app.get('/api/products/:code', (req, res) => {
  const productCode = req.params.code;
  
  db.get(
    'SELECT * FROM products WHERE product_code = ?',
    [productCode],
    (err, row) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Database error' });
      }
      
      if (!row) {
        return res.status(404).json({ message: 'Product not found' });
      }
      
      res.json(row);
    }
  );
});

// Search products
app.get('/api/products/search/:query', (req, res) => {
  const query = req.params.query;
  
  db.all(
    'SELECT * FROM products WHERE product_code LIKE ? OR link LIKE ? ORDER BY created_at DESC',
    [`%${query}%`, `%${query}%`],
    (err, rows) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Database error' });
      }
      
      res.json(rows);
    }
  );
});

// Delete product
app.delete('/api/products/:code', (req, res) => {
  const productCode = req.params.code;
  
  db.run(
    'DELETE FROM products WHERE product_code = ?',
    [productCode],
    function(err) {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Database error' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ message: 'Product not found' });
      }
      
      res.json({ message: 'Product deleted successfully' });
    }
  );
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed');
    }
    process.exit(0);
  });
});
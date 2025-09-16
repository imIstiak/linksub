const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve static files from current directory

// Database setup - PostgreSQL for production, SQLite for local
let db;
const isProduction = process.env.NODE_ENV === 'production' || process.env.DATABASE_URL;

if (isProduction) {
  // PostgreSQL for production (Vercel)
  const { Pool } = require('pg');
  
  db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  // Create table if it doesn't exist
  const createTable = async () => {
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS products (
          id SERIAL PRIMARY KEY,
          product_code VARCHAR(50) UNIQUE NOT NULL,
          link TEXT NOT NULL,
          rmb_price DECIMAL(10,2) NOT NULL,
          weight DECIMAL(10,3) NOT NULL,
          selling_price DECIMAL(10,2) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('Connected to PostgreSQL database');
    } catch (err) {
      console.error('Error creating PostgreSQL table:', err);
    }
  };
  createTable();

} else {
  // SQLite for local development
  const sqlite3 = require('sqlite3').verbose();
  
  db = new sqlite3.Database('./products.db', (err) => {
    if (err) {
      console.error('Error opening SQLite database:', err.message);
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
}

// Generate product code in format #LT001, #LT002, etc.
function generateProductCode() {
  const randomNum = Math.floor(Math.random() * 999) + 1;
  return `#LT${randomNum.toString().padStart(3, '0')}`;
}

// Helper function to check if product code exists
async function checkProductCodeExists(productCode) {
  if (isProduction) {
    const result = await db.query('SELECT product_code FROM products WHERE product_code = $1', [productCode]);
    return result.rows.length > 0;
  } else {
    return new Promise((resolve, reject) => {
      db.get('SELECT product_code FROM products WHERE product_code = ?', [productCode], (err, row) => {
        if (err) reject(err);
        else resolve(!!row);
      });
    });
  }
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
    
    if (isProduction) {
      // PostgreSQL
      const result = await db.query(
        'INSERT INTO products (product_code, link, rmb_price, weight, selling_price) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [productCode, link, rmbPrice, weight, sellingPrice]
      );
      
      res.json({
        success: true,
        productCode: productCode,
        id: result.rows[0].id,
        message: 'Product saved successfully'
      });
    } else {
      // SQLite
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
    }
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all products
app.get('/api/products', async (req, res) => {
  try {
    if (isProduction) {
      // PostgreSQL
      const result = await db.query('SELECT * FROM products ORDER BY created_at DESC');
      res.json(result.rows);
    } else {
      // SQLite
      db.all('SELECT * FROM products ORDER BY created_at DESC', [], (err, rows) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ message: 'Database error' });
        }
        res.json(rows);
      });
    }
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get product by code
app.get('/api/products/:code', async (req, res) => {
  try {
    const productCode = req.params.code;
    
    if (isProduction) {
      // PostgreSQL
      const result = await db.query('SELECT * FROM products WHERE product_code = $1', [productCode]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Product not found' });
      }
      
      res.json(result.rows[0]);
    } else {
      // SQLite
      db.get('SELECT * FROM products WHERE product_code = ?', [productCode], (err, row) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ message: 'Database error' });
        }
        
        if (!row) {
          return res.status(404).json({ message: 'Product not found' });
        }
        
        res.json(row);
      });
    }
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Search products
app.get('/api/products/search/:query', async (req, res) => {
  try {
    const query = req.params.query;
    
    if (isProduction) {
      // PostgreSQL
      const result = await db.query(
        'SELECT * FROM products WHERE product_code ILIKE $1 OR link ILIKE $2 ORDER BY created_at DESC',
        [`%${query}%`, `%${query}%`]
      );
      res.json(result.rows);
    } else {
      // SQLite
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
    }
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete product
app.delete('/api/products/:code', async (req, res) => {
  try {
    const productCode = req.params.code;
    
    if (isProduction) {
      // PostgreSQL
      const result = await db.query('DELETE FROM products WHERE product_code = $1', [productCode]);
      
      if (result.rowCount === 0) {
        return res.status(404).json({ message: 'Product not found' });
      }
      
      res.json({ message: 'Product deleted successfully' });
    } else {
      // SQLite
      db.run('DELETE FROM products WHERE product_code = ?', [productCode], function(err) {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ message: 'Database error' });
        }
        
        if (this.changes === 0) {
          return res.status(404).json({ message: 'Product not found' });
        }
        
        res.json({ message: 'Product deleted successfully' });
      });
    }
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Database: ${isProduction ? 'PostgreSQL' : 'SQLite'}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  if (isProduction) {
    db.end(() => {
      console.log('PostgreSQL connection closed');
      process.exit(0);
    });
  } else {
    db.close((err) => {
      if (err) {
        console.error('Error closing SQLite database:', err.message);
      } else {
        console.log('SQLite database connection closed');
      }
      process.exit(0);
    });
  }
});
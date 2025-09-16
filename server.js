const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve static files from current directory

// Google Sheets setup
let doc;
let sheet;

const initializeGoogleSheets = async () => {
  try {
    if (process.env.GOOGLE_SHEET_ID && process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
      // Production: Use service account
      const serviceAccountAuth = new JWT({
        email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);
      await doc.loadInfo();
      
      // Get or create the products sheet
      sheet = doc.sheetsByTitle['Products'] || await doc.addSheet({ 
        title: 'Products',
        headerValues: ['Product Code', 'Link', 'RMB Price', 'Weight (kg)', 'Selling Price (BDT)', 'Created At']
      });

      console.log('Connected to Google Sheets:', doc.title);
    } else {
      console.log('Google Sheets not configured - running without database');
    }
  } catch (error) {
    console.error('Error initializing Google Sheets:', error.message);
    console.log('Running without Google Sheets database');
  }
};

// Initialize on startup
initializeGoogleSheets();

// Generate product code in format #LT001, #LT002, etc.
function generateProductCode() {
  const randomNum = Math.floor(Math.random() * 999) + 1;
  return `#LT${randomNum.toString().padStart(3, '0')}`;
}

// Helper function to check if product code exists
async function checkProductCodeExists(productCode) {
  if (!sheet) return false;
  
  try {
    const rows = await sheet.getRows();
    return rows.some(row => row.get('Product Code') === productCode);
  } catch (error) {
    console.error('Error checking product code:', error);
    return false;
  }
}

// Generate unique product code
async function generateUniqueProductCode() {
  let productCode;
  let exists = true;
  let attempts = 0;
  
  while (exists && attempts < 10) {
    productCode = generateProductCode();
    exists = await checkProductCodeExists(productCode);
    attempts++;
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

    if (!sheet) {
      return res.status(500).json({ message: 'Google Sheets not configured' });
    }

    // Generate unique product code
    const productCode = await generateUniqueProductCode();
    const createdAt = new Date().toISOString();
    
    // Add row to Google Sheets
    await sheet.addRow({
      'Product Code': productCode,
      'Link': link,
      'RMB Price': parseFloat(rmbPrice),
      'Weight (kg)': parseFloat(weight),
      'Selling Price (BDT)': parseFloat(sellingPrice),
      'Created At': createdAt
    });

    res.json({
      success: true,
      productCode: productCode,
      message: 'Product saved successfully to Google Sheets'
    });
    
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// Get all products
app.get('/api/products', async (req, res) => {
  try {
    if (!sheet) {
      return res.json([]);
    }

    const rows = await sheet.getRows();
    
    const products = rows.map(row => ({
      id: row.rowNumber,
      product_code: row.get('Product Code'),
      link: row.get('Link'),
      rmb_price: parseFloat(row.get('RMB Price')) || 0,
      weight: parseFloat(row.get('Weight (kg)')) || 0,
      selling_price: parseFloat(row.get('Selling Price (BDT)')) || 0,
      created_at: row.get('Created At')
    }));

    // Sort by created date (newest first)
    products.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json(products);
    
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// Get product by code
app.get('/api/products/:code', async (req, res) => {
  try {
    const productCode = req.params.code;
    
    if (!sheet) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const rows = await sheet.getRows();
    const row = rows.find(r => r.get('Product Code') === productCode);
    
    if (!row) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const product = {
      id: row.rowNumber,
      product_code: row.get('Product Code'),
      link: row.get('Link'),
      rmb_price: parseFloat(row.get('RMB Price')) || 0,
      weight: parseFloat(row.get('Weight (kg)')) || 0,
      selling_price: parseFloat(row.get('Selling Price (BDT)')) || 0,
      created_at: row.get('Created At')
    };

    res.json(product);
    
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// Search products
app.get('/api/products/search/:query', async (req, res) => {
  try {
    const query = req.params.query.toLowerCase();
    
    if (!sheet) {
      return res.json([]);
    }

    const rows = await sheet.getRows();
    
    const filteredProducts = rows
      .filter(row => {
        const productCode = (row.get('Product Code') || '').toLowerCase();
        const link = (row.get('Link') || '').toLowerCase();
        return productCode.includes(query) || link.includes(query);
      })
      .map(row => ({
        id: row.rowNumber,
        product_code: row.get('Product Code'),
        link: row.get('Link'),
        rmb_price: parseFloat(row.get('RMB Price')) || 0,
        weight: parseFloat(row.get('Weight (kg)')) || 0,
        selling_price: parseFloat(row.get('Selling Price (BDT)')) || 0,
        created_at: row.get('Created At')
      }));

    // Sort by created date (newest first)
    filteredProducts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json(filteredProducts);
    
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// Delete product
app.delete('/api/products/:code', async (req, res) => {
  try {
    const productCode = req.params.code;
    
    if (!sheet) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const rows = await sheet.getRows();
    const row = rows.find(r => r.get('Product Code') === productCode);
    
    if (!row) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await row.delete();
    res.json({ message: 'Product deleted successfully' });
    
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    database: sheet ? 'Google Sheets connected' : 'No database configured',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Database: ${sheet ? 'Google Sheets' : 'Not configured'}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Server shutting down gracefully...');
  process.exit(0);
});
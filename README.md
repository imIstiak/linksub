# RMB to BDT Pricing Calculator with Product Database

A comprehensive pricing calculator that converts Chinese product prices (RMB) to Bangladeshi selling prices (BDT) with a complete product database system.

## Features

- **Price Calculation**: Convert RMB prices to BDT with all associated costs
- **Product Database**: Store and manage product information
- **Product Codes**: Auto-generated unique codes (#LT001, #LT002, etc.)
- **Search & Filter**: Find products by code or URL
- **Remote Access**: Backend database accessible from anywhere

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Start the Server

```bash
npm start
```

Or for development with auto-restart:

```bash
npm run dev
```

### 3. Access the Application

Open your browser and go to: `http://localhost:3000`

## API Endpoints

- `POST /api/products` - Save new product
- `GET /api/products` - Get all products
- `GET /api/products/:code` - Get product by code
- `GET /api/products/search/:query` - Search products
- `DELETE /api/products/:code` - Delete product

## Database Schema

The SQLite database stores:
- `product_code` - Unique identifier (#LT001, #LT002, etc.)
- `link` - Product URL
- `rmb_price` - Product price in RMB
- `weight` - Product weight in kg
- `selling_price` - Calculated selling price in BDT
- `created_at` - Timestamp

## Pricing Formula

**Variable Costs:**
- Product cost: RMB Price × 18
- Courier cost: Courier RMB × 18
- Agent commission: 15% of (Product + Courier costs)
- Weight charges: Weight × 750 BDT per kg
- Packing cost: 10 BDT fixed

**Fixed Costs (per unit):**
- Salary per unit: Monthly Salary ÷ Monthly Units
- Advertising per unit: (Ad Budget × 125) ÷ Monthly Units

**Final Price:**
Total Landing Cost = Variable Costs + Fixed Costs
Selling Price = Landing Cost × (1 + Profit Margin%)

## Usage

1. Enter product link, RMB price, and weight
2. Adjust profit margin and other settings as needed
3. Click "Save Product to Database" to store
4. Use the search function to find saved products
5. View all products in the database table

## File Structure

```
├── index.html          # Frontend application
├── server.js           # Backend server
├── package.json        # Dependencies
├── products.db         # SQLite database (auto-created)
└── README.md          # This file
```

## Constants

- RMB to BDT rate: 18
- Agent commission: 15%
- Weight cost: 750 BDT/kg
- Packing cost: 10 BDT
- USD to BDT rate: 125
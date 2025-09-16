# Database Setup Guide for Vercel Deployment

## 🎯 Database Options

### Option 1: PostgreSQL (Recommended for Production)

#### Step 1: Choose a PostgreSQL Provider

**🔥 Neon (Recommended - Free tier)**
1. Go to https://neon.tech
2. Sign up with GitHub
3. Create new project: "rmb-calculator"
4. Copy connection string

**🔷 Supabase (Alternative - Free tier)**
1. Go to https://supabase.com
2. Sign up with GitHub
3. Create new project
4. Go to Settings → Database → Connection string

**🚂 Railway (Alternative - Free tier)**
1. Go to https://railway.app
2. Sign up with GitHub
3. Create PostgreSQL database
4. Copy connection string

#### Step 2: Configure Environment Variables

1. **Copy the connection string** from your provider
2. **In Vercel Dashboard:**
   - Go to your project settings
   - Navigate to "Environment Variables"
   - Add: `DATABASE_URL` = your connection string
   - Add: `NODE_ENV` = production

#### Step 3: Update Your Code

Replace `server.js` with `server-with-postgres.js`:

```bash
# Backup current server
mv server.js server-sqlite.js

# Use PostgreSQL version
mv server-with-postgres.js server.js
```

#### Step 4: Deploy

```bash
git add .
git commit -m "Add PostgreSQL database support"
git push origin master
```

Vercel will automatically redeploy with PostgreSQL!

---

### Option 2: Google Sheets (Simple & Free)

#### Pros:
✅ 100% Free forever
✅ Easy to view/edit data manually
✅ No database setup required
✅ Perfect for small projects

#### Cons:
❌ Slower than real database
❌ API rate limits
❌ Less secure for sensitive data

#### Implementation:
1. Create Google Sheets API credentials
2. Set up service account
3. Create sheet with columns: product_code, link, rmb_price, weight, selling_price
4. Update server.js to use Google Sheets API

Would you like me to implement Google Sheets option?

---

## 🚀 Quick Start (PostgreSQL)

### 1. Get Free PostgreSQL from Neon:
```
1. Visit: https://neon.tech
2. Sign up with GitHub
3. Create project: "rmb-calculator"
4. Copy connection string (starts with postgresql://)
```

### 2. Add to Vercel:
```
1. Go to Vercel Dashboard
2. Your project → Settings → Environment Variables
3. Add: DATABASE_URL = your_connection_string
4. Add: NODE_ENV = production
```

### 3. Deploy:
```bash
mv server.js server-sqlite-backup.js
mv server-with-postgres.js server.js
git add .
git commit -m "Switch to PostgreSQL"
git push origin master
```

## 🔍 Testing

After deployment:
1. Visit your Vercel URL
2. Add a product
3. Check if it persists after page refresh
4. Verify in your PostgreSQL dashboard

## 📊 Database Schema

```sql
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  product_code VARCHAR(50) UNIQUE NOT NULL,
  link TEXT NOT NULL,
  rmb_price DECIMAL(10,2) NOT NULL,
  weight DECIMAL(10,3) NOT NULL,
  selling_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🆘 Troubleshooting

**Connection Issues:**
- Check DATABASE_URL format
- Ensure SSL is enabled for production
- Verify environment variables in Vercel

**Local Development:**
- Will use SQLite automatically
- PostgreSQL only activates in production
- No changes needed for local development
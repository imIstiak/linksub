# 📊 Google Sheets Database Setup Guide

## 🎯 Complete Setup Instructions

### Step 1: Create Google Sheet

1. **Go to Google Sheets**: https://sheets.google.com
2. **Create new spreadsheet**
3. **Name it**: "RMB Product Database" (or any name you prefer)
4. **Note the Sheet ID** from URL:
   ```
   https://docs.google.com/spreadsheets/d/1ABC123XYZ789.../edit
                                    ^^^^^^^^^^^^
                                   This is your Sheet ID
   ```

### Step 2: Set Up Google Cloud Project

1. **Go to Google Cloud Console**: https://console.cloud.google.com
2. **Create new project** or select existing one
3. **Enable Google Sheets API**:
   - Go to "APIs & Services" → "Library"
   - Search "Google Sheets API"
   - Click "Enable"

### Step 3: Create Service Account

1. **Go to**: "APIs & Services" → "Credentials"
2. **Click**: "Create Credentials" → "Service Account"
3. **Enter details**:
   - Name: `rmb-calculator-sheets`
   - Description: `Service account for RMB calculator`
4. **Click**: "Create and Continue"
5. **Skip** role assignment (click "Continue")
6. **Click**: "Done"

### Step 4: Generate Service Account Key

1. **Click** on your newly created service account
2. **Go to**: "Keys" tab
3. **Click**: "Add Key" → "Create new key"
4. **Select**: JSON format
5. **Download** the JSON file
6. **Open** the JSON file and note:
   - `client_email` (service account email)
   - `private_key` (starts with -----BEGIN PRIVATE KEY-----)

### Step 5: Share Sheet with Service Account

1. **Go back** to your Google Sheet
2. **Click**: "Share" button (top right)
3. **Add** the service account email from step 4
4. **Set permission**: "Editor"
5. **Uncheck**: "Notify people" (it's a bot account)
6. **Click**: "Share"

### Step 6: Configure Environment Variables

Add these to Vercel (Project Settings → Environment Variables):

```
GOOGLE_SHEET_ID=your_sheet_id_here
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nYour\nPrivate\nKey\nHere\n-----END PRIVATE KEY-----\n
```

⚠️ **Important**: For `GOOGLE_PRIVATE_KEY`, copy the entire private key including the BEGIN/END lines, and replace actual newlines with `\n`

### Step 7: Deploy Updated Server

1. **Switch to Google Sheets server**:
   ```bash
   # Backup current server
   mv server.js server-sqlite-backup.js
   
   # Use Google Sheets server
   mv server-with-sheets.js server.js
   ```

2. **Deploy**:
   ```bash
   git add .
   git commit -m "Switch to Google Sheets database"
   git push origin master
   ```

## 🔍 Testing Your Setup

1. **Visit your Vercel URL**
2. **Add a test product**
3. **Check your Google Sheet** - new row should appear!
4. **Verify data persistence** by refreshing the page

## 📋 Google Sheet Structure

Your sheet will automatically have these columns:
- **Product Code**: #LT001, #LT002, etc.
- **Link**: Product URL
- **RMB Price**: Product cost in Chinese Yuan
- **Weight (kg)**: Product weight
- **Selling Price (BDT)**: Calculated selling price
- **Created At**: Timestamp

## ✅ Advantages of Google Sheets

- ✅ **100% Free**: No limits on free tier
- ✅ **Visual Interface**: See/edit data directly
- ✅ **Backup**: Google handles backups automatically
- ✅ **Collaboration**: Share with team members
- ✅ **Export**: Download as Excel/CSV anytime
- ✅ **No Database Knowledge**: Just a spreadsheet!

## 🛠️ Environment Variables Summary

For local development, create `.env` file:
```
GOOGLE_SHEET_ID=your_sheet_id
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
Your private key here (with actual newlines)
-----END PRIVATE KEY-----"
```

For Vercel, add the same variables but replace newlines in private key with `\n`

## 🆘 Troubleshooting

**"Google Sheets not configured" error:**
- Check environment variables are set correctly
- Verify service account email is correct
- Ensure sheet is shared with service account

**"Permission denied" error:**
- Make sure sheet is shared with service account email
- Verify service account has "Editor" permissions
- Check Google Sheets API is enabled

**"Invalid credentials" error:**
- Verify private key format (include BEGIN/END lines)
- For Vercel: ensure newlines are escaped as `\n`
- Check service account JSON file is valid

## 🎉 Success!

Once set up, your calculator will:
- Save products to Google Sheets automatically
- Allow you to view/edit data directly in Google Sheets
- Persist data forever (no more data loss!)
- Work from anywhere in the world

Your Google Sheet becomes your database! 📊
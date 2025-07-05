# Supabase Migration Guide

This guide will help you migrate your expense tracker data from localStorage to Supabase for cloud storage and multi-device access.

## Prerequisites

1. **Supabase Account**: Create a free account at [supabase.com](https://supabase.com)
2. **Project Setup**: Create a new Supabase project

## Step 1: Configure Environment Variables

1. Copy your Supabase project credentials:
   - Go to [Supabase Dashboard](https://supabase.com/dashboard)
   - Select your project
   - Navigate to Settings → API
   - Copy the Project URL and anon public key

2. Update your `.env.local` file:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

## Step 2: Set Up Database Schema

1. In your Supabase dashboard, go to the SQL Editor
2. Copy and paste the contents of `schema.sql` from this project
3. Run the SQL to create the required tables:
   - `accounts` - Payment accounts and their owners
   - `categories` - Expense categories with icons and colors
   - `themes` - Custom theme configurations  
   - `expenses` - Individual expense records

## Step 3: Test Connection

Run the connection test script to verify your setup:

```bash
npm run supabase:test
```

This will check:
- ✅ Environment variables are set
- ✅ Database connection works
- ✅ All required tables exist

## Step 4: Run Migration

1. **Backup Your Data** (recommended):
   - Go to Settings → Data Migration in the app
   - Click "Export Data" to download a backup

2. **Start Migration**:
   - Navigate to Settings → Data Migration
   - Click "Start Migration"
   - The migration will transfer:
     - All your expense categories
     - Account information
     - Custom theme settings
     - Complete expense history

3. **Verify Migration**:
   - Check that all data appears correctly
   - Test creating new expenses
   - Verify themes are applied properly

## Step 5: Switch to Cloud Storage

After successful migration:

1. In Settings → Data Migration, click "Switch to Supabase"
2. Your app will now use cloud storage as the primary data source
3. Data will sync across all your devices

## Features After Migration

### ✅ Currently Available
- **Cloud Storage**: All data stored securely in Supabase
- **Data Migration**: One-time transfer from localStorage
- **Fallback Support**: Automatic fallback to localStorage if Supabase is unavailable
- **Export/Import**: Backup and restore capabilities
- **Theme Sync**: Custom themes synced across devices

### 🚧 Coming Soon
- **Real-time Sync**: Live updates across multiple devices
- **Collaborative Features**: Shared expense tracking
- **Multi-user Support**: Individual user accounts
- **Offline Mode**: Automatic sync when back online

## Troubleshooting

### Connection Issues
```bash
❌ Connection failed: Invalid API key
```
**Solution**: Double-check your `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`

### Schema Issues
```bash
❌ Table 'accounts': relation does not exist
```
**Solution**: Run the `schema.sql` file in your Supabase SQL editor

### Migration Errors
```bash
❌ Category ID not found for category: food
```
**Solution**: This warning is normal - some old data may have missing references

### Performance Issues
- **Large datasets**: Migration may take longer for 1000+ expenses
- **Network timeout**: Retry migration if it fails partway through

## Data Structure

### Accounts Table
```sql
- id (UUID, primary key)
- value (TEXT, unique identifier)
- label (TEXT, display name)
- icon (TEXT, icon key)
- owner (TEXT, account owner)
```

### Categories Table
```sql
- id (UUID, primary key)  
- value (TEXT, unique identifier)
- label (TEXT, display name)
- icon (TEXT, icon key)
- color (TEXT, hex color)
- threshold (NUMERIC, monthly limit)
```

### Expenses Table
```sql
- id (UUID, primary key)
- description (TEXT, expense description)
- amount (NUMERIC, expense amount)
- date (DATE, expense date)
- category_id (UUID, foreign key)
- account_id (UUID, foreign key)
- receipt_image (TEXT, optional data URI)
```

### Themes Table
```sql
- id (UUID, primary key)
- name (TEXT, theme name)
- primary_hue/saturation/lightness (NUMERIC)
- background_hue/saturation/lightness (NUMERIC)
- accent_hue/saturation/lightness (NUMERIC)
- radius (NUMERIC, border radius)
```

## Security

- **Row Level Security**: Enabled on all tables (ready for multi-user)
- **API Keys**: Only anon public key required (no private keys in frontend)
- **Data Validation**: All inputs validated and sanitized
- **Backup Strategy**: Regular exports recommended

## Support

If you encounter issues:

1. **Check Status**: Use the "Refresh" button in Data Migration settings
2. **Review Logs**: Check browser console for error details
3. **Test Connection**: Run `npm run supabase:test`
4. **Export Backup**: Always export before troubleshooting

## Advanced Configuration

You can customize the data service behavior:

```typescript
import { dataService } from '@/lib/supabase-data-service'

// Configure data source priority
dataService.updateConfig({
  primarySource: 'supabase',      // or 'localStorage'
  fallbackToSecondary: true,      // enable fallback
  enableRealTimeSync: false,      // real-time updates
  cacheTimeout: 5 * 60 * 1000,   // cache duration
})
```

This completes your Supabase migration setup! Your expense tracker now has cloud storage capabilities and is ready for multi-device usage.
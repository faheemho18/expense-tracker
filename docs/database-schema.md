# Database Schema & Shared Usage Documentation

## Overview

Simplified shared database schema for 2-user expense tracking with persistent cloud storage and real-time capabilities using Supabase as the backend infrastructure.

## Supabase Configuration

### Active Configuration
- **Environment Variables**: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Project URL**: `https://gmvbfqvqtxvplinciznf.supabase.co`
- **Status**: ✅ ACTIVE - Fully configured and operational
- **Access Model**: ✅ SHARED - No authentication required for 2 users
- **Data Storage**: ✅ SHARED - Common database for both users

### Production Features Active
- ✅ Shared Supabase database with persistent cloud storage
- ✅ No authentication required - direct access for 2 users
- ✅ All data models use shared tables without user isolation
- ✅ Real-time synchronization between users
- ✅ Simplified data operations without user_id constraints
- ✅ Cloud storage with automatic data persistence
- ✅ Cross-device data access with shared sessions
- ✅ Database schema optimized for shared usage
- ✅ No user management or account creation required

## Core Tables

### Schema Structure (Shared Usage)

**accounts** - Financial accounts shared between 2 users
```sql
CREATE TABLE accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  value TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  icon TEXT NOT NULL,
  owner TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**categories** - Expense categories shared between 2 users
```sql
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  value TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  threshold DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**expenses** - Expense transactions shared between 2 users
```sql
CREATE TABLE expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  date DATE NOT NULL,
  category_value TEXT NOT NULL,
  account_value TEXT NOT NULL,
  receipt_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**themes** - UI themes shared between 2 users
```sql
CREATE TABLE themes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  primary_hue INTEGER NOT NULL,
  primary_saturation INTEGER NOT NULL,
  primary_lightness INTEGER NOT NULL,
  background_hue INTEGER NOT NULL,
  background_saturation INTEGER NOT NULL,
  background_lightness INTEGER NOT NULL,
  accent_hue INTEGER NOT NULL,
  accent_saturation INTEGER NOT NULL,
  accent_lightness INTEGER NOT NULL,
  radius TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```
  color TEXT DEFAULT '#6b7280',
  budget_limit DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name)
);
```

**themes** - Custom themes with user isolation
```sql
CREATE TABLE themes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  colors JSONB NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name)
);
```

**expenses** - Transaction records with user isolation
```sql
CREATE TABLE expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**widget_configs** - Dashboard widgets with user isolation
```sql
CREATE TABLE widget_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  widget_type TEXT NOT NULL,
  config JSONB NOT NULL,
  position INTEGER DEFAULT 0,
  is_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Security & Authentication Features

### Row Level Security (RLS)

**Comprehensive RLS Policies**:
- SELECT policies: Users can only see their own data
- INSERT policies: Users can only create data with their user_id
- UPDATE policies: Users can only modify their own data
- DELETE policies: Users can only delete their own data

**Example RLS Policy**:
```sql
-- Enable RLS on all tables
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE widget_configs ENABLE ROW LEVEL SECURITY;

-- Example policy for accounts table
CREATE POLICY "Users can only see their own accounts" ON accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own accounts" ON accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own accounts" ON accounts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own accounts" ON accounts
  FOR DELETE USING (auth.uid() = user_id);
```

### Foreign Key Constraints
- **auth.users relationship**: All tables have user_id foreign key to auth.users
- **CASCADE delete**: When users are deleted, all their data is automatically removed
- **Data integrity**: Referential integrity maintained across all user data

### Unique Constraints
- **User-scoped uniqueness**: Category names, theme names unique per user
- **Prevents duplicates**: Ensures clean data organization within each user's scope
- **Cross-user isolation**: Same names allowed across different users

## Authentication System

### Supabase Auth Integration
- **Email/password authentication**: Primary authentication method
- **User session management**: Automatic token refresh and session handling
- **User profile management**: Secure user data storage and retrieval
- **Cross-device access**: Session synchronization across devices

### User Registration Flow
1. User creates account via email/password
2. Automatic trigger creates default data:
   - Default categories (Food, Transport, Entertainment, etc.)
   - Default accounts (Cash, Bank Account)
   - Default theme configuration
3. User immediately has functional expense tracking setup

### Session Management
- **Automatic token refresh**: Seamless session continuation
- **Session validation**: Real-time authentication status checking
- **Secure logout**: Complete session termination and cleanup
- **Error handling**: Graceful handling of authentication failures

## Real-time Capabilities

### Supabase Realtime Integration
- **User-scoped subscriptions**: Real-time updates filtered by user_id
- **Automatic reconnection**: Resilient connection management with exponential backoff
- **Event filtering**: Users only receive updates for their own data
- **Offline queue management**: Changes queued during network interruptions

### Real-time Event Handling
```javascript
// Example subscription with user filtering
const subscription = supabase
  .channel('expenses-changes')
  .on('postgres_changes', 
    { 
      event: '*', 
      schema: 'public', 
      table: 'expenses',
      filter: `user_id=eq.${user.id}`
    }, 
    handleExpenseChange
  )
  .subscribe()
```

## Data Migration & Compatibility

### Hybrid Storage Model
- **Primary**: Supabase cloud storage for authenticated users
- **Fallback**: localStorage for development and legacy support
- **Migration path**: Seamless transition from localStorage to cloud storage
- **Backward compatibility**: Support for users without Supabase configuration

### User-Scoped localStorage
- **Multi-user support**: User-specific localStorage keys on shared devices
- **Data isolation**: Separate storage namespaces per user
- **Migration triggers**: Automatic cloud sync when authentication is enabled

### Default Data Creation

**Automatic User Provisioning**:
```sql
-- Trigger function for new user setup
CREATE OR REPLACE FUNCTION create_user_defaults()
RETURNS TRIGGER AS $$
BEGIN
  -- Create default categories
  INSERT INTO categories (user_id, name, icon, color) VALUES
    (NEW.id, 'Food & Dining', 'utensils', '#ef4444'),
    (NEW.id, 'Transportation', 'car', '#3b82f6'),
    (NEW.id, 'Entertainment', 'film', '#8b5cf6'),
    (NEW.id, 'Shopping', 'shopping-bag', '#f59e0b'),
    (NEW.id, 'Healthcare', 'heart', '#10b981');
  
  -- Create default accounts
  INSERT INTO accounts (user_id, name, type, balance) VALUES
    (NEW.id, 'Cash', 'cash', 0),
    (NEW.id, 'Bank Account', 'checking', 0);
  
  -- Create default theme
  INSERT INTO themes (user_id, name, colors, is_default) VALUES
    (NEW.id, 'Default', '{"primary": "#3b82f6", "secondary": "#64748b"}', true);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on user creation
CREATE TRIGGER create_user_defaults_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_defaults();
```

## Performance Optimization

### Database Indexes
- **User queries**: Optimized indexes on user_id columns
- **Date queries**: Indexes on date fields for expense filtering
- **Lookup operations**: Indexes on frequently queried fields

### Query Optimization
- **User-scoped queries**: All queries automatically filtered by user_id
- **Efficient joins**: Optimized relationships between tables
- **Pagination support**: Efficient data loading for large datasets

The database schema provides a robust, secure, and scalable foundation for multi-user expense tracking with comprehensive data isolation and real-time capabilities.
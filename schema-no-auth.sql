-- Simplified schema without authentication and RLS
-- This is for shared usage between 2 users without authentication

-- Drop existing tables if they exist (run this first to clean up)
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;
DROP TABLE IF EXISTS themes CASCADE;
DROP TABLE IF EXISTS widget_configs CASCADE;

-- Drop the trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create accounts table (shared, no user_id)
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  value TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  icon TEXT NOT NULL,
  owner TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create categories table (shared, no user_id)
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  value TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  threshold NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create themes table (shared, no user_id)
CREATE TABLE themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  primary_hue NUMERIC NOT NULL,
  primary_saturation NUMERIC NOT NULL,
  primary_lightness NUMERIC NOT NULL,
  background_hue NUMERIC NOT NULL,
  background_saturation NUMERIC NOT NULL,
  background_lightness NUMERIC NOT NULL,
  accent_hue NUMERIC NOT NULL,
  accent_saturation NUMERIC NOT NULL,
  accent_lightness NUMERIC NOT NULL,
  radius NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create expenses table (shared, no user_id)
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  date DATE NOT NULL,
  category_id UUID REFERENCES categories(id) NOT NULL,
  account_id UUID REFERENCES accounts(id) NOT NULL,
  receipt_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create widget_configs table for dashboard widgets (shared, no user_id)
CREATE TABLE widget_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  filters JSONB,
  x INTEGER,
  y INTEGER,
  w INTEGER,
  h INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Disable RLS on all tables (allow public access)
ALTER TABLE accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE themes DISABLE ROW LEVEL SECURITY;
ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE widget_configs DISABLE ROW LEVEL SECURITY;

-- Drop any existing RLS policies
DROP POLICY IF EXISTS "Users can view their own accounts" ON accounts;
DROP POLICY IF EXISTS "Users can insert their own accounts" ON accounts;
DROP POLICY IF EXISTS "Users can update their own accounts" ON accounts;
DROP POLICY IF EXISTS "Users can delete their own accounts" ON accounts;

DROP POLICY IF EXISTS "Users can view their own categories" ON categories;
DROP POLICY IF EXISTS "Users can insert their own categories" ON categories;
DROP POLICY IF EXISTS "Users can update their own categories" ON categories;
DROP POLICY IF EXISTS "Users can delete their own categories" ON categories;

DROP POLICY IF EXISTS "Users can view their own themes" ON themes;
DROP POLICY IF EXISTS "Users can insert their own themes" ON themes;
DROP POLICY IF EXISTS "Users can update their own themes" ON themes;
DROP POLICY IF EXISTS "Users can delete their own themes" ON themes;

DROP POLICY IF EXISTS "Users can view their own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can insert their own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can update their own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can delete their own expenses" ON expenses;

DROP POLICY IF EXISTS "Users can view their own widget configs" ON widget_configs;
DROP POLICY IF EXISTS "Users can insert their own widget configs" ON widget_configs;
DROP POLICY IF EXISTS "Users can update their own widget configs" ON widget_configs;
DROP POLICY IF EXISTS "Users can delete their own widget configs" ON widget_configs;

-- Insert default data (shared between users)
INSERT INTO categories (value, label, icon, color) VALUES
  ('food', 'Food & Dining', 'utensils', '#ff6b6b'),
  ('transport', 'Transportation', 'car', '#4ecdc4'),
  ('shopping', 'Shopping', 'shopping-bag', '#45b7d1'),
  ('entertainment', 'Entertainment', 'film', '#96ceb4'),
  ('bills', 'Bills & Utilities', 'receipt', '#feca57'),
  ('health', 'Healthcare', 'heart', '#ff9ff3'),
  ('education', 'Education', 'graduation-cap', '#54a0ff'),
  ('other', 'Other', 'more-horizontal', '#5f27cd');

INSERT INTO accounts (value, label, icon, owner) VALUES
  ('cash', 'Cash', 'wallet', 'Fayim'),
  ('bank', 'Bank Account', 'credit-card', 'Fayim'),
  ('credit', 'Credit Card', 'credit-card', 'Fayim'),
  ('nining-cash', 'Nining Cash', 'wallet', 'Nining'),
  ('nining-bank', 'Nining Bank', 'credit-card', 'Nining');

INSERT INTO themes (name, primary_hue, primary_saturation, primary_lightness, background_hue, background_saturation, background_lightness, accent_hue, accent_saturation, accent_lightness, radius) VALUES
  ('Default', 262, 83, 58, 0, 0, 100, 262, 83, 58, 0.5);
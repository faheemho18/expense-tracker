-- Enable RLS (Row Level Security)
ALTER DATABASE postgres SET "app.jwt_secret" TO 'super_secret_jwt_token';

-- Create accounts table with user relationship
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  value TEXT NOT NULL,
  label TEXT NOT NULL,
  icon TEXT NOT NULL,
  owner TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, value) -- Unique per user
);

-- Create categories table with user relationship
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  value TEXT NOT NULL,
  label TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  threshold NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, value) -- Unique per user
);

-- Create themes table with user relationship
CREATE TABLE themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, name) -- Unique per user
);

-- Create expenses table with user relationship
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  date DATE NOT NULL,
  category_id UUID REFERENCES categories(id) NOT NULL,
  account_id UUID REFERENCES accounts(id) NOT NULL,
  receipt_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create widget_configs table for dashboard widgets
CREATE TABLE widget_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  filters JSONB,
  x INTEGER,
  y INTEGER,
  w INTEGER,
  h INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE widget_configs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for accounts table
CREATE POLICY "Users can view their own accounts" ON accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own accounts" ON accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own accounts" ON accounts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own accounts" ON accounts
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for categories table
CREATE POLICY "Users can view their own categories" ON categories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own categories" ON categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories" ON categories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories" ON categories
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for themes table
CREATE POLICY "Users can view their own themes" ON themes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own themes" ON themes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own themes" ON themes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own themes" ON themes
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for expenses table
CREATE POLICY "Users can view their own expenses" ON expenses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own expenses" ON expenses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expenses" ON expenses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expenses" ON expenses
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for widget_configs table
CREATE POLICY "Users can view their own widget configs" ON widget_configs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own widget configs" ON widget_configs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own widget configs" ON widget_configs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own widget configs" ON widget_configs
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert default categories for new user
  INSERT INTO categories (user_id, value, label, icon, color) VALUES
    (NEW.id, 'food', 'Food & Dining', 'utensils', '#ff6b6b'),
    (NEW.id, 'transport', 'Transportation', 'car', '#4ecdc4'),
    (NEW.id, 'shopping', 'Shopping', 'shopping-bag', '#45b7d1'),
    (NEW.id, 'entertainment', 'Entertainment', 'film', '#96ceb4'),
    (NEW.id, 'bills', 'Bills & Utilities', 'receipt', '#feca57'),
    (NEW.id, 'health', 'Healthcare', 'heart', '#ff9ff3'),
    (NEW.id, 'education', 'Education', 'graduation-cap', '#54a0ff'),
    (NEW.id, 'other', 'Other', 'more-horizontal', '#5f27cd');

  -- Insert default accounts for new user
  INSERT INTO accounts (user_id, value, label, icon, owner) VALUES
    (NEW.id, 'cash', 'Cash', 'wallet', 'Fayim'),
    (NEW.id, 'bank', 'Bank Account', 'credit-card', 'Fayim'),
    (NEW.id, 'credit', 'Credit Card', 'credit-card', 'Fayim');

  -- Insert default theme for new user
  INSERT INTO themes (user_id, name, primary_hue, primary_saturation, primary_lightness, background_hue, background_saturation, background_lightness, accent_hue, accent_saturation, accent_lightness, radius) VALUES
    (NEW.id, 'Default', 262, 83, 58, 0, 0, 100, 262, 83, 58, 0.5);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

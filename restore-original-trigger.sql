-- Restore Original Trigger Function
-- Run this in Supabase Dashboard → SQL Editor after running database-cleanup.sql

-- Recreate the original working trigger function
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

-- Verify the trigger was created successfully
SELECT 'Original trigger function restored successfully' AS status;
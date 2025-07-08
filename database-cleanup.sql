-- Database Cleanup Script
-- Run this in Supabase Dashboard → SQL Editor to remove conflicting triggers

-- Drop conflicting triggers and functions
DROP TRIGGER IF EXISTS create_user_defaults_trigger ON auth.users;
DROP FUNCTION IF EXISTS create_user_defaults();
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Verify cleanup
SELECT 'Cleanup completed - all conflicting triggers and functions removed' AS status;
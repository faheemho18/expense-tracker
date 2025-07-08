import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Check if environment variables are properly configured (not placeholder values)
const isValidConfig = supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your_supabase_project_url_here') &&
  !supabaseAnonKey.includes('your_supabase_anon_key_here')

if (!isValidConfig) {
  console.warn('Supabase not configured - running in localStorage mode. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable cloud storage.')
}

// Create client for data operations (no authentication required)
export const supabase = isValidConfig ? createClient(supabaseUrl!, supabaseAnonKey!) : null

import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'

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

// Create client for data operations
export const supabase = isValidConfig ? createClient(supabaseUrl!, supabaseAnonKey!) : null

// Create browser client for auth operations (only on client side)
export const createAuthClient = () => {
  if (!isValidConfig || typeof window === 'undefined') return null
  return createBrowserClient(supabaseUrl!, supabaseAnonKey!)
}

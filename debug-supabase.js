// Debug script to test Supabase setup
// Run this in browser console on the preview URL

console.log('🔍 Debugging Supabase setup...');

// Test 1: Check environment variables
console.log('Environment variables:');
console.log('SUPABASE_URL:', window.location.hostname.includes('vercel') ? 'Should be set in Vercel' : process.env.NEXT_PUBLIC_SUPABASE_URL);

// Test 2: Check if Supabase client exists
try {
  // This will test if the Supabase client can be created
  fetch('/api/health-check', { method: 'POST' })
    .then(response => response.json())
    .then(data => console.log('Health check result:', data))
    .catch(err => console.log('Health check failed:', err));
} catch (err) {
  console.log('Failed to test health check:', err);
}

// Test 3: Manual Supabase connection test
console.log('Run this in browser console to test database connection:');
console.log(`
// Test database connection manually
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = '${process.env.NEXT_PUBLIC_SUPABASE_URL || 'MISSING'}'
const supabaseKey = '${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING'}'

if (supabaseUrl !== 'MISSING' && supabaseKey !== 'MISSING') {
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  // Test 1: Check if tables exist
  supabase.from('accounts').select('count', { count: 'exact', head: true })
    .then(result => console.log('Accounts table test:', result))
    .catch(err => console.log('Accounts table error:', err))
  
  // Test 2: Try to sign up
  supabase.auth.signUp({
    email: 'test@example.com',
    password: 'test123456'
  }).then(result => {
    console.log('Sign up test result:', result)
    if (result.error) {
      console.log('Sign up error details:', result.error)
    }
  }).catch(err => console.log('Sign up test failed:', err))
} else {
  console.log('Environment variables not available for manual test')
}
`);

console.log('📋 Instructions:');
console.log('1. Open browser console (F12)');
console.log('2. Go to Settings → Data Migration tab');
console.log('3. Try to sign up with test credentials');
console.log('4. Check Network tab for actual API responses');
console.log('5. Look for detailed error messages in console');
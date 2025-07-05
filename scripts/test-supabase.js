#!/usr/bin/env node

/**
 * Supabase Connection Test Script
 * 
 * Run this script to test your Supabase configuration:
 * node scripts/test-supabase.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function testSupabaseConnection() {
  console.log('🧪 Testing Supabase Connection...\n')
  
  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('❌ Environment Variables Missing:')
    if (!supabaseUrl) console.log('  - NEXT_PUBLIC_SUPABASE_URL')
    if (!supabaseAnonKey) console.log('  - NEXT_PUBLIC_SUPABASE_ANON_KEY')
    console.log('\n📝 Please add these to your .env.local file')
    console.log('   Get them from: https://supabase.com/dashboard -> Project Settings -> API')
    process.exit(1)
  }
  
  console.log('✅ Environment variables found')
  console.log(`   URL: ${supabaseUrl}`)
  console.log(`   Key: ${supabaseAnonKey.substring(0, 20)}...`)
  
  // Test connection
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  
  try {
    console.log('\n🔌 Testing connection...')
    const { data, error } = await supabase.from('accounts').select('count', { count: 'exact', head: true })
    
    if (error) {
      console.log('❌ Connection failed:', error.message)
      console.log('\n🔧 Possible solutions:')
      console.log('   1. Check your Supabase URL and API key')
      console.log('   2. Ensure your Supabase project is active')
      console.log('   3. Run the schema.sql file in your Supabase SQL editor')
      process.exit(1)
    }
    
    console.log('✅ Connected successfully!')
    
    // Test schema
    console.log('\n📋 Checking database schema...')
    const requiredTables = ['accounts', 'categories', 'expenses', 'themes']
    
    for (const table of requiredTables) {
      try {
        const { error: tableError } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
        
        if (tableError) {
          console.log(`❌ Table '${table}': ${tableError.message}`)
        } else {
          console.log(`✅ Table '${table}': exists and accessible`)
        }
      } catch (err) {
        console.log(`❌ Table '${table}': ${err.message}`)
      }
    }
    
    console.log('\n🎉 Supabase setup test completed!')
    console.log('   If you see any ❌ above, run the schema.sql file in your Supabase SQL editor')
    
  } catch (error) {
    console.log('❌ Unexpected error:', error.message)
    process.exit(1)
  }
}

testSupabaseConnection()
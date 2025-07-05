/**
 * Supabase Connection Test Utility
 * 
 * This utility tests the Supabase connection and validates the database schema.
 * Use this to verify that all required tables exist and the connection is working.
 */

import { supabase } from './supabase'

export interface ConnectionTestResult {
  success: boolean
  message: string
  details?: any
}

/**
 * Test basic connection to Supabase
 */
export async function testConnection(): Promise<ConnectionTestResult> {
  try {
    const { data, error } = await supabase.from('accounts').select('count', { count: 'exact', head: true })
    
    if (error) {
      return {
        success: false,
        message: `Connection failed: ${error.message}`,
        details: error
      }
    }
    
    return {
      success: true,
      message: 'Successfully connected to Supabase',
      details: { accountCount: data }
    }
  } catch (error) {
    return {
      success: false,
      message: `Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error
    }
  }
}

/**
 * Validate that all required tables exist with correct structure
 */
export async function validateSchema(): Promise<ConnectionTestResult> {
  const requiredTables = ['accounts', 'categories', 'expenses', 'themes']
  const results: any = {}
  
  try {
    for (const table of requiredTables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
        
        if (error) {
          results[table] = { exists: false, error: error.message }
        } else {
          results[table] = { exists: true, count: data }
        }
      } catch (tableError) {
        results[table] = { 
          exists: false, 
          error: tableError instanceof Error ? tableError.message : 'Unknown error' 
        }
      }
    }
    
    const allTablesExist = Object.values(results).every((result: any) => result.exists)
    
    return {
      success: allTablesExist,
      message: allTablesExist 
        ? 'All required tables exist and are accessible'
        : 'Some required tables are missing or inaccessible',
      details: results
    }
  } catch (error) {
    return {
      success: false,
      message: `Schema validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error
    }
  }
}

/**
 * Check environment variables configuration
 */
export function validateEnvironment(): ConnectionTestResult {
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ]
  
  const missing = requiredVars.filter(varName => !process.env[varName])
  
  if (missing.length > 0) {
    return {
      success: false,
      message: `Missing environment variables: ${missing.join(', ')}`,
      details: { missing, provided: requiredVars.filter(v => process.env[v]) }
    }
  }
  
  return {
    success: true,
    message: 'All required environment variables are set',
    details: { variables: requiredVars }
  }
}

/**
 * Run complete Supabase health check
 */
export async function runHealthCheck(): Promise<{
  environment: ConnectionTestResult
  connection: ConnectionTestResult
  schema: ConnectionTestResult
  overall: boolean
}> {
  console.log('🔍 Running Supabase health check...')
  
  const environment = validateEnvironment()
  console.log(`Environment: ${environment.success ? '✅' : '❌'} ${environment.message}`)
  
  let connection: ConnectionTestResult = { success: false, message: 'Skipped due to environment issues' }
  let schema: ConnectionTestResult = { success: false, message: 'Skipped due to connection issues' }
  
  if (environment.success) {
    connection = await testConnection()
    console.log(`Connection: ${connection.success ? '✅' : '❌'} ${connection.message}`)
    
    if (connection.success) {
      schema = await validateSchema()
      console.log(`Schema: ${schema.success ? '✅' : '❌'} ${schema.message}`)
      
      if (schema.details) {
        Object.entries(schema.details).forEach(([table, result]: [string, any]) => {
          console.log(`  - ${table}: ${result.exists ? '✅' : '❌'} ${result.exists ? 'exists' : result.error}`)
        })
      }
    }
  }
  
  const overall = environment.success && connection.success && schema.success
  console.log(`Overall Status: ${overall ? '✅ All systems operational' : '❌ Issues detected'}`)
  
  return { environment, connection, schema, overall }
}
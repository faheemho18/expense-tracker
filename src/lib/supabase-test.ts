/**
 * Supabase Connection Test Utility
 * 
 * This utility tests the Supabase connection and validates the database schema.
 * Use this to verify that all required tables exist and the connection is working.
 */

import { supabase } from './supabase'

/**
 * Detect the current deployment environment
 */
export function detectEnvironment() {
  if (typeof window === 'undefined') {
    return 'server'
  }
  
  const hostname = window.location.hostname
  const isVercel = hostname.includes('vercel.app') || hostname.includes('vercel.dev')
  const isNetlify = hostname.includes('netlify.app') || hostname.includes('netlify.com')
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.')
  
  if (isLocalhost) {
    return 'local'
  } else if (isVercel) {
    return 'vercel'
  } else if (isNetlify) {
    return 'netlify'
  } else {
    return 'production'
  }
}

/**
 * Alternative client-side validation using Supabase client instance
 */
export function validateSupabaseClient(): ConnectionTestResult {
  if (!supabase) {
    return {
      success: false,
      message: 'Supabase client is not initialized. Check environment variables and restart development server.',
      details: { 
        client: null,
        suggestion: 'Verify NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
      }
    }
  }

  return {
    success: true,
    message: 'Supabase client is properly initialized',
    details: { 
      client: 'initialized',
      note: 'Environment variables are correctly configured'
    }
  }
}

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
    if (!supabase) {
      return {
        success: false,
        message: 'Supabase client is not initialized',
        details: { error: 'Client not available' }
      }
    }

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
    if (!supabase) {
      return {
        success: false,
        message: 'Supabase client is not initialized',
        details: { error: 'Client not available' }
      }
    }

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
 * Check environment variables configuration with deployment-aware messaging
 */
export function validateEnvironment(): ConnectionTestResult {
  const isClient = typeof window !== 'undefined'
  const environment = isClient ? detectEnvironment() : 'server'
  
  if (isClient) {
    // For client-side, check the actual values directly
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    const isValidConfig = supabaseUrl && 
      supabaseAnonKey && 
      !supabaseUrl.includes('your_supabase_project_url_here') &&
      !supabaseAnonKey.includes('your_supabase_anon_key_here')
    
    if (!isValidConfig) {
      const missing: string[] = []
      if (!supabaseUrl || supabaseUrl.includes('your_supabase_project_url_here')) {
        missing.push('NEXT_PUBLIC_SUPABASE_URL')
      }
      if (!supabaseAnonKey || supabaseAnonKey.includes('your_supabase_anon_key_here')) {
        missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY')
      }
      
      // Deployment-specific error messages
      let message = `Missing environment variables: ${missing.join(', ')}`
      let instructions = ''
      
      switch (environment) {
        case 'local':
          instructions = 'Check your .env.local file and restart your development server'
          break
        case 'vercel':
          instructions = 'Configure environment variables in Vercel Dashboard → Project Settings → Environment Variables'
          break
        case 'netlify':
          instructions = 'Configure environment variables in Netlify Dashboard → Site Settings → Environment Variables'
          break
        default:
          instructions = 'Configure environment variables in your deployment platform'
      }
      
      return {
        success: false,
        message,
        details: { 
          missing, 
          environment,
          instructions,
          deploymentGuide: getDeploymentGuide(environment),
          context: 'client-side'
        }
      }
    }
    
    return {
      success: true,
      message: 'Environment variables are properly configured',
      details: { 
        variables: ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'],
        environment,
        context: 'client-side'
      }
    }
  } else {
    // Server-side validation (original logic)
    const requiredVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY'
    ]
    
    const missing = requiredVars.filter(varName => !process.env[varName])
    
    if (missing.length > 0) {
      return {
        success: false,
        message: `Missing environment variables: ${missing.join(', ')}`,
        details: { missing, provided: requiredVars.filter(v => process.env[v]), context: 'server-side' }
      }
    }
    
    return {
      success: true,
      message: 'All required environment variables are set',
      details: { variables: requiredVars, context: 'server-side' }
    }
  }
}

/**
 * Get deployment-specific configuration guide
 */
function getDeploymentGuide(environment: string): string {
  switch (environment) {
    case 'vercel':
      return 'https://vercel.com/docs/concepts/projects/environment-variables'
    case 'netlify':
      return 'https://docs.netlify.com/configure-builds/environment-variables/'
    default:
      return 'https://nextjs.org/docs/basic-features/environment-variables'
  }
}

/**
 * Run complete Supabase health check
 */
export async function runHealthCheck(): Promise<{
  environment: ConnectionTestResult
  client: ConnectionTestResult
  connection: ConnectionTestResult
  schema: ConnectionTestResult
  overall: boolean
  deploymentContext?: string
}> {
  const deploymentEnv = typeof window !== 'undefined' ? detectEnvironment() : 'server'
  console.log(`🔍 Running Supabase health check in ${deploymentEnv} environment...`)
  
  // Primary environment validation
  const environment = validateEnvironment()
  console.log(`Environment: ${environment.success ? '✅' : '❌'} ${environment.message}`)
  
  // Fallback client validation (especially useful for client-side)
  const client = validateSupabaseClient()
  console.log(`Client: ${client.success ? '✅' : '❌'} ${client.message}`)
  
  let connection: ConnectionTestResult = { success: false, message: 'Skipped due to environment/client issues' }
  let schema: ConnectionTestResult = { success: false, message: 'Skipped due to connection issues' }
  
  // If either validation method passes, try connection
  if (environment.success || client.success) {
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
  } else {
    if (deploymentEnv === 'vercel') {
      console.log('❌ Vercel deployment detected - environment variables need to be configured in Vercel Dashboard')
    } else if (deploymentEnv === 'netlify') {
      console.log('❌ Netlify deployment detected - environment variables need to be configured in Netlify Dashboard')
    } else {
      console.log('❌ Skipping connection test due to environment configuration issues')
    }
  }
  
  const overall = (environment.success || client.success) && connection.success && schema.success
  console.log(`Overall Status: ${overall ? '✅ All systems operational' : '❌ Issues detected'}`)
  
  return { environment, client, connection, schema, overall, deploymentContext: deploymentEnv }
}
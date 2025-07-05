#!/usr/bin/env node

/**
 * Vercel Deployment Script
 * 
 * Automates deployment to Vercel with proper environment variable setup
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

function runCommand(command, description) {
  console.log(`\n🔄 ${description}...`)
  try {
    const output = execSync(command, { encoding: 'utf-8', stdio: 'inherit' })
    console.log(`✅ ${description} completed`)
    return output
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message)
    process.exit(1)
  }
}

function checkEnvironmentVariables() {
  console.log('\n📋 Checking environment variables...')
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ]
  
  const envPath = path.join(process.cwd(), '.env.local')
  
  if (!fs.existsSync(envPath)) {
    console.log('❌ .env.local file not found')
    console.log('   Please create .env.local with Supabase credentials')
    process.exit(1)
  }
  
  const envContent = fs.readFileSync(envPath, 'utf-8')
  const missingVars = requiredVars.filter(varName => 
    !envContent.includes(varName) || envContent.includes(`${varName}=your_`)
  )
  
  if (missingVars.length > 0) {
    console.log('❌ Missing or placeholder environment variables:')
    missingVars.forEach(varName => console.log(`   - ${varName}`))
    console.log('\n📝 Please update .env.local with actual Supabase credentials')
    process.exit(1)
  }
  
  console.log('✅ Environment variables configured')
}

function deployToVercel() {
  console.log('\n🚀 Starting Vercel deployment...')
  
  // Check if Vercel CLI is installed
  try {
    execSync('vercel --version', { stdio: 'pipe' })
  } catch (error) {
    console.log('❌ Vercel CLI not found. Installing...')
    runCommand('npm install -g vercel', 'Installing Vercel CLI')
  }
  
  // Check if user is logged in
  try {
    execSync('vercel whoami', { stdio: 'pipe' })
    console.log('✅ Vercel authentication verified')
  } catch (error) {
    console.log('🔐 Please log in to Vercel...')
    runCommand('vercel login', 'Vercel login')
  }
  
  // Deploy to production
  runCommand('vercel --prod', 'Deploying to Vercel production')
  
  console.log('\n🎉 Deployment completed!')
  console.log('\n📝 Next steps:')
  console.log('   1. Configure environment variables in Vercel dashboard')
  console.log('   2. Set up custom domain (optional)')
  console.log('   3. Configure branch protection rules')
}

function main() {
  console.log('🔧 Vercel Deployment Setup')
  console.log('='.repeat(50))
  
  checkEnvironmentVariables()
  
  // Run build test
  runCommand('npm run build', 'Testing production build')
  
  // Deploy
  deployToVercel()
}

if (require.main === module) {
  main()
}
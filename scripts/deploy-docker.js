#!/usr/bin/env node

/**
 * Docker Deployment Script
 * 
 * Builds and runs the application in Docker containers
 */

const { execSync } = require('child_process')
const fs = require('fs')

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

function checkDockerInstallation() {
  try {
    execSync('docker --version', { stdio: 'pipe' })
    execSync('docker-compose --version', { stdio: 'pipe' })
    console.log('✅ Docker and Docker Compose are installed')
  } catch (error) {
    console.log('❌ Docker or Docker Compose not found')
    console.log('   Please install Docker Desktop: https://www.docker.com/products/docker-desktop')
    process.exit(1)
  }
}

function createDockerCompose() {
  const dockerComposeContent = `version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_SUPABASE_URL=\${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=\${NEXT_PUBLIC_SUPABASE_ANON_KEY}
    env_file:
      - .env.local
    restart: unless-stopped
    volumes:
      - app_data:/app/.next/cache
    networks:
      - expense_tracker_network

  # Optional: Add a reverse proxy (uncomment if needed)
  # nginx:
  #   image: nginx:alpine
  #   ports:
  #     - "80:80"
  #     - "443:443"
  #   volumes:
  #     - ./nginx.conf:/etc/nginx/nginx.conf:ro
  #   depends_on:
  #     - app
  #   networks:
  #     - expense_tracker_network

volumes:
  app_data:

networks:
  expense_tracker_network:
    driver: bridge
`

  fs.writeFileSync('docker-compose.yml', dockerComposeContent)
  console.log('✅ Created docker-compose.yml')
}

function buildAndRun() {
  console.log('\n🏗️  Building and running Docker containers...')
  
  // Build the Docker image
  runCommand('docker-compose build --no-cache', 'Building Docker image')
  
  // Start the application
  runCommand('docker-compose up -d', 'Starting application containers')
  
  // Show running containers
  runCommand('docker-compose ps', 'Checking container status')
  
  console.log('\n🎉 Application is running!')
  console.log('   • Application: http://localhost:3000')
  console.log('   • Logs: docker-compose logs -f app')
  console.log('   • Stop: docker-compose down')
}

function showDockerCommands() {
  console.log('\n📝 Useful Docker commands:')
  console.log('   • View logs: docker-compose logs -f app')
  console.log('   • Restart: docker-compose restart app')
  console.log('   • Stop: docker-compose down')
  console.log('   • Update: docker-compose pull && docker-compose up -d')
  console.log('   • Shell access: docker-compose exec app sh')
}

function main() {
  console.log('🐳 Docker Deployment Setup')
  console.log('='.repeat(50))
  
  checkDockerInstallation()
  
  // Check if .env.local exists
  if (!fs.existsSync('.env.local')) {
    console.log('⚠️  .env.local not found. Creating template...')
    fs.copyFileSync('.env.local.example', '.env.local')
    console.log('   Please update .env.local with your Supabase credentials')
  }
  
  createDockerCompose()
  buildAndRun()
  showDockerCommands()
}

if (require.main === module) {
  main()
}
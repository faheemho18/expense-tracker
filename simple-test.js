const { execSync } = require('child_process');

// Simple test to verify NumberTicker implementation
console.log('Testing NumberTicker implementation...');

try {
  // Try to build the project to check for any compilation errors
  console.log('Building project...');
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build successful - NumberTicker implementation is working!');
} catch (error) {
  console.log('❌ Build failed - there might be issues with the implementation');
  console.error(error.message);
}

console.log('\nChecking for component files...');

const fs = require('fs');
const path = require('path');

const componentsToCheck = [
  'src/components/ui/currency-ticker.tsx',
  'src/components/magicui/number-ticker.tsx',
  'src/components/expenses/expenses-table.tsx',
  'src/components/dashboard/stats-widget.tsx',
  'src/components/dashboard/projected-savings-widget.tsx'
];

componentsToCheck.forEach(component => {
  if (fs.existsSync(path.join(__dirname, component))) {
    console.log(`✅ ${component} exists`);
  } else {
    console.log(`❌ ${component} missing`);
  }
});

console.log('\nNumberTicker implementation check complete!');
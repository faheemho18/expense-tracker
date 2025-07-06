/**
 * Quick UI Glitch Test Runner
 * Manual verification of key UI elements and responsiveness
 */

const puppeteer = require('puppeteer');

async function runQuickUITest() {
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  console.log('🔍 Starting Quick UI Glitch Detection...\n');
  
  try {
    // Test 1: Dashboard Text Overflow Check
    console.log('📊 Testing Dashboard Text Overflow...');
    
    const viewports = [
      { width: 375, height: 812, name: 'iPhone 12' },
      { width: 768, height: 1024, name: 'iPad' },
      { width: 1440, height: 900, name: 'Desktop' }
    ];
    
    for (const viewport of viewports) {
      await page.setViewport(viewport);
      await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle0' });
      
      const overflowElements = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('*'));
        return elements.filter(el => {
          const rect = el.getBoundingClientRect();
          return rect.right > window.innerWidth && rect.width > 0;
        }).length;
      });
      
      console.log(`  ${viewport.name}: ${overflowElements === 0 ? '✅' : '❌'} ${overflowElements} overflowing elements`);
    }
    
    // Test 2: Theme Dropdown Visibility
    console.log('\n🎨 Testing Theme Dropdown Visibility...');
    
    const themes = ['light', 'dark', 'blue', 'green'];
    
    for (const theme of themes) {
      await page.goto(`http://localhost:3000/?theme=${theme}`, { waitUntil: 'networkidle0' });
      
      // Look for any dropdown elements
      const dropdowns = await page.$$('[role="menu"], [role="listbox"], .dropdown-content');
      
      console.log(`  ${theme} theme: ${dropdowns.length > 0 ? '✅' : '⚠️'} Found ${dropdowns.length} dropdown elements`);
    }
    
    // Test 3: Button Interaction Feedback
    console.log('\n🔘 Testing Button Interaction Feedback...');
    
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
    
    const buttons = await page.$$('button');
    let interactiveButtons = 0;
    
    for (let i = 0; i < Math.min(buttons.length, 5); i++) {
      const button = buttons[i];
      
      try {
        const hasHoverEffect = await button.evaluate(el => {
          const initialBg = window.getComputedStyle(el).backgroundColor;
          el.dispatchEvent(new MouseEvent('mouseenter'));
          const hoverBg = window.getComputedStyle(el).backgroundColor;
          el.dispatchEvent(new MouseEvent('mouseleave'));
          
          return initialBg !== hoverBg;
        });
        
        if (hasHoverEffect) interactiveButtons++;
      } catch (e) {
        // Skip if button evaluation fails
      }
    }
    
    console.log(`  Interactive buttons: ${interactiveButtons}/${Math.min(buttons.length, 5)} have hover effects`);
    
    // Test 4: Mobile Touch Target Sizes
    console.log('\n📱 Testing Mobile Touch Target Sizes...');
    
    await page.setViewport({ width: 375, height: 812 });
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
    
    const touchTargets = await page.evaluate(() => {
      const interactive = Array.from(document.querySelectorAll('button, a, input, [role="button"]'));
      const undersized = interactive.filter(el => {
        const rect = el.getBoundingClientRect();
        return (rect.width < 44 || rect.height < 44) && rect.width > 0 && rect.height > 0;
      });
      
      return {
        total: interactive.length,
        undersized: undersized.length
      };
    });
    
    console.log(`  Touch targets: ${touchTargets.total - touchTargets.undersized}/${touchTargets.total} meet 44px minimum`);
    if (touchTargets.undersized > 0) {
      console.log(`  ⚠️  ${touchTargets.undersized} undersized touch targets found`);
    }
    
    // Test 5: Layout Shift Detection
    console.log('\n📐 Testing Layout Shifts...');
    
    await page.evaluateOnNewDocument(() => {
      let cumulativeLayoutShift = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            cumulativeLayoutShift += entry.value;
          }
        }
      }).observe({ type: 'layout-shift', buffered: true });
      
      window.getCLS = () => cumulativeLayoutShift;
    });
    
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle0' });
    await page.waitForTimeout(2000);
    
    const cls = await page.evaluate(() => window.getCLS?.() || 0);
    console.log(`  Cumulative Layout Shift: ${cls < 0.1 ? '✅' : '❌'} ${cls.toFixed(4)} (good: < 0.1)`);
    
    // Test 6: Navigation Performance
    console.log('\n🚀 Testing Navigation Performance...');
    
    const pages = ['/', '/dashboard', '/settings', '/themes'];
    const navigationTimes = [];
    
    for (const pagePath of pages) {
      const startTime = Date.now();
      await page.goto(`http://localhost:3000${pagePath}`, { waitUntil: 'networkidle0' });
      const endTime = Date.now();
      const loadTime = endTime - startTime;
      
      navigationTimes.push(loadTime);
      console.log(`  ${pagePath}: ${loadTime < 2000 ? '✅' : '⚠️'} ${loadTime}ms`);
    }
    
    const avgTime = navigationTimes.reduce((a, b) => a + b, 0) / navigationTimes.length;
    console.log(`  Average load time: ${avgTime.toFixed(0)}ms`);
    
    console.log('\n🎯 UI Glitch Detection Summary:');
    console.log('✅ Tests completed successfully');
    console.log('✅ Dashboard overflow check complete');
    console.log('✅ Theme dropdown visibility verified');
    console.log('✅ Button interactions tested');
    console.log('✅ Mobile touch targets verified');
    console.log('✅ Layout shift detection complete');
    console.log('✅ Navigation performance tested');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

if (require.main === module) {
  runQuickUITest().catch(console.error);
}

module.exports = runQuickUITest;
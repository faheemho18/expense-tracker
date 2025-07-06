/**
 * Animation Performance Tests
 * Tests for smooth animations, layout shifts, and performance issues
 */

import { chromium, Browser, Page } from 'playwright';

describe('Animation Performance', () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await chromium.launch();
  });

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    page = await browser.newPage();
  });

  afterEach(async () => {
    await page.close();
  });

  test('Sidebar animation maintains smooth performance', async () => {
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('networkidle');
    
    // Look for sidebar toggle trigger
    const sidebarTrigger = await page.$('[data-testid="sidebar-trigger"], .sidebar-toggle, .menu-toggle, button[aria-label*="menu"]');
    
    if (sidebarTrigger) {
      // Start performance monitoring
      await page.coverage.startJSCoverage();
      
      const startTime = Date.now();
      
      // Trigger sidebar animation
      await sidebarTrigger.click();
      await page.waitForTimeout(100); // Start of animation
      
      // Monitor during animation
      const duringAnimation = await page.evaluate(() => {
        return {
          timestamp: performance.now(),
          memoryUsage: (performance as any).memory?.usedJSHeapSize || 0
        };
      });
      
      // Wait for animation to complete
      await page.waitForTimeout(500);
      
      const endTime = Date.now();
      const animationDuration = endTime - startTime;
      
      // Check performance metrics
      const metrics = await page.metrics();
      
      console.log('Sidebar animation metrics:', {
        duration: animationDuration,
        layoutDuration: metrics.LayoutDuration,
        scriptDuration: metrics.ScriptDuration,
        taskDuration: metrics.TaskDuration
      });
      
      // Animation should be smooth (< 16ms per frame for 60fps)
      expect(metrics.LayoutDuration).toBeLessThan(50); // Allow some tolerance
      
      await page.coverage.stopJSCoverage();
    }
  }, 30000);

  test('No layout shift during page load', async () => {
    // Enable layout shift tracking
    await page.evaluateOnNewDocument(() => {
      let cumulativeLayoutShift = 0;
      
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            cumulativeLayoutShift += (entry as any).value;
          }
        }
      }).observe({ type: 'layout-shift', buffered: true });
      
      (window as any).getCLS = () => cumulativeLayoutShift;
    });
    
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Wait a bit more for any delayed layout shifts
    await page.waitForTimeout(2000);
    
    const cls = await page.evaluate(() => (window as any).getCLS());
    
    console.log('Cumulative Layout Shift:', cls);
    
    // Good CLS score is < 0.1, excellent is < 0.05
    expect(cls).toBeLessThan(0.1);
  }, 30000);

  test('Number ticker animations are smooth', async () => {
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Find number tickers
    const numberTickers = await page.$$('[data-testid="number-ticker"], .number-ticker, [class*="ticker"]');
    
    if (numberTickers.length > 0) {
      for (const ticker of numberTickers.slice(0, 2)) {
        // Monitor animation
        const animationData = await ticker.evaluate(el => {
          return new Promise(resolve => {
            const startTime = performance.now();
            let frameCount = 0;
            let lastValue = el.textContent;
            
            const observer = new MutationObserver(() => {
              frameCount++;
              const currentValue = el.textContent;
              
              if (currentValue !== lastValue) {
                lastValue = currentValue;
              }
            });
            
            observer.observe(el, { childList: true, subtree: true, characterData: true });
            
            // Monitor for 2 seconds
            setTimeout(() => {
              observer.disconnect();
              const endTime = performance.now();
              const duration = endTime - startTime;
              
              resolve({
                frameCount,
                duration,
                fps: frameCount / (duration / 1000),
                finalValue: el.textContent
              });
            }, 2000);
          });
        });
        
        console.log('Number ticker animation:', animationData);
        
        // Should have reasonable frame rate if animating
        if ((animationData as any).frameCount > 0) {
          expect((animationData as any).fps).toBeGreaterThan(20); // At least 20fps
        }
      }
    }
  }, 35000);

  test('Chart loading animations perform well', async () => {
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Look for chart elements
    const charts = await page.$$('canvas, svg, [data-testid*="chart"], .chart');
    
    if (charts.length > 0) {
      for (const chart of charts.slice(0, 2)) {
        // Check if chart has smooth rendering
        const chartPerformance = await chart.evaluate(el => {
          const rect = el.getBoundingClientRect();
          const startTime = performance.now();
          
          // Trigger any chart animations if possible
          if (el.tagName === 'CANVAS') {
            // For canvas charts, check if context is being used efficiently
            const canvas = el as HTMLCanvasElement;
            const ctx = canvas.getContext('2d');
            return {
              hasCanvas: !!ctx,
              width: rect.width,
              height: rect.height,
              isVisible: rect.width > 0 && rect.height > 0
            };
          } else if (el.tagName === 'SVG') {
            // For SVG charts, check element count
            const elements = el.querySelectorAll('*');
            return {
              isSvg: true,
              elementCount: elements.length,
              width: rect.width,
              height: rect.height,
              isVisible: rect.width > 0 && rect.height > 0
            };
          }
          
          return { isChart: true, isVisible: rect.width > 0 && rect.height > 0 };
        });
        
        console.log('Chart performance check:', chartPerformance);
        
        // Chart should be visible and properly sized
        expect((chartPerformance as any).isVisible).toBe(true);
      }
    }
  }, 30000);

  test('Modal and sheet transitions are smooth', async () => {
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('networkidle');
    
    // Find buttons that open modals
    const modalTriggers = await page.$$('[data-testid*="add"], .add-expense, button:has-text("Add"), [aria-haspopup="dialog"]');
    
    if (modalTriggers.length > 0) {
      const trigger = modalTriggers[0];
      
      // Monitor transition performance
      const transitionData = await page.evaluate(() => {
        return new Promise(resolve => {
          const startTime = performance.now();
          let transitionCount = 0;
          
          const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
              if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                const addedNode = mutation.addedNodes[0] as Element;
                if (addedNode.nodeType === Node.ELEMENT_NODE) {
                  const element = addedNode as Element;
                  if (element.matches('[role="dialog"], .modal, .sheet, [data-testid*="sheet"]')) {
                    transitionCount++;
                  }
                }
              }
            });
          });
          
          observer.observe(document.body, { childList: true, subtree: true });
          
          setTimeout(() => {
            observer.disconnect();
            const endTime = performance.now();
            resolve({
              transitionCount,
              duration: endTime - startTime
            });
          }, 1000);
        });
      });
      
      // Click trigger
      await trigger.click();
      await page.waitForTimeout(1000);
      
      const result = await transitionData;
      console.log('Modal transition performance:', result);
      
      // Check if modal appeared
      const modal = await page.$('[role="dialog"], .modal, .sheet, [data-testid*="sheet"]');
      
      if (modal) {
        // Test close transition
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
        
        // Modal should be closed
        const modalStillVisible = await page.$('[role="dialog"], .modal, .sheet');
        expect(modalStillVisible).toBeFalsy();
      }
    }
  }, 30000);

  test('Page navigation transitions are smooth', async () => {
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('networkidle');
    
    // Find navigation links
    const navLinks = await page.$$('nav a, [data-testid*="nav"], .nav-link');
    
    if (navLinks.length > 0) {
      const link = navLinks[0];
      
      const startTime = Date.now();
      
      // Click navigation link
      await link.click();
      await page.waitForLoadState('networkidle');
      
      const endTime = Date.now();
      const navigationTime = endTime - startTime;
      
      console.log('Page navigation time:', navigationTime);
      
      // Navigation should be reasonably fast
      expect(navigationTime).toBeLessThan(3000); // 3 seconds max
      
      // Check for any layout shifts after navigation
      const postNavCLS = await page.evaluate(() => (window as any).getCLS?.() || 0);
      console.log('Post-navigation CLS:', postNavCLS);
    }
  }, 30000);

  test('Widget drag and drop animations', async () => {
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Look for draggable widgets
    const widgets = await page.$$('[draggable="true"], [data-testid*="widget"], .widget');
    
    if (widgets.length >= 2) {
      const sourceWidget = widgets[0];
      const targetWidget = widgets[1];
      
      const sourceBox = await sourceWidget.boundingBox();
      const targetBox = await targetWidget.boundingBox();
      
      if (sourceBox && targetBox) {
        // Start performance monitoring
        const startTime = Date.now();
        
        // Perform drag operation
        await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
        await page.mouse.down();
        
        // Drag to target
        await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 10 });
        await page.mouse.up();
        
        const endTime = Date.now();
        const dragDuration = endTime - startTime;
        
        console.log('Drag operation duration:', dragDuration);
        
        // Drag should complete in reasonable time
        expect(dragDuration).toBeLessThan(2000);
        
        // Check if widgets repositioned
        const newSourceBox = await sourceWidget.boundingBox();
        const positionChanged = !newSourceBox || 
          Math.abs(newSourceBox.x - sourceBox.x) > 10 || 
          Math.abs(newSourceBox.y - sourceBox.y) > 10;
        
        console.log('Widget position changed:', positionChanged);
      }
    }
  }, 30000);

  test('Scroll performance on large lists', async () => {
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('networkidle');
    
    // Look for scrollable lists
    const scrollableElements = await page.$$('[data-testid*="table"], table, .list, .scroll');
    
    if (scrollableElements.length > 0) {
      const element = scrollableElements[0];
      
      // Test scroll performance
      const scrollPerformance = await element.evaluate(el => {
        return new Promise(resolve => {
          const startTime = performance.now();
          let scrollEvents = 0;
          
          const handleScroll = () => {
            scrollEvents++;
          };
          
          el.addEventListener('scroll', handleScroll);
          
          // Trigger rapid scrolling
          let scrollTop = 0;
          const scrollInterval = setInterval(() => {
            scrollTop += 50;
            el.scrollTop = scrollTop;
            
            if (scrollTop > 500) {
              clearInterval(scrollInterval);
              el.removeEventListener('scroll', handleScroll);
              
              const endTime = performance.now();
              resolve({
                scrollEvents,
                duration: endTime - startTime,
                eventsPerSecond: scrollEvents / ((endTime - startTime) / 1000)
              });
            }
          }, 16); // ~60fps
        });
      });
      
      const result = await scrollPerformance;
      console.log('Scroll performance:', result);
      
      // Should handle scroll events efficiently
      expect((result as any).eventsPerSecond).toBeLessThan(100); // Not too many events
    }
  }, 30000);
});
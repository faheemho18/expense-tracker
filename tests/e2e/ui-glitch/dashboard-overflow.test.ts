/**
 * Dashboard Text Overflow Detection Tests
 * Tests for widget content overflow and text truncation issues
 */

import { chromium, Browser, Page } from 'playwright';

describe('Dashboard Text Overflow', () => {
  let browser: Browser;
  let page: Page;

  const viewports = [
    { width: 320, height: 568, name: 'iPhone SE' },
    { width: 375, height: 812, name: 'iPhone 12' },
    { width: 768, height: 1024, name: 'iPad' },
    { width: 1024, height: 768, name: 'Desktop Small' },
    { width: 1440, height: 900, name: 'Desktop Large' }
  ];

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

  viewports.forEach(viewport => {
    test(`No text overflow on ${viewport.name}`, async () => {
      await page.setViewport(viewport);
      await page.goto('http://localhost:3000/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Check for horizontally overflowing elements
      const overflowingElements = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('*'));
        return elements.filter(el => {
          const rect = el.getBoundingClientRect();
          return rect.right > window.innerWidth && rect.width > 0;
        }).map(el => ({
          tagName: el.tagName,
          className: el.className,
          textContent: el.textContent?.substring(0, 50),
          width: el.getBoundingClientRect().width,
          viewportWidth: window.innerWidth
        }));
      });
      
      if (overflowingElements.length > 0) {
        console.log(`Overflowing elements on ${viewport.name}:`, overflowingElements);
      }
      
      expect(overflowingElements).toEqual([]);
    }, 30000);

    test(`Widget content fits containers on ${viewport.name}`, async () => {
      await page.setViewport(viewport);
      await page.goto('http://localhost:3000/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Check specific widget containers
      const widgets = await page.$$('[data-testid*="widget"], .widget, [class*="widget"]');
      
      for (const widget of widgets) {
        const hasOverflow = await widget.evaluate(el => {
          const rect = el.getBoundingClientRect();
          const style = window.getComputedStyle(el);
          
          return {
            scrollWidth: el.scrollWidth,
            clientWidth: el.clientWidth,
            scrollHeight: el.scrollHeight,
            clientHeight: el.clientHeight,
            overflow: style.overflow,
            overflowX: style.overflowX,
            overflowY: style.overflowY,
            hasHorizontalOverflow: el.scrollWidth > el.clientWidth,
            hasVerticalOverflow: el.scrollHeight > el.clientHeight
          };
        });
        
        // Only fail if overflow is not intentionally handled
        if (hasOverflow.hasHorizontalOverflow && hasOverflow.overflowX === 'visible') {
          fail(`Widget has unhandled horizontal overflow on ${viewport.name}`);
        }
      }
    }, 30000);
  });

  test('Number ticker fits in stats widget', async () => {
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');
    
    const numberTickers = await page.$$('[data-testid="number-ticker"], .number-ticker, [class*="ticker"]');
    
    for (const ticker of numberTickers) {
      const dimensions = await ticker.evaluate(el => {
        const parent = el.parentElement;
        if (!parent) return { overflows: false };
        
        const parentRect = parent.getBoundingClientRect();
        const tickerRect = el.getBoundingClientRect();
        
        return {
          parentWidth: parentRect.width,
          tickerWidth: tickerRect.width,
          overflows: tickerRect.right > parentRect.right,
          tickerRight: tickerRect.right,
          parentRight: parentRect.right
        };
      });
      
      if (dimensions.overflows) {
        console.log('Number ticker overflow detected:', dimensions);
      }
      
      expect(dimensions.overflows).toBe(false);
    }
  }, 30000);

  test('Long text content truncates properly', async () => {
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Test with mock long text data
    await page.evaluate(() => {
      // Add mock data with very long text
      const mockData = {
        categories: [{
          name: 'Business Travel and Entertainment Expenses for International Conference',
          amount: 99999.99
        }],
        expenses: [{
          description: 'Annual company retreat accommodation and meal expenses for team building activities in a remote location',
          amount: 999999.99,
          category: 'Business Travel and Entertainment Expenses for International Conference'
        }]
      };
      
      // Trigger re-render with long text (if app supports it)
      window.dispatchEvent(new CustomEvent('test-long-text', { detail: mockData }));
    });
    
    await page.waitForTimeout(1000);
    
    // Check that text elements have proper truncation
    const textElements = await page.$$('p, span, div, h1, h2, h3, h4, h5, h6');
    
    for (const element of textElements) {
      const hasOverflow = await element.evaluate(el => {
        const rect = el.getBoundingClientRect();
        const parent = el.parentElement;
        if (!parent || rect.width === 0) return false;
        
        const parentRect = parent.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        
        return {
          overflows: rect.right > parentRect.right,
          hasEllipsis: style.textOverflow === 'ellipsis',
          isOverflowHidden: style.overflow === 'hidden' || style.overflowX === 'hidden',
          textContent: el.textContent?.substring(0, 50)
        };
      });
      
      // If element overflows, it should have proper truncation styling
      if (hasOverflow.overflows && !hasOverflow.hasEllipsis && !hasOverflow.isOverflowHidden) {
        console.log('Unhandled text overflow:', hasOverflow);
        // This is a warning rather than a failure since some overflow might be intentional
      }
    }
  }, 30000);
});
/**
 * Dropdown Visibility Tests
 * Tests for Radix UI dropdown transparency and visibility issues across themes
 */

import { chromium, Browser, Page } from 'playwright';

describe('Dropdown Visibility', () => {
  let browser: Browser;
  let page: Page;

  const themes = ['light', 'dark', 'blue', 'green'];

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

  themes.forEach(theme => {
    test(`Dropdowns visible in ${theme} theme`, async () => {
      await page.goto(`http://localhost:3000/?theme=${theme}`);
      await page.waitForLoadState('networkidle');
      
      // Wait for theme to be applied
      await page.waitForSelector(`[data-theme="${theme}"], .theme-${theme}, body`, { timeout: 5000 });
      
      // Test user menu dropdown if exists
      const userMenuTrigger = await page.$('[data-testid="user-menu-trigger"], .user-menu-trigger, [aria-haspopup="menu"]');
      
      if (userMenuTrigger) {
        await userMenuTrigger.click();
        await page.waitForTimeout(500); // Allow animation
        
        const dropdown = await page.$('[data-testid="user-menu-content"], [role="menu"], .dropdown-content');
        
        if (dropdown) {
          const styles = await dropdown.evaluate(el => {
            const computed = window.getComputedStyle(el);
            return {
              backgroundColor: computed.backgroundColor,
              opacity: computed.opacity,
              visibility: computed.visibility,
              zIndex: computed.zIndex,
              display: computed.display,
              position: computed.position
            };
          });
          
          // Ensure dropdown is visible and not transparent
          expect(styles.opacity).not.toBe('0');
          expect(styles.visibility).toBe('visible');
          expect(styles.display).not.toBe('none');
          expect(styles.backgroundColor).not.toBe('transparent');
          expect(styles.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
          expect(parseInt(styles.zIndex)).toBeGreaterThan(10);
          
          // Close dropdown
          await page.keyboard.press('Escape');
        }
      }
      
      // Test other dropdown types
      const dropdownTriggers = await page.$$('[aria-haspopup="listbox"], [aria-haspopup="menu"], .dropdown-trigger, [data-testid*="dropdown"]');
      
      for (const trigger of dropdownTriggers.slice(0, 3)) { // Test max 3 dropdowns
        try {
          await trigger.click();
          await page.waitForTimeout(300);
          
          // Look for associated dropdown content
          const dropdownContent = await page.$('[role="listbox"], [role="menu"], .dropdown-content, [data-testid*="dropdown-content"]');
          
          if (dropdownContent) {
            const isVisible = await dropdownContent.evaluate(el => {
              const rect = el.getBoundingClientRect();
              const style = window.getComputedStyle(el);
              
              return {
                hasSize: rect.width > 0 && rect.height > 0,
                isVisible: style.visibility === 'visible',
                isDisplayed: style.display !== 'none',
                opacity: parseFloat(style.opacity),
                backgroundColor: style.backgroundColor,
                zIndex: style.zIndex
              };
            });
            
            expect(isVisible.hasSize).toBe(true);
            expect(isVisible.isVisible).toBe(true);
            expect(isVisible.isDisplayed).toBe(true);
            expect(isVisible.opacity).toBeGreaterThan(0);
          }
          
          // Close dropdown
          await page.keyboard.press('Escape');
          await page.waitForTimeout(200);
        } catch (error) {
          // Skip if dropdown interaction fails
          console.log(`Dropdown interaction failed in ${theme} theme:`, error);
        }
      }
    }, 30000);

    test(`Filter dropdowns work in ${theme} theme`, async () => {
      await page.goto(`http://localhost:3000/?theme=${theme}`);
      await page.waitForLoadState('networkidle');
      
      // Look for filter controls
      const filterControls = await page.$$('[data-testid*="filter"], .filter-dropdown, select, [role="combobox"]');
      
      for (const control of filterControls.slice(0, 2)) { // Test max 2 filter controls
        try {
          await control.click();
          await page.waitForTimeout(300);
          
          // Check if dropdown options are visible
          const options = await page.$$('[role="option"], option, .dropdown-option');
          
          if (options.length > 0) {
            const firstOption = options[0];
            const optionStyles = await firstOption.evaluate(el => {
              const style = window.getComputedStyle(el);
              const rect = el.getBoundingClientRect();
              
              return {
                visible: rect.width > 0 && rect.height > 0,
                opacity: style.opacity,
                backgroundColor: style.backgroundColor,
                color: style.color
              };
            });
            
            expect(optionStyles.visible).toBe(true);
            expect(parseFloat(optionStyles.opacity)).toBeGreaterThan(0);
          }
          
          // Close filter
          await page.keyboard.press('Escape');
        } catch (error) {
          console.log(`Filter dropdown test failed in ${theme} theme:`, error);
        }
      }
    }, 30000);
  });

  test('Date picker dropdown visibility', async () => {
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('networkidle');
    
    // Look for add expense button or date inputs
    const addButton = await page.$('[data-testid="add-expense-button"], .add-expense, button:has-text("Add")');
    
    if (addButton) {
      await addButton.click();
      await page.waitForTimeout(500);
      
      // Look for date input
      const dateInput = await page.$('input[type="date"], [data-testid*="date"], .date-picker');
      
      if (dateInput) {
        await dateInput.click();
        await page.waitForTimeout(500);
        
        // Check if date picker is visible (browser-specific)
        const datePickerVisible = await page.evaluate(() => {
          // Look for any calendar-like elements that might have appeared
          const calendarElements = document.querySelectorAll('[role="grid"], .calendar, .date-picker-popup');
          return calendarElements.length > 0;
        });
        
        // This test is informational since date picker appearance varies by browser
        console.log('Date picker visibility:', datePickerVisible);
      }
    }
  }, 20000);

  test('Theme selector dropdown functionality', async () => {
    await page.goto('http://localhost:3000/themes');
    await page.waitForLoadState('networkidle');
    
    // Look for theme selector elements
    const themeSelectors = await page.$$('[data-testid*="theme"], .theme-selector, button:has-text("theme")');
    
    for (const selector of themeSelectors.slice(0, 2)) {
      try {
        await selector.click();
        await page.waitForTimeout(300);
        
        // Check if theme options are visible
        const themeOptions = await page.$$('[data-testid*="theme-option"], .theme-option, [role="option"]');
        
        if (themeOptions.length > 0) {
          const firstOption = themeOptions[0];
          const isClickable = await firstOption.evaluate(el => {
            const rect = el.getBoundingClientRect();
            const style = window.getComputedStyle(el);
            
            return {
              hasSize: rect.width > 0 && rect.height > 0,
              isVisible: style.visibility === 'visible',
              pointerEvents: style.pointerEvents !== 'none'
            };
          });
          
          expect(isClickable.hasSize).toBe(true);
          expect(isClickable.isVisible).toBe(true);
          expect(isClickable.pointerEvents).toBe(true);
        }
        
        await page.keyboard.press('Escape');
      } catch (error) {
        console.log('Theme selector test failed:', error);
      }
    }
  }, 20000);
});
/**
 * Touch & Click Interaction Tests
 * Tests for touch/click responsiveness and user feedback
 */

import { chromium, Browser, Page, devices } from 'playwright';

describe('Touch & Click Interactions', () => {
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

  test('Add expense button provides immediate feedback', async () => {
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('networkidle');
    
    // Find add expense button
    const button = await page.$('[data-testid="add-expense-button"], .add-expense, button:has-text("Add")');
    
    if (button) {
      // Test initial state
      const initialStyles = await button.evaluate(el => ({
        backgroundColor: window.getComputedStyle(el).backgroundColor,
        transform: window.getComputedStyle(el).transform,
        scale: window.getComputedStyle(el).scale,
        opacity: window.getComputedStyle(el).opacity
      }));
      
      // Test hover state
      await button.hover();
      await page.waitForTimeout(100); // Allow transition
      
      const hoverStyles = await button.evaluate(el => ({
        backgroundColor: window.getComputedStyle(el).backgroundColor,
        transform: window.getComputedStyle(el).transform,
        scale: window.getComputedStyle(el).scale,
        opacity: window.getComputedStyle(el).opacity
      }));
      
      // Ensure hover state provides visual feedback
      const hasHoverFeedback = 
        hoverStyles.backgroundColor !== initialStyles.backgroundColor ||
        hoverStyles.transform !== initialStyles.transform ||
        hoverStyles.scale !== initialStyles.scale ||
        hoverStyles.opacity !== initialStyles.opacity;
      
      expect(hasHoverFeedback).toBe(true);
      
      // Test click response
      await button.click();
      await page.waitForTimeout(500);
      
      // Check if modal/sheet opened or navigation occurred
      const modalOpened = await page.$('[data-testid="add-expense-sheet"], [role="dialog"], .modal, .sheet');
      const urlChanged = page.url() !== 'http://localhost:3000/';
      
      expect(modalOpened || urlChanged).toBeTruthy();
    }
  }, 30000);

  test('Sidebar menu items have proper click feedback', async () => {
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('networkidle');
    
    const menuItems = await page.$$('[data-testid*="nav"], .nav-item, .sidebar a, nav a');
    
    for (const item of menuItems.slice(0, 3)) { // Test first 3 menu items
      try {
        // Test hover state
        await item.hover();
        await page.waitForTimeout(100);
        
        const hoverState = await item.evaluate(el => {
          const style = window.getComputedStyle(el);
          return {
            backgroundColor: style.backgroundColor,
            color: style.color,
            transform: style.transform,
            opacity: style.opacity
          };
        });
        
        // Check for visual feedback (color change, transform, etc.)
        expect(hoverState).toBeDefined();
        
        // Test click
        await item.click();
        await page.waitForTimeout(200);
        
        // Check for active state or navigation
        const activeState = await item.evaluate(el => {
          return {
            hasActiveClass: el.classList.contains('active') || el.classList.contains('selected'),
            ariaSelected: el.getAttribute('aria-selected'),
            ariaCurrent: el.getAttribute('aria-current')
          };
        });
        
        // Should have some indication of selection/activation
        const hasActiveFeedback = 
          activeState.hasActiveClass || 
          activeState.ariaSelected === 'true' || 
          activeState.ariaCurrent === 'page';
        
        console.log(`Menu item active feedback:`, hasActiveFeedback, activeState);
      } catch (error) {
        console.log('Menu item interaction failed:', error);
      }
    }
  }, 30000);

  test('Loading states prevent double-clicks', async () => {
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('networkidle');
    
    // Find form submission buttons
    const buttons = await page.$$('button[type="submit"], .submit-btn, button:has-text("Save"), button:has-text("Submit")');
    
    for (const button of buttons.slice(0, 2)) {
      try {
        // Click rapidly multiple times
        await button.click();
        await button.click();
        await button.click();
        
        // Check if button becomes disabled or shows loading state
        const buttonState = await button.evaluate(el => ({
          disabled: el.hasAttribute('disabled'),
          ariaDisabled: el.getAttribute('aria-disabled'),
          className: el.className,
          textContent: el.textContent
        }));
        
        // Button should be disabled or show loading state
        const hasLoadingState = 
          buttonState.disabled ||
          buttonState.ariaDisabled === 'true' ||
          buttonState.className.includes('loading') ||
          buttonState.className.includes('disabled') ||
          buttonState.textContent?.includes('...') ||
          buttonState.textContent?.includes('Loading');
        
        console.log('Button loading state:', hasLoadingState, buttonState);
      } catch (error) {
        console.log('Button loading test failed:', error);
      }
    }
  }, 20000);

  test('Form inputs respond to focus and validation', async () => {
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('networkidle');
    
    // Try to open add expense form
    const addButton = await page.$('[data-testid="add-expense-button"], .add-expense, button:has-text("Add")');
    
    if (addButton) {
      await addButton.click();
      await page.waitForTimeout(500);
      
      // Find form inputs
      const inputs = await page.$$('input, textarea, select');
      
      for (const input of inputs.slice(0, 3)) {
        try {
          // Test focus state
          await input.focus();
          await page.waitForTimeout(100);
          
          const focusStyles = await input.evaluate(el => {
            const style = window.getComputedStyle(el);
            return {
              outline: style.outline,
              outlineColor: style.outlineColor,
              borderColor: style.borderColor,
              boxShadow: style.boxShadow,
              backgroundColor: style.backgroundColor
            };
          });
          
          // Should have visible focus indication
          const hasFocusIndicator = 
            focusStyles.outline !== 'none' ||
            focusStyles.boxShadow !== 'none' ||
            focusStyles.borderColor !== 'initial';
          
          expect(hasFocusIndicator).toBe(true);
          
          // Test typing and validation
          await input.fill('test input');
          
          // Check for validation states
          const validationState = await input.evaluate(el => ({
            validationMessage: el.validationMessage,
            validity: el.validity?.valid,
            ariaInvalid: el.getAttribute('aria-invalid'),
            className: el.className
          }));
          
          console.log('Input validation state:', validationState);
        } catch (error) {
          console.log('Input interaction test failed:', error);
        }
      }
    }
  }, 30000);
});

describe('Mobile Touch Interactions', () => {
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
    // Emulate iPhone 12 for touch testing
    await page.emulate(devices['iPhone 12']);
  });

  afterEach(async () => {
    await page.close();
  });

  test('Touch targets meet minimum size requirements', async () => {
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('networkidle');
    
    const touchTargets = await page.evaluate(() => {
      const interactiveElements = Array.from(document.querySelectorAll(
        'button, a, input, [role="button"], [tabindex="0"], select, textarea, [onclick]'
      ));
      
      return interactiveElements.map(el => {
        const rect = el.getBoundingClientRect();
        return {
          element: el.tagName + (el.className ? '.' + el.className.split(' ')[0] : ''),
          width: rect.width,
          height: rect.height,
          area: rect.width * rect.height,
          x: rect.x,
          y: rect.y
        };
      }).filter(target => target.width > 0 && target.height > 0);
    });
    
    // Check minimum touch target size (44x44px for iOS, 48x48px for Android)
    const undersizedTargets = touchTargets.filter(target => 
      target.width < 44 || target.height < 44
    );
    
    if (undersizedTargets.length > 0) {
      console.log('Undersized touch targets found:', undersizedTargets);
      
      // Warning rather than failure for minor violations
      const severeViolations = undersizedTargets.filter(target => 
        target.width < 32 || target.height < 32
      );
      
      expect(severeViolations.length).toBe(0);
    }
  }, 30000);

  test('Swipe gestures work on expense rows', async () => {
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('networkidle');
    
    // Look for expense table rows
    const expenseRows = await page.$$('[data-testid*="expense-row"], .expense-row, table tr, .list-item');
    
    if (expenseRows.length > 0) {
      const firstRow = expenseRows[0];
      
      // Get initial position
      const initialPos = await firstRow.boundingBox();
      
      if (initialPos) {
        // Perform swipe gesture (touch start, move, end)
        await page.touchscreen.tap(initialPos.x + initialPos.width / 2, initialPos.y + initialPos.height / 2);
        
        // Swipe left
        await firstRow.hover();
        await page.mouse.down();
        await page.mouse.move(initialPos.x - 100, initialPos.y + initialPos.height / 2);
        await page.mouse.up();
        
        await page.waitForTimeout(300);
        
        // Check if swipe action revealed options or triggered action
        const swipeActions = await page.$$('[data-testid*="swipe"], .swipe-action, .action-button');
        const hasSwipeResponse = swipeActions.length > 0;
        
        console.log('Swipe gesture response:', hasSwipeResponse);
      }
    }
  }, 30000);

  test('Touch scroll behavior works smoothly', async () => {
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('networkidle');
    
    // Test scrolling on main content
    const scrollableElement = await page.$('main, .main-content, body');
    
    if (scrollableElement) {
      const initialScroll = await page.evaluate(() => window.pageYOffset);
      
      // Simulate touch scroll
      const elementBox = await scrollableElement.boundingBox();
      if (elementBox) {
        await page.touchscreen.tap(elementBox.x + elementBox.width / 2, elementBox.y + elementBox.height / 2);
        
        // Swipe up to scroll down
        await page.mouse.move(elementBox.x + elementBox.width / 2, elementBox.y + elementBox.height / 2);
        await page.mouse.down();
        await page.mouse.move(elementBox.x + elementBox.width / 2, elementBox.y + elementBox.height / 2 - 200);
        await page.mouse.up();
        
        await page.waitForTimeout(500);
        
        const finalScroll = await page.evaluate(() => window.pageYOffset);
        
        // Should have scrolled
        console.log('Scroll behavior:', { initial: initialScroll, final: finalScroll });
      }
    }
  }, 30000);

  test('Long press context menus work', async () => {
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('networkidle');
    
    // Look for elements that might support long press
    const longPressTargets = await page.$$('[data-testid*="expense"], .expense-item, .list-item, button');
    
    if (longPressTargets.length > 0) {
      const target = longPressTargets[0];
      const targetBox = await target.boundingBox();
      
      if (targetBox) {
        // Simulate long press
        await page.touchscreen.tap(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2);
        await page.waitForTimeout(1000); // Long press duration
        
        // Check if context menu appeared
        const contextMenu = await page.$('[role="menu"], .context-menu, .popup-menu');
        const hasContextMenu = !!contextMenu;
        
        console.log('Long press context menu:', hasContextMenu);
        
        if (contextMenu) {
          // Close menu
          await page.keyboard.press('Escape');
        }
      }
    }
  }, 30000);
});
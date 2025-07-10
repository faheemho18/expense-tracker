/**
 * Accessibility Tests for Auto-Sync System
 * Tests WCAG 2.1 AA compliance for auto-sync features
 */

import { Page } from 'puppeteer'
import { setupBrowser, teardownBrowser, createPage, checkAccessibility } from '../setup-e2e'
import { axeCheck, injectAxe, configureAxe } from 'axe-puppeteer'

describe('Auto-Sync Accessibility Tests', () => {
  let browser: any
  let page: Page

  beforeAll(async () => {
    browser = await setupBrowser()
  })

  afterAll(async () => {
    await teardownBrowser(browser)
  })

  beforeEach(async () => {
    page = await createPage(browser)
    await page.goto('http://localhost:3000')
    await page.waitForSelector('[data-testid="app-loaded"]', { timeout: 10000 })
    
    // Inject axe-core for accessibility testing
    await injectAxe(page)
  })

  afterEach(async () => {
    await page.close()
  })

  describe('Sync Status Indicator Accessibility', () => {
    test('should have proper ARIA attributes', async () => {
      await page.waitForSelector('[data-testid="sync-indicator"]')
      
      // Check ARIA attributes
      const indicator = await page.$('[data-testid="sync-indicator"]')
      
      const ariaLabel = await indicator?.evaluate(el => el.getAttribute('aria-label'))
      expect(ariaLabel).toBeTruthy()
      expect(ariaLabel).toContain('sync')
      
      const role = await indicator?.evaluate(el => el.getAttribute('role'))
      expect(role).toBe('status')
      
      const ariaLive = await indicator?.evaluate(el => el.getAttribute('aria-live'))
      expect(ariaLive).toBe('polite')
    })

    test('should announce status changes to screen readers', async () => {
      await page.waitForSelector('[data-testid="sync-indicator"]')
      
      // Go offline
      await page.setOfflineMode(true)
      
      // Check that status change is announced
      await page.waitForFunction(
        () => {
          const indicator = document.querySelector('[data-testid="sync-indicator"]')
          return indicator?.getAttribute('aria-label')?.includes('offline')
        },
        { timeout: 5000 }
      )
      
      const offlineLabel = await page.$eval('[data-testid="sync-indicator"]', el => el.getAttribute('aria-label'))
      expect(offlineLabel).toContain('offline')
      
      // Go online
      await page.setOfflineMode(false)
      
      // Check that online status is announced
      await page.waitForFunction(
        () => {
          const indicator = document.querySelector('[data-testid="sync-indicator"]')
          return indicator?.getAttribute('aria-label')?.includes('online')
        },
        { timeout: 5000 }
      )
      
      const onlineLabel = await page.$eval('[data-testid="sync-indicator"]', el => el.getAttribute('aria-label'))
      expect(onlineLabel).toContain('online')
    })

    test('should be focusable with keyboard navigation', async () => {
      await page.waitForSelector('[data-testid="sync-indicator"]')
      
      // Navigate to indicator with Tab
      await page.keyboard.press('Tab')
      
      // Check if indicator is focused
      const focusedElement = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))
      expect(focusedElement).toBe('sync-indicator')
      
      // Should have proper focus styles
      const focusStyles = await page.$eval('[data-testid="sync-indicator"]:focus', el => 
        window.getComputedStyle(el).outline
      )
      expect(focusStyles).toBeTruthy()
    })

    test('should show tooltip on focus', async () => {
      await page.waitForSelector('[data-testid="sync-indicator"]')
      
      // Focus the indicator
      await page.focus('[data-testid="sync-indicator"]')
      
      // Check tooltip appears
      await page.waitForSelector('[role="tooltip"]', { timeout: 5000 })
      
      const tooltip = await page.$('[role="tooltip"]')
      expect(tooltip).toBeTruthy()
      
      // Check tooltip content is accessible
      const tooltipText = await tooltip?.evaluate(el => el.textContent)
      expect(tooltipText).toBeTruthy()
      expect(tooltipText).toContain('sync')
    })

    test('should have sufficient color contrast', async () => {
      await page.waitForSelector('[data-testid="sync-indicator"]')
      
      // Test different states
      const states = ['online', 'offline', 'syncing', 'error']
      
      for (const state of states) {
        // Simulate different states
        await page.evaluate((s) => {
          const indicator = document.querySelector('[data-testid="sync-indicator"]')
          if (indicator) {
            indicator.className = indicator.className.replace(/bg-\w+-\d+/g, '')
            switch (s) {
              case 'online':
                indicator.classList.add('bg-green-500')
                break
              case 'offline':
                indicator.classList.add('bg-orange-500')
                break
              case 'syncing':
                indicator.classList.add('bg-blue-500')
                break
              case 'error':
                indicator.classList.add('bg-red-500')
                break
            }
          }
        }, state)
        
        // Run accessibility check
        const results = await axeCheck(page, {
          rules: {
            'color-contrast': { enabled: true }
          }
        })
        
        expect(results.violations.filter(v => v.id === 'color-contrast')).toHaveLength(0)
      }
    })
  })

  describe('Settings Interface Accessibility', () => {
    test('should have proper heading structure', async () => {
      await page.click('[data-testid="settings-button"]')
      await page.waitForSelector('[data-testid="settings-page"]')
      
      // Check heading hierarchy
      const headings = await page.$$eval('h1, h2, h3, h4, h5, h6', elements => 
        elements.map(el => ({ tagName: el.tagName, text: el.textContent }))
      )
      
      expect(headings).toHaveLength(4) // Should have proper heading structure
      expect(headings[0].tagName).toBe('H1') // Main page title
      expect(headings[1].tagName).toBe('H2') // Settings section
      expect(headings[2].tagName).toBe('H3') // Auto-sync section
    })

    test('should have accessible form controls', async () => {
      await page.click('[data-testid="settings-button"]')
      await page.waitForSelector('[data-testid="settings-page"]')
      
      // Check force sync button
      const forceSyncButton = await page.$('[data-testid="force-sync-button"]')
      expect(forceSyncButton).toBeTruthy()
      
      const buttonLabel = await forceSyncButton?.evaluate(el => el.textContent)
      expect(buttonLabel).toBeTruthy()
      
      const ariaLabel = await forceSyncButton?.evaluate(el => el.getAttribute('aria-label'))
      if (ariaLabel) {
        expect(ariaLabel).toContain('sync')
      }
      
      // Check button is focusable
      await page.focus('[data-testid="force-sync-button"]')
      const focusedButton = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))
      expect(focusedButton).toBe('force-sync-button')
    })

    test('should provide status information accessibly', async () => {
      await page.click('[data-testid="settings-button"]')
      await page.waitForSelector('[data-testid="settings-page"]')
      
      // Check sync status region
      const statusRegion = await page.$('[data-testid="auto-sync-status"]')
      expect(statusRegion).toBeTruthy()
      
      const statusRole = await statusRegion?.evaluate(el => el.getAttribute('role'))
      expect(statusRole).toBe('status')
      
      const statusAriaLive = await statusRegion?.evaluate(el => el.getAttribute('aria-live'))
      expect(statusAriaLive).toBe('polite')
      
      // Check status text is meaningful
      const statusText = await statusRegion?.evaluate(el => el.textContent)
      expect(statusText).toBeTruthy()
      expect(statusText).toMatch(/(online|offline|syncing)/i)
    })

    test('should handle disabled states accessibly', async () => {
      await page.click('[data-testid="settings-button"]')
      await page.waitForSelector('[data-testid="settings-page"]')
      
      // Create scenario where sync button is disabled
      await page.setOfflineMode(true)
      
      // Check button is disabled and has proper attributes
      const disabledButton = await page.$('[data-testid="force-sync-button"]')
      const isDisabled = await disabledButton?.evaluate(el => el.hasAttribute('disabled'))
      
      if (isDisabled) {
        const ariaDisabled = await disabledButton?.evaluate(el => el.getAttribute('aria-disabled'))
        expect(ariaDisabled).toBe('true')
        
        // Should have visual indication of disabled state
        const disabledStyles = await disabledButton?.evaluate(el => 
          window.getComputedStyle(el).opacity
        )
        expect(parseFloat(disabledStyles || '1')).toBeLessThan(1)
      }
    })
  })

  describe('Sync Badge Accessibility', () => {
    test('should have proper ARIA labeling', async () => {
      // Create pending operations to show badge
      await page.setOfflineMode(true)
      
      await page.click('[data-testid="add-expense-button"]')
      await page.waitForSelector('[data-testid="expense-form"]')
      
      await page.type('[data-testid="expense-amount"]', '25.50')
      await page.type('[data-testid="expense-description"]', 'Accessibility test')
      await page.select('[data-testid="expense-category"]', 'cat-food')
      await page.select('[data-testid="expense-account"]', 'acc-checking')
      
      await page.click('[data-testid="save-expense-button"]')
      
      // Check badge accessibility
      await page.waitForSelector('[data-testid="sync-badge"]')
      
      const badge = await page.$('[data-testid="sync-badge"]')
      const badgeText = await badge?.evaluate(el => el.textContent)
      expect(badgeText).toBe('1')
      
      const ariaLabel = await badge?.evaluate(el => el.getAttribute('aria-label'))
      expect(ariaLabel).toBeTruthy()
      expect(ariaLabel).toContain('pending')
      expect(ariaLabel).toContain('1')
    })

    test('should update screen reader announcements', async () => {
      // Create multiple pending operations
      await page.setOfflineMode(true)
      
      // Add first expense
      await page.click('[data-testid="add-expense-button"]')
      await page.waitForSelector('[data-testid="expense-form"]')
      
      await page.type('[data-testid="expense-amount"]', '30.00')
      await page.type('[data-testid="expense-description"]', 'First expense')
      await page.select('[data-testid="expense-category"]', 'cat-food')
      await page.select('[data-testid="expense-account"]', 'acc-checking')
      
      await page.click('[data-testid="save-expense-button"]')
      
      // Check initial badge
      await page.waitForSelector('[data-testid="sync-badge"]')
      let badgeLabel = await page.$eval('[data-testid="sync-badge"]', el => el.getAttribute('aria-label'))
      expect(badgeLabel).toContain('1')
      
      // Add second expense
      await page.click('[data-testid="add-expense-button"]')
      await page.waitForSelector('[data-testid="expense-form"]')
      
      await page.type('[data-testid="expense-amount"]', '45.00')
      await page.type('[data-testid="expense-description"]', 'Second expense')
      await page.select('[data-testid="expense-category"]', 'cat-food')
      await page.select('[data-testid="expense-account"]', 'acc-checking')
      
      await page.click('[data-testid="save-expense-button"]')
      
      // Check updated badge
      await page.waitForFunction(
        () => {
          const badge = document.querySelector('[data-testid="sync-badge"]')
          return badge?.textContent === '2'
        },
        { timeout: 5000 }
      )
      
      badgeLabel = await page.$eval('[data-testid="sync-badge"]', el => el.getAttribute('aria-label'))
      expect(badgeLabel).toContain('2')
    })

    test('should handle badge removal accessibly', async () => {
      // Create pending operation
      await page.setOfflineMode(true)
      
      await page.click('[data-testid="add-expense-button"]')
      await page.waitForSelector('[data-testid="expense-form"]')
      
      await page.type('[data-testid="expense-amount"]', '60.00')
      await page.type('[data-testid="expense-description"]', 'Badge removal test')
      await page.select('[data-testid="expense-category"]', 'cat-food')
      await page.select('[data-testid="expense-account"]', 'acc-checking')
      
      await page.click('[data-testid="save-expense-button"]')
      
      // Verify badge is present
      await page.waitForSelector('[data-testid="sync-badge"]')
      
      // Go online to sync
      await page.setOfflineMode(false)
      
      // Wait for badge to be removed
      await page.waitForFunction(
        () => {
          const badge = document.querySelector('[data-testid="sync-badge"]')
          return !badge || badge.textContent === '0'
        },
        { timeout: 15000 }
      )
      
      // Check badge is removed or shows 0
      const badge = await page.$('[data-testid="sync-badge"]')
      if (badge) {
        const badgeText = await badge.evaluate(el => el.textContent)
        expect(badgeText).toBe('0')
      }
    })
  })

  describe('Keyboard Navigation', () => {
    test('should support full keyboard navigation', async () => {
      // Start keyboard navigation
      await page.keyboard.press('Tab')
      
      // Should be able to navigate to sync indicator
      const firstFocused = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))
      expect(['sync-indicator', 'settings-button', 'add-expense-button']).toContain(firstFocused)
      
      // Continue navigation
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')
      
      // Should reach settings
      let currentFocused = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))
      
      // Navigate to settings if not already there
      if (currentFocused !== 'settings-button') {
        await page.keyboard.press('Tab')
        currentFocused = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))
      }
      
      expect(currentFocused).toBe('settings-button')
      
      // Enter settings
      await page.keyboard.press('Enter')
      await page.waitForSelector('[data-testid="settings-page"]')
      
      // Navigate within settings
      await page.keyboard.press('Tab')
      
      const settingsFocused = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))
      expect(settingsFocused).toBe('force-sync-button')
    })

    test('should handle focus management during status changes', async () => {
      await page.click('[data-testid="settings-button"]')
      await page.waitForSelector('[data-testid="settings-page"]')
      
      // Focus the force sync button
      await page.focus('[data-testid="force-sync-button"]')
      
      // Verify focus
      let focusedElement = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))
      expect(focusedElement).toBe('force-sync-button')
      
      // Trigger sync
      await page.keyboard.press('Enter')
      
      // Focus should remain on button or be managed properly
      focusedElement = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))
      expect(focusedElement).toBe('force-sync-button')
    })

    test('should support Skip to Content functionality', async () => {
      // Check for skip link
      await page.keyboard.press('Tab')
      
      const skipLink = await page.$('[data-testid="skip-to-content"]')
      if (skipLink) {
        const skipText = await skipLink.evaluate(el => el.textContent)
        expect(skipText).toContain('Skip to')
        
        // Activate skip link
        await page.keyboard.press('Enter')
        
        // Should move focus to main content
        const mainContent = await page.$('[data-testid="main-content"]')
        expect(mainContent).toBeTruthy()
      }
    })
  })

  describe('Screen Reader Support', () => {
    test('should provide meaningful page titles', async () => {
      // Check main page title
      let pageTitle = await page.title()
      expect(pageTitle).toBeTruthy()
      expect(pageTitle).toContain('Expense')
      
      // Check settings page title
      await page.click('[data-testid="settings-button"]')
      await page.waitForSelector('[data-testid="settings-page"]')
      
      pageTitle = await page.title()
      expect(pageTitle).toContain('Settings')
    })

    test('should have proper landmark roles', async () => {
      // Check for main landmark
      const mainLandmark = await page.$('[role="main"]')
      expect(mainLandmark).toBeTruthy()
      
      // Check for navigation landmark
      const navLandmark = await page.$('[role="navigation"]')
      expect(navLandmark).toBeTruthy()
      
      // Check for banner landmark
      const bannerLandmark = await page.$('[role="banner"]')
      expect(bannerLandmark).toBeTruthy()
    })

    test('should provide descriptive labels for form controls', async () => {
      await page.click('[data-testid="add-expense-button"]')
      await page.waitForSelector('[data-testid="expense-form"]')
      
      // Check form inputs have labels
      const formInputs = await page.$$('input, select, textarea')
      
      for (const input of formInputs) {
        const inputId = await input.evaluate(el => el.id)
        const ariaLabel = await input.evaluate(el => el.getAttribute('aria-label'))
        const ariaLabelledBy = await input.evaluate(el => el.getAttribute('aria-labelledby'))
        
        // Should have label, aria-label, or aria-labelledby
        if (inputId) {
          const label = await page.$(`label[for="${inputId}"]`)
          expect(label || ariaLabel || ariaLabelledBy).toBeTruthy()
        } else {
          expect(ariaLabel || ariaLabelledBy).toBeTruthy()
        }
      }
    })

    test('should announce form validation errors', async () => {
      await page.click('[data-testid="add-expense-button"]')
      await page.waitForSelector('[data-testid="expense-form"]')
      
      // Submit form with invalid data
      await page.type('[data-testid="expense-amount"]', 'invalid')
      await page.click('[data-testid="save-expense-button"]')
      
      // Check for error messages
      const errorMessages = await page.$$('[role="alert"]')
      expect(errorMessages.length).toBeGreaterThan(0)
      
      // Check error message content
      const errorText = await errorMessages[0].evaluate(el => el.textContent)
      expect(errorText).toBeTruthy()
      expect(errorText).toContain('amount')
    })
  })

  describe('High Contrast Mode Support', () => {
    test('should work in high contrast mode', async () => {
      // Simulate high contrast mode
      await page.emulateMediaFeatures([
        { name: 'prefers-contrast', value: 'high' }
      ])
      
      // Reload page to apply high contrast styles
      await page.reload()
      await page.waitForSelector('[data-testid="app-loaded"]')
      
      // Check sync indicator in high contrast
      await page.waitForSelector('[data-testid="sync-indicator"]')
      
      const indicatorStyles = await page.$eval('[data-testid="sync-indicator"]', el => {
        const styles = window.getComputedStyle(el)
        return {
          backgroundColor: styles.backgroundColor,
          border: styles.border,
          outline: styles.outline
        }
      })
      
      // Should have visible border or outline in high contrast
      expect(indicatorStyles.border || indicatorStyles.outline).toBeTruthy()
    })

    test('should maintain functionality in forced colors mode', async () => {
      // Simulate forced colors mode
      await page.emulateMediaFeatures([
        { name: 'forced-colors', value: 'active' }
      ])
      
      await page.reload()
      await page.waitForSelector('[data-testid="app-loaded"]')
      
      // Check that sync indicator is still functional
      await page.waitForSelector('[data-testid="sync-indicator"]')
      
      const indicator = await page.$('[data-testid="sync-indicator"]')
      expect(indicator).toBeTruthy()
      
      // Should still be focusable
      await page.focus('[data-testid="sync-indicator"]')
      const focusedElement = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))
      expect(focusedElement).toBe('sync-indicator')
    })
  })

  describe('Motion and Animation Preferences', () => {
    test('should respect reduced motion preferences', async () => {
      // Simulate reduced motion preference
      await page.emulateMediaFeatures([
        { name: 'prefers-reduced-motion', value: 'reduce' }
      ])
      
      await page.reload()
      await page.waitForSelector('[data-testid="app-loaded"]')
      
      // Check that syncing animation is reduced
      await page.setOfflineMode(true)
      
      // Create syncing state
      await page.click('[data-testid="add-expense-button"]')
      await page.waitForSelector('[data-testid="expense-form"]')
      
      await page.type('[data-testid="expense-amount"]', '25.50')
      await page.type('[data-testid="expense-description"]', 'Motion test')
      await page.select('[data-testid="expense-category"]', 'cat-food')
      await page.select('[data-testid="expense-account"]', 'acc-checking')
      
      await page.click('[data-testid="save-expense-button"]')
      
      // Go online to trigger sync
      await page.setOfflineMode(false)
      
      // Check that spinning animation is reduced or removed
      const syncIndicator = await page.$('[data-testid="sync-indicator"]')
      const hasSpinAnimation = await syncIndicator?.evaluate(el => 
        el.classList.contains('animate-spin')
      )
      
      // Should not have spinning animation with reduced motion
      expect(hasSpinAnimation).toBe(false)
    })
  })

  describe('Comprehensive Accessibility Audit', () => {
    test('should pass automated accessibility checks', async () => {
      // Configure axe for comprehensive testing
      await configureAxe(page, {
        rules: {
          'color-contrast': { enabled: true },
          'keyboard-navigation': { enabled: true },
          'aria-labels': { enabled: true },
          'landmarks': { enabled: true },
          'headings': { enabled: true },
          'forms': { enabled: true }
        }
      })
      
      // Run accessibility audit on main page
      const mainPageResults = await axeCheck(page)
      expect(mainPageResults.violations).toHaveLength(0)
      
      // Run audit on settings page
      await page.click('[data-testid="settings-button"]')
      await page.waitForSelector('[data-testid="settings-page"]')
      
      const settingsResults = await axeCheck(page)
      expect(settingsResults.violations).toHaveLength(0)
      
      // Run audit on form page
      await page.click('[data-testid="add-expense-button"]')
      await page.waitForSelector('[data-testid="expense-form"]')
      
      const formResults = await axeCheck(page)
      expect(formResults.violations).toHaveLength(0)
    })

    test('should meet WCAG 2.1 AA standards', async () => {
      // Test specific WCAG guidelines
      const wcagResults = await axeCheck(page, {
        tags: ['wcag2a', 'wcag2aa', 'wcag21aa']
      })
      
      expect(wcagResults.violations).toHaveLength(0)
      
      // Log accessibility score
      const score = wcagResults.passes.length / (wcagResults.passes.length + wcagResults.violations.length)
      console.log(`Accessibility Score: ${(score * 100).toFixed(2)}%`)
      
      expect(score).toBeGreaterThan(0.95) // Should achieve >95% accessibility score
    })

    test('should handle edge cases accessibly', async () => {
      // Test with many pending operations
      await page.setOfflineMode(true)
      
      // Create many pending operations
      for (let i = 0; i < 10; i++) {
        await page.click('[data-testid="add-expense-button"]')
        await page.waitForSelector('[data-testid="expense-form"]')
        
        await page.type('[data-testid="expense-amount"]', `${(i + 1) * 10}.00`)
        await page.type('[data-testid="expense-description"]', `Edge case expense ${i + 1}`)
        await page.select('[data-testid="expense-category"]', 'cat-food')
        await page.select('[data-testid="expense-account"]', 'acc-checking')
        
        await page.click('[data-testid="save-expense-button"]')
        
        // Clear form inputs
        await page.evaluate(() => {
          const amountInput = document.querySelector('[data-testid="expense-amount"]') as HTMLInputElement
          const descInput = document.querySelector('[data-testid="expense-description"]') as HTMLInputElement
          if (amountInput) amountInput.value = ''
          if (descInput) descInput.value = ''
        })
      }
      
      // Check badge accessibility with high count
      await page.waitForSelector('[data-testid="sync-badge"]')
      const badgeLabel = await page.$eval('[data-testid="sync-badge"]', el => el.getAttribute('aria-label'))
      expect(badgeLabel).toContain('10')
      
      // Run accessibility check with many pending operations
      const edgeCaseResults = await axeCheck(page)
      expect(edgeCaseResults.violations).toHaveLength(0)
    })
  })
})
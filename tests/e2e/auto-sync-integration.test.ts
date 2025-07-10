/**
 * E2E Integration Tests for Auto-Sync System
 * Tests the complete offline-first synchronization flow
 */

import { Page } from 'puppeteer'
import { setupBrowser, teardownBrowser, createPage } from '../setup-e2e'
import { autoSyncManager } from '@/lib/auto-sync-manager'
import { offlineQueue } from '@/lib/offline-queue'
import { connectivityManager } from '@/lib/connectivity-manager'

describe('Auto-Sync E2E Integration Tests', () => {
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
    
    // Wait for app to load
    await page.waitForSelector('[data-testid="app-loaded"]', { timeout: 10000 })
  })

  afterEach(async () => {
    await page.close()
  })

  describe('Complete Offline-to-Online Sync Flow', () => {
    test('should handle offline expense creation and sync when online', async () => {
      // Step 1: Simulate going offline
      await page.setOfflineMode(true)
      
      // Verify offline indicator is shown
      await page.waitForSelector('[data-testid="sync-indicator"]')
      const indicator = await page.$('[data-testid="sync-indicator"]')
      const indicatorClass = await indicator?.evaluate(el => el.className)
      expect(indicatorClass).toContain('bg-orange-500') // Offline state
      
      // Step 2: Create expense while offline
      await page.click('[data-testid="add-expense-button"]')
      await page.waitForSelector('[data-testid="expense-form"]')
      
      await page.type('[data-testid="expense-amount"]', '25.50')
      await page.type('[data-testid="expense-description"]', 'Offline expense')
      await page.select('[data-testid="expense-category"]', 'cat-food')
      await page.select('[data-testid="expense-account"]', 'acc-checking')
      
      await page.click('[data-testid="save-expense-button"]')
      
      // Verify expense is saved locally
      await page.waitForSelector('[data-testid="expense-list"]')
      const expenseText = await page.$eval('[data-testid="expense-list"]', el => el.textContent)
      expect(expenseText).toContain('Offline expense')
      expect(expenseText).toContain('25.50')
      
      // Verify pending operations indicator shows 1
      await page.waitForSelector('[data-testid="sync-badge"]')
      const badgeText = await page.$eval('[data-testid="sync-badge"]', el => el.textContent)
      expect(badgeText).toBe('1')
      
      // Step 3: Go back online
      await page.setOfflineMode(false)
      
      // Wait for sync to complete
      await page.waitForFunction(
        () => {
          const badge = document.querySelector('[data-testid="sync-badge"]')
          return !badge || badge.textContent === '0'
        },
        { timeout: 10000 }
      )
      
      // Verify sync indicator shows online
      const onlineIndicator = await page.$('[data-testid="sync-indicator"]')
      const onlineClass = await onlineIndicator?.evaluate(el => el.className)
      expect(onlineClass).toContain('bg-green-500') // Online state
      
      // Step 4: Verify data is now in remote database
      await page.reload()
      await page.waitForSelector('[data-testid="expense-list"]')
      
      const persistedExpenseText = await page.$eval('[data-testid="expense-list"]', el => el.textContent)
      expect(persistedExpenseText).toContain('Offline expense')
      expect(persistedExpenseText).toContain('25.50')
    })

    test('should handle two-user conflict resolution', async () => {
      // Step 1: Create expense in user 1 session
      await page.click('[data-testid="add-expense-button"]')
      await page.waitForSelector('[data-testid="expense-form"]')
      
      await page.type('[data-testid="expense-amount"]', '50.00')
      await page.type('[data-testid="expense-description"]', 'Original expense')
      await page.select('[data-testid="expense-category"]', 'cat-food')
      await page.select('[data-testid="expense-account"]', 'acc-checking')
      
      await page.click('[data-testid="save-expense-button"]')
      
      // Wait for sync to complete
      await page.waitForFunction(
        () => {
          const badge = document.querySelector('[data-testid="sync-badge"]')
          return !badge || badge.textContent === '0'
        },
        { timeout: 10000 }
      )
      
      // Step 2: Simulate user 2 session in new tab
      const page2 = await createPage(browser)
      await page2.goto('http://localhost:3000')
      await page2.waitForSelector('[data-testid="app-loaded"]')
      
      // Step 3: Both users go offline
      await page.setOfflineMode(true)
      await page2.setOfflineMode(true)
      
      // Step 4: Both users edit the same expense
      await page.click('[data-testid="expense-item"]:first-child [data-testid="edit-button"]')
      await page.waitForSelector('[data-testid="expense-form"]')
      await page.click('[data-testid="expense-amount"]', { clickCount: 3 })
      await page.type('[data-testid="expense-amount"]', '75.00')
      await page.click('[data-testid="save-expense-button"]')
      
      await page2.click('[data-testid="expense-item"]:first-child [data-testid="edit-button"]')
      await page2.waitForSelector('[data-testid="expense-form"]')
      await page2.click('[data-testid="expense-description"]', { clickCount: 3 })
      await page2.type('[data-testid="expense-description"]', 'Updated description')
      await page2.click('[data-testid="save-expense-button"]')
      
      // Step 5: Both users go back online
      await page.setOfflineMode(false)
      await page2.setOfflineMode(false)
      
      // Wait for conflict resolution
      await page.waitForFunction(
        () => {
          const badge = document.querySelector('[data-testid="sync-badge"]')
          return !badge || badge.textContent === '0'
        },
        { timeout: 15000 }
      )
      
      await page2.waitForFunction(
        () => {
          const badge = document.querySelector('[data-testid="sync-badge"]')
          return !badge || badge.textContent === '0'
        },
        { timeout: 15000 }
      )
      
      // Step 6: Verify conflict resolution (field-level merge)
      await page.reload()
      await page.waitForSelector('[data-testid="expense-list"]')
      
      const resolvedExpenseText = await page.$eval('[data-testid="expense-list"]', el => el.textContent)
      expect(resolvedExpenseText).toContain('75.00') // Amount from user 1
      expect(resolvedExpenseText).toContain('Updated description') // Description from user 2
      
      // Verify both users see the same resolved data
      await page2.reload()
      await page2.waitForSelector('[data-testid="expense-list"]')
      
      const resolvedExpenseText2 = await page2.$eval('[data-testid="expense-list"]', el => el.textContent)
      expect(resolvedExpenseText2).toContain('75.00')
      expect(resolvedExpenseText2).toContain('Updated description')
      
      await page2.close()
    })

    test('should handle rapid offline/online transitions', async () => {
      // Step 1: Create multiple expenses with rapid online/offline transitions
      for (let i = 0; i < 5; i++) {
        // Go offline
        await page.setOfflineMode(true)
        
        // Create expense
        await page.click('[data-testid="add-expense-button"]')
        await page.waitForSelector('[data-testid="expense-form"]')
        
        await page.type('[data-testid="expense-amount"]', `${(i + 1) * 10}.00`)
        await page.type('[data-testid="expense-description"]', `Expense ${i + 1}`)
        await page.select('[data-testid="expense-category"]', 'cat-food')
        await page.select('[data-testid="expense-account"]', 'acc-checking')
        
        await page.click('[data-testid="save-expense-button"]')
        
        // Go online briefly
        await page.setOfflineMode(false)
        await page.waitForTimeout(1000) // Brief online period
      }
      
      // Step 2: Stay online and wait for all syncs to complete
      await page.waitForFunction(
        () => {
          const badge = document.querySelector('[data-testid="sync-badge"]')
          return !badge || badge.textContent === '0'
        },
        { timeout: 20000 }
      )
      
      // Step 3: Verify all expenses are synced
      await page.reload()
      await page.waitForSelector('[data-testid="expense-list"]')
      
      const allExpensesText = await page.$eval('[data-testid="expense-list"]', el => el.textContent)
      for (let i = 0; i < 5; i++) {
        expect(allExpensesText).toContain(`Expense ${i + 1}`)
        expect(allExpensesText).toContain(`${(i + 1) * 10}.00`)
      }
    })
  })

  describe('Settings Integration', () => {
    test('should display auto-sync status in settings', async () => {
      // Navigate to settings
      await page.click('[data-testid="settings-button"]')
      await page.waitForSelector('[data-testid="settings-page"]')
      
      // Verify auto-sync status is displayed
      await page.waitForSelector('[data-testid="auto-sync-status"]')
      const statusText = await page.$eval('[data-testid="auto-sync-status"]', el => el.textContent)
      expect(statusText).toContain('online')
      expect(statusText).toContain('automatic')
      
      // Verify no enable/disable toggles
      const toggles = await page.$$('[data-testid="auto-sync-toggle"]')
      expect(toggles).toHaveLength(0)
      
      // Verify force sync button is present
      const forceSyncButton = await page.$('[data-testid="force-sync-button"]')
      expect(forceSyncButton).toBeTruthy()
    })

    test('should allow manual sync trigger', async () => {
      // Create offline expense
      await page.setOfflineMode(true)
      
      await page.click('[data-testid="add-expense-button"]')
      await page.waitForSelector('[data-testid="expense-form"]')
      
      await page.type('[data-testid="expense-amount"]', '100.00')
      await page.type('[data-testid="expense-description"]', 'Manual sync test')
      await page.select('[data-testid="expense-category"]', 'cat-food')
      await page.select('[data-testid="expense-account"]', 'acc-checking')
      
      await page.click('[data-testid="save-expense-button"]')
      
      // Go online
      await page.setOfflineMode(false)
      
      // Navigate to settings
      await page.click('[data-testid="settings-button"]')
      await page.waitForSelector('[data-testid="settings-page"]')
      
      // Verify pending operations are shown
      await page.waitForSelector('[data-testid="pending-operations"]')
      const pendingText = await page.$eval('[data-testid="pending-operations"]', el => el.textContent)
      expect(pendingText).toContain('1')
      
      // Trigger manual sync
      await page.click('[data-testid="force-sync-button"]')
      
      // Wait for sync to complete
      await page.waitForFunction(
        () => {
          const pendingElement = document.querySelector('[data-testid="pending-operations"]')
          return pendingElement?.textContent?.includes('0')
        },
        { timeout: 10000 }
      )
      
      // Verify sync completed
      const completedText = await page.$eval('[data-testid="pending-operations"]', el => el.textContent)
      expect(completedText).toContain('0')
    })

    test('should show last sync time', async () => {
      // Navigate to settings
      await page.click('[data-testid="settings-button"]')
      await page.waitForSelector('[data-testid="settings-page"]')
      
      // Verify last sync time is displayed
      await page.waitForSelector('[data-testid="last-sync-time"]')
      const lastSyncText = await page.$eval('[data-testid="last-sync-time"]', el => el.textContent)
      expect(lastSyncText).toMatch(/\d+\s+(second|minute|hour)s?\s+ago|just now/i)
    })
  })

  describe('Error Handling and Recovery', () => {
    test('should handle network errors gracefully', async () => {
      // Create expense while online
      await page.click('[data-testid="add-expense-button"]')
      await page.waitForSelector('[data-testid="expense-form"]')
      
      await page.type('[data-testid="expense-amount"]', '30.00')
      await page.type('[data-testid="expense-description"]', 'Network error test')
      await page.select('[data-testid="expense-category"]', 'cat-food')
      await page.select('[data-testid="expense-account"]', 'acc-checking')
      
      // Simulate network error during save
      await page.setOfflineMode(true)
      await page.click('[data-testid="save-expense-button"]')
      
      // Verify expense is queued
      await page.waitForSelector('[data-testid="sync-badge"]')
      const badgeText = await page.$eval('[data-testid="sync-badge"]', el => el.textContent)
      expect(badgeText).toBe('1')
      
      // Go back online
      await page.setOfflineMode(false)
      
      // Verify automatic retry and sync
      await page.waitForFunction(
        () => {
          const badge = document.querySelector('[data-testid="sync-badge"]')
          return !badge || badge.textContent === '0'
        },
        { timeout: 15000 }
      )
      
      // Verify expense is persisted
      await page.reload()
      await page.waitForSelector('[data-testid="expense-list"]')
      
      const expenseText = await page.$eval('[data-testid="expense-list"]', el => el.textContent)
      expect(expenseText).toContain('Network error test')
    })

    test('should handle data validation errors', async () => {
      // Create invalid expense
      await page.click('[data-testid="add-expense-button"]')
      await page.waitForSelector('[data-testid="expense-form"]')
      
      await page.type('[data-testid="expense-amount"]', 'invalid-amount')
      await page.type('[data-testid="expense-description"]', 'Invalid expense')
      await page.select('[data-testid="expense-category"]', 'cat-food')
      await page.select('[data-testid="expense-account"]', 'acc-checking')
      
      await page.click('[data-testid="save-expense-button"]')
      
      // Verify validation error is shown
      await page.waitForSelector('[data-testid="validation-error"]')
      const errorText = await page.$eval('[data-testid="validation-error"]', el => el.textContent)
      expect(errorText).toContain('Invalid amount')
      
      // Verify expense is not saved
      const expenseList = await page.$('[data-testid="expense-list"]')
      if (expenseList) {
        const expenseText = await expenseList.evaluate(el => el.textContent)
        expect(expenseText).not.toContain('Invalid expense')
      }
    })

    test('should handle quota exceeded errors', async () => {
      // Fill up storage quota by creating many expenses
      for (let i = 0; i < 100; i++) {
        await page.evaluate((index) => {
          const largeData = 'x'.repeat(10000) // 10KB per expense
          localStorage.setItem(`test-expense-${index}`, largeData)
        }, i)
      }
      
      // Try to create new expense
      await page.click('[data-testid="add-expense-button"]')
      await page.waitForSelector('[data-testid="expense-form"]')
      
      await page.type('[data-testid="expense-amount"]', '50.00')
      await page.type('[data-testid="expense-description"]', 'Quota test')
      await page.select('[data-testid="expense-category"]', 'cat-food')
      await page.select('[data-testid="expense-account"]', 'acc-checking')
      
      await page.click('[data-testid="save-expense-button"]')
      
      // Verify quota error handling
      await page.waitForSelector('[data-testid="storage-warning"]', { timeout: 5000 })
      const warningText = await page.$eval('[data-testid="storage-warning"]', el => el.textContent)
      expect(warningText).toContain('storage')
      
      // Cleanup
      await page.evaluate(() => {
        for (let i = 0; i < 100; i++) {
          localStorage.removeItem(`test-expense-${i}`)
        }
      })
    })
  })

  describe('Performance and Scalability', () => {
    test('should handle large datasets efficiently', async () => {
      // Create many expenses
      const startTime = Date.now()
      
      for (let i = 0; i < 50; i++) {
        await page.click('[data-testid="add-expense-button"]')
        await page.waitForSelector('[data-testid="expense-form"]')
        
        await page.type('[data-testid="expense-amount"]', `${(i + 1) * 5}.00`)
        await page.type('[data-testid="expense-description"]', `Performance test ${i + 1}`)
        await page.select('[data-testid="expense-category"]', 'cat-food')
        await page.select('[data-testid="expense-account"]', 'acc-checking')
        
        await page.click('[data-testid="save-expense-button"]')
        
        // Clear form inputs for next iteration
        await page.evaluate(() => {
          const amountInput = document.querySelector('[data-testid="expense-amount"]') as HTMLInputElement
          const descInput = document.querySelector('[data-testid="expense-description"]') as HTMLInputElement
          if (amountInput) amountInput.value = ''
          if (descInput) descInput.value = ''
        })
      }
      
      const endTime = Date.now()
      const totalTime = endTime - startTime
      
      // Should complete within reasonable time (less than 30 seconds)
      expect(totalTime).toBeLessThan(30000)
      
      // Verify all expenses are displayed
      await page.waitForSelector('[data-testid="expense-list"]')
      const expenseItems = await page.$$('[data-testid="expense-item"]')
      expect(expenseItems.length).toBe(50)
    })

    test('should sync large batches efficiently', async () => {
      // Go offline
      await page.setOfflineMode(true)
      
      // Create many expenses offline
      for (let i = 0; i < 20; i++) {
        await page.click('[data-testid="add-expense-button"]')
        await page.waitForSelector('[data-testid="expense-form"]')
        
        await page.type('[data-testid="expense-amount"]', `${(i + 1) * 10}.00`)
        await page.type('[data-testid="expense-description"]', `Batch sync ${i + 1}`)
        await page.select('[data-testid="expense-category"]', 'cat-food')
        await page.select('[data-testid="expense-account"]', 'acc-checking')
        
        await page.click('[data-testid="save-expense-button"]')
        
        // Clear form for next iteration
        await page.evaluate(() => {
          const amountInput = document.querySelector('[data-testid="expense-amount"]') as HTMLInputElement
          const descInput = document.querySelector('[data-testid="expense-description"]') as HTMLInputElement
          if (amountInput) amountInput.value = ''
          if (descInput) descInput.value = ''
        })
      }
      
      // Verify all are queued
      await page.waitForSelector('[data-testid="sync-badge"]')
      const badgeText = await page.$eval('[data-testid="sync-badge"]', el => el.textContent)
      expect(badgeText).toBe('20')
      
      // Go online and measure sync time
      const syncStartTime = Date.now()
      await page.setOfflineMode(false)
      
      // Wait for all to sync
      await page.waitForFunction(
        () => {
          const badge = document.querySelector('[data-testid="sync-badge"]')
          return !badge || badge.textContent === '0'
        },
        { timeout: 30000 }
      )
      
      const syncEndTime = Date.now()
      const syncTime = syncEndTime - syncStartTime
      
      // Should sync within reasonable time (less than 15 seconds)
      expect(syncTime).toBeLessThan(15000)
      
      // Verify all expenses are synced
      await page.reload()
      await page.waitForSelector('[data-testid="expense-list"]')
      
      const expenseItems = await page.$$('[data-testid="expense-item"]')
      expect(expenseItems.length).toBe(20)
    })
  })

  describe('Real-time Updates', () => {
    test('should receive real-time updates from other sessions', async () => {
      // Create second session
      const page2 = await createPage(browser)
      await page2.goto('http://localhost:3000')
      await page2.waitForSelector('[data-testid="app-loaded"]')
      
      // Get initial expense count
      await page.waitForSelector('[data-testid="expense-list"]')
      const initialItems = await page.$$('[data-testid="expense-item"]')
      const initialCount = initialItems.length
      
      // Create expense in second session
      await page2.click('[data-testid="add-expense-button"]')
      await page2.waitForSelector('[data-testid="expense-form"]')
      
      await page2.type('[data-testid="expense-amount"]', '99.99')
      await page2.type('[data-testid="expense-description"]', 'Real-time test')
      await page2.select('[data-testid="expense-category"]', 'cat-food')
      await page2.select('[data-testid="expense-account"]', 'acc-checking')
      
      await page2.click('[data-testid="save-expense-button"]')
      
      // First session should receive the update
      await page.waitForFunction(
        (expectedCount) => {
          const items = document.querySelectorAll('[data-testid="expense-item"]')
          return items.length === expectedCount
        },
        { timeout: 10000 },
        initialCount + 1
      )
      
      // Verify the new expense appears
      const expenseText = await page.$eval('[data-testid="expense-list"]', el => el.textContent)
      expect(expenseText).toContain('Real-time test')
      expect(expenseText).toContain('99.99')
      
      await page2.close()
    })

    test('should handle concurrent edits with real-time resolution', async () => {
      // Create initial expense
      await page.click('[data-testid="add-expense-button"]')
      await page.waitForSelector('[data-testid="expense-form"]')
      
      await page.type('[data-testid="expense-amount"]', '40.00')
      await page.type('[data-testid="expense-description"]', 'Concurrent edit test')
      await page.select('[data-testid="expense-category"]', 'cat-food')
      await page.select('[data-testid="expense-account"]', 'acc-checking')
      
      await page.click('[data-testid="save-expense-button"]')
      
      // Wait for sync
      await page.waitForFunction(
        () => {
          const badge = document.querySelector('[data-testid="sync-badge"]')
          return !badge || badge.textContent === '0'
        },
        { timeout: 10000 }
      )
      
      // Create second session
      const page2 = await createPage(browser)
      await page2.goto('http://localhost:3000')
      await page2.waitForSelector('[data-testid="app-loaded"]')
      
      // Both sessions edit the same expense simultaneously
      await page.click('[data-testid="expense-item"]:first-child [data-testid="edit-button"]')
      await page.waitForSelector('[data-testid="expense-form"]')
      
      await page2.click('[data-testid="expense-item"]:first-child [data-testid="edit-button"]')
      await page2.waitForSelector('[data-testid="expense-form"]')
      
      // Edit different fields
      await page.click('[data-testid="expense-amount"]', { clickCount: 3 })
      await page.type('[data-testid="expense-amount"]', '60.00')
      
      await page2.click('[data-testid="expense-description"]', { clickCount: 3 })
      await page2.type('[data-testid="expense-description"]', 'Updated concurrently')
      
      // Save both
      await page.click('[data-testid="save-expense-button"]')
      await page2.click('[data-testid="save-expense-button"]')
      
      // Wait for conflict resolution
      await page.waitForFunction(
        () => {
          const badge = document.querySelector('[data-testid="sync-badge"]')
          return !badge || badge.textContent === '0'
        },
        { timeout: 15000 }
      )
      
      // Both sessions should show the merged result
      await page.waitForFunction(
        () => {
          const list = document.querySelector('[data-testid="expense-list"]')
          return list?.textContent?.includes('60.00') && list?.textContent?.includes('Updated concurrently')
        },
        { timeout: 10000 }
      )
      
      await page2.waitForFunction(
        () => {
          const list = document.querySelector('[data-testid="expense-list"]')
          return list?.textContent?.includes('60.00') && list?.textContent?.includes('Updated concurrently')
        },
        { timeout: 10000 }
      )
      
      await page2.close()
    })
  })

  describe('Accessibility Integration', () => {
    test('should provide accessible sync status announcements', async () => {
      // Verify live region exists
      const liveRegion = await page.$('[aria-live="polite"]')
      expect(liveRegion).toBeTruthy()
      
      // Go offline
      await page.setOfflineMode(true)
      
      // Verify status announcement
      await page.waitForFunction(
        () => {
          const liveRegion = document.querySelector('[aria-live="polite"]')
          return liveRegion?.textContent?.includes('offline')
        },
        { timeout: 5000 }
      )
      
      // Go online
      await page.setOfflineMode(false)
      
      // Verify online announcement
      await page.waitForFunction(
        () => {
          const liveRegion = document.querySelector('[aria-live="polite"]')
          return liveRegion?.textContent?.includes('online')
        },
        { timeout: 5000 }
      )
    })

    test('should be keyboard accessible', async () => {
      // Navigate to settings with keyboard
      await page.keyboard.press('Tab')
      await page.keyboard.press('Enter') // Assuming first tab is settings
      
      await page.waitForSelector('[data-testid="settings-page"]')
      
      // Navigate to force sync button
      await page.keyboard.press('Tab')
      
      // Verify force sync button is focused
      const focusedElement = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))
      expect(focusedElement).toBe('force-sync-button')
      
      // Trigger sync with keyboard
      await page.keyboard.press('Enter')
      
      // Verify sync was triggered (button should be disabled)
      const isDisabled = await page.$eval('[data-testid="force-sync-button"]', el => el.hasAttribute('disabled'))
      expect(isDisabled).toBe(true)
    })
  })
})
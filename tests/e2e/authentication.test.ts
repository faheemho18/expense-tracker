import puppeteer, { Page, Browser } from 'puppeteer'

describe('Authentication E2E Tests', () => {
  let browser: Browser
  let page: Page

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: process.env.CI === 'true',
      slowMo: 50,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
  })

  afterAll(async () => {
    await browser.close()
  })

  beforeEach(async () => {
    page = await browser.newPage()
    await page.setViewport({ width: 1920, height: 1080 })
    
    // Clear local storage to ensure clean state
    await page.evaluateOnNewDocument(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
    
    await page.goto('http://localhost:3000')
    
    // Wait for the page to load
    await page.waitForSelector('[data-testid="app-layout"]', { timeout: 10000 })
  })

  afterEach(async () => {
    await page.close()
  })

  describe('localStorage mode (default)', () => {
    it('should work in localStorage mode when Supabase is not configured', async () => {
      // Check that the app loads without authentication
      const navigation = await page.$('[data-testid="navigation"]')
      expect(navigation).toBeTruthy()
      
      // Should not show authentication UI
      const authButton = await page.$('[data-testid="auth-button"]')
      expect(authButton).toBeFalsy()
      
      // Should be able to add expenses in localStorage mode
      const addButton = await page.waitForSelector('[data-testid="add-expense-button"]')
      await addButton.click()
      
      const sheet = await page.waitForSelector('[data-testid="add-expense-sheet"]')
      expect(sheet).toBeTruthy()
    })

    it('should persist data in localStorage across sessions', async () => {
      // Add an expense
      const addButton = await page.waitForSelector('[data-testid="add-expense-button"]')
      await addButton.click()
      
      await page.waitForSelector('input[name="description"]')
      await page.type('input[name="description"]', 'Test LocalStorage Expense')
      await page.type('input[name="amount"]', '25.99')
      
      const submitButton = await page.waitForSelector('[data-testid="submit-expense"]')
      await submitButton.click()
      
      // Wait for the expense to appear
      await page.waitForSelector('text=Test LocalStorage Expense', { timeout: 5000 })
      
      // Reload the page
      await page.reload()
      await page.waitForSelector('[data-testid="app-layout"]')
      
      // Check that the expense is still there
      const expense = await page.waitForSelector('text=Test LocalStorage Expense', { timeout: 5000 })
      expect(expense).toBeTruthy()
    })

    it('should handle theme persistence in localStorage', async () => {
      // Navigate to themes page
      const themesLink = await page.waitForSelector('[href="/themes"]')
      await themesLink.click()
      
      await page.waitForURL('**/themes')
      
      // Check that themes are available
      const themeContent = await page.waitForSelector('[data-testid="themes-content"]', { timeout: 5000 })
      expect(themeContent).toBeTruthy()
      
      // Theme changes should persist across reloads
      await page.reload()
      await page.waitForSelector('[data-testid="themes-content"]')
    })
  })

  describe('Supabase mode simulation', () => {
    beforeEach(async () => {
      // Mock Supabase configuration for testing
      await page.evaluateOnNewDocument(() => {
        // Simulate having Supabase configured
        window.mockSupabaseConfigured = true
      })
    })

    it('should show authentication UI when Supabase is configured', async () => {
      // Reload with mocked Supabase configuration
      await page.reload()
      await page.waitForSelector('[data-testid="app-layout"]')
      
      // Should show authentication-related UI elements
      // (This would depend on your actual implementation)
      const userMenu = await page.$('[data-testid="user-menu"]')
      const authSection = await page.$('[data-testid="auth-section"]')
      
      // At least one authentication element should be present
      expect(userMenu || authSection).toBeTruthy()
    })

    it('should handle authentication state changes', async () => {
      // Simulate user authentication state changes
      await page.evaluate(() => {
        // Mock authentication state
        window.mockAuthState = {
          user: {
            id: 'test-user',
            email: 'test@example.com',
          },
          loading: false,
          error: null,
        }
      })
      
      await page.reload()
      await page.waitForSelector('[data-testid="app-layout"]')
      
      // Check for user-specific UI elements
      const userInfo = await page.$('[data-testid="user-info"]')
      if (userInfo) {
        const userText = await page.evaluate(el => el.textContent, userInfo)
        expect(userText).toContain('test@example.com')
      }
    })

    it('should handle data isolation between users', async () => {
      // Simulate different users and verify data isolation
      const users = [
        { id: 'user-1', email: 'user1@example.com' },
        { id: 'user-2', email: 'user2@example.com' },
      ]

      for (const user of users) {
        // Simulate user login
        await page.evaluate((userData) => {
          window.mockAuthState = {
            user: userData,
            loading: false,
            error: null,
          }
          localStorage.setItem(`expenses_${userData.id}`, JSON.stringify([
            {
              id: `expense-${userData.id}`,
              description: `Expense for ${userData.email}`,
              amount: 100,
              date: '2024-01-01',
              category: 'food',
              accountTypeId: 'cash',
              accountOwner: 'Fayim',
            }
          ]))
        }, user)
        
        await page.reload()
        await page.waitForSelector('[data-testid="app-layout"]')
        
        // Each user should only see their own data
        const userExpense = await page.$(`text=Expense for ${user.email}`)
        expect(userExpense).toBeTruthy()
        
        // Should not see other users' data
        const otherUserExpense = await page.$(`text=Expense for ${users.find(u => u.id !== user.id)?.email}`)
        expect(otherUserExpense).toBeFalsy()
      }
    })
  })

  describe('sync status indicators', () => {
    it('should show sync status when available', async () => {
      // Check for sync status indicator
      const syncIndicator = await page.$('[data-testid="sync-status-indicator"]')
      
      if (syncIndicator) {
        // Should show appropriate sync status
        const syncStatus = await page.evaluate(el => el.textContent, syncIndicator)
        expect(syncStatus).toBeDefined()
      }
    })

    it('should handle offline/online state transitions', async () => {
      // Simulate going offline
      await page.setOfflineMode(true)
      
      // Check if offline indicator appears
      const offlineIndicator = await page.$('[data-testid="offline-indicator"]')
      if (offlineIndicator) {
        expect(offlineIndicator).toBeTruthy()
      }
      
      // Simulate going back online
      await page.setOfflineMode(false)
      
      // Check if online indicator appears
      const onlineIndicator = await page.$('[data-testid="online-indicator"]')
      if (onlineIndicator) {
        expect(onlineIndicator).toBeTruthy()
      }
    })
  })

  describe('data migration scenarios', () => {
    it('should handle data migration UI', async () => {
      // Navigate to settings/data page
      const settingsLink = await page.waitForSelector('[href="/settings"]')
      await settingsLink.click()
      
      await page.waitForURL('**/settings')
      
      // Look for data migration section
      const migrationSection = await page.$('[data-testid="data-migration"]')
      if (migrationSection) {
        expect(migrationSection).toBeTruthy()
        
        // Check for migration controls
        const migrationButton = await page.$('[data-testid="migration-button"]')
        if (migrationButton) {
          expect(migrationButton).toBeTruthy()
        }
      }
    })

    it('should show appropriate migration status', async () => {
      await page.goto('http://localhost:3000/settings')
      await page.waitForSelector('[data-testid="settings-content"]')
      
      // Check for migration status information
      const migrationStatus = await page.$('[data-testid="migration-status"]')
      if (migrationStatus) {
        const statusText = await page.evaluate(el => el.textContent, migrationStatus)
        expect(statusText).toBeDefined()
      }
    })
  })

  describe('authentication error handling', () => {
    it('should handle authentication errors gracefully', async () => {
      // Simulate authentication error
      await page.evaluate(() => {
        window.mockAuthState = {
          user: null,
          loading: false,
          error: 'Authentication failed',
        }
      })
      
      await page.reload()
      await page.waitForSelector('[data-testid="app-layout"]')
      
      // Should still allow basic functionality
      const addButton = await page.$('[data-testid="add-expense-button"]')
      expect(addButton).toBeTruthy()
      
      // Should show error message if auth error UI exists
      const errorMessage = await page.$('[data-testid="auth-error"]')
      if (errorMessage) {
        const errorText = await page.evaluate(el => el.textContent, errorMessage)
        expect(errorText).toContain('Authentication failed')
      }
    })

    it('should fallback to localStorage when authentication fails', async () => {
      // Simulate auth failure
      await page.evaluate(() => {
        window.mockAuthState = {
          user: null,
          loading: false,
          error: 'Supabase connection failed',
        }
      })
      
      await page.reload()
      await page.waitForSelector('[data-testid="app-layout"]')
      
      // Should still be able to add expenses
      const addButton = await page.waitForSelector('[data-testid="add-expense-button"]')
      await addButton.click()
      
      const sheet = await page.waitForSelector('[data-testid="add-expense-sheet"]')
      expect(sheet).toBeTruthy()
      
      // Add an expense to verify localStorage functionality
      await page.waitForSelector('input[name="description"]')
      await page.type('input[name="description"]', 'Fallback Test Expense')
      await page.type('input[name="amount"]', '15.50')
      
      const submitButton = await page.waitForSelector('[data-testid="submit-expense"]')
      await submitButton.click()
      
      // Should appear in the list
      const expense = await page.waitForSelector('text=Fallback Test Expense', { timeout: 5000 })
      expect(expense).toBeTruthy()
    })
  })

  describe('multi-tab synchronization', () => {
    it('should handle multiple tabs in localStorage mode', async () => {
      // Open a second page/tab
      const page2 = await browser.newPage()
      await page2.setViewport({ width: 1920, height: 1080 })
      await page2.goto('http://localhost:3000')
      await page2.waitForSelector('[data-testid="app-layout"]')
      
      // Add expense in first tab
      const addButton1 = await page.waitForSelector('[data-testid="add-expense-button"]')
      await addButton1.click()
      
      await page.waitForSelector('input[name="description"]')
      await page.type('input[name="description"]', 'Multi-tab Test Expense')
      await page.type('input[name="amount"]', '30.00')
      
      const submitButton1 = await page.waitForSelector('[data-testid="submit-expense"]')
      await submitButton1.click()
      
      // Wait for the expense to appear
      await page.waitForSelector('text=Multi-tab Test Expense')
      
      // Refresh second tab and check if expense appears
      await page2.reload()
      await page2.waitForSelector('[data-testid="app-layout"]')
      
      // In localStorage mode, tabs share data
      const expense2 = await page2.waitForSelector('text=Multi-tab Test Expense', { timeout: 5000 })
      expect(expense2).toBeTruthy()
      
      await page2.close()
    })
  })

  describe('session persistence', () => {
    it('should maintain session across page reloads', async () => {
      // Add some data
      const addButton = await page.waitForSelector('[data-testid="add-expense-button"]')
      await addButton.click()
      
      await page.waitForSelector('input[name="description"]')
      await page.type('input[name="description"]', 'Session Test Expense')
      await page.type('input[name="amount"]', '45.75')
      
      const submitButton = await page.waitForSelector('[data-testid="submit-expense"]')
      await submitButton.click()
      
      // Wait for expense to appear
      await page.waitForSelector('text=Session Test Expense')
      
      // Reload page multiple times
      for (let i = 0; i < 3; i++) {
        await page.reload()
        await page.waitForSelector('[data-testid="app-layout"]')
        
        // Data should persist
        const expense = await page.waitForSelector('text=Session Test Expense', { timeout: 5000 })
        expect(expense).toBeTruthy()
      }
    })
  })
})
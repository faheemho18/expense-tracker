import puppeteer, { Page, Browser } from 'puppeteer'

describe('Expense Management E2E Tests', () => {
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
    await page.goto('http://localhost:3000')
    
    // Wait for the page to load completely
    await page.waitForSelector('[data-testid="app-layout"]', { timeout: 10000 })
  })

  afterEach(async () => {
    await page.close()
  })

  it('should load the home page', async () => {
    // Check that the main elements are present
    await expect(page.title()).resolves.toMatch(/expense/i)
    
    // Check for main navigation
    const navigation = await page.$('[data-testid="navigation"]')
    expect(navigation).toBeTruthy()
    
    // Check for monthly report section
    const monthlyReport = await page.waitForSelector('text=Monthly Report')
    expect(monthlyReport).toBeTruthy()
    
    // Check for transactions section
    const transactions = await page.waitForSelector('text=Transactions')
    expect(transactions).toBeTruthy()
  })

  it('should open add expense sheet when clicking the add button', async () => {
    // Find and click the floating add button
    const addButton = await page.waitForSelector('[data-testid="add-expense-button"]', { timeout: 5000 })
    await addButton.click()
    
    // Wait for the sheet to open
    const sheet = await page.waitForSelector('[data-testid="add-expense-sheet"]', { timeout: 5000 })
    expect(sheet).toBeTruthy()
    
    // Check that form fields are present
    const descriptionField = await page.$('input[name="description"]')
    const amountField = await page.$('input[name="amount"]')
    const categorySelect = await page.$('[data-testid="category-select"]')
    
    expect(descriptionField).toBeTruthy()
    expect(amountField).toBeTruthy()
    expect(categorySelect).toBeTruthy()
  })

  it('should add a new expense', async () => {
    // Click add button
    const addButton = await page.waitForSelector('[data-testid="add-expense-button"]')
    await addButton.click()
    
    // Fill in the form
    await page.waitForSelector('input[name="description"]')
    await page.type('input[name="description"]', 'Test Expense')
    await page.type('input[name="amount"]', '50.00')
    
    // Select category (if categories are available)
    try {
      const categoryButton = await page.waitForSelector('[data-testid="category-select-trigger"]', { timeout: 2000 })
      await categoryButton.click()
      
      const firstCategory = await page.waitForSelector('[data-testid="category-option"]:first-child', { timeout: 2000 })
      await firstCategory.click()
    } catch (error) {
      console.log('Category selection not available or failed')
    }
    
    // Select account (if accounts are available)
    try {
      const accountButton = await page.waitForSelector('[data-testid="account-select-trigger"]', { timeout: 2000 })
      await accountButton.click()
      
      const firstAccount = await page.waitForSelector('[data-testid="account-option"]:first-child', { timeout: 2000 })
      await firstAccount.click()
    } catch (error) {
      console.log('Account selection not available or failed')
    }
    
    // Submit the form
    const submitButton = await page.waitForSelector('[data-testid="submit-expense"]')
    await submitButton.click()
    
    // Wait for the sheet to close and expense to appear
    await page.waitForFunction(() => !document.querySelector('[data-testid="add-expense-sheet"]'))
    
    // Check that the expense appears in the table
    const expenseRow = await page.waitForSelector('text=Test Expense', { timeout: 5000 })
    expect(expenseRow).toBeTruthy()
  })

  it('should filter expenses', async () => {
    // Open filters
    const filterButton = await page.waitForSelector('text=Filters')
    await filterButton.click()
    
    // Wait for filter sheet to open
    const filterSheet = await page.waitForSelector('[data-testid="filter-sheet"]', { timeout: 5000 })
    expect(filterSheet).toBeTruthy()
    
    // Check that filter options are available
    const monthFilters = await page.$('[data-testid="month-filters"]')
    const categoryFilters = await page.$('[data-testid="category-filters"]')
    
    expect(monthFilters || categoryFilters).toBeTruthy()
  })

  it('should navigate to different pages', async () => {
    // Navigate to dashboard
    const dashboardLink = await page.waitForSelector('[href="/dashboard"]')
    await dashboardLink.click()
    
    await page.waitForURL('**/dashboard')
    
    // Check that dashboard content is loaded
    const dashboardContent = await page.waitForSelector('[data-testid="dashboard-content"]', { timeout: 5000 })
    expect(dashboardContent).toBeTruthy()
    
    // Navigate to settings
    const settingsLink = await page.waitForSelector('[href="/settings"]')
    await settingsLink.click()
    
    await page.waitForURL('**/settings')
    
    // Check that settings content is loaded
    const settingsContent = await page.waitForSelector('[data-testid="settings-content"]', { timeout: 5000 })
    expect(settingsContent).toBeTruthy()
  })

  it('should be responsive on mobile', async () => {
    // Set mobile viewport
    await page.setViewport({ width: 375, height: 667 })
    await page.reload()
    
    // Wait for mobile layout to load
    await page.waitForSelector('[data-testid="app-layout"]')
    
    // Check that mobile navigation works
    const mobileMenuButton = await page.$('[data-testid="mobile-menu-button"]')
    if (mobileMenuButton) {
      await mobileMenuButton.click()
      
      // Check that mobile menu opened
      const mobileMenu = await page.waitForSelector('[data-testid="mobile-menu"]', { timeout: 2000 })
      expect(mobileMenu).toBeTruthy()
    }
    
    // Test that add button is still accessible
    const addButton = await page.$('[data-testid="add-expense-button"]')
    expect(addButton).toBeTruthy()
  })

  it('should display number ticker animations', async () => {
    // Wait for any existing expenses to load
    await page.waitForTimeout(1000)
    
    // Check if stats widgets are present (they may not be visible if no data)
    const statsWidgets = await page.$$('[data-testid="stats-widget"]')
    
    if (statsWidgets.length > 0) {
      // Check that currency amounts are displayed
      const currencyElements = await page.$$('.tabular-nums')
      expect(currencyElements.length).toBeGreaterThan(0)
    }
    
    // Check projected savings widget
    const projectedSavings = await page.$('[data-testid="projected-savings"]')
    if (projectedSavings) {
      // Verify piggy bank icon is visible
      const piggyBankIcon = await projectedSavings.$('svg')
      expect(piggyBankIcon).toBeTruthy()
    }
  })

  it('should handle errors gracefully', async () => {
    // Test navigation to non-existent page
    await page.goto('http://localhost:3000/non-existent-page')
    
    // Should show 404 or redirect to home
    const pageTitle = await page.title()
    expect(pageTitle).toBeTruthy()
  })
})
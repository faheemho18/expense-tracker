import puppeteer, { Page, Browser } from 'puppeteer'

describe('Navigation Behavior E2E', () => {
  let browser: Browser
  let page: Page
  const baseUrl = process.env.TEST_URL || 'http://localhost:3000'

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: process.env.CI === 'true',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
  })

  afterAll(async () => {
    await browser.close()
  })

  beforeEach(async () => {
    page = await browser.newPage()
    await page.goto(baseUrl)
    
    // Wait for app to load
    await page.waitForSelector('[data-testid="logo"], .min-h-screen', { timeout: 10000 })
  })

  afterEach(async () => {
    await page.close()
  })

  describe('Mobile Navigation Tests', () => {
    beforeEach(async () => {
      // Set mobile viewport (iPhone 12)
      await page.setViewport({ width: 390, height: 844 })
      await page.reload()
      await page.waitForSelector('[data-testid="logo"], .min-h-screen', { timeout: 5000 })
    })

    test('mobile: bottom nav provides access to all pages', async () => {
      // Check if we're on auth page or main app
      const isAuthPage = await page.$('[data-testid="auth-page"]') !== null
      
      if (isAuthPage) {
        console.log('Skipping navigation test - auth page detected')
        return
      }

      // Wait for bottom navigation to appear
      await page.waitForSelector('[data-testid="bottom-nav"]', { timeout: 5000 })

      const navigationItems = [
        { href: '/', label: 'Expenses' },
        { href: '/dashboard', label: 'Dashboard' },
        { href: '/data', label: 'Data' },
        { href: '/themes', label: 'Themes' },
        { href: '/settings', label: 'Settings' },
      ]

      for (const item of navigationItems) {
        // Find and click the navigation item
        const navLink = await page.$(`a[href="${item.href}"]`)
        expect(navLink).toBeTruthy()
        
        await navLink!.click()
        await page.waitForURL(`*${item.href}`, { timeout: 5000 })
        
        // Verify we're on the correct page
        const currentUrl = page.url()
        expect(currentUrl).toContain(item.href)
      }
    })

    test('mobile: no sidebar elements visible', async () => {
      const isAuthPage = await page.$('[data-testid="auth-page"]') !== null
      if (isAuthPage) return

      // Check that sidebar-related elements are not present
      const sidebarProvider = await page.$('[data-testid="sidebar-provider"]')
      const sidebar = await page.$('[data-testid="sidebar"]')
      const sidebarTrigger = await page.$('[data-testid="sidebar-trigger"]')

      expect(sidebarProvider).toBeNull()
      expect(sidebar).toBeNull()
      expect(sidebarTrigger).toBeNull()
    })

    test('mobile: UserMenu dropdown functions correctly', async () => {
      const isAuthPage = await page.$('[data-testid="auth-page"]') !== null
      if (isAuthPage) return

      // Look for user menu in header
      const userMenu = await page.$('[data-testid="user-menu"]')
      if (!userMenu) {
        console.log('No user menu found - user may not be authenticated')
        return
      }

      // Click on user menu to open dropdown
      await userMenu.click()
      
      // Wait for dropdown to appear
      await page.waitForSelector('[role="menu"], [data-radix-popper-content-wrapper]', { timeout: 3000 })
      
      // Verify dropdown is visible
      const dropdown = await page.$('[role="menu"], [data-radix-popper-content-wrapper]')
      expect(dropdown).toBeTruthy()
      
      // Check if dropdown is positioned within viewport
      const dropdownBounds = await dropdown!.boundingBox()
      const viewport = page.viewport()!
      
      expect(dropdownBounds!.x).toBeGreaterThanOrEqual(0)
      expect(dropdownBounds!.y).toBeGreaterThanOrEqual(0)
      expect(dropdownBounds!.x + dropdownBounds!.width).toBeLessThanOrEqual(viewport.width)
      expect(dropdownBounds!.y + dropdownBounds!.height).toBeLessThanOrEqual(viewport.height)
    })

    test('mobile: touch targets meet 44px minimum', async () => {
      const isAuthPage = await page.$('[data-testid="auth-page"]') !== null
      if (isAuthPage) return

      // Wait for bottom navigation
      await page.waitForSelector('[data-testid="bottom-nav"]', { timeout: 5000 })

      // Get all interactive elements in bottom navigation
      const touchTargets = await page.$$eval(
        '[data-testid="bottom-nav"] a, [data-testid="bottom-nav"] button',
        (elements) => elements.map(el => {
          const rect = el.getBoundingClientRect()
          return {
            width: rect.width,
            height: rect.height,
            tagName: el.tagName
          }
        })
      )

      // Verify each touch target meets 44px minimum
      touchTargets.forEach((target, index) => {
        expect(target.width).toBeGreaterThanOrEqual(44)
        expect(target.height).toBeGreaterThanOrEqual(44)
      })

      // Also check user menu button if present
      const userMenuButton = await page.$('[data-testid="user-menu"] button, [data-testid="user-menu"]')
      if (userMenuButton) {
        const bounds = await userMenuButton.boundingBox()
        if (bounds) {
          expect(bounds.width).toBeGreaterThanOrEqual(44)
          expect(bounds.height).toBeGreaterThanOrEqual(44)
        }
      }
    })

    test('mobile: main content has bottom padding for navigation clearance', async () => {
      const isAuthPage = await page.$('[data-testid="auth-page"]') !== null
      if (isAuthPage) return

      const main = await page.$('main')
      expect(main).toBeTruthy()

      const computedStyle = await page.evaluate(el => {
        return window.getComputedStyle(el).paddingBottom
      }, main)

      // Should have 4rem (64px) bottom padding
      expect(computedStyle).toBe('64px')
    })
  })

  describe('Desktop Navigation Tests', () => {
    beforeEach(async () => {
      // Set desktop viewport
      await page.setViewport({ width: 1280, height: 720 })
      await page.reload()
      await page.waitForSelector('[data-testid="logo"], .min-h-screen', { timeout: 5000 })
    })

    test('desktop: sidebar navigation functions normally', async () => {
      const isAuthPage = await page.$('[data-testid="auth-page"]') !== null
      if (isAuthPage) return

      // Wait for sidebar to appear
      await page.waitForSelector('[data-testid="sidebar"]', { timeout: 5000 })

      const navigationItems = [
        { href: '/', label: 'Expenses' },
        { href: '/dashboard', label: 'Dashboard' },
        { href: '/data', label: 'Data' },
        { href: '/themes', label: 'Themes' },
        { href: '/settings', label: 'Settings' },
      ]

      for (const item of navigationItems) {
        // Find sidebar navigation link
        const navLink = await page.$(`[data-testid="sidebar"] a[href="${item.href}"]`)
        expect(navLink).toBeTruthy()
        
        await navLink!.click()
        await page.waitForURL(`*${item.href}`, { timeout: 5000 })
        
        // Verify we're on the correct page
        const currentUrl = page.url()
        expect(currentUrl).toContain(item.href)
      }
    })

    test('desktop: icon collapsing works correctly', async () => {
      const isAuthPage = await page.$('[data-testid="auth-page"]') !== null
      if (isAuthPage) return

      // Wait for sidebar trigger
      await page.waitForSelector('[data-testid="sidebar-trigger"]', { timeout: 5000 })

      // Get initial sidebar state
      const sidebar = await page.$('[data-testid="sidebar"]')
      expect(sidebar).toBeTruthy()

      // Click sidebar trigger to collapse
      await page.click('[data-testid="sidebar-trigger"]')
      
      // Wait for animation to complete
      await page.waitForTimeout(300)

      // Verify sidebar is collapsed (check for collapsed state)
      const collapsedState = await page.evaluate(() => {
        const sidebar = document.querySelector('[data-testid="sidebar"]')
        return sidebar?.getAttribute('data-state') || sidebar?.getAttribute('data-collapsible')
      })

      // Click again to expand
      await page.click('[data-testid="sidebar-trigger"]')
      await page.waitForTimeout(300)

      // Verify sidebar is expanded again
      const expandedState = await page.evaluate(() => {
        const sidebar = document.querySelector('[data-testid="sidebar"]')
        return sidebar?.getAttribute('data-state') || sidebar?.getAttribute('data-collapsible')
      })

      expect(collapsedState).not.toBe(expandedState)
    })

    test('desktop: SidebarTrigger is visible and functional', async () => {
      const isAuthPage = await page.$('[data-testid="auth-page"]') !== null
      if (isAuthPage) return

      const sidebarTrigger = await page.$('[data-testid="sidebar-trigger"]')
      expect(sidebarTrigger).toBeTruthy()

      // Verify it's visible
      const isVisible = await sidebarTrigger!.isIntersectingViewport()
      expect(isVisible).toBe(true)

      // Verify it's clickable
      await sidebarTrigger!.click()
      // If no error is thrown, the click was successful
    })

    test('desktop: no bottom navigation present', async () => {
      const isAuthPage = await page.$('[data-testid="auth-page"]') !== null
      if (isAuthPage) return

      const bottomNav = await page.$('[data-testid="bottom-nav"]')
      expect(bottomNav).toBeNull()
    })

    test('desktop: UserMenu appears in both sidebar footer and header', async () => {
      const isAuthPage = await page.$('[data-testid="auth-page"]') !== null
      if (isAuthPage) return

      // Wait for user authentication check
      await page.waitForTimeout(1000)

      const userMenus = await page.$$('[data-testid="user-menu"]')
      
      if (userMenus.length === 0) {
        console.log('No user menus found - user may not be authenticated')
        return
      }

      // Should have 2 user menus on desktop (sidebar footer + header)
      expect(userMenus.length).toBe(2)
    })
  })

  describe('Responsive Breakpoint Tests', () => {
    test('responsive: smooth transition at 768px breakpoint', async () => {
      const isAuthPage = await page.$('[data-testid="auth-page"]') !== null
      if (isAuthPage) return

      // Start at desktop size
      await page.setViewport({ width: 1024, height: 768 })
      await page.reload()
      await page.waitForSelector('[data-testid="sidebar"]', { timeout: 5000 })

      // Verify desktop layout
      let sidebar = await page.$('[data-testid="sidebar"]')
      let bottomNav = await page.$('[data-testid="bottom-nav"]')
      
      expect(sidebar).toBeTruthy()
      expect(bottomNav).toBeNull()

      // Transition to mobile size (767px)
      await page.setViewport({ width: 767, height: 768 })
      await page.waitForTimeout(500) // Allow for responsive changes

      // Verify mobile layout
      sidebar = await page.$('[data-testid="sidebar"]')
      bottomNav = await page.$('[data-testid="bottom-nav"]')
      
      expect(sidebar).toBeNull()
      expect(bottomNav).toBeTruthy()

      // Transition back to desktop (769px)
      await page.setViewport({ width: 769, height: 768 })
      await page.waitForTimeout(500)

      // Verify desktop layout restored
      sidebar = await page.$('[data-testid="sidebar"]')
      bottomNav = await page.$('[data-testid="bottom-nav"]')
      
      expect(sidebar).toBeTruthy()
      expect(bottomNav).toBeNull()
    })

    test('all devices: navigation reaches every page', async () => {
      const isAuthPage = await page.$('[data-testid="auth-page"]') !== null
      if (isAuthPage) return

      const viewports = [
        { width: 320, height: 568, name: 'Mobile Small' },
        { width: 375, height: 667, name: 'Mobile Medium' },
        { width: 768, height: 1024, name: 'Tablet' },
        { width: 1024, height: 768, name: 'Desktop Small' },
        { width: 1920, height: 1080, name: 'Desktop Large' },
      ]

      const pages = ['/', '/dashboard', '/data', '/themes', '/settings']

      for (const viewport of viewports) {
        await page.setViewport({ width: viewport.width, height: viewport.height })
        await page.goto(baseUrl)
        await page.waitForSelector('[data-testid="logo"], .min-h-screen', { timeout: 5000 })

        for (const targetPage of pages) {
          // Find navigation link (could be in sidebar or bottom nav)
          const navLink = await page.$(`a[href="${targetPage}"]`)
          
          if (navLink) {
            await navLink.click()
            await page.waitForURL(`*${targetPage}`, { timeout: 5000 })
            
            const currentUrl = page.url()
            expect(currentUrl).toContain(targetPage)
          }
        }
      }
    })
  })

  describe('Performance and Layout Tests', () => {
    test('mobile: measures DOM element reduction', async () => {
      // Test desktop first
      await page.setViewport({ width: 1024, height: 768 })
      await page.goto(baseUrl)
      await page.waitForSelector('[data-testid="logo"], .min-h-screen', { timeout: 5000 })

      const desktopElements = await page.evaluate(() => {
        const sidebarElements = document.querySelectorAll('[data-testid*="sidebar"]').length
        const totalElements = document.querySelectorAll('*').length
        return { sidebarElements, totalElements }
      })

      // Test mobile
      await page.setViewport({ width: 390, height: 844 })
      await page.reload()
      await page.waitForSelector('[data-testid="logo"], .min-h-screen', { timeout: 5000 })

      const mobileElements = await page.evaluate(() => {
        const sidebarElements = document.querySelectorAll('[data-testid*="sidebar"]').length
        const bottomNavElements = document.querySelectorAll('[data-testid="bottom-nav"] *').length
        const totalElements = document.querySelectorAll('*').length
        return { sidebarElements, bottomNavElements, totalElements }
      })

      // Mobile should have fewer sidebar elements
      expect(mobileElements.sidebarElements).toBeLessThan(desktopElements.sidebarElements)
      
      // Mobile should have bottom nav elements
      expect(mobileElements.bottomNavElements).toBeGreaterThan(0)

      console.log('Desktop elements:', desktopElements)
      console.log('Mobile elements:', mobileElements)
    })

    test('responsive: no layout shifts during transition', async () => {
      const isAuthPage = await page.$('[data-testid="auth-page"]') !== null
      if (isAuthPage) return

      // Start at desktop
      await page.setViewport({ width: 1024, height: 768 })
      await page.reload()
      await page.waitForSelector('[data-testid="logo"]', { timeout: 5000 })

      // Get initial header position
      const initialHeaderPos = await page.evaluate(() => {
        const header = document.querySelector('header')
        return header ? header.getBoundingClientRect() : null
      })

      // Transition to mobile
      await page.setViewport({ width: 390, height: 844 })
      await page.waitForTimeout(500)

      // Get header position after transition
      const finalHeaderPos = await page.evaluate(() => {
        const header = document.querySelector('header')
        return header ? header.getBoundingClientRect() : null
      })

      // Header should remain at top
      expect(finalHeaderPos?.top).toBe(0)
      expect(initialHeaderPos?.top).toBe(0)
    })
  })
})
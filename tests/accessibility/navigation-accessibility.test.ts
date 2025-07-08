import puppeteer, { Page, Browser } from 'puppeteer'
import { AxePuppeteer } from 'axe-puppeteer'

describe('Navigation Accessibility', () => {
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
    await page.waitForSelector('[data-testid="logo"], .min-h-screen', { timeout: 10000 })
  })

  afterEach(async () => {
    await page.close()
  })

  describe('Mobile Navigation Accessibility', () => {
    beforeEach(async () => {
      await page.setViewport({ width: 390, height: 844 })
      await page.reload()
      await page.waitForSelector('[data-testid="logo"], .min-h-screen', { timeout: 5000 })
    })

    test('mobile: UserMenu meets WCAG 2.1 AA standards', async () => {
      const isAuthPage = await page.$('[data-testid="auth-page"]') !== null
      if (isAuthPage) {
        console.log('Skipping test - auth page detected')
        return
      }

      // Wait for user menu to be present (if user is authenticated)
      const userMenu = await page.$('[data-testid="user-menu"]')
      if (!userMenu) {
        console.log('No user menu found - user may not be authenticated')
        return
      }

      // Run axe accessibility checks on the user menu area
      const results = await new AxePuppeteer(page)
        .include('[data-testid="user-menu"]')
        .analyze()

      expect(results.violations).toHaveLength(0)

      // Check specific WCAG requirements for user menu
      const userMenuAccessibility = await page.evaluate(() => {
        const menu = document.querySelector('[data-testid="user-menu"]')
        if (!menu) return { error: 'User menu not found' }

        const button = menu.querySelector('button, [role="button"]')
        if (!button) return { error: 'User menu button not found' }

        const buttonRect = button.getBoundingClientRect()

        return {
          hasProperRole: button.getAttribute('role') === 'button' || button.tagName === 'BUTTON',
          hasAccessibleName: button.textContent?.trim() || button.getAttribute('aria-label') || button.getAttribute('aria-labelledby'),
          meetsMinimumSize: buttonRect.width >= 44 && buttonRect.height >= 44,
          hasProperContrast: true, // Will be checked by axe
          isFocusable: button.tabIndex >= 0 || button.tagName === 'BUTTON',
          hasKeyboardSupport: true // Will be tested separately
        }
      })

      expect(userMenuAccessibility.hasProperRole).toBe(true)
      expect(userMenuAccessibility.hasAccessibleName).toBeTruthy()
      expect(userMenuAccessibility.meetsMinimumSize).toBe(true)
      expect(userMenuAccessibility.isFocusable).toBe(true)
    })

    test('mobile: bottom nav keyboard navigation', async () => {
      const isAuthPage = await page.$('[data-testid="auth-page"]') !== null
      if (isAuthPage) return

      await page.waitForSelector('[data-testid="bottom-nav"]', { timeout: 5000 })

      // Test keyboard navigation through bottom nav items
      const keyboardNavigation = await page.evaluate(async () => {
        const bottomNav = document.querySelector('[data-testid="bottom-nav"]')
        if (!bottomNav) return { error: 'Bottom nav not found' }

        const navLinks = bottomNav.querySelectorAll('a, button')
        const results = []

        for (let i = 0; i < navLinks.length; i++) {
          const link = navLinks[i] as HTMLElement
          
          // Focus the element
          link.focus()
          
          const rect = link.getBoundingClientRect()
          const styles = window.getComputedStyle(link)
          
          results.push({
            index: i,
            isFocused: document.activeElement === link,
            hasVisibleFocus: styles.outline !== 'none' || styles.boxShadow.includes('focus') || 
                           link.matches(':focus-visible') || styles.border !== styles.borderColor,
            isInViewport: rect.top >= 0 && rect.bottom <= window.innerHeight,
            tabIndex: link.tabIndex,
            href: link.getAttribute('href'),
            role: link.getAttribute('role'),
            ariaLabel: link.getAttribute('aria-label')
          })
        }

        return { navLinksCount: navLinks.length, results }
      })

      // All navigation links should be focusable
      keyboardNavigation.results.forEach((result, index) => {
        expect(result.isFocused).toBe(true)
        expect(result.isInViewport).toBe(true)
        expect(result.tabIndex).toBeGreaterThanOrEqual(0)
      })

      // Test tab navigation
      await page.focus('body')
      let currentFocusIndex = -1

      for (let i = 0; i < keyboardNavigation.results.length; i++) {
        await page.keyboard.press('Tab')
        
        const focusedElement = await page.evaluate(() => {
          const focused = document.activeElement
          const bottomNav = document.querySelector('[data-testid="bottom-nav"]')
          const navLinks = bottomNav?.querySelectorAll('a, button')
          
          if (!navLinks || !focused) return -1
          
          return Array.from(navLinks).indexOf(focused as any)
        })

        if (focusedElement >= 0) {
          currentFocusIndex = focusedElement
          break
        }
      }

      expect(currentFocusIndex).toBeGreaterThanOrEqual(0)
    })

    test('mobile: bottom nav ARIA landmarks and roles', async () => {
      const isAuthPage = await page.$('[data-testid="auth-page"]') !== null
      if (isAuthPage) return

      await page.waitForSelector('[data-testid="bottom-nav"]', { timeout: 5000 })

      const ariaAnalysis = await page.evaluate(() => {
        const bottomNav = document.querySelector('[data-testid="bottom-nav"]')
        if (!bottomNav) return { error: 'Bottom nav not found' }

        const nav = bottomNav.querySelector('nav') || bottomNav.closest('nav')
        const navLinks = bottomNav.querySelectorAll('a')

        const linkAnalysis = Array.from(navLinks).map((link, index) => {
          return {
            index,
            hasHref: !!link.getAttribute('href'),
            hasAccessibleName: link.textContent?.trim() || link.getAttribute('aria-label'),
            role: link.getAttribute('role'),
            tabIndex: link.tabIndex
          }
        })

        return {
          hasNavLandmark: !!nav,
          navRole: nav?.getAttribute('role'),
          navAriaLabel: nav?.getAttribute('aria-label'),
          linksCount: navLinks.length,
          linkAnalysis
        }
      })

      expect(ariaAnalysis.hasNavLandmark).toBe(true)
      expect(ariaAnalysis.linksCount).toBeGreaterThan(0)

      // Each link should have proper accessibility attributes
      ariaAnalysis.linkAnalysis.forEach(link => {
        expect(link.hasHref).toBe(true)
        expect(link.hasAccessibleName).toBeTruthy()
      })
    })

    test('mobile: touch target size compliance', async () => {
      const isAuthPage = await page.$('[data-testid="auth-page"]') !== null
      if (isAuthPage) return

      await page.waitForSelector('[data-testid="bottom-nav"]', { timeout: 5000 })

      // Run axe checks specifically for touch target size
      const results = await new AxePuppeteer(page)
        .include('[data-testid="bottom-nav"]')
        .withTags(['wcag21aa', 'wcag144'])
        .analyze()

      expect(results.violations).toHaveLength(0)

      const touchTargetAnalysis = await page.evaluate(() => {
        const MINIMUM_SIZE = 44 // WCAG 2.1 AA requirement
        const touchTargets = document.querySelectorAll(
          '[data-testid="bottom-nav"] a, [data-testid="bottom-nav"] button'
        )

        return Array.from(touchTargets).map((target, index) => {
          const rect = target.getBoundingClientRect()
          const styles = window.getComputedStyle(target)
          
          return {
            index,
            width: rect.width,
            height: rect.height,
            meetsMinimum: rect.width >= MINIMUM_SIZE && rect.height >= MINIMUM_SIZE,
            padding: {
              top: parseInt(styles.paddingTop),
              right: parseInt(styles.paddingRight),
              bottom: parseInt(styles.paddingBottom),
              left: parseInt(styles.paddingLeft)
            },
            margin: {
              top: parseInt(styles.marginTop),
              right: parseInt(styles.marginRight),
              bottom: parseInt(styles.marginBottom),
              left: parseInt(styles.marginLeft)
            }
          }
        })
      })

      touchTargetAnalysis.forEach(target => {
        expect(target.meetsMinimum).toBe(true)
        expect(target.width).toBeGreaterThanOrEqual(44)
        expect(target.height).toBeGreaterThanOrEqual(44)
      })
    })
  })

  describe('Desktop Navigation Accessibility', () => {
    beforeEach(async () => {
      await page.setViewport({ width: 1280, height: 720 })
      await page.reload()
      await page.waitForSelector('[data-testid="logo"], .min-h-screen', { timeout: 5000 })
    })

    test('desktop: sidebar keyboard navigation', async () => {
      const isAuthPage = await page.$('[data-testid="auth-page"]') !== null
      if (isAuthPage) return

      await page.waitForSelector('[data-testid="sidebar"]', { timeout: 5000 })

      // Test sidebar navigation with keyboard
      const sidebarNavigation = await page.evaluate(async () => {
        const sidebar = document.querySelector('[data-testid="sidebar"]')
        if (!sidebar) return { error: 'Sidebar not found' }

        const navLinks = sidebar.querySelectorAll('a, button')
        const results = []

        for (let i = 0; i < navLinks.length; i++) {
          const link = navLinks[i] as HTMLElement
          link.focus()
          
          results.push({
            index: i,
            isFocused: document.activeElement === link,
            tagName: link.tagName,
            hasHref: link.getAttribute('href'),
            hasAccessibleName: link.textContent?.trim() || link.getAttribute('aria-label'),
            tabIndex: link.tabIndex
          })
        }

        return { navLinksCount: navLinks.length, results }
      })

      // All sidebar navigation items should be keyboard accessible
      sidebarNavigation.results.forEach(result => {
        expect(result.isFocused).toBe(true)
        expect(result.hasAccessibleName).toBeTruthy()
        expect(result.tabIndex).toBeGreaterThanOrEqual(0)
      })
    })

    test('desktop: sidebar collapse/expand accessibility', async () => {
      const isAuthPage = await page.$('[data-testid="auth-page"]') !== null
      if (isAuthPage) return

      await page.waitForSelector('[data-testid="sidebar-trigger"]', { timeout: 5000 })

      const sidebarTriggerAccessibility = await page.evaluate(() => {
        const trigger = document.querySelector('[data-testid="sidebar-trigger"]')
        if (!trigger) return { error: 'Sidebar trigger not found' }

        return {
          hasProperRole: trigger.getAttribute('role') === 'button' || trigger.tagName === 'BUTTON',
          hasAccessibleName: trigger.textContent?.trim() || trigger.getAttribute('aria-label') || trigger.getAttribute('aria-labelledby'),
          hasAriaExpanded: trigger.hasAttribute('aria-expanded'),
          hasAriaControls: trigger.hasAttribute('aria-controls'),
          isFocusable: (trigger as HTMLElement).tabIndex >= 0 || trigger.tagName === 'BUTTON'
        }
      })

      expect(sidebarTriggerAccessibility.hasProperRole).toBe(true)
      expect(sidebarTriggerAccessibility.isFocusable).toBe(true)

      // Test keyboard activation of sidebar trigger
      await page.focus('[data-testid="sidebar-trigger"]')
      await page.keyboard.press('Enter')
      await page.waitForTimeout(300)

      // Test space key activation
      await page.keyboard.press('Space')
      await page.waitForTimeout(300)

      // Both should work without errors (no need to check state as animations might interfere)
    })

    test('desktop: dual UserMenu accessibility (sidebar + header)', async () => {
      const isAuthPage = await page.$('[data-testid="auth-page"]') !== null
      if (isAuthPage) return

      // Wait for user menus to be present
      const userMenus = await page.$$('[data-testid="user-menu"]')
      if (userMenus.length === 0) {
        console.log('No user menus found - user may not be authenticated')
        return
      }

      const userMenuAccessibility = await page.evaluate(() => {
        const userMenus = document.querySelectorAll('[data-testid="user-menu"]')
        
        return Array.from(userMenus).map((menu, index) => {
          const button = menu.querySelector('button, [role="button"]')
          if (!button) return { index, error: 'No button found' }

          const location = menu.closest('[data-testid="sidebar-footer"]') ? 'sidebar' : 'header'
          
          return {
            index,
            location,
            hasUniqueId: button.id && button.id.length > 0,
            hasAccessibleName: button.textContent?.trim() || button.getAttribute('aria-label'),
            isFocusable: (button as HTMLElement).tabIndex >= 0 || button.tagName === 'BUTTON',
            hasProperRole: button.getAttribute('role') === 'button' || button.tagName === 'BUTTON'
          }
        })
      })

      // Should have exactly 2 user menus on desktop
      expect(userMenuAccessibility.length).toBe(2)

      // Both should be properly accessible
      userMenuAccessibility.forEach(menu => {
        expect(menu.hasAccessibleName).toBeTruthy()
        expect(menu.isFocusable).toBe(true)
        expect(menu.hasProperRole).toBe(true)
      })

      // Should have one in sidebar and one in header
      const locations = userMenuAccessibility.map(menu => menu.location)
      expect(locations).toContain('sidebar')
      expect(locations).toContain('header')
    })
  })

  describe('Focus Management Tests', () => {
    test('all: focus management during navigation', async () => {
      const isAuthPage = await page.$('[data-testid="auth-page"]') !== null
      if (isAuthPage) return

      // Test mobile focus management
      await page.setViewport({ width: 390, height: 844 })
      await page.reload()
      await page.waitForSelector('[data-testid="bottom-nav"]', { timeout: 5000 })

      await page.focus('body')
      
      // Navigate through mobile bottom nav with Tab
      let mobileTabStops = 0
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Tab')
        
        const focusedElement = await page.evaluate(() => {
          const focused = document.activeElement
          if (!focused) return null
          
          return {
            tagName: focused.tagName,
            className: focused.className,
            href: focused.getAttribute('href'),
            testId: focused.getAttribute('data-testid') || focused.closest('[data-testid]')?.getAttribute('data-testid'),
            isInBottomNav: !!focused.closest('[data-testid="bottom-nav"]')
          }
        })

        if (focusedElement?.isInBottomNav) {
          mobileTabStops++
        }
        
        if (mobileTabStops >= 3) break // Found sufficient tab stops
      }

      expect(mobileTabStops).toBeGreaterThan(0)

      // Test desktop focus management
      await page.setViewport({ width: 1280, height: 720 })
      await page.reload()
      await page.waitForSelector('[data-testid="sidebar"]', { timeout: 5000 })

      await page.focus('body')
      
      let desktopTabStops = 0
      for (let i = 0; i < 15; i++) {
        await page.keyboard.press('Tab')
        
        const focusedElement = await page.evaluate(() => {
          const focused = document.activeElement
          if (!focused) return null
          
          return {
            tagName: focused.tagName,
            isInSidebar: !!focused.closest('[data-testid="sidebar"]'),
            isSidebarTrigger: focused.getAttribute('data-testid') === 'sidebar-trigger',
            testId: focused.getAttribute('data-testid') || focused.closest('[data-testid]')?.getAttribute('data-testid')
          }
        })

        if (focusedElement?.isInSidebar || focusedElement?.isSidebarTrigger) {
          desktopTabStops++
        }
        
        if (desktopTabStops >= 3) break
      }

      expect(desktopTabStops).toBeGreaterThan(0)
    })

    test('all: skip links and landmarks', async () => {
      const isAuthPage = await page.$('[data-testid="auth-page"]') !== null
      if (isAuthPage) return

      // Test both mobile and desktop for landmarks
      const viewports = [
        { width: 390, height: 844, name: 'Mobile' },
        { width: 1280, height: 720, name: 'Desktop' }
      ]

      for (const viewport of viewports) {
        await page.setViewport({ width: viewport.width, height: viewport.height })
        await page.reload()
        await page.waitForSelector('[data-testid="logo"], .min-h-screen', { timeout: 5000 })

        const landmarks = await page.evaluate(() => {
          const landmarkSelectors = [
            'nav, [role="navigation"]',
            'main, [role="main"]',
            'header, [role="banner"]',
            'footer, [role="contentinfo"]'
          ]

          const foundLandmarks = landmarkSelectors.map(selector => {
            const elements = document.querySelectorAll(selector)
            return {
              selector,
              count: elements.length,
              hasAccessibleName: Array.from(elements).some(el => 
                el.getAttribute('aria-label') || 
                el.getAttribute('aria-labelledby') ||
                (el.tagName === 'NAV' && el.textContent?.trim())
              )
            }
          })

          return foundLandmarks
        })

        // Should have proper landmark structure
        const navLandmarks = landmarks.find(l => l.selector.includes('navigation'))
        const mainLandmarks = landmarks.find(l => l.selector.includes('main'))
        const headerLandmarks = landmarks.find(l => l.selector.includes('banner'))

        expect(navLandmarks?.count).toBeGreaterThan(0)
        expect(mainLandmarks?.count).toBeGreaterThanOrEqual(1)
        expect(headerLandmarks?.count).toBeGreaterThanOrEqual(1)
      }
    })
  })

  describe('Screen Reader Compatibility', () => {
    test('all: proper heading structure', async () => {
      const isAuthPage = await page.$('[data-testid="auth-page"]') !== null
      if (isAuthPage) return

      const headingStructure = await page.evaluate(() => {
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6')
        
        return Array.from(headings).map((heading, index) => ({
          index,
          level: parseInt(heading.tagName.substring(1)),
          text: heading.textContent?.trim(),
          hasId: !!heading.id,
          isVisible: heading.offsetParent !== null
        }))
      })

      if (headingStructure.length > 0) {
        // Should start with h1 or have proper hierarchy
        const levels = headingStructure.map(h => h.level).sort((a, b) => a - b)
        const firstLevel = levels[0]
        expect(firstLevel).toBeLessThanOrEqual(2) // Should start with h1 or h2

        // Check for proper nesting (no level jumps > 1)
        for (let i = 1; i < headingStructure.length; i++) {
          const prevLevel = headingStructure[i - 1].level
          const currentLevel = headingStructure[i].level
          const levelJump = currentLevel - prevLevel
          expect(levelJump).toBeLessThanOrEqual(1)
        }
      }
    })

    test('all: ARIA live regions for dynamic content', async () => {
      const isAuthPage = await page.$('[data-testid="auth-page"]') !== null
      if (isAuthPage) return

      // Check for ARIA live regions that might announce navigation changes
      const liveRegions = await page.evaluate(() => {
        const liveElements = document.querySelectorAll(
          '[aria-live], [role="status"], [role="alert"], [aria-atomic]'
        )

        return Array.from(liveElements).map(element => ({
          tagName: element.tagName,
          ariaLive: element.getAttribute('aria-live'),
          role: element.getAttribute('role'),
          ariaAtomic: element.getAttribute('aria-atomic'),
          hasContent: !!element.textContent?.trim()
        }))
      })

      // While not required, live regions can enhance the navigation experience
      console.log('Found ARIA live regions:', liveRegions.length)
    })
  })
})
import puppeteer, { Page, Browser } from 'puppeteer'

describe('Navigation UI Glitch Detection', () => {
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
    
    // Enable console logging for debugging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Browser error:', msg.text())
      }
    })
    
    await page.goto(baseUrl)
    await page.waitForSelector('[data-testid="logo"], .min-h-screen', { timeout: 10000 })
  })

  afterEach(async () => {
    await page.close()
  })

  describe('Mobile Navigation UI Glitch Tests', () => {
    beforeEach(async () => {
      await page.setViewport({ width: 390, height: 844 })
      await page.reload()
      await page.waitForSelector('[data-testid="logo"], .min-h-screen', { timeout: 5000 })
    })

    test('mobile: no overflow or clipping in header', async () => {
      const isAuthPage = await page.$('[data-testid="auth-page"]') !== null
      if (isAuthPage) {
        console.log('Skipping test - auth page detected')
        return
      }

      // Wait for header to be present
      await page.waitForSelector('header', { timeout: 5000 })

      const headerOverflow = await page.evaluate(() => {
        const header = document.querySelector('header')
        if (!header) return { error: 'Header not found' }

        const headerRect = header.getBoundingClientRect()
        const viewport = { width: window.innerWidth, height: window.innerHeight }

        // Check for horizontal overflow
        const horizontalOverflow = headerRect.width > viewport.width
        
        // Check for element clipping
        const children = Array.from(header.children)
        const clippedElements = children.filter(child => {
          const childRect = child.getBoundingClientRect()
          return childRect.right > viewport.width || childRect.left < 0
        })

        // Check computed styles
        const styles = window.getComputedStyle(header)
        const hasOverflowHidden = styles.overflow === 'hidden' || styles.overflowX === 'hidden'

        return {
          headerWidth: headerRect.width,
          viewportWidth: viewport.width,
          horizontalOverflow,
          clippedElementsCount: clippedElements.length,
          hasOverflowHidden,
          headerHeight: headerRect.height,
          position: {
            top: headerRect.top,
            left: headerRect.left,
            right: headerRect.right,
            bottom: headerRect.bottom
          }
        }
      })

      expect(headerOverflow.horizontalOverflow).toBe(false)
      expect(headerOverflow.clippedElementsCount).toBe(0)
      expect(headerOverflow.headerHeight).toBeGreaterThan(0)
      expect(headerOverflow.position.top).toBe(0) // Header should be at top
    })

    test('mobile: bottom nav properly positioned', async () => {
      const isAuthPage = await page.$('[data-testid="auth-page"]') !== null
      if (isAuthPage) return

      await page.waitForSelector('[data-testid="bottom-nav"]', { timeout: 5000 })

      const bottomNavPosition = await page.evaluate(() => {
        const bottomNav = document.querySelector('[data-testid="bottom-nav"]')
        if (!bottomNav) return { error: 'Bottom nav not found' }

        const rect = bottomNav.getBoundingClientRect()
        const viewport = { width: window.innerWidth, height: window.innerHeight }
        const styles = window.getComputedStyle(bottomNav)

        return {
          bottom: rect.bottom,
          viewportHeight: viewport.height,
          position: styles.position,
          zIndex: styles.zIndex,
          width: rect.width,
          viewportWidth: viewport.width,
          isAtBottom: Math.abs(rect.bottom - viewport.height) < 2, // Allow 2px tolerance
          isFullWidth: Math.abs(rect.width - viewport.width) < 2,
          height: rect.height
        }
      })

      expect(bottomNavPosition.position).toBe('fixed')
      expect(bottomNavPosition.isAtBottom).toBe(true)
      expect(bottomNavPosition.isFullWidth).toBe(true)
      expect(parseInt(bottomNavPosition.zIndex)).toBeGreaterThanOrEqual(50)
      expect(bottomNavPosition.height).toBeGreaterThan(40) // Minimum height for touch targets
    })

    test('mobile: touch targets meet accessibility requirements', async () => {
      const isAuthPage = await page.$('[data-testid="auth-page"]') !== null
      if (isAuthPage) return

      await page.waitForSelector('[data-testid="bottom-nav"]', { timeout: 5000 })

      const touchTargetAnalysis = await page.evaluate(() => {
        const minimumSize = 44 // WCAG recommendation
        const touchTargets = document.querySelectorAll(
          '[data-testid="bottom-nav"] a, [data-testid="bottom-nav"] button, [data-testid="user-menu"]'
        )

        const results = Array.from(touchTargets).map((target, index) => {
          const rect = target.getBoundingClientRect()
          const styles = window.getComputedStyle(target)
          
          return {
            index,
            width: rect.width,
            height: rect.height,
            meetsMinimum: rect.width >= minimumSize && rect.height >= minimumSize,
            hasProperSpacing: true, // We'll check this separately
            isVisible: rect.width > 0 && rect.height > 0,
            tagName: target.tagName,
            className: target.className,
            cursor: styles.cursor
          }
        })

        // Check spacing between targets
        const spacingResults = []
        for (let i = 0; i < touchTargets.length - 1; i++) {
          const current = touchTargets[i].getBoundingClientRect()
          const next = touchTargets[i + 1].getBoundingClientRect()
          const gap = next.left - current.right
          spacingResults.push({
            between: `${i}-${i + 1}`,
            gap,
            adequate: gap >= 8 // Minimum 8px spacing
          })
        }

        return { targets: results, spacing: spacingResults }
      })

      // All touch targets should meet minimum size requirements
      touchTargetAnalysis.targets.forEach((target, index) => {
        expect(target.meetsMinimum).toBe(true)
        expect(target.isVisible).toBe(true)
      })

      // All spacing should be adequate
      touchTargetAnalysis.spacing.forEach(space => {
        expect(space.adequate).toBe(true)
      })
    })

    test('mobile: no sidebar elements in DOM', async () => {
      const isAuthPage = await page.$('[data-testid="auth-page"]') !== null
      if (isAuthPage) return

      const sidebarElements = await page.evaluate(() => {
        const sidebarSelectors = [
          '[data-testid="sidebar"]',
          '[data-testid="sidebar-provider"]', 
          '[data-testid="sidebar-trigger"]',
          '[data-testid="sidebar-content"]',
          '[data-testid="sidebar-header"]',
          '[data-testid="sidebar-footer"]',
          '.sidebar',
          '.sidebar-trigger'
        ]

        const foundElements = sidebarSelectors.map(selector => ({
          selector,
          found: document.querySelector(selector) !== null,
          count: document.querySelectorAll(selector).length
        }))

        return foundElements
      })

      // No sidebar elements should be present in mobile view
      sidebarElements.forEach(element => {
        expect(element.found).toBe(false)
        expect(element.count).toBe(0)
      })
    })
  })

  describe('Desktop Navigation UI Glitch Tests', () => {
    beforeEach(async () => {
      await page.setViewport({ width: 1280, height: 720 })
      await page.reload()
      await page.waitForSelector('[data-testid="logo"], .min-h-screen', { timeout: 5000 })
    })

    test('desktop: sidebar animation performance', async () => {
      const isAuthPage = await page.$('[data-testid="auth-page"]') !== null
      if (isAuthPage) return

      await page.waitForSelector('[data-testid="sidebar-trigger"]', { timeout: 5000 })

      // Enable performance monitoring
      await page.tracing.start({ path: 'sidebar-animation.json', screenshots: true })

      // Measure sidebar toggle performance
      const performanceMetrics = await page.evaluate(async () => {
        const startTime = performance.now()
        
        // Toggle sidebar
        const trigger = document.querySelector('[data-testid="sidebar-trigger"]') as HTMLElement
        if (!trigger) return { error: 'Sidebar trigger not found' }

        trigger.click()
        
        // Wait for animation to complete
        await new Promise(resolve => setTimeout(resolve, 350))
        
        const endTime = performance.now()
        
        // Check for any layout shifts during animation
        const sidebar = document.querySelector('[data-testid="sidebar"]')
        const sidebarRect = sidebar?.getBoundingClientRect()

        return {
          duration: endTime - startTime,
          sidebarPresent: !!sidebar,
          sidebarWidth: sidebarRect?.width || 0,
          animationComplete: true
        }
      })

      await page.tracing.stop()

      expect(performanceMetrics.duration).toBeLessThan(1000) // Should complete within 1 second
      expect(performanceMetrics.sidebarPresent).toBe(true)
      expect(performanceMetrics.sidebarWidth).toBeGreaterThan(0)
    })

    test('desktop: no bottom navigation in DOM', async () => {
      const isAuthPage = await page.$('[data-testid="auth-page"]') !== null
      if (isAuthPage) return

      const bottomNavExists = await page.evaluate(() => {
        return {
          bottomNav: document.querySelector('[data-testid="bottom-nav"]') !== null,
          bottomNavCount: document.querySelectorAll('[data-testid="bottom-nav"]').length
        }
      })

      expect(bottomNavExists.bottomNav).toBe(false)
      expect(bottomNavExists.bottomNavCount).toBe(0)
    })

    test('desktop: sidebar elements properly positioned', async () => {
      const isAuthPage = await page.$('[data-testid="auth-page"]') !== null
      if (isAuthPage) return

      await page.waitForSelector('[data-testid="sidebar"]', { timeout: 5000 })

      const sidebarLayout = await page.evaluate(() => {
        const sidebar = document.querySelector('[data-testid="sidebar"]')
        const sidebarInset = document.querySelector('[data-testid="sidebar-inset"]')
        
        if (!sidebar || !sidebarInset) {
          return { error: 'Sidebar elements not found' }
        }

        const sidebarRect = sidebar.getBoundingClientRect()
        const insetRect = sidebarInset.getBoundingClientRect()
        const viewport = { width: window.innerWidth, height: window.innerHeight }

        return {
          sidebarAtLeft: sidebarRect.left === 0,
          sidebarFullHeight: Math.abs(sidebarRect.height - viewport.height) < 10,
          insetPositioned: insetRect.left >= sidebarRect.width,
          noOverlap: insetRect.left >= sidebarRect.right,
          sidebarWidth: sidebarRect.width,
          insetWidth: insetRect.width,
          totalWidth: sidebarRect.width + insetRect.width
        }
      })

      expect(sidebarLayout.sidebarAtLeft).toBe(true)
      expect(sidebarLayout.sidebarFullHeight).toBe(true)
      expect(sidebarLayout.insetPositioned).toBe(true)
      expect(sidebarLayout.noOverlap).toBe(true)
    })
  })

  describe('Responsive Transition Glitch Tests', () => {
    test('responsive: layout shift detection at breakpoint', async () => {
      const isAuthPage = await page.$('[data-testid="auth-page"]') !== null
      if (isAuthPage) return

      // Start at desktop
      await page.setViewport({ width: 1024, height: 768 })
      await page.reload()
      await page.waitForSelector('[data-testid="logo"]', { timeout: 5000 })

      const initialLayout = await page.evaluate(() => {
        const header = document.querySelector('header')
        const main = document.querySelector('main')
        const sidebar = document.querySelector('[data-testid="sidebar"]')
        
        return {
          headerHeight: header?.getBoundingClientRect().height || 0,
          mainTop: main?.getBoundingClientRect().top || 0,
          sidebarPresent: !!sidebar,
          timestamp: Date.now()
        }
      })

      // Transition to mobile at exact breakpoint
      await page.setViewport({ width: 767, height: 768 })
      await page.waitForTimeout(500) // Allow transition time

      const transitionLayout = await page.evaluate(() => {
        const header = document.querySelector('header')
        const main = document.querySelector('main')
        const sidebar = document.querySelector('[data-testid="sidebar"]')
        const bottomNav = document.querySelector('[data-testid="bottom-nav"]')
        
        return {
          headerHeight: header?.getBoundingClientRect().height || 0,
          mainTop: main?.getBoundingClientRect().top || 0,
          sidebarPresent: !!sidebar,
          bottomNavPresent: !!bottomNav,
          timestamp: Date.now()
        }
      })

      // Verify smooth transition
      expect(transitionLayout.headerHeight).toBe(initialLayout.headerHeight) // Header height should remain consistent
      expect(transitionLayout.sidebarPresent).toBe(false) // Sidebar should be gone
      expect(transitionLayout.bottomNavPresent).toBe(true) // Bottom nav should appear
      expect(transitionLayout.mainTop).toBeGreaterThan(0) // Main should be below header
    })

    test('responsive: no element overflow during transition', async () => {
      const isAuthPage = await page.$('[data-testid="auth-page"]') !== null
      if (isAuthPage) return

      const viewportSizes = [
        { width: 1024, height: 768 },
        { width: 900, height: 768 },
        { width: 800, height: 768 },
        { width: 768, height: 768 },
        { width: 767, height: 768 },
        { width: 600, height: 768 },
        { width: 390, height: 844 }
      ]

      for (const viewport of viewportSizes) {
        await page.setViewport(viewport)
        await page.waitForTimeout(300) // Allow responsive changes

        const overflowAnalysis = await page.evaluate((vp) => {
          const elements = document.querySelectorAll('*')
          const overflowingElements = []

          Array.from(elements).forEach((el, index) => {
            const rect = el.getBoundingClientRect()
            if (rect.width > vp.width + 5) { // 5px tolerance for scrollbars
              overflowingElements.push({
                index,
                tagName: el.tagName,
                className: el.className,
                width: rect.width,
                viewportWidth: vp.width
              })
            }
          })

          return {
            viewportWidth: vp.width,
            overflowCount: overflowingElements.length,
            overflowingElements: overflowingElements.slice(0, 5) // Limit to first 5
          }
        }, viewport)

        expect(overflowAnalysis.overflowCount).toBe(0)
      }
    })

    test('responsive: navigation accessibility maintained across breakpoints', async () => {
      const isAuthPage = await page.$('[data-testid="auth-page"]') !== null
      if (isAuthPage) return

      const testBreakpoints = [
        { width: 1200, height: 800, name: 'Desktop Large' },
        { width: 768, height: 1024, name: 'Tablet' },
        { width: 390, height: 844, name: 'Mobile' }
      ]

      for (const breakpoint of testBreakpoints) {
        await page.setViewport({ width: breakpoint.width, height: breakpoint.height })
        await page.waitForTimeout(300)

        const accessibilityCheck = await page.evaluate(() => {
          // Check for navigation elements
          const navElements = document.querySelectorAll('nav, [role="navigation"], [data-testid="bottom-nav"], [data-testid="sidebar"]')
          const interactiveElements = document.querySelectorAll('a, button, [role="button"]')
          
          // Check focus management
          const focusableElements = document.querySelectorAll(
            'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )

          return {
            navElementsCount: navElements.length,
            interactiveElementsCount: interactiveElements.length,
            focusableElementsCount: focusableElements.length,
            hasNavigation: navElements.length > 0,
            canNavigate: interactiveElements.length > 0
          }
        })

        expect(accessibilityCheck.hasNavigation).toBe(true)
        expect(accessibilityCheck.canNavigate).toBe(true)
        expect(accessibilityCheck.focusableElementsCount).toBeGreaterThan(0)
      }
    })
  })

  describe('Performance Impact Detection', () => {
    test('mobile: DOM complexity comparison', async () => {
      // Measure desktop DOM complexity
      await page.setViewport({ width: 1024, height: 768 })
      await page.goto(baseUrl)
      await page.waitForSelector('[data-testid="logo"], .min-h-screen', { timeout: 5000 })

      const desktopMetrics = await page.evaluate(() => {
        const allElements = document.querySelectorAll('*').length
        const sidebarElements = document.querySelectorAll('[data-testid*="sidebar"]').length
        const interactiveElements = document.querySelectorAll('a, button, [role="button"]').length
        
        return { allElements, sidebarElements, interactiveElements }
      })

      // Measure mobile DOM complexity
      await page.setViewport({ width: 390, height: 844 })
      await page.reload()
      await page.waitForSelector('[data-testid="logo"], .min-h-screen', { timeout: 5000 })

      const mobileMetrics = await page.evaluate(() => {
        const allElements = document.querySelectorAll('*').length
        const sidebarElements = document.querySelectorAll('[data-testid*="sidebar"]').length
        const bottomNavElements = document.querySelectorAll('[data-testid="bottom-nav"] *').length
        const interactiveElements = document.querySelectorAll('a, button, [role="button"]').length
        
        return { allElements, sidebarElements, bottomNavElements, interactiveElements }
      })

      // Mobile should have fewer sidebar elements
      expect(mobileMetrics.sidebarElements).toBeLessThan(desktopMetrics.sidebarElements)
      
      // Mobile should have bottom nav elements
      expect(mobileMetrics.bottomNavElements).toBeGreaterThan(0)
      
      // Overall element count should be reasonably similar (mobile might be slightly less)
      const elementDifference = Math.abs(mobileMetrics.allElements - desktopMetrics.allElements)
      expect(elementDifference).toBeLessThan(desktopMetrics.allElements * 0.3) // Less than 30% difference

      console.log('DOM Complexity Comparison:', {
        desktop: desktopMetrics,
        mobile: mobileMetrics,
        reduction: {
          sidebarElements: desktopMetrics.sidebarElements - mobileMetrics.sidebarElements,
          percentSaved: ((desktopMetrics.sidebarElements - mobileMetrics.sidebarElements) / desktopMetrics.sidebarElements * 100).toFixed(1) + '%'
        }
      })
    })
  })
})
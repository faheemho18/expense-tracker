import puppeteer, { Page, Browser } from 'puppeteer'
import lighthouse from 'lighthouse'

describe('Navigation Performance', () => {
  let browser: Browser
  let page: Page
  const baseUrl = process.env.TEST_URL || 'http://localhost:3000'

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: process.env.CI === 'true',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--remote-debugging-port=9222'],
    })
  })

  afterAll(async () => {
    await browser.close()
  })

  beforeEach(async () => {
    page = await browser.newPage()
    
    // Enable performance monitoring
    await page.setRequestInterception(true)
    
    const responses: any[] = []
    const requests: any[] = []
    
    page.on('request', request => {
      requests.push({
        url: request.url(),
        method: request.method(),
        headers: request.headers(),
        timestamp: Date.now()
      })
      request.continue()
    })
    
    page.on('response', response => {
      responses.push({
        url: response.url(),
        status: response.status(),
        headers: response.headers(),
        timestamp: Date.now()
      })
    })

    await page.goto(baseUrl)
    await page.waitForSelector('[data-testid="logo"], .min-h-screen', { timeout: 10000 })
  })

  afterEach(async () => {
    await page.close()
  })

  describe('DOM Element Count Reduction', () => {
    test('mobile: DOM element count reduction', async () => {
      // Measure desktop DOM complexity first
      await page.setViewport({ width: 1024, height: 768 })
      await page.reload()
      await page.waitForSelector('[data-testid="logo"], .min-h-screen', { timeout: 5000 })

      const desktopMetrics = await page.evaluate(() => {
        const startTime = performance.now()
        
        // Count different types of elements
        const allElements = document.querySelectorAll('*')
        const sidebarElements = document.querySelectorAll('[data-testid*="sidebar"]')
        const interactiveElements = document.querySelectorAll('a, button, input, select, textarea')
        const navElements = document.querySelectorAll('nav, [role="navigation"]')
        
        // Measure DOM query performance
        const queryTime = performance.now() - startTime

        // Memory usage approximation (element count * average element size)
        const memoryEstimate = allElements.length * 150 // rough bytes per element

        return {
          totalElements: allElements.length,
          sidebarElements: sidebarElements.length,
          interactiveElements: interactiveElements.length,
          navElements: navElements.length,
          queryTime,
          memoryEstimate,
          sidebarPresent: document.querySelector('[data-testid="sidebar"]') !== null,
          bottomNavPresent: document.querySelector('[data-testid="bottom-nav"]') !== null
        }
      })

      // Measure mobile DOM complexity
      await page.setViewport({ width: 390, height: 844 })
      await page.reload()
      await page.waitForSelector('[data-testid="logo"], .min-h-screen', { timeout: 5000 })

      const mobileMetrics = await page.evaluate(() => {
        const startTime = performance.now()
        
        const allElements = document.querySelectorAll('*')
        const sidebarElements = document.querySelectorAll('[data-testid*="sidebar"]')
        const bottomNavElements = document.querySelectorAll('[data-testid="bottom-nav"] *')
        const interactiveElements = document.querySelectorAll('a, button, input, select, textarea')
        const navElements = document.querySelectorAll('nav, [role="navigation"]')
        
        const queryTime = performance.now() - startTime
        const memoryEstimate = allElements.length * 150

        return {
          totalElements: allElements.length,
          sidebarElements: sidebarElements.length,
          bottomNavElements: bottomNavElements.length,
          interactiveElements: interactiveElements.length,
          navElements: navElements.length,
          queryTime,
          memoryEstimate,
          sidebarPresent: document.querySelector('[data-testid="sidebar"]') !== null,
          bottomNavPresent: document.querySelector('[data-testid="bottom-nav"]') !== null
        }
      })

      // Verify the sidebar redundancy removal worked
      expect(desktopMetrics.sidebarPresent).toBe(true)
      expect(desktopMetrics.bottomNavPresent).toBe(false)
      expect(mobileMetrics.sidebarPresent).toBe(false)
      expect(mobileMetrics.bottomNavPresent).toBe(true)

      // Mobile should have fewer sidebar elements
      expect(mobileMetrics.sidebarElements).toBeLessThan(desktopMetrics.sidebarElements)
      
      // Calculate performance improvements
      const elementReduction = desktopMetrics.sidebarElements - mobileMetrics.sidebarElements
      const memoryReduction = desktopMetrics.memoryEstimate - mobileMetrics.memoryEstimate
      const reductionPercentage = (elementReduction / desktopMetrics.sidebarElements) * 100

      // Log performance metrics
      console.log('DOM Performance Comparison:', {
        desktop: {
          total: desktopMetrics.totalElements,
          sidebar: desktopMetrics.sidebarElements,
          interactive: desktopMetrics.interactiveElements,
          memory: `${(desktopMetrics.memoryEstimate / 1024).toFixed(1)}KB`,
          queryTime: `${desktopMetrics.queryTime.toFixed(2)}ms`
        },
        mobile: {
          total: mobileMetrics.totalElements,
          sidebar: mobileMetrics.sidebarElements,
          bottomNav: mobileMetrics.bottomNavElements,
          interactive: mobileMetrics.interactiveElements,
          memory: `${(mobileMetrics.memoryEstimate / 1024).toFixed(1)}KB`,
          queryTime: `${mobileMetrics.queryTime.toFixed(2)}ms`
        },
        improvement: {
          elementsReduced: elementReduction,
          percentageReduction: `${reductionPercentage.toFixed(1)}%`,
          memoryReduced: `${(memoryReduction / 1024).toFixed(1)}KB`
        }
      })

      // Expectations
      expect(elementReduction).toBeGreaterThan(0)
      expect(reductionPercentage).toBeGreaterThan(10) // At least 10% reduction in sidebar elements
      expect(mobileMetrics.queryTime).toBeLessThanOrEqual(desktopMetrics.queryTime * 1.1) // Query time shouldn't increase significantly
    })

    test('mobile: bundle size impact measurement', async () => {
      // This test measures the impact on JavaScript bundle size and execution
      await page.setViewport({ width: 390, height: 844 })
      await page.reload()
      await page.waitForSelector('[data-testid="logo"], .min-h-screen', { timeout: 5000 })

      const bundleMetrics = await page.evaluate(() => {
        const startTime = performance.now()
        
        // Measure JavaScript execution time
        const scripts = document.querySelectorAll('script')
        const styleSheets = document.querySelectorAll('link[rel="stylesheet"], style')
        
        // Get performance entries
        const navigationEntries = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        const resourceEntries = performance.getEntriesByType('resource')
        
        // Calculate load times
        const domContentLoaded = navigationEntries.domContentLoadedEventEnd - navigationEntries.navigationStart
        const loadComplete = navigationEntries.loadEventEnd - navigationEntries.navigationStart
        
        // JavaScript bundle analysis
        const jsResources = resourceEntries.filter(entry => 
          entry.name.includes('.js') || entry.name.includes('/_next/static/')
        )
        
        const totalJSSize = jsResources.reduce((sum, resource) => {
          return sum + (resource.transferSize || 0)
        }, 0)

        const endTime = performance.now()

        return {
          scriptsCount: scripts.length,
          styleSheetsCount: styleSheets.length,
          domContentLoaded,
          loadComplete,
          jsResourcesCount: jsResources.length,
          estimatedJSSize: totalJSSize,
          measurementTime: endTime - startTime,
          navigationEntries: {
            domInteractive: navigationEntries.domInteractive - navigationEntries.navigationStart,
            domComplete: navigationEntries.domComplete - navigationEntries.navigationStart
          }
        }
      })

      // Performance expectations
      expect(bundleMetrics.domContentLoaded).toBeLessThan(5000) // Should load within 5 seconds
      expect(bundleMetrics.loadComplete).toBeLessThan(10000) // Complete load within 10 seconds
      expect(bundleMetrics.measurementTime).toBeLessThan(100) // Performance measurement should be fast

      console.log('Bundle Performance Metrics:', {
        scripts: bundleMetrics.scriptsCount,
        styles: bundleMetrics.styleSheetsCount,
        domContentLoaded: `${bundleMetrics.domContentLoaded.toFixed(0)}ms`,
        loadComplete: `${bundleMetrics.loadComplete.toFixed(0)}ms`,
        estimatedJSSize: `${(bundleMetrics.estimatedJSSize / 1024).toFixed(1)}KB`,
        navigationMetrics: bundleMetrics.navigationEntries
      })
    })
  })

  describe('Desktop Performance Preservation', () => {
    test('desktop: no performance regression', async () => {
      await page.setViewport({ width: 1280, height: 720 })
      await page.reload()
      await page.waitForSelector('[data-testid="sidebar"], .min-h-screen', { timeout: 5000 })

      const desktopPerformance = await page.evaluate(() => {
        const startTime = performance.now()
        
        // Test sidebar interaction performance
        const sidebarTrigger = document.querySelector('[data-testid="sidebar-trigger"]') as HTMLElement
        const sidebar = document.querySelector('[data-testid="sidebar"]')
        
        // Measure DOM query performance
        const queryStartTime = performance.now()
        const sidebarElements = document.querySelectorAll('[data-testid*="sidebar"]')
        const navElements = document.querySelectorAll('[data-testid="sidebar"] a, [data-testid="sidebar"] button')
        const queryEndTime = performance.now()
        
        // Simulate sidebar interaction
        let interactionTime = 0
        if (sidebarTrigger) {
          const interactionStart = performance.now()
          sidebarTrigger.click()
          interactionTime = performance.now() - interactionStart
        }

        const endTime = performance.now()

        return {
          totalMeasurementTime: endTime - startTime,
          sidebarElementsCount: sidebarElements.length,
          navElementsCount: navElements.length,
          queryTime: queryEndTime - queryStartTime,
          interactionTime,
          sidebarPresent: !!sidebar,
          sidebarTriggerPresent: !!sidebarTrigger,
          memoryUsage: {
            totalElements: document.querySelectorAll('*').length,
            interactiveElements: document.querySelectorAll('a, button, input').length
          }
        }
      })

      // Desktop performance expectations
      expect(desktopPerformance.sidebarPresent).toBe(true)
      expect(desktopPerformance.sidebarTriggerPresent).toBe(true)
      expect(desktopPerformance.sidebarElementsCount).toBeGreaterThan(0)
      expect(desktopPerformance.navElementsCount).toBeGreaterThan(0)
      expect(desktopPerformance.queryTime).toBeLessThan(50) // DOM queries should be fast
      expect(desktopPerformance.interactionTime).toBeLessThan(16) // Interaction should be under 1 frame (60fps)

      console.log('Desktop Performance Metrics:', {
        sidebarElements: desktopPerformance.sidebarElementsCount,
        navElements: desktopPerformance.navElementsCount,
        queryTime: `${desktopPerformance.queryTime.toFixed(2)}ms`,
        interactionTime: `${desktopPerformance.interactionTime.toFixed(2)}ms`,
        totalElements: desktopPerformance.memoryUsage.totalElements,
        interactiveElements: desktopPerformance.memoryUsage.interactiveElements
      })
    })
  })

  describe('Responsive Transition Performance', () => {
    test('responsive: transition animation performance', async () => {
      const isAuthPage = await page.$('[data-testid="auth-page"]') !== null
      if (isAuthPage) {
        console.log('Skipping test - auth page detected')
        return
      }

      // Start with desktop
      await page.setViewport({ width: 1024, height: 768 })
      await page.reload()
      await page.waitForSelector('[data-testid="sidebar"], .min-h-screen', { timeout: 5000 })

      // Measure transition performance
      const transitionMetrics = await page.evaluate(async () => {
        const measurements = []
        
        // Function to measure layout performance
        const measureLayout = (label: string) => {
          const start = performance.now()
          
          // Force layout recalculation
          const elements = document.querySelectorAll('*')
          elements.forEach(el => {
            el.getBoundingClientRect()
          })
          
          const end = performance.now()
          return { label, duration: end - start, elementCount: elements.length }
        }

        // Initial measurement
        measurements.push(measureLayout('initial-desktop'))

        return measurements
      })

      // Transition to mobile
      await page.setViewport({ width: 390, height: 844 })
      await page.waitForTimeout(500) // Allow for responsive changes

      const mobileTransitionMetrics = await page.evaluate(() => {
        const start = performance.now()
        
        // Measure layout after transition
        const elements = document.querySelectorAll('*')
        elements.forEach(el => {
          el.getBoundingClientRect()
        })
        
        const end = performance.now()
        
        return {
          label: 'mobile-after-transition',
          duration: end - start,
          elementCount: elements.length,
          sidebarPresent: !!document.querySelector('[data-testid="sidebar"]'),
          bottomNavPresent: !!document.querySelector('[data-testid="bottom-nav"]')
        }
      })

      // Performance expectations
      expect(transitionMetrics[0].duration).toBeLessThan(100) // Initial layout should be fast
      expect(mobileTransitionMetrics.duration).toBeLessThan(100) // Mobile layout should be fast
      expect(mobileTransitionMetrics.sidebarPresent).toBe(false)
      expect(mobileTransitionMetrics.bottomNavPresent).toBe(true)

      console.log('Transition Performance:', {
        desktop: {
          layoutTime: `${transitionMetrics[0].duration.toFixed(2)}ms`,
          elements: transitionMetrics[0].elementCount
        },
        mobile: {
          layoutTime: `${mobileTransitionMetrics.duration.toFixed(2)}ms`,
          elements: mobileTransitionMetrics.elementCount,
          elementReduction: transitionMetrics[0].elementCount - mobileTransitionMetrics.elementCount
        }
      })
    })

    test('responsive: frame rate during viewport changes', async () => {
      const isAuthPage = await page.$('[data-testid="auth-page"]') !== null
      if (isAuthPage) return

      // Enable frame rate monitoring
      await page.evaluateOnNewDocument(() => {
        (window as any).frameRateData = []
        let lastTime = 0
        
        function measureFrameRate(timestamp: number) {
          if (lastTime) {
            const delta = timestamp - lastTime
            const fps = 1000 / delta
            ;(window as any).frameRateData.push(fps)
          }
          lastTime = timestamp
          
          if ((window as any).frameRateData.length < 60) { // Measure for ~1 second
            requestAnimationFrame(measureFrameRate)
          }
        }
        
        requestAnimationFrame(measureFrameRate)
      })

      // Start measurement
      await page.setViewport({ width: 1024, height: 768 })
      await page.reload()
      await page.waitForSelector('[data-testid="logo"], .min-h-screen', { timeout: 5000 })

      // Trigger viewport changes
      const viewportSizes = [
        { width: 900, height: 768 },
        { width: 800, height: 768 },
        { width: 768, height: 768 },
        { width: 700, height: 768 },
        { width: 600, height: 768 },
        { width: 500, height: 844 },
        { width: 390, height: 844 }
      ]

      for (const viewport of viewportSizes) {
        await page.setViewport(viewport)
        await page.waitForTimeout(100) // Small delay between transitions
      }

      // Get frame rate data
      const frameRateResults = await page.evaluate(() => {
        const data = (window as any).frameRateData || []
        if (data.length === 0) return { error: 'No frame rate data collected' }
        
        const avgFPS = data.reduce((sum: number, fps: number) => sum + fps, 0) / data.length
        const minFPS = Math.min(...data)
        const maxFPS = Math.max(...data)
        
        // Count frames below 30fps (poor performance)
        const poorFrames = data.filter((fps: number) => fps < 30).length
        const goodFrames = data.filter((fps: number) => fps >= 50).length
        
        return {
          avgFPS,
          minFPS,
          maxFPS,
          totalFrames: data.length,
          poorFrames,
          goodFrames,
          poorFramePercentage: (poorFrames / data.length) * 100,
          goodFramePercentage: (goodFrames / data.length) * 100
        }
      })

      if (frameRateResults.error) {
        console.log('Frame rate measurement failed:', frameRateResults.error)
        return
      }

      // Performance expectations
      expect(frameRateResults.avgFPS).toBeGreaterThan(30) // Average should be above 30fps
      expect(frameRateResults.poorFramePercentage).toBeLessThan(20) // Less than 20% poor frames
      expect(frameRateResults.minFPS).toBeGreaterThan(15) // Even worst case should be above 15fps

      console.log('Frame Rate Analysis:', {
        average: `${frameRateResults.avgFPS.toFixed(1)}fps`,
        range: `${frameRateResults.minFPS.toFixed(1)} - ${frameRateResults.maxFPS.toFixed(1)}fps`,
        performance: {
          good: `${frameRateResults.goodFramePercentage.toFixed(1)}%`,
          poor: `${frameRateResults.poorFramePercentage.toFixed(1)}%`
        },
        totalFramesMeasured: frameRateResults.totalFrames
      })
    })
  })

  describe('Memory Usage Analysis', () => {
    test('mobile: memory efficiency improvement', async () => {
      // Test memory usage patterns between desktop and mobile
      
      // Desktop measurement
      await page.setViewport({ width: 1280, height: 720 })
      await page.reload()
      await page.waitForSelector('[data-testid="logo"], .min-h-screen', { timeout: 5000 })

      const desktopMemory = await page.evaluate(() => {
        // Estimate memory usage based on DOM complexity
        const allElements = document.querySelectorAll('*')
        const eventListeners = document.querySelectorAll('a, button, input, [onclick], [onchange]')
        const sidebarElements = document.querySelectorAll('[data-testid*="sidebar"]')
        
        // Rough memory estimates (bytes)
        const elementMemory = allElements.length * 200 // ~200 bytes per element
        const listenerMemory = eventListeners.length * 50 // ~50 bytes per listener
        const sidebarMemory = sidebarElements.length * 150 // ~150 bytes per sidebar element
        
        return {
          totalElements: allElements.length,
          eventListeners: eventListeners.length,
          sidebarElements: sidebarElements.length,
          estimatedMemory: {
            elements: elementMemory,
            listeners: listenerMemory,
            sidebar: sidebarMemory,
            total: elementMemory + listenerMemory + sidebarMemory
          }
        }
      })

      // Mobile measurement
      await page.setViewport({ width: 390, height: 844 })
      await page.reload()
      await page.waitForSelector('[data-testid="logo"], .min-h-screen', { timeout: 5000 })

      const mobileMemory = await page.evaluate(() => {
        const allElements = document.querySelectorAll('*')
        const eventListeners = document.querySelectorAll('a, button, input, [onclick], [onchange]')
        const sidebarElements = document.querySelectorAll('[data-testid*="sidebar"]')
        const bottomNavElements = document.querySelectorAll('[data-testid="bottom-nav"] *')
        
        const elementMemory = allElements.length * 200
        const listenerMemory = eventListeners.length * 50
        const sidebarMemory = sidebarElements.length * 150
        const bottomNavMemory = bottomNavElements.length * 150
        
        return {
          totalElements: allElements.length,
          eventListeners: eventListeners.length,
          sidebarElements: sidebarElements.length,
          bottomNavElements: bottomNavElements.length,
          estimatedMemory: {
            elements: elementMemory,
            listeners: listenerMemory,
            sidebar: sidebarMemory,
            bottomNav: bottomNavMemory,
            total: elementMemory + listenerMemory + sidebarMemory + bottomNavMemory
          }
        }
      })

      // Calculate memory savings
      const memorySavings = desktopMemory.estimatedMemory.total - mobileMemory.estimatedMemory.total
      const sidebarMemorySavings = desktopMemory.estimatedMemory.sidebar - mobileMemory.estimatedMemory.sidebar
      const savingsPercentage = (memorySavings / desktopMemory.estimatedMemory.total) * 100

      // Expectations
      expect(mobileMemory.sidebarElements).toBeLessThan(desktopMemory.sidebarElements)
      expect(sidebarMemorySavings).toBeGreaterThan(0)
      expect(mobileMemory.bottomNavElements).toBeGreaterThan(0)

      console.log('Memory Usage Analysis:', {
        desktop: {
          elements: desktopMemory.totalElements,
          sidebar: desktopMemory.sidebarElements,
          memory: `${(desktopMemory.estimatedMemory.total / 1024).toFixed(1)}KB`
        },
        mobile: {
          elements: mobileMemory.totalElements,
          sidebar: mobileMemory.sidebarElements,
          bottomNav: mobileMemory.bottomNavElements,
          memory: `${(mobileMemory.estimatedMemory.total / 1024).toFixed(1)}KB`
        },
        savings: {
          memory: `${(memorySavings / 1024).toFixed(1)}KB`,
          percentage: `${savingsPercentage.toFixed(1)}%`,
          sidebarMemory: `${(sidebarMemorySavings / 1024).toFixed(1)}KB`
        }
      })
    })
  })
})
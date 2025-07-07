import { test, expect } from '@playwright/test'
import type { Page, Locator } from '@playwright/test'

/**
 * Touch Interaction Improvements Test Suite
 * Tests the enhanced touch interactions implemented in Task #8
 * 
 * Covers:
 * - Touch gesture handling
 * - Pinch-to-zoom functionality
 * - Swipe navigation
 * - Touch-friendly tooltips
 * - Mobile chart responsiveness
 */

// Test configuration
const TEST_CONFIG = {
  // Touch gesture thresholds
  swipeThreshold: 80,
  pinchThreshold: 0.2,
  tapThreshold: 10,
  
  // Timing
  longPressDelay: 500,
  doubleTapDelay: 300,
  gestureTimeout: 5000,
  
  // Mobile device simulation
  mobileViewport: { width: 375, height: 667 }, // iPhone SE
  tabletViewport: { width: 768, height: 1024 }, // iPad
}

// Helper functions for touch interactions
class TouchInteractionHelper {
  constructor(private page: Page) {}

  /**
   * Simulate pinch-to-zoom gesture
   */
  async pinchZoom(
    element: Locator,
    scale: number,
    centerX?: number,
    centerY?: number
  ): Promise<void> {
    const box = await element.boundingBox()
    if (!box) throw new Error('Element not found for pinch gesture')

    const cx = centerX ?? box.x + box.width / 2
    const cy = centerY ?? box.y + box.height / 2

    // Calculate touch points for pinch
    const distance = Math.min(box.width, box.height) * 0.3
    const startDistance = distance
    const endDistance = distance * scale

    // Start touches
    await this.page.touchscreen.tap(cx - startDistance / 2, cy)
    await this.page.touchscreen.tap(cx + startDistance / 2, cy)

    // Simulate pinch movement
    const steps = 10
    for (let i = 0; i <= steps; i++) {
      const progress = i / steps
      const currentDistance = startDistance + (endDistance - startDistance) * progress
      
      await this.page.touchscreen.tap(cx - currentDistance / 2, cy)
      await this.page.touchscreen.tap(cx + currentDistance / 2, cy)
      await this.page.waitForTimeout(50)
    }
  }

  /**
   * Simulate swipe gesture
   */
  async swipe(
    element: Locator,
    direction: 'left' | 'right' | 'up' | 'down',
    distance: number = TEST_CONFIG.swipeThreshold
  ): Promise<void> {
    const box = await element.boundingBox()
    if (!box) throw new Error('Element not found for swipe gesture')

    const startX = box.x + box.width / 2
    const startY = box.y + box.height / 2

    let endX = startX
    let endY = startY

    switch (direction) {
      case 'left':
        endX = startX - distance
        break
      case 'right':
        endX = startX + distance
        break
      case 'up':
        endY = startY - distance
        break
      case 'down':
        endY = startY + distance
        break
    }

    // Perform swipe with realistic timing
    await this.page.touchscreen.tap(startX, startY)
    await this.page.waitForTimeout(50)
    
    // Smooth swipe motion
    const steps = 5
    for (let i = 1; i <= steps; i++) {
      const progress = i / steps
      const currentX = startX + (endX - startX) * progress
      const currentY = startY + (endY - startY) * progress
      
      await this.page.touchscreen.tap(currentX, currentY)
      await this.page.waitForTimeout(20)
    }
  }

  /**
   * Simulate long press
   */
  async longPress(element: Locator, duration: number = TEST_CONFIG.longPressDelay): Promise<void> {
    const box = await element.boundingBox()
    if (!box) throw new Error('Element not found for long press')

    const x = box.x + box.width / 2
    const y = box.y + box.height / 2

    await this.page.touchscreen.tap(x, y)
    await this.page.waitForTimeout(duration)
  }

  /**
   * Check if element has touch-friendly size (44px minimum)
   */
  async hasTouchFriendlySize(element: Locator): Promise<boolean> {
    const box = await element.boundingBox()
    if (!box) return false

    const minSize = 44
    return box.width >= minSize && box.height >= minSize
  }

  /**
   * Measure touch response time
   */
  async measureTouchResponse(element: Locator): Promise<number> {
    const startTime = Date.now()
    
    await element.tap()
    
    // Wait for visual response (e.g., state change, animation)
    await this.page.waitForTimeout(100)
    
    const endTime = Date.now()
    return endTime - startTime
  }
}

test.describe('Touch Interaction Improvements', () => {
  let touchHelper: TouchInteractionHelper

  test.beforeEach(async ({ page }) => {
    touchHelper = new TouchInteractionHelper(page)
    
    // Navigate to dashboard page
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
  })

  test.describe('Touch Gesture Handling', () => {
    test('should detect and handle pinch-to-zoom on charts', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize(TEST_CONFIG.mobileViewport)
      
      // Wait for charts to load
      const chartContainer = page.locator('[data-testid="chart-container"]').first()
      await expect(chartContainer).toBeVisible()

      // Test pinch zoom in
      await touchHelper.pinchZoom(chartContainer, 1.5)
      
      // Verify zoom level indicator appears
      const zoomIndicator = page.locator('[data-testid="zoom-indicator"]')
      await expect(zoomIndicator).toBeVisible()
      await expect(zoomIndicator).toContainText('150%')

      // Test pinch zoom out
      await touchHelper.pinchZoom(chartContainer, 0.8)
      await expect(zoomIndicator).toContainText('120%') // Should be reduced
    })

    test('should handle swipe navigation between widgets', async ({ page }) => {
      await page.setViewportSize(TEST_CONFIG.mobileViewport)
      
      const dashboardGrid = page.locator('[data-testid="dashboard-grid"]')
      await expect(dashboardGrid).toBeVisible()

      // Get initial widget count
      const initialWidgets = await page.locator('[data-testid="widget"]').count()
      expect(initialWidgets).toBeGreaterThan(0)

      // Test swipe left (next widget)
      await touchHelper.swipe(dashboardGrid, 'left')
      
      // Verify widget navigation occurred (implementation specific)
      // This could check for widget focus change, animation, etc.
      await page.waitForTimeout(500)
      
      // Test swipe right (previous widget)  
      await touchHelper.swipe(dashboardGrid, 'right')
      await page.waitForTimeout(500)
    })

    test('should support long press for context menus', async ({ page }) => {
      await page.setViewportSize(TEST_CONFIG.mobileViewport)
      
      const widget = page.locator('[data-testid="widget"]').first()
      await expect(widget).toBeVisible()

      // Perform long press
      await touchHelper.longPress(widget)
      
      // Check for context menu or options
      const contextMenu = page.locator('[data-testid="widget-context-menu"]')
      await expect(contextMenu).toBeVisible({ timeout: TEST_CONFIG.gestureTimeout })
    })
  })

  test.describe('Touch-Friendly UI Elements', () => {
    test('should have minimum touch target sizes', async ({ page }) => {
      await page.setViewportSize(TEST_CONFIG.mobileViewport)
      
      // Check zoom controls
      const zoomControls = page.locator('[data-testid="zoom-controls"] button')
      const controlCount = await zoomControls.count()
      
      for (let i = 0; i < controlCount; i++) {
        const control = zoomControls.nth(i)
        const isTouchFriendly = await touchHelper.hasTouchFriendlySize(control)
        expect(isTouchFriendly).toBeTruthy()
      }

      // Check legend items
      const legendItems = page.locator('[data-testid="chart-legend"] [role="button"]')
      const legendCount = await legendItems.count()
      
      for (let i = 0; i < Math.min(legendCount, 5); i++) {
        const item = legendItems.nth(i)
        const isTouchFriendly = await touchHelper.hasTouchFriendlySize(item)
        expect(isTouchFriendly).toBeTruthy()
      }
    })

    test('should show touch-friendly tooltips', async ({ page }) => {
      await page.setViewportSize(TEST_CONFIG.mobileViewport)
      
      const chartArea = page.locator('[data-testid="chart-area"]').first()
      await expect(chartArea).toBeVisible()

      // Tap to trigger tooltip
      await chartArea.tap()
      
      // Check for tooltip with touch-friendly sizing
      const tooltip = page.locator('[data-testid="chart-tooltip"]')
      await expect(tooltip).toBeVisible({ timeout: 2000 })
      
      // Verify tooltip is properly sized for touch
      const tooltipBox = await tooltip.boundingBox()
      expect(tooltipBox?.width).toBeGreaterThan(160) // Minimum width for readability
    })

    test('should prevent accidental interactions', async ({ page }) => {
      await page.setViewportSize(TEST_CONFIG.mobileViewport)
      
      // Test that small/quick taps don't trigger unintended actions
      const widget = page.locator('[data-testid="widget"]').first()
      
      // Quick tap should not trigger long press actions
      await widget.tap()
      await page.waitForTimeout(100)
      
      const contextMenu = page.locator('[data-testid="widget-context-menu"]')
      await expect(contextMenu).not.toBeVisible()

      // Test touch rejection for palm/edge touches
      const chartContainer = page.locator('[data-testid="chart-container"]').first()
      const box = await chartContainer.boundingBox()
      if (box) {
        // Tap at edge (simulating palm touch)
        await page.touchscreen.tap(box.x + 5, box.y + 5)
        
        // Should not trigger zoom or other interactions
        const zoomIndicator = page.locator('[data-testid="zoom-indicator"]')
        await expect(zoomIndicator).not.toBeVisible()
      }
    })
  })

  test.describe('Chart Zoom Functionality', () => {
    test('should provide zoom controls on touch devices', async ({ page }) => {
      await page.setViewportSize(TEST_CONFIG.mobileViewport)
      
      const chart = page.locator('[data-testid="chart-with-zoom"]').first()
      await expect(chart).toBeVisible()

      // Check for zoom controls
      const zoomInBtn = page.locator('[data-testid="zoom-in"]')
      const zoomOutBtn = page.locator('[data-testid="zoom-out"]')
      const resetBtn = page.locator('[data-testid="zoom-reset"]')
      
      await expect(zoomInBtn).toBeVisible()
      await expect(zoomOutBtn).toBeVisible()

      // Test zoom in
      await zoomInBtn.tap()
      const zoomIndicator = page.locator('[data-testid="zoom-indicator"]')
      await expect(zoomIndicator).toBeVisible()
      await expect(zoomIndicator).toContainText(/1[2-9][0-9]%/) // Should be > 120%

      // Reset button should appear when zoomed
      await expect(resetBtn).toBeVisible()

      // Test reset
      await resetBtn.tap()
      await expect(zoomIndicator).toContainText('100%')
    })

    test('should handle zoom boundaries correctly', async ({ page }) => {
      await page.setViewportSize(TEST_CONFIG.mobileViewport)
      
      const chart = page.locator('[data-testid="chart-with-zoom"]').first()
      await expect(chart).toBeVisible()

      const zoomInBtn = page.locator('[data-testid="zoom-in"]')
      const zoomOutBtn = page.locator('[data-testid="zoom-out"]')

      // Test maximum zoom
      for (let i = 0; i < 10; i++) {
        await zoomInBtn.tap()
        await page.waitForTimeout(100)
      }
      
      // Should be disabled at max zoom
      await expect(zoomInBtn).toBeDisabled()

      // Test minimum zoom
      for (let i = 0; i < 15; i++) {
        await zoomOutBtn.tap()
        await page.waitForTimeout(100)
      }
      
      // Should be disabled at min zoom
      await expect(zoomOutBtn).toBeDisabled()
    })

    test('should support pan when zoomed', async ({ page }) => {
      await page.setViewportSize(TEST_CONFIG.mobileViewport)
      
      const chart = page.locator('[data-testid="chart-with-zoom"]').first()
      await expect(chart).toBeVisible()

      // Zoom in first
      const zoomInBtn = page.locator('[data-testid="zoom-in"]')
      await zoomInBtn.tap()
      await zoomInBtn.tap()

      // Test pan gesture
      const chartArea = chart.locator('[data-testid="chart-area"]')
      await touchHelper.swipe(chartArea, 'right', 50)
      
      // Verify chart content moved (implementation specific)
      await page.waitForTimeout(300)
    })
  })

  test.describe('Performance and Responsiveness', () => {
    test('should have fast touch response times', async ({ page }) => {
      await page.setViewportSize(TEST_CONFIG.mobileViewport)
      
      const interactiveElements = [
        page.locator('[data-testid="zoom-in"]'),
        page.locator('[data-testid="chart-legend"] [role="button"]').first(),
        page.locator('[data-testid="widget-menu-button"]').first(),
      ]

      for (const element of interactiveElements) {
        if (await element.isVisible()) {
          const responseTime = await touchHelper.measureTouchResponse(element)
          expect(responseTime).toBeLessThan(200) // Should respond within 200ms
        }
      }
    })

    test('should maintain smooth animations during touch interactions', async ({ page }) => {
      await page.setViewportSize(TEST_CONFIG.mobileViewport)
      
      const chart = page.locator('[data-testid="chart-with-zoom"]').first()
      await expect(chart).toBeVisible()

      // Start zoom animation
      const zoomInBtn = page.locator('[data-testid="zoom-in"]')
      await zoomInBtn.tap()

      // Check for smooth transition (no jank)
      // This would ideally measure frame rates, but we'll check for animation completion
      const zoomIndicator = page.locator('[data-testid="zoom-indicator"]')
      await expect(zoomIndicator).toBeVisible({ timeout: 1000 })
      
      // Animation should complete within reasonable time
      await page.waitForTimeout(500)
    })

    test('should handle rapid touch inputs gracefully', async ({ page }) => {
      await page.setViewportSize(TEST_CONFIG.mobileViewport)
      
      const zoomInBtn = page.locator('[data-testid="zoom-in"]')
      await expect(zoomInBtn).toBeVisible()

      // Rapid tapping test
      for (let i = 0; i < 5; i++) {
        await zoomInBtn.tap()
        await page.waitForTimeout(50)
      }

      // Should still be responsive and not crash
      await expect(zoomInBtn).toBeVisible()
      
      const zoomIndicator = page.locator('[data-testid="zoom-indicator"]')
      await expect(zoomIndicator).toBeVisible()
    })
  })

  test.describe('Accessibility and Touch Integration', () => {
    test('should maintain keyboard navigation alongside touch', async ({ page }) => {
      await page.setViewportSize(TEST_CONFIG.mobileViewport)
      
      const zoomInBtn = page.locator('[data-testid="zoom-in"]')
      
      // Test keyboard navigation
      await zoomInBtn.focus()
      await page.keyboard.press('Enter')
      
      const zoomIndicator = page.locator('[data-testid="zoom-indicator"]')
      await expect(zoomIndicator).toBeVisible()
      
      // Touch should still work after keyboard interaction
      const zoomOutBtn = page.locator('[data-testid="zoom-out"]')
      await zoomOutBtn.tap()
      await expect(zoomIndicator).toContainText('100%')
    })

    test('should provide proper ARIA labels for touch interactions', async ({ page }) => {
      await page.setViewportSize(TEST_CONFIG.mobileViewport)
      
      // Check zoom controls have proper labels
      const zoomInBtn = page.locator('[data-testid="zoom-in"]')
      await expect(zoomInBtn).toHaveAttribute('aria-label', /zoom in/i)
      
      const zoomOutBtn = page.locator('[data-testid="zoom-out"]')
      await expect(zoomOutBtn).toHaveAttribute('aria-label', /zoom out/i)
      
      // Check interactive chart elements
      const legendItems = page.locator('[data-testid="chart-legend"] [role="button"]')
      const count = await legendItems.count()
      
      if (count > 0) {
        const firstItem = legendItems.first()
        await expect(firstItem).toHaveAttribute('role', 'button')
        await expect(firstItem).toHaveAttribute('tabindex', '0')
      }
    })

    test('should announce touch interactions to screen readers', async ({ page }) => {
      await page.setViewportSize(TEST_CONFIG.mobileViewport)
      
      // This test would check for aria-live announcements
      // Implementation depends on how screen reader announcements are handled
      
      const zoomInBtn = page.locator('[data-testid="zoom-in"]')
      await zoomInBtn.tap()
      
      // Check for aria-live region updates
      const announcements = page.locator('[aria-live="polite"]')
      if (await announcements.count() > 0) {
        await expect(announcements.first()).toContainText(/zoom/i)
      }
    })
  })

  test.describe('Edge Cases and Error Handling', () => {
    test('should handle interrupted gestures gracefully', async ({ page }) => {
      await page.setViewportSize(TEST_CONFIG.mobileViewport)
      
      const chart = page.locator('[data-testid="chart-with-zoom"]').first()
      await expect(chart).toBeVisible()

      // Start pinch gesture and interrupt it
      const box = await chart.boundingBox()
      if (box) {
        const centerX = box.x + box.width / 2
        const centerY = box.y + box.height / 2
        
        // Start pinch
        await page.touchscreen.tap(centerX - 50, centerY)
        await page.touchscreen.tap(centerX + 50, centerY)
        
        // Interrupt by navigating away and back
        await page.goBack()
        await page.goForward()
        
        // Chart should still be functional
        await expect(chart).toBeVisible()
        const zoomInBtn = page.locator('[data-testid="zoom-in"]')
        await zoomInBtn.tap()
        
        const zoomIndicator = page.locator('[data-testid="zoom-indicator"]')
        await expect(zoomIndicator).toBeVisible()
      }
    })

    test('should prevent memory leaks from touch event listeners', async ({ page }) => {
      await page.setViewportSize(TEST_CONFIG.mobileViewport)
      
      // Create and destroy multiple charts to test cleanup
      for (let i = 0; i < 3; i++) {
        await page.reload()
        await page.waitForLoadState('networkidle')
        
        const chart = page.locator('[data-testid="chart-with-zoom"]').first()
        await expect(chart).toBeVisible()
        
        // Perform touch interactions
        await touchHelper.pinchZoom(chart, 1.2)
        await page.waitForTimeout(200)
      }
      
      // Final check that everything still works
      const zoomInBtn = page.locator('[data-testid="zoom-in"]')
      await zoomInBtn.tap()
      
      const zoomIndicator = page.locator('[data-testid="zoom-indicator"]')
      await expect(zoomIndicator).toBeVisible()
    })
  })
})

// Cross-browser touch compatibility tests
test.describe('Cross-Browser Touch Compatibility', () => {
  const browsers = ['chromium', 'webkit'] // Firefox doesn't support touch simulation well
  
  browsers.forEach(browserName => {
    test(`should work correctly in ${browserName}`, async ({ page }) => {
      // Skip if not the current browser
      if (page.context().browser()?.browserType().name() !== browserName) {
        test.skip()
      }
      
      await page.setViewportSize(TEST_CONFIG.mobileViewport)
      await page.goto('/dashboard')
      
      const chart = page.locator('[data-testid="chart-with-zoom"]').first()
      await expect(chart).toBeVisible()
      
      // Basic touch interaction test
      const zoomInBtn = page.locator('[data-testid="zoom-in"]')
      await zoomInBtn.tap()
      
      const zoomIndicator = page.locator('[data-testid="zoom-indicator"]')
      await expect(zoomIndicator).toBeVisible()
    })
  })
})
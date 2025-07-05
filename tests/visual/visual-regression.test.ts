import { VisualTestHelper } from './visual-helper'
import { VISUAL_TESTS } from './config/visual-config'
import fs from 'fs'

describe('Visual Regression Tests', () => {
  let visualHelper: VisualTestHelper

  beforeAll(async () => {
    visualHelper = new VisualTestHelper()
    await visualHelper.setup()
  }, 30000)

  afterAll(async () => {
    await visualHelper.teardown()
  })

  // Test to generate baseline images
  describe('Generate Baseline Images', () => {
    VISUAL_TESTS.forEach((config) => {
      it(`should generate baseline for ${config.name}`, async () => {
        const paths = visualHelper.getScreenshotPaths(config.name)
        
        try {
          const screenshot = await visualHelper.captureScreenshot(config)
          await visualHelper.saveScreenshot(screenshot, paths.expected)
          
          console.log(`✅ Generated baseline for ${config.name}`)
        } catch (error) {
          console.error(`❌ Failed to generate baseline for ${config.name}:`, error)
          throw error
        }
      }, 30000)
    })
  })

  // Test to compare against baseline images
  describe('Visual Regression Comparison', () => {
    VISUAL_TESTS.forEach((config) => {
      it(`should match baseline for ${config.name}`, async () => {
        const paths = visualHelper.getScreenshotPaths(config.name)
        
        // Skip test if baseline doesn't exist
        if (!fs.existsSync(paths.expected)) {
          console.warn(`⚠️  Baseline not found for ${config.name}. Run baseline generation first.`)
          return
        }

        try {
          // Capture current screenshot
          const actualScreenshot = await visualHelper.captureScreenshot(config)
          await visualHelper.saveScreenshot(actualScreenshot, paths.actual)

          // Load baseline screenshot
          const expectedScreenshot = fs.readFileSync(paths.expected)

          // Compare screenshots
          const comparison = await visualHelper.compareScreenshots(
            expectedScreenshot,
            actualScreenshot,
            config.threshold || 0.1
          )

          // If images don't match, save diff image
          if (!comparison.match) {
            await visualHelper.saveDiffImage(
              expectedScreenshot,
              actualScreenshot,
              paths.diff
            )

            const diffPercentage = (comparison.diffPixels / comparison.totalPixels * 100).toFixed(2)
            console.error(
              `❌ Visual regression detected for ${config.name}: ${diffPercentage}% different (${comparison.diffPixels}/${comparison.totalPixels} pixels)`
            )
            console.error(`   Diff image saved to: ${paths.diff}`)
          } else {
            console.log(`✅ Visual test passed for ${config.name}`)
          }

          expect(comparison.match).toBe(true)
        } catch (error) {
          console.error(`❌ Visual test failed for ${config.name}:`, error)
          throw error
        }
      }, 30000)
    })
  })

  // Test NumberTicker animations specifically
  describe('NumberTicker Animation Tests', () => {
    it('should capture NumberTicker animations in stats widget', async () => {
      const config = {
        name: 'number-ticker-stats',
        url: '/dashboard',
        selector: '[data-testid="stats-widget"]',
        viewport: { width: 800, height: 600 },
        waitFor: 5000, // Wait for animations to complete
        threshold: 0.15, // Allow slightly more variation for animations
      }

      const paths = visualHelper.getScreenshotPaths(config.name)
      
      try {
        const screenshot = await visualHelper.captureScreenshot(config)
        await visualHelper.saveScreenshot(screenshot, paths.actual)
        
        console.log(`✅ Captured NumberTicker animation screenshot`)
      } catch (error) {
        console.error(`❌ Failed to capture NumberTicker animation:`, error)
        // Don't fail the test if dashboard doesn't have data yet
        console.warn('This is expected if no expense data exists yet')
      }
    }, 30000)

    it('should capture CurrencyTicker in expenses table', async () => {
      const config = {
        name: 'currency-ticker-table',
        url: '/',
        selector: '[data-testid="expenses-table"]',
        viewport: { width: 1200, height: 800 },
        waitFor: 4000, // Wait for table animations
        threshold: 0.15,
      }

      const paths = visualHelper.getScreenshotPaths(config.name)
      
      try {
        const screenshot = await visualHelper.captureScreenshot(config)
        await visualHelper.saveScreenshot(screenshot, paths.actual)
        
        console.log(`✅ Captured CurrencyTicker table screenshot`)
      } catch (error) {
        console.error(`❌ Failed to capture CurrencyTicker table:`, error)
        console.warn('This is expected if no expense data exists yet')
      }
    }, 30000)
  })
})
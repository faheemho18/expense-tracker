import puppeteer, { Page, Browser } from 'puppeteer'
import { PNG } from 'pngjs'
import pixelmatch from 'pixelmatch'
import fs from 'fs'
import path from 'path'
import { VisualTestConfig, DEFAULT_CONFIG } from './config/visual-config'

export class VisualTestHelper {
  private browser: Browser | null = null
  private page: Page | null = null

  async setup(): Promise<void> {
    this.browser = await puppeteer.launch({
      headless: process.env.CI === 'true',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
    this.page = await this.browser.newPage()
  }

  async teardown(): Promise<void> {
    if (this.page) {
      await this.page.close()
    }
    if (this.browser) {
      await this.browser.close()
    }
  }

  async captureScreenshot(config: VisualTestConfig): Promise<Buffer> {
    if (!this.page) {
      throw new Error('Page not initialized. Call setup() first.')
    }

    const page = this.page
    const viewport = config.viewport || DEFAULT_CONFIG.viewport
    const baseUrl = DEFAULT_CONFIG.baseUrl

    // Set viewport
    await page.setViewport(viewport)

    // Navigate to page
    await page.goto(`${baseUrl}${config.url}`, { waitUntil: 'networkidle0' })

    // Perform actions if specified
    if (config.actions) {
      for (const action of config.actions) {
        switch (action.type) {
          case 'click':
            if (action.selector) {
              await page.waitForSelector(action.selector, { timeout: 5000 })
              await page.click(action.selector)
            }
            break
          case 'hover':
            if (action.selector) {
              await page.waitForSelector(action.selector, { timeout: 5000 })
              await page.hover(action.selector)
            }
            break
          case 'type':
            if (action.selector && action.text) {
              await page.waitForSelector(action.selector, { timeout: 5000 })
              await page.type(action.selector, action.text)
            }
            break
          case 'wait':
            if (action.delay) {
              await page.waitForTimeout(action.delay)
            }
            break
        }
      }
    }

    // Wait for specified time or selector
    if (typeof config.waitFor === 'number') {
      await page.waitForTimeout(config.waitFor)
    } else if (typeof config.waitFor === 'string') {
      await page.waitForSelector(config.waitFor, { timeout: 10000 })
    }

    // Mask elements if specified
    if (config.maskElements) {
      await page.evaluate((selectors) => {
        selectors.forEach(selector => {
          const elements = document.querySelectorAll(selector)
          elements.forEach(el => {
            (el as HTMLElement).style.backgroundColor = '#000000'
            ;(el as HTMLElement).style.color = '#000000'
          })
        })
      }, config.maskElements)
    }

    // Take screenshot
    const screenshot = config.selector
      ? await page.screenshot({
          clip: await this.getElementBounds(page, config.selector),
          type: 'png',
        })
      : await page.screenshot({ type: 'png', fullPage: true })

    return screenshot as Buffer
  }

  private async getElementBounds(page: Page, selector: string) {
    const element = await page.waitForSelector(selector, { timeout: 5000 })
    if (!element) {
      throw new Error(`Element not found: ${selector}`)
    }
    return element.boundingBox()
  }

  async compareScreenshots(
    expected: Buffer,
    actual: Buffer,
    threshold: number = 0.1
  ): Promise<{ match: boolean; diffPixels: number; totalPixels: number }> {
    const expectedPng = PNG.sync.read(expected)
    const actualPng = PNG.sync.read(actual)

    const { width, height } = expectedPng
    const diff = new PNG({ width, height })

    const diffPixels = pixelmatch(
      expectedPng.data,
      actualPng.data,
      diff.data,
      width,
      height,
      {
        threshold,
        includeAA: false,
      }
    )

    const totalPixels = width * height
    const diffPercentage = diffPixels / totalPixels

    return {
      match: diffPercentage <= threshold,
      diffPixels,
      totalPixels,
    }
  }

  async saveScreenshot(buffer: Buffer, filePath: string): Promise<void> {
    const dir = path.dirname(filePath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(filePath, buffer)
  }

  async saveDiffImage(
    expected: Buffer,
    actual: Buffer,
    diffPath: string
  ): Promise<void> {
    const expectedPng = PNG.sync.read(expected)
    const actualPng = PNG.sync.read(actual)

    const { width, height } = expectedPng
    const diff = new PNG({ width, height })

    pixelmatch(
      expectedPng.data,
      actualPng.data,
      diff.data,
      width,
      height,
      {
        threshold: 0.1,
        includeAA: false,
      }
    )

    const dir = path.dirname(diffPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    fs.writeFileSync(diffPath, PNG.sync.write(diff))
  }

  getScreenshotPaths(testName: string) {
    const baseDir = path.join(process.cwd(), 'tests', 'visual', 'screenshots')
    return {
      expected: path.join(baseDir, 'expected', `${testName}.png`),
      actual: path.join(baseDir, 'actual', `${testName}.png`),
      diff: path.join(baseDir, 'diff', `${testName}.png`),
    }
  }
}
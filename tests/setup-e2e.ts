/**
 * E2E Test Setup
 * Common setup and teardown for Puppeteer E2E tests
 */

import puppeteer, { Browser, Page } from 'puppeteer'

export const setupBrowser = async (): Promise<Browser> => {
  const browser = await puppeteer.launch({
    headless: process.env.CI ? true : false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu'
    ]
  })
  
  return browser
}

export const teardownBrowser = async (browser: Browser): Promise<void> => {
  await browser.close()
}

export const createPage = async (browser: Browser): Promise<Page> => {
  const page = await browser.newPage()
  
  // Set viewport
  await page.setViewport({
    width: 1280,
    height: 720
  })
  
  // Set user agent
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36')
  
  return page
}

export const waitForAppLoad = async (page: Page): Promise<void> => {
  await page.waitForSelector('[data-testid="app-loaded"]', { timeout: 30000 })
}

export const simulateNetworkConditions = async (page: Page, conditions: {
  offline?: boolean
  slow?: boolean
  latency?: number
}): Promise<void> => {
  if (conditions.offline) {
    await page.setOfflineMode(true)
  } else if (conditions.slow) {
    await page.emulateNetworkConditions({
      offline: false,
      downloadThroughput: 500 * 1024 / 8, // 500kb/s
      uploadThroughput: 500 * 1024 / 8,
      latency: conditions.latency || 2000
    })
  } else {
    await page.setOfflineMode(false)
    await page.emulateNetworkConditions({
      offline: false,
      downloadThroughput: 0,
      uploadThroughput: 0,
      latency: 0
    })
  }
}

export const clearBrowserStorage = async (page: Page): Promise<void> => {
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
  
  // Clear IndexedDB
  await page.evaluate(() => {
    return new Promise((resolve) => {
      const databases = ['offline-queue', 'sync-data', 'app-data']
      let remaining = databases.length
      
      databases.forEach(dbName => {
        const deleteReq = indexedDB.deleteDatabase(dbName)
        deleteReq.onsuccess = () => {
          remaining--
          if (remaining === 0) resolve(undefined)
        }
        deleteReq.onerror = () => {
          remaining--
          if (remaining === 0) resolve(undefined)
        }
      })
    })
  })
}

export const mockApiResponse = async (page: Page, endpoint: string, response: any): Promise<void> => {
  await page.route(endpoint, route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(response)
    })
  })
}

export const mockApiError = async (page: Page, endpoint: string, statusCode: number = 500): Promise<void> => {
  await page.route(endpoint, route => {
    route.fulfill({
      status: statusCode,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Mocked API error' })
    })
  })
}

export const waitForNetworkIdle = async (page: Page, timeout: number = 30000): Promise<void> => {
  await page.waitForLoadState('networkidle', { timeout })
}

export const takeScreenshot = async (page: Page, name: string): Promise<void> => {
  await page.screenshot({
    path: `tests/screenshots/${name}.png`,
    fullPage: true
  })
}

export const getConsoleLogs = (page: Page): Promise<string[]> => {
  return new Promise((resolve) => {
    const logs: string[] = []
    
    page.on('console', msg => {
      logs.push(`${msg.type()}: ${msg.text()}`)
    })
    
    page.on('pageerror', error => {
      logs.push(`ERROR: ${error.message}`)
    })
    
    // Return logs after a short delay
    setTimeout(() => resolve(logs), 100)
  })
}

export const waitForSyncComplete = async (page: Page, timeout: number = 15000): Promise<void> => {
  await page.waitForFunction(
    () => {
      const badge = document.querySelector('[data-testid="sync-badge"]')
      return !badge || badge.textContent === '0'
    },
    { timeout }
  )
}

export const createExpense = async (page: Page, expense: {
  amount: string
  description: string
  category: string
  account: string
}): Promise<void> => {
  await page.click('[data-testid="add-expense-button"]')
  await page.waitForSelector('[data-testid="expense-form"]')
  
  await page.type('[data-testid="expense-amount"]', expense.amount)
  await page.type('[data-testid="expense-description"]', expense.description)
  await page.select('[data-testid="expense-category"]', expense.category)
  await page.select('[data-testid="expense-account"]', expense.account)
  
  await page.click('[data-testid="save-expense-button"]')
}

export const getExpenseCount = async (page: Page): Promise<number> => {
  const expenseItems = await page.$$('[data-testid="expense-item"]')
  return expenseItems.length
}

export const getSyncBadgeCount = async (page: Page): Promise<number> => {
  const badge = await page.$('[data-testid="sync-badge"]')
  if (!badge) return 0
  
  const text = await badge.evaluate(el => el.textContent)
  return parseInt(text || '0', 10)
}

export const waitForElement = async (page: Page, selector: string, timeout: number = 10000): Promise<void> => {
  await page.waitForSelector(selector, { timeout })
}

export const waitForText = async (page: Page, selector: string, text: string, timeout: number = 10000): Promise<void> => {
  await page.waitForFunction(
    (sel, txt) => {
      const element = document.querySelector(sel)
      return element && element.textContent?.includes(txt)
    },
    { timeout },
    selector,
    text
  )
}

export const simulateSlowNetwork = async (page: Page): Promise<void> => {
  await page.emulateNetworkConditions({
    offline: false,
    downloadThroughput: 100 * 1024 / 8, // 100kb/s
    uploadThroughput: 100 * 1024 / 8,
    latency: 3000 // 3 second latency
  })
}

export const resetNetworkConditions = async (page: Page): Promise<void> => {
  await page.emulateNetworkConditions({
    offline: false,
    downloadThroughput: 0,
    uploadThroughput: 0,
    latency: 0
  })
}

export const checkAccessibility = async (page: Page): Promise<any> => {
  // Add accessibility checks using axe-core
  await page.addScriptTag({
    path: require.resolve('axe-core/axe.min.js')
  })
  
  return await page.evaluate(() => {
    return new Promise((resolve) => {
      (window as any).axe.run(document, (err: any, results: any) => {
        if (err) throw err
        resolve(results)
      })
    })
  })
}

export const simulateUserInteraction = async (page: Page, actions: Array<{
  type: 'click' | 'type' | 'select' | 'wait'
  selector?: string
  value?: string
  delay?: number
}>): Promise<void> => {
  for (const action of actions) {
    switch (action.type) {
      case 'click':
        if (action.selector) {
          await page.click(action.selector)
        }
        break
      case 'type':
        if (action.selector && action.value) {
          await page.type(action.selector, action.value)
        }
        break
      case 'select':
        if (action.selector && action.value) {
          await page.select(action.selector, action.value)
        }
        break
      case 'wait':
        await page.waitForTimeout(action.delay || 1000)
        break
    }
  }
}

export const measurePerformance = async (page: Page, operation: () => Promise<void>): Promise<{
  duration: number
  memoryUsage: any
}> => {
  const startTime = Date.now()
  const startMemory = await page.evaluate(() => (performance as any).memory)
  
  await operation()
  
  const endTime = Date.now()
  const endMemory = await page.evaluate(() => (performance as any).memory)
  
  return {
    duration: endTime - startTime,
    memoryUsage: {
      start: startMemory,
      end: endMemory,
      delta: {
        usedJSHeapSize: endMemory.usedJSHeapSize - startMemory.usedJSHeapSize,
        totalJSHeapSize: endMemory.totalJSHeapSize - startMemory.totalJSHeapSize
      }
    }
  }
}
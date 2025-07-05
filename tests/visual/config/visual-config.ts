export interface VisualTestConfig {
  name: string
  url: string
  selector?: string
  viewport?: {
    width: number
    height: number
  }
  waitFor?: number | string
  actions?: Array<{
    type: 'click' | 'hover' | 'type' | 'wait'
    selector?: string
    text?: string
    delay?: number
  }>
  threshold?: number
  maskElements?: string[]
}

export const VISUAL_TESTS: VisualTestConfig[] = [
  {
    name: 'homepage-default',
    url: '/',
    viewport: { width: 1920, height: 1080 },
    waitFor: 2000,
    threshold: 0.1,
  },
  {
    name: 'homepage-mobile',
    url: '/',
    viewport: { width: 375, height: 667 },
    waitFor: 2000,
    threshold: 0.1,
  },
  {
    name: 'expenses-table-with-data',
    url: '/',
    selector: '[data-testid="expenses-table"]',
    viewport: { width: 1920, height: 1080 },
    waitFor: 3000,
    threshold: 0.1,
  },
  {
    name: 'add-expense-sheet',
    url: '/',
    viewport: { width: 1920, height: 1080 },
    actions: [
      { type: 'wait', delay: 2000 },
      { type: 'click', selector: '[data-testid="add-expense-button"]' },
      { type: 'wait', delay: 1000 },
    ],
    selector: '[data-testid="add-expense-sheet"]',
    threshold: 0.1,
  },
  {
    name: 'dashboard-page',
    url: '/dashboard',
    viewport: { width: 1920, height: 1080 },
    waitFor: 3000,
    threshold: 0.1,
  },
  {
    name: 'stats-widget',
    url: '/dashboard',
    selector: '[data-testid="stats-widget"]',
    viewport: { width: 800, height: 600 },
    waitFor: 3000,
    threshold: 0.1,
  },
  {
    name: 'settings-page',
    url: '/settings',
    viewport: { width: 1920, height: 1080 },
    waitFor: 2000,
    threshold: 0.1,
  },
  {
    name: 'themes-page',
    url: '/themes',
    viewport: { width: 1920, height: 1080 },
    waitFor: 2000,
    threshold: 0.1,
  },
]

export const DEFAULT_CONFIG = {
  threshold: 0.1,
  viewport: { width: 1920, height: 1080 },
  waitFor: 1000,
  baseUrl: 'http://localhost:3000',
}
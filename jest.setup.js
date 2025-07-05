import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock Next.js dynamic imports
jest.mock('next/dynamic', () => {
  return function mockDynamic(func) {
    return func()
  }
})

// Global fetch mock for API calls
global.fetch = jest.fn()

// Mock IntersectionObserver for motion components
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {}
  disconnect() {}
  unobserve() {}
}

// Mock ResizeObserver for components that use it
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {}
  disconnect() {}
  unobserve() {}
}

// Mock crypto.randomUUID for expense IDs
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9)
  }
})

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.sessionStorage = sessionStorageMock

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  createAuthClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: jest.fn().mockReturnValue({
        data: { subscription: {} },
        unsubscribe: jest.fn()
      }),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
    }
  })),
  supabase: {
    channel: jest.fn(),
    removeChannel: jest.fn(),
  },
}))

// Mock AI services
jest.mock('@/ai/genkit', () => ({
  ai: {
    generate: jest.fn(),
  },
}))

// Mock real-time sync
jest.mock('@/lib/realtime-sync', () => ({
  RealtimeSyncService: jest.fn().mockImplementation(() => ({
    initialize: jest.fn(),
    cleanup: jest.fn(),
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
    getStatus: jest.fn(() => ({
      connected: false,
      lastSync: null,
      pendingChanges: 0,
      conflictCount: 0,
    })),
  })),
  realtimeSync: {
    initialize: jest.fn(),
    cleanup: jest.fn(),
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
    getStatus: jest.fn(),
  },
}))

// Mock Framer Motion for all animation components
jest.mock('framer-motion', () => ({
  motion: {
    div: 'div',
    span: 'span',
    p: 'p',
    h1: 'h1',
    h2: 'h2',
    h3: 'h3',
    button: 'button',
  },
  AnimatePresence: ({ children }) => children,
  useMotionValue: () => ({ set: jest.fn(), get: jest.fn(() => 0) }),
  useSpring: () => ({ set: jest.fn(), get: jest.fn(() => 0) }),
  useTransform: () => ({ set: jest.fn(), get: jest.fn(() => 0) }),
  useInView: () => true,
}))

// Mock motion/react (newer package structure)
jest.mock('motion/react', () => ({
  motion: {
    div: 'div',
    span: 'span',
    p: 'p',
    h1: 'h1',
    h2: 'h2',
    h3: 'h3',
    button: 'button',
  },
  AnimatePresence: ({ children }) => children,
  useMotionValue: () => ({ set: jest.fn(), get: jest.fn(() => 0) }),
  useSpring: () => ({ set: jest.fn(), get: jest.fn(() => 0) }),
  useTransform: () => ({ set: jest.fn(), get: jest.fn(() => 0) }),
  useInView: () => true,
}))

// Mock Lucide React icons - use a proxy to mock all icons dynamically
jest.mock('lucide-react', () => new Proxy({}, {
  get: () => 'svg'
}))
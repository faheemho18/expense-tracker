import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { usePathname } from 'next/navigation'
import { AppLayout } from '@/components/app-layout'
import { useIsMobile } from '@/hooks/use-mobile'
import { useAuth } from '@/contexts/auth-context'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}))

// Mock mobile hook
jest.mock('@/hooks/use-mobile', () => ({
  useIsMobile: jest.fn(),
}))

// Mock auth context
jest.mock('@/contexts/auth-context', () => ({
  useAuth: jest.fn(),
}))

// Mock child components
jest.mock('@/components/ui/sidebar', () => ({
  Sidebar: ({ children }: { children: React.ReactNode }) => <div data-testid="sidebar">{children}</div>,
  SidebarContent: ({ children }: { children: React.ReactNode }) => <div data-testid="sidebar-content">{children}</div>,
  SidebarFooter: ({ children }: { children: React.ReactNode }) => <div data-testid="sidebar-footer">{children}</div>,
  SidebarHeader: ({ children }: { children: React.ReactNode }) => <div data-testid="sidebar-header">{children}</div>,
  SidebarInset: ({ children }: { children: React.ReactNode }) => <div data-testid="sidebar-inset">{children}</div>,
  SidebarMenu: ({ children }: { children: React.ReactNode }) => <div data-testid="sidebar-menu">{children}</div>,
  SidebarMenuButton: ({ children, isActive, asChild, ...props }: any) => (
    <div data-testid="sidebar-menu-button" data-active={isActive} {...props}>{children}</div>
  ),
  SidebarMenuItem: ({ children }: { children: React.ReactNode }) => <div data-testid="sidebar-menu-item">{children}</div>,
  SidebarProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="sidebar-provider">{children}</div>,
  SidebarTrigger: () => <button data-testid="sidebar-trigger">Toggle Sidebar</button>,
}))

jest.mock('@/components/logo', () => ({
  Logo: () => <div data-testid="logo">Logo</div>,
}))

jest.mock('@/components/auth/user-menu', () => ({
  UserMenu: () => <div data-testid="user-menu">User Menu</div>,
}))

jest.mock('@/components/auth/auth-page', () => ({
  AuthPage: () => <div data-testid="auth-page">Auth Page</div>,
}))

jest.mock('@/components/sync/sync-status-indicator', () => ({
  MiniSyncStatus: () => <div data-testid="mini-sync-status">Sync Status</div>,
}))

jest.mock('@/components/navigation/bottom-nav', () => ({
  BottomNav: () => <div data-testid="bottom-nav">Bottom Navigation</div>,
}))

jest.mock('@/components/navigation/swipe-navigation', () => ({
  SwipeNavigation: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="swipe-navigation">{children}</div>
  ),
}))

const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>
const mockUseIsMobile = useIsMobile as jest.MockedFunction<typeof useIsMobile>
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

describe('AppLayout Mobile Navigation', () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue('/')
    // Mock Supabase environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key'
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Mobile Layout Tests', () => {
    beforeEach(() => {
      mockUseIsMobile.mockReturnValue(true)
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'test@example.com' },
        loading: false,
        signIn: jest.fn(),
        signOut: jest.fn(),
        signUp: jest.fn(),
      })
    })

    test('renders bottom navigation on mobile', () => {
      render(<AppLayout>Test Content</AppLayout>)
      
      expect(screen.getByTestId('bottom-nav')).toBeInTheDocument()
    })

    test('hides sidebar components on mobile', () => {
      render(<AppLayout>Test Content</AppLayout>)
      
      expect(screen.queryByTestId('sidebar')).not.toBeInTheDocument()
      expect(screen.queryByTestId('sidebar-provider')).not.toBeInTheDocument()
      expect(screen.queryByTestId('sidebar-trigger')).not.toBeInTheDocument()
    })

    test('displays UserMenu in header on mobile', () => {
      render(<AppLayout>Test Content</AppLayout>)
      
      const userMenus = screen.getAllByTestId('user-menu')
      expect(userMenus).toHaveLength(1) // Only in header, not in sidebar footer
    })

    test('applies correct header styling on mobile', () => {
      render(<AppLayout>Test Content</AppLayout>)
      
      const header = screen.getByRole('banner')
      expect(header).toHaveClass('sticky', 'top-0', 'z-10', 'h-14')
      expect(screen.getByTestId('logo')).toBeInTheDocument()
      expect(screen.getByTestId('mini-sync-status')).toBeInTheDocument()
    })

    test('applies bottom padding for bottom navigation clearance', () => {
      render(<AppLayout>Test Content</AppLayout>)
      
      const main = screen.getByRole('main')
      expect(main).toHaveClass('pb-16')
    })

    test('includes SwipeNavigation wrapper on mobile', () => {
      render(<AppLayout>Test Content</AppLayout>)
      
      expect(screen.getByTestId('swipe-navigation')).toBeInTheDocument()
    })
  })

  describe('Desktop Layout Tests', () => {
    beforeEach(() => {
      mockUseIsMobile.mockReturnValue(false)
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'test@example.com' },
        loading: false,
        signIn: jest.fn(),
        signOut: jest.fn(),
        signUp: jest.fn(),
      })
    })

    test('renders sidebar with collapsible behavior on desktop', () => {
      render(<AppLayout>Test Content</AppLayout>)
      
      expect(screen.getByTestId('sidebar-provider')).toBeInTheDocument()
      expect(screen.getByTestId('sidebar')).toBeInTheDocument()
      expect(screen.getByTestId('sidebar-content')).toBeInTheDocument()
    })

    test('displays UserMenu in both sidebar footer and header on desktop', () => {
      render(<AppLayout>Test Content</AppLayout>)
      
      const userMenus = screen.getAllByTestId('user-menu')
      expect(userMenus).toHaveLength(2) // One in sidebar footer, one in header
    })

    test('shows SidebarTrigger on desktop', () => {
      render(<AppLayout>Test Content</AppLayout>)
      
      expect(screen.getByTestId('sidebar-trigger')).toBeInTheDocument()
    })

    test('does not render bottom navigation on desktop', () => {
      render(<AppLayout>Test Content</AppLayout>)
      
      expect(screen.queryByTestId('bottom-nav')).not.toBeInTheDocument()
    })

    test('renders all navigation menu items in sidebar', () => {
      render(<AppLayout>Test Content</AppLayout>)
      
      const menuItems = screen.getAllByTestId('sidebar-menu-item')
      expect(menuItems).toHaveLength(5) // Expenses, Dashboard, Data, Themes, Settings
    })

    test('includes SwipeNavigation wrapper on desktop', () => {
      render(<AppLayout>Test Content</AppLayout>)
      
      expect(screen.getByTestId('swipe-navigation')).toBeInTheDocument()
    })
  })

  describe('Authentication State Tests', () => {
    test('shows loading state while checking authentication', () => {
      mockUseIsMobile.mockReturnValue(true)
      mockUseAuth.mockReturnValue({
        user: null,
        loading: true,
        signIn: jest.fn(),
        signOut: jest.fn(),
        signUp: jest.fn(),
      })

      render(<AppLayout>Test Content</AppLayout>)
      
      // Check for loading spinner by class name since it doesn't have a role
      const loadingContainer = document.querySelector('.min-h-screen.flex.items-center.justify-center')
      expect(loadingContainer).toBeInTheDocument()
      expect(document.querySelector('.animate-spin')).toBeInTheDocument()
    })

    test('shows content when user not authenticated and Supabase not configured', () => {
      mockUseIsMobile.mockReturnValue(true)
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        signIn: jest.fn(),
        signOut: jest.fn(),
        signUp: jest.fn(),
      })

      // Mock invalid Supabase config to skip auth page and show main content
      const originalEnv = process.env.NEXT_PUBLIC_SUPABASE_URL
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'your_supabase_project_url_here'

      render(<AppLayout>Test Content</AppLayout>)
      
      // Should show main content instead of auth page
      expect(screen.getByText('Test Content')).toBeInTheDocument()
      
      // Restore environment
      process.env.NEXT_PUBLIC_SUPABASE_URL = originalEnv
    })

    test('hides UserMenu when user not authenticated', () => {
      mockUseIsMobile.mockReturnValue(true)
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        signIn: jest.fn(),
        signOut: jest.fn(),
        signUp: jest.fn(),
      })

      // Mock invalid Supabase config to skip auth page
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'your_supabase_project_url_here'

      render(<AppLayout>Test Content</AppLayout>)
      
      expect(screen.queryByTestId('user-menu')).not.toBeInTheDocument()
    })
  })

  describe('Responsive Behavior Tests', () => {
    test('transitions correctly between mobile and desktop layouts', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'test@example.com' },
        loading: false,
        signIn: jest.fn(),
        signOut: jest.fn(),
        signUp: jest.fn(),
      })

      // Start with mobile
      mockUseIsMobile.mockReturnValue(true)
      const { rerender } = render(<AppLayout>Test Content</AppLayout>)
      
      expect(screen.getByTestId('bottom-nav')).toBeInTheDocument()
      expect(screen.queryByTestId('sidebar')).not.toBeInTheDocument()

      // Switch to desktop
      mockUseIsMobile.mockReturnValue(false)
      rerender(<AppLayout>Test Content</AppLayout>)
      
      expect(screen.queryByTestId('bottom-nav')).not.toBeInTheDocument()
      expect(screen.getByTestId('sidebar')).toBeInTheDocument()
    })

    test('maintains SwipeNavigation functionality across layouts', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'test@example.com' },
        loading: false,
        signIn: jest.fn(),
        signOut: jest.fn(),
        signUp: jest.fn(),
      })

      // Test mobile
      mockUseIsMobile.mockReturnValue(true)
      const { rerender } = render(<AppLayout>Test Content</AppLayout>)
      expect(screen.getByTestId('swipe-navigation')).toBeInTheDocument()

      // Test desktop
      mockUseIsMobile.mockReturnValue(false)
      rerender(<AppLayout>Test Content</AppLayout>)
      expect(screen.getByTestId('swipe-navigation')).toBeInTheDocument()
    })

    test('preserves MiniSyncStatus positioning across layouts', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'test@example.com' },
        loading: false,
        signIn: jest.fn(),
        signOut: jest.fn(),
        signUp: jest.fn(),
      })

      // Test mobile
      mockUseIsMobile.mockReturnValue(true)
      const { rerender } = render(<AppLayout>Test Content</AppLayout>)
      expect(screen.getByTestId('mini-sync-status')).toBeInTheDocument()

      // Test desktop
      mockUseIsMobile.mockReturnValue(false)
      rerender(<AppLayout>Test Content</AppLayout>)
      expect(screen.getAllByTestId('mini-sync-status')).toHaveLength(1)
    })
  })

  describe('Navigation Menu Active State Tests', () => {
    beforeEach(() => {
      mockUseIsMobile.mockReturnValue(false)
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'test@example.com' },
        loading: false,
        signIn: jest.fn(),
        signOut: jest.fn(),
        signUp: jest.fn(),
      })
    })

    test('correctly identifies active navigation item', () => {
      mockUsePathname.mockReturnValue('/dashboard')
      
      render(<AppLayout>Test Content</AppLayout>)
      
      const menuButtons = screen.getAllByTestId('sidebar-menu-button')
      // Find the dashboard menu button (second item)
      const dashboardButton = menuButtons[1]
      expect(dashboardButton).toHaveAttribute('data-active', 'true')
    })

    test('handles root path active state', () => {
      mockUsePathname.mockReturnValue('/')
      
      render(<AppLayout>Test Content</AppLayout>)
      
      const menuButtons = screen.getAllByTestId('sidebar-menu-button')
      // Find the expenses menu button (first item)
      const expensesButton = menuButtons[0]
      expect(expensesButton).toHaveAttribute('data-active', 'true')
    })
  })
})
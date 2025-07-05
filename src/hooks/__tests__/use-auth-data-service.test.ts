import { renderHook, act } from '@testing-library/react'
import { useAuthDataService } from '../use-auth-data-service'
import * as authContext from '@/contexts/auth-context'
import { createSupabaseDataService } from '@/lib/supabase-data-service'
import { createLocalStorageDataService } from '@/lib/data-service'
import type { User } from '@/lib/types'

// Mock the data services
jest.mock('@/lib/supabase-data-service')
jest.mock('@/lib/data-service')

// Mock auth context
jest.mock('@/contexts/auth-context')

describe('useAuthDataService', () => {
  const mockSupabaseDataService = {
    expenses: {
      getAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    categories: {
      getAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    accounts: {
      getAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    themes: {
      getAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    migrateFromLocalStorage: jest.fn(),
    isSupabaseConfigured: jest.fn(() => true),
  }

  const mockLocalStorageDataService = {
    expenses: {
      getAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    categories: {
      getAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    accounts: {
      getAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    themes: {
      getAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    migrateFromLocalStorage: jest.fn(),
    isSupabaseConfigured: jest.fn(() => false),
  }

  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(createSupabaseDataService as jest.Mock).mockReturnValue(mockSupabaseDataService)
    ;(createLocalStorageDataService as jest.Mock).mockReturnValue(mockLocalStorageDataService)
  })

  describe('when user is authenticated', () => {
    beforeEach(() => {
      ;(authContext.useAuth as jest.Mock).mockReturnValue({
        user: mockUser,
        loading: false,
        error: null,
      })
    })

    it('should return Supabase data service for authenticated user', () => {
      const { result } = renderHook(() => useAuthDataService())

      expect(result.current.dataService).toBe(mockSupabaseDataService)
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.user).toBe(mockUser)
      expect(createSupabaseDataService).toHaveBeenCalledWith(mockUser.id)
    })

    it('should initialize data service only once', () => {
      const { rerender } = renderHook(() => useAuthDataService())

      rerender()
      rerender()

      expect(createSupabaseDataService).toHaveBeenCalledTimes(1)
    })

    it('should update when user changes', () => {
      const { result, rerender } = renderHook(() => useAuthDataService())

      expect(createSupabaseDataService).toHaveBeenCalledWith('user-123')

      // Change user
      const newUser = { ...mockUser, id: 'user-456', email: 'new@example.com' }
      ;(authContext.useAuth as jest.Mock).mockReturnValue({
        user: newUser,
        loading: false,
        error: null,
      })

      rerender()

      expect(createSupabaseDataService).toHaveBeenCalledWith('user-456')
      expect(result.current.user).toBe(newUser)
    })
  })

  describe('when user is not authenticated', () => {
    beforeEach(() => {
      ;(authContext.useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: false,
        error: null,
      })
    })

    it('should return localStorage data service for unauthenticated user', () => {
      const { result } = renderHook(() => useAuthDataService())

      expect(result.current.dataService).toBe(mockLocalStorageDataService)
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.user).toBe(null)
      expect(createLocalStorageDataService).toHaveBeenCalled()
    })
  })

  describe('during authentication loading', () => {
    beforeEach(() => {
      ;(authContext.useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: true,
        error: null,
      })
    })

    it('should return localStorage data service while loading', () => {
      const { result } = renderHook(() => useAuthDataService())

      expect(result.current.dataService).toBe(mockLocalStorageDataService)
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.user).toBe(null)
    })
  })

  describe('authentication state transitions', () => {
    it('should transition from localStorage to Supabase when user signs in', () => {
      // Start with no user
      const useAuthMock = jest.fn().mockReturnValue({
        user: null,
        loading: false,
        error: null,
      })
      ;(authContext.useAuth as jest.Mock).mockImplementation(useAuthMock)

      const { result, rerender } = renderHook(() => useAuthDataService())

      expect(result.current.dataService).toBe(mockLocalStorageDataService)
      expect(result.current.isAuthenticated).toBe(false)

      // User signs in
      useAuthMock.mockReturnValue({
        user: mockUser,
        loading: false,
        error: null,
      })

      rerender()

      expect(result.current.dataService).toBe(mockSupabaseDataService)
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.user).toBe(mockUser)
    })

    it('should transition from Supabase to localStorage when user signs out', () => {
      // Start with user
      const useAuthMock = jest.fn().mockReturnValue({
        user: mockUser,
        loading: false,
        error: null,
      })
      ;(authContext.useAuth as jest.Mock).mockImplementation(useAuthMock)

      const { result, rerender } = renderHook(() => useAuthDataService())

      expect(result.current.dataService).toBe(mockSupabaseDataService)
      expect(result.current.isAuthenticated).toBe(true)

      // User signs out
      useAuthMock.mockReturnValue({
        user: null,
        loading: false,
        error: null,
      })

      rerender()

      expect(result.current.dataService).toBe(mockLocalStorageDataService)
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.user).toBe(null)
    })
  })

  describe('service stability', () => {
    it('should maintain same service instance when user remains the same', () => {
      ;(authContext.useAuth as jest.Mock).mockReturnValue({
        user: mockUser,
        loading: false,
        error: null,
      })

      const { result, rerender } = renderHook(() => useAuthDataService())

      const firstService = result.current.dataService

      rerender()
      rerender()

      expect(result.current.dataService).toBe(firstService)
    })

    it('should handle service creation errors gracefully', () => {
      ;(createSupabaseDataService as jest.Mock).mockImplementation(() => {
        throw new Error('Failed to create service')
      })

      ;(authContext.useAuth as jest.Mock).mockReturnValue({
        user: mockUser,
        loading: false,
        error: null,
      })

      // Should fall back to localStorage service
      const { result } = renderHook(() => useAuthDataService())

      expect(result.current.dataService).toBe(mockLocalStorageDataService)
      expect(result.current.isAuthenticated).toBe(false)
    })
  })

  describe('data service method calls', () => {
    beforeEach(() => {
      ;(authContext.useAuth as jest.Mock).mockReturnValue({
        user: mockUser,
        loading: false,
        error: null,
      })
    })

    it('should proxy expense operations to the data service', async () => {
      const { result } = renderHook(() => useAuthDataService())

      // Test expense operations
      await result.current.dataService.expenses.getAll()
      expect(mockSupabaseDataService.expenses.getAll).toHaveBeenCalled()

      const mockExpense = {
        id: 'expense-1',
        description: 'Test expense',
        amount: 100,
        date: '2024-01-01',
        category: 'food',
        accountTypeId: 'cash',
        accountOwner: 'Fayim' as const,
      }

      await result.current.dataService.expenses.create(mockExpense)
      expect(mockSupabaseDataService.expenses.create).toHaveBeenCalledWith(mockExpense)
    })

    it('should proxy category operations to the data service', async () => {
      const { result } = renderHook(() => useAuthDataService())

      await result.current.dataService.categories.getAll()
      expect(mockSupabaseDataService.categories.getAll).toHaveBeenCalled()

      const mockCategory = {
        value: 'test-category',
        label: 'Test Category',
        icon: 'dollar-sign',
        color: '#000000',
      }

      await result.current.dataService.categories.create(mockCategory)
      expect(mockSupabaseDataService.categories.create).toHaveBeenCalledWith(mockCategory)
    })

    it('should proxy account operations to the data service', async () => {
      const { result } = renderHook(() => useAuthDataService())

      await result.current.dataService.accounts.getAll()
      expect(mockSupabaseDataService.accounts.getAll).toHaveBeenCalled()

      const mockAccount = {
        value: 'test-account',
        label: 'Test Account',
        icon: 'credit-card',
        owner: 'Fayim' as const,
      }

      await result.current.dataService.accounts.create(mockAccount)
      expect(mockSupabaseDataService.accounts.create).toHaveBeenCalledWith(mockAccount)
    })

    it('should proxy theme operations to the data service', async () => {
      const { result } = renderHook(() => useAuthDataService())

      await result.current.dataService.themes.getAll()
      expect(mockSupabaseDataService.themes.getAll).toHaveBeenCalled()

      const mockTheme = {
        name: 'Test Theme',
        primary: { h: 0, s: 0, l: 0 },
        background: { h: 0, s: 0, l: 100 },
        accent: { h: 180, s: 50, l: 50 },
        radius: 0.5,
      }

      await result.current.dataService.themes.create(mockTheme)
      expect(mockSupabaseDataService.themes.create).toHaveBeenCalledWith(mockTheme)
    })
  })
})
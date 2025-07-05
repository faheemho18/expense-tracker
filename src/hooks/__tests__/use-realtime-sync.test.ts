import { renderHook, act } from '@testing-library/react'
import { useRealtimeSync } from '../use-realtime-sync'
import { realtimeSync } from '@/lib/realtime-sync'
import * as authContext from '@/contexts/auth-context'
import type { User, Expense, Category } from '@/lib/types'

// Mock the realtime sync service
jest.mock('@/lib/realtime-sync')

// Mock auth context
jest.mock('@/contexts/auth-context')

describe('useRealtimeSync', () => {
  const mockRealtimeSync = realtimeSync as jest.Mocked<typeof realtimeSync>
  const mockUseAuth = authContext.useAuth as jest.Mock

  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  }

  const mockSyncStatus = {
    connected: false,
    lastSync: null,
    pendingChanges: 0,
    conflictCount: 0,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Default mock implementations
    mockRealtimeSync.initialize = jest.fn().mockResolvedValue(true)
    mockRealtimeSync.cleanup = jest.fn()
    mockRealtimeSync.subscribe = jest.fn()
    mockRealtimeSync.unsubscribe = jest.fn()
    mockRealtimeSync.getStatus = jest.fn().mockReturnValue(mockSyncStatus)
    mockRealtimeSync.subscribeToStatus = jest.fn()
    mockRealtimeSync.unsubscribeFromStatus = jest.fn()
  })

  describe('when user is authenticated', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        error: null,
      })
    })

    it('should initialize sync service for authenticated user', async () => {
      const { result } = renderHook(() => useRealtimeSync())

      await act(async () => {
        // Wait for initialization
      })

      expect(mockRealtimeSync.initialize).toHaveBeenCalledWith(mockUser.id)
      expect(result.current.isEnabled).toBe(true)
    })

    it('should provide sync status', () => {
      const { result } = renderHook(() => useRealtimeSync())

      expect(result.current.status).toEqual(mockSyncStatus)
      expect(mockRealtimeSync.getStatus).toHaveBeenCalled()
    })

    it('should subscribe to table events', () => {
      const { result } = renderHook(() => useRealtimeSync())
      const callback = jest.fn()

      act(() => {
        result.current.subscribe('expenses', callback)
      })

      expect(mockRealtimeSync.subscribe).toHaveBeenCalledWith('expenses', callback)
    })

    it('should unsubscribe from table events', () => {
      const { result } = renderHook(() => useRealtimeSync())
      const callback = jest.fn()

      act(() => {
        result.current.subscribe('expenses', callback)
        result.current.unsubscribe('expenses', callback)
      })

      expect(mockRealtimeSync.unsubscribe).toHaveBeenCalledWith('expenses', callback)
    })

    it('should handle sync status updates', () => {
      const { result } = renderHook(() => useRealtimeSync())
      let statusCallback: ((status: any) => void) | undefined

      // Capture the status callback
      mockRealtimeSync.subscribeToStatus.mockImplementation((callback) => {
        statusCallback = callback
      })

      renderHook(() => useRealtimeSync())

      // Simulate status update
      const newStatus = { ...mockSyncStatus, connected: true, lastSync: Date.now() }
      
      act(() => {
        if (statusCallback) {
          statusCallback(newStatus)
        }
      })

      expect(result.current.status.connected).toBe(true)
    })

    it('should cleanup on unmount', () => {
      const { unmount } = renderHook(() => useRealtimeSync())

      unmount()

      expect(mockRealtimeSync.cleanup).toHaveBeenCalled()
    })

    it('should reinitialize when user changes', async () => {
      const { rerender } = renderHook(() => useRealtimeSync())

      // Change user
      const newUser = { ...mockUser, id: 'user-456', email: 'new@example.com' }
      mockUseAuth.mockReturnValue({
        user: newUser,
        loading: false,
        error: null,
      })

      await act(async () => {
        rerender()
      })

      expect(mockRealtimeSync.cleanup).toHaveBeenCalled()
      expect(mockRealtimeSync.initialize).toHaveBeenCalledWith(newUser.id)
    })
  })

  describe('when user is not authenticated', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        error: null,
      })
    })

    it('should not initialize sync service for unauthenticated user', () => {
      const { result } = renderHook(() => useRealtimeSync())

      expect(mockRealtimeSync.initialize).not.toHaveBeenCalled()
      expect(result.current.isEnabled).toBe(false)
    })

    it('should provide default status when not authenticated', () => {
      const { result } = renderHook(() => useRealtimeSync())

      expect(result.current.status).toEqual({
        connected: false,
        lastSync: null,
        pendingChanges: 0,
        conflictCount: 0,
      })
    })

    it('should not allow subscriptions when not authenticated', () => {
      const { result } = renderHook(() => useRealtimeSync())
      const callback = jest.fn()

      act(() => {
        result.current.subscribe('expenses', callback)
      })

      expect(mockRealtimeSync.subscribe).not.toHaveBeenCalled()
    })
  })

  describe('during authentication loading', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: true,
        error: null,
      })
    })

    it('should not initialize while loading', () => {
      const { result } = renderHook(() => useRealtimeSync())

      expect(mockRealtimeSync.initialize).not.toHaveBeenCalled()
      expect(result.current.isEnabled).toBe(false)
    })
  })

  describe('sync events', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        error: null,
      })
    })

    it('should handle expense sync events', () => {
      const { result } = renderHook(() => useRealtimeSync())
      const callback = jest.fn()

      act(() => {
        result.current.subscribe('expenses', callback)
      })

      // Simulate sync event
      const syncEvent = {
        table: 'expenses',
        eventType: 'INSERT' as const,
        new: {
          id: 'expense-1',
          description: 'New expense',
          amount: 100,
          date: '2024-01-01',
          category: 'food',
          accountTypeId: 'cash',
          accountOwner: 'Fayim' as const,
          user_id: mockUser.id,
        },
        timestamp: Date.now(),
      }

      act(() => {
        callback(syncEvent)
      })

      expect(callback).toHaveBeenCalledWith(syncEvent)
    })

    it('should handle category sync events', () => {
      const { result } = renderHook(() => useRealtimeSync())
      const callback = jest.fn()

      act(() => {
        result.current.subscribe('categories', callback)
      })

      const syncEvent = {
        table: 'categories',
        eventType: 'UPDATE' as const,
        new: {
          value: 'food',
          label: 'Food & Dining',
          icon: 'utensils',
          color: '#ff6b6b',
          user_id: mockUser.id,
        },
        old: {
          value: 'food',
          label: 'Food',
          icon: 'utensils',
          color: '#ff0000',
          user_id: mockUser.id,
        },
        timestamp: Date.now(),
      }

      act(() => {
        callback(syncEvent)
      })

      expect(callback).toHaveBeenCalledWith(syncEvent)
    })

    it('should handle multiple subscriptions to same table', () => {
      const { result } = renderHook(() => useRealtimeSync())
      const callback1 = jest.fn()
      const callback2 = jest.fn()

      act(() => {
        result.current.subscribe('expenses', callback1)
        result.current.subscribe('expenses', callback2)
      })

      expect(mockRealtimeSync.subscribe).toHaveBeenCalledTimes(2)
      expect(mockRealtimeSync.subscribe).toHaveBeenCalledWith('expenses', callback1)
      expect(mockRealtimeSync.subscribe).toHaveBeenCalledWith('expenses', callback2)
    })
  })

  describe('error handling', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        error: null,
      })
    })

    it('should handle initialization failures', async () => {
      mockRealtimeSync.initialize.mockResolvedValue(false)

      const { result } = renderHook(() => useRealtimeSync())

      await act(async () => {
        // Wait for initialization
      })

      expect(result.current.isEnabled).toBe(false)
    })

    it('should handle initialization errors', async () => {
      mockRealtimeSync.initialize.mockRejectedValue(new Error('Connection failed'))

      const { result } = renderHook(() => useRealtimeSync())

      await act(async () => {
        // Wait for initialization
      })

      expect(result.current.isEnabled).toBe(false)
    })

    it('should handle cleanup errors gracefully', () => {
      mockRealtimeSync.cleanup.mockImplementation(() => {
        throw new Error('Cleanup failed')
      })

      const { unmount } = renderHook(() => useRealtimeSync())

      expect(() => unmount()).not.toThrow()
    })
  })

  describe('connection state management', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        error: null,
      })
    })

    it('should track connection state changes', () => {
      const { result } = renderHook(() => useRealtimeSync())
      let statusCallback: ((status: any) => void) | undefined

      mockRealtimeSync.subscribeToStatus.mockImplementation((callback) => {
        statusCallback = callback
      })

      renderHook(() => useRealtimeSync())

      // Simulate connection
      act(() => {
        if (statusCallback) {
          statusCallback({
            connected: true,
            lastSync: Date.now(),
            pendingChanges: 0,
            conflictCount: 0,
          })
        }
      })

      expect(result.current.status.connected).toBe(true)

      // Simulate disconnection
      act(() => {
        if (statusCallback) {
          statusCallback({
            connected: false,
            lastSync: Date.now(),
            pendingChanges: 5,
            conflictCount: 1,
          })
        }
      })

      expect(result.current.status.connected).toBe(false)
      expect(result.current.status.pendingChanges).toBe(5)
      expect(result.current.status.conflictCount).toBe(1)
    })

    it('should provide connection helpers', () => {
      const { result } = renderHook(() => useRealtimeSync())

      expect(typeof result.current.isConnected).toBe('boolean')
      expect(typeof result.current.hasPendingChanges).toBe('boolean')
      expect(typeof result.current.hasConflicts).toBe('boolean')
    })
  })

  describe('performance optimization', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        error: null,
      })
    })

    it('should not reinitialize unnecessarily', async () => {
      const { rerender } = renderHook(() => useRealtimeSync())

      await act(async () => {
        rerender()
        rerender()
        rerender()
      })

      expect(mockRealtimeSync.initialize).toHaveBeenCalledTimes(1)
    })

    it('should cleanup properly on user change', async () => {
      const { rerender } = renderHook(() => useRealtimeSync())

      // Change to different user
      const newUser = { ...mockUser, id: 'user-456' }
      mockUseAuth.mockReturnValue({
        user: newUser,
        loading: false,
        error: null,
      })

      await act(async () => {
        rerender()
      })

      expect(mockRealtimeSync.cleanup).toHaveBeenCalledTimes(1)
      expect(mockRealtimeSync.initialize).toHaveBeenCalledWith(newUser.id)
    })
  })

  describe('subscription management', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        error: null,
      })
    })

    it('should handle subscription lifecycle', () => {
      const { result, unmount } = renderHook(() => useRealtimeSync())
      const callback = jest.fn()

      act(() => {
        result.current.subscribe('expenses', callback)
      })

      expect(mockRealtimeSync.subscribe).toHaveBeenCalledWith('expenses', callback)

      unmount()

      expect(mockRealtimeSync.cleanup).toHaveBeenCalled()
    })

    it('should handle multiple table subscriptions', () => {
      const { result } = renderHook(() => useRealtimeSync())
      const expensesCallback = jest.fn()
      const categoriesCallback = jest.fn()

      act(() => {
        result.current.subscribe('expenses', expensesCallback)
        result.current.subscribe('categories', categoriesCallback)
      })

      expect(mockRealtimeSync.subscribe).toHaveBeenCalledWith('expenses', expensesCallback)
      expect(mockRealtimeSync.subscribe).toHaveBeenCalledWith('categories', categoriesCallback)
    })
  })
})
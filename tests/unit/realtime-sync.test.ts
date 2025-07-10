import { realtimeSync } from '@/lib/realtime-sync'
import { offlineQueue } from '@/lib/offline-queue'
import { connectivityManager } from '@/lib/connectivity-manager'
import { Expense, Category, Account } from '@/lib/types'

// Mock dependencies
jest.mock('@/lib/offline-queue')
jest.mock('@/lib/connectivity-manager')

const mockOfflineQueue = offlineQueue as jest.Mocked<typeof offlineQueue>
const mockConnectivityManager = connectivityManager as jest.Mocked<typeof connectivityManager>

// Mock Supabase with channel functionality
const mockChannel = {
  on: jest.fn(),
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
  send: jest.fn()
}

const mockSupabase = {
  from: jest.fn(),
  channel: jest.fn(() => mockChannel),
  removeChannel: jest.fn(),
  removeAllChannels: jest.fn()
}

jest.mock('@/lib/supabase', () => ({
  supabase: mockSupabase
}))

// Mock localStorage
const mockLocalStorage = {
  store: {} as Record<string, string>,
  getItem: jest.fn((key: string) => mockLocalStorage.store[key] || null),
  setItem: jest.fn((key: string, value: string) => {
    mockLocalStorage.store[key] = value
  }),
  removeItem: jest.fn((key: string) => {
    delete mockLocalStorage.store[key]
  }),
  clear: jest.fn(() => {
    mockLocalStorage.store = {}
  })
}

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
})

describe('Real-time Sync Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLocalStorage.clear()
    
    // Setup default mocks
    mockOfflineQueue.add.mockResolvedValue(undefined)
    mockConnectivityManager.canAttemptOperations.mockReturnValue(true)
    mockConnectivityManager.getStatus.mockReturnValue({
      isOnline: true,
      isDatabaseReachable: true,
      lastConnectivityCheck: Date.now()
    })
    
    // Reset channel mocks
    mockChannel.on.mockReturnValue(mockChannel)
    mockChannel.subscribe.mockReturnValue(mockChannel)
    mockChannel.unsubscribe.mockReturnValue(mockChannel)
    mockSupabase.channel.mockReturnValue(mockChannel)
  })

  afterEach(() => {
    realtimeSync.cleanup()
  })

  describe('Real-time Sync Integration', () => {
    test('should integrate with offline queue seamlessly', async () => {
      // Initialize real-time sync
      await realtimeSync.initialize()

      // Verify channels are set up
      expect(mockSupabase.channel).toHaveBeenCalledWith('expenses-changes')
      expect(mockSupabase.channel).toHaveBeenCalledWith('categories-changes')
      expect(mockSupabase.channel).toHaveBeenCalledWith('accounts-changes')

      // Verify event listeners are set up
      expect(mockChannel.on).toHaveBeenCalledWith('postgres_changes', 
        expect.objectContaining({
          event: '*',
          schema: 'public',
          table: 'expenses'
        }),
        expect.any(Function)
      )
    })

    test('should handle real-time INSERT events', async () => {
      await realtimeSync.initialize()

      // Get the callback for expenses changes
      const expensesCallback = mockChannel.on.mock.calls.find(
        call => call[1].table === 'expenses'
      )?.[2]

      expect(expensesCallback).toBeDefined()

      // Mock existing localStorage data
      const existingExpenses: Expense[] = [
        {
          id: 'exp-1',
          amount: 25.50,
          description: 'Existing Expense',
          categoryId: 'cat-1',
          accountId: 'acc-1',
          date: new Date().toISOString()
        }
      ]

      mockLocalStorage.store.expenses = JSON.stringify(existingExpenses)

      // Simulate INSERT event
      const insertEvent = {
        eventType: 'INSERT',
        new: {
          id: 'exp-2',
          amount: 40.00,
          description: 'New Remote Expense',
          categoryId: 'cat-2',
          accountId: 'acc-1',
          date: new Date().toISOString()
        },
        old: {},
        schema: 'public',
        table: 'expenses'
      }

      expensesCallback(insertEvent)

      // Allow time for async processing
      await new Promise(resolve => setTimeout(resolve, 100))

      // Should have updated localStorage
      const updatedExpenses = JSON.parse(mockLocalStorage.store.expenses)
      expect(updatedExpenses).toHaveLength(2)
      expect(updatedExpenses.find((e: Expense) => e.id === 'exp-2')).toBeTruthy()
    })

    test('should handle real-time UPDATE events', async () => {
      await realtimeSync.initialize()

      // Get the callback for expenses changes
      const expensesCallback = mockChannel.on.mock.calls.find(
        call => call[1].table === 'expenses'
      )?.[2]

      expect(expensesCallback).toBeDefined()

      // Mock existing localStorage data
      const existingExpenses: Expense[] = [
        {
          id: 'exp-1',
          amount: 25.50,
          description: 'Original Expense',
          categoryId: 'cat-1',
          accountId: 'acc-1',
          date: new Date().toISOString()
        }
      ]

      mockLocalStorage.store.expenses = JSON.stringify(existingExpenses)

      // Simulate UPDATE event
      const updateEvent = {
        eventType: 'UPDATE',
        new: {
          id: 'exp-1',
          amount: 30.00,
          description: 'Updated Remote Expense',
          categoryId: 'cat-1',
          accountId: 'acc-1',
          date: new Date().toISOString()
        },
        old: {
          id: 'exp-1',
          amount: 25.50,
          description: 'Original Expense',
          categoryId: 'cat-1',
          accountId: 'acc-1',
          date: new Date().toISOString()
        },
        schema: 'public',
        table: 'expenses'
      }

      expensesCallback(updateEvent)

      // Allow time for async processing
      await new Promise(resolve => setTimeout(resolve, 100))

      // Should have updated localStorage
      const updatedExpenses = JSON.parse(mockLocalStorage.store.expenses)
      expect(updatedExpenses).toHaveLength(1)
      expect(updatedExpenses[0].amount).toBe(30.00)
      expect(updatedExpenses[0].description).toBe('Updated Remote Expense')
    })

    test('should handle real-time DELETE events', async () => {
      await realtimeSync.initialize()

      // Get the callback for expenses changes
      const expensesCallback = mockChannel.on.mock.calls.find(
        call => call[1].table === 'expenses'
      )?.[2]

      expect(expensesCallback).toBeDefined()

      // Mock existing localStorage data
      const existingExpenses: Expense[] = [
        {
          id: 'exp-1',
          amount: 25.50,
          description: 'To Delete',
          categoryId: 'cat-1',
          accountId: 'acc-1',
          date: new Date().toISOString()
        },
        {
          id: 'exp-2',
          amount: 40.00,
          description: 'To Keep',
          categoryId: 'cat-2',
          accountId: 'acc-1',
          date: new Date().toISOString()
        }
      ]

      mockLocalStorage.store.expenses = JSON.stringify(existingExpenses)

      // Simulate DELETE event
      const deleteEvent = {
        eventType: 'DELETE',
        new: {},
        old: {
          id: 'exp-1',
          amount: 25.50,
          description: 'To Delete',
          categoryId: 'cat-1',
          accountId: 'acc-1',
          date: new Date().toISOString()
        },
        schema: 'public',
        table: 'expenses'
      }

      expensesCallback(deleteEvent)

      // Allow time for async processing
      await new Promise(resolve => setTimeout(resolve, 100))

      // Should have removed item from localStorage
      const updatedExpenses = JSON.parse(mockLocalStorage.store.expenses)
      expect(updatedExpenses).toHaveLength(1)
      expect(updatedExpenses[0].id).toBe('exp-2')
    })

    test('should handle category real-time changes', async () => {
      await realtimeSync.initialize()

      // Get the callback for categories changes
      const categoriesCallback = mockChannel.on.mock.calls.find(
        call => call[1].table === 'categories'
      )?.[2]

      expect(categoriesCallback).toBeDefined()

      // Mock existing localStorage data
      const existingCategories: Category[] = [
        {
          id: 'cat-1',
          name: 'Food',
          color: '#ff0000'
        }
      ]

      mockLocalStorage.store.categories = JSON.stringify(existingCategories)

      // Simulate INSERT event for new category
      const insertEvent = {
        eventType: 'INSERT',
        new: {
          id: 'cat-2',
          name: 'Transport',
          color: '#00ff00'
        },
        old: {},
        schema: 'public',
        table: 'categories'
      }

      categoriesCallback(insertEvent)

      // Allow time for async processing
      await new Promise(resolve => setTimeout(resolve, 100))

      // Should have updated localStorage
      const updatedCategories = JSON.parse(mockLocalStorage.store.categories)
      expect(updatedCategories).toHaveLength(2)
      expect(updatedCategories.find((c: Category) => c.id === 'cat-2')).toBeTruthy()
    })

    test('should handle account real-time changes', async () => {
      await realtimeSync.initialize()

      // Get the callback for accounts changes
      const accountsCallback = mockChannel.on.mock.calls.find(
        call => call[1].table === 'accounts'
      )?.[2]

      expect(accountsCallback).toBeDruthy()

      // Mock existing localStorage data
      const existingAccounts: Account[] = [
        {
          id: 'acc-1',
          name: 'Checking',
          type: 'checking',
          balance: 1000.00
        }
      ]

      mockLocalStorage.store.accounts = JSON.stringify(existingAccounts)

      // Simulate UPDATE event for account balance
      const updateEvent = {
        eventType: 'UPDATE',
        new: {
          id: 'acc-1',
          name: 'Checking',
          type: 'checking',
          balance: 950.00
        },
        old: {
          id: 'acc-1',
          name: 'Checking',
          type: 'checking',
          balance: 1000.00
        },
        schema: 'public',
        table: 'accounts'
      }

      accountsCallback(updateEvent)

      // Allow time for async processing
      await new Promise(resolve => setTimeout(resolve, 100))

      // Should have updated localStorage
      const updatedAccounts = JSON.parse(mockLocalStorage.store.accounts)
      expect(updatedAccounts[0].balance).toBe(950.00)
    })
  })

  describe('Connection Failures', () => {
    test('should handle connection failures gracefully', async () => {
      // Mock subscription failure
      mockChannel.subscribe.mockImplementation(() => {
        throw new Error('Connection failed')
      })

      // Should not throw error during initialization
      await expect(realtimeSync.initialize()).resolves.not.toThrow()

      // Should have attempted to subscribe
      expect(mockChannel.subscribe).toHaveBeenCalled()
    })

    test('should handle reconnection logic', async () => {
      await realtimeSync.initialize()

      // Mock connection loss
      mockConnectivityManager.canAttemptOperations.mockReturnValue(false)
      mockConnectivityManager.getStatus.mockReturnValue({
        isOnline: false,
        isDatabaseReachable: false,
        lastConnectivityCheck: Date.now()
      })

      // Simulate reconnection
      mockConnectivityManager.canAttemptOperations.mockReturnValue(true)
      mockConnectivityManager.getStatus.mockReturnValue({
        isOnline: true,
        isDatabaseReachable: true,
        lastConnectivityCheck: Date.now()
      })

      // Should handle reconnection gracefully
      await expect(realtimeSync.initialize()).resolves.not.toThrow()
    })

    test('should fallback to offline mode when real-time fails', async () => {
      // Mock channel creation failure
      mockSupabase.channel.mockImplementation(() => {
        throw new Error('Channel creation failed')
      })

      // Should not throw error
      await expect(realtimeSync.initialize()).resolves.not.toThrow()

      // Should have attempted to create channels
      expect(mockSupabase.channel).toHaveBeenCalled()
    })
  })

  describe('Data Loss Prevention', () => {
    test('should prevent data loss during network transitions', async () => {
      await realtimeSync.initialize()

      // Start with online state
      mockConnectivityManager.canAttemptOperations.mockReturnValue(true)

      // Mock existing data
      const existingExpenses: Expense[] = [
        {
          id: 'exp-1',
          amount: 25.50,
          description: 'Existing Expense',
          categoryId: 'cat-1',
          accountId: 'acc-1',
          date: new Date().toISOString()
        }
      ]

      mockLocalStorage.store.expenses = JSON.stringify(existingExpenses)

      // Simulate going offline
      mockConnectivityManager.canAttemptOperations.mockReturnValue(false)

      // Try to process a real-time event while offline
      const expensesCallback = mockChannel.on.mock.calls.find(
        call => call[1].table === 'expenses'
      )?.[2]

      const insertEvent = {
        eventType: 'INSERT',
        new: {
          id: 'exp-2',
          amount: 40.00,
          description: 'New Expense While Offline',
          categoryId: 'cat-2',
          accountId: 'acc-1',
          date: new Date().toISOString()
        },
        old: {},
        schema: 'public',
        table: 'expenses'
      }

      expensesCallback(insertEvent)

      // Allow time for processing
      await new Promise(resolve => setTimeout(resolve, 100))

      // Should have preserved existing data
      const preservedExpenses = JSON.parse(mockLocalStorage.store.expenses)
      expect(preservedExpenses).toHaveLength(1)
      expect(preservedExpenses[0].id).toBe('exp-1')

      // Should have queued the change for later processing
      expect(mockOfflineQueue.add).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'INSERT',
          table: 'expenses',
          data: expect.objectContaining({ id: 'exp-2' })
        })
      )
    })

    test('should handle concurrent modifications safely', async () => {
      await realtimeSync.initialize()

      // Mock existing data
      const existingExpenses: Expense[] = [
        {
          id: 'exp-1',
          amount: 25.50,
          description: 'Original',
          categoryId: 'cat-1',
          accountId: 'acc-1',
          date: new Date().toISOString()
        }
      ]

      mockLocalStorage.store.expenses = JSON.stringify(existingExpenses)

      // Simulate concurrent modifications
      const expensesCallback = mockChannel.on.mock.calls.find(
        call => call[1].table === 'expenses'
      )?.[2]

      // User 1 update
      const update1Event = {
        eventType: 'UPDATE',
        new: {
          id: 'exp-1',
          amount: 30.00,
          description: 'Updated by User 1',
          categoryId: 'cat-1',
          accountId: 'acc-1',
          date: new Date().toISOString()
        },
        old: existingExpenses[0],
        schema: 'public',
        table: 'expenses'
      }

      // User 2 update (slightly later)
      const update2Event = {
        eventType: 'UPDATE',
        new: {
          id: 'exp-1',
          amount: 35.00,
          description: 'Updated by User 2',
          categoryId: 'cat-1',
          accountId: 'acc-1',
          date: new Date().toISOString()
        },
        old: existingExpenses[0],
        schema: 'public',
        table: 'expenses'
      }

      // Process both updates
      expensesCallback(update1Event)
      await new Promise(resolve => setTimeout(resolve, 50))
      expensesCallback(update2Event)
      await new Promise(resolve => setTimeout(resolve, 50))

      // Should handle both updates
      const finalExpenses = JSON.parse(mockLocalStorage.store.expenses)
      expect(finalExpenses).toHaveLength(1)
      expect(finalExpenses[0].id).toBe('exp-1')
      // Last update should win
      expect(finalExpenses[0].amount).toBe(35.00)
      expect(finalExpenses[0].description).toBe('Updated by User 2')
    })

    test('should handle malformed real-time events gracefully', async () => {
      await realtimeSync.initialize()

      const expensesCallback = mockChannel.on.mock.calls.find(
        call => call[1].table === 'expenses'
      )?.[2]

      // Mock existing data
      const existingExpenses: Expense[] = [
        {
          id: 'exp-1',
          amount: 25.50,
          description: 'Existing',
          categoryId: 'cat-1',
          accountId: 'acc-1',
          date: new Date().toISOString()
        }
      ]

      mockLocalStorage.store.expenses = JSON.stringify(existingExpenses)

      // Simulate malformed event
      const malformedEvent = {
        eventType: 'UNKNOWN_EVENT',
        new: null,
        old: undefined,
        schema: 'public',
        table: 'expenses'
      }

      // Should not throw error
      expect(() => expensesCallback(malformedEvent)).not.toThrow()

      // Should preserve existing data
      const preservedExpenses = JSON.parse(mockLocalStorage.store.expenses)
      expect(preservedExpenses).toHaveLength(1)
      expect(preservedExpenses[0].id).toBe('exp-1')
    })
  })

  describe('Performance and Optimization', () => {
    test('should handle rapid real-time events efficiently', async () => {
      await realtimeSync.initialize()

      const expensesCallback = mockChannel.on.mock.calls.find(
        call => call[1].table === 'expenses'
      )?.[2]

      // Mock empty localStorage
      mockLocalStorage.store.expenses = JSON.stringify([])

      // Generate many rapid events
      const events = Array.from({ length: 100 }, (_, i) => ({
        eventType: 'INSERT',
        new: {
          id: `exp-${i}`,
          amount: i * 10,
          description: `Rapid Event ${i}`,
          categoryId: 'cat-1',
          accountId: 'acc-1',
          date: new Date().toISOString()
        },
        old: {},
        schema: 'public',
        table: 'expenses'
      }))

      // Process all events quickly
      const startTime = Date.now()
      events.forEach(event => expensesCallback(event))
      
      // Allow time for processing
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const processingTime = Date.now() - startTime

      // Should handle efficiently (under 1 second)
      expect(processingTime).toBeLessThan(1000)

      // Should have processed all events
      const finalExpenses = JSON.parse(mockLocalStorage.store.expenses)
      expect(finalExpenses).toHaveLength(100)
    })

    test('should batch localStorage updates efficiently', async () => {
      await realtimeSync.initialize()

      const expensesCallback = mockChannel.on.mock.calls.find(
        call => call[1].table === 'expenses'
      )?.[2]

      // Mock existing data
      const existingExpenses: Expense[] = [
        {
          id: 'exp-1',
          amount: 25.50,
          description: 'Original',
          categoryId: 'cat-1',
          accountId: 'acc-1',
          date: new Date().toISOString()
        }
      ]

      mockLocalStorage.store.expenses = JSON.stringify(existingExpenses)

      // Process multiple updates to same item
      const updates = [
        { amount: 30.00, description: 'Update 1' },
        { amount: 35.00, description: 'Update 2' },
        { amount: 40.00, description: 'Update 3' }
      ]

      updates.forEach((update, i) => {
        const updateEvent = {
          eventType: 'UPDATE',
          new: {
            id: 'exp-1',
            ...update,
            categoryId: 'cat-1',
            accountId: 'acc-1',
            date: new Date().toISOString()
          },
          old: existingExpenses[0],
          schema: 'public',
          table: 'expenses'
        }

        expensesCallback(updateEvent)
      })

      // Allow time for processing
      await new Promise(resolve => setTimeout(resolve, 200))

      // Should have final state
      const finalExpenses = JSON.parse(mockLocalStorage.store.expenses)
      expect(finalExpenses[0].amount).toBe(40.00)
      expect(finalExpenses[0].description).toBe('Update 3')
    })
  })

  describe('Auto-initialization and Cleanup', () => {
    test('should auto-initialize on startup', async () => {
      // Should initialize without manual call
      await realtimeSync.initialize()

      // Should have set up channels
      expect(mockSupabase.channel).toHaveBeenCalledTimes(3)
      expect(mockChannel.on).toHaveBeenCalledTimes(3)
      expect(mockChannel.subscribe).toHaveBeenCalledTimes(3)
    })

    test('should cleanup resources properly', async () => {
      await realtimeSync.initialize()

      // Verify initialization
      expect(mockSupabase.channel).toHaveBeenCalled()
      expect(mockChannel.subscribe).toHaveBeenCalled()

      // Cleanup
      realtimeSync.cleanup()

      // Should have cleaned up channels
      expect(mockChannel.unsubscribe).toHaveBeenCalled()
      expect(mockSupabase.removeAllChannels).toHaveBeenCalled()
    })

    test('should handle re-initialization after cleanup', async () => {
      await realtimeSync.initialize()
      realtimeSync.cleanup()

      // Should be able to re-initialize
      await expect(realtimeSync.initialize()).resolves.not.toThrow()

      // Should have set up channels again
      expect(mockSupabase.channel).toHaveBeenCalledTimes(6) // 3 initial + 3 re-init
    })
  })

  describe('Status Reporting', () => {
    test('should provide simple connection status', async () => {
      await realtimeSync.initialize()

      // Mock connected state
      mockConnectivityManager.getStatus.mockReturnValue({
        isOnline: true,
        isDatabaseReachable: true,
        lastConnectivityCheck: Date.now()
      })

      const status = realtimeSync.getStatus()
      expect(status).toHaveProperty('isConnected')
      expect(status).toHaveProperty('lastSync')
      expect(status.isConnected).toBe(true)
    })

    test('should handle status callbacks', async () => {
      const statusUpdates: any[] = []

      realtimeSync.onStatusChange((status) => {
        statusUpdates.push(status)
      })

      await realtimeSync.initialize()

      // Simulate status change
      mockConnectivityManager.getStatus.mockReturnValue({
        isOnline: false,
        isDatabaseReachable: false,
        lastConnectivityCheck: Date.now()
      })

      // Allow time for status update
      await new Promise(resolve => setTimeout(resolve, 100))

      // Should have received status updates
      expect(statusUpdates.length).toBeGreaterThan(0)
    })
  })
})
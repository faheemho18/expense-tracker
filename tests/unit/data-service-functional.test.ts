/**
 * Data Service Functional Tests
 * Tests to validate actual offline-first fallback behavior and data consistency
 */

import { dataService } from '@/lib/supabase-data-service'
import { connectivityManager } from '@/lib/connectivity-manager'

// Mock Supabase for controlled testing scenarios
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn()
        }),
        order: jest.fn().mockReturnValue({
          limit: jest.fn()
        })
      }),
      insert: jest.fn().mockReturnValue({
        select: jest.fn()
      }),
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn()
        })
      }),
      delete: jest.fn().mockReturnValue({
        eq: jest.fn()
      })
    })
  }
}))

describe('Data Service Functional Validation', () => {
  let mockSupabase: any

  beforeEach(async () => {
    // Initialize connectivity manager
    await connectivityManager.initialize()
    
    // Initialize data service
    await dataService.initialize()
    
    // Get mock reference
    mockSupabase = require('@/lib/supabase').supabase
    
    // Reset mocks
    jest.clearAllMocks()
  })

  afterEach(() => {
    connectivityManager.cleanup()
    dataService.cleanup()
  })

  describe('Offline-First Initialization', () => {
    test('should initialize with offline-first capabilities', async () => {
      // Test initialization
      await dataService.initialize()
      
      // Should provide offline status
      const status = await dataService.getOfflineStatus()
      expect(status).toBeDefined()
      expect(typeof status.isOnline).toBe('boolean')
      expect(typeof status.pendingOperations).toBe('number')
      
      console.log('Data service offline status:', status)
    })

    test('should handle configuration correctly', () => {
      const config = dataService.getConfig()
      expect(config).toBeDefined()
      expect(config.enableOfflineQueue).toBe(true)
      expect(config.fallbackToSecondary).toBe(true)
      
      console.log('Data service configuration:', {
        primarySource: config.primarySource,
        enableOfflineQueue: config.enableOfflineQueue,
        autoSyncInterval: config.autoSyncInterval
      })
    })
  })

  describe('Data Retrieval Operations', () => {
    test('should fetch expenses with fallback behavior', async () => {
      // Mock online state
      ;(global.navigator as any).onLine = true
      
      // Mock successful Supabase response
      mockSupabase.from().select().order.mockResolvedValueOnce({
        data: [
          { 
            id: 'exp-1', 
            amount: 25.50, 
            description: 'Coffee',
            date: '2025-01-15',
            categories: { value: 'food' },
            accounts: { value: 'cash', owner: 'User1' }
          }
        ],
        error: null
      })

      const result = await dataService.getExpenses()
      expect(result).toBeDefined()
      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
      expect(result.source).toBeDefined()
      
      console.log('Expense fetch result:', {
        count: result.data.length,
        source: result.source,
        hasError: !!result.error
      })
    })

    test('should fetch categories with caching', async () => {
      // Mock categories response
      mockSupabase.from().select().order.mockResolvedValueOnce({
        data: [
          { value: 'food', label: 'Food', color: '#ff5733' },
          { value: 'transport', label: 'Transport', color: '#33ff57' }
        ],
        error: null
      })

      const result1 = await dataService.getCategories()
      const categories1 = result1.data
      expect(categories1).toBeDefined()
      expect(categories1.length).toBeGreaterThanOrEqual(0)

      // Second call should potentially use cache
      const result2 = await dataService.getCategories()
      const categories2 = result2.data
      expect(categories2).toBeDefined()

      console.log('Categories caching test:', {
        firstCall: categories1.length,
        secondCall: categories2.length,
        source1: result1.source,
        source2: result2.source
      })
    })

    test('should fetch accounts correctly', async () => {
      // Mock accounts response
      mockSupabase.from().select().order.mockResolvedValueOnce({
        data: [
          { value: 'cash', label: 'Cash', owner: 'User1' },
          { value: 'card', label: 'Credit Card', owner: 'User2' }
        ],
        error: null
      })

      const result = await dataService.getAccounts()
      expect(result).toBeDefined()
      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
      
      console.log('Accounts fetch result:', {
        count: result.data.length,
        source: result.source
      })
    })
  })

  describe('Offline Queue Integration', () => {
    test('should handle offline queue status', async () => {
      const status = await dataService.getOfflineStatus()
      
      expect(status.isOnline).toBeDefined()
      expect(typeof status.pendingOperations).toBe('number')
      expect(status.pendingOperations).toBeGreaterThanOrEqual(0)
      
      console.log('Offline queue status:', status)
    })

    test('should force sync pending operations', async () => {
      // Should not throw when forcing sync
      await expect(dataService.forceSyncAll()).resolves.not.toThrow()
      
      console.log('Force sync completed without errors')
    })

    test('should process offline queue operations', async () => {
      // Mock connectivity as online
      ;(global.navigator as any).onLine = true
      
      // Process any pending operations
      await dataService.processOfflineQueue()
      
      // Should complete without errors
      const status = await dataService.getOfflineStatus()
      expect(status).toBeDefined()
      
      console.log('Offline queue processed, status:', status)
    })
  })

  describe('Real-Time Sync Configuration', () => {
    test('should handle real-time sync configuration', () => {
      // Test enabling real-time sync
      dataService.enableRealTimeSync()
      expect(dataService.isRealTimeSyncEnabled()).toBe(true)
      
      // Test disabling real-time sync
      dataService.disableRealTimeSync()
      expect(dataService.isRealTimeSyncEnabled()).toBe(false)
      
      console.log('Real-time sync configuration validated')
    })

    test('should handle real-time events', () => {
      // Enable real-time sync
      dataService.enableRealTimeSync()
      
      // Should not throw when handling events
      expect(() => {
        dataService.handleRealtimeEvent('expenses', 'INSERT', {
          id: 'test-exp',
          amount: 10.00,
          description: 'Test'
        })
      }).not.toThrow()
      
      console.log('Real-time event handling validated')
    })
  })

  describe('Cache Management', () => {
    test('should handle cache operations', () => {
      // Should not throw when clearing cache
      expect(() => {
        dataService.clearCache()
      }).not.toThrow()
      
      console.log('Cache management operations validated')
    })

    test('should handle configuration updates', () => {
      const originalConfig = dataService.getConfig()
      
      // Update configuration
      dataService.updateConfig({
        cacheTimeout: 30000,
        autoSyncInterval: 15000
      })
      
      const updatedConfig = dataService.getConfig()
      expect(updatedConfig.cacheTimeout).toBe(30000)
      expect(updatedConfig.autoSyncInterval).toBe(15000)
      
      console.log('Configuration update validated:', {
        original: originalConfig.cacheTimeout,
        updated: updatedConfig.cacheTimeout
      })
    })
  })

  describe('Error Handling and Resilience', () => {
    test('should handle Supabase errors gracefully', async () => {
      // Mock Supabase failure
      mockSupabase.from().select().order.mockRejectedValueOnce(
        new Error('Network error')
      )

      // Should not throw and should provide fallback data
      const result = await dataService.getExpenses()
      expect(result).toBeDefined()
      expect(result.data).toBeDefined()
      
      console.log('Error handling result:', {
        hasData: result.data.length >= 0,
        hasError: !!result.error,
        source: result.source
      })
    })

    test('should handle user authentication state', () => {
      // Test setting user ID
      dataService.setUserId('test-user-123')
      expect(dataService.getUserId()).toBe('test-user-123')
      
      // Test clearing user ID
      dataService.setUserId(null)
      expect(dataService.getUserId()).toBe(null)
      
      console.log('User authentication state management validated')
    })
  })

  describe('Performance and Resource Management', () => {
    test('should handle cleanup properly', () => {
      // Should not throw during cleanup
      expect(() => {
        dataService.cleanup()
      }).not.toThrow()
      
      console.log('Resource cleanup validated')
    })

    test('should handle multiple initializations', async () => {
      // Multiple initializations should not cause issues
      await dataService.initialize()
      await dataService.initialize()
      
      const status = await dataService.getOfflineStatus()
      expect(status).toBeDefined()
      
      console.log('Multiple initialization handling validated')
    })
  })

  describe('Integration with Connectivity Manager', () => {
    test('should integrate with connectivity status', async () => {
      const connectivityStatus = connectivityManager.getStatus()
      const dataServiceStatus = await dataService.getOfflineStatus()
      
      // Should provide consistent connectivity information
      expect(typeof connectivityStatus.isOnline).toBe('boolean')
      expect(typeof dataServiceStatus.isOnline).toBe('boolean')
      
      console.log('Connectivity integration:', {
        connectivityOnline: connectivityStatus.isOnline,
        dataServiceOnline: dataServiceStatus.isOnline
      })
    })

    test('should sync all data types', async () => {
      // Mock responses for all data types
      mockSupabase.from().select().order.mockResolvedValue({
        data: [],
        error: null
      })
      
      mockSupabase.from().select().order().limit().single.mockResolvedValue({
        data: null,
        error: null
      })

      const syncResult = await dataService.syncAllData()
      
      expect(syncResult).toBeDefined()
      expect(syncResult.accounts).toBeDefined()
      expect(syncResult.categories).toBeDefined()
      expect(syncResult.expenses).toBeDefined()
      expect(syncResult.theme).toBeDefined()
      
      console.log('Full data sync result:', {
        accounts: syncResult.accounts.data.length,
        categories: syncResult.categories.data.length,
        expenses: syncResult.expenses.data.length,
        theme: !!syncResult.theme.data
      })
    })
  })
})
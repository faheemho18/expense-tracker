/**
 * Data Service Simple Functional Test
 * Basic validation of data service offline-first capabilities
 */

import { dataService } from '@/lib/supabase-data-service'

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        order: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: null })
          })
        })
      })
    })
  }
}))

describe('Data Service Basic Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    dataService.cleanup()
  })

  test('should provide configuration', () => {
    const config = dataService.getConfig()
    
    expect(config).toBeDefined()
    expect(config.enableOfflineQueue).toBe(true)
    expect(config.primarySource).toBe('localStorage')
    expect(config.fallbackToSecondary).toBe(true)
    
    console.log('Data service configuration validated:', {
      enableOfflineQueue: config.enableOfflineQueue,
      primarySource: config.primarySource,
      fallbackToSecondary: config.fallbackToSecondary
    })
  })

  test('should handle user ID management', () => {
    // Test setting user ID
    dataService.setUserId('test-user-123')
    expect(dataService.getUserId()).toBe('test-user-123')
    
    // Test clearing user ID
    dataService.setUserId(null)
    expect(dataService.getUserId()).toBe(null)
    
    console.log('User ID management validated')
  })

  test('should handle real-time sync configuration', () => {
    // Test enabling real-time sync
    dataService.enableRealTimeSync()
    expect(dataService.isRealTimeSyncEnabled()).toBe(true)
    
    // Test disabling real-time sync
    dataService.disableRealTimeSync()
    expect(dataService.isRealTimeSyncEnabled()).toBe(false)
    
    console.log('Real-time sync configuration validated')
  })

  test('should handle cache operations', () => {
    // Should not throw when clearing cache
    expect(() => {
      dataService.clearCache()
    }).not.toThrow()
    
    console.log('Cache operations validated')
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
    
    console.log('Configuration update validated')
  })

  test('should handle cleanup', () => {
    // Should not throw during cleanup
    expect(() => {
      dataService.cleanup()
    }).not.toThrow()
    
    console.log('Cleanup validated')
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
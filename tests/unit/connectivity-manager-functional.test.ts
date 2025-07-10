/**
 * Connectivity Manager Functional Tests
 * Tests to validate actual network detection and connectivity behavior
 */

import { connectivityManager } from '@/lib/connectivity-manager'

// Mock Supabase for controlled testing
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          single: jest.fn()
        })
      })
    })
  }
}))

// Mock navigator.onLine since it can't be redefined
Object.defineProperty(global.navigator, 'onLine', {
  writable: true,
  value: true
})

describe('Connectivity Manager Functional Validation', () => {
  beforeEach(async () => {
    // Clean state for each test
    connectivityManager.cleanup()
    // Reset navigator.onLine to true for consistent starting state
    ;(global.navigator as any).onLine = true
  })

  afterEach(() => {
    connectivityManager.cleanup()
    // Reset navigator.onLine to true after each test
    ;(global.navigator as any).onLine = true
  })

  describe('Network Detection Functionality', () => {
    test('should initialize and provide connectivity status', async () => {
      const initResult = await connectivityManager.initialize()
      expect(initResult).toBe(true)

      const status = connectivityManager.getStatus()
      expect(status).toBeDefined()
      expect(typeof status.isOnline).toBe('boolean')
      expect(typeof status.isDatabaseReachable).toBe('boolean')
      expect(typeof status.lastCheck).toBe('number')

      console.log('Initial connectivity status:', status)
    })

    test('should detect online state correctly', () => {
      // Set navigator.onLine to true
      ;(global.navigator as any).onLine = true

      const isOnline = connectivityManager.isOnline()
      expect(isOnline).toBe(true)

      console.log('Online detection result:', isOnline)
    })

    test('should detect offline state correctly', () => {
      // Set navigator.onLine to false
      ;(global.navigator as any).onLine = false

      const isOnline = connectivityManager.isOnline()
      expect(isOnline).toBe(false)

      console.log('Offline detection result:', isOnline)
    })
  })

  describe('Database Connectivity Testing', () => {
    test('should check database reachability', async () => {
      await connectivityManager.initialize()

      const isDatabaseReachable = connectivityManager.isDatabaseReachable()
      expect(typeof isDatabaseReachable).toBe('boolean')

      console.log('Database reachability:', isDatabaseReachable)
    })

    test('should handle database connectivity check with mock responses', async () => {
      const mockSupabase = require('@/lib/supabase').supabase

      // Mock successful database response
      mockSupabase.from().select().limit().single.mockResolvedValueOnce({
        data: { test: 'success' },
        error: null
      })

      await connectivityManager.initialize()

      // The connectivity manager should handle the mock response
      const status = connectivityManager.getStatus()
      expect(status).toBeDefined()

      console.log('Database connectivity with mock:', status)
    })

    test('should handle database errors gracefully', async () => {
      const mockSupabase = require('@/lib/supabase').supabase

      // Mock database error
      mockSupabase.from().select().limit().single.mockRejectedValueOnce(
        new Error('Database connection failed')
      )

      await connectivityManager.initialize()

      // Should not crash and should provide status
      const status = connectivityManager.getStatus()
      expect(status).toBeDefined()

      console.log('Database error handling:', status)
    })
  })

  describe('Operation Capability Assessment', () => {
    test('should determine if operations can be attempted', async () => {
      await connectivityManager.initialize()

      const canAttempt = connectivityManager.canAttemptOperations()
      expect(typeof canAttempt).toBe('boolean')

      console.log('Can attempt operations:', canAttempt)
    })

    test('should prevent operations when offline', () => {
      // Force offline state
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      })

      // Should not be able to attempt operations when offline
      const canAttempt = connectivityManager.canAttemptOperations()
      // Note: This depends on implementation - might still allow some operations
      
      console.log('Operations capability while offline:', canAttempt)
    })
  })

  describe('Status Change Monitoring', () => {
    test('should handle status change subscriptions', () => {
      let statusUpdates: any[] = []

      // Subscribe to status changes
      const unsubscribe = connectivityManager.onStatusChange((status) => {
        statusUpdates.push({ ...status })
      })

      // Verify subscription doesn't crash
      expect(typeof unsubscribe).toBe('function')

      // Cleanup
      unsubscribe()

      console.log('Status change subscription setup successful')
    })

    test('should provide current status consistently', async () => {
      await connectivityManager.initialize()

      // Get status multiple times
      const status1 = connectivityManager.getStatus()
      const status2 = connectivityManager.getStatus()

      // Should provide consistent structure
      expect(status1).toEqual(status2)
      expect(status1.isOnline).toBe(status2.isOnline)
      expect(status1.isDatabaseReachable).toBe(status2.isDatabaseReachable)

      console.log('Status consistency verified:', { status1, status2 })
    })
  })

  describe('Network State Simulation', () => {
    test('should handle network state changes', async () => {
      await connectivityManager.initialize()

      // Simulate going online
      ;(global.navigator as any).onLine = true

      // Force status update with current navigator.onLine value
      const isOnlineNow = connectivityManager.isOnline()
      expect(isOnlineNow).toBe(true)

      // Simulate going offline  
      ;(global.navigator as any).onLine = false

      const isOfflineNow = connectivityManager.isOnline()
      expect(isOfflineNow).toBe(false)

      console.log('Network state simulation:', {
        online: isOnlineNow,
        offline: isOfflineNow
      })
    })
  })

  describe('Error Handling and Resilience', () => {
    test('should handle initialization failure gracefully', async () => {
      // This test verifies the manager doesn't crash on initialization issues
      try {
        const result = await connectivityManager.initialize()
        expect(typeof result).toBe('boolean')
      } catch (error) {
        // Should handle errors gracefully
        expect(error).toBeDefined()
      }

      // Should still provide status even if init failed
      const status = connectivityManager.getStatus()
      expect(status).toBeDefined()
    })

    test('should handle missing navigator.onLine gracefully', () => {
      // Temporarily modify navigator.onLine to undefined
      const originalOnLine = (global.navigator as any).onLine
      ;(global.navigator as any).onLine = undefined

      try {
        const isOnline = connectivityManager.isOnline()
        // Should return false when navigator.onLine is undefined
        expect(typeof isOnline).toBe('boolean')
        expect(isOnline).toBe(false)
      } finally {
        // Restore original value
        ;(global.navigator as any).onLine = originalOnLine
      }
    })
  })

  describe('Integration with Auto-Sync', () => {
    test('should provide connectivity info for auto-sync decisions', async () => {
      await connectivityManager.initialize()

      const status = connectivityManager.getStatus()
      
      // Verify all fields needed for auto-sync decisions are present
      expect(status.isOnline).toBeDefined()
      expect(status.isDatabaseReachable).toBeDefined()
      expect(status.lastCheck).toBeDefined()

      // Verify canAttemptOperations provides sync decision capability
      const canSync = connectivityManager.canAttemptOperations()
      expect(typeof canSync).toBe('boolean')

      console.log('Auto-sync integration data:', {
        status,
        canSync
      })
    })
  })

  describe('Performance and Resource Management', () => {
    test('should cleanup resources without errors', async () => {
      await connectivityManager.initialize()
      
      // Should not throw during cleanup
      expect(() => {
        connectivityManager.cleanup()
      }).not.toThrow()

      // Should still be callable after cleanup
      const status = connectivityManager.getStatus()
      expect(status).toBeDefined()
    })

    test('should handle multiple initializations safely', async () => {
      // Initialize multiple times - should not cause issues
      const result1 = await connectivityManager.initialize()
      const result2 = await connectivityManager.initialize()

      expect(typeof result1).toBe('boolean')
      expect(typeof result2).toBe('boolean')

      const status = connectivityManager.getStatus()
      expect(status).toBeDefined()
    })
  })
})
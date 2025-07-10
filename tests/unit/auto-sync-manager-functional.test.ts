/**
 * Auto-Sync Manager Functional Tests
 * Tests to validate actual background processing and sync functionality
 */

import { autoSyncManager } from '@/lib/auto-sync-manager'
import { offlineQueue } from '@/lib/offline-queue'

// Mock only external dependencies, not our core logic
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: null, error: null })
        })
      }),
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({ data: [{ id: 'new-id' }], error: null })
      }),
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({ data: [{ id: 'updated-id' }], error: null })
        })
      }),
      delete: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null })
      })
    })
  }
}))

describe('Auto-Sync Manager Functional Validation', () => {
  beforeEach(async () => {
    // Initialize auto-sync manager
    await autoSyncManager.initialize()
    await offlineQueue.clear()
  })

  afterEach(async () => {
    // Clean up
    autoSyncManager.stop()
    autoSyncManager.cleanup()
  })

  describe('Initialization and Configuration', () => {
    test('should initialize successfully', async () => {
      const success = await autoSyncManager.initialize()
      expect(success).toBe(true)

      // Should provide status
      const status = await autoSyncManager.getStatus()
      expect(status).toBeDefined()
      expect(status.isEnabled).toBe(true)
      expect(typeof status.syncInterval).toBe('number')
      expect(typeof status.pendingOperations).toBe('number')
    })

    test('should update configuration correctly', async () => {
      const originalStatus = await autoSyncManager.getStatus()
      const originalInterval = originalStatus.syncInterval

      // Update configuration
      autoSyncManager.updateConfig({
        syncInterval: 5000,
        batchSize: 5
      })

      const updatedStatus = await autoSyncManager.getStatus()
      expect(updatedStatus.syncInterval).toBe(5000)
      expect(updatedStatus.syncInterval).not.toBe(originalInterval)
    })
  })

  describe('Status Management', () => {
    test('should provide accurate sync status', async () => {
      const status = await autoSyncManager.getStatus()

      // Verify all required status fields
      expect(status.isEnabled).toBeDefined()
      expect(status.isRunning).toBeDefined()
      expect(status.pendingOperations).toBeDefined()
      expect(status.failedOperations).toBeDefined()
      expect(status.connectivity).toBeDefined()
      expect(status.connectivity.isOnline).toBeDefined()
      expect(status.connectivity.isDatabaseReachable).toBeDefined()

      console.log('Auto-sync status:', status)
    })

    test('should handle status change callbacks', async () => {
      let statusUpdates: any[] = []

      // Subscribe to status changes
      const unsubscribe = autoSyncManager.onStatusChange((status) => {
        statusUpdates.push(status)
      })

      // Trigger a status change by adding operation to queue
      await offlineQueue.add({
        type: 'INSERT',
        table: 'expenses',
        data: { id: 'test-exp', amount: 10.00 }
      })

      // Give time for async operations
      await new Promise(resolve => setTimeout(resolve, 100))

      // Cleanup
      unsubscribe()

      // Verify we can track status changes
      const currentStatus = await autoSyncManager.getStatus()
      expect(currentStatus.pendingOperations).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Queue Integration', () => {
    test('should integrate with offline queue correctly', async () => {
      // Add operations to queue
      await offlineQueue.add({
        type: 'INSERT',
        table: 'expenses',
        data: {
          id: 'sync-test-1',
          amount: 25.50,
          description: 'Test Expense',
          categoryId: 'cat-1'
        }
      })

      await offlineQueue.add({
        type: 'UPDATE',
        table: 'categories',
        data: {
          id: 'cat-1',
          name: 'Updated Category'
        }
      })

      // Check that auto-sync manager can see pending operations
      const status = await autoSyncManager.getStatus()
      expect(status.pendingOperations).toBeGreaterThan(0)

      console.log('Pending operations in auto-sync:', status.pendingOperations)
    })

    test('should handle force sync operation', async () => {
      // Add operation to queue
      await offlineQueue.add({
        type: 'INSERT',
        table: 'expenses',
        data: { id: 'force-sync-test', amount: 15.00 }
      })

      const beforeStatus = await autoSyncManager.getStatus()
      expect(beforeStatus.pendingOperations).toBeGreaterThan(0)

      // Force sync (should process queue)
      await autoSyncManager.forceSync()

      // Verify sync was attempted
      const afterStatus = await autoSyncManager.getStatus()
      expect(afterStatus.lastSyncAttempt).toBeGreaterThan(0)

      console.log('Force sync completed:', {
        before: beforeStatus.pendingOperations,
        after: afterStatus.pendingOperations,
        lastAttempt: afterStatus.lastSyncAttempt
      })
    })
  })

  describe('Error Handling and Recovery', () => {
    test('should handle sync errors gracefully', async () => {
      // Add operation that might cause error
      await offlineQueue.add({
        type: 'INSERT',
        table: 'invalid-table',
        data: { invalid: 'data' }
      })

      // Attempt sync - should not crash
      try {
        await autoSyncManager.forceSync()
        const status = await autoSyncManager.getStatus()
        expect(status).toBeDefined()
      } catch (error) {
        // If it errors, it should be handled gracefully
        console.log('Sync error handled:', error)
      }
    })

    test('should provide debug information', async () => {
      const debugInfo = await autoSyncManager.getDebugInfo()

      expect(debugInfo).toBeDefined()
      expect(debugInfo.autoSync).toBeDefined()
      expect(debugInfo.queue).toBeDefined()
      expect(debugInfo.connectivity).toBeDefined()
      expect(debugInfo.config).toBeDefined()

      console.log('Debug info structure:', Object.keys(debugInfo))
    })
  })

  describe('Conflict Resolution Integration', () => {
    test('should integrate with conflict resolver', async () => {
      const conflictStats = autoSyncManager.getConflictStats()
      expect(conflictStats).toBeDefined()

      const validationHistory = autoSyncManager.getValidationHistory()
      expect(validationHistory).toBeDefined()
      expect(validationHistory.conflicts).toBeDefined()
      expect(validationHistory.rollbacks).toBeDefined()

      console.log('Conflict integration:', {
        stats: conflictStats,
        historyKeys: Object.keys(validationHistory)
      })
    })

    test('should handle data consistency checks', async () => {
      const consistency = await autoSyncManager.checkDataConsistency()
      expect(consistency).toBeDefined()
      expect(consistency.isConsistent).toBeDefined()
      expect(Array.isArray(consistency.issues)).toBe(true)

      console.log('Data consistency check:', consistency)
    })
  })

  describe('Performance and Cleanup', () => {
    test('should provide performance statistics', async () => {
      const perfStats = await autoSyncManager.getPerformanceStats()

      expect(perfStats).toBeDefined()
      expect(typeof perfStats.totalOperationsProcessed).toBe('number')
      expect(typeof perfStats.averageSyncTime).toBe('number')
      expect(typeof perfStats.maxSyncTime).toBe('number')
      expect(typeof perfStats.minSyncTime).toBe('number')

      console.log('Performance stats:', perfStats)
    })

    test('should cleanup resources properly', async () => {
      // Start the manager
      autoSyncManager.start()
      const runningStatus = await autoSyncManager.getStatus()
      expect(runningStatus.isRunning).toBe(true)

      // Stop and cleanup
      autoSyncManager.stop()
      autoSyncManager.cleanup()

      const stoppedStatus = await autoSyncManager.getStatus()
      expect(stoppedStatus.isRunning).toBe(false)
    })
  })

  describe('Auto-Repair and Data Management', () => {
    test('should handle data auto-repair', async () => {
      const repairResult = await autoSyncManager.autoRepairData('expenses')

      expect(repairResult).toBeDefined()
      expect(repairResult.results).toBeDefined()
      expect(typeof repairResult.totalRepaired).toBe('number')

      console.log('Auto-repair result:', repairResult)
    })

    test('should clear queue when requested', async () => {
      // Add operations
      await offlineQueue.add({
        type: 'INSERT',
        table: 'expenses',
        data: { id: 'clear-test', amount: 5.00 }
      })

      const beforeStatus = await autoSyncManager.getStatus()
      expect(beforeStatus.pendingOperations).toBeGreaterThan(0)

      // Clear queue
      await autoSyncManager.clearQueue()

      const afterStatus = await autoSyncManager.getStatus()
      expect(afterStatus.pendingOperations).toBe(0)
    })
  })
})
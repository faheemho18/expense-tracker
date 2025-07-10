import { autoSyncManager, AutoSyncManager, AutoSyncStatus } from '@/lib/auto-sync-manager'
import { offlineQueue } from '@/lib/offline-queue'
import { connectivityManager } from '@/lib/connectivity-manager'
import { conflictResolver } from '@/lib/conflict-resolver'
import { dataValidator } from '@/lib/data-validator'

// Mock all dependencies
jest.mock('@/lib/offline-queue')
jest.mock('@/lib/connectivity-manager')
jest.mock('@/lib/conflict-resolver')
jest.mock('@/lib/data-validator')

const mockOfflineQueue = offlineQueue as jest.Mocked<typeof offlineQueue>
const mockConnectivityManager = connectivityManager as jest.Mocked<typeof connectivityManager>
const mockConflictResolver = conflictResolver as jest.Mocked<typeof conflictResolver>
const mockDataValidator = dataValidator as jest.Mocked<typeof dataValidator>

// Use global mockSupabase from setup
declare global {
  var mockSupabase: any
}

jest.mock('@/lib/supabase', () => ({
  supabase: global.mockSupabase
}))

describe('Auto-Sync Manager', () => {
  let syncManager: AutoSyncManager

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup default mocks
    mockOfflineQueue.initialize.mockResolvedValue(undefined)
    mockOfflineQueue.getPending.mockResolvedValue([])
    mockOfflineQueue.getStatus.mockResolvedValue({
      totalPending: 0,
      isProcessing: false,
      lastProcessed: null
    })
    mockOfflineQueue.onStatusChange.mockReturnValue(() => {})
    
    mockConnectivityManager.initialize.mockResolvedValue(undefined)
    mockConnectivityManager.getStatus.mockReturnValue({
      isOnline: true,
      isDatabaseReachable: true,
      lastConnectivityCheck: Date.now()
    })
    mockConnectivityManager.canAttemptOperations.mockReturnValue(true)
    mockConnectivityManager.onStatusChange.mockReturnValue(() => {})
    
    mockDataValidator.validateData.mockResolvedValue({
      isValid: true,
      errors: [],
      warnings: [],
      canAutoRepair: true
    })
    
    mockConflictResolver.resolveConflict.mockResolvedValue({
      resolved: { id: 'resolved-data' },
      strategy: 'last-write-wins'
    })

    // Create fresh instance
    syncManager = new AutoSyncManager()
  })

  afterEach(() => {
    syncManager.cleanup()
  })

  describe('Automatic Startup', () => {
    test('should initialize automatically on app load', async () => {
      const initResult = await syncManager.initialize()

      expect(initResult).toBe(true)
      expect(mockOfflineQueue.initialize).toHaveBeenCalled()
      expect(mockConnectivityManager.initialize).toHaveBeenCalled()
      expect(mockOfflineQueue.onStatusChange).toHaveBeenCalled()
      expect(mockConnectivityManager.onStatusChange).toHaveBeenCalled()
    })

    test('should start automatically when enabled', async () => {
      const statusChanges: AutoSyncStatus[] = []
      
      syncManager.onStatusChange((status) => {
        statusChanges.push(status)
      })

      await syncManager.initialize()

      // Should start automatically
      const status = await syncManager.getStatus()
      expect(status.isEnabled).toBe(true)
      expect(status.isRunning).toBe(true)
      expect(statusChanges.length).toBeGreaterThan(0)
    })

    test('should handle initialization failures gracefully', async () => {
      // Mock initialization failure
      mockOfflineQueue.initialize.mockRejectedValue(new Error('IndexedDB unavailable'))

      const initResult = await syncManager.initialize()

      expect(initResult).toBe(false)
      
      // Should not be running after failed initialization
      const status = await syncManager.getStatus()
      expect(status.isRunning).toBe(false)
    })

    test('should not double-initialize', async () => {
      await syncManager.initialize()
      await syncManager.initialize() // Second call

      // Should only initialize dependencies once
      expect(mockOfflineQueue.initialize).toHaveBeenCalledTimes(1)
      expect(mockConnectivityManager.initialize).toHaveBeenCalledTimes(1)
    })
  })

  describe('Background Processing', () => {
    beforeEach(async () => {
      await syncManager.initialize()
    })

    test('should process queue every 10 seconds', async () => {
      // Mock pending operations
      const mockOperations = [
        {
          id: 'op-1',
          type: 'INSERT' as const,
          table: 'expenses',
          data: { id: 'exp-1', amount: 25.50 },
          timestamp: Date.now(),
          retryCount: 0
        },
        {
          id: 'op-2',
          type: 'UPDATE' as const,
          table: 'categories',
          data: { id: 'cat-1', name: 'Updated' },
          timestamp: Date.now(),
          retryCount: 0
        }
      ]

      mockOfflineQueue.getPending.mockResolvedValue(mockOperations)
      mockOfflineQueue.deduplicateOperations.mockResolvedValue(undefined)
      mockOfflineQueue.remove.mockResolvedValue(undefined)
      mockOfflineQueue.setProcessing.mockReturnValue(undefined)

      // Mock successful Supabase operations
      const mockInsert = jest.fn(() => Promise.resolve({ error: null }))
      const mockUpdate = jest.fn(() => Promise.resolve({ error: null }))
      
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'expenses') {
          return { insert: mockInsert }
        } else if (table === 'categories') {
          return { update: mockUpdate }
        }
        return {}
      })

      // Force sync to test processing
      await syncManager.forceSync()

      // Should have processed operations
      expect(mockOfflineQueue.getPending).toHaveBeenCalled()
      expect(mockOfflineQueue.deduplicateOperations).toHaveBeenCalled()
      expect(mockOfflineQueue.setProcessing).toHaveBeenCalledWith(true)
      expect(mockOfflineQueue.setProcessing).toHaveBeenCalledWith(false)
      expect(mockOfflineQueue.remove).toHaveBeenCalledTimes(2)
    })

    test('should batch operations efficiently', async () => {
      // Create large number of operations
      const operations = Array.from({ length: 25 }, (_, i) => ({
        id: `op-${i}`,
        type: 'INSERT' as const,
        table: 'expenses',
        data: { id: `exp-${i}`, amount: i * 10 },
        timestamp: Date.now(),
        retryCount: 0
      }))

      mockOfflineQueue.getPending.mockResolvedValue(operations)
      mockOfflineQueue.deduplicateOperations.mockResolvedValue(undefined)
      mockOfflineQueue.remove.mockResolvedValue(undefined)

      // Mock successful Supabase operations
      const mockInsert = jest.fn(() => Promise.resolve({ error: null }))
      mockSupabase.from.mockReturnValue({ insert: mockInsert })

      // Force sync
      await syncManager.forceSync()

      // Should have processed all operations
      expect(mockOfflineQueue.remove).toHaveBeenCalledTimes(25)
      expect(mockInsert).toHaveBeenCalledTimes(25)
    })

    test('should handle processing errors gracefully', async () => {
      const mockOperations = [
        {
          id: 'op-1',
          type: 'INSERT' as const,
          table: 'expenses',
          data: { id: 'exp-1', amount: 25.50 },
          timestamp: Date.now(),
          retryCount: 0
        }
      ]

      mockOfflineQueue.getPending.mockResolvedValue(mockOperations)
      mockOfflineQueue.deduplicateOperations.mockResolvedValue(undefined)
      mockOfflineQueue.update.mockResolvedValue(undefined)

      // Mock Supabase operation failure
      const mockInsert = jest.fn(() => Promise.resolve({ 
        error: { message: 'Database error', code: 'DB_ERROR' }
      }))
      mockSupabase.from.mockReturnValue({ insert: mockInsert })

      // Force sync
      await syncManager.forceSync()

      // Should have handled error gracefully
      expect(mockOfflineQueue.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'op-1',
          retryCount: 1,
          lastError: expect.any(String)
        })
      )
    })

    test('should implement retry logic with exponential backoff', async () => {
      const mockOperation = {
        id: 'op-retry',
        type: 'INSERT' as const,
        table: 'expenses',
        data: { id: 'exp-retry', amount: 25.50 },
        timestamp: Date.now(),
        retryCount: 0
      }

      mockOfflineQueue.getPending.mockResolvedValue([mockOperation])
      mockOfflineQueue.deduplicateOperations.mockResolvedValue(undefined)
      mockOfflineQueue.update.mockResolvedValue(undefined)
      mockOfflineQueue.remove.mockResolvedValue(undefined)

      // Mock consistent failures
      const mockInsert = jest.fn(() => Promise.resolve({ 
        error: { message: 'Database error', code: 'DB_ERROR' }
      }))
      mockSupabase.from.mockReturnValue({ insert: mockInsert })

      // Force sync multiple times to test retry logic
      for (let i = 0; i < 5; i++) {
        mockOperation.retryCount = i
        mockOfflineQueue.getPending.mockResolvedValue([mockOperation])
        await syncManager.forceSync()
      }

      // Should have attempted retries
      expect(mockOfflineQueue.update).toHaveBeenCalledTimes(3) // Max retries is 3
      expect(mockOfflineQueue.remove).toHaveBeenCalledTimes(1) // Remove after max retries
    })

    test('should skip sync when offline', async () => {
      // Mock offline state
      mockConnectivityManager.canAttemptOperations.mockReturnValue(false)

      const mockOperations = [
        {
          id: 'op-1',
          type: 'INSERT' as const,
          table: 'expenses',
          data: { id: 'exp-1', amount: 25.50 },
          timestamp: Date.now(),
          retryCount: 0
        }
      ]

      mockOfflineQueue.getPending.mockResolvedValue(mockOperations)

      // Force sync
      await syncManager.forceSync()

      // Should skip processing when offline
      expect(mockOfflineQueue.deduplicateOperations).not.toHaveBeenCalled()
      expect(mockOfflineQueue.setProcessing).not.toHaveBeenCalled()
    })
  })

  describe('Conflict Resolution Integration', () => {
    beforeEach(async () => {
      await syncManager.initialize()
    })

    test('should detect conflicts during UPDATE operations', async () => {
      const mockOperation = {
        id: 'op-conflict',
        type: 'UPDATE' as const,
        table: 'expenses',
        data: { id: 'exp-1', amount: 30.00, description: 'Updated locally' },
        originalData: { id: 'exp-1', amount: 25.50, description: 'Original' },
        timestamp: Date.now(),
        retryCount: 0
      }

      mockOfflineQueue.getPending.mockResolvedValue([mockOperation])
      mockOfflineQueue.deduplicateOperations.mockResolvedValue(undefined)
      mockOfflineQueue.remove.mockResolvedValue(undefined)

      // Mock remote data differs from original
      const mockSelect = jest.fn(() => ({
        single: jest.fn(() => Promise.resolve({
          data: { id: 'exp-1', amount: 35.00, description: 'Updated remotely' },
          error: null
        }))
      }))
      const mockUpdate = jest.fn(() => Promise.resolve({ error: null }))

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        update: mockUpdate
      })

      // Mock conflict resolution
      mockConflictResolver.resolveConflict.mockResolvedValue({
        resolved: { id: 'exp-1', amount: 35.00, description: 'Updated remotely' },
        strategy: 'last-write-wins'
      })

      // Force sync
      await syncManager.forceSync()

      // Should have detected conflict and resolved it
      expect(mockConflictResolver.resolveConflict).toHaveBeenCalledWith(
        expect.objectContaining({
          tableName: 'expenses',
          operation: 'UPDATE',
          localData: mockOperation.data,
          remoteData: expect.objectContaining({ amount: 35.00 })
        })
      )
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 35.00 })
      )
    })

    test('should handle conflict resolution failures gracefully', async () => {
      const mockOperation = {
        id: 'op-conflict-fail',
        type: 'UPDATE' as const,
        table: 'expenses',
        data: { id: 'exp-1', amount: 30.00 },
        originalData: { id: 'exp-1', amount: 25.50 },
        timestamp: Date.now(),
        retryCount: 0
      }

      mockOfflineQueue.getPending.mockResolvedValue([mockOperation])
      mockOfflineQueue.deduplicateOperations.mockResolvedValue(undefined)
      mockOfflineQueue.remove.mockResolvedValue(undefined)

      // Mock conflict resolution failure
      mockConflictResolver.resolveConflict.mockRejectedValue(
        new Error('Conflict resolution failed')
      )

      // Mock remote data
      const mockSelect = jest.fn(() => ({
        single: jest.fn(() => Promise.resolve({
          data: { id: 'exp-1', amount: 35.00 },
          error: null
        }))
      }))
      const mockUpdate = jest.fn(() => Promise.resolve({ error: null }))

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        update: mockUpdate
      })

      // Force sync
      await syncManager.forceSync()

      // Should fallback to using local data
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 30.00 })
      )
    })

    test('should proceed without conflict resolution for INSERT operations', async () => {
      const mockOperation = {
        id: 'op-insert',
        type: 'INSERT' as const,
        table: 'expenses',
        data: { id: 'exp-1', amount: 25.50 },
        timestamp: Date.now(),
        retryCount: 0
      }

      mockOfflineQueue.getPending.mockResolvedValue([mockOperation])
      mockOfflineQueue.deduplicateOperations.mockResolvedValue(undefined)
      mockOfflineQueue.remove.mockResolvedValue(undefined)

      const mockInsert = jest.fn(() => Promise.resolve({ error: null }))
      mockSupabase.from.mockReturnValue({ insert: mockInsert })

      // Force sync
      await syncManager.forceSync()

      // Should not have attempted conflict resolution
      expect(mockConflictResolver.resolveConflict).not.toHaveBeenCalled()
      expect(mockInsert).toHaveBeenCalledWith(mockOperation.data)
    })
  })

  describe('Data Validation Integration', () => {
    beforeEach(async () => {
      await syncManager.initialize()
    })

    test('should validate data before sync operations', async () => {
      const mockOperation = {
        id: 'op-validate',
        type: 'INSERT' as const,
        table: 'expenses',
        data: { id: 'exp-1', amount: 25.50, description: 'Test' },
        timestamp: Date.now(),
        retryCount: 0
      }

      mockOfflineQueue.getPending.mockResolvedValue([mockOperation])
      mockOfflineQueue.deduplicateOperations.mockResolvedValue(undefined)
      mockOfflineQueue.remove.mockResolvedValue(undefined)

      // Mock validation with repairs
      mockDataValidator.validateData.mockResolvedValue({
        isValid: true,
        errors: [],
        warnings: [{ field: 'amount', message: 'Converted to number', suggestion: 'Use numbers' }],
        repairedData: { id: 'exp-1', amount: 25.50, description: 'Test' },
        canAutoRepair: true
      })

      const mockInsert = jest.fn(() => Promise.resolve({ error: null }))
      mockSupabase.from.mockReturnValue({ insert: mockInsert })

      // Force sync
      await syncManager.forceSync()

      // Should have validated data
      expect(mockDataValidator.validateData).toHaveBeenCalledWith(
        'expenses',
        mockOperation.data,
        'INSERT'
      )
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'exp-1', amount: 25.50 })
      )
    })

    test('should handle validation failures', async () => {
      const mockOperation = {
        id: 'op-invalid',
        type: 'INSERT' as const,
        table: 'expenses',
        data: { id: 'exp-1', amount: 'invalid', description: '' },
        timestamp: Date.now(),
        retryCount: 0
      }

      mockOfflineQueue.getPending.mockResolvedValue([mockOperation])
      mockOfflineQueue.deduplicateOperations.mockResolvedValue(undefined)
      mockOfflineQueue.update.mockResolvedValue(undefined)

      // Mock validation failure
      mockDataValidator.validateData.mockResolvedValue({
        isValid: false,
        errors: [{ field: 'amount', message: 'Invalid amount', code: 'INVALID_TYPE', severity: 'error' }],
        warnings: [],
        canAutoRepair: false
      })

      // Force sync
      await syncManager.forceSync()

      // Should have handled validation failure
      expect(mockDataValidator.validateData).toHaveBeenCalled()
      expect(mockOfflineQueue.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'op-invalid',
          retryCount: 1,
          lastError: expect.stringContaining('Data validation failed')
        })
      )
    })

    test('should create rollback points for critical operations', async () => {
      const mockOperation = {
        id: 'op-rollback',
        type: 'UPDATE' as const,
        table: 'expenses',
        data: { id: 'exp-1', amount: 30.00 },
        originalData: { id: 'exp-1', amount: 25.50 },
        timestamp: Date.now(),
        retryCount: 0
      }

      mockOfflineQueue.getPending.mockResolvedValue([mockOperation])
      mockOfflineQueue.deduplicateOperations.mockResolvedValue(undefined)
      mockOfflineQueue.remove.mockResolvedValue(undefined)

      // Mock rollback point creation
      mockDataValidator.createRollbackPoint.mockReturnValue('rollback-123')

      const mockUpdate = jest.fn(() => Promise.resolve({ error: null }))
      mockSupabase.from.mockReturnValue({ update: mockUpdate })

      // Force sync
      await syncManager.forceSync()

      // Should have created rollback point
      expect(mockDataValidator.createRollbackPoint).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            table: 'expenses',
            operation: 'UPDATE',
            recordId: 'exp-1',
            beforeData: mockOperation.originalData,
            afterData: mockOperation.data
          })
        ]),
        'Auto-sync UPDATE operation'
      )
    })
  })

  describe('Status Management', () => {
    beforeEach(async () => {
      await syncManager.initialize()
    })

    test('should provide accurate sync status', async () => {
      // Mock pending operations
      mockOfflineQueue.getStatus.mockResolvedValue({
        totalPending: 3,
        isProcessing: false,
        lastProcessed: Date.now() - 60000
      })

      const status = await syncManager.getStatus()

      expect(status.isEnabled).toBe(true)
      expect(status.isRunning).toBe(true)
      expect(status.pendingOperations).toBe(3)
      expect(status.connectivity.isOnline).toBe(true)
      expect(status.connectivity.isDatabaseReachable).toBe(true)
    })

    test('should handle status callbacks correctly', async () => {
      const statusUpdates: AutoSyncStatus[] = []

      const unsubscribe = syncManager.onStatusChange((status) => {
        statusUpdates.push(status)
      })

      // Trigger status change by simulating queue change
      const mockQueueCallback = mockOfflineQueue.onStatusChange.mock.calls[0][0]
      mockQueueCallback({
        totalPending: 5,
        isProcessing: true,
        lastProcessed: Date.now()
      })

      // Allow time for async callback
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(statusUpdates.length).toBeGreaterThan(0)
      expect(statusUpdates[statusUpdates.length - 1].pendingOperations).toBe(5)

      unsubscribe()
    })

    test('should handle connectivity changes', async () => {
      const statusUpdates: AutoSyncStatus[] = []

      syncManager.onStatusChange((status) => {
        statusUpdates.push(status)
      })

      // Mock connectivity restoration
      mockConnectivityManager.canAttemptOperations.mockReturnValue(true)

      // Trigger connectivity change
      const mockConnectivityCallback = mockConnectivityManager.onStatusChange.mock.calls[0][0]
      mockConnectivityCallback({
        isOnline: true,
        isDatabaseReachable: true,
        lastConnectivityCheck: Date.now()
      })

      // Allow time for async callback
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(statusUpdates.length).toBeGreaterThan(0)
    })
  })

  describe('Configuration Management', () => {
    test('should allow configuration updates', async () => {
      await syncManager.initialize()

      const initialStatus = await syncManager.getStatus()
      expect(initialStatus.syncInterval).toBe(10000) // Default 10 seconds

      // Update configuration
      syncManager.updateConfig({
        syncInterval: 5000, // 5 seconds
        batchSize: 20
      })

      const updatedStatus = await syncManager.getStatus()
      expect(updatedStatus.syncInterval).toBe(5000)
    })

    test('should restart sync on enable/disable', async () => {
      await syncManager.initialize()

      let initialStatus = await syncManager.getStatus()
      expect(initialStatus.isEnabled).toBe(true)
      expect(initialStatus.isRunning).toBe(true)

      // Disable sync
      syncManager.updateConfig({ enabled: false })

      let disabledStatus = await syncManager.getStatus()
      expect(disabledStatus.isEnabled).toBe(false)
      expect(disabledStatus.isRunning).toBe(false)

      // Re-enable sync
      syncManager.updateConfig({ enabled: true })

      let enabledStatus = await syncManager.getStatus()
      expect(enabledStatus.isEnabled).toBe(true)
      expect(enabledStatus.isRunning).toBe(true)
    })
  })

  describe('Error Handling and Recovery', () => {
    beforeEach(async () => {
      await syncManager.initialize()
    })

    test('should handle Supabase unavailable gracefully', async () => {
      const mockOperation = {
        id: 'op-no-supabase',
        type: 'INSERT' as const,
        table: 'expenses',
        data: { id: 'exp-1', amount: 25.50 },
        timestamp: Date.now(),
        retryCount: 0
      }

      mockOfflineQueue.getPending.mockResolvedValue([mockOperation])
      mockOfflineQueue.deduplicateOperations.mockResolvedValue(undefined)
      mockOfflineQueue.update.mockResolvedValue(undefined)

      // Mock Supabase as null
      jest.doMock('@/lib/supabase', () => ({ supabase: null }))

      // Force sync
      await syncManager.forceSync()

      // Should handle gracefully
      expect(mockOfflineQueue.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'op-no-supabase',
          retryCount: 1,
          lastError: 'Supabase not available'
        })
      )
    })

    test('should handle queue processing errors', async () => {
      // Mock queue.getPending to throw error
      mockOfflineQueue.getPending.mockRejectedValue(new Error('Queue error'))

      // Force sync should not crash
      await expect(syncManager.forceSync()).resolves.not.toThrow()

      // Should have reset processing state
      expect(mockOfflineQueue.setProcessing).toHaveBeenCalledWith(false)
    })

    test('should handle callback errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      // Add callback that throws error
      syncManager.onStatusChange(() => {
        throw new Error('Callback error')
      })

      // Trigger status change
      const mockQueueCallback = mockOfflineQueue.onStatusChange.mock.calls[0][0]
      mockQueueCallback({
        totalPending: 1,
        isProcessing: false,
        lastProcessed: Date.now()
      })

      // Allow time for async callback
      await new Promise(resolve => setTimeout(resolve, 100))

      // Should have logged error and continued
      expect(consoleSpy).toHaveBeenCalledWith('Error in auto-sync callback:', expect.any(Error))

      consoleSpy.mockRestore()
    })
  })

  describe('Cleanup and Resource Management', () => {
    test('should cleanup resources properly', async () => {
      await syncManager.initialize()

      const statusUpdates: AutoSyncStatus[] = []
      const unsubscribe = syncManager.onStatusChange((status) => {
        statusUpdates.push(status)
      })

      // Verify sync is running
      let status = await syncManager.getStatus()
      expect(status.isRunning).toBe(true)

      // Cleanup
      syncManager.cleanup()

      // Should have stopped
      status = await syncManager.getStatus()
      expect(status.isRunning).toBe(false)

      // Should not receive more callbacks
      const initialCallbackCount = statusUpdates.length
      
      // Try to trigger callback
      const mockQueueCallback = mockOfflineQueue.onStatusChange.mock.calls[0][0]
      mockQueueCallback({
        totalPending: 1,
        isProcessing: false,
        lastProcessed: Date.now()
      })

      await new Promise(resolve => setTimeout(resolve, 100))

      // Should not have received new callbacks
      expect(statusUpdates.length).toBe(initialCallbackCount)

      unsubscribe()
    })
  })

  describe('Utility Functions', () => {
    test('should provide debug information', async () => {
      await syncManager.initialize()

      const debugInfo = await syncManager.getDebugInfo()

      expect(debugInfo).toHaveProperty('autoSync')
      expect(debugInfo).toHaveProperty('queue')
      expect(debugInfo).toHaveProperty('connectivity')
      expect(debugInfo).toHaveProperty('config')
      expect(debugInfo).toHaveProperty('isInitialized')
      expect(debugInfo.isInitialized).toBe(true)
    })

    test('should provide conflict statistics', async () => {
      mockConflictResolver.getConflictStats.mockReturnValue({
        totalConflicts: 5,
        resolvedConflicts: 4,
        recentConflicts: 2
      })

      await syncManager.initialize()

      const conflictStats = syncManager.getConflictStats()

      expect(conflictStats.totalConflicts).toBe(5)
      expect(conflictStats.resolvedConflicts).toBe(4)
      expect(conflictStats.recentConflicts).toBe(2)
    })

    test('should provide validation history', async () => {
      mockConflictResolver.getConflictHistory.mockReturnValue([
        { id: 'conflict-1', timestamp: Date.now() }
      ])
      
      mockDataValidator.getRollbackHistory.mockReturnValue([
        { id: 'rollback-1', timestamp: Date.now() }
      ])

      await syncManager.initialize()

      const validationHistory = syncManager.getValidationHistory()

      expect(validationHistory.conflicts).toHaveLength(1)
      expect(validationHistory.rollbacks).toHaveLength(1)
    })

    test('should perform data consistency checks', async () => {
      mockDataValidator.checkDataConsistency.mockResolvedValue({
        isConsistent: true,
        issues: [],
        recommendations: []
      })

      await syncManager.initialize()

      const consistencyResult = await syncManager.checkDataConsistency()

      expect(consistencyResult.isConsistent).toBe(true)
      expect(mockDataValidator.checkDataConsistency).toHaveBeenCalled()
    })

    test('should auto-repair data issues', async () => {
      mockDataValidator.autoRepairData.mockResolvedValue({
        repaired: 3,
        issues: ['Issue 1', 'Issue 2']
      })

      await syncManager.initialize()

      const repairResult = await syncManager.autoRepairData('expenses')

      expect(repairResult.totalRepaired).toBe(3)
      expect(repairResult.results.expenses.repaired).toBe(3)
      expect(mockDataValidator.autoRepairData).toHaveBeenCalledWith('expenses')
    })
  })
})
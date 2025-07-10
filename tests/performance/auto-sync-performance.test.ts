/**
 * Performance Tests for Auto-Sync System
 * Tests performance characteristics and scalability
 */

import { autoSyncManager } from '@/lib/auto-sync-manager'
import { offlineQueue } from '@/lib/offline-queue'
import { connectivityManager } from '@/lib/connectivity-manager'
import { dataValidator } from '@/lib/data-validator'
import { conflictResolver } from '@/lib/conflict-resolver'
import { Expense, Category, Account } from '@/lib/types'

describe('Auto-Sync Performance Tests', () => {
  beforeEach(() => {
    // Reset all systems
    offlineQueue.clear()
    autoSyncManager.cleanup()
    dataValidator.clearValidationHistory()
    conflictResolver.clearHistory()
  })

  describe('Queue Performance', () => {
    test('should handle large operation queues efficiently', async () => {
      const operations = Array.from({ length: 1000 }, (_, i) => ({
        id: `op-${i}`,
        type: 'INSERT' as const,
        table: 'expenses',
        data: {
          id: `exp-${i}`,
          amount: (i + 1) * 10,
          description: `Performance test expense ${i + 1}`,
          categoryId: 'cat-1',
          accountId: 'acc-1',
          date: new Date().toISOString()
        },
        timestamp: Date.now() + i
      }))

      const startTime = Date.now()
      
      // Add operations to queue
      for (const operation of operations) {
        await offlineQueue.addOperation(operation.type, operation.table, operation.data)
      }
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      // Should complete within 5 seconds
      expect(duration).toBeLessThan(5000)
      
      // Verify all operations were queued
      const queuedOperations = await offlineQueue.getOperations()
      expect(queuedOperations).toHaveLength(1000)
      
      // Check queue performance metrics
      const queueStats = await offlineQueue.getPerformanceStats()
      expect(queueStats.averageAddTime).toBeLessThan(10) // Less than 10ms per operation
      expect(queueStats.totalOperations).toBe(1000)
    })

    test('should batch process operations efficiently', async () => {
      // Create large batch of operations
      const batchSize = 500
      const operations = Array.from({ length: batchSize }, (_, i) => ({
        id: `batch-op-${i}`,
        type: 'INSERT' as const,
        table: 'expenses',
        data: {
          id: `exp-batch-${i}`,
          amount: (i + 1) * 5,
          description: `Batch expense ${i + 1}`,
          categoryId: 'cat-1',
          accountId: 'acc-1',
          date: new Date().toISOString()
        },
        timestamp: Date.now() + i
      }))

      // Add all operations
      for (const operation of operations) {
        await offlineQueue.addOperation(operation.type, operation.table, operation.data)
      }

      // Measure batch processing time
      const startTime = Date.now()
      await offlineQueue.processBatch(100) // Process in batches of 100
      const endTime = Date.now()
      
      const duration = endTime - startTime
      expect(duration).toBeLessThan(10000) // Should complete within 10 seconds
      
      // Check remaining operations
      const remainingOperations = await offlineQueue.getOperations()
      expect(remainingOperations.length).toBeLessThan(batchSize)
    })

    test('should handle concurrent queue operations', async () => {
      const concurrentOperations = 50
      const operationsPerTask = 20
      
      const tasks = Array.from({ length: concurrentOperations }, (_, taskIndex) => 
        Promise.all(
          Array.from({ length: operationsPerTask }, (_, opIndex) => 
            offlineQueue.addOperation('INSERT', 'expenses', {
              id: `exp-${taskIndex}-${opIndex}`,
              amount: (taskIndex + 1) * (opIndex + 1) * 10,
              description: `Concurrent expense ${taskIndex}-${opIndex}`,
              categoryId: 'cat-1',
              accountId: 'acc-1',
              date: new Date().toISOString()
            })
          )
        )
      )

      const startTime = Date.now()
      await Promise.all(tasks)
      const endTime = Date.now()
      
      const duration = endTime - startTime
      expect(duration).toBeLessThan(15000) // Should complete within 15 seconds
      
      // Verify all operations were queued
      const queuedOperations = await offlineQueue.getOperations()
      expect(queuedOperations).toHaveLength(concurrentOperations * operationsPerTask)
    })

    test('should maintain performance with large queue sizes', async () => {
      // Fill queue with many operations
      const baseOperations = Array.from({ length: 2000 }, (_, i) => ({
        id: `base-op-${i}`,
        type: 'INSERT' as const,
        table: 'expenses',
        data: {
          id: `exp-base-${i}`,
          amount: (i + 1) * 2,
          description: `Base expense ${i + 1}`,
          categoryId: 'cat-1',
          accountId: 'acc-1',
          date: new Date().toISOString()
        }
      }))

      for (const operation of baseOperations) {
        await offlineQueue.addOperation(operation.type, operation.table, operation.data)
      }

      // Measure performance of additional operations
      const additionalOperations = Array.from({ length: 100 }, (_, i) => ({
        id: `add-op-${i}`,
        type: 'INSERT' as const,
        table: 'expenses',
        data: {
          id: `exp-add-${i}`,
          amount: (i + 1) * 20,
          description: `Additional expense ${i + 1}`,
          categoryId: 'cat-1',
          accountId: 'acc-1',
          date: new Date().toISOString()
        }
      }))

      const startTime = Date.now()
      for (const operation of additionalOperations) {
        await offlineQueue.addOperation(operation.type, operation.table, operation.data)
      }
      const endTime = Date.now()
      
      const duration = endTime - startTime
      expect(duration).toBeLessThan(2000) // Should still be fast with large existing queue
      
      // Verify queue size
      const queuedOperations = await offlineQueue.getOperations()
      expect(queuedOperations).toHaveLength(2100)
    })
  })

  describe('Sync Performance', () => {
    test('should sync large datasets efficiently', async () => {
      // Create large dataset
      const datasetSize = 1000
      const operations = Array.from({ length: datasetSize }, (_, i) => ({
        id: `sync-op-${i}`,
        type: 'INSERT' as const,
        table: 'expenses',
        data: {
          id: `exp-sync-${i}`,
          amount: (i + 1) * 15,
          description: `Sync expense ${i + 1}`,
          categoryId: 'cat-1',
          accountId: 'acc-1',
          date: new Date().toISOString()
        }
      }))

      // Add to queue
      for (const operation of operations) {
        await offlineQueue.addOperation(operation.type, operation.table, operation.data)
      }

      // Initialize sync manager
      await autoSyncManager.initialize()

      // Measure sync performance
      const startTime = Date.now()
      await autoSyncManager.forceSync()
      const endTime = Date.now()
      
      const duration = endTime - startTime
      expect(duration).toBeLessThan(30000) // Should complete within 30 seconds
      
      // Verify sync completed
      const status = await autoSyncManager.getStatus()
      expect(status.pendingOperations).toBe(0)
      expect(status.failedOperations).toBe(0)
      
      // Check sync performance metrics
      const syncStats = await autoSyncManager.getPerformanceStats()
      expect(syncStats.averageSyncTime).toBeLessThan(50) // Less than 50ms per operation
      expect(syncStats.totalOperationsProcessed).toBe(datasetSize)
    })

    test('should handle high-frequency sync operations', async () => {
      await autoSyncManager.initialize()
      
      // Create many small operations
      const operationCount = 200
      const operations = Array.from({ length: operationCount }, (_, i) => ({
        type: 'INSERT' as const,
        table: 'expenses',
        data: {
          id: `exp-freq-${i}`,
          amount: (i + 1) * 5,
          description: `Frequent expense ${i + 1}`,
          categoryId: 'cat-1',
          accountId: 'acc-1',
          date: new Date().toISOString()
        }
      }))

      const startTime = Date.now()
      
      // Add operations rapidly
      for (const operation of operations) {
        await offlineQueue.addOperation(operation.type, operation.table, operation.data)
        // Trigger sync frequently
        if (Math.random() < 0.3) { // 30% chance to trigger sync
          autoSyncManager.forceSync() // Don't await - let it run in background
        }
      }
      
      // Wait for all syncs to complete
      await autoSyncManager.forceSync()
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      expect(duration).toBeLessThan(20000) // Should handle high frequency efficiently
      
      // Verify all operations were processed
      const status = await autoSyncManager.getStatus()
      expect(status.pendingOperations).toBe(0)
    })

    test('should maintain performance under network stress', async () => {
      // Mock slow network conditions
      const originalFetch = global.fetch
      global.fetch = jest.fn().mockImplementation(async (url: string, options: any) => {
        // Simulate slow network
        await new Promise(resolve => setTimeout(resolve, 100))
        return originalFetch(url, options)
      })

      await autoSyncManager.initialize()
      
      // Create moderate dataset
      const operations = Array.from({ length: 100 }, (_, i) => ({
        type: 'INSERT' as const,
        table: 'expenses',
        data: {
          id: `exp-stress-${i}`,
          amount: (i + 1) * 12,
          description: `Stress test expense ${i + 1}`,
          categoryId: 'cat-1',
          accountId: 'acc-1',
          date: new Date().toISOString()
        }
      }))

      // Add to queue
      for (const operation of operations) {
        await offlineQueue.addOperation(operation.type, operation.table, operation.data)
      }

      // Measure sync performance under stress
      const startTime = Date.now()
      await autoSyncManager.forceSync()
      const endTime = Date.now()
      
      const duration = endTime - startTime
      expect(duration).toBeLessThan(45000) // Should handle network stress within 45 seconds
      
      // Verify sync completed
      const status = await autoSyncManager.getStatus()
      expect(status.pendingOperations).toBe(0)
      
      // Restore original fetch
      global.fetch = originalFetch
    })
  })

  describe('Conflict Resolution Performance', () => {
    test('should resolve conflicts efficiently at scale', async () => {
      const conflictCount = 500
      const conflicts = Array.from({ length: conflictCount }, (_, i) => ({
        tableName: 'expenses',
        operation: 'UPDATE' as const,
        localData: {
          id: `exp-conflict-${i}`,
          amount: (i + 1) * 20,
          description: `Local expense ${i + 1}`,
          categoryId: 'cat-1',
          accountId: 'acc-1',
          date: new Date().toISOString()
        },
        remoteData: {
          id: `exp-conflict-${i}`,
          amount: (i + 1) * 25,
          description: `Remote expense ${i + 1}`,
          categoryId: 'cat-1',
          accountId: 'acc-1',
          date: new Date().toISOString()
        },
        localTimestamp: Date.now(),
        remoteTimestamp: Date.now() - 1000
      }))

      const startTime = Date.now()
      
      // Resolve conflicts concurrently
      const resolutions = await Promise.all(
        conflicts.map(conflict => conflictResolver.resolveConflict(conflict))
      )
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      expect(duration).toBeLessThan(10000) // Should resolve 500 conflicts within 10 seconds
      expect(resolutions).toHaveLength(conflictCount)
      expect(resolutions.every(r => r.resolved)).toBe(true)
      
      // Check conflict resolution performance
      const conflictStats = conflictResolver.getPerformanceStats()
      expect(conflictStats.averageResolutionTime).toBeLessThan(20) // Less than 20ms per conflict
    })

    test('should handle complex conflict scenarios efficiently', async () => {
      const complexConflicts = Array.from({ length: 100 }, (_, i) => ({
        tableName: 'expenses',
        operation: 'UPDATE' as const,
        localData: {
          id: `exp-complex-${i}`,
          amount: (i + 1) * 30,
          description: `Complex local expense ${i + 1}`,
          categoryId: 'cat-1',
          accountId: 'acc-1',
          date: new Date().toISOString(),
          metadata: {
            tags: ['local', 'complex'],
            location: { city: 'Local City', state: 'LC' }
          }
        },
        remoteData: {
          id: `exp-complex-${i}`,
          amount: (i + 1) * 35,
          description: `Complex remote expense ${i + 1}`,
          categoryId: 'cat-2',
          accountId: 'acc-2',
          date: new Date().toISOString(),
          metadata: {
            tags: ['remote', 'complex'],
            location: { city: 'Remote City', state: 'RC' }
          }
        },
        localTimestamp: Date.now(),
        remoteTimestamp: Date.now() - 2000
      }))

      const startTime = Date.now()
      
      const resolutions = await Promise.all(
        complexConflicts.map(conflict => conflictResolver.resolveConflict(conflict))
      )
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      expect(duration).toBeLessThan(15000) // Should handle complex conflicts within 15 seconds
      expect(resolutions).toHaveLength(100)
      expect(resolutions.every(r => r.resolved)).toBe(true)
    })

    test('should maintain performance during conflict storms', async () => {
      // Simulate a "conflict storm" - many conflicts happening simultaneously
      const stormSize = 200
      const conflictBatches = Array.from({ length: 10 }, (_, batchIndex) =>
        Array.from({ length: stormSize / 10 }, (_, conflictIndex) => ({
          tableName: 'expenses',
          operation: 'UPDATE' as const,
          localData: {
            id: `exp-storm-${batchIndex}-${conflictIndex}`,
            amount: (batchIndex + 1) * (conflictIndex + 1) * 10,
            description: `Storm expense ${batchIndex}-${conflictIndex}`,
            categoryId: 'cat-1',
            accountId: 'acc-1',
            date: new Date().toISOString()
          },
          remoteData: {
            id: `exp-storm-${batchIndex}-${conflictIndex}`,
            amount: (batchIndex + 1) * (conflictIndex + 1) * 15,
            description: `Storm expense ${batchIndex}-${conflictIndex} (remote)`,
            categoryId: 'cat-1',
            accountId: 'acc-1',
            date: new Date().toISOString()
          },
          localTimestamp: Date.now() + Math.random() * 1000,
          remoteTimestamp: Date.now() + Math.random() * 1000
        }))
      )

      const startTime = Date.now()
      
      // Process conflict batches concurrently
      const batchPromises = conflictBatches.map(batch =>
        Promise.all(batch.map(conflict => conflictResolver.resolveConflict(conflict)))
      )
      
      const allResolutions = await Promise.all(batchPromises)
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      expect(duration).toBeLessThan(20000) // Should handle conflict storm within 20 seconds
      
      // Verify all resolutions completed
      const flatResolutions = allResolutions.flat()
      expect(flatResolutions).toHaveLength(stormSize)
      expect(flatResolutions.every(r => r.resolved)).toBe(true)
    })
  })

  describe('Validation Performance', () => {
    test('should validate large datasets efficiently', async () => {
      const validationCount = 1000
      const expenses = Array.from({ length: validationCount }, (_, i) => ({
        id: `exp-validation-${i}`,
        amount: (i + 1) * 8,
        description: `Validation expense ${i + 1}`,
        categoryId: 'cat-1',
        accountId: 'acc-1',
        date: new Date().toISOString()
      }))

      const startTime = Date.now()
      
      // Validate all expenses concurrently
      const validationResults = await Promise.all(
        expenses.map(expense => dataValidator.validateData('expenses', expense, 'INSERT'))
      )
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      expect(duration).toBeLessThan(5000) // Should validate 1000 records within 5 seconds
      expect(validationResults).toHaveLength(validationCount)
      expect(validationResults.every(r => r.isValid)).toBe(true)
      
      // Check validation performance
      const validationStats = dataValidator.getPerformanceStats()
      expect(validationStats.averageValidationTime).toBeLessThan(5) // Less than 5ms per validation
    })

    test('should handle batch validation efficiently', async () => {
      const batchSize = 500
      const batches = Array.from({ length: 10 }, (_, batchIndex) =>
        Array.from({ length: batchSize / 10 }, (_, itemIndex) => ({
          id: `exp-batch-${batchIndex}-${itemIndex}`,
          amount: (batchIndex + 1) * (itemIndex + 1) * 3,
          description: `Batch expense ${batchIndex}-${itemIndex}`,
          categoryId: 'cat-1',
          accountId: 'acc-1',
          date: new Date().toISOString()
        }))
      )

      const startTime = Date.now()
      
      // Process batches concurrently
      const batchPromises = batches.map(batch =>
        dataValidator.validateBatch('expenses', batch, 'INSERT')
      )
      
      const batchResults = await Promise.all(batchPromises)
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      expect(duration).toBeLessThan(8000) // Should handle batch validation within 8 seconds
      expect(batchResults).toHaveLength(10)
      expect(batchResults.every(r => r.validRecords === batchSize / 10)).toBe(true)
    })

    test('should maintain performance with complex validation rules', async () => {
      const complexData = Array.from({ length: 200 }, (_, i) => ({
        id: `exp-complex-${i}`,
        amount: (i + 1) * 7,
        description: `Complex validation expense ${i + 1}`,
        categoryId: 'cat-1',
        accountId: 'acc-1',
        date: new Date().toISOString(),
        metadata: {
          tags: Array.from({ length: 5 }, (_, j) => `tag-${j}`),
          location: { city: `City ${i}`, state: `State ${i}` },
          customFields: Array.from({ length: 10 }, (_, k) => ({ key: `field-${k}`, value: `value-${k}` }))
        }
      }))

      const startTime = Date.now()
      
      const validationResults = await Promise.all(
        complexData.map(data => dataValidator.validateData('expenses', data, 'INSERT'))
      )
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      expect(duration).toBeLessThan(10000) // Should handle complex validation within 10 seconds
      expect(validationResults).toHaveLength(200)
      expect(validationResults.every(r => r.isValid)).toBe(true)
    })
  })

  describe('Memory Performance', () => {
    test('should manage memory efficiently during large operations', async () => {
      const initialMemory = process.memoryUsage()
      
      // Create large dataset
      const largeDataset = Array.from({ length: 2000 }, (_, i) => ({
        id: `exp-memory-${i}`,
        amount: (i + 1) * 6,
        description: `Memory test expense ${i + 1}`,
        categoryId: 'cat-1',
        accountId: 'acc-1',
        date: new Date().toISOString(),
        largeField: 'x'.repeat(1000) // 1KB per record
      }))

      // Add to queue
      for (const data of largeDataset) {
        await offlineQueue.addOperation('INSERT', 'expenses', data)
      }

      // Process sync
      await autoSyncManager.initialize()
      await autoSyncManager.forceSync()
      
      const finalMemory = process.memoryUsage()
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed
      
      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024)
      
      // Cleanup should release memory
      await autoSyncManager.cleanup()
      offlineQueue.clear()
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc()
      }
      
      const cleanupMemory = process.memoryUsage()
      const memoryAfterCleanup = cleanupMemory.heapUsed - initialMemory.heapUsed
      
      // Should release most memory after cleanup
      expect(memoryAfterCleanup).toBeLessThan(memoryIncrease / 2)
    })

    test('should handle memory pressure gracefully', async () => {
      // Simulate memory pressure by creating many large objects
      const memoryPressureData = Array.from({ length: 1000 }, (_, i) => ({
        id: `exp-pressure-${i}`,
        amount: (i + 1) * 4,
        description: `Memory pressure expense ${i + 1}`,
        categoryId: 'cat-1',
        accountId: 'acc-1',
        date: new Date().toISOString(),
        largeData: Array.from({ length: 100 }, (_, j) => `large-data-${j}`).join(' ')
      }))

      const startTime = Date.now()
      
      // Process data under memory pressure
      const results = await Promise.all(
        memoryPressureData.map(data => dataValidator.validateData('expenses', data, 'INSERT'))
      )
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      expect(duration).toBeLessThan(15000) // Should handle memory pressure within 15 seconds
      expect(results).toHaveLength(1000)
      expect(results.every(r => r.isValid)).toBe(true)
    })
  })

  describe('Concurrent Operations Performance', () => {
    test('should handle concurrent sync operations efficiently', async () => {
      await autoSyncManager.initialize()
      
      // Create multiple concurrent sync operations
      const concurrentSyncs = Array.from({ length: 10 }, (_, i) => {
        // Add operations to queue
        const operations = Array.from({ length: 50 }, (_, j) => ({
          type: 'INSERT' as const,
          table: 'expenses',
          data: {
            id: `exp-concurrent-${i}-${j}`,
            amount: (i + 1) * (j + 1) * 2,
            description: `Concurrent expense ${i}-${j}`,
            categoryId: 'cat-1',
            accountId: 'acc-1',
            date: new Date().toISOString()
          }
        }))
        
        // Add operations and trigger sync
        return Promise.all(operations.map(op => 
          offlineQueue.addOperation(op.type, op.table, op.data)
        )).then(() => autoSyncManager.forceSync())
      })

      const startTime = Date.now()
      await Promise.all(concurrentSyncs)
      const endTime = Date.now()
      
      const duration = endTime - startTime
      expect(duration).toBeLessThan(25000) // Should handle concurrent syncs within 25 seconds
      
      // Verify all operations completed
      const status = await autoSyncManager.getStatus()
      expect(status.pendingOperations).toBe(0)
    })

    test('should maintain performance under high concurrency', async () => {
      const concurrencyLevel = 20
      const operationsPerTask = 25
      
      // Create high-concurrency scenario
      const concurrentTasks = Array.from({ length: concurrencyLevel }, (_, taskIndex) =>
        Promise.all([
          // Queue operations
          Promise.all(Array.from({ length: operationsPerTask }, (_, opIndex) =>
            offlineQueue.addOperation('INSERT', 'expenses', {
              id: `exp-high-concurrency-${taskIndex}-${opIndex}`,
              amount: (taskIndex + 1) * (opIndex + 1),
              description: `High concurrency expense ${taskIndex}-${opIndex}`,
              categoryId: 'cat-1',
              accountId: 'acc-1',
              date: new Date().toISOString()
            })
          )),
          // Validate data
          Promise.all(Array.from({ length: operationsPerTask }, (_, opIndex) =>
            dataValidator.validateData('expenses', {
              id: `exp-validate-${taskIndex}-${opIndex}`,
              amount: (taskIndex + 1) * (opIndex + 1),
              description: `Validation expense ${taskIndex}-${opIndex}`,
              categoryId: 'cat-1',
              accountId: 'acc-1',
              date: new Date().toISOString()
            }, 'INSERT')
          ))
        ])
      )

      const startTime = Date.now()
      await Promise.all(concurrentTasks)
      const endTime = Date.now()
      
      const duration = endTime - startTime
      expect(duration).toBeLessThan(30000) // Should handle high concurrency within 30 seconds
      
      // Verify operations were queued
      const queuedOperations = await offlineQueue.getOperations()
      expect(queuedOperations.length).toBe(concurrencyLevel * operationsPerTask)
    })
  })

  describe('Performance Monitoring', () => {
    test('should track performance metrics accurately', async () => {
      await autoSyncManager.initialize()
      
      // Perform various operations to generate metrics
      const operations = Array.from({ length: 100 }, (_, i) => ({
        type: 'INSERT' as const,
        table: 'expenses',
        data: {
          id: `exp-metrics-${i}`,
          amount: (i + 1) * 11,
          description: `Metrics expense ${i + 1}`,
          categoryId: 'cat-1',
          accountId: 'acc-1',
          date: new Date().toISOString()
        }
      }))

      // Add operations
      for (const operation of operations) {
        await offlineQueue.addOperation(operation.type, operation.table, operation.data)
      }

      // Sync operations
      await autoSyncManager.forceSync()
      
      // Check performance metrics
      const syncStats = await autoSyncManager.getPerformanceStats()
      expect(syncStats.totalOperationsProcessed).toBe(100)
      expect(syncStats.averageSyncTime).toBeGreaterThan(0)
      expect(syncStats.maxSyncTime).toBeGreaterThan(0)
      expect(syncStats.minSyncTime).toBeGreaterThan(0)
      
      const queueStats = await offlineQueue.getPerformanceStats()
      expect(queueStats.totalOperations).toBe(100)
      expect(queueStats.averageAddTime).toBeGreaterThan(0)
      
      const validationStats = dataValidator.getPerformanceStats()
      expect(validationStats.totalValidations).toBeGreaterThan(0)
      expect(validationStats.averageValidationTime).toBeGreaterThan(0)
    })

    test('should identify performance bottlenecks', async () => {
      await autoSyncManager.initialize()
      
      // Create scenarios that might cause bottlenecks
      const scenarios = [
        // Large batch
        Array.from({ length: 200 }, (_, i) => ({
          type: 'INSERT' as const,
          table: 'expenses',
          data: {
            id: `exp-bottleneck-batch-${i}`,
            amount: (i + 1) * 9,
            description: `Bottleneck batch expense ${i + 1}`,
            categoryId: 'cat-1',
            accountId: 'acc-1',
            date: new Date().toISOString()
          }
        })),
        // Complex validation
        Array.from({ length: 50 }, (_, i) => ({
          type: 'INSERT' as const,
          table: 'expenses',
          data: {
            id: `exp-bottleneck-complex-${i}`,
            amount: (i + 1) * 13,
            description: `Bottleneck complex expense ${i + 1}`,
            categoryId: 'cat-1',
            accountId: 'acc-1',
            date: new Date().toISOString(),
            metadata: {
              tags: Array.from({ length: 10 }, (_, j) => `tag-${j}`),
              customData: Array.from({ length: 20 }, (_, k) => ({ key: `key-${k}`, value: `value-${k}` }))
            }
          }
        }))
      ]

      const bottleneckResults = []
      
      for (const scenario of scenarios) {
        const startTime = Date.now()
        
        for (const operation of scenario) {
          await offlineQueue.addOperation(operation.type, operation.table, operation.data)
        }
        
        await autoSyncManager.forceSync()
        
        const endTime = Date.now()
        bottleneckResults.push({
          scenario: scenario.length,
          duration: endTime - startTime
        })
      }
      
      // Analyze bottlenecks
      const performanceReport = await autoSyncManager.generatePerformanceReport()
      expect(performanceReport.bottlenecks).toBeDefined()
      expect(performanceReport.recommendations).toBeDefined()
      expect(performanceReport.metrics).toBeDefined()
    })
  })
})
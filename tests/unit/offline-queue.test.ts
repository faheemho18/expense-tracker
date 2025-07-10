import { offlineQueue, QueuedOperation, QueueStatus } from '@/lib/offline-queue'
import 'fake-indexeddb/auto'

// Mock Supabase for testing
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    channel: jest.fn(),
    removeChannel: jest.fn(),
  }
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

describe('Offline Queue System', () => {
  beforeEach(async () => {
    // Reset the queue before each test
    await offlineQueue.clear()
    mockLocalStorage.clear()
    jest.clearAllMocks()
  })

  afterEach(async () => {
    // Clean up after each test
    await offlineQueue.clear()
  })

  describe('Queue Persistence Across Browser Sessions', () => {
    test('should persist queued operations across browser refresh', async () => {
      // Initialize queue
      await offlineQueue.initialize()

      // Add operations to queue using proper API
      const id1 = await offlineQueue.add({
        type: 'INSERT',
        table: 'expenses',
        data: {
          id: 'expense-1',
          amount: 25.50,
          description: 'Test Expense 1',
          categoryId: 'cat-1',
          date: new Date().toISOString()
        }
      })

      const id2 = await offlineQueue.add({
        type: 'UPDATE',
        table: 'categories',
        data: {
          id: 'cat-1',
          name: 'Updated Category',
          color: '#ff0000'
        },
        originalData: {
          id: 'cat-1',
          name: 'Original Category',
          color: '#00ff00'
        }
      })

      // Verify operations are in queue
      const pendingBeforeRefresh = await offlineQueue.getPending()
      expect(pendingBeforeRefresh).toHaveLength(2)
      expect(pendingBeforeRefresh.find(op => op.id === id1)).toBeTruthy()
      expect(pendingBeforeRefresh.find(op => op.id === id2)).toBeTruthy()

      // Simulate browser refresh by creating new queue instance
      const newQueue = new (offlineQueue.constructor as any)()
      await newQueue.initialize()

      // Verify operations are restored from IndexedDB
      const pendingAfterRefresh = await newQueue.getPending()
      expect(pendingAfterRefresh).toHaveLength(2)
      
      const restoredOp1 = pendingAfterRefresh.find(op => op.id === 'test-op-1')
      expect(restoredOp1).toBeTruthy()
      expect(restoredOp1?.type).toBe('INSERT')
      expect(restoredOp1?.table).toBe('expenses')
      expect(restoredOp1?.data.amount).toBe(25.50)

      const restoredOp2 = pendingAfterRefresh.find(op => op.id === 'test-op-2')
      expect(restoredOp2).toBeTruthy()
      expect(restoredOp2?.type).toBe('UPDATE')
      expect(restoredOp2?.table).toBe('categories')
      expect(restoredOp2?.data.name).toBe('Updated Category')
      expect(restoredOp2?.originalData?.name).toBe('Original Category')
    })

    test('should handle queue corruption gracefully', async () => {
      // Initialize queue
      await offlineQueue.initialize()

      // Simulate corrupted IndexedDB by adding invalid data
      const dbRequest = indexedDB.open('OfflineQueue', 1)
      await new Promise((resolve, reject) => {
        dbRequest.onsuccess = () => {
          const db = dbRequest.result
          const transaction = db.transaction(['operations'], 'readwrite')
          const store = transaction.objectStore('operations')
          
          // Add corrupted data
          store.add({
            id: 'corrupted-op',
            type: 'INVALID_TYPE',
            table: null,
            data: undefined,
            timestamp: 'invalid-timestamp'
          })
          
          transaction.oncomplete = () => resolve(true)
          transaction.onerror = () => reject(transaction.error)
        }
        dbRequest.onerror = () => reject(dbRequest.error)
      })

      // Create new queue instance to test corruption handling
      const newQueue = new (offlineQueue.constructor as any)()
      
      // Should initialize gracefully despite corruption
      const initResult = await newQueue.initialize()
      expect(initResult).toBe(true)

      // Should have empty queue after corruption cleanup
      const pending = await newQueue.getPending()
      expect(pending).toHaveLength(0)

      // Should be able to add new operations normally
      const validOperation: QueuedOperation = {
        id: 'valid-op',
        type: 'INSERT',
        table: 'expenses',
        data: { id: 'test', amount: 10 },
        timestamp: Date.now(),
        retryCount: 0
      }

      await newQueue.add(validOperation)
      const pendingAfterAdd = await newQueue.getPending()
      expect(pendingAfterAdd).toHaveLength(1)
      expect(pendingAfterAdd[0].id).toBe('valid-op')
    })
  })

  describe('Queue Operations', () => {
    beforeEach(async () => {
      await offlineQueue.initialize()
    })

    test('should add operations with correct metadata', async () => {
      const insertOp: QueuedOperation = {
        id: 'insert-test',
        type: 'INSERT',
        table: 'expenses',
        data: {
          id: 'expense-1',
          amount: 15.75,
          description: 'Coffee',
          categoryId: 'food',
          date: new Date().toISOString()
        },
        timestamp: Date.now(),
        retryCount: 0
      }

      const updateOp: QueuedOperation = {
        id: 'update-test',
        type: 'UPDATE',
        table: 'categories',
        data: {
          id: 'food',
          name: 'Food & Dining',
          color: '#ff6b6b'
        },
        originalData: {
          id: 'food',
          name: 'Food',
          color: '#ff0000'
        },
        timestamp: Date.now(),
        retryCount: 0
      }

      const deleteOp: QueuedOperation = {
        id: 'delete-test',
        type: 'DELETE',
        table: 'accounts',
        data: {
          id: 'account-1'
        },
        timestamp: Date.now(),
        retryCount: 0
      }

      // Add operations
      await offlineQueue.add(insertOp)
      await offlineQueue.add(updateOp)
      await offlineQueue.add(deleteOp)

      // Verify operations are added with correct metadata
      const pending = await offlineQueue.getPending()
      expect(pending).toHaveLength(3)

      // Verify INSERT operation
      const insertResult = pending.find(op => op.id === 'insert-test')
      expect(insertResult).toBeTruthy()
      expect(insertResult?.type).toBe('INSERT')
      expect(insertResult?.table).toBe('expenses')
      expect(insertResult?.data.amount).toBe(15.75)
      expect(insertResult?.retryCount).toBe(0)
      expect(insertResult?.timestamp).toBeGreaterThan(Date.now() - 1000)

      // Verify UPDATE operation
      const updateResult = pending.find(op => op.id === 'update-test')
      expect(updateResult).toBeTruthy()
      expect(updateResult?.type).toBe('UPDATE')
      expect(updateResult?.originalData).toBeTruthy()
      expect(updateResult?.originalData?.name).toBe('Food')
      expect(updateResult?.data.name).toBe('Food & Dining')

      // Verify DELETE operation
      const deleteResult = pending.find(op => op.id === 'delete-test')
      expect(deleteResult).toBeTruthy()
      expect(deleteResult?.type).toBe('DELETE')
      expect(deleteResult?.data.id).toBe('account-1')
    })

    test('should deduplicate operations correctly', async () => {
      const timestamp1 = Date.now()
      const timestamp2 = Date.now() + 1000

      // Add multiple operations for same record
      const op1: QueuedOperation = {
        id: 'op-1',
        type: 'UPDATE',
        table: 'expenses',
        data: { id: 'expense-1', amount: 10, description: 'First update' },
        timestamp: timestamp1,
        retryCount: 0
      }

      const op2: QueuedOperation = {
        id: 'op-2',
        type: 'UPDATE',
        table: 'expenses',
        data: { id: 'expense-1', amount: 20, description: 'Second update' },
        timestamp: timestamp2,
        retryCount: 0
      }

      const op3: QueuedOperation = {
        id: 'op-3',
        type: 'UPDATE',
        table: 'expenses',
        data: { id: 'expense-1', amount: 30, description: 'Third update' },
        timestamp: timestamp2 + 500,
        retryCount: 0
      }

      // Add different record operation (should not be deduplicated)
      const op4: QueuedOperation = {
        id: 'op-4',
        type: 'UPDATE',
        table: 'expenses',
        data: { id: 'expense-2', amount: 40, description: 'Different expense' },
        timestamp: timestamp2,
        retryCount: 0
      }

      await offlineQueue.add(op1)
      await offlineQueue.add(op2)
      await offlineQueue.add(op3)
      await offlineQueue.add(op4)

      // Verify all operations are initially present
      const beforeDedup = await offlineQueue.getPending()
      expect(beforeDedup).toHaveLength(4)

      // Run deduplication
      await offlineQueue.deduplicateOperations()

      // Verify deduplication results
      const afterDedup = await offlineQueue.getPending()
      expect(afterDedup).toHaveLength(2) // Should keep latest for expense-1 and op4

      // Should keep the latest operation for expense-1
      const latestOp = afterDedup.find(op => op.data.id === 'expense-1')
      expect(latestOp).toBeTruthy()
      expect(latestOp?.data.amount).toBe(30)
      expect(latestOp?.data.description).toBe('Third update')
      expect(latestOp?.id).toBe('op-3')

      // Should keep the operation for expense-2
      const otherOp = afterDedup.find(op => op.data.id === 'expense-2')
      expect(otherOp).toBeTruthy()
      expect(otherOp?.data.amount).toBe(40)
      expect(otherOp?.id).toBe('op-4')
    })

    test('should handle mixed operation types during deduplication', async () => {
      const timestamp1 = Date.now()
      const timestamp2 = Date.now() + 1000

      // Add INSERT then UPDATE for same record
      const insertOp: QueuedOperation = {
        id: 'insert-op',
        type: 'INSERT',
        table: 'categories',
        data: { id: 'cat-1', name: 'New Category', color: '#000000' },
        timestamp: timestamp1,
        retryCount: 0
      }

      const updateOp: QueuedOperation = {
        id: 'update-op',
        type: 'UPDATE',
        table: 'categories',
        data: { id: 'cat-1', name: 'Updated Category', color: '#ffffff' },
        timestamp: timestamp2,
        retryCount: 0
      }

      // Add DELETE then INSERT for different record (should result in UPDATE)
      const deleteOp: QueuedOperation = {
        id: 'delete-op',
        type: 'DELETE',
        table: 'accounts',
        data: { id: 'acc-1' },
        timestamp: timestamp1,
        retryCount: 0
      }

      const reinsertOp: QueuedOperation = {
        id: 'reinsert-op',
        type: 'INSERT',
        table: 'accounts',
        data: { id: 'acc-1', name: 'Restored Account', balance: 100 },
        timestamp: timestamp2,
        retryCount: 0
      }

      await offlineQueue.add(insertOp)
      await offlineQueue.add(updateOp)
      await offlineQueue.add(deleteOp)
      await offlineQueue.add(reinsertOp)

      // Verify all operations are present
      const beforeDedup = await offlineQueue.getPending()
      expect(beforeDedup).toHaveLength(4)

      // Run deduplication
      await offlineQueue.deduplicateOperations()

      // Verify deduplication results
      const afterDedup = await offlineQueue.getPending()
      expect(afterDedup).toHaveLength(2)

      // Should merge INSERT+UPDATE into single INSERT with updated data
      const categoryOp = afterDedup.find(op => op.data.id === 'cat-1')
      expect(categoryOp).toBeTruthy()
      expect(categoryOp?.type).toBe('INSERT')
      expect(categoryOp?.data.name).toBe('Updated Category')
      expect(categoryOp?.data.color).toBe('#ffffff')

      // Should merge DELETE+INSERT into single UPDATE
      const accountOp = afterDedup.find(op => op.data.id === 'acc-1')
      expect(accountOp).toBeTruthy()
      expect(accountOp?.type).toBe('UPDATE')
      expect(accountOp?.data.name).toBe('Restored Account')
      expect(accountOp?.data.balance).toBe(100)
    })
  })

  describe('Queue Status and Management', () => {
    beforeEach(async () => {
      await offlineQueue.initialize()
    })

    test('should provide accurate queue status information', async () => {
      // Initial status should be empty
      const initialStatus = await offlineQueue.getStatus()
      expect(initialStatus.totalPending).toBe(0)
      expect(initialStatus.isProcessing).toBe(false)
      expect(initialStatus.lastProcessed).toBeNull()

      // Add operations
      const op1: QueuedOperation = {
        id: 'status-test-1',
        type: 'INSERT',
        table: 'expenses',
        data: { id: 'exp-1', amount: 10 },
        timestamp: Date.now(),
        retryCount: 0
      }

      const op2: QueuedOperation = {
        id: 'status-test-2',
        type: 'UPDATE',
        table: 'categories',
        data: { id: 'cat-1', name: 'Updated' },
        timestamp: Date.now(),
        retryCount: 1 // Failed operation
      }

      await offlineQueue.add(op1)
      await offlineQueue.add(op2)

      // Check status after adding operations
      const statusAfterAdd = await offlineQueue.getStatus()
      expect(statusAfterAdd.totalPending).toBe(2)
      expect(statusAfterAdd.isProcessing).toBe(false)

      // Simulate processing state
      offlineQueue.setProcessing(true)
      const statusDuringProcessing = await offlineQueue.getStatus()
      expect(statusDuringProcessing.isProcessing).toBe(true)

      // Test removal
      await offlineQueue.remove('status-test-1')
      const statusAfterRemoval = await offlineQueue.getStatus()
      expect(statusAfterRemoval.totalPending).toBe(1)

      // Clear processing state
      offlineQueue.setProcessing(false)
      const finalStatus = await offlineQueue.getStatus()
      expect(finalStatus.isProcessing).toBe(false)
    })

    test('should handle queue clearing correctly', async () => {
      // Add multiple operations
      const operations: QueuedOperation[] = [
        {
          id: 'clear-test-1',
          type: 'INSERT',
          table: 'expenses',
          data: { id: 'exp-1', amount: 10 },
          timestamp: Date.now(),
          retryCount: 0
        },
        {
          id: 'clear-test-2',
          type: 'UPDATE',
          table: 'categories',
          data: { id: 'cat-1', name: 'Test' },
          timestamp: Date.now(),
          retryCount: 0
        },
        {
          id: 'clear-test-3',
          type: 'DELETE',
          table: 'accounts',
          data: { id: 'acc-1' },
          timestamp: Date.now(),
          retryCount: 0
        }
      ]

      for (const op of operations) {
        await offlineQueue.add(op)
      }

      // Verify operations are present
      const beforeClear = await offlineQueue.getPending()
      expect(beforeClear).toHaveLength(3)

      // Clear the queue
      await offlineQueue.clear()

      // Verify queue is empty
      const afterClear = await offlineQueue.getPending()
      expect(afterClear).toHaveLength(0)

      // Verify status is reset
      const status = await offlineQueue.getStatus()
      expect(status.totalPending).toBe(0)
      expect(status.isProcessing).toBe(false)

      // Verify queue can still accept new operations
      const newOp: QueuedOperation = {
        id: 'post-clear-test',
        type: 'INSERT',
        table: 'expenses',
        data: { id: 'exp-new', amount: 25 },
        timestamp: Date.now(),
        retryCount: 0
      }

      await offlineQueue.add(newOp)
      const afterNewAdd = await offlineQueue.getPending()
      expect(afterNewAdd).toHaveLength(1)
      expect(afterNewAdd[0].id).toBe('post-clear-test')
    })

    test('should handle status change callbacks', async () => {
      const statusChanges: QueueStatus[] = []
      
      // Subscribe to status changes
      const unsubscribe = offlineQueue.onStatusChange((status: QueueStatus) => {
        statusChanges.push(status)
      })

      // Add operation (should trigger callback)
      const op: QueuedOperation = {
        id: 'callback-test',
        type: 'INSERT',
        table: 'expenses',
        data: { id: 'exp-1', amount: 10 },
        timestamp: Date.now(),
        retryCount: 0
      }

      await offlineQueue.add(op)

      // Change processing state (should trigger callback)
      offlineQueue.setProcessing(true)
      await new Promise(resolve => setTimeout(resolve, 50)) // Allow callback to fire

      offlineQueue.setProcessing(false)
      await new Promise(resolve => setTimeout(resolve, 50)) // Allow callback to fire

      // Remove operation (should trigger callback)
      await offlineQueue.remove('callback-test')

      // Verify callbacks were called
      expect(statusChanges.length).toBeGreaterThan(0)
      
      // Verify callback data accuracy
      const hasAddCallback = statusChanges.some(status => status.totalPending === 1)
      const hasRemoveCallback = statusChanges.some(status => status.totalPending === 0)
      
      expect(hasAddCallback).toBe(true)
      expect(hasRemoveCallback).toBe(true)

      // Test unsubscribe
      unsubscribe()
      const initialChangeCount = statusChanges.length

      // Add another operation
      const op2: QueuedOperation = {
        id: 'unsubscribe-test',
        type: 'INSERT',
        table: 'expenses',
        data: { id: 'exp-2', amount: 20 },
        timestamp: Date.now(),
        retryCount: 0
      }

      await offlineQueue.add(op2)
      await new Promise(resolve => setTimeout(resolve, 50))

      // Should not have triggered more callbacks
      expect(statusChanges.length).toBe(initialChangeCount)
    })
  })

  describe('Error Handling and Recovery', () => {
    beforeEach(async () => {
      await offlineQueue.initialize()
    })

    test('should handle initialization failure gracefully', async () => {
      // Mock IndexedDB failure
      const originalIndexedDB = global.indexedDB
      global.indexedDB = {
        open: jest.fn(() => {
          throw new Error('IndexedDB unavailable')
        })
      } as any

      // Create new queue instance
      const newQueue = new (offlineQueue.constructor as any)()
      
      // Should handle initialization failure gracefully
      const result = await newQueue.initialize()
      expect(result).toBe(false)

      // Restore IndexedDB
      global.indexedDB = originalIndexedDB
    })

    test('should handle operation with invalid data gracefully', async () => {
      // Try to add operation with invalid data
      const invalidOp = {
        id: 'invalid-test',
        type: 'INVALID_TYPE',
        table: null,
        data: undefined,
        timestamp: 'invalid-timestamp',
        retryCount: 'invalid-retry-count'
      } as any

      // Should not throw error
      await expect(offlineQueue.add(invalidOp)).resolves.not.toThrow()

      // Should not add invalid operation to queue
      const pending = await offlineQueue.getPending()
      expect(pending.find(op => op.id === 'invalid-test')).toBeFalsy()
    })

    test('should handle concurrent operations correctly', async () => {
      // Create multiple operations to add concurrently
      const operations = Array.from({ length: 10 }, (_, i) => ({
        id: `concurrent-${i}`,
        type: 'INSERT' as const,
        table: 'expenses',
        data: { id: `exp-${i}`, amount: i * 10 },
        timestamp: Date.now() + i,
        retryCount: 0
      }))

      // Add all operations concurrently
      const promises = operations.map(op => offlineQueue.add(op))
      await Promise.all(promises)

      // Verify all operations were added
      const pending = await offlineQueue.getPending()
      expect(pending).toHaveLength(10)

      // Verify all operations have correct data
      for (let i = 0; i < 10; i++) {
        const op = pending.find(p => p.id === `concurrent-${i}`)
        expect(op).toBeTruthy()
        expect(op?.data.amount).toBe(i * 10)
      }
    })
  })

  describe('Data Integrity and Consistency', () => {
    beforeEach(async () => {
      await offlineQueue.initialize()
    })

    test('should maintain data integrity across operations', async () => {
      // Add operation with complex data structure
      const complexOp: QueuedOperation = {
        id: 'complex-test',
        type: 'INSERT',
        table: 'expenses',
        data: {
          id: 'exp-complex',
          amount: 123.45,
          description: 'Complex expense with "quotes" and special chars: àáâãäå',
          categoryId: 'cat-special',
          accountId: 'acc-special',
          date: new Date('2023-12-25T10:30:00.000Z').toISOString(),
          tags: ['business', 'travel', 'urgent'],
          metadata: {
            source: 'mobile',
            location: { lat: 40.7128, lng: -74.0060 },
            receipt: { url: 'https://example.com/receipt.pdf', verified: true }
          }
        },
        timestamp: Date.now(),
        retryCount: 0
      }

      await offlineQueue.add(complexOp)

      // Retrieve and verify data integrity
      const pending = await offlineQueue.getPending()
      const retrieved = pending.find(op => op.id === 'complex-test')

      expect(retrieved).toBeTruthy()
      expect(retrieved?.data.amount).toBe(123.45)
      expect(retrieved?.data.description).toBe('Complex expense with "quotes" and special chars: àáâãäå')
      expect(retrieved?.data.tags).toEqual(['business', 'travel', 'urgent'])
      expect(retrieved?.data.metadata.location.lat).toBe(40.7128)
      expect(retrieved?.data.metadata.receipt.verified).toBe(true)
    })

    test('should handle large data volumes correctly', async () => {
      // Create large dataset
      const largeOperations: QueuedOperation[] = []
      const operationCount = 100

      for (let i = 0; i < operationCount; i++) {
        largeOperations.push({
          id: `large-${i}`,
          type: 'INSERT',
          table: 'expenses',
          data: {
            id: `exp-${i}`,
            amount: Math.round(Math.random() * 1000 * 100) / 100,
            description: `Large dataset expense ${i}`.repeat(10), // Make description longer
            categoryId: `cat-${i % 10}`,
            date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
            tags: Array.from({ length: Math.floor(Math.random() * 5) + 1 }, (_, j) => `tag-${j}`)
          },
          timestamp: Date.now() + i,
          retryCount: 0
        })
      }

      // Add all operations
      for (const op of largeOperations) {
        await offlineQueue.add(op)
      }

      // Verify all operations were added
      const pending = await offlineQueue.getPending()
      expect(pending).toHaveLength(operationCount)

      // Verify queue status
      const status = await offlineQueue.getStatus()
      expect(status.totalPending).toBe(operationCount)

      // Test deduplication with large dataset
      const startTime = Date.now()
      await offlineQueue.deduplicateOperations()
      const deduplicationTime = Date.now() - startTime

      // Should complete in reasonable time (less than 5 seconds)
      expect(deduplicationTime).toBeLessThan(5000)

      // Should still have all operations (no duplicates to remove)
      const afterDedup = await offlineQueue.getPending()
      expect(afterDedup).toHaveLength(operationCount)
    })
  })
})
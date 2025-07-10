/**
 * Conflict Resolution Tests
 * Tests for the two-user conflict resolution system
 */

import { conflictResolver, ConflictContext, ConflictResolutionResult } from '@/lib/conflict-resolver'
import { Expense, Category, Account } from '@/lib/types'

describe('Conflict Resolution Tests', () => {
  beforeEach(() => {
    // Reset any internal state
    conflictResolver.clearHistory()
  })

  describe('Concurrent Edit Resolution', () => {
    test('should resolve expense conflicts with field-level merging', async () => {
      const originalExpense: Expense = {
        id: 'exp-1',
        amount: 25.50,
        description: 'Original Coffee',
        categoryId: 'cat-food',
        accountId: 'acc-checking',
        date: '2023-12-01T10:00:00.000Z'
      }

      const localExpense: Expense = {
        id: 'exp-1',
        amount: 30.00, // User 1 changed amount
        description: 'Original Coffee',
        categoryId: 'cat-food',
        accountId: 'acc-checking',
        date: '2023-12-01T10:00:00.000Z'
      }

      const remoteExpense: Expense = {
        id: 'exp-1',
        amount: 25.50,
        description: 'Updated Coffee Description', // User 2 changed description
        categoryId: 'cat-food',
        accountId: 'acc-checking',
        date: '2023-12-01T10:00:00.000Z'
      }

      const conflictContext: ConflictContext = {
        tableName: 'expenses',
        operation: 'UPDATE',
        localData: localExpense,
        remoteData: remoteExpense,
        localTimestamp: Date.now(),
        remoteTimestamp: Date.now() - 1000 // Remote is older
      }

      const result = await conflictResolver.resolveConflict(conflictContext)

      // Should use smart field-level merging
      expect(result.resolved.amount).toBe(30.00) // Local change wins (newer)
      expect(result.resolved.description).toBe('Updated Coffee Description') // Remote change preserved
      expect(result.strategy).toBe('field-level-merge')
    })

    test('should handle simultaneous edits to same field', async () => {
      const localExpense: Expense = {
        id: 'exp-1',
        amount: 30.00,
        description: 'Local Edit',
        categoryId: 'cat-food',
        accountId: 'acc-checking',
        date: '2023-12-01T10:00:00.000Z'
      }

      const remoteExpense: Expense = {
        id: 'exp-1',
        amount: 35.00,
        description: 'Remote Edit',
        categoryId: 'cat-food',
        accountId: 'acc-checking',
        date: '2023-12-01T10:00:00.000Z'
      }

      const conflictContext: ConflictContext = {
        tableName: 'expenses',
        operation: 'UPDATE',
        localData: localExpense,
        remoteData: remoteExpense,
        localTimestamp: Date.now(),
        remoteTimestamp: Date.now() - 5000 // Remote is older
      }

      const result = await conflictResolver.resolveConflict(conflictContext)

      // Should use last-write-wins for conflicting fields
      expect(result.resolved.amount).toBe(30.00) // Local wins (newer)
      expect(result.resolved.description).toBe('Local Edit') // Local wins (newer)
      expect(result.strategy).toBe('last-write-wins')
    })

    test('should handle duplicate category creation', async () => {
      const localCategory: Category = {
        id: 'cat-local-1',
        name: 'Food & Dining',
        color: '#ff0000'
      }

      const remoteCategory: Category = {
        id: 'cat-remote-1',
        name: 'Food & Dining', // Same name
        color: '#00ff00'
      }

      const conflictContext: ConflictContext = {
        tableName: 'categories',
        operation: 'INSERT',
        localData: localCategory,
        remoteData: remoteCategory,
        localTimestamp: Date.now(),
        remoteTimestamp: Date.now() - 1000
      }

      const result = await conflictResolver.resolveConflict(conflictContext)

      // Should handle duplicate by renaming
      expect(result.resolved.name).toBe('Food & Dining (2)')
      expect(result.resolved.id).toBe('cat-local-1')
      expect(result.strategy).toBe('duplicate-rename')
    })

    test('should preserve account balance integrity', async () => {
      const localAccount: Account = {
        id: 'acc-1',
        name: 'Checking Account',
        type: 'checking',
        balance: 1000.00 // Local balance
      }

      const remoteAccount: Account = {
        id: 'acc-1',
        name: 'Checking Account',
        type: 'checking',
        balance: 950.00 // Remote balance (different)
      }

      const conflictContext: ConflictContext = {
        tableName: 'accounts',
        operation: 'UPDATE',
        localData: localAccount,
        remoteData: remoteAccount,
        localTimestamp: Date.now() - 2000,
        remoteTimestamp: Date.now() - 1000 // Remote is newer
      }

      const result = await conflictResolver.resolveConflict(conflictContext)

      // Should use last-write-wins for balance (newer remote)
      expect(result.resolved.balance).toBe(950.00)
      expect(result.strategy).toBe('last-write-wins')
    })
  })

  describe('Conflict Resolution Strategies', () => {
    test('should use last-write-wins for most conflicts', async () => {
      const localData = {
        id: 'test-1',
        value: 'local-value',
        timestamp: Date.now()
      }

      const remoteData = {
        id: 'test-1',
        value: 'remote-value',
        timestamp: Date.now() - 5000 // Older
      }

      const conflictContext: ConflictContext = {
        tableName: 'expenses',
        operation: 'UPDATE',
        localData,
        remoteData,
        localTimestamp: Date.now(),
        remoteTimestamp: Date.now() - 5000
      }

      const result = await conflictResolver.resolveConflict(conflictContext)

      // Local should win (newer)
      expect(result.resolved.value).toBe('local-value')
      expect(result.strategy).toBe('last-write-wins')
    })

    test('should log conflict resolution for debugging', async () => {
      const conflictContext: ConflictContext = {
        tableName: 'expenses',
        operation: 'UPDATE',
        localData: { id: 'test-1', value: 'local' },
        remoteData: { id: 'test-1', value: 'remote' },
        localTimestamp: Date.now(),
        remoteTimestamp: Date.now() - 1000
      }

      await conflictResolver.resolveConflict(conflictContext)

      // Should have logged the conflict
      const conflictHistory = conflictResolver.getConflictHistory()
      expect(conflictHistory).toHaveLength(1)
      expect(conflictHistory[0].tableName).toBe('expenses')
      expect(conflictHistory[0].operation).toBe('UPDATE')
    })

    test('should preserve data integrity during resolution', async () => {
      const localExpense: Expense = {
        id: 'exp-1',
        amount: 25.50,
        description: 'Test Expense',
        categoryId: 'cat-1',
        accountId: 'acc-1',
        date: '2023-12-01T10:00:00.000Z'
      }

      const remoteExpense: Expense = {
        id: 'exp-1',
        amount: 30.00,
        description: 'Test Expense',
        categoryId: 'cat-1',
        accountId: 'acc-1',
        date: '2023-12-01T10:00:00.000Z'
      }

      const conflictContext: ConflictContext = {
        tableName: 'expenses',
        operation: 'UPDATE',
        localData: localExpense,
        remoteData: remoteExpense,
        localTimestamp: Date.now() - 1000,
        remoteTimestamp: Date.now() // Remote is newer
      }

      const result = await conflictResolver.resolveConflict(conflictContext)

      // Should preserve all required fields
      expect(result.resolved.id).toBe('exp-1')
      expect(result.resolved.categoryId).toBe('cat-1')
      expect(result.resolved.accountId).toBe('acc-1')
      expect(result.resolved.date).toBe('2023-12-01T10:00:00.000Z')
      expect(typeof result.resolved.amount).toBe('number')
      expect(typeof result.resolved.description).toBe('string')
    })

    test('should handle edge cases gracefully', async () => {
      // Test with missing fields
      const localData = {
        id: 'test-1',
        value: 'local'
        // Missing some fields
      }

      const remoteData = {
        id: 'test-1',
        value: 'remote',
        extraField: 'extra'
      }

      const conflictContext: ConflictContext = {
        tableName: 'expenses',
        operation: 'UPDATE',
        localData,
        remoteData,
        localTimestamp: Date.now(),
        remoteTimestamp: Date.now() - 1000
      }

      const result = await conflictResolver.resolveConflict(conflictContext)

      // Should handle gracefully without crashing
      expect(result.resolved.id).toBe('test-1')
      expect(result.resolved.value).toBe('local') // Local wins
      expect(result.strategy).toBeDefined()
    })
  })

  describe('Two-User Scenario Handling', () => {
    test('should handle rapid alternating edits', async () => {
      const conflicts = []

      // Simulate rapid alternating edits
      for (let i = 0; i < 10; i++) {
        const isLocalNewer = i % 2 === 0
        const conflictContext: ConflictContext = {
          tableName: 'expenses',
          operation: 'UPDATE',
          localData: { id: 'exp-1', value: `local-${i}` },
          remoteData: { id: 'exp-1', value: `remote-${i}` },
          localTimestamp: Date.now() + (isLocalNewer ? 1000 : -1000),
          remoteTimestamp: Date.now() + (isLocalNewer ? -1000 : 1000)
        }

        const result = await conflictResolver.resolveConflict(conflictContext)
        conflicts.push(result)
      }

      // Should handle all conflicts without errors
      expect(conflicts).toHaveLength(10)
      conflicts.forEach(conflict => {
        expect(conflict.resolved).toBeDefined()
        expect(conflict.strategy).toBeDefined()
      })
    })

    test('should maintain consistent conflict resolution', async () => {
      const baseContext = {
        tableName: 'expenses',
        operation: 'UPDATE' as const,
        localData: { id: 'exp-1', value: 'local' },
        remoteData: { id: 'exp-1', value: 'remote' },
        localTimestamp: Date.now(),
        remoteTimestamp: Date.now() - 1000
      }

      // Resolve same conflict multiple times
      const results = await Promise.all([
        conflictResolver.resolveConflict(baseContext),
        conflictResolver.resolveConflict(baseContext),
        conflictResolver.resolveConflict(baseContext)
      ])

      // Should have consistent results
      expect(results[0].resolved.value).toBe(results[1].resolved.value)
      expect(results[1].resolved.value).toBe(results[2].resolved.value)
      expect(results[0].strategy).toBe(results[1].strategy)
      expect(results[1].strategy).toBe(results[2].strategy)
    })

    test('should handle concurrent different operations', async () => {
      // Different operations happening simultaneously
      const insertContext: ConflictContext = {
        tableName: 'expenses',
        operation: 'INSERT',
        localData: { id: 'exp-1', value: 'local-insert' },
        remoteData: { id: 'exp-1', value: 'remote-insert' },
        localTimestamp: Date.now(),
        remoteTimestamp: Date.now() - 1000
      }

      const updateContext: ConflictContext = {
        tableName: 'expenses',
        operation: 'UPDATE',
        localData: { id: 'exp-2', value: 'local-update' },
        remoteData: { id: 'exp-2', value: 'remote-update' },
        localTimestamp: Date.now(),
        remoteTimestamp: Date.now() - 1000
      }

      const [insertResult, updateResult] = await Promise.all([
        conflictResolver.resolveConflict(insertContext),
        conflictResolver.resolveConflict(updateContext)
      ])

      // Should handle both operations correctly
      expect(insertResult.resolved.value).toBe('local-insert')
      expect(updateResult.resolved.value).toBe('local-update')
    })
  })

  describe('Conflict Statistics and Monitoring', () => {
    test('should track conflict statistics', async () => {
      const initialStats = conflictResolver.getConflictStats()
      expect(initialStats.totalConflicts).toBe(0)

      // Create some conflicts
      const contexts = [
        {
          tableName: 'expenses',
          operation: 'UPDATE' as const,
          localData: { id: 'exp-1', value: 'local-1' },
          remoteData: { id: 'exp-1', value: 'remote-1' },
          localTimestamp: Date.now(),
          remoteTimestamp: Date.now() - 1000
        },
        {
          tableName: 'categories',
          operation: 'UPDATE' as const,
          localData: { id: 'cat-1', value: 'local-2' },
          remoteData: { id: 'cat-1', value: 'remote-2' },
          localTimestamp: Date.now(),
          remoteTimestamp: Date.now() - 1000
        }
      ]

      await Promise.all(contexts.map(ctx => conflictResolver.resolveConflict(ctx)))

      const stats = conflictResolver.getConflictStats()
      expect(stats.totalConflicts).toBe(2)
      expect(stats.resolvedConflicts).toBe(2)
    })

    test('should provide conflict breakdown by table', async () => {
      // Create conflicts in different tables
      const contexts = [
        {
          tableName: 'expenses',
          operation: 'UPDATE' as const,
          localData: { id: 'exp-1', value: 'local' },
          remoteData: { id: 'exp-1', value: 'remote' },
          localTimestamp: Date.now(),
          remoteTimestamp: Date.now() - 1000
        },
        {
          tableName: 'expenses',
          operation: 'UPDATE' as const,
          localData: { id: 'exp-2', value: 'local' },
          remoteData: { id: 'exp-2', value: 'remote' },
          localTimestamp: Date.now(),
          remoteTimestamp: Date.now() - 1000
        },
        {
          tableName: 'categories',
          operation: 'INSERT' as const,
          localData: { id: 'cat-1', value: 'local' },
          remoteData: { id: 'cat-1', value: 'remote' },
          localTimestamp: Date.now(),
          remoteTimestamp: Date.now() - 1000
        }
      ]

      await Promise.all(contexts.map(ctx => conflictResolver.resolveConflict(ctx)))

      const stats = conflictResolver.getConflictStats()
      expect(stats.byTable.expenses).toBe(2)
      expect(stats.byTable.categories).toBe(1)
    })

    test('should track recent conflicts', async () => {
      const oldTimestamp = Date.now() - 24 * 60 * 60 * 1000 // 24 hours ago
      const recentTimestamp = Date.now() - 60 * 1000 // 1 minute ago

      // Create old conflict
      await conflictResolver.resolveConflict({
        tableName: 'expenses',
        operation: 'UPDATE',
        localData: { id: 'exp-1', value: 'local' },
        remoteData: { id: 'exp-1', value: 'remote' },
        localTimestamp: oldTimestamp,
        remoteTimestamp: oldTimestamp - 1000
      })

      // Create recent conflict
      await conflictResolver.resolveConflict({
        tableName: 'expenses',
        operation: 'UPDATE',
        localData: { id: 'exp-2', value: 'local' },
        remoteData: { id: 'exp-2', value: 'remote' },
        localTimestamp: recentTimestamp,
        remoteTimestamp: recentTimestamp - 1000
      })

      const stats = conflictResolver.getConflictStats()
      expect(stats.totalConflicts).toBe(2)
      expect(stats.recentConflicts).toBe(1) // Only recent ones
    })
  })

  describe('Complex Conflict Scenarios', () => {
    test('should handle nested object conflicts', async () => {
      const localData = {
        id: 'exp-1',
        metadata: {
          tags: ['business', 'travel'],
          location: { city: 'New York', state: 'NY' }
        },
        amount: 100.00
      }

      const remoteData = {
        id: 'exp-1',
        metadata: {
          tags: ['business', 'meals'],
          location: { city: 'Boston', state: 'MA' }
        },
        amount: 100.00
      }

      const conflictContext: ConflictContext = {
        tableName: 'expenses',
        operation: 'UPDATE',
        localData,
        remoteData,
        localTimestamp: Date.now(),
        remoteTimestamp: Date.now() - 1000
      }

      const result = await conflictResolver.resolveConflict(conflictContext)

      // Should handle nested objects
      expect(result.resolved.id).toBe('exp-1')
      expect(result.resolved.metadata).toBeDefined()
      expect(result.strategy).toBeDefined()
    })

    test('should handle conflicts with missing IDs', async () => {
      const localData = {
        // Missing ID
        value: 'local-value',
        timestamp: Date.now()
      }

      const remoteData = {
        id: 'remote-1',
        value: 'remote-value',
        timestamp: Date.now() - 1000
      }

      const conflictContext: ConflictContext = {
        tableName: 'expenses',
        operation: 'INSERT',
        localData,
        remoteData,
        localTimestamp: Date.now(),
        remoteTimestamp: Date.now() - 1000
      }

      const result = await conflictResolver.resolveConflict(conflictContext)

      // Should handle missing ID gracefully
      expect(result.resolved).toBeDefined()
      expect(result.strategy).toBeDefined()
    })

    test('should handle timestamp conflicts', async () => {
      const localData = {
        id: 'exp-1',
        value: 'local',
        created_at: '2023-12-01T10:00:00.000Z',
        updated_at: '2023-12-01T11:00:00.000Z'
      }

      const remoteData = {
        id: 'exp-1',
        value: 'remote',
        created_at: '2023-12-01T10:00:00.000Z',
        updated_at: '2023-12-01T10:30:00.000Z'
      }

      const conflictContext: ConflictContext = {
        tableName: 'expenses',
        operation: 'UPDATE',
        localData,
        remoteData,
        localTimestamp: Date.now(),
        remoteTimestamp: Date.now() - 1000
      }

      const result = await conflictResolver.resolveConflict(conflictContext)

      // Should preserve timestamps correctly
      expect(result.resolved.created_at).toBe('2023-12-01T10:00:00.000Z')
      expect(result.resolved.updated_at).toBeDefined()
    })
  })

  describe('Error Handling and Recovery', () => {
    test('should handle malformed data gracefully', async () => {
      const conflictContext: ConflictContext = {
        tableName: 'expenses',
        operation: 'UPDATE',
        localData: null as any,
        remoteData: { id: 'exp-1', value: 'remote' },
        localTimestamp: Date.now(),
        remoteTimestamp: Date.now() - 1000
      }

      // Should not throw error
      const result = await conflictResolver.resolveConflict(conflictContext)
      expect(result.resolved).toBeDefined()
      expect(result.strategy).toBeDefined()
    })

    test('should handle invalid timestamps', async () => {
      const conflictContext: ConflictContext = {
        tableName: 'expenses',
        operation: 'UPDATE',
        localData: { id: 'exp-1', value: 'local' },
        remoteData: { id: 'exp-1', value: 'remote' },
        localTimestamp: NaN,
        remoteTimestamp: 'invalid' as any
      }

      // Should handle invalid timestamps gracefully
      const result = await conflictResolver.resolveConflict(conflictContext)
      expect(result.resolved).toBeDefined()
      expect(result.strategy).toBeDefined()
    })

    test('should handle circular references', async () => {
      const localData: any = { id: 'exp-1', value: 'local' }
      localData.self = localData // Circular reference

      const remoteData = { id: 'exp-1', value: 'remote' }

      const conflictContext: ConflictContext = {
        tableName: 'expenses',
        operation: 'UPDATE',
        localData,
        remoteData,
        localTimestamp: Date.now(),
        remoteTimestamp: Date.now() - 1000
      }

      // Should handle circular references without stack overflow
      const result = await conflictResolver.resolveConflict(conflictContext)
      expect(result.resolved).toBeDefined()
      expect(result.resolved.id).toBe('exp-1')
    })
  })

  describe('Performance and Scalability', () => {
    test('should handle many conflicts efficiently', async () => {
      const conflicts = Array.from({ length: 100 }, (_, i) => ({
        tableName: 'expenses',
        operation: 'UPDATE' as const,
        localData: { id: `exp-${i}`, value: `local-${i}` },
        remoteData: { id: `exp-${i}`, value: `remote-${i}` },
        localTimestamp: Date.now() + i,
        remoteTimestamp: Date.now() + i - 1000
      }))

      const startTime = Date.now()
      const results = await Promise.all(
        conflicts.map(ctx => conflictResolver.resolveConflict(ctx))
      )
      const endTime = Date.now()

      // Should complete within reasonable time (less than 1 second)
      expect(endTime - startTime).toBeLessThan(1000)
      expect(results).toHaveLength(100)
      results.forEach(result => {
        expect(result.resolved).toBeDefined()
        expect(result.strategy).toBeDefined()
      })
    })

    test('should maintain memory efficiency', async () => {
      // Create many conflicts to test memory usage
      for (let i = 0; i < 1000; i++) {
        await conflictResolver.resolveConflict({
          tableName: 'expenses',
          operation: 'UPDATE',
          localData: { id: `exp-${i}`, value: `local-${i}` },
          remoteData: { id: `exp-${i}`, value: `remote-${i}` },
          localTimestamp: Date.now(),
          remoteTimestamp: Date.now() - 1000
        })
      }

      // Should not run out of memory
      const stats = conflictResolver.getConflictStats()
      expect(stats.totalConflicts).toBe(1000)
    })

    test('should handle concurrent conflict resolution', async () => {
      const conflictPromises = Array.from({ length: 50 }, (_, i) => 
        conflictResolver.resolveConflict({
          tableName: 'expenses',
          operation: 'UPDATE',
          localData: { id: `exp-${i}`, value: `local-${i}` },
          remoteData: { id: `exp-${i}`, value: `remote-${i}` },
          localTimestamp: Date.now(),
          remoteTimestamp: Date.now() - 1000
        })
      )

      const results = await Promise.all(conflictPromises)

      // Should handle concurrent resolution without errors
      expect(results).toHaveLength(50)
      results.forEach(result => {
        expect(result.resolved).toBeDefined()
        expect(result.strategy).toBeDefined()
      })
    })
  })

  describe('History and Cleanup', () => {
    test('should maintain conflict history', async () => {
      await conflictResolver.resolveConflict({
        tableName: 'expenses',
        operation: 'UPDATE',
        localData: { id: 'exp-1', value: 'local' },
        remoteData: { id: 'exp-1', value: 'remote' },
        localTimestamp: Date.now(),
        remoteTimestamp: Date.now() - 1000
      })

      const history = conflictResolver.getConflictHistory()
      expect(history).toHaveLength(1)
      expect(history[0].tableName).toBe('expenses')
      expect(history[0].operation).toBe('UPDATE')
      expect(history[0].resolved).toBeDefined()
    })

    test('should limit history size', async () => {
      // Create more conflicts than history limit
      for (let i = 0; i < 150; i++) {
        await conflictResolver.resolveConflict({
          tableName: 'expenses',
          operation: 'UPDATE',
          localData: { id: `exp-${i}`, value: `local-${i}` },
          remoteData: { id: `exp-${i}`, value: `remote-${i}` },
          localTimestamp: Date.now(),
          remoteTimestamp: Date.now() - 1000
        })
      }

      const history = conflictResolver.getConflictHistory()
      expect(history.length).toBeLessThanOrEqual(100) // Should limit history
    })

    test('should clear history when requested', async () => {
      await conflictResolver.resolveConflict({
        tableName: 'expenses',
        operation: 'UPDATE',
        localData: { id: 'exp-1', value: 'local' },
        remoteData: { id: 'exp-1', value: 'remote' },
        localTimestamp: Date.now(),
        remoteTimestamp: Date.now() - 1000
      })

      expect(conflictResolver.getConflictHistory()).toHaveLength(1)

      conflictResolver.clearHistory()

      expect(conflictResolver.getConflictHistory()).toHaveLength(0)
      expect(conflictResolver.getConflictStats().totalConflicts).toBe(0)
    })
  })
})
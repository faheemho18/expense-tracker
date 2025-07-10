/**
 * Conflict Resolver Functional Tests
 * Tests to validate actual conflict resolution functionality
 */

import { conflictResolver, ConflictContext } from '@/lib/conflict-resolver'

describe('Conflict Resolver Functional Validation', () => {
  beforeEach(() => {
    // Clear any existing conflict history
    conflictResolver.clearHistory()
  })

  describe('Two-User Expense Conflicts', () => {
    test('should resolve real expense edit conflict', async () => {
      // Simulate real two-user conflict scenario
      const conflictContext: ConflictContext = {
        tableName: 'expenses',
        operation: 'UPDATE',
        localData: {
          id: 'exp-1',
          amount: 30.00,
          description: 'Coffee from Local User',
          categoryId: 'cat-1',
          date: '2025-01-15T10:30:00Z',
          updated_at: '2025-01-15T10:35:00Z' // Local is newer
        },
        remoteData: {
          id: 'exp-1',
          amount: 25.00,
          description: 'Coffee from Remote User',
          categoryId: 'cat-2',
          date: '2025-01-15T10:30:00Z',
          updated_at: '2025-01-15T10:32:00Z' // Remote is older
        },
        localTimestamp: new Date('2025-01-15T10:35:00Z').getTime(),
        remoteTimestamp: new Date('2025-01-15T10:32:00Z').getTime()
      }

      // Resolve the conflict
      const result = await conflictResolver.resolveConflict(conflictContext)

      // Validate resolution
      expect(result).toBeDefined()
      expect(result.resolved).toBeDefined()
      expect(result.strategy).toBeDefined()
      expect(result.metadata).toBeDefined()
      expect(result.metadata.conflictId).toBeDefined()

      // Verify actual resolution logic works
      expect(result.resolved.id).toBe('exp-1')
      expect(typeof result.resolved.amount).toBe('number')
      expect(typeof result.resolved.description).toBe('string')
      
      console.log('Conflict resolution result:', {
        strategy: result.strategy,
        resolved: result.resolved,
        conflictId: result.metadata.conflictId,
        conflictType: result.conflictType
      })
    })

    test('should handle amount vs description conflict intelligently', async () => {
      const conflictContext: ConflictContext = {
        tableName: 'expenses',
        operation: 'UPDATE',
        localData: {
          id: 'exp-2',
          amount: 45.00, // User A changed amount
          description: 'Lunch',
          categoryId: 'cat-1',
          updated_at: '2025-01-15T12:00:00Z'
        },
        remoteData: {
          id: 'exp-2',
          amount: 40.00,
          description: 'Business Lunch with Client', // User B added detail
          categoryId: 'cat-1',
          updated_at: '2025-01-15T12:01:00Z' // Remote is slightly newer
        },
        localTimestamp: new Date('2025-01-15T12:00:00Z').getTime(),
        remoteTimestamp: new Date('2025-01-15T12:01:00Z').getTime()
      }

      const result = await conflictResolver.resolveConflict(conflictContext)

      // Verify remote wins (newer timestamp)
      expect(result.resolved.description).toBe('Business Lunch with Client')
      
      // Log for analysis
      console.log('Amount vs Description conflict:', {
        localAmount: conflictContext.localData.amount,
        remoteAmount: conflictContext.remoteData.amount,
        resolvedAmount: result.resolved.amount,
        resolvedDescription: result.resolved.description,
        strategy: result.strategy
      })
    })
  })

  describe('Category Creation Conflicts', () => {
    test('should handle duplicate category creation', async () => {
      const conflictContext: ConflictContext = {
        tableName: 'categories',
        operation: 'INSERT',
        localData: {
          id: 'cat-local-1',
          name: 'Dining Out',
          color: '#ff5733'
        },
        remoteData: {
          id: 'cat-remote-1',
          name: 'Dining Out', // Same name, different ID
          color: '#33ff57'
        },
        localTimestamp: Date.now(),
        remoteTimestamp: Date.now() - 1000
      }

      const result = await conflictResolver.resolveConflict(conflictContext)

      // Should handle duplicate names
      expect(result.resolved).toBeDefined()
      expect(result.resolved.id).toBe('cat-local-1') // Local should win
      
      console.log('Duplicate category resolution:', {
        strategy: result.strategy,
        resolvedName: result.resolved.name,
        resolvedId: result.resolved.id
      })
    })
  })

  describe('Account Balance Conflicts', () => {
    test('should preserve account balance integrity', async () => {
      const conflictContext: ConflictContext = {
        tableName: 'accounts',
        operation: 'UPDATE',
        localData: {
          id: 'acc-1',
          name: 'Checking Account',
          balance: 1000.00, // Local balance
          updated_at: '2025-01-15T14:00:00Z'
        },
        remoteData: {
          id: 'acc-1',
          name: 'Primary Checking',
          balance: 950.00, // Remote balance (after expense)
          updated_at: '2025-01-15T14:01:00Z' // Remote is newer
        },
        localTimestamp: new Date('2025-01-15T14:00:00Z').getTime(),
        remoteTimestamp: new Date('2025-01-15T14:01:00Z').getTime()
      }

      const result = await conflictResolver.resolveConflict(conflictContext)

      // Should use remote balance (newer)
      expect(result.resolved.balance).toBe(950.00)
      expect(result.resolved.name).toBe('Primary Checking')
      
      console.log('Account balance conflict:', {
        localBalance: conflictContext.localData.balance,
        remoteBalance: conflictContext.remoteData.balance,
        resolvedBalance: result.resolved.balance,
        strategy: result.strategy
      })
    })
  })

  describe('Conflict Statistics and History', () => {
    test('should track conflict statistics accurately', async () => {
      // Create multiple conflicts to test statistics
      const conflicts = [
        {
          tableName: 'expenses',
          operation: 'UPDATE' as const,
          localData: { id: 'exp-1', amount: 10 },
          remoteData: { id: 'exp-1', amount: 15 },
          localTimestamp: Date.now(),
          remoteTimestamp: Date.now() - 1000
        },
        {
          tableName: 'categories',
          operation: 'INSERT' as const,
          localData: { id: 'cat-1', name: 'Food' },
          remoteData: { id: 'cat-2', name: 'Food' },
          localTimestamp: Date.now(),
          remoteTimestamp: Date.now() - 1000
        }
      ]

      // Resolve all conflicts
      for (const conflict of conflicts) {
        await conflictResolver.resolveConflict(conflict)
      }

      // Check statistics
      const stats = conflictResolver.getConflictStats()
      expect(stats.totalConflicts).toBeGreaterThanOrEqual(2)
      
      console.log('Conflict statistics:', stats)
    })

    test('should maintain conflict history', async () => {
      const conflictContext: ConflictContext = {
        tableName: 'expenses',
        operation: 'UPDATE',
        localData: { id: 'exp-history', amount: 20 },
        remoteData: { id: 'exp-history', amount: 25 },
        localTimestamp: Date.now(),
        remoteTimestamp: Date.now() - 1000
      }

      await conflictResolver.resolveConflict(conflictContext)

      const history = conflictResolver.getConflictHistory()
      expect(history.length).toBeGreaterThan(0)
      
      const lastConflict = history[history.length - 1]
      expect(lastConflict.tableName).toBe('expenses')
      
      console.log('Conflict history entry:', lastConflict)
    })
  })

  describe('Edge Cases and Error Handling', () => {
    test('should handle missing timestamps gracefully', async () => {
      const conflictContext: ConflictContext = {
        tableName: 'expenses',
        operation: 'UPDATE',
        localData: { id: 'exp-no-timestamp', amount: 30 },
        remoteData: { id: 'exp-no-timestamp', amount: 35 },
        localTimestamp: Date.now(),
        remoteTimestamp: 0 // Missing/invalid timestamp
      }

      const result = await conflictResolver.resolveConflict(conflictContext)
      
      // Should not crash and should provide a resolution
      expect(result).toBeDefined()
      expect(result.resolved).toBeDefined()
      
      console.log('Missing timestamp resolution:', {
        strategy: result.strategy,
        resolved: result.resolved
      })
    })

    test('should handle malformed data gracefully', async () => {
      const conflictContext: ConflictContext = {
        tableName: 'expenses',
        operation: 'UPDATE',
        localData: null as any, // Malformed data
        remoteData: { id: 'exp-malformed', amount: 40 },
        localTimestamp: Date.now(),
        remoteTimestamp: Date.now() - 1000
      }

      // Should not crash
      const result = await conflictResolver.resolveConflict(conflictContext)
      expect(result).toBeDefined()
      
      console.log('Malformed data resolution:', result)
    })
  })
})
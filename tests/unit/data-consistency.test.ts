/**
 * Data Consistency Tests
 * Tests for data consistency checks and automatic repair
 */

import { dataValidator } from '@/lib/data-validator'
import { offlineQueue } from '@/lib/offline-queue'
import { Expense, Category, Account } from '@/lib/types'

describe('Data Consistency Tests', () => {
  beforeEach(() => {
    // Reset all state
    dataValidator.clearValidationHistory()
    offlineQueue.clear()
  })

  describe('Cross-Reference Consistency', () => {
    test('should detect orphaned expense references', async () => {
      const orphanedExpense: Expense = {
        id: 'exp-1',
        amount: 25.50,
        description: 'Orphaned expense',
        categoryId: 'cat-nonexistent',
        accountId: 'acc-nonexistent',
        date: '2023-12-01T10:00:00.000Z'
      }

      const consistencyCheck = await dataValidator.checkDataConsistency('expenses', orphanedExpense)

      expect(consistencyCheck.isConsistent).toBe(false)
      expect(consistencyCheck.violations).toHaveLength(2)
      expect(consistencyCheck.violations.some(v => v.type === 'orphaned_reference')).toBe(true)
      expect(consistencyCheck.violations.some(v => v.field === 'categoryId')).toBe(true)
      expect(consistencyCheck.violations.some(v => v.field === 'accountId')).toBe(true)
    })

    test('should detect duplicate expense IDs', async () => {
      const expenses = [
        {
          id: 'exp-duplicate',
          amount: 25.50,
          description: 'First expense',
          categoryId: 'cat-1',
          accountId: 'acc-1',
          date: '2023-12-01T10:00:00.000Z'
        },
        {
          id: 'exp-duplicate',
          amount: 30.00,
          description: 'Second expense',
          categoryId: 'cat-1',
          accountId: 'acc-1',
          date: '2023-12-01T11:00:00.000Z'
        }
      ]

      const consistencyCheck = await dataValidator.checkDataConsistency('expenses', expenses)

      expect(consistencyCheck.isConsistent).toBe(false)
      expect(consistencyCheck.violations).toHaveLength(1)
      expect(consistencyCheck.violations[0].type).toBe('duplicate_id')
      expect(consistencyCheck.violations[0].field).toBe('id')
    })

    test('should detect inconsistent timestamps', async () => {
      const futureExpense: Expense = {
        id: 'exp-future',
        amount: 25.50,
        description: 'Future expense',
        categoryId: 'cat-1',
        accountId: 'acc-1',
        date: new Date(Date.now() + 86400000).toISOString() // Tomorrow
      }

      const consistencyCheck = await dataValidator.checkDataConsistency('expenses', futureExpense)

      expect(consistencyCheck.isConsistent).toBe(false)
      expect(consistencyCheck.violations).toHaveLength(1)
      expect(consistencyCheck.violations[0].type).toBe('future_timestamp')
      expect(consistencyCheck.violations[0].field).toBe('date')
    })

    test('should validate category-expense relationships', async () => {
      const categoryId = 'cat-to-delete'
      const expensesUsingCategory = [
        {
          id: 'exp-1',
          amount: 25.50,
          description: 'Expense 1',
          categoryId,
          accountId: 'acc-1',
          date: '2023-12-01T10:00:00.000Z'
        },
        {
          id: 'exp-2',
          amount: 30.00,
          description: 'Expense 2',
          categoryId,
          accountId: 'acc-1',
          date: '2023-12-01T11:00:00.000Z'
        }
      ]

      const consistencyCheck = await dataValidator.checkDataConsistency('categories', categoryId, {
        operation: 'DELETE',
        relatedData: expensesUsingCategory
      })

      expect(consistencyCheck.isConsistent).toBe(false)
      expect(consistencyCheck.violations).toHaveLength(1)
      expect(consistencyCheck.violations[0].type).toBe('referenced_by_expenses')
      expect(consistencyCheck.violations[0].affectedRecords).toHaveLength(2)
    })

    test('should validate account balance consistency', async () => {
      const account: Account = {
        id: 'acc-1',
        name: 'Test Account',
        type: 'checking',
        balance: 1000.00
      }

      const expenses = [
        {
          id: 'exp-1',
          amount: 600.00,
          description: 'Large expense',
          categoryId: 'cat-1',
          accountId: 'acc-1',
          date: '2023-12-01T10:00:00.000Z'
        },
        {
          id: 'exp-2',
          amount: 500.00,
          description: 'Another large expense',
          categoryId: 'cat-1',
          accountId: 'acc-1',
          date: '2023-12-01T11:00:00.000Z'
        }
      ]

      const consistencyCheck = await dataValidator.checkDataConsistency('accounts', account, {
        relatedData: expenses
      })

      expect(consistencyCheck.isConsistent).toBe(false)
      expect(consistencyCheck.violations).toHaveLength(1)
      expect(consistencyCheck.violations[0].type).toBe('balance_mismatch')
      expect(consistencyCheck.violations[0].expectedBalance).toBe(-100.00)
      expect(consistencyCheck.violations[0].actualBalance).toBe(1000.00)
    })
  })

  describe('Automatic Data Repair', () => {
    test('should repair orphaned expense references', async () => {
      const orphanedExpense: Expense = {
        id: 'exp-1',
        amount: 25.50,
        description: 'Orphaned expense',
        categoryId: 'cat-nonexistent',
        accountId: 'acc-nonexistent',
        date: '2023-12-01T10:00:00.000Z'
      }

      const repairResult = await dataValidator.autoRepairData('expenses', orphanedExpense)

      expect(repairResult.success).toBe(true)
      expect(repairResult.repairsApplied).toHaveLength(2)
      expect(repairResult.repairedData.categoryId).toBe('cat-default')
      expect(repairResult.repairedData.accountId).toBe('acc-default')
    })

    test('should repair duplicate IDs by generating new ones', async () => {
      const duplicateExpense: Expense = {
        id: 'exp-existing',
        amount: 25.50,
        description: 'Duplicate expense',
        categoryId: 'cat-1',
        accountId: 'acc-1',
        date: '2023-12-01T10:00:00.000Z'
      }

      const repairResult = await dataValidator.autoRepairData('expenses', duplicateExpense)

      expect(repairResult.success).toBe(true)
      expect(repairResult.repairsApplied).toHaveLength(1)
      expect(repairResult.repairedData.id).not.toBe('exp-existing')
      expect(repairResult.repairedData.id).toMatch(/^exp-existing-\d+$/)
    })

    test('should repair future timestamps', async () => {
      const futureExpense: Expense = {
        id: 'exp-future',
        amount: 25.50,
        description: 'Future expense',
        categoryId: 'cat-1',
        accountId: 'acc-1',
        date: new Date(Date.now() + 86400000).toISOString()
      }

      const repairResult = await dataValidator.autoRepairData('expenses', futureExpense)

      expect(repairResult.success).toBe(true)
      expect(repairResult.repairsApplied).toHaveLength(1)
      expect(new Date(repairResult.repairedData.date).getTime()).toBeLessThanOrEqual(Date.now())
    })

    test('should handle cascading repairs', async () => {
      const brokenExpense = {
        id: 'exp-broken',
        amount: '25.50', // Wrong type
        description: '  Broken   expense  ', // Needs trimming
        categoryId: 'cat-nonexistent', // Orphaned reference
        accountId: 'acc-nonexistent', // Orphaned reference
        date: new Date(Date.now() + 86400000).toISOString() // Future date
      }

      const repairResult = await dataValidator.autoRepairData('expenses', brokenExpense)

      expect(repairResult.success).toBe(true)
      expect(repairResult.repairsApplied.length).toBeGreaterThan(3)
      expect(repairResult.repairedData.amount).toBe(25.50)
      expect(repairResult.repairedData.description).toBe('Broken expense')
      expect(repairResult.repairedData.categoryId).toBe('cat-default')
      expect(repairResult.repairedData.accountId).toBe('acc-default')
      expect(new Date(repairResult.repairedData.date).getTime()).toBeLessThanOrEqual(Date.now())
    })

    test('should create repair rollback points', async () => {
      const brokenExpense: Expense = {
        id: 'exp-broken',
        amount: 25.50,
        description: 'Broken expense',
        categoryId: 'cat-nonexistent',
        accountId: 'acc-nonexistent',
        date: '2023-12-01T10:00:00.000Z'
      }

      const repairResult = await dataValidator.autoRepairData('expenses', brokenExpense)

      expect(repairResult.success).toBe(true)
      expect(repairResult.rollbackId).toBeDefined()
      
      // Should be able to rollback the repair
      const rollbackResult = await dataValidator.rollbackRepair(repairResult.rollbackId!)
      expect(rollbackResult.success).toBe(true)
      expect(rollbackResult.originalData).toEqual(brokenExpense)
    })

    test('should limit repair attempts', async () => {
      const unreparableExpense = {
        id: null, // Cannot be repaired
        amount: 'totally-invalid',
        description: null,
        categoryId: null,
        accountId: null,
        date: 'not-a-date'
      }

      const repairResult = await dataValidator.autoRepairData('expenses', unreparableExpense)

      expect(repairResult.success).toBe(false)
      expect(repairResult.error).toContain('Unable to repair')
      expect(repairResult.repairsApplied).toHaveLength(0)
    })
  })

  describe('Data Integrity Checks', () => {
    test('should validate referential integrity', async () => {
      const testData = {
        categories: [
          { id: 'cat-1', name: 'Food', color: '#ff0000' },
          { id: 'cat-2', name: 'Transport', color: '#00ff00' }
        ],
        accounts: [
          { id: 'acc-1', name: 'Checking', type: 'checking', balance: 1000.00 },
          { id: 'acc-2', name: 'Savings', type: 'savings', balance: 5000.00 }
        ],
        expenses: [
          {
            id: 'exp-1',
            amount: 25.50,
            description: 'Valid expense',
            categoryId: 'cat-1',
            accountId: 'acc-1',
            date: '2023-12-01T10:00:00.000Z'
          },
          {
            id: 'exp-2',
            amount: 30.00,
            description: 'Invalid expense',
            categoryId: 'cat-nonexistent',
            accountId: 'acc-nonexistent',
            date: '2023-12-01T11:00:00.000Z'
          }
        ]
      }

      const integrityCheck = await dataValidator.checkReferentialIntegrity(testData)

      expect(integrityCheck.isValid).toBe(false)
      expect(integrityCheck.violations).toHaveLength(2)
      expect(integrityCheck.violations.some(v => v.table === 'expenses' && v.field === 'categoryId')).toBe(true)
      expect(integrityCheck.violations.some(v => v.table === 'expenses' && v.field === 'accountId')).toBe(true)
    })

    test('should validate data completeness', async () => {
      const incompleteData = {
        expenses: [
          {
            id: 'exp-1',
            amount: 25.50,
            // Missing description, categoryId, accountId, date
          }
        ]
      }

      const completenessCheck = await dataValidator.checkDataCompleteness(incompleteData)

      expect(completenessCheck.isComplete).toBe(false)
      expect(completenessCheck.missingFields).toHaveLength(4)
      expect(completenessCheck.missingFields).toContain('description')
      expect(completenessCheck.missingFields).toContain('categoryId')
      expect(completenessCheck.missingFields).toContain('accountId')
      expect(completenessCheck.missingFields).toContain('date')
    })

    test('should validate data uniqueness', async () => {
      const duplicateData = {
        categories: [
          { id: 'cat-1', name: 'Food', color: '#ff0000' },
          { id: 'cat-1', name: 'Food Duplicate', color: '#ff0000' }
        ]
      }

      const uniquenessCheck = await dataValidator.checkDataUniqueness(duplicateData)

      expect(uniquenessCheck.isUnique).toBe(false)
      expect(uniquenessCheck.duplicates).toHaveLength(1)
      expect(uniquenessCheck.duplicates[0].table).toBe('categories')
      expect(uniquenessCheck.duplicates[0].field).toBe('id')
      expect(uniquenessCheck.duplicates[0].value).toBe('cat-1')
    })

    test('should validate data ranges and constraints', async () => {
      const constraintViolatingData = {
        expenses: [
          {
            id: 'exp-1',
            amount: -25.50, // Negative amount
            description: 'A'.repeat(1001), // Too long description
            categoryId: 'cat-1',
            accountId: 'acc-1',
            date: '2023-12-01T10:00:00.000Z'
          }
        ]
      }

      const constraintCheck = await dataValidator.checkDataConstraints(constraintViolatingData)

      expect(constraintCheck.isValid).toBe(false)
      expect(constraintCheck.violations).toHaveLength(2)
      expect(constraintCheck.violations.some(v => v.constraint === 'positive_amount')).toBe(true)
      expect(constraintCheck.violations.some(v => v.constraint === 'max_length')).toBe(true)
    })
  })

  describe('Batch Consistency Operations', () => {
    test('should check consistency of multiple records', async () => {
      const batchData = Array.from({ length: 100 }, (_, i) => ({
        id: `exp-${i}`,
        amount: (i % 2 === 0) ? 25.50 : 'invalid',
        description: `Expense ${i}`,
        categoryId: (i % 3 === 0) ? 'cat-nonexistent' : 'cat-1',
        accountId: 'acc-1',
        date: '2023-12-01T10:00:00.000Z'
      }))

      const batchCheck = await dataValidator.checkBatchConsistency('expenses', batchData)

      expect(batchCheck.totalRecords).toBe(100)
      expect(batchCheck.validRecords).toBe(33) // Only records with valid amount and existing category
      expect(batchCheck.invalidRecords).toBe(67)
      expect(batchCheck.violations.length).toBeGreaterThan(0)
    })

    test('should repair batch data efficiently', async () => {
      const batchData = Array.from({ length: 50 }, (_, i) => ({
        id: `exp-${i}`,
        amount: '25.50', // Wrong type
        description: `  Expense ${i}  `, // Needs trimming
        categoryId: 'cat-nonexistent', // Orphaned reference
        accountId: 'acc-1',
        date: '2023-12-01T10:00:00.000Z'
      }))

      const startTime = Date.now()
      const batchRepair = await dataValidator.repairBatchData('expenses', batchData)
      const endTime = Date.now()

      expect(batchRepair.success).toBe(true)
      expect(batchRepair.repairedRecords).toHaveLength(50)
      expect(batchRepair.totalRepairs).toBe(150) // 3 repairs per record
      expect(endTime - startTime).toBeLessThan(2000) // Should complete in under 2 seconds

      // Verify repairs were applied
      batchRepair.repairedRecords.forEach((record, i) => {
        expect(record.amount).toBe(25.50)
        expect(record.description).toBe(`Expense ${i}`)
        expect(record.categoryId).toBe('cat-default')
      })
    })

    test('should handle mixed success/failure in batch operations', async () => {
      const mixedBatchData = [
        {
          id: 'exp-1',
          amount: '25.50',
          description: 'Repairable expense',
          categoryId: 'cat-nonexistent',
          accountId: 'acc-1',
          date: '2023-12-01T10:00:00.000Z'
        },
        {
          id: null, // Unrepairable
          amount: 'totally-invalid',
          description: null,
          categoryId: null,
          accountId: null,
          date: 'not-a-date'
        }
      ]

      const batchRepair = await dataValidator.repairBatchData('expenses', mixedBatchData)

      expect(batchRepair.success).toBe(false)
      expect(batchRepair.repairedRecords).toHaveLength(1)
      expect(batchRepair.failedRecords).toHaveLength(1)
      expect(batchRepair.errors).toHaveLength(1)
    })
  })

  describe('Rollback and Recovery', () => {
    test('should create rollback points for consistency fixes', async () => {
      const originalExpense: Expense = {
        id: 'exp-1',
        amount: 25.50,
        description: 'Original expense',
        categoryId: 'cat-nonexistent',
        accountId: 'acc-nonexistent',
        date: '2023-12-01T10:00:00.000Z'
      }

      const rollbackId = await dataValidator.createRollbackPoint(
        [{ operation: 'repair', table: 'expenses', data: originalExpense }],
        'Consistency repair'
      )

      expect(rollbackId).toBeDefined()
      expect(rollbackId).toMatch(/^rollback-\d+$/)

      // Verify rollback point was created
      const rollbackInfo = await dataValidator.getRollbackInfo(rollbackId)
      expect(rollbackInfo.description).toBe('Consistency repair')
      expect(rollbackInfo.operations).toHaveLength(1)
    })

    test('should execute rollback operations', async () => {
      const originalExpense: Expense = {
        id: 'exp-1',
        amount: 25.50,
        description: 'Original expense',
        categoryId: 'cat-nonexistent',
        accountId: 'acc-nonexistent',
        date: '2023-12-01T10:00:00.000Z'
      }

      // Create rollback point
      const rollbackId = await dataValidator.createRollbackPoint(
        [{ operation: 'repair', table: 'expenses', data: originalExpense }],
        'Test rollback'
      )

      // Perform repair
      const repairResult = await dataValidator.autoRepairData('expenses', originalExpense)
      expect(repairResult.success).toBe(true)

      // Execute rollback
      const rollbackResult = await dataValidator.executeRollback(rollbackId)
      expect(rollbackResult.success).toBe(true)
      expect(rollbackResult.operationsRolledBack).toBe(1)
      expect(rollbackResult.restoredData).toEqual(originalExpense)
    })

    test('should handle rollback conflicts', async () => {
      const rollbackId = 'rollback-nonexistent'

      const rollbackResult = await dataValidator.executeRollback(rollbackId)

      expect(rollbackResult.success).toBe(false)
      expect(rollbackResult.error).toContain('Rollback point not found')
    })

    test('should cleanup old rollback points', async () => {
      // Create multiple rollback points
      const rollbackIds = []
      for (let i = 0; i < 10; i++) {
        const rollbackId = await dataValidator.createRollbackPoint(
          [{ operation: 'repair', table: 'expenses', data: { id: `exp-${i}` } }],
          `Rollback ${i}`
        )
        rollbackIds.push(rollbackId)
      }

      // Cleanup old rollback points
      await dataValidator.cleanupRollbackPoints(5) // Keep only 5 most recent

      // Verify cleanup
      const remainingRollbacks = await dataValidator.getRollbackHistory()
      expect(remainingRollbacks).toHaveLength(5)
      expect(remainingRollbacks.every(r => rollbackIds.includes(r.id))).toBe(true)
    })
  })

  describe('Performance and Scalability', () => {
    test('should handle large datasets efficiently', async () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: `exp-${i}`,
        amount: 25.50,
        description: `Expense ${i}`,
        categoryId: 'cat-1',
        accountId: 'acc-1',
        date: '2023-12-01T10:00:00.000Z'
      }))

      const startTime = Date.now()
      const consistencyCheck = await dataValidator.checkBatchConsistency('expenses', largeDataset)
      const endTime = Date.now()

      expect(consistencyCheck.totalRecords).toBe(1000)
      expect(consistencyCheck.validRecords).toBe(1000)
      expect(endTime - startTime).toBeLessThan(5000) // Should complete in under 5 seconds
    })

    test('should use memory efficiently during batch operations', async () => {
      const memoryBefore = process.memoryUsage()

      // Process large batch
      const largeBatch = Array.from({ length: 5000 }, (_, i) => ({
        id: `exp-${i}`,
        amount: '25.50',
        description: `  Expense ${i}  `,
        categoryId: 'cat-nonexistent',
        accountId: 'acc-1',
        date: '2023-12-01T10:00:00.000Z'
      }))

      await dataValidator.repairBatchData('expenses', largeBatch)

      const memoryAfter = process.memoryUsage()
      const memoryIncrease = memoryAfter.heapUsed - memoryBefore.heapUsed

      // Memory increase should be reasonable (less than 100MB)
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024)
    })

    test('should handle concurrent consistency checks', async () => {
      const concurrentChecks = Array.from({ length: 20 }, (_, i) => {
        const data = {
          id: `exp-${i}`,
          amount: 25.50,
          description: `Expense ${i}`,
          categoryId: 'cat-1',
          accountId: 'acc-1',
          date: '2023-12-01T10:00:00.000Z'
        }
        return dataValidator.checkDataConsistency('expenses', data)
      })

      const startTime = Date.now()
      const results = await Promise.all(concurrentChecks)
      const endTime = Date.now()

      expect(results).toHaveLength(20)
      expect(results.every(r => r.isConsistent)).toBe(true)
      expect(endTime - startTime).toBeLessThan(2000) // Should complete concurrently
    })
  })

  describe('Error Handling and Edge Cases', () => {
    test('should handle null/undefined data gracefully', async () => {
      const consistencyCheck = await dataValidator.checkDataConsistency('expenses', null)

      expect(consistencyCheck.isConsistent).toBe(false)
      expect(consistencyCheck.violations).toHaveLength(1)
      expect(consistencyCheck.violations[0].type).toBe('null_data')
    })

    test('should handle database connection errors', async () => {
      // Mock database error
      const originalCheck = dataValidator.checkDataConsistency
      dataValidator.checkDataConsistency = jest.fn().mockRejectedValue(new Error('Database error'))

      const consistencyCheck = await dataValidator.checkDataConsistency('expenses', {})

      expect(consistencyCheck.isConsistent).toBe(false)
      expect(consistencyCheck.error).toContain('Database error')

      // Restore original method
      dataValidator.checkDataConsistency = originalCheck
    })

    test('should handle circular references in data', async () => {
      const circularData: any = {
        id: 'exp-1',
        amount: 25.50,
        description: 'Circular expense',
        categoryId: 'cat-1',
        accountId: 'acc-1',
        date: '2023-12-01T10:00:00.000Z'
      }
      circularData.self = circularData

      const consistencyCheck = await dataValidator.checkDataConsistency('expenses', circularData)

      expect(consistencyCheck.isConsistent).toBe(false)
      expect(consistencyCheck.violations).toHaveLength(1)
      expect(consistencyCheck.violations[0].type).toBe('circular_reference')
    })

    test('should handle repair failures gracefully', async () => {
      const unrepairableData = {
        id: null,
        amount: 'completely-invalid',
        description: null,
        categoryId: null,
        accountId: null,
        date: 'not-a-date'
      }

      const repairResult = await dataValidator.autoRepairData('expenses', unrepairableData)

      expect(repairResult.success).toBe(false)
      expect(repairResult.error).toBeDefined()
      expect(repairResult.repairsApplied).toHaveLength(0)
    })
  })

  describe('Consistency Monitoring', () => {
    test('should track consistency statistics', async () => {
      const initialStats = dataValidator.getConsistencyStats()
      expect(initialStats.totalChecks).toBe(0)

      // Perform some consistency checks
      await dataValidator.checkDataConsistency('expenses', {
        id: 'exp-1',
        amount: 25.50,
        description: 'Valid expense',
        categoryId: 'cat-1',
        accountId: 'acc-1',
        date: '2023-12-01T10:00:00.000Z'
      })

      await dataValidator.checkDataConsistency('expenses', {
        id: 'exp-2',
        amount: 25.50,
        description: 'Invalid expense',
        categoryId: 'cat-nonexistent',
        accountId: 'acc-1',
        date: '2023-12-01T10:00:00.000Z'
      })

      const stats = dataValidator.getConsistencyStats()
      expect(stats.totalChecks).toBe(2)
      expect(stats.consistentRecords).toBe(1)
      expect(stats.inconsistentRecords).toBe(1)
    })

    test('should generate consistency reports', async () => {
      // Generate some consistency issues
      await dataValidator.checkDataConsistency('expenses', {
        id: 'exp-invalid',
        amount: 25.50,
        description: 'Invalid expense',
        categoryId: 'cat-nonexistent',
        accountId: 'acc-nonexistent',
        date: '2023-12-01T10:00:00.000Z'
      })

      const report = await dataValidator.generateConsistencyReport()

      expect(report.summary.totalRecordsChecked).toBe(1)
      expect(report.summary.violationsFound).toBe(2)
      expect(report.details.expenses.violations).toHaveLength(2)
      expect(report.recommendations).toHaveLength(1)
    })
  })
})
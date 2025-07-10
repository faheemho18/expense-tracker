/**
 * Data Validation Tests
 * Tests for the data validation and recovery system
 */

import { dataValidator, ValidationResult, ValidationError } from '@/lib/data-validator'
import { Expense, Category, Account } from '@/lib/types'

describe('Data Validation Tests', () => {
  beforeEach(() => {
    // Reset validator state
    dataValidator.clearValidationHistory()
  })

  describe('Expense Validation', () => {
    test('should validate valid expense data', async () => {
      const validExpense: Expense = {
        id: 'exp-1',
        amount: 25.50,
        description: 'Valid expense',
        categoryId: 'cat-1',
        accountId: 'acc-1',
        date: '2023-12-01T10:00:00.000Z'
      }

      const result = await dataValidator.validateData('expenses', validExpense, 'INSERT')

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.warnings).toHaveLength(0)
      expect(result.repairedData).toEqual(validExpense)
    })

    test('should detect invalid expense amount', async () => {
      const invalidExpense = {
        id: 'exp-1',
        amount: 'not-a-number',
        description: 'Invalid expense',
        categoryId: 'cat-1',
        accountId: 'acc-1',
        date: '2023-12-01T10:00:00.000Z'
      }

      const result = await dataValidator.validateData('expenses', invalidExpense, 'INSERT')

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].field).toBe('amount')
      expect(result.errors[0].message).toContain('must be a number')
    })

    test('should detect negative expense amount', async () => {
      const negativeExpense: Expense = {
        id: 'exp-1',
        amount: -25.50,
        description: 'Negative expense',
        categoryId: 'cat-1',
        accountId: 'acc-1',
        date: '2023-12-01T10:00:00.000Z'
      }

      const result = await dataValidator.validateData('expenses', negativeExpense, 'INSERT')

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].field).toBe('amount')
      expect(result.errors[0].message).toContain('must be positive')
    })

    test('should detect missing required fields', async () => {
      const incompleteExpense = {
        id: 'exp-1',
        amount: 25.50,
        // Missing description, categoryId, accountId, date
      }

      const result = await dataValidator.validateData('expenses', incompleteExpense, 'INSERT')

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      
      const fieldErrors = result.errors.map(e => e.field)
      expect(fieldErrors).toContain('description')
      expect(fieldErrors).toContain('categoryId')
      expect(fieldErrors).toContain('accountId')
      expect(fieldErrors).toContain('date')
    })

    test('should detect invalid date format', async () => {
      const invalidDateExpense: Expense = {
        id: 'exp-1',
        amount: 25.50,
        description: 'Invalid date expense',
        categoryId: 'cat-1',
        accountId: 'acc-1',
        date: 'not-a-date'
      }

      const result = await dataValidator.validateData('expenses', invalidDateExpense, 'INSERT')

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].field).toBe('date')
      expect(result.errors[0].message).toContain('Invalid date')
    })

    test('should auto-repair fixable issues', async () => {
      const expenseWithIssues = {
        id: 'exp-1',
        amount: '25.50', // String instead of number
        description: '  Expense with spaces  ', // Needs trimming
        categoryId: 'cat-1',
        accountId: 'acc-1',
        date: '2023-12-01T10:00:00.000Z'
      }

      const result = await dataValidator.validateData('expenses', expenseWithIssues, 'INSERT')

      expect(result.isValid).toBe(true)
      expect(result.warnings).toHaveLength(2)
      expect(result.repairedData.amount).toBe(25.50)
      expect(result.repairedData.description).toBe('Expense with spaces')
    })

    test('should validate expense references', async () => {
      const expenseWithInvalidRefs: Expense = {
        id: 'exp-1',
        amount: 25.50,
        description: 'Valid expense',
        categoryId: 'non-existent-category',
        accountId: 'non-existent-account',
        date: '2023-12-01T10:00:00.000Z'
      }

      const result = await dataValidator.validateData('expenses', expenseWithInvalidRefs, 'INSERT')

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(2)
      expect(result.errors.some(e => e.field === 'categoryId')).toBe(true)
      expect(result.errors.some(e => e.field === 'accountId')).toBe(true)
    })
  })

  describe('Category Validation', () => {
    test('should validate valid category data', async () => {
      const validCategory: Category = {
        id: 'cat-1',
        name: 'Food & Dining',
        color: '#ff0000'
      }

      const result = await dataValidator.validateData('categories', validCategory, 'INSERT')

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.repairedData).toEqual(validCategory)
    })

    test('should detect invalid category name', async () => {
      const invalidCategory = {
        id: 'cat-1',
        name: '', // Empty name
        color: '#ff0000'
      }

      const result = await dataValidator.validateData('categories', invalidCategory, 'INSERT')

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].field).toBe('name')
      expect(result.errors[0].message).toContain('required')
    })

    test('should detect invalid color format', async () => {
      const invalidColorCategory: Category = {
        id: 'cat-1',
        name: 'Food & Dining',
        color: 'not-a-color'
      }

      const result = await dataValidator.validateData('categories', invalidColorCategory, 'INSERT')

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].field).toBe('color')
      expect(result.errors[0].message).toContain('Invalid color format')
    })

    test('should detect duplicate category names', async () => {
      const duplicateCategory: Category = {
        id: 'cat-2',
        name: 'Food & Dining', // Assume this name already exists
        color: '#00ff00'
      }

      const result = await dataValidator.validateData('categories', duplicateCategory, 'INSERT')

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].field).toBe('name')
      expect(result.errors[0].message).toContain('already exists')
    })

    test('should auto-repair category color format', async () => {
      const categoryWithBadColor = {
        id: 'cat-1',
        name: 'Food & Dining',
        color: 'ff0000' // Missing #
      }

      const result = await dataValidator.validateData('categories', categoryWithBadColor, 'INSERT')

      expect(result.isValid).toBe(true)
      expect(result.warnings).toHaveLength(1)
      expect(result.repairedData.color).toBe('#ff0000')
    })

    test('should validate category name length', async () => {
      const longNameCategory: Category = {
        id: 'cat-1',
        name: 'A'.repeat(101), // Too long
        color: '#ff0000'
      }

      const result = await dataValidator.validateData('categories', longNameCategory, 'INSERT')

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].field).toBe('name')
      expect(result.errors[0].message).toContain('too long')
    })
  })

  describe('Account Validation', () => {
    test('should validate valid account data', async () => {
      const validAccount: Account = {
        id: 'acc-1',
        name: 'Checking Account',
        type: 'checking',
        balance: 1000.00
      }

      const result = await dataValidator.validateData('accounts', validAccount, 'INSERT')

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.repairedData).toEqual(validAccount)
    })

    test('should detect invalid account type', async () => {
      const invalidAccount = {
        id: 'acc-1',
        name: 'Test Account',
        type: 'invalid-type',
        balance: 1000.00
      }

      const result = await dataValidator.validateData('accounts', invalidAccount, 'INSERT')

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].field).toBe('type')
      expect(result.errors[0].message).toContain('Invalid account type')
    })

    test('should detect invalid balance format', async () => {
      const invalidBalanceAccount: Account = {
        id: 'acc-1',
        name: 'Test Account',
        type: 'checking',
        balance: 'not-a-number' as any
      }

      const result = await dataValidator.validateData('accounts', invalidBalanceAccount, 'INSERT')

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].field).toBe('balance')
      expect(result.errors[0].message).toContain('must be a number')
    })

    test('should allow negative balance with warning', async () => {
      const negativeBalanceAccount: Account = {
        id: 'acc-1',
        name: 'Overdraft Account',
        type: 'checking',
        balance: -50.00
      }

      const result = await dataValidator.validateData('accounts', negativeBalanceAccount, 'INSERT')

      expect(result.isValid).toBe(true)
      expect(result.warnings).toHaveLength(1)
      expect(result.warnings[0].field).toBe('balance')
      expect(result.warnings[0].message).toContain('negative balance')
    })

    test('should detect duplicate account names', async () => {
      const duplicateAccount: Account = {
        id: 'acc-2',
        name: 'Checking Account', // Assume this name already exists
        type: 'savings',
        balance: 500.00
      }

      const result = await dataValidator.validateData('accounts', duplicateAccount, 'INSERT')

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].field).toBe('name')
      expect(result.errors[0].message).toContain('already exists')
    })

    test('should auto-repair balance precision', async () => {
      const impreciseBalanceAccount = {
        id: 'acc-1',
        name: 'Test Account',
        type: 'checking',
        balance: 1000.123456789 // Too many decimal places
      }

      const result = await dataValidator.validateData('accounts', impreciseBalanceAccount, 'INSERT')

      expect(result.isValid).toBe(true)
      expect(result.warnings).toHaveLength(1)
      expect(result.repairedData.balance).toBe(1000.12)
    })
  })

  describe('Cross-Table Validation', () => {
    test('should validate expense-category relationships', async () => {
      const expenseWithValidCategory: Expense = {
        id: 'exp-1',
        amount: 25.50,
        description: 'Valid expense',
        categoryId: 'cat-existing',
        accountId: 'acc-existing',
        date: '2023-12-01T10:00:00.000Z'
      }

      const result = await dataValidator.validateData('expenses', expenseWithValidCategory, 'INSERT')

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    test('should detect orphaned expense references', async () => {
      const orphanedExpense: Expense = {
        id: 'exp-1',
        amount: 25.50,
        description: 'Orphaned expense',
        categoryId: 'cat-deleted',
        accountId: 'acc-deleted',
        date: '2023-12-01T10:00:00.000Z'
      }

      const result = await dataValidator.validateData('expenses', orphanedExpense, 'INSERT')

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(2)
      expect(result.errors.some(e => e.message.includes('category'))).toBe(true)
      expect(result.errors.some(e => e.message.includes('account'))).toBe(true)
    })

    test('should handle cascading deletes', async () => {
      const categoryToDelete: Category = {
        id: 'cat-to-delete',
        name: 'Category to Delete',
        color: '#ff0000'
      }

      const result = await dataValidator.validateData('categories', categoryToDelete, 'DELETE')

      expect(result.isValid).toBe(true)
      expect(result.warnings).toHaveLength(1)
      expect(result.warnings[0].message).toContain('expenses will be affected')
    })
  })

  describe('Operation-Specific Validation', () => {
    test('should validate INSERT operations', async () => {
      const newExpense: Expense = {
        id: 'exp-new',
        amount: 25.50,
        description: 'New expense',
        categoryId: 'cat-1',
        accountId: 'acc-1',
        date: '2023-12-01T10:00:00.000Z'
      }

      const result = await dataValidator.validateData('expenses', newExpense, 'INSERT')

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    test('should validate UPDATE operations', async () => {
      const updatedExpense: Expense = {
        id: 'exp-existing',
        amount: 30.00,
        description: 'Updated expense',
        categoryId: 'cat-1',
        accountId: 'acc-1',
        date: '2023-12-01T10:00:00.000Z'
      }

      const result = await dataValidator.validateData('expenses', updatedExpense, 'UPDATE')

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    test('should validate DELETE operations', async () => {
      const expenseToDelete = {
        id: 'exp-to-delete'
      }

      const result = await dataValidator.validateData('expenses', expenseToDelete, 'DELETE')

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    test('should detect duplicate IDs on INSERT', async () => {
      const duplicateExpense: Expense = {
        id: 'exp-existing',
        amount: 25.50,
        description: 'Duplicate expense',
        categoryId: 'cat-1',
        accountId: 'acc-1',
        date: '2023-12-01T10:00:00.000Z'
      }

      const result = await dataValidator.validateData('expenses', duplicateExpense, 'INSERT')

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].field).toBe('id')
      expect(result.errors[0].message).toContain('already exists')
    })

    test('should detect non-existent IDs on UPDATE', async () => {
      const nonExistentExpense: Expense = {
        id: 'exp-non-existent',
        amount: 25.50,
        description: 'Non-existent expense',
        categoryId: 'cat-1',
        accountId: 'acc-1',
        date: '2023-12-01T10:00:00.000Z'
      }

      const result = await dataValidator.validateData('expenses', nonExistentExpense, 'UPDATE')

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].field).toBe('id')
      expect(result.errors[0].message).toContain('not found')
    })
  })

  describe('Data Repair and Recovery', () => {
    test('should repair common formatting issues', async () => {
      const messyExpense = {
        id: 'exp-1',
        amount: '25.50',
        description: '  Messy   expense  ',
        categoryId: ' cat-1 ',
        accountId: ' acc-1 ',
        date: '2023-12-01T10:00:00.000Z'
      }

      const result = await dataValidator.validateData('expenses', messyExpense, 'INSERT')

      expect(result.isValid).toBe(true)
      expect(result.warnings.length).toBeGreaterThan(0)
      expect(result.repairedData.amount).toBe(25.50)
      expect(result.repairedData.description).toBe('Messy expense')
      expect(result.repairedData.categoryId).toBe('cat-1')
      expect(result.repairedData.accountId).toBe('acc-1')
    })

    test('should repair null/undefined values', async () => {
      const nullExpense = {
        id: 'exp-1',
        amount: 25.50,
        description: null,
        categoryId: 'cat-1',
        accountId: 'acc-1',
        date: '2023-12-01T10:00:00.000Z'
      }

      const result = await dataValidator.validateData('expenses', nullExpense, 'INSERT')

      expect(result.isValid).toBe(true)
      expect(result.warnings).toHaveLength(1)
      expect(result.repairedData.description).toBe('Untitled Expense')
    })

    test('should repair date formats', async () => {
      const badDateExpense = {
        id: 'exp-1',
        amount: 25.50,
        description: 'Bad date expense',
        categoryId: 'cat-1',
        accountId: 'acc-1',
        date: '2023-12-01' // Missing time
      }

      const result = await dataValidator.validateData('expenses', badDateExpense, 'INSERT')

      expect(result.isValid).toBe(true)
      expect(result.warnings).toHaveLength(1)
      expect(result.repairedData.date).toMatch(/T\d{2}:\d{2}:\d{2}/)
    })

    test('should create repair reports', async () => {
      const brokenExpense = {
        id: 'exp-1',
        amount: '25.50',
        description: '  Broken   expense  ',
        categoryId: ' cat-1 ',
        accountId: ' acc-1 ',
        date: '2023-12-01'
      }

      const result = await dataValidator.validateData('expenses', brokenExpense, 'INSERT')

      expect(result.isValid).toBe(true)
      expect(result.repairReport).toBeDefined()
      expect(result.repairReport?.changes).toHaveLength(4)
      expect(result.repairReport?.changes.map(c => c.field)).toEqual(['amount', 'description', 'categoryId', 'date'])
    })
  })

  describe('Batch Validation', () => {
    test('should validate multiple records efficiently', async () => {
      const expenses = Array.from({ length: 100 }, (_, i) => ({
        id: `exp-${i}`,
        amount: (i + 1) * 10,
        description: `Expense ${i + 1}`,
        categoryId: 'cat-1',
        accountId: 'acc-1',
        date: '2023-12-01T10:00:00.000Z'
      }))

      const startTime = Date.now()
      const results = await Promise.all(
        expenses.map(expense => dataValidator.validateData('expenses', expense, 'INSERT'))
      )
      const endTime = Date.now()

      expect(results).toHaveLength(100)
      expect(results.every(r => r.isValid)).toBe(true)
      expect(endTime - startTime).toBeLessThan(1000) // Should complete in under 1 second
    })

    test('should handle mixed valid and invalid records', async () => {
      const mixedRecords = [
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
          amount: 'invalid',
          description: 'Invalid expense',
          categoryId: 'cat-1',
          accountId: 'acc-1',
          date: '2023-12-01T10:00:00.000Z'
        }
      ]

      const results = await Promise.all(
        mixedRecords.map(record => dataValidator.validateData('expenses', record, 'INSERT'))
      )

      expect(results[0].isValid).toBe(true)
      expect(results[1].isValid).toBe(false)
    })
  })

  describe('Performance and Memory Management', () => {
    test('should handle large data sets without memory issues', async () => {
      // Create a very large expense record
      const largeExpense = {
        id: 'exp-large',
        amount: 25.50,
        description: 'A'.repeat(10000), // Very long description
        categoryId: 'cat-1',
        accountId: 'acc-1',
        date: '2023-12-01T10:00:00.000Z'
      }

      const result = await dataValidator.validateData('expenses', largeExpense, 'INSERT')

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].field).toBe('description')
      expect(result.errors[0].message).toContain('too long')
    })

    test('should cleanup validation history', async () => {
      // Create many validation calls
      for (let i = 0; i < 1000; i++) {
        await dataValidator.validateData('expenses', {
          id: `exp-${i}`,
          amount: 25.50,
          description: `Expense ${i}`,
          categoryId: 'cat-1',
          accountId: 'acc-1',
          date: '2023-12-01T10:00:00.000Z'
        }, 'INSERT')
      }

      const historyBefore = dataValidator.getValidationHistory()
      expect(historyBefore.length).toBeLessThanOrEqual(100) // Should limit history

      dataValidator.clearValidationHistory()
      const historyAfter = dataValidator.getValidationHistory()
      expect(historyAfter).toHaveLength(0)
    })
  })

  describe('Error Handling and Edge Cases', () => {
    test('should handle null/undefined data gracefully', async () => {
      const result = await dataValidator.validateData('expenses', null, 'INSERT')

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].message).toContain('Data is null or undefined')
    })

    test('should handle unknown table names', async () => {
      const result = await dataValidator.validateData('unknown-table', {}, 'INSERT')

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].message).toContain('Unknown table')
    })

    test('should handle circular references', async () => {
      const circularData: any = {
        id: 'exp-1',
        amount: 25.50,
        description: 'Circular expense',
        categoryId: 'cat-1',
        accountId: 'acc-1',
        date: '2023-12-01T10:00:00.000Z'
      }
      circularData.self = circularData

      const result = await dataValidator.validateData('expenses', circularData, 'INSERT')

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].message).toContain('Circular reference')
    })

    test('should handle validation errors gracefully', async () => {
      // Mock validation error
      const originalValidate = dataValidator.validateData
      dataValidator.validateData = jest.fn().mockRejectedValue(new Error('Validation error'))

      const result = await dataValidator.validateData('expenses', {}, 'INSERT')

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].message).toContain('Validation error')

      // Restore original method
      dataValidator.validateData = originalValidate
    })
  })

  describe('Validation Statistics', () => {
    test('should track validation statistics', async () => {
      const initialStats = dataValidator.getValidationStats()
      expect(initialStats.totalValidations).toBe(0)

      // Perform some validations
      await dataValidator.validateData('expenses', {
        id: 'exp-1',
        amount: 25.50,
        description: 'Valid expense',
        categoryId: 'cat-1',
        accountId: 'acc-1',
        date: '2023-12-01T10:00:00.000Z'
      }, 'INSERT')

      await dataValidator.validateData('expenses', {
        id: 'exp-2',
        amount: 'invalid',
        description: 'Invalid expense',
        categoryId: 'cat-1',
        accountId: 'acc-1',
        date: '2023-12-01T10:00:00.000Z'
      }, 'INSERT')

      const stats = dataValidator.getValidationStats()
      expect(stats.totalValidations).toBe(2)
      expect(stats.successfulValidations).toBe(1)
      expect(stats.failedValidations).toBe(1)
    })

    test('should track validation performance', async () => {
      const startTime = Date.now()
      
      await dataValidator.validateData('expenses', {
        id: 'exp-1',
        amount: 25.50,
        description: 'Performance test expense',
        categoryId: 'cat-1',
        accountId: 'acc-1',
        date: '2023-12-01T10:00:00.000Z'
      }, 'INSERT')

      const endTime = Date.now()
      const stats = dataValidator.getValidationStats()
      
      expect(stats.averageValidationTime).toBeLessThan(100) // Should be fast
      expect(endTime - startTime).toBeLessThan(50) // Individual validation should be very fast
    })
  })
})
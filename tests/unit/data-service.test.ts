import { SupabaseDataService } from '@/lib/supabase-data-service'
import { offlineQueue } from '@/lib/offline-queue'
import { connectivityManager } from '@/lib/connectivity-manager'
import { Expense, Category, Account } from '@/lib/types'

// Mock dependencies
jest.mock('@/lib/offline-queue')
jest.mock('@/lib/connectivity-manager')

const mockOfflineQueue = offlineQueue as jest.Mocked<typeof offlineQueue>
const mockConnectivityManager = connectivityManager as jest.Mocked<typeof connectivityManager>

// Use global mockSupabase from setup
declare global {
  var mockSupabase: any
}

jest.mock('@/lib/supabase', () => ({
  supabase: global.mockSupabase
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

describe('Data Service Fallback', () => {
  let dataService: SupabaseDataService

  beforeEach(() => {
    jest.clearAllMocks()
    mockLocalStorage.clear()
    
    // Reset mocks
    mockOfflineQueue.initialize.mockResolvedValue(undefined)
    mockOfflineQueue.add.mockResolvedValue(undefined)
    mockConnectivityManager.canAttemptOperations.mockReturnValue(true)
    mockConnectivityManager.getStatus.mockReturnValue({
      isOnline: true,
      isDatabaseReachable: true,
      lastConnectivityCheck: Date.now()
    })

    dataService = new SupabaseDataService()
  })

  describe('Service Fallback Behavior', () => {
    test('should fallback to localStorage when Supabase unavailable', async () => {
      // Mock Supabase as unavailable
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          order: jest.fn(() => Promise.resolve({
            data: null,
            error: { message: 'Connection failed', code: 'NETWORK_ERROR' }
          }))
        }))
      })

      // Mock connectivity as offline
      mockConnectivityManager.canAttemptOperations.mockReturnValue(false)

      // Add some data to localStorage
      const testExpenses: Expense[] = [
        {
          id: 'exp-1',
          amount: 25.50,
          description: 'Test Expense 1',
          categoryId: 'cat-1',
          accountId: 'acc-1',
          date: new Date().toISOString()
        },
        {
          id: 'exp-2',
          amount: 40.00,
          description: 'Test Expense 2',
          categoryId: 'cat-2',
          accountId: 'acc-1',
          date: new Date().toISOString()
        }
      ]

      mockLocalStorage.store.expenses = JSON.stringify(testExpenses)

      // Test getExpenses fallback
      const expenses = await dataService.getExpenses()
      
      expect(expenses).toEqual(testExpenses)
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('expenses')
      // Should not have called Supabase due to connectivity check
      expect(mockSupabase.from).not.toHaveBeenCalled()
    })

    test('should queue operations when offline', async () => {
      // Mock as offline
      mockConnectivityManager.canAttemptOperations.mockReturnValue(false)

      const newExpense: Expense = {
        id: 'exp-new',
        amount: 15.75,
        description: 'New Expense',
        categoryId: 'cat-1',
        accountId: 'acc-1',
        date: new Date().toISOString()
      }

      // Test createExpense when offline
      await dataService.createExpense(newExpense)

      // Should have queued the operation
      expect(mockOfflineQueue.add).toHaveBeenCalledWith({
        id: expect.any(String),
        type: 'INSERT',
        table: 'expenses',
        data: newExpense,
        timestamp: expect.any(Number),
        retryCount: 0
      })

      // Should have saved to localStorage
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'expenses',
        expect.stringContaining(newExpense.id)
      )

      // Should not have called Supabase
      expect(mockSupabase.from).not.toHaveBeenCalled()
    })

    test('should handle updates when offline', async () => {
      // Mock as offline
      mockConnectivityManager.canAttemptOperations.mockReturnValue(false)

      // Set up existing data
      const existingExpenses: Expense[] = [
        {
          id: 'exp-1',
          amount: 25.50,
          description: 'Original Expense',
          categoryId: 'cat-1',
          accountId: 'acc-1',
          date: new Date().toISOString()
        }
      ]

      mockLocalStorage.store.expenses = JSON.stringify(existingExpenses)

      const updatedExpense: Expense = {
        ...existingExpenses[0],
        amount: 30.00,
        description: 'Updated Expense'
      }

      // Test updateExpense when offline
      await dataService.updateExpense(updatedExpense.id, updatedExpense)

      // Should have queued the operation with original data
      expect(mockOfflineQueue.add).toHaveBeenCalledWith({
        id: expect.any(String),
        type: 'UPDATE',
        table: 'expenses',
        data: updatedExpense,
        originalData: existingExpenses[0],
        timestamp: expect.any(Number),
        retryCount: 0
      })

      // Should have updated localStorage
      const updatedData = JSON.parse(mockLocalStorage.store.expenses)
      expect(updatedData[0].amount).toBe(30.00)
      expect(updatedData[0].description).toBe('Updated Expense')
    })

    test('should handle deletions when offline', async () => {
      // Mock as offline
      mockConnectivityManager.canAttemptOperations.mockReturnValue(false)

      // Set up existing data
      const existingExpenses: Expense[] = [
        {
          id: 'exp-1',
          amount: 25.50,
          description: 'To Delete',
          categoryId: 'cat-1',
          accountId: 'acc-1',
          date: new Date().toISOString()
        },
        {
          id: 'exp-2',
          amount: 40.00,
          description: 'To Keep',
          categoryId: 'cat-2',
          accountId: 'acc-1',
          date: new Date().toISOString()
        }
      ]

      mockLocalStorage.store.expenses = JSON.stringify(existingExpenses)

      // Test deleteExpense when offline
      await dataService.deleteExpense('exp-1')

      // Should have queued the operation
      expect(mockOfflineQueue.add).toHaveBeenCalledWith({
        id: expect.any(String),
        type: 'DELETE',
        table: 'expenses',
        data: { id: 'exp-1' },
        timestamp: expect.any(Number),
        retryCount: 0
      })

      // Should have removed from localStorage
      const remainingData = JSON.parse(mockLocalStorage.store.expenses)
      expect(remainingData).toHaveLength(1)
      expect(remainingData[0].id).toBe('exp-2')
    })
  })

  describe('Data Consistency', () => {
    test('should maintain data consistency between storages', async () => {
      // Mock successful Supabase operations
      const mockInsert = jest.fn(() => Promise.resolve({ data: { id: 'exp-1' }, error: null }))
      const mockSelect = jest.fn(() => ({
        order: jest.fn(() => Promise.resolve({
          data: [
            {
              id: 'exp-1',
              amount: 25.50,
              description: 'Test Expense',
              categoryId: 'cat-1',
              accountId: 'acc-1',
              date: new Date().toISOString()
            }
          ],
          error: null
        }))
      }))

      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
        select: mockSelect
      })

      // Mock as online
      mockConnectivityManager.canAttemptOperations.mockReturnValue(true)

      const newExpense: Expense = {
        id: 'exp-1',
        amount: 25.50,
        description: 'Test Expense',
        categoryId: 'cat-1',
        accountId: 'acc-1',
        date: new Date().toISOString()
      }

      // Create expense when online
      await dataService.createExpense(newExpense)

      // Should have called Supabase
      expect(mockSupabase.from).toHaveBeenCalledWith('expenses')
      expect(mockInsert).toHaveBeenCalledWith(newExpense)

      // Should have also saved to localStorage
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'expenses',
        expect.stringContaining('exp-1')
      )

      // Verify data consistency
      const localData = JSON.parse(mockLocalStorage.store.expenses)
      expect(localData).toHaveLength(1)
      expect(localData[0]).toEqual(newExpense)

      // Test retrieval - should get from Supabase when online
      const retrievedExpenses = await dataService.getExpenses()
      expect(retrievedExpenses).toHaveLength(1)
      expect(retrievedExpenses[0]).toEqual(newExpense)
    })

    test('should handle schema differences gracefully', async () => {
      // Mock Supabase returning data with different schema
      const mockSelect = jest.fn(() => ({
        order: jest.fn(() => Promise.resolve({
          data: [
            {
              id: 'exp-1',
              amount: 25.50,
              description: 'Test Expense',
              category_id: 'cat-1', // Different field name
              account_id: 'acc-1',  // Different field name
              date: new Date().toISOString(),
              extra_field: 'extra_value', // Extra field
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ],
          error: null
        }))
      }))

      mockSupabase.from.mockReturnValue({
        select: mockSelect
      })

      // Mock as online
      mockConnectivityManager.canAttemptOperations.mockReturnValue(true)

      // Set up localStorage with different schema
      const localExpenses = [
        {
          id: 'exp-1',
          amount: 25.50,
          description: 'Test Expense',
          categoryId: 'cat-1', // Camel case
          accountId: 'acc-1',   // Camel case
          date: new Date().toISOString()
        }
      ]

      mockLocalStorage.store.expenses = JSON.stringify(localExpenses)

      // Test getExpenses - should handle schema differences
      const expenses = await dataService.getExpenses()
      
      expect(expenses).toHaveLength(1)
      expect(expenses[0].id).toBe('exp-1')
      expect(expenses[0].amount).toBe(25.50)
      
      // Should handle field name differences gracefully
      expect(expenses[0].categoryId || expenses[0].category_id).toBe('cat-1')
      expect(expenses[0].accountId || expenses[0].account_id).toBe('acc-1')
    })

    test('should sync localStorage with Supabase on connection restore', async () => {
      // Start offline
      mockConnectivityManager.canAttemptOperations.mockReturnValue(false)

      // Add data to localStorage while offline
      const offlineExpenses: Expense[] = [
        {
          id: 'exp-offline-1',
          amount: 15.00,
          description: 'Offline Expense 1',
          categoryId: 'cat-1',
          accountId: 'acc-1',
          date: new Date().toISOString()
        },
        {
          id: 'exp-offline-2',
          amount: 25.00,
          description: 'Offline Expense 2',
          categoryId: 'cat-2',
          accountId: 'acc-1',
          date: new Date().toISOString()
        }
      ]

      mockLocalStorage.store.expenses = JSON.stringify(offlineExpenses)

      // Mock going online
      mockConnectivityManager.canAttemptOperations.mockReturnValue(true)

      // Mock Supabase returning remote data
      const mockSelect = jest.fn(() => ({
        order: jest.fn(() => Promise.resolve({
          data: [
            {
              id: 'exp-remote-1',
              amount: 50.00,
              description: 'Remote Expense 1',
              categoryId: 'cat-1',
              accountId: 'acc-1',
              date: new Date().toISOString()
            }
          ],
          error: null
        }))
      }))

      mockSupabase.from.mockReturnValue({
        select: mockSelect
      })

      // Test getExpenses when coming back online
      const expenses = await dataService.getExpenses()

      // Should get remote data when online
      expect(expenses).toHaveLength(1)
      expect(expenses[0].id).toBe('exp-remote-1')
      expect(expenses[0].amount).toBe(50.00)

      // Should update localStorage with remote data
      const updatedLocalData = JSON.parse(mockLocalStorage.store.expenses)
      expect(updatedLocalData).toHaveLength(1)
      expect(updatedLocalData[0].id).toBe('exp-remote-1')
    })
  })

  describe('Error Handling and Recovery', () => {
    test('should handle localStorage unavailable gracefully', async () => {
      // Mock localStorage methods to throw errors
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage unavailable')
      })
      
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('localStorage unavailable')
      })

      // Mock Supabase as unavailable too
      mockConnectivityManager.canAttemptOperations.mockReturnValue(false)

      // Should handle gracefully and not crash
      await expect(dataService.getExpenses()).resolves.toEqual([])
      
      const newExpense: Expense = {
        id: 'exp-1',
        amount: 25.50,
        description: 'Test Expense',
        categoryId: 'cat-1',
        accountId: 'acc-1',
        date: new Date().toISOString()
      }

      // Should handle creation gracefully
      await expect(dataService.createExpense(newExpense)).resolves.not.toThrow()
    })

    test('should handle corrupted localStorage data gracefully', async () => {
      // Mock corrupted localStorage data
      mockLocalStorage.store.expenses = 'corrupted-json-data'
      
      // Mock as offline
      mockConnectivityManager.canAttemptOperations.mockReturnValue(false)

      // Should handle corruption gracefully
      const expenses = await dataService.getExpenses()
      expect(expenses).toEqual([])

      // Should be able to add new data after corruption
      const newExpense: Expense = {
        id: 'exp-1',
        amount: 25.50,
        description: 'Test Expense',
        categoryId: 'cat-1',
        accountId: 'acc-1',
        date: new Date().toISOString()
      }

      await dataService.createExpense(newExpense)

      // Should have reset localStorage with valid data
      const resetData = JSON.parse(mockLocalStorage.store.expenses)
      expect(resetData).toHaveLength(1)
      expect(resetData[0]).toEqual(newExpense)
    })

    test('should handle mixed online/offline state transitions', async () => {
      // Start online
      mockConnectivityManager.canAttemptOperations.mockReturnValue(true)

      // Mock successful Supabase operation
      const mockInsert = jest.fn(() => Promise.resolve({ data: { id: 'exp-1' }, error: null }))
      mockSupabase.from.mockReturnValue({
        insert: mockInsert
      })

      const expense1: Expense = {
        id: 'exp-1',
        amount: 25.50,
        description: 'Online Expense',
        categoryId: 'cat-1',
        accountId: 'acc-1',
        date: new Date().toISOString()
      }

      // Create expense while online
      await dataService.createExpense(expense1)

      expect(mockInsert).toHaveBeenCalledWith(expense1)
      expect(mockOfflineQueue.add).not.toHaveBeenCalled()

      // Go offline
      mockConnectivityManager.canAttemptOperations.mockReturnValue(false)

      const expense2: Expense = {
        id: 'exp-2',
        amount: 40.00,
        description: 'Offline Expense',
        categoryId: 'cat-2',
        accountId: 'acc-1',
        date: new Date().toISOString()
      }

      // Create expense while offline
      await dataService.createExpense(expense2)

      expect(mockOfflineQueue.add).toHaveBeenCalledWith({
        id: expect.any(String),
        type: 'INSERT',
        table: 'expenses',
        data: expense2,
        timestamp: expect.any(Number),
        retryCount: 0
      })

      // Both expenses should be in localStorage
      const localData = JSON.parse(mockLocalStorage.store.expenses)
      expect(localData).toHaveLength(2)
      expect(localData.find((e: Expense) => e.id === 'exp-1')).toBeTruthy()
      expect(localData.find((e: Expense) => e.id === 'exp-2')).toBeTruthy()
    })
  })

  describe('Performance and Optimization', () => {
    test('should handle large datasets efficiently', async () => {
      // Mock as offline
      mockConnectivityManager.canAttemptOperations.mockReturnValue(false)

      // Generate large dataset
      const largeExpenseSet: Expense[] = []
      for (let i = 0; i < 1000; i++) {
        largeExpenseSet.push({
          id: `exp-${i}`,
          amount: Math.round(Math.random() * 1000 * 100) / 100,
          description: `Expense ${i}`,
          categoryId: `cat-${i % 10}`,
          accountId: `acc-${i % 5}`,
          date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
        })
      }

      // Store large dataset
      mockLocalStorage.store.expenses = JSON.stringify(largeExpenseSet)

      // Test retrieval performance
      const startTime = Date.now()
      const expenses = await dataService.getExpenses()
      const retrievalTime = Date.now() - startTime

      expect(expenses).toHaveLength(1000)
      expect(retrievalTime).toBeLessThan(1000) // Should complete within 1 second
    })

    test('should batch localStorage operations efficiently', async () => {
      // Mock as offline
      mockConnectivityManager.canAttemptOperations.mockReturnValue(false)

      // Create multiple expenses quickly
      const expensePromises = []
      for (let i = 0; i < 10; i++) {
        const expense: Expense = {
          id: `exp-${i}`,
          amount: i * 10,
          description: `Expense ${i}`,
          categoryId: 'cat-1',
          accountId: 'acc-1',
          date: new Date().toISOString()
        }
        expensePromises.push(dataService.createExpense(expense))
      }

      // Execute all operations concurrently
      const startTime = Date.now()
      await Promise.all(expensePromises)
      const operationTime = Date.now() - startTime

      // Should complete efficiently
      expect(operationTime).toBeLessThan(500) // Should complete within 500ms

      // All expenses should be queued
      expect(mockOfflineQueue.add).toHaveBeenCalledTimes(10)

      // All expenses should be in localStorage
      const localData = JSON.parse(mockLocalStorage.store.expenses)
      expect(localData).toHaveLength(10)
    })
  })

  describe('Category and Account Operations', () => {
    test('should handle category operations with fallback', async () => {
      // Test categories when offline
      mockConnectivityManager.canAttemptOperations.mockReturnValue(false)

      const testCategories: Category[] = [
        {
          id: 'cat-1',
          name: 'Food',
          color: '#ff0000'
        },
        {
          id: 'cat-2',
          name: 'Transport',
          color: '#00ff00'
        }
      ]

      mockLocalStorage.store.categories = JSON.stringify(testCategories)

      // Test getCategories fallback
      const categories = await dataService.getCategories()
      expect(categories).toEqual(testCategories)

      // Test createCategory when offline
      const newCategory: Category = {
        id: 'cat-3',
        name: 'Entertainment',
        color: '#0000ff'
      }

      await dataService.createCategory(newCategory)

      // Should have queued the operation
      expect(mockOfflineQueue.add).toHaveBeenCalledWith({
        id: expect.any(String),
        type: 'INSERT',
        table: 'categories',
        data: newCategory,
        timestamp: expect.any(Number),
        retryCount: 0
      })

      // Should have saved to localStorage
      const updatedCategories = JSON.parse(mockLocalStorage.store.categories)
      expect(updatedCategories).toHaveLength(3)
      expect(updatedCategories.find((c: Category) => c.id === 'cat-3')).toBeTruthy()
    })

    test('should handle account operations with fallback', async () => {
      // Test accounts when offline
      mockConnectivityManager.canAttemptOperations.mockReturnValue(false)

      const testAccounts: Account[] = [
        {
          id: 'acc-1',
          name: 'Checking Account',
          type: 'checking',
          balance: 1000.00
        },
        {
          id: 'acc-2',
          name: 'Savings Account',
          type: 'savings',
          balance: 5000.00
        }
      ]

      mockLocalStorage.store.accounts = JSON.stringify(testAccounts)

      // Test getAccounts fallback
      const accounts = await dataService.getAccounts()
      expect(accounts).toEqual(testAccounts)

      // Test updateAccount when offline
      const updatedAccount: Account = {
        ...testAccounts[0],
        balance: 950.00
      }

      await dataService.updateAccount(updatedAccount.id, updatedAccount)

      // Should have queued the operation with original data
      expect(mockOfflineQueue.add).toHaveBeenCalledWith({
        id: expect.any(String),
        type: 'UPDATE',
        table: 'accounts',
        data: updatedAccount,
        originalData: testAccounts[0],
        timestamp: expect.any(Number),
        retryCount: 0
      })

      // Should have updated localStorage
      const updatedAccounts = JSON.parse(mockLocalStorage.store.accounts)
      expect(updatedAccounts[0].balance).toBe(950.00)
    })
  })
})
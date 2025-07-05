/**
 * Supabase Data Hooks
 * 
 * Custom React hooks that provide data from Supabase with localStorage fallback.
 * These hooks can replace the existing useLocalStorage hooks gradually.
 */

import { useState, useEffect, useCallback } from 'react'
import { dataService, DataServiceConfig, DataSource } from '../lib/supabase-data-service'
import { Account, Category, Expense, Theme } from '../lib/types'

export interface UseDataHookResult<T> {
  data: T
  loading: boolean
  error: Error | null
  source: DataSource | null
  refetch: () => Promise<void>
}

export interface UseDataListHookResult<T> {
  data: T[]
  loading: boolean
  error: Error | null
  source: DataSource | null
  refetch: () => Promise<void>
  create: (item: Omit<T, 'id'>) => Promise<void>
  update: (id: string, updates: Partial<T>) => Promise<void>
  delete: (id: string) => Promise<void>
}

/**
 * Hook for managing accounts with Supabase sync
 */
export function useSupabaseAccounts(): UseDataListHookResult<Account> {
  const [data, setData] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [source, setSource] = useState<DataSource | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await dataService.getAccounts()
      setData(result.data)
      setError(result.error)
      setSource(result.source)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [])

  const create = useCallback(async (account: Omit<Account, 'id'>) => {
    try {
      const result = await dataService.createAccount(account)
      if (result.error) throw result.error
      await fetchData() // Refresh data
    } catch (err) {
      setError(err as Error)
    }
  }, [fetchData])

  const update = useCallback(async (value: string, updates: Partial<Account>) => {
    try {
      const result = await dataService.updateAccount(value, updates)
      if (result.error) throw result.error
      await fetchData() // Refresh data
    } catch (err) {
      setError(err as Error)
    }
  }, [fetchData])

  const deleteAccount = useCallback(async (value: string) => {
    try {
      const result = await dataService.deleteAccount(value)
      if (result.error) throw result.error
      await fetchData() // Refresh data
    } catch (err) {
      setError(err as Error)
    }
  }, [fetchData])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    loading,
    error,
    source,
    refetch: fetchData,
    create,
    update,
    delete: deleteAccount,
  }
}

/**
 * Hook for managing categories with Supabase sync
 */
export function useSupabaseCategories(): UseDataListHookResult<Category> {
  const [data, setData] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [source, setSource] = useState<DataSource | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await dataService.getCategories()
      setData(result.data)
      setError(result.error)
      setSource(result.source)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [])

  const create = useCallback(async (category: Omit<Category, 'id'>) => {
    try {
      const result = await dataService.createCategory(category)
      if (result.error) throw result.error
      await fetchData() // Refresh data
    } catch (err) {
      setError(err as Error)
    }
  }, [fetchData])

  const update = useCallback(async (value: string, updates: Partial<Category>) => {
    // TODO: Implement updateCategory in dataService
    console.warn('Category update not yet implemented')
  }, [])

  const deleteCategory = useCallback(async (value: string) => {
    // TODO: Implement deleteCategory in dataService
    console.warn('Category delete not yet implemented')
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    loading,
    error,
    source,
    refetch: fetchData,
    create,
    update,
    delete: deleteCategory,
  }
}

/**
 * Hook for managing expenses with Supabase sync
 */
export function useSupabaseExpenses(): UseDataListHookResult<Expense> {
  const [data, setData] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [source, setSource] = useState<DataSource | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await dataService.getExpenses()
      setData(result.data)
      setError(result.error)
      setSource(result.source)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [])

  const create = useCallback(async (expense: Omit<Expense, 'id'>) => {
    // TODO: Implement createExpense in dataService
    console.warn('Expense create not yet implemented')
  }, [])

  const update = useCallback(async (id: string, updates: Partial<Expense>) => {
    // TODO: Implement updateExpense in dataService
    console.warn('Expense update not yet implemented')
  }, [])

  const deleteExpense = useCallback(async (id: string) => {
    // TODO: Implement deleteExpense in dataService
    console.warn('Expense delete not yet implemented')
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    loading,
    error,
    source,
    refetch: fetchData,
    create,
    update,
    delete: deleteExpense,
  }
}

/**
 * Hook for managing theme with Supabase sync
 */
export function useSupabaseTheme(defaultTheme: Theme): UseDataHookResult<Theme> {
  const [data, setData] = useState<Theme>(defaultTheme)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [source, setSource] = useState<DataSource | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await dataService.getTheme()
      setData(result.data || defaultTheme)
      setError(result.error)
      setSource(result.source)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [defaultTheme])

  const saveTheme = useCallback(async (theme: Theme) => {
    try {
      const result = await dataService.saveTheme(theme)
      if (result.error) throw result.error
      setData(theme)
    } catch (err) {
      setError(err as Error)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    loading,
    error,
    source,
    refetch: fetchData,
    setTheme: saveTheme, // Additional method for themes
  } as UseDataHookResult<Theme> & { setTheme: (theme: Theme) => Promise<void> }
}

/**
 * Hook for managing data service configuration
 */
export function useDataServiceConfig() {
  const [config, setConfigState] = useState<DataServiceConfig>(dataService.getConfig())

  const updateConfig = useCallback((newConfig: Partial<DataServiceConfig>) => {
    dataService.updateConfig(newConfig)
    setConfigState(dataService.getConfig())
  }, [])

  const clearCache = useCallback(() => {
    dataService.clearCache()
  }, [])

  return {
    config,
    updateConfig,
    clearCache,
  }
}

/**
 * Hook for syncing all data at once
 */
export function useDataSync() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [lastSync, setLastSync] = useState<Date | null>(null)

  const syncAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      await dataService.syncAllData()
      setLastSync(new Date())
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    error,
    lastSync,
    syncAll,
  }
}

/**
 * Hook to check data source status
 */
export function useDataSourceStatus() {
  const [status, setStatus] = useState<{
    supabaseAvailable: boolean
    localStorageAvailable: boolean
    currentSource: DataSource
  }>({
    supabaseAvailable: false,
    localStorageAvailable: typeof window !== 'undefined',
    currentSource: 'localStorage',
  })

  useEffect(() => {
    const checkStatus = async () => {
      // Check Supabase availability
      try {
        const result = await dataService.getAccounts()
        setStatus(prev => ({
          ...prev,
          supabaseAvailable: !result.error,
          currentSource: result.source,
        }))
      } catch {
        setStatus(prev => ({
          ...prev,
          supabaseAvailable: false,
        }))
      }
    }

    checkStatus()
  }, [])

  return status
}
/**
 * Supabase Data Service - Enhanced with Offline-First Support
 * 
 * Provides bidirectional data synchronization between localStorage and Supabase.
 * Handles CRUD operations for all data types with proper error handling and caching.
 * Now includes automatic offline queue and connectivity management.
 */

import { supabase } from './supabase'
import { Account, Category, Expense, Theme, HSLColor, User } from './types'
import { offlineQueue, QueueUtils } from './offline-queue'
import { connectivityManager } from './connectivity-manager'

export type DataSource = 'localStorage' | 'supabase'

/**
 * Generic interface for data operations
 */
export interface DataServiceResult<T> {
  data: T | null
  error: Error | null
  source: DataSource
}

export interface DataListResult<T> {
  data: T[]
  error: Error | null
  source: DataSource
}

/**
 * Configuration for data service behavior
 */
export interface DataServiceConfig {
  primarySource: DataSource
  fallbackToSecondary: boolean
  enableRealTimeSync: boolean
  enableOfflineQueue: boolean // NEW: Enable automatic offline queue
  autoSyncInterval: number // NEW: Auto-sync interval in milliseconds
  cacheTimeout: number // in milliseconds
}

const DEFAULT_CONFIG: DataServiceConfig = {
  primarySource: 'localStorage',
  fallbackToSecondary: true,
  enableRealTimeSync: false,
  enableOfflineQueue: true, // Enable offline-first by default
  autoSyncInterval: 10000, // 10 seconds
  cacheTimeout: 5 * 60 * 1000, // 5 minutes
}

/**
 * Cache for Supabase data to reduce API calls
 */
class DataCache {
  private cache = new Map<string, { data: any; timestamp: number }>()
  private timeout: number

  constructor(timeout: number = DEFAULT_CONFIG.cacheTimeout) {
    this.timeout = timeout
  }

  set(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() })
  }

  get(key: string): any | null {
    const item = this.cache.get(key)
    if (!item) return null
    
    if (Date.now() - item.timestamp > this.timeout) {
      this.cache.delete(key)
      return null
    }
    
    return item.data
  }

  clear(): void {
    this.cache.clear()
  }

  invalidate(key: string): void {
    this.cache.delete(key)
  }
}

/**
 * Main data service class - Enhanced with Offline-First Support
 */
export class SupabaseDataService {
  private config: DataServiceConfig
  private cache: DataCache
  private isSupabaseEnabled: boolean
  private userId: string | null = null
  private isInitialized: boolean = false
  private autoSyncTimer: NodeJS.Timeout | null = null

  constructor(config: Partial<DataServiceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.cache = new DataCache(this.config.cacheTimeout)
    this.isSupabaseEnabled = supabase !== null
    
    // If Supabase is not configured, force localStorage as primary source
    if (!this.isSupabaseEnabled) {
      this.config.primarySource = 'localStorage'
      this.config.fallbackToSecondary = false
      this.config.enableOfflineQueue = false
    }
  }

  /**
   * Initialize offline-first capabilities
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      // Initialize offline queue if enabled
      if (this.config.enableOfflineQueue) {
        await offlineQueue.initialize()
        console.log('Offline queue initialized')
      }

      // Initialize connectivity manager
      await connectivityManager.initialize()
      console.log('Connectivity manager initialized')

      // Start auto-sync if offline queue is enabled
      if (this.config.enableOfflineQueue) {
        this.startAutoSync()
      }

      this.isInitialized = true
      console.log('Data service initialized with offline-first support')
    } catch (error) {
      console.error('Failed to initialize data service:', error)
      // Continue without offline features
      this.isInitialized = true
    }
  }

  /**
   * Start automatic sync process
   */
  private startAutoSync(): void {
    if (this.autoSyncTimer) {
      clearInterval(this.autoSyncTimer)
    }

    this.autoSyncTimer = setInterval(async () => {
      try {
        await this.processOfflineQueue()
      } catch (error) {
        console.error('Auto-sync error:', error)
      }
    }, this.config.autoSyncInterval)

    console.log(`Auto-sync started with ${this.config.autoSyncInterval / 1000}s interval`)
  }

  /**
   * Process pending offline queue operations
   */
  async processOfflineQueue(): Promise<void> {
    if (!this.config.enableOfflineQueue || !connectivityManager.canAttemptOperations()) {
      return
    }

    try {
      const pendingOps = await offlineQueue.getPending()
      if (pendingOps.length === 0) return

      console.log(`Processing ${pendingOps.length} pending operations`)
      offlineQueue.setProcessing(true)

      // Deduplicate operations to optimize processing
      await offlineQueue.deduplicateOperations()
      const deduplicatedOps = await offlineQueue.getPending()

      // Process operations in batches
      for (const operation of deduplicatedOps) {
        try {
          await this.executeQueuedOperation(operation)
          await offlineQueue.remove(operation.id)
          console.log(`Completed operation: ${operation.type} ${operation.table}`)
        } catch (error) {
          console.error(`Failed to execute operation ${operation.id}:`, error)
          
          // Update retry count and error
          operation.retryCount++
          operation.lastError = error instanceof Error ? error.message : 'Unknown error'
          
          if (QueueUtils.canRetry(operation)) {
            await offlineQueue.update(operation)
          } else {
            console.error(`Max retries exceeded for operation ${operation.id}, removing from queue`)
            await offlineQueue.remove(operation.id)
          }
        }
      }
    } catch (error) {
      console.error('Error processing offline queue:', error)
    } finally {
      offlineQueue.setProcessing(false)
    }
  }

  /**
   * Execute a queued operation
   */
  private async executeQueuedOperation(operation: any): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase not available')
    }

    const { type, table, data } = operation

    switch (type) {
      case 'INSERT':
        await supabase.from(table).insert(data)
        break
      
      case 'UPDATE':
        await supabase.from(table).update(data).eq('id', data.id)
        break
      
      case 'DELETE':
        await supabase.from(table).delete().eq('id', data.id)
        break
      
      default:
        throw new Error(`Unknown operation type: ${type}`)
    }
  }

  /**
   * Enhanced write operation with offline queue support
   */
  private async writeWithOfflineSupport<T>(
    table: string,
    operation: 'INSERT' | 'UPDATE' | 'DELETE',
    data: T,
    originalData?: T
  ): Promise<DataServiceResult<T>> {
    // Always update localStorage immediately for instant UI updates
    await this.updateLocalStorage(table, operation, data)

    // If we have connectivity, try to write to Supabase immediately
    if (connectivityManager.canAttemptOperations()) {
      try {
        const result = await this.executeSupabaseOperation(table, operation, data)
        return { data: result, error: null, source: 'supabase' }
      } catch (error) {
        console.warn(`Direct Supabase write failed, queuing for later:`, error)
        // Fall through to queue the operation
      }
    }

    // Queue the operation for later if offline or direct write failed
    if (this.config.enableOfflineQueue) {
      try {
        const queueOp = this.createQueueOperation(table, operation, data, originalData)
        await offlineQueue.add(queueOp)
        console.log(`Operation queued: ${operation} ${table}`)
      } catch (error) {
        console.error('Failed to queue operation:', error)
        return { data: null, error: error as Error, source: 'localStorage' }
      }
    }

    return { data: data, error: null, source: 'localStorage' }
  }

  /**
   * Execute Supabase operation directly
   */
  private async executeSupabaseOperation<T>(
    table: string,
    operation: 'INSERT' | 'UPDATE' | 'DELETE',
    data: T
  ): Promise<T> {
    if (!supabase) {
      throw new Error('Supabase not available')
    }

    let query: any
    
    switch (operation) {
      case 'INSERT':
        query = supabase.from(table).insert(data).select()
        break
      
      case 'UPDATE':
        query = supabase.from(table).update(data).eq('id', (data as any).id).select()
        break
      
      case 'DELETE':
        query = supabase.from(table).delete().eq('id', (data as any).id).select()
        break
      
      default:
        throw new Error(`Unknown operation: ${operation}`)
    }

    const { data: result, error } = await query

    if (error) {
      throw new Error(`Supabase ${operation} failed: ${error.message}`)
    }

    return operation === 'DELETE' ? data : (result?.[0] || data)
  }

  /**
   * Update localStorage immediately for UI responsiveness
   */
  private async updateLocalStorage<T>(
    table: string,
    operation: 'INSERT' | 'UPDATE' | 'DELETE',
    data: T
  ): Promise<void> {
    try {
      const storageKey = this.getStorageKey(table)
      const existingData = this.getLocalStorageData<T>(table)
      let updatedData = [...existingData]

      switch (operation) {
        case 'INSERT':
          updatedData.push(data)
          break
        
        case 'UPDATE':
          const updateIndex = updatedData.findIndex((item: any) => item.id === (data as any).id)
          if (updateIndex !== -1) {
            updatedData[updateIndex] = data
          }
          break
        
        case 'DELETE':
          updatedData = updatedData.filter((item: any) => item.id !== (data as any).id)
          break
      }

      localStorage.setItem(storageKey, JSON.stringify(updatedData))
      this.cache.invalidate(table)
    } catch (error) {
      console.error(`Failed to update localStorage for ${table}:`, error)
    }
  }

  /**
   * Create queue operation from data
   */
  private createQueueOperation<T>(
    table: string,
    operation: 'INSERT' | 'UPDATE' | 'DELETE',
    data: T,
    originalData?: T
  ): Omit<any, 'id' | 'timestamp' | 'retryCount'> {
    switch (operation) {
      case 'INSERT':
        return QueueUtils.createInsertOperation(table, data, this.userId || undefined)
      
      case 'UPDATE':
        return QueueUtils.createUpdateOperation(table, data, originalData, this.userId || undefined)
      
      case 'DELETE':
        return QueueUtils.createDeleteOperation(table, data, this.userId || undefined)
      
      default:
        throw new Error(`Unknown operation: ${operation}`)
    }
  }

  /**
   * Get offline queue status
   */
  async getOfflineStatus(): Promise<{ 
    isOnline: boolean
    pendingOperations: number
    lastSync: number | null
  }> {
    const connectivityStatus = connectivityManager.getStatus()
    const queueStatus = await offlineQueue.getStatus()
    
    return {
      isOnline: connectivityStatus.isDatabaseReachable,
      pendingOperations: queueStatus.totalPending,
      lastSync: queueStatus.lastProcessed
    }
  }

  /**
   * Force sync all pending operations
   */
  async forceSyncAll(): Promise<void> {
    if (!this.config.enableOfflineQueue) return
    
    console.log('Forcing sync of all pending operations...')
    await this.processOfflineQueue()
  }

  /**
   * Set the current user ID for user-scoped operations
   */
  setUserId(userId: string | null): void {
    this.userId = userId
    // Clear cache when user changes
    this.cache.clear()
  }

  /**
   * Get current user ID
   */
  getUserId(): string | null {
    return this.userId
  }

  /**
   * Cleanup resources and stop auto-sync
   */
  cleanup(): void {
    // Stop auto-sync timer
    if (this.autoSyncTimer) {
      clearInterval(this.autoSyncTimer)
      this.autoSyncTimer = null
    }

    // Cleanup offline queue
    if (this.config.enableOfflineQueue) {
      offlineQueue.cleanup()
    }

    // Cleanup connectivity manager
    connectivityManager.cleanup()

    // Clear cache
    this.cache.clear()

    this.isInitialized = false
    console.log('Data service cleaned up')
  }

  /**
   * Get localStorage key scoped to user (when authenticated) or global (when not)
   */
  private getStorageKey(key: string): string {
    return this.userId ? `${key}_${this.userId}` : key
  }

  // ==================== ACCOUNTS ====================

  async getAccounts(): Promise<DataListResult<Account>> {
    if (this.config.primarySource === 'localStorage') {
      const localData = this.getLocalStorageData<Account>('accounts')
      if (localData.length > 0 || !this.config.fallbackToSecondary) {
        return { data: localData, error: null, source: 'localStorage' }
      }
    }

    // Try cache first
    const cached = this.cache.get('accounts')
    if (cached) {
      return { data: cached, error: null, source: 'supabase' }
    }

    if (!supabase) {
      return { data: [], error: new Error('Supabase not configured'), source: 'supabase' }
    }

    try {
      let query = supabase
        .from('accounts')
        .select('*')
        .order('created_at', { ascending: true })

      // Add user filter if authenticated
      if (this.userId) {
        query = query.eq('user_id', this.userId)
      }

      const { data, error } = await query

      if (error) throw error

      const accounts: Account[] = data.map(row => ({
        value: row.value,
        label: row.label,
        icon: row.icon,
        owner: row.owner,
        user_id: row.user_id,
      }))

      this.cache.set('accounts', accounts)
      return { data: accounts, error: null, source: 'supabase' }
    } catch (error) {
      if (this.config.fallbackToSecondary && this.config.primarySource === 'supabase') {
        const localData = this.getLocalStorageData<Account>('accounts')
        return { data: localData, error: error as Error, source: 'localStorage' }
      }
      return { data: [], error: error as Error, source: 'supabase' }
    }
  }

  async createAccount(account: Omit<Account, 'id'>): Promise<DataServiceResult<Account>> {
    if (!supabase) {
      return { data: null, error: new Error('Supabase not configured'), source: 'supabase' }
    }

    if (!this.userId) {
      return { data: null, error: new Error('User not authenticated'), source: 'supabase' }
    }

    try {
      const { data, error } = await supabase
        .from('accounts')
        .insert({
          user_id: this.userId,
          value: account.value,
          label: account.label,
          icon: account.icon,
          owner: account.owner,
        })
        .select()
        .single()

      if (error) throw error

      const newAccount: Account = {
        value: data.value,
        label: data.label,
        icon: data.icon,
        owner: data.owner,
        user_id: data.user_id,
      }

      // Update localStorage if it's being used
      const localAccounts = this.getLocalStorageData<Account>('accounts')
      if (!localAccounts.find(a => a.value === account.value)) {
        this.setLocalStorageData('accounts', [...localAccounts, newAccount])
      }

      this.cache.invalidate('accounts')
      return { data: newAccount, error: null, source: 'supabase' }
    } catch (error) {
      return { data: null, error: error as Error, source: 'supabase' }
    }
  }

  async updateAccount(value: string, updates: Partial<Account>): Promise<DataServiceResult<Account>> {
    if (!supabase) {
      return { data: null, error: new Error('Supabase not configured'), source: 'supabase' }
    }

    try {
      const { data, error } = await supabase
        .from('accounts')
        .update({
          label: updates.label,
          icon: updates.icon,
          owner: updates.owner,
        })
        .eq('value', value)
        .select()
        .single()

      if (error) throw error

      const updatedAccount: Account = {
        value: data.value,
        label: data.label,
        icon: data.icon,
        owner: data.owner,
      }

      // Update localStorage
      const localAccounts = this.getLocalStorageData<Account>('accounts')
      const updatedAccounts = localAccounts.map(a => 
        a.value === value ? { ...a, ...updates } : a
      )
      this.setLocalStorageData('accounts', updatedAccounts)

      this.cache.invalidate('accounts')
      return { data: updatedAccount, error: null, source: 'supabase' }
    } catch (error) {
      return { data: null, error: error as Error, source: 'supabase' }
    }
  }

  async deleteAccount(value: string): Promise<DataServiceResult<boolean>> {
    if (!supabase) {
      return { data: false, error: new Error('Supabase not configured'), source: 'supabase' }
    }

    try {
      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('value', value)

      if (error) throw error

      // Update localStorage
      const localAccounts = this.getLocalStorageData<Account>('accounts')
      const filteredAccounts = localAccounts.filter(a => a.value !== value)
      this.setLocalStorageData('accounts', filteredAccounts)

      this.cache.invalidate('accounts')
      return { data: true, error: null, source: 'supabase' }
    } catch (error) {
      return { data: false, error: error as Error, source: 'supabase' }
    }
  }

  // ==================== CATEGORIES ====================

  async getCategories(): Promise<DataListResult<Category>> {
    if (this.config.primarySource === 'localStorage') {
      const localData = this.getLocalStorageData<Category>('categories')
      if (localData.length > 0 || !this.config.fallbackToSecondary) {
        return { data: localData, error: null, source: 'localStorage' }
      }
    }

    const cached = this.cache.get('categories')
    if (cached) {
      return { data: cached, error: null, source: 'supabase' }
    }

    if (!supabase) {
      return { data: [], error: new Error('Supabase not configured'), source: 'supabase' }
    }

    try {
      let query = supabase
        .from('categories')
        .select('*')
        .order('created_at', { ascending: true })

      // Add user filter if authenticated
      if (this.userId) {
        query = query.eq('user_id', this.userId)
      }

      const { data, error } = await query

      if (error) throw error

      const categories: Category[] = data.map(row => ({
        value: row.value,
        label: row.label,
        icon: row.icon,
        color: row.color,
        threshold: row.threshold || undefined,
        user_id: row.user_id,
      }))

      this.cache.set('categories', categories)
      return { data: categories, error: null, source: 'supabase' }
    } catch (error) {
      if (this.config.fallbackToSecondary && this.config.primarySource === 'supabase') {
        const localData = this.getLocalStorageData<Category>('categories')
        return { data: localData, error: error as Error, source: 'localStorage' }
      }
      return { data: [], error: error as Error, source: 'supabase' }
    }
  }

  async createCategory(category: Omit<Category, 'id'>): Promise<DataServiceResult<Category>> {
    if (!supabase) {
      return { data: null, error: new Error('Supabase not configured'), source: 'supabase' }
    }

    if (!this.userId) {
      return { data: null, error: new Error('User not authenticated'), source: 'supabase' }
    }

    try {
      const { data, error } = await supabase
        .from('categories')
        .insert({
          user_id: this.userId,
          value: category.value,
          label: category.label,
          icon: category.icon,
          color: category.color,
          threshold: category.threshold || null,
        })
        .select()
        .single()

      if (error) throw error

      const newCategory: Category = {
        value: data.value,
        label: data.label,
        icon: data.icon,
        color: data.color,
        threshold: data.threshold || undefined,
        user_id: data.user_id,
      }

      // Update localStorage
      const localCategories = this.getLocalStorageData<Category>('categories')
      if (!localCategories.find(c => c.value === category.value)) {
        this.setLocalStorageData('categories', [...localCategories, newCategory])
      }

      this.cache.invalidate('categories')
      return { data: newCategory, error: null, source: 'supabase' }
    } catch (error) {
      return { data: null, error: error as Error, source: 'supabase' }
    }
  }

  // ==================== THEMES ====================

  async getTheme(): Promise<DataServiceResult<Theme>> {
    if (this.config.primarySource === 'localStorage') {
      const localTheme = this.getLocalStorageItem<Theme>('app-theme')
      if (localTheme || !this.config.fallbackToSecondary) {
        return { data: localTheme, error: null, source: 'localStorage' }
      }
    }

    const cached = this.cache.get('theme')
    if (cached) {
      return { data: cached, error: null, source: 'supabase' }
    }

    if (!supabase) {
      return { data: null, error: new Error('Supabase not configured'), source: 'supabase' }
    }

    try {
      const { data, error } = await supabase
        .from('themes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error) throw error

      const theme: Theme = {
        name: data.name,
        primary: {
          h: data.primary_hue,
          s: data.primary_saturation,
          l: data.primary_lightness,
        },
        background: {
          h: data.background_hue,
          s: data.background_saturation,
          l: data.background_lightness,
        },
        accent: {
          h: data.accent_hue,
          s: data.accent_saturation,
          l: data.accent_lightness,
        },
        radius: data.radius,
      }

      this.cache.set('theme', theme)
      return { data: theme, error: null, source: 'supabase' }
    } catch (error) {
      if (this.config.fallbackToSecondary && this.config.primarySource === 'supabase') {
        const localTheme = this.getLocalStorageItem<Theme>('app-theme')
        return { data: localTheme, error: error as Error, source: 'localStorage' }
      }
      return { data: null, error: error as Error, source: 'supabase' }
    }
  }

  async saveTheme(theme: Theme): Promise<DataServiceResult<Theme>> {
    if (!supabase) {
      return { data: null, error: new Error('Supabase not configured'), source: 'supabase' }
    }

    try {
      const { data, error } = await supabase
        .from('themes')
        .upsert({
          name: theme.name,
          primary_hue: theme.primary.h,
          primary_saturation: theme.primary.s,
          primary_lightness: theme.primary.l,
          background_hue: theme.background.h,
          background_saturation: theme.background.s,
          background_lightness: theme.background.l,
          accent_hue: theme.accent.h,
          accent_saturation: theme.accent.s,
          accent_lightness: theme.accent.l,
          radius: theme.radius,
        })
        .select()
        .single()

      if (error) throw error

      // Update localStorage
      this.setLocalStorageItem('app-theme', theme)

      this.cache.invalidate('theme')
      return { data: theme, error: null, source: 'supabase' }
    } catch (error) {
      return { data: null, error: error as Error, source: 'supabase' }
    }
  }

  // ==================== EXPENSES ====================

  async getExpenses(): Promise<DataListResult<Expense>> {
    if (this.config.primarySource === 'localStorage') {
      const localData = this.getLocalStorageData<Expense>('expenses')
      if (localData.length > 0 || !this.config.fallbackToSecondary) {
        return { data: localData, error: null, source: 'localStorage' }
      }
    }

    const cached = this.cache.get('expenses')
    if (cached) {
      return { data: cached, error: null, source: 'supabase' }
    }

    if (!supabase) {
      return { data: [], error: new Error('Supabase not configured'), source: 'supabase' }
    }

    try {
      const { data, error } = await supabase
        .from('expenses')
        .select(`
          *,
          categories!inner(value),
          accounts!inner(value)
        `)
        .order('date', { ascending: false })

      if (error) throw error

      const expenses: Expense[] = data.map(row => ({
        id: row.id,
        description: row.description,
        amount: row.amount,
        date: row.date,
        category: row.categories.value,
        accountTypeId: row.accounts.value,
        accountOwner: row.accounts.owner,
        receiptImage: row.receipt_image || undefined,
      }))

      this.cache.set('expenses', expenses)
      return { data: expenses, error: null, source: 'supabase' }
    } catch (error) {
      if (this.config.fallbackToSecondary && this.config.primarySource === 'supabase') {
        const localData = this.getLocalStorageData<Expense>('expenses')
        return { data: localData, error: error as Error, source: 'localStorage' }
      }
      return { data: [], error: error as Error, source: 'supabase' }
    }
  }

  // ==================== UTILITY METHODS ====================

  private checkSupabaseConnection(): boolean {
    return supabase !== null
  }

  private getLocalStorageData<T>(key: string): T[] {
    if (typeof window === 'undefined') return []
    try {
      const scopedKey = this.getStorageKey(key)
      const item = window.localStorage.getItem(scopedKey)
      return item ? JSON.parse(item) : []
    } catch {
      return []
    }
  }

  private getLocalStorageItem<T>(key: string): T | null {
    if (typeof window === 'undefined') return null
    try {
      const scopedKey = this.getStorageKey(key)
      const item = window.localStorage.getItem(scopedKey)
      return item ? JSON.parse(item) : null
    } catch {
      return null
    }
  }

  private setLocalStorageData<T>(key: string, data: T[]): void {
    if (typeof window === 'undefined') return
    try {
      const scopedKey = this.getStorageKey(key)
      window.localStorage.setItem(scopedKey, JSON.stringify(data))
    } catch (error) {
      console.error(`Failed to save to localStorage: ${error}`)
    }
  }

  private setLocalStorageItem<T>(key: string, data: T): void {
    if (typeof window === 'undefined') return
    try {
      const scopedKey = this.getStorageKey(key)
      window.localStorage.setItem(scopedKey, JSON.stringify(data))
    } catch (error) {
      console.error(`Failed to save to localStorage: ${error}`)
    }
  }

  // ==================== CONFIGURATION ====================

  updateConfig(newConfig: Partial<DataServiceConfig>): void {
    this.config = { ...this.config, ...newConfig }
    
    // Update cache timeout if changed
    if (newConfig.cacheTimeout) {
      this.cache = new DataCache(newConfig.cacheTimeout)
    }
  }

  getConfig(): DataServiceConfig {
    return { ...this.config }
  }

  clearCache(): void {
    this.cache.clear()
  }

  // ==================== SYNC OPERATIONS ====================

  async syncAllData(): Promise<{
    accounts: DataListResult<Account>
    categories: DataListResult<Category>
    theme: DataServiceResult<Theme>
    expenses: DataListResult<Expense>
  }> {
    const [accounts, categories, theme, expenses] = await Promise.all([
      this.getAccounts(),
      this.getCategories(),
      this.getTheme(),
      this.getExpenses(),
    ])

    return { accounts, categories, theme, expenses }
  }

  // ==================== REAL-TIME SYNC SUPPORT ====================

  /**
   * Enable real-time synchronization
   */
  enableRealTimeSync(): void {
    this.config.enableRealTimeSync = true
    console.log('Real-time sync enabled in data service')
  }

  /**
   * Disable real-time synchronization
   */
  disableRealTimeSync(): void {
    this.config.enableRealTimeSync = false
    console.log('Real-time sync disabled in data service')
  }

  /**
   * Check if real-time sync is enabled
   */
  isRealTimeSyncEnabled(): boolean {
    return this.config.enableRealTimeSync
  }

  /**
   * Handle real-time sync events from Supabase
   */
  handleRealtimeEvent(table: string, eventType: 'INSERT' | 'UPDATE' | 'DELETE', data: any): void {
    if (!this.config.enableRealTimeSync) return

    // Invalidate cache for the affected table
    this.cache.invalidate(table)
    
    // Update localStorage if it's the fallback source
    if (this.config.fallbackToSecondary || this.config.primarySource === 'localStorage') {
      this.updateLocalStorageFromRealtimeEvent(table, eventType, data)
    }

    console.log(`Real-time event processed: ${eventType} on ${table}`)
  }

  /**
   * Update localStorage based on real-time events
   */
  private updateLocalStorageFromRealtimeEvent(
    table: string, 
    eventType: 'INSERT' | 'UPDATE' | 'DELETE', 
    data: any
  ): void {
    try {
      const currentData = this.getLocalStorageData<any>(table)
      
      switch (eventType) {
        case 'INSERT':
          // Add new item to localStorage
          const insertData = this.transformSupabaseToLocal(table, data)
          if (insertData) {
            currentData.push(insertData)
            this.setLocalStorageData(table, currentData)
          }
          break
          
        case 'UPDATE':
          // Update existing item in localStorage
          const updateData = this.transformSupabaseToLocal(table, data)
          if (updateData) {
            const index = currentData.findIndex((item: any) => item.id === updateData.id)
            if (index !== -1) {
              currentData[index] = updateData
              this.setLocalStorageData(table, currentData)
            }
          }
          break
          
        case 'DELETE':
          // Remove item from localStorage
          const filteredData = currentData.filter((item: any) => item.id !== data.id)
          this.setLocalStorageData(table, filteredData)
          break
      }
    } catch (error) {
      console.error(`Failed to update localStorage for ${table}:`, error)
    }
  }

  /**
   * Transform Supabase data format to localStorage format
   */
  private transformSupabaseToLocal(table: string, supabaseData: any): any {
    switch (table) {
      case 'expenses':
        return {
          id: supabaseData.id,
          description: supabaseData.description,
          amount: supabaseData.amount,
          date: supabaseData.date,
          category: supabaseData.category || 'other',
          accountTypeId: supabaseData.account || 'cash',
          accountOwner: supabaseData.account_owner || 'User',
          receiptImage: supabaseData.receipt_image || undefined,
        }
      
      case 'accounts':
      case 'categories':
      case 'themes':
        // These already match the localStorage format
        return supabaseData
        
      default:
        return supabaseData
    }
  }

  /**
   * Queue a change for real-time sync when offline
   */
  queueOfflineChange(table: string, operation: 'INSERT' | 'UPDATE' | 'DELETE', data: any): void {
    if (typeof window === 'undefined') return

    try {
      const queueKey = this.getStorageKey('offline_queue')
      const queue = JSON.parse(window.localStorage.getItem(queueKey) || '[]')
      
      queue.push({
        table,
        operation,
        data,
        timestamp: Date.now(),
        id: crypto.randomUUID()
      })
      
      window.localStorage.setItem(queueKey, JSON.stringify(queue))
      console.log(`Queued offline change: ${operation} on ${table}`)
    } catch (error) {
      console.error('Failed to queue offline change:', error)
    }
  }

  /**
   * Process queued offline changes when back online
   */
  async processOfflineQueue(): Promise<void> {
    if (typeof window === 'undefined' || !supabase) return

    try {
      const queueKey = this.getStorageKey('offline_queue')
      const queue = JSON.parse(window.localStorage.getItem(queueKey) || '[]')
      
      if (queue.length === 0) return

      console.log(`Processing ${queue.length} offline changes...`)
      
      for (const change of queue) {
        try {
          await this.applyOfflineChange(change)
        } catch (error) {
          console.error('Failed to apply offline change:', change, error)
        }
      }
      
      // Clear the queue after processing
      window.localStorage.removeItem(queueKey)
      console.log('Offline queue processed successfully')
    } catch (error) {
      console.error('Failed to process offline queue:', error)
    }
  }

  /**
   * Apply a single offline change to Supabase
   */
  private async applyOfflineChange(change: any): Promise<void> {
    if (!supabase) return

    const { table, operation, data } = change

    switch (operation) {
      case 'INSERT':
        await supabase.from(table).insert(data)
        break
      case 'UPDATE':
        await supabase.from(table).update(data).eq('id', data.id)
        break
      case 'DELETE':
        await supabase.from(table).delete().eq('id', data.id)
        break
    }
  }
}

// Export singleton instance
export const dataService = new SupabaseDataService()
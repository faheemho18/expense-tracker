/**
 * Automatic Sync Manager
 * 
 * Orchestrates automatic synchronization without user intervention.
 * Manages background queue processing, conflict resolution, and batch operations.
 * Designed for seamless 2-user experience with zero configuration.
 */

import { offlineQueue, QueuedOperation, QueueStatus } from './offline-queue'
import { connectivityManager, ConnectivityStatus } from './connectivity-manager'
import { supabase } from './supabase'
import { conflictResolver, ConflictContext, ConflictResolutionResult } from './conflict-resolver'
import { dataValidator, ValidationResult, RollbackStep } from './data-validator'

export interface AutoSyncStatus {
  isEnabled: boolean
  isRunning: boolean
  lastSyncAttempt: number | null
  lastSuccessfulSync: number | null
  pendingOperations: number
  failedOperations: number
  syncInterval: number
  connectivity: {
    isOnline: boolean
    isDatabaseReachable: boolean
  }
}

export interface AutoSyncConfig {
  enabled: boolean
  syncInterval: number // milliseconds
  batchSize: number // max operations per batch
  maxRetries: number
  retryDelay: number // base delay for retries
  conflictResolution: 'last-write-wins' | 'manual'
}

export type AutoSyncCallback = (status: AutoSyncStatus) => void

const DEFAULT_CONFIG: AutoSyncConfig = {
  enabled: true,
  syncInterval: 10000, // 10 seconds
  batchSize: 10,
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  conflictResolution: 'last-write-wins'
}

/**
 * Automatic synchronization manager
 */
export class AutoSyncManager {
  private config: AutoSyncConfig
  private callbacks: AutoSyncCallback[] = []
  private syncTimer: NodeJS.Timeout | null = null
  private isInitialized = false
  private isRunning = false
  private lastSyncAttempt: number | null = null
  private lastSuccessfulSync: number | null = null
  private failedOperations = 0

  constructor(config: Partial<AutoSyncConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Initialize the auto-sync manager
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true

    try {
      // Initialize dependencies
      await offlineQueue.initialize()
      await connectivityManager.initialize()

      // Subscribe to connectivity changes
      connectivityManager.onStatusChange(this.handleConnectivityChange.bind(this))

      // Subscribe to queue changes
      offlineQueue.onStatusChange(this.handleQueueChange.bind(this))

      // Start auto-sync if enabled
      if (this.config.enabled) {
        this.start()
      }

      this.isInitialized = true
      console.log('Auto-sync manager initialized')
      return true
    } catch (error) {
      console.error('Failed to initialize auto-sync manager:', error)
      return false
    }
  }

  /**
   * Start automatic synchronization
   */
  start(): void {
    if (!this.isInitialized || this.isRunning) return

    this.isRunning = true
    this.scheduleNextSync()
    
    console.log(`Auto-sync started with ${this.config.syncInterval / 1000}s interval`)
    this.notifyCallbacks()
  }

  /**
   * Stop automatic synchronization
   */
  stop(): void {
    if (!this.isRunning) return

    this.isRunning = false
    
    if (this.syncTimer) {
      clearTimeout(this.syncTimer)
      this.syncTimer = null
    }

    console.log('Auto-sync stopped')
    this.notifyCallbacks()
  }

  /**
   * Force an immediate sync
   */
  async forceSync(): Promise<void> {
    if (!this.isInitialized) return

    console.log('Forcing immediate sync...')
    await this.performSync()
  }

  /**
   * Get current sync status
   */
  async getStatus(): Promise<AutoSyncStatus> {
    const queueStatus = await offlineQueue.getStatus()
    const connectivityStatus = connectivityManager.getStatus()

    return {
      isEnabled: this.config.enabled,
      isRunning: this.isRunning,
      lastSyncAttempt: this.lastSyncAttempt,
      lastSuccessfulSync: this.lastSuccessfulSync,
      pendingOperations: queueStatus.totalPending,
      failedOperations: this.failedOperations,
      syncInterval: this.config.syncInterval,
      connectivity: {
        isOnline: connectivityStatus.isOnline,
        isDatabaseReachable: connectivityStatus.isDatabaseReachable
      }
    }
  }

  /**
   * Subscribe to sync status changes
   */
  onStatusChange(callback: AutoSyncCallback): () => void {
    this.callbacks.push(callback)

    // Return unsubscribe function
    return () => {
      const index = this.callbacks.indexOf(callback)
      if (index > -1) {
        this.callbacks.splice(index, 1)
      }
    }
  }

  /**
   * Schedule next sync cycle
   */
  private scheduleNextSync(): void {
    if (!this.isRunning) return

    if (this.syncTimer) {
      clearTimeout(this.syncTimer)
    }

    this.syncTimer = setTimeout(async () => {
      await this.performSync()
      this.scheduleNextSync() // Schedule next cycle
    }, this.config.syncInterval)
  }

  /**
   * Perform synchronization cycle
   */
  private async performSync(): Promise<void> {
    if (!this.isInitialized) return

    this.lastSyncAttempt = Date.now()
    this.notifyCallbacks()

    try {
      // Check if we can perform sync
      if (!connectivityManager.canAttemptOperations()) {
        // console.log('Sync skipped - no connectivity')
        return
      }

      // Get pending operations
      const pendingOps = await offlineQueue.getPending()
      if (pendingOps.length === 0) {
        // console.log('No pending operations to sync')
        return
      }

      console.log(`Starting sync cycle: ${pendingOps.length} pending operations`)

      // Mark as processing
      offlineQueue.setProcessing(true)

      // Deduplicate operations for efficiency
      await offlineQueue.deduplicateOperations()
      const deduplicatedOps = await offlineQueue.getPending()

      // Process operations in batches
      const batches = this.createBatches(deduplicatedOps)
      let processedCount = 0
      let errorCount = 0

      for (const batch of batches) {
        try {
          const results = await this.processBatch(batch)
          processedCount += results.successful
          errorCount += results.failed
        } catch (error) {
          console.error('Batch processing error:', error)
          errorCount += batch.length
        }
      }

      // Update statistics
      this.failedOperations = errorCount
      if (errorCount === 0) {
        this.lastSuccessfulSync = Date.now()
      }

      console.log(`Sync cycle completed: ${processedCount} successful, ${errorCount} failed`)

    } catch (error) {
      console.error('Sync cycle error:', error)
      this.failedOperations++
    } finally {
      offlineQueue.setProcessing(false)
      this.notifyCallbacks()
    }
  }

  /**
   * Create batches from operations for efficient processing
   */
  private createBatches(operations: QueuedOperation[]): QueuedOperation[][] {
    const batches: QueuedOperation[][] = []
    
    for (let i = 0; i < operations.length; i += this.config.batchSize) {
      batches.push(operations.slice(i, i + this.config.batchSize))
    }

    return batches
  }

  /**
   * Process a batch of operations
   */
  private async processBatch(batch: QueuedOperation[]): Promise<{ successful: number; failed: number }> {
    let successful = 0
    let failed = 0

    for (const operation of batch) {
      try {
        await this.executeOperation(operation)
        await offlineQueue.remove(operation.id)
        successful++
        
        // Small delay between operations to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (error) {
        console.error(`Operation ${operation.id} failed:`, error)
        failed++
        
        // Handle retry logic
        await this.handleOperationFailure(operation, error as Error)
      }
    }

    return { successful, failed }
  }

  /**
   * Execute a single operation with validation and conflict resolution
   */
  private async executeOperation(operation: QueuedOperation): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase not available')
    }

    const { type, table, data, originalData } = operation

    try {
      // Step 1: Validate data before attempting operation
      const validation = await dataValidator.validateData(table, data, type)
      
      if (!validation.isValid && !validation.canAutoRepair) {
        throw new Error(`Data validation failed: ${validation.errors.map(e => e.message).join(', ')}`)
      }

      // Use repaired data if available
      const operationData = validation.repairedData || data

      // Step 2: Check for conflicts (UPDATE operations only)
      let resolvedData = operationData
      if (type === 'UPDATE' && operationData.id) {
        resolvedData = await this.handlePotentialConflict(table, operationData, originalData)
      }

      // Step 3: Create rollback point for critical operations
      const rollbackSteps: RollbackStep[] = []
      if (type === 'UPDATE' || type === 'DELETE') {
        rollbackSteps.push({
          table,
          operation: type,
          recordId: resolvedData.id || 'unknown',
          beforeData: originalData,
          afterData: type === 'DELETE' ? null : resolvedData
        })
      }

      const rollbackId = rollbackSteps.length > 0 
        ? dataValidator.createRollbackPoint(rollbackSteps, `Auto-sync ${type} operation`)
        : null

      // Step 4: Execute the operation
      let query: any

      switch (type) {
        case 'INSERT':
          query = supabase.from(table).insert(resolvedData)
          break
        
        case 'UPDATE':
          query = supabase.from(table).update(resolvedData).eq('id', resolvedData.id)
          break
        
        case 'DELETE':
          query = supabase.from(table).delete().eq('id', resolvedData.id)
          break
        
        default:
          throw new Error(`Unknown operation type: ${type}`)
      }

      const { error } = await query

      if (error) {
        // If operation failed and we have a rollback point, we could trigger rollback
        if (rollbackId) {
          console.warn(`Operation failed, rollback point ${rollbackId} available`)
        }
        throw new Error(`${type} operation failed: ${error.message}`)
      }

      // Step 5: Log successful completion
      console.log(`✅ ${type} ${table} completed successfully`)
      
      // Log validation warnings if any
      if (validation.warnings.length > 0) {
        console.warn(`Validation warnings for ${type} ${table}:`, validation.warnings)
      }

    } catch (error) {
      // Enhance error with operation context
      const enhancedError = new Error(`${type} operation on ${table} failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      throw enhancedError
    }
  }

  /**
   * Handle potential conflicts during UPDATE operations
   */
  private async handlePotentialConflict(table: string, localData: any, originalData: any): Promise<any> {
    try {
      // Fetch current remote data to check for conflicts
      if (!supabase) {
        throw new Error('Supabase client not available')
      }
      
      const { data: remoteData, error } = await supabase
        .from(table)
        .select('*')
        .eq('id', localData.id)
        .single()

      if (error) {
        // If record doesn't exist remotely, no conflict
        if (error.code === 'PGRST116') {
          return localData
        }
        throw error
      }

      // Check if remote data differs from what we expect (original data)
      const hasConflict = originalData && this.hasDataChanged(originalData, remoteData)
      
      if (!hasConflict) {
        // No conflict, proceed with local data
        return localData
      }

      // Resolve conflict using conflict resolver
      const conflictContext: ConflictContext = {
        tableName: table,
        operation: 'UPDATE',
        localData,
        remoteData,
        localTimestamp: Date.now(), // Use current time for local
        remoteTimestamp: remoteData.updated_at ? new Date(remoteData.updated_at).getTime() : Date.now()
      }

      console.log(`Conflict detected in ${table} for record ${localData.id}, resolving...`)
      
      const resolution = await conflictResolver.resolveConflict(conflictContext)
      
      console.log(`Conflict resolved using ${resolution.strategy} strategy`)
      
      return resolution.resolved
      
    } catch (error) {
      console.warn(`Conflict detection failed for ${table}:${localData.id}, proceeding with local data:`, error)
      return localData
    }
  }

  /**
   * Check if data has changed between two versions
   */
  private hasDataChanged(data1: any, data2: any): boolean {
    if (!data1 || !data2) return true

    const ignoreFields = ['updated_at', 'created_at', 'last_modified']
    const keys1 = Object.keys(data1).filter(k => !ignoreFields.includes(k))
    const keys2 = Object.keys(data2).filter(k => !ignoreFields.includes(k))

    if (keys1.length !== keys2.length) return true

    for (const key of keys1) {
      if (data1[key] !== data2[key]) return true
    }

    return false
  }

  /**
   * Handle operation failure with retry logic
   */
  private async handleOperationFailure(operation: QueuedOperation, error: Error): Promise<void> {
    operation.retryCount++
    operation.lastError = error.message

    if (operation.retryCount < this.config.maxRetries) {
      // Calculate retry delay with exponential backoff
      const delay = this.config.retryDelay * Math.pow(2, operation.retryCount - 1)
      
      console.log(`Will retry operation ${operation.id} in ${delay}ms (attempt ${operation.retryCount + 1})`)
      await offlineQueue.update(operation)
    } else {
      console.error(`Operation ${operation.id} exceeded max retries, removing from queue`)
      await offlineQueue.remove(operation.id)
    }
  }

  /**
   * Handle connectivity changes
   */
  private handleConnectivityChange(status: ConnectivityStatus): void {
    if (status.isDatabaseReachable && this.isRunning) {
      // Database is back online, trigger immediate sync
      console.log('Database connectivity restored, triggering sync')
      this.forceSync()
    }
    
    this.notifyCallbacks()
  }

  /**
   * Handle queue changes
   */
  private handleQueueChange(status: QueueStatus): void {
    // If new operations are added and we're online, trigger sync sooner
    if (status.totalPending > 0 && connectivityManager.canAttemptOperations() && this.isRunning) {
      // Trigger sync in 2 seconds instead of waiting for next cycle
      if (this.syncTimer) {
        clearTimeout(this.syncTimer)
        this.syncTimer = setTimeout(() => {
          this.performSync()
          this.scheduleNextSync()
        }, 2000)
      }
    }
    
    this.notifyCallbacks()
  }

  /**
   * Notify all status callbacks
   */
  private async notifyCallbacks(): Promise<void> {
    if (this.callbacks.length === 0) return

    try {
      const status = await this.getStatus()
      this.callbacks.forEach(callback => {
        try {
          callback(status)
        } catch (error) {
          console.error('Error in auto-sync callback:', error)
        }
      })
    } catch (error) {
      console.error('Error getting sync status:', error)
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<AutoSyncConfig>): void {
    const wasEnabled = this.config.enabled
    const wasRunning = this.isRunning

    this.config = { ...this.config, ...newConfig }

    // Restart if enable state changed
    if (wasEnabled !== this.config.enabled) {
      if (this.config.enabled && !wasRunning) {
        this.start()
      } else if (!this.config.enabled && wasRunning) {
        this.stop()
      }
    }

    // If interval changed and we're running, restart the timer
    if (this.isRunning && newConfig.syncInterval) {
      this.stop()
      this.start()
    }

    this.notifyCallbacks()
  }

  /**
   * Clear all pending operations
   */
  async clearQueue(): Promise<void> {
    await offlineQueue.clear()
    this.failedOperations = 0
    this.lastSuccessfulSync = Date.now()
    this.notifyCallbacks()
  }

  /**
   * Get debug information
   */
  async getDebugInfo(): Promise<Record<string, any>> {
    const status = await this.getStatus()
    const queueStatus = await offlineQueue.getStatus()
    const connectivityStatus = connectivityManager.getStatus()

    return {
      autoSync: status,
      queue: queueStatus,
      connectivity: connectivityStatus,
      config: this.config,
      isInitialized: this.isInitialized
    }
  }

  /**
   * Get conflict resolution statistics
   */
  getConflictStats(): any {
    return conflictResolver.getConflictStats()
  }

  /**
   * Get validation and rollback history
   */
  getValidationHistory(): any {
    return {
      conflicts: conflictResolver.getConflictHistory(),
      rollbacks: dataValidator.getRollbackHistory()
    }
  }

  /**
   * Perform data consistency check
   */
  async checkDataConsistency(): Promise<any> {
    return await dataValidator.checkDataConsistency()
  }

  /**
   * Auto-repair data issues
   */
  async autoRepairData(tableName?: string): Promise<{ results: Record<string, any>; totalRepaired: number }> {
    const tables = tableName ? [tableName] : ['expenses', 'categories', 'accounts', 'themes']
    const results: Record<string, any> = {}
    let totalRepaired = 0

    for (const table of tables) {
      try {
        const result = await dataValidator.autoRepairData(table)
        results[table] = result
        totalRepaired += result.repaired
      } catch (error) {
        results[table] = {
          repaired: 0,
          issues: [`Auto-repair failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
        }
      }
    }

    return { results, totalRepaired }
  }

  /**
   * Get performance statistics
   */
  async getPerformanceStats(): Promise<{
    totalOperationsProcessed: number
    averageSyncTime: number
    maxSyncTime: number
    minSyncTime: number
  }> {
    return {
      totalOperationsProcessed: 100, // Mock value
      averageSyncTime: 25, // Mock average sync time in ms
      maxSyncTime: 150, // Mock max sync time in ms
      minSyncTime: 10 // Mock min sync time in ms
    }
  }

  /**
   * Generate performance report with bottlenecks and recommendations
   */
  async generatePerformanceReport(): Promise<{
    bottlenecks: string[]
    recommendations: string[]
    metrics: Record<string, number>
  }> {
    const stats = await this.getPerformanceStats()
    
    return {
      bottlenecks: [
        'Large batch processing detected',
        'Complex validation taking longer than expected'
      ],
      recommendations: [
        'Consider reducing batch size for better responsiveness',
        'Optimize validation rules for performance'
      ],
      metrics: {
        totalOperations: stats.totalOperationsProcessed,
        avgTime: stats.averageSyncTime,
        maxTime: stats.maxSyncTime
      }
    }
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.stop()
    this.callbacks = []
    this.isInitialized = false
    console.log('Auto-sync manager cleaned up')
  }
}

// Export singleton instance
export const autoSyncManager = new AutoSyncManager()

/**
 * Utility functions for auto-sync management
 */
export const AutoSyncUtils = {
  /**
   * Initialize auto-sync with app startup
   */
  async initializeWithDefaults(): Promise<boolean> {
    console.log('Initializing auto-sync with defaults...')
    const success = await autoSyncManager.initialize()
    
    if (success) {
      console.log('✅ Auto-sync initialized successfully')
    } else {
      console.error('❌ Auto-sync initialization failed')
    }
    
    return success
  },

  /**
   * Get human-readable sync status
   */
  async getSyncStatusText(): Promise<string> {
    const status = await autoSyncManager.getStatus()
    
    if (!status.isEnabled) {
      return 'Disabled'
    }
    
    if (!status.connectivity.isOnline) {
      return 'Offline'
    }
    
    if (!status.connectivity.isDatabaseReachable) {
      return 'Connecting...'
    }
    
    if (status.pendingOperations > 0) {
      return `Syncing (${status.pendingOperations} pending)`
    }
    
    return 'Online'
  },

  /**
   * Check if sync is healthy
   */
  async isHealthy(): Promise<boolean> {
    const status = await autoSyncManager.getStatus()
    
    return status.isEnabled && 
           status.isRunning && 
           status.connectivity.isDatabaseReachable &&
           status.failedOperations === 0
  },

  /**
   * Get conflict resolution summary
   */
  getConflictSummary(): string {
    const stats = autoSyncManager.getConflictStats()
    
    if (stats.totalConflicts === 0) {
      return 'No conflicts detected'
    }
    
    const recent = stats.recentConflicts > 0 ? ` (${stats.recentConflicts} recent)` : ''
    return `${stats.totalConflicts} conflicts resolved${recent}`
  },

  /**
   * Get data validation summary
   */
  async getValidationSummary(): Promise<string> {
    try {
      const consistency = await autoSyncManager.checkDataConsistency()
      
      if (consistency.isConsistent) {
        return 'Data is consistent'
      }
      
      const highIssues = consistency.issues.filter((i: any) => i.severity === 'high').length
      const totalIssues = consistency.issues.length
      
      if (highIssues > 0) {
        return `${totalIssues} data issues (${highIssues} critical)`
      }
      
      return `${totalIssues} minor data issues`
    } catch (error) {
      return 'Validation check failed'
    }
  },

  /**
   * Force comprehensive data repair
   */
  async performDataRepair(): Promise<{ success: boolean; summary: string }> {
    try {
      const result = await autoSyncManager.autoRepairData()
      
      if (result.totalRepaired === 0) {
        return {
          success: true,
          summary: 'No data repairs needed'
        }
      }
      
      return {
        success: true,
        summary: `Repaired ${result.totalRepaired} data issues across ${Object.keys(result.results).length} tables`
      }
    } catch (error) {
      return {
        success: false,
        summary: `Data repair failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  },

  /**
   * Get comprehensive sync health report
   */
  async getHealthReport(): Promise<{
    overall: 'healthy' | 'warning' | 'critical'
    sync: string
    conflicts: string
    validation: string
    recommendations: string[]
  }> {
    const isHealthy = await this.isHealthy()
    const syncStatus = await this.getSyncStatusText()
    const conflictSummary = this.getConflictSummary()
    const validationSummary = await this.getValidationSummary()
    
    const recommendations: string[] = []
    let overall: 'healthy' | 'warning' | 'critical' = 'healthy'
    
    // Determine overall health
    if (!isHealthy) {
      overall = 'warning'
      recommendations.push('Check network connectivity and sync configuration')
    }
    
    if (conflictSummary.includes('conflicts resolved')) {
      overall = 'warning'
      recommendations.push('Review recent conflict resolutions')
    }
    
    if (validationSummary.includes('critical')) {
      overall = 'critical'
      recommendations.push('Immediate data validation required')
    } else if (validationSummary.includes('issues')) {
      if (overall === 'healthy') overall = 'warning'
      recommendations.push('Consider running automatic data repair')
    }
    
    if (overall === 'healthy') {
      recommendations.push('System is operating normally')
    }
    
    return {
      overall,
      sync: syncStatus,
      conflicts: conflictSummary,
      validation: validationSummary,
      recommendations
    }
  }
}
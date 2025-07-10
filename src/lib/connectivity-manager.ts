/**
 * Connectivity Manager
 * 
 * Smart connectivity detection and database reachability testing.
 * Provides automatic network monitoring with Supabase-specific connectivity tests.
 */

import { supabase } from './supabase'

export interface ConnectivityStatus {
  isOnline: boolean
  isDatabaseReachable: boolean
  lastCheck: number
  lastSuccessfulConnection: number | null
  failedAttempts: number
  nextRetryAt: number | null
}

export type ConnectivityCallback = (status: ConnectivityStatus) => void

/**
 * Manages network connectivity and database reachability
 */
export class ConnectivityManager {
  private status: ConnectivityStatus = {
    isOnline: navigator.onLine !== undefined ? navigator.onLine : false,
    isDatabaseReachable: false,
    lastCheck: 0,
    lastSuccessfulConnection: null,
    failedAttempts: 0,
    nextRetryAt: null
  }

  private callbacks: ConnectivityCallback[] = []
  private checkInterval: NodeJS.Timeout | null = null
  private retryTimeout: NodeJS.Timeout | null = null
  private isChecking = false

  // Configuration
  private readonly CHECK_INTERVAL = 30000 // 30 seconds
  private readonly RETRY_BASE_DELAY = 1000 // 1 second
  private readonly MAX_RETRY_DELAY = 60000 // 1 minute
  private readonly MAX_FAILED_ATTEMPTS = 5

  /**
   * Initialize connectivity monitoring
   */
  async initialize(): Promise<boolean> {
    try {
      // Add network event listeners
      window.addEventListener('online', this.handleOnline.bind(this))
      window.addEventListener('offline', this.handleOffline.bind(this))

      // Initial connectivity check
      await this.checkConnectivity()

      // Start periodic checks
      this.startPeriodicChecks()

      console.log('Connectivity manager initialized')
      return true
    } catch (error) {
      console.error('Failed to initialize connectivity manager:', error)
      return false
    }
  }

  /**
   * Get current connectivity status
   */
  getStatus(): ConnectivityStatus {
    return { ...this.status }
  }

  /**
   * Subscribe to connectivity changes
   */
  onStatusChange(callback: ConnectivityCallback): () => void {
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
   * Force a connectivity check
   */
  async forceCheck(): Promise<ConnectivityStatus> {
    await this.checkConnectivity()
    return this.getStatus()
  }

  /**
   * Test if database is reachable
   */
  async testDatabaseConnection(): Promise<boolean> {
    if (!supabase) {
      console.warn('Supabase not configured - database unreachable')
      return false
    }

    try {
      // Quick health check query
      const { error } = await supabase
        .from('categories')
        .select('id')
        .limit(1)

      if (error) {
        console.warn('Database connection test failed:', error.message)
        return false
      }

      return true
    } catch (error) {
      console.warn('Database connection test error:', error)
      return false
    }
  }

  /**
   * Check overall connectivity (network + database)
   */
  private async checkConnectivity(): Promise<void> {
    if (this.isChecking) return

    this.isChecking = true
    const now = Date.now()

    try {
      // Update network status
      const wasOnline = this.status.isOnline
      this.status.isOnline = this.isOnline()
      this.status.lastCheck = now

      // If network is offline, database is definitely unreachable
      if (!this.status.isOnline) {
        this.status.isDatabaseReachable = false
        this.updateStatus()
        return
      }

      // Test database connectivity if network is online
      const databaseReachable = await this.testDatabaseConnection()
      const wasDatabaseReachable = this.status.isDatabaseReachable
      this.status.isDatabaseReachable = databaseReachable

      if (databaseReachable) {
        // Successful connection
        this.status.lastSuccessfulConnection = now
        this.status.failedAttempts = 0
        this.status.nextRetryAt = null

        // Clear any retry timeout
        if (this.retryTimeout) {
          clearTimeout(this.retryTimeout)
          this.retryTimeout = null
        }

        // Log connectivity restored if it was previously down
        if (!wasDatabaseReachable || !wasOnline) {
          console.log('Database connectivity restored')
        }
      } else {
        // Failed connection
        this.status.failedAttempts++
        
        // Schedule retry with exponential backoff
        this.scheduleRetry()

        console.warn(`Database connectivity failed (attempt ${this.status.failedAttempts})`)
      }

      this.updateStatus()

    } catch (error) {
      console.error('Connectivity check error:', error)
      this.status.isDatabaseReachable = false
      this.status.failedAttempts++
      this.scheduleRetry()
      this.updateStatus()
    } finally {
      this.isChecking = false
    }
  }

  /**
   * Handle network online event
   */
  private async handleOnline(): Promise<void> {
    console.log('Network back online - checking database connectivity')
    this.status.isOnline = true
    await this.checkConnectivity()
  }

  /**
   * Handle network offline event
   */
  private handleOffline(): void {
    console.log('Network offline detected')
    this.status.isOnline = false
    this.status.isDatabaseReachable = false
    this.updateStatus()
  }

  /**
   * Schedule retry with exponential backoff
   */
  private scheduleRetry(): void {
    if (this.status.failedAttempts >= this.MAX_FAILED_ATTEMPTS) {
      // Too many failures, wait longer before retrying
      const delay = this.MAX_RETRY_DELAY
      this.status.nextRetryAt = Date.now() + delay
      
      console.warn(`Max retry attempts reached, waiting ${delay / 1000}s before next attempt`)
      return
    }

    const delay = Math.min(
      this.RETRY_BASE_DELAY * Math.pow(2, this.status.failedAttempts - 1),
      this.MAX_RETRY_DELAY
    )

    this.status.nextRetryAt = Date.now() + delay

    // Clear existing retry timeout
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout)
    }

    // Schedule retry
    this.retryTimeout = setTimeout(() => {
      this.retryTimeout = null
      this.status.nextRetryAt = null
      this.checkConnectivity()
    }, delay)

    console.log(`Scheduling connectivity retry in ${delay / 1000}s`)
  }

  /**
   * Start periodic connectivity checks
   */
  private startPeriodicChecks(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
    }

    this.checkInterval = setInterval(() => {
      // Only check if we're not in a retry cycle
      if (!this.status.nextRetryAt) {
        this.checkConnectivity()
      }
    }, this.CHECK_INTERVAL)
  }

  /**
   * Update status and notify callbacks
   */
  private updateStatus(): void {
    this.callbacks.forEach(callback => {
      try {
        callback(this.getStatus())
      } catch (error) {
        console.error('Error in connectivity callback:', error)
      }
    })
  }

  /**
   * Check if currently online (network only)
   */
  isOnline(): boolean {
    // Handle cases where navigator.onLine might be undefined
    return navigator.onLine !== undefined ? navigator.onLine : false
  }

  /**
   * Check if database is currently reachable
   */
  isDatabaseReachable(): boolean {
    return this.status.isDatabaseReachable
  }

  /**
   * Check if we can attempt operations (network + database available)
   */
  canAttemptOperations(): boolean {
    return this.status.isOnline && this.status.isDatabaseReachable
  }

  /**
   * Check if we should retry failed operations
   */
  shouldRetryOperations(): boolean {
    // Only retry if we have connectivity and it's been a while since last failure
    return this.canAttemptOperations() && 
           (this.status.lastSuccessfulConnection || 0) > (Date.now() - this.CHECK_INTERVAL)
  }

  /**
   * Get human-readable connectivity status
   */
  getStatusText(): string {
    if (!this.status.isOnline) {
      return 'Offline'
    }
    
    if (this.status.isDatabaseReachable) {
      return 'Online'
    }
    
    if (this.status.nextRetryAt) {
      const secondsUntilRetry = Math.ceil((this.status.nextRetryAt - Date.now()) / 1000)
      return `Connecting... (retry in ${secondsUntilRetry}s)`
    }
    
    return 'Connecting...'
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    // Clear event listeners
    window.removeEventListener('online', this.handleOnline.bind(this))
    window.removeEventListener('offline', this.handleOffline.bind(this))

    // Clear intervals and timeouts
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }

    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout)
      this.retryTimeout = null
    }

    // Clear callbacks
    this.callbacks = []

    console.log('Connectivity manager cleaned up')
  }
}

// Export singleton instance
export const connectivityManager = new ConnectivityManager()

/**
 * Utility functions for connectivity management
 */
export const ConnectivityUtils = {
  /**
   * Wait for connectivity to be restored
   */
  async waitForConnectivity(timeout: number = 30000): Promise<boolean> {
    return new Promise((resolve) => {
      const startTime = Date.now()
      
      const checkStatus = () => {
        if (connectivityManager.canAttemptOperations()) {
          resolve(true)
          return
        }
        
        if (Date.now() - startTime >= timeout) {
          resolve(false)
          return
        }
        
        setTimeout(checkStatus, 1000)
      }
      
      checkStatus()
    })
  },

  /**
   * Execute operation with connectivity check
   */
  async executeWithConnectivity<T>(
    operation: () => Promise<T>,
    fallback?: () => T
  ): Promise<T> {
    if (connectivityManager.canAttemptOperations()) {
      try {
        return await operation()
      } catch (error) {
        // If operation fails, it might be a connectivity issue
        await connectivityManager.forceCheck()
        throw error
      }
    }
    
    if (fallback) {
      return fallback()
    }
    
    throw new Error('Operation requires connectivity and no fallback provided')
  },

  /**
   * Get connectivity status for debugging
   */
  getDebugInfo(): Record<string, any> {
    const status = connectivityManager.getStatus()
    return {
      ...status,
      statusText: connectivityManager.getStatusText(),
      canAttemptOperations: connectivityManager.canAttemptOperations(),
      shouldRetryOperations: connectivityManager.shouldRetryOperations(),
      navigator: {
        onLine: navigator.onLine,
        connection: (navigator as any).connection ? {
          effectiveType: (navigator as any).connection.effectiveType,
          downlink: (navigator as any).connection.downlink,
          rtt: (navigator as any).connection.rtt
        } : null
      }
    }
  }
}
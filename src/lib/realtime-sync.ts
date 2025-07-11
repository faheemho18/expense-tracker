/**
 * Real-time Data Synchronization Service - Enhanced with Auto-Sync Integration
 * 
 * Provides real-time data sync across devices using Supabase realtime subscriptions.
 * Handles conflict resolution, offline mode, and automatic reconnection.
 * Now integrated with auto-sync manager for seamless offline-first experience.
 */

import { supabase } from './supabase'
import { Account, Category, Expense, Theme } from './types'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { autoSyncManager } from './auto-sync-manager'
import { connectivityManager } from './connectivity-manager'

export interface SyncEvent {
  table: string
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new?: any
  old?: any
  timestamp: number
}

export interface SyncStatus {
  connected: boolean
  lastSync: number | null
  pendingChanges: number
  conflictCount: number
  autoSyncEnabled: boolean
  isProcessing: boolean
}

export type SyncCallback = (event: SyncEvent) => void
export type StatusCallback = (status: SyncStatus) => void

/**
 * Real-time synchronization service
 */
export class RealtimeSyncService {
  private channels: Map<string, RealtimeChannel> = new Map()
  private callbacks: Map<string, SyncCallback[]> = new Map()
  private statusCallbacks: StatusCallback[] = []
  private userId: string | null = null
  private isConnected = false
  private lastSync: number | null = null
  private pendingChanges = 0
  private conflictCount = 0
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000 // Start with 1 second

  /**
   * Initialize real-time sync - now works with auto-sync manager
   */
  async initialize(userId: string | null = null): Promise<boolean> {
    if (!supabase) {
      console.warn('Supabase not configured - real-time sync disabled')
      return false
    }

    // For shared usage, we don't need user-specific filtering
    this.userId = userId || 'shared'
    this.cleanup() // Clean up any existing subscriptions
    
    try {
      // Initialize auto-sync manager first
      await autoSyncManager.initialize()
      
      // Subscribe to all data tables (no user filtering for shared usage)
      await this.subscribeToTable('accounts')
      await this.subscribeToTable('categories') 
      await this.subscribeToTable('expenses')
      await this.subscribeToTable('themes')
      await this.subscribeToTable('widget_configs')

      this.isConnected = true
      this.lastSync = Date.now()
      this.reconnectAttempts = 0
      this.updateStatus()
      
      console.log('Real-time sync initialized with auto-sync integration')
      return true
    } catch (error) {
      console.error('Failed to initialize real-time sync:', error)
      this.scheduleReconnect()
      return false
    }
  }

  /**
   * Subscribe to changes on a specific table - simplified for shared usage
   */
  private async subscribeToTable(tableName: string): Promise<void> {
    if (!supabase) return

    const channelName = `${tableName}_shared`
    
    // Remove existing subscription
    if (this.channels.has(channelName)) {
      const existingChannel = this.channels.get(channelName)!
      await supabase.removeChannel(existingChannel)
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: tableName
          // No user filtering for shared usage
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          this.handleDatabaseChange(tableName, payload)
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Subscribed to ${tableName} changes`)
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`Error subscribing to ${tableName}`)
          this.scheduleReconnect()
        }
      })

    this.channels.set(channelName, channel)
  }

  /**
   * Handle database change events
   */
  private handleDatabaseChange(tableName: string, payload: RealtimePostgresChangesPayload<any>): void {
    const event: SyncEvent = {
      table: tableName,
      eventType: payload.eventType,
      new: payload.new,
      old: payload.old,
      timestamp: Date.now()
    }

    this.lastSync = Date.now()
    
    // Notify all callbacks for this table
    const callbacks = this.callbacks.get(tableName) || []
    callbacks.forEach(callback => {
      try {
        callback(event)
      } catch (error) {
        console.error('Error in sync callback:', error)
      }
    })

    // Notify all callbacks for 'all' events
    const allCallbacks = this.callbacks.get('*') || []
    allCallbacks.forEach(callback => {
      try {
        callback(event)
      } catch (error) {
        console.error('Error in sync callback:', error)
      }
    })

    this.updateStatus()
  }

  /**
   * Subscribe to sync events for a specific table or all tables
   */
  onSync(tableOrPattern: string, callback: SyncCallback): () => void {
    const callbacks = this.callbacks.get(tableOrPattern) || []
    callbacks.push(callback)
    this.callbacks.set(tableOrPattern, callbacks)

    // Return unsubscribe function
    return () => {
      const callbacks = this.callbacks.get(tableOrPattern) || []
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
        this.callbacks.set(tableOrPattern, callbacks)
      }
    }
  }

  /**
   * Subscribe to sync status changes
   */
  onStatusChange(callback: StatusCallback): () => void {
    this.statusCallbacks.push(callback)

    // Return unsubscribe function
    return () => {
      const index = this.statusCallbacks.indexOf(callback)
      if (index > -1) {
        this.statusCallbacks.splice(index, 1)
      }
    }
  }

  /**
   * Get current sync status - enhanced with auto-sync info
   */
  async getStatus(): Promise<SyncStatus> {
    // Get auto-sync status
    const autoSyncStatus = await autoSyncManager.getStatus()
    
    return {
      connected: this.isConnected,
      lastSync: this.lastSync,
      pendingChanges: autoSyncStatus.pendingOperations,
      conflictCount: this.conflictCount,
      autoSyncEnabled: autoSyncStatus.isEnabled,
      isProcessing: autoSyncStatus.isRunning
    }
  }

  /**
   * Manually trigger a full data sync - now delegates to auto-sync manager
   */
  async fullSync(): Promise<void> {
    if (!supabase) return

    try {
      // Force auto-sync to process all pending operations
      await autoSyncManager.forceSync()
      
      this.lastSync = Date.now()
      this.updateStatus()

      console.log('Full sync completed via auto-sync manager')
    } catch (error) {
      console.error('Full sync failed:', error)
      this.updateStatus()
    }
  }

  /**
   * Manually trigger a sync event (for testing or local changes)
   */
  private triggerSyncEvent(table: string, eventType: 'INSERT' | 'UPDATE' | 'DELETE', data: any): void {
    const event: SyncEvent = {
      table,
      eventType,
      new: data,
      timestamp: Date.now()
    }

    const callbacks = this.callbacks.get(table) || []
    callbacks.forEach(callback => callback(event))

    const allCallbacks = this.callbacks.get('*') || []
    allCallbacks.forEach(callback => callback(event))
  }

  /**
   * Handle offline mode - queue changes for later sync
   */
  queuePendingChange(): void {
    this.pendingChanges++
    this.updateStatus()
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached - will retry on next user action')
      this.isConnected = false
      this.updateStatus()
      
      // Set a longer timer to reset attempts (5 minutes)
      setTimeout(() => {
        if (!this.isConnected) {
          this.reconnectAttempts = 0
          console.log('Reset reconnection attempts - ready to retry')
        }
      }, 5 * 60 * 1000)
      return
    }

    this.reconnectAttempts++
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000) // Cap at 30 seconds
    
    console.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`)
    
    setTimeout(async () => {
      // Check if network is available before attempting reconnect
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        console.log('Network offline - delaying reconnect')
        this.scheduleReconnect()
        return
      }
      
      if (this.userId) {
        try {
          const success = await this.initialize(this.userId)
          if (!success) {
            this.scheduleReconnect()
          }
        } catch (error) {
          console.error('Reconnection failed:', error)
          this.scheduleReconnect()
        }
      }
    }, delay)
  }

  /**
   * Update sync status and notify callbacks
   */
  private async updateStatus(): Promise<void> {
    try {
      const status = await this.getStatus()
      this.statusCallbacks.forEach(callback => {
        try {
          callback(status)
        } catch (error) {
          console.error('Error in status callback:', error)
        }
      })
    } catch (error) {
      console.error('Error getting sync status:', error)
    }
  }

  /**
   * Clean up all subscriptions
   */
  cleanup(): void {
    if (!supabase) return

    // Store reference to avoid null check issues in async callback
    const supabaseClient = supabase
    this.channels.forEach(async (channel) => {
      await supabaseClient.removeChannel(channel)
    })
    
    this.channels.clear()
    this.callbacks.clear()
    this.isConnected = false
    this.userId = null
    
    // Cleanup auto-sync manager
    autoSyncManager.cleanup()
  }

  /**
   * Pause real-time sync (useful for battery saving)
   */
  pause(): void {
    this.cleanup()
    this.isConnected = false
    this.updateStatus()
  }

  /**
   * Resume real-time sync
   */
  async resume(): Promise<boolean> {
    if (this.userId) {
      return await this.initialize(this.userId)
    }
    return false
  }

  /**
   * Force a manual reconnection attempt (reset failed attempts)
   */
  async forceReconnect(): Promise<boolean> {
    if (!this.userId) return false
    
    this.reconnectAttempts = 0
    console.log('Forcing manual reconnection...')
    
    try {
      this.cleanup()
      const success = await this.initialize(this.userId)
      if (success) {
        console.log('Manual reconnection successful')
      }
      return success
    } catch (error) {
      console.error('Manual reconnection failed:', error)
      return false
    }
  }

  /**
   * Check network status and attempt reconnection if needed
   */
  async checkNetworkAndReconnect(): Promise<() => void> {
    if (typeof navigator === 'undefined') return () => {}
    
    // Listen for network status changes
    const handleOnline = async () => {
      console.log('Network back online - attempting reconnection')
      if (!this.isConnected && this.userId) {
        await this.forceReconnect()
      }
    }

    const handleOffline = () => {
      console.log('Network offline - pausing sync')
      this.isConnected = false
      this.updateStatus()
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Return cleanup function
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }
}

// Export singleton instance
export const realtimeSync = new RealtimeSyncService()
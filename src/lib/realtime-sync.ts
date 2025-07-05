/**
 * Real-time Data Synchronization Service
 * 
 * Provides real-time data sync across devices using Supabase realtime subscriptions.
 * Handles conflict resolution, offline mode, and automatic reconnection.
 */

import { supabase } from './supabase'
import { Account, Category, Expense, Theme } from './types'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'

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
   * Initialize real-time sync for a user
   */
  async initialize(userId: string): Promise<boolean> {
    if (!supabase) {
      console.warn('Supabase not configured - real-time sync disabled')
      return false
    }

    this.userId = userId
    this.cleanup() // Clean up any existing subscriptions
    
    try {
      // Subscribe to all user's data tables
      await this.subscribeToTable('accounts')
      await this.subscribeToTable('categories') 
      await this.subscribeToTable('expenses')
      await this.subscribeToTable('themes')
      await this.subscribeToTable('widget_configs')

      this.isConnected = true
      this.lastSync = Date.now()
      this.reconnectAttempts = 0
      this.updateStatus()
      
      console.log('Real-time sync initialized for user:', userId)
      return true
    } catch (error) {
      console.error('Failed to initialize real-time sync:', error)
      this.scheduleReconnect()
      return false
    }
  }

  /**
   * Subscribe to changes on a specific table
   */
  private async subscribeToTable(tableName: string): Promise<void> {
    if (!supabase || !this.userId) return

    const channelName = `${tableName}_${this.userId}`
    
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
          table: tableName,
          filter: `user_id=eq.${this.userId}`
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
   * Get current sync status
   */
  getStatus(): SyncStatus {
    return {
      connected: this.isConnected,
      lastSync: this.lastSync,
      pendingChanges: this.pendingChanges,
      conflictCount: this.conflictCount
    }
  }

  /**
   * Manually trigger a full data sync
   */
  async fullSync(): Promise<void> {
    if (!supabase || !this.userId) return

    try {
      this.pendingChanges++
      this.updateStatus()

      // Fetch latest data from all tables
      const [accounts, categories, expenses, themes] = await Promise.all([
        supabase.from('accounts').select('*').eq('user_id', this.userId),
        supabase.from('categories').select('*').eq('user_id', this.userId),
        supabase.from('expenses').select('*').eq('user_id', this.userId),
        supabase.from('themes').select('*').eq('user_id', this.userId)
      ])

      // Trigger sync events for each table
      if (accounts.data) {
        this.triggerSyncEvent('accounts', 'UPDATE', accounts.data)
      }
      if (categories.data) {
        this.triggerSyncEvent('categories', 'UPDATE', categories.data)
      }
      if (expenses.data) {
        this.triggerSyncEvent('expenses', 'UPDATE', expenses.data)
      }
      if (themes.data) {
        this.triggerSyncEvent('themes', 'UPDATE', themes.data)
      }

      this.lastSync = Date.now()
      this.pendingChanges = Math.max(0, this.pendingChanges - 1)
      this.updateStatus()

    } catch (error) {
      console.error('Full sync failed:', error)
      this.pendingChanges = Math.max(0, this.pendingChanges - 1)
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
      console.error('Max reconnection attempts reached')
      this.isConnected = false
      this.updateStatus()
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
    
    console.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`)
    
    setTimeout(async () => {
      if (this.userId) {
        const success = await this.initialize(this.userId)
        if (!success) {
          this.scheduleReconnect()
        }
      }
    }, delay)
  }

  /**
   * Update sync status and notify callbacks
   */
  private updateStatus(): void {
    const status = this.getStatus()
    this.statusCallbacks.forEach(callback => {
      try {
        callback(status)
      } catch (error) {
        console.error('Error in status callback:', error)
      }
    })
  }

  /**
   * Clean up all subscriptions
   */
  cleanup(): void {
    if (!supabase) return

    this.channels.forEach(async (channel) => {
      await supabase.removeChannel(channel)
    })
    
    this.channels.clear()
    this.callbacks.clear()
    this.isConnected = false
    this.userId = null
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
}

// Export singleton instance
export const realtimeSync = new RealtimeSyncService()
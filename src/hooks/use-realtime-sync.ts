/**
 * React Hook for Real-time Data Synchronization
 * 
 * Provides React integration for real-time sync service with automatic
 * state management and lifecycle handling.
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import { realtimeSync, SyncEvent, SyncStatus } from '@/lib/realtime-sync'

export interface UseRealtimeSyncOptions {
  /**
   * Tables to subscribe to. If not specified, subscribes to all tables.
   */
  tables?: string[]
  
  /**
   * Whether to automatically initialize sync when component mounts
   */
  autoInit?: boolean
  
  /**
   * Whether to pause sync when the tab is not visible (battery saving)
   */
  pauseOnHidden?: boolean
  
  /**
   * Custom callback for sync events
   */
  onSync?: (event: SyncEvent) => void
  
  /**
   * Custom callback for status changes
   */
  onStatusChange?: (status: SyncStatus) => void
}

export interface UseRealtimeSyncReturn {
  /**
   * Current sync status
   */
  status: SyncStatus
  
  /**
   * Whether sync is currently active
   */
  isActive: boolean
  
  /**
   * Recent sync events (last 10)
   */
  recentEvents: SyncEvent[]
  
  /**
   * Manually start sync
   */
  start: () => Promise<boolean>
  
  /**
   * Stop sync
   */
  stop: () => void
  
  /**
   * Trigger a full data sync
   */
  fullSync: () => Promise<void>
  
  /**
   * Pause sync (can be resumed)
   */
  pause: () => void
  
  /**
   * Resume sync
   */
  resume: () => Promise<boolean>
}

export function useRealtimeSync(options: UseRealtimeSyncOptions = {}): UseRealtimeSyncReturn {
  const {
    tables = ['*'], // Default to all tables
    autoInit = true,
    pauseOnHidden = true,
    onSync,
    onStatusChange
  } = options

  const [status, setStatus] = useState<SyncStatus>(realtimeSync.getStatus())
  const [isActive, setIsActive] = useState(false)
  const [recentEvents, setRecentEvents] = useState<SyncEvent[]>([])
  
  const unsubscribeRefs = useRef<(() => void)[]>([])
  const isInitializedRef = useRef(false)

  /**
   * Handle sync events
   */
  const handleSyncEvent = useCallback((event: SyncEvent) => {
    // Update recent events (keep last 10)
    setRecentEvents(prev => {
      const newEvents = [event, ...prev].slice(0, 10)
      return newEvents
    })

    // Call custom callback if provided
    if (onSync) {
      onSync(event)
    }
  }, [onSync])

  /**
   * Handle status changes
   */
  const handleStatusChange = useCallback((newStatus: SyncStatus) => {
    setStatus(newStatus)
    setIsActive(newStatus.connected)

    // Call custom callback if provided
    if (onStatusChange) {
      onStatusChange(newStatus)
    }
  }, [onStatusChange])

  /**
   * Start real-time sync
   */
  const start = useCallback(async (): Promise<boolean> => {
    try {
      // Initialize without user ID for shared usage
      const success = await realtimeSync.initialize(null)
      
      if (success) {
        // Clean up previous subscriptions
        unsubscribeRefs.current.forEach(unsubscribe => unsubscribe())
        unsubscribeRefs.current = []

        // Subscribe to sync events for specified tables
        tables.forEach(table => {
          const unsubscribe = realtimeSync.onSync(table, handleSyncEvent)
          unsubscribeRefs.current.push(unsubscribe)
        })

        // Subscribe to status changes
        const statusUnsubscribe = realtimeSync.onStatusChange(handleStatusChange)
        unsubscribeRefs.current.push(statusUnsubscribe)

        setIsActive(true)
        isInitializedRef.current = true
        
        console.log('Real-time sync started for tables:', tables)
        return true
      }
      
      return false
    } catch (error) {
      console.error('Failed to start real-time sync:', error)
      return false
    }
  }, [tables, handleSyncEvent, handleStatusChange])

  /**
   * Stop real-time sync
   */
  const stop = useCallback(() => {
    // Clean up subscriptions
    unsubscribeRefs.current.forEach(unsubscribe => unsubscribe())
    unsubscribeRefs.current = []
    
    // Clean up real-time service
    realtimeSync.cleanup()
    
    setIsActive(false)
    setStatus(realtimeSync.getStatus())
    isInitializedRef.current = false
    
    console.log('Real-time sync stopped')
  }, [])

  /**
   * Trigger full sync
   */
  const fullSync = useCallback(async () => {
    try {
      await realtimeSync.fullSync()
    } catch (error) {
      console.error('Full sync failed:', error)
    }
  }, [])

  /**
   * Pause sync
   */
  const pause = useCallback(() => {
    realtimeSync.pause()
    setIsActive(false)
    setStatus(realtimeSync.getStatus())
  }, [])

  /**
   * Resume sync
   */
  const resume = useCallback(async (): Promise<boolean> => {
    const success = await realtimeSync.resume()
    if (success) {
      setIsActive(true)
      setStatus(realtimeSync.getStatus())
    }
    return success
  }, [])

  // Auto-initialize when component mounts
  useEffect(() => {
    if (autoInit && !isInitializedRef.current) {
      start()
    }
  }, [autoInit, start])

  // Handle visibility change for battery saving
  useEffect(() => {
    if (!pauseOnHidden) return

    const handleVisibilityChange = () => {
      if (document.hidden && isActive) {
        pause()
      } else if (!document.hidden && !isActive) {
        resume()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [pauseOnHidden, isActive, pause, resume])

  // No user logout to handle since we don't use authentication

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop()
    }
  }, [stop])

  return {
    status,
    isActive,
    recentEvents,
    start,
    stop,
    fullSync,
    pause,
    resume
  }
}

/**
 * Simplified hook for basic real-time sync
 */
export function useBasicSync() {
  return useRealtimeSync({
    autoInit: true,
    pauseOnHidden: true,
    tables: ['*'] // All tables
  })
}

/**
 * Hook for monitoring sync status only (no event handling)
 */
export function useSyncStatus() {
  const [status, setStatus] = useState<SyncStatus>(realtimeSync.getStatus())

  useEffect(() => {
    const unsubscribe = realtimeSync.onStatusChange(setStatus)
    return unsubscribe
  }, [])

  return status
}
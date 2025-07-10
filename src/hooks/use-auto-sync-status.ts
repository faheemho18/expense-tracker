/**
 * Auto-Sync Status Hook
 * Provides reactive sync status for UI components
 */

import { useState, useEffect } from 'react'
import { autoSyncManager, AutoSyncStatus } from '@/lib/auto-sync-manager'

export interface AutoSyncStatusHook {
  isOnline: boolean
  isEnabled: boolean
  isProcessing: boolean
  pendingCount: number
  lastSync: number | null
  failedCount: number
}

export const useAutoSyncStatus = (): AutoSyncStatusHook => {
  const [status, setStatus] = useState<AutoSyncStatusHook>({
    isOnline: true,
    isEnabled: true,
    isProcessing: false,
    pendingCount: 0,
    lastSync: null,
    failedCount: 0
  })

  useEffect(() => {
    const updateStatus = async () => {
      try {
        const syncStatus = await autoSyncManager.getStatus()
        setStatus({
          isOnline: syncStatus.connectivity.isOnline,
          isEnabled: syncStatus.isEnabled,
          isProcessing: syncStatus.isRunning,
          pendingCount: syncStatus.pendingOperations,
          lastSync: syncStatus.lastSuccessfulSync,
          failedCount: syncStatus.failedOperations
        })
      } catch (error) {
        console.error('Error getting sync status:', error)
      }
    }

    // Update status immediately
    updateStatus()

    // Subscribe to status changes
    const unsubscribe = autoSyncManager.onStatusChange((syncStatus: AutoSyncStatus) => {
      setStatus({
        isOnline: syncStatus.connectivity.isOnline,
        isEnabled: syncStatus.isEnabled,
        isProcessing: syncStatus.isRunning,
        pendingCount: syncStatus.pendingOperations,
        lastSync: syncStatus.lastSuccessfulSync,
        failedCount: syncStatus.failedOperations
      })
    })

    // Update status every 30 seconds
    const interval = setInterval(updateStatus, 30000)

    return () => {
      unsubscribe()
      clearInterval(interval)
    }
  }, [])

  return status
}
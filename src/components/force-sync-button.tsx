/**
 * Force Sync Button Component
 * Triggers manual sync in settings
 */

import React from 'react'
import { useAutoSyncStatus } from '@/hooks/use-auto-sync-status'
import { autoSyncManager } from '@/lib/auto-sync-manager'

export const ForceSyncButton: React.FC = () => {
  const { isOnline, isProcessing } = useAutoSyncStatus()
  const [isSyncing, setIsSyncing] = React.useState(false)

  const handleForceSync = async () => {
    if (isSyncing || isProcessing) return

    setIsSyncing(true)
    try {
      await autoSyncManager.forceSync()
    } catch (error) {
      console.error('Force sync failed:', error)
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <button
      data-testid="force-sync-button"
      onClick={handleForceSync}
      disabled={!isOnline || isSyncing || isProcessing}
      className={`
        px-4 py-2 rounded-md font-medium transition-colors
        ${!isOnline || isSyncing || isProcessing 
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50' 
          : 'bg-blue-500 text-white hover:bg-blue-600'
        }
      `}
      aria-label="Force sync now"
      aria-disabled={!isOnline || isSyncing || isProcessing}
    >
      {isSyncing ? 'Syncing...' : 'Force Sync'}
    </button>
  )
}

export default ForceSyncButton
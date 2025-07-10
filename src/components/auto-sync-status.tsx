/**
 * Auto-Sync Status Component
 * Displays sync status in settings interface
 */

import React from 'react'
import { useAutoSyncStatus } from '@/hooks/use-auto-sync-status'
import { ForceSyncButton } from './force-sync-button'

export const AutoSyncStatus: React.FC = () => {
  const { isOnline, isEnabled, pendingCount, lastSync, isProcessing } = useAutoSyncStatus()

  return (
    <div data-testid="auto-sync-status" role="status" aria-live="polite" aria-label="Sync status">
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${
          isProcessing ? 'bg-blue-500 animate-spin' : 
          isOnline ? 'bg-green-500' : 'bg-orange-500'
        }`} />
        <span>
          {isProcessing ? 'Syncing...' : 
           isOnline ? 'Online' : 'Offline'} • {isEnabled ? 'Automatic sync enabled' : 'Sync disabled'}
        </span>
      </div>
      
      {pendingCount > 0 && (
        <div className="mt-2 text-sm text-gray-600">
          <span data-testid="pending-operations">{pendingCount} pending operations</span>
        </div>
      )}
      
      {lastSync && (
        <div className="mt-2 text-sm text-gray-500">
          <span data-testid="last-sync-time">
            Last sync: {new Date(lastSync).toLocaleString()}
          </span>
        </div>
      )}
      
      {isOnline && (
        <div className="mt-4">
          <ForceSyncButton />
        </div>
      )}
    </div>
  )
}

export default AutoSyncStatus
/**
 * Auto-Sync Indicator Component
 * Shows sync status in header/sidebar
 */

import React from 'react'
import { useAutoSyncStatus } from '@/hooks/use-auto-sync-status'

export const SyncIndicator: React.FC = () => {
  const { isOnline, isEnabled, pendingCount, isProcessing } = useAutoSyncStatus()

  const getStatusColor = () => {
    if (!isEnabled) return 'bg-gray-500'
    if (isProcessing) return 'bg-blue-500 animate-spin'
    if (!isOnline) return 'bg-orange-500'
    return 'bg-green-500'
  }

  const getStatusText = () => {
    if (!isEnabled) return 'Sync disabled'
    if (isProcessing) return 'Syncing...'
    if (!isOnline) return 'Offline'
    return 'Online'
  }

  return (
    <div 
      data-testid="sync-indicator" 
      className={`w-3 h-3 rounded-full ${getStatusColor()}`}
      title={getStatusText()}
      role="status"
      aria-live="polite"
      aria-label={`${getStatusText()}${pendingCount > 0 ? ` - ${pendingCount} pending` : ''}`}
    />
  )
}

export const MiniSyncStatus: React.FC = () => {
  const { isOnline, pendingCount } = useAutoSyncStatus()

  return (
    <div className="flex items-center gap-2">
      <SyncIndicator />
      {pendingCount > 0 && (
        <span 
          data-testid="sync-badge" 
          className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full"
          aria-label={`${pendingCount} pending operations`}
        >
          {pendingCount}
        </span>
      )}
    </div>
  )
}

export default SyncIndicator
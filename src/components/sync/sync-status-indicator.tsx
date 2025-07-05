/**
 * Real-time Sync Status Indicator
 * 
 * Shows current sync status with visual indicators and user controls
 */

import React, { useState } from 'react'
import { Wifi, WifiOff, RefreshCw, Pause, Play, Clock, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useRealtimeSync, useSyncStatus } from '@/hooks/use-realtime-sync'
import { formatDistanceToNow } from 'date-fns'

interface SyncStatusIndicatorProps {
  /**
   * Compact mode shows minimal UI
   */
  compact?: boolean
  
  /**
   * Show controls for manual sync operations
   */
  showControls?: boolean
  
  /**
   * Custom className for styling
   */
  className?: string
}

export function SyncStatusIndicator({ 
  compact = false, 
  showControls = true,
  className = '' 
}: SyncStatusIndicatorProps) {
  const status = useSyncStatus()
  const { isActive, recentEvents, fullSync, pause, resume } = useRealtimeSync()
  const [isManualSyncing, setIsManualSyncing] = useState(false)

  const handleManualSync = async () => {
    setIsManualSyncing(true)
    try {
      await fullSync()
    } finally {
      setIsManualSyncing(false)
    }
  }

  const handleToggleSync = async () => {
    if (isActive) {
      pause()
    } else {
      await resume()
    }
  }

  const getStatusIcon = () => {
    if (!status.connected) {
      return <WifiOff className="h-4 w-4 text-red-500" />
    }
    if (status.pendingChanges > 0) {
      return <RefreshCw className="h-4 w-4 text-yellow-500 animate-spin" />
    }
    return <Wifi className="h-4 w-4 text-green-500" />
  }

  const getStatusText = () => {
    if (!status.connected) return 'Offline'
    if (status.pendingChanges > 0) return 'Syncing...'
    return 'Online'
  }

  const getStatusColor = () => {
    if (!status.connected) return 'destructive'
    if (status.pendingChanges > 0) return 'secondary'
    return 'default'
  }

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`flex items-center gap-1 ${className}`}>
              {getStatusIcon()}
              <span className="text-xs text-muted-foreground">
                {getStatusText()}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm">
              <div>Status: {getStatusText()}</div>
              {status.lastSync && (
                <div>
                  Last sync: {formatDistanceToNow(status.lastSync, { addSuffix: true })}
                </div>
              )}
              {status.pendingChanges > 0 && (
                <div>Pending: {status.pendingChanges} changes</div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Badge variant={getStatusColor()} className="flex items-center gap-1">
        {getStatusIcon()}
        {getStatusText()}
      </Badge>

      {showControls && (
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleManualSync}
                  disabled={isManualSyncing}
                  className="h-8 w-8 p-0"
                >
                  <RefreshCw className={`h-4 w-4 ${isManualSyncing ? 'animate-spin' : ''}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Sync now
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleToggleSync}
                  className="h-8 w-8 p-0"
                >
                  {isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isActive ? 'Pause sync' : 'Resume sync'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <AlertCircle className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium">Sync Status</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>Connected: {status.connected ? 'Yes' : 'No'}</div>
                    {status.lastSync && (
                      <div>
                        Last sync: {formatDistanceToNow(status.lastSync, { addSuffix: true })}
                      </div>
                    )}
                    <div>Pending changes: {status.pendingChanges}</div>
                    {status.conflictCount > 0 && (
                      <div className="text-yellow-600">
                        Conflicts: {status.conflictCount}
                      </div>
                    )}
                  </div>
                </div>

                {recentEvents.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Recent Activity</h4>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {recentEvents.slice(0, 5).map((event, index) => (
                        <div key={index} className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{event.eventType}</span>
                          <span>{event.table}</span>
                          <span>
                            {formatDistanceToNow(event.timestamp, { addSuffix: true })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t">
                  <div className="text-xs text-muted-foreground">
                    Real-time sync keeps your data synchronized across all devices.
                    {!status.connected && (
                      <div className="text-yellow-600 mt-1">
                        Currently offline - changes will sync when connection is restored.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  )
}

/**
 * Minimal sync status for use in headers/footers
 */
export function MiniSyncStatus({ className = '' }: { className?: string }) {
  return (
    <SyncStatusIndicator 
      compact 
      showControls={false} 
      className={className}
    />
  )
}

/**
 * Full sync controls for settings pages
 */
export function SyncControls({ className = '' }: { className?: string }) {
  return (
    <SyncStatusIndicator 
      compact={false} 
      showControls={true} 
      className={className}
    />
  )
}
/**
 * Auto-Sync Status Component
 * 
 * Displays simple, clean status of automatic synchronization.
 * Shows connection status, pending operations, and last sync time.
 */

"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Check, 
  Clock, 
  AlertCircle 
} from "lucide-react"
import { autoSyncManager, AutoSyncStatus } from "@/lib/auto-sync-manager"
import { AutoSyncUtils } from "@/lib/auto-sync-manager"

export function AutoSyncStatus() {
  const [syncStatus, setSyncStatus] = useState<AutoSyncStatus | null>(null)
  const [statusText, setStatusText] = useState<string>('Initializing...')
  const [lastSyncText, setLastSyncText] = useState<string>('')
  const [isForcing, setIsForcing] = useState(false)

  useEffect(() => {
    let mounted = true

    const updateStatus = async () => {
      if (!mounted) return
      
      try {
        const status = await autoSyncManager.getStatus()
        const statusText = await AutoSyncUtils.getSyncStatusText()
        
        setSyncStatus(status)
        setStatusText(statusText)
        
        // Format last sync time
        if (status.lastSuccessfulSync) {
          const lastSync = new Date(status.lastSuccessfulSync)
          const now = new Date()
          const diffMinutes = Math.floor((now.getTime() - lastSync.getTime()) / (1000 * 60))
          
          if (diffMinutes < 1) {
            setLastSyncText('Just now')
          } else if (diffMinutes < 60) {
            setLastSyncText(`${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`)
          } else {
            setLastSyncText(lastSync.toLocaleTimeString())
          }
        } else {
          setLastSyncText('Never')
        }
      } catch (error) {
        console.error('Error getting sync status:', error)
        setStatusText('Error')
      }
    }

    // Initial load
    updateStatus()

    // Subscribe to status changes
    const unsubscribe = autoSyncManager.onStatusChange(() => {
      updateStatus()
    })

    // Periodic updates for time formatting
    const interval = setInterval(updateStatus, 30000) // Every 30 seconds

    return () => {
      mounted = false
      unsubscribe()
      clearInterval(interval)
    }
  }, [])

  const handleForceSync = async () => {
    setIsForcing(true)
    try {
      await autoSyncManager.forceSync()
    } catch (error) {
      console.error('Force sync failed:', error)
    } finally {
      setIsForcing(false)
    }
  }

  const getStatusIcon = () => {
    if (!syncStatus) return <RefreshCw className="h-4 w-4 animate-spin" />
    
    if (!syncStatus.connectivity.isOnline) {
      return <WifiOff className="h-4 w-4" />
    }
    
    if (!syncStatus.connectivity.isDatabaseReachable) {
      return <RefreshCw className="h-4 w-4 animate-spin" />
    }
    
    if (syncStatus.pendingOperations > 0) {
      return <RefreshCw className="h-4 w-4 animate-spin" />
    }
    
    return <Check className="h-4 w-4" />
  }

  const getStatusVariant = (): "default" | "secondary" | "destructive" | "outline" => {
    if (!syncStatus) return "secondary"
    
    if (!syncStatus.connectivity.isOnline) {
      return "destructive"
    }
    
    if (!syncStatus.connectivity.isDatabaseReachable) {
      return "secondary"
    }
    
    if (syncStatus.pendingOperations > 0) {
      return "secondary"
    }
    
    return "default"
  }

  return (
    <div className="space-y-4">
      {/* Main Status Display */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="font-medium">Connection Status</div>
          <div className="flex items-center gap-2">
            <Badge variant={getStatusVariant()} className="flex items-center gap-1">
              {getStatusIcon()}
              {statusText}
            </Badge>
            {syncStatus && syncStatus.pendingOperations > 0 && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {syncStatus.pendingOperations} pending
              </Badge>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleForceSync}
          disabled={isForcing || !syncStatus?.connectivity.isDatabaseReachable}
        >
          {isForcing ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Sync Information */}
      <div className="text-sm text-muted-foreground space-y-1">
        <div className="flex items-center justify-between">
          <span>Last sync:</span>
          <span>{lastSyncText}</span>
        </div>
        {syncStatus && (
          <div className="flex items-center justify-between">
            <span>Auto-sync:</span>
            <span className="flex items-center gap-1">
              {syncStatus.isEnabled ? (
                <>
                  <Check className="h-3 w-3 text-green-500" />
                  Active
                </>
              ) : (
                <>
                  <AlertCircle className="h-3 w-3 text-yellow-500" />
                  Disabled
                </>
              )}
            </span>
          </div>
        )}
      </div>

      {/* Status Details */}
      {syncStatus && !syncStatus.connectivity.isOnline && (
        <div className="rounded-md bg-muted p-3">
          <div className="flex items-center gap-2 text-sm">
            <WifiOff className="h-4 w-4" />
            <span>Offline - Changes will sync when you're back online</span>
          </div>
        </div>
      )}

      {syncStatus && syncStatus.connectivity.isOnline && !syncStatus.connectivity.isDatabaseReachable && (
        <div className="rounded-md bg-muted p-3">
          <div className="flex items-center gap-2 text-sm">
            <RefreshCw className="h-4 w-4" />
            <span>Connecting to database...</span>
          </div>
        </div>
      )}

      {syncStatus && syncStatus.failedOperations > 0 && (
        <div className="rounded-md bg-destructive/10 p-3">
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>{syncStatus.failedOperations} operations failed - will retry automatically</span>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Compact version for header/sidebar use
 */
export function CompactAutoSyncStatus() {
  const [statusText, setStatusText] = useState<string>('...')
  const [syncStatus, setSyncStatus] = useState<AutoSyncStatus | null>(null)

  useEffect(() => {
    let mounted = true

    const updateStatus = async () => {
      if (!mounted) return
      
      try {
        const status = await autoSyncManager.getStatus()
        const statusText = await AutoSyncUtils.getSyncStatusText()
        
        setSyncStatus(status)
        setStatusText(statusText)
      } catch (error) {
        console.error('Error getting sync status:', error)
        setStatusText('Error')
      }
    }

    updateStatus()

    const unsubscribe = autoSyncManager.onStatusChange(() => {
      updateStatus()
    })

    return () => {
      mounted = false
      unsubscribe()
    }
  }, [])

  const getStatusIcon = () => {
    if (!syncStatus) return <RefreshCw className="h-3 w-3 animate-spin" />
    
    if (!syncStatus.connectivity.isOnline) {
      return <WifiOff className="h-3 w-3" />
    }
    
    if (!syncStatus.connectivity.isDatabaseReachable) {
      return <RefreshCw className="h-3 w-3 animate-spin" />
    }
    
    if (syncStatus.pendingOperations > 0) {
      return <RefreshCw className="h-3 w-3 animate-spin" />
    }
    
    return <Wifi className="h-3 w-3" />
  }

  const getStatusColor = () => {
    if (!syncStatus) return "text-muted-foreground"
    
    if (!syncStatus.connectivity.isOnline) {
      return "text-destructive"
    }
    
    if (!syncStatus.connectivity.isDatabaseReachable) {
      return "text-yellow-500"
    }
    
    if (syncStatus.pendingOperations > 0) {
      return "text-blue-500"
    }
    
    return "text-green-500"
  }

  return (
    <div className={`flex items-center gap-2 text-sm ${getStatusColor()}`}>
      {getStatusIcon()}
      <span>{statusText}</span>
      {syncStatus && syncStatus.pendingOperations > 0 && (
        <span className="text-xs text-muted-foreground">
          ({syncStatus.pendingOperations})
        </span>
      )}
    </div>
  )
}
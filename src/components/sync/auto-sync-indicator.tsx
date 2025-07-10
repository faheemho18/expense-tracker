/**
 * Auto-Sync Indicator
 * 
 * Minimal, non-intrusive sync status indicator for header/navbar.
 * Shows simple visual states: online (green), offline (orange), syncing (spinning).
 * Clean tooltip provides detailed status without cluttering the UI.
 */

"use client"

import { useState, useEffect } from "react"
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Cloud, 
  CloudOff,
  Clock,
  AlertCircle,
  Check
} from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { autoSyncManager, AutoSyncStatus } from "@/lib/auto-sync-manager"
import { AutoSyncUtils } from "@/lib/auto-sync-manager"

interface AutoSyncIndicatorProps {
  /**
   * Display mode: 'dot' for minimal dot indicator, 'badge' for status badge
   */
  variant?: 'dot' | 'badge'
  
  /**
   * Size of the indicator
   */
  size?: 'sm' | 'md' | 'lg'
  
  /**
   * Show pending count in tooltip
   */
  showPendingCount?: boolean
  
  /**
   * Custom className for styling
   */
  className?: string
}

export function AutoSyncIndicator({ 
  variant = 'dot', 
  size = 'md',
  showPendingCount = true,
  className = ''
}: AutoSyncIndicatorProps) {
  const [syncStatus, setSyncStatus] = useState<AutoSyncStatus | null>(null)
  const [statusText, setStatusText] = useState<string>('Initializing...')
  const [isHealthy, setIsHealthy] = useState<boolean>(false)

  useEffect(() => {
    let mounted = true

    const updateStatus = async () => {
      if (!mounted) return
      
      try {
        const status = await autoSyncManager.getStatus()
        const statusText = await AutoSyncUtils.getSyncStatusText()
        const healthy = await AutoSyncUtils.isHealthy()
        
        setSyncStatus(status)
        setStatusText(statusText)
        setIsHealthy(healthy)
      } catch (error) {
        console.error('Error getting sync status:', error)
        setStatusText('Error')
        setIsHealthy(false)
      }
    }

    // Initial load
    updateStatus()

    // Subscribe to status changes
    const unsubscribe = autoSyncManager.onStatusChange(() => {
      updateStatus()
    })

    // Periodic updates
    const interval = setInterval(updateStatus, 10000) // Every 10 seconds

    return () => {
      mounted = false
      unsubscribe()
      clearInterval(interval)
    }
  }, [])

  const getIndicatorState = () => {
    if (!syncStatus) {
      return {
        color: 'bg-gray-400',
        icon: RefreshCw,
        spinning: true,
        label: 'Initializing'
      }
    }

    if (!syncStatus.connectivity.isOnline) {
      return {
        color: 'bg-orange-500',
        icon: WifiOff,
        spinning: false,
        label: 'Offline'
      }
    }

    if (!syncStatus.connectivity.isDatabaseReachable) {
      return {
        color: 'bg-yellow-500',
        icon: RefreshCw,
        spinning: true,
        label: 'Connecting'
      }
    }

    if (syncStatus.pendingOperations > 0) {
      return {
        color: 'bg-blue-500',
        icon: RefreshCw,
        spinning: true,
        label: 'Syncing'
      }
    }

    if (syncStatus.failedOperations > 0) {
      return {
        color: 'bg-red-500',
        icon: AlertCircle,
        spinning: false,
        label: 'Issues'
      }
    }

    return {
      color: 'bg-green-500',
      icon: Check,
      spinning: false,
      label: 'Online'
    }
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          dot: 'h-2 w-2',
          icon: 'h-3 w-3',
          badge: 'text-xs px-2 py-1'
        }
      case 'lg':
        return {
          dot: 'h-4 w-4',
          icon: 'h-5 w-5',
          badge: 'text-sm px-3 py-1'
        }
      default: // md
        return {
          dot: 'h-3 w-3',
          icon: 'h-4 w-4',
          badge: 'text-sm px-2 py-1'
        }
    }
  }

  const getTooltipContent = () => {
    if (!syncStatus) return 'Initializing sync...'

    const lines = []
    
    // Status line
    lines.push(`Status: ${statusText}`)
    
    // Pending operations
    if (showPendingCount && syncStatus.pendingOperations > 0) {
      lines.push(`Pending: ${syncStatus.pendingOperations} operations`)
    }
    
    // Failed operations
    if (syncStatus.failedOperations > 0) {
      lines.push(`Failed: ${syncStatus.failedOperations} operations`)
    }
    
    // Last sync
    if (syncStatus.lastSuccessfulSync) {
      const lastSync = new Date(syncStatus.lastSuccessfulSync)
      const now = new Date()
      const diffMinutes = Math.floor((now.getTime() - lastSync.getTime()) / (1000 * 60))
      
      if (diffMinutes < 1) {
        lines.push('Last sync: Just now')
      } else if (diffMinutes < 60) {
        lines.push(`Last sync: ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`)
      } else {
        lines.push(`Last sync: ${lastSync.toLocaleTimeString()}`)
      }
    }
    
    return lines.join('\n')
  }

  const indicatorState = getIndicatorState()
  const sizeClasses = getSizeClasses()

  if (variant === 'dot') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`inline-flex items-center justify-center cursor-help ${className}`}>
              <div className={`
                ${sizeClasses.dot} 
                ${indicatorState.color} 
                rounded-full 
                flex items-center justify-center
                ${indicatorState.spinning ? 'animate-pulse' : ''}
              `}>
                {indicatorState.spinning && (
                  <RefreshCw className={`${sizeClasses.icon} text-white animate-spin`} />
                )}
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm whitespace-pre-line">
              {getTooltipContent()}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  // Badge variant
  const Icon = indicatorState.icon
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant={isHealthy ? "default" : "secondary"}
            className={`
              ${sizeClasses.badge} 
              flex items-center gap-1 cursor-help
              ${className}
            `}
          >
            <Icon className={`
              ${sizeClasses.icon} 
              ${indicatorState.spinning ? 'animate-spin' : ''}
            `} />
            {indicatorState.label}
            {syncStatus && syncStatus.pendingOperations > 0 && (
              <span className="ml-1 text-xs opacity-75">
                ({syncStatus.pendingOperations})
              </span>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm whitespace-pre-line">
            {getTooltipContent()}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

/**
 * Header-specific sync indicator with minimal footprint
 */
export function HeaderSyncIndicator() {
  return (
    <AutoSyncIndicator 
      variant="dot" 
      size="md" 
      className="mr-2"
    />
  )
}

/**
 * Sidebar-specific sync indicator with more detail
 */
export function SidebarSyncIndicator() {
  return (
    <AutoSyncIndicator 
      variant="badge" 
      size="sm" 
      showPendingCount={false}
      className="mb-2"
    />
  )
}

/**
 * Mobile-friendly sync indicator
 */
export function MobileSyncIndicator() {
  return (
    <AutoSyncIndicator 
      variant="dot" 
      size="lg" 
      className="ml-2"
    />
  )
}
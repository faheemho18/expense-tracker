"use client"

import * as React from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import { Loader2, Wifi, WifiOff } from "lucide-react"

// Mobile-optimized loading spinner
interface MobileLoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  message?: string
}

export function MobileLoadingSpinner({ 
  size = 'md', 
  className = "",
  message 
}: MobileLoadingSpinnerProps) {
  const isMobile = useIsMobile()
  
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: isMobile ? 'h-8 w-8' : 'h-6 w-6',
    lg: isMobile ? 'h-12 w-12' : 'h-8 w-8',
  }

  return (
    <div className={`flex flex-col items-center justify-center gap-2 ${className}`}>
      <Loader2 
        className={`${sizeClasses[size]} animate-spin text-primary`}
        aria-hidden="true"
      />
      {message && (
        <p className={`${isMobile ? 'mobile-caption' : 'text-sm text-muted-foreground'} text-center`}>
          {message}
        </p>
      )}
      <span className="sr-only">Loading...</span>
    </div>
  )
}

// Mobile-specific skeleton loading
interface MobileSkeletonProps {
  className?: string
  variant?: 'text' | 'rectangular' | 'circular'
  animation?: 'pulse' | 'wave' | 'none'
}

export function MobileSkeleton({ 
  className = "",
  variant = 'rectangular',
  animation = 'pulse'
}: MobileSkeletonProps) {
  const isMobile = useIsMobile()

  const baseClasses = "bg-muted"
  const variantClasses = {
    text: 'h-4 w-full rounded',
    rectangular: isMobile ? 'h-20 w-full rounded-md' : 'h-16 w-full rounded',
    circular: isMobile ? 'h-12 w-12 rounded-full' : 'h-10 w-10 rounded-full',
  }
  
  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer-slide',
    none: '',
  }

  // Reduce animations on mobile for better performance
  const finalAnimation = isMobile && animation === 'wave' ? 'pulse' : animation

  return (
    <div 
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[finalAnimation]} ${className}`}
      aria-hidden="true"
    />
  )
}

// Mobile-friendly progress bar
interface MobileProgressBarProps {
  progress: number
  className?: string
  showPercentage?: boolean
  label?: string
}

export function MobileProgressBar({ 
  progress, 
  className = "",
  showPercentage = false,
  label 
}: MobileProgressBarProps) {
  const isMobile = useIsMobile()
  const clampedProgress = Math.max(0, Math.min(100, progress))

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <div className="flex justify-between items-center mb-2">
          <span className={isMobile ? 'mobile-caption' : 'text-sm text-muted-foreground'}>
            {label}
          </span>
          {showPercentage && (
            <span className={isMobile ? 'mobile-caption' : 'text-sm text-muted-foreground'}>
              {Math.round(clampedProgress)}%
            </span>
          )}
        </div>
      )}
      <div className={`w-full ${isMobile ? 'h-3' : 'h-2'} bg-muted rounded-full overflow-hidden`}>
        <div 
          className="h-full bg-primary transition-all duration-300 ease-out rounded-full"
          style={{ width: `${clampedProgress}%` }}
          role="progressbar"
          aria-valuenow={clampedProgress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={label || `Progress: ${Math.round(clampedProgress)}%`}
        />
      </div>
    </div>
  )
}

// Mobile connection status indicator
export function MobileConnectionStatus() {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine)
  const [connectionType, setConnectionType] = React.useState<string>('unknown')
  const isMobile = useIsMobile()

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    // Get connection type if available
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection

    if (connection) {
      setConnectionType(connection.effectiveType || connection.type || 'unknown')
      
      const handleConnectionChange = () => {
        setConnectionType(connection.effectiveType || connection.type || 'unknown')
      }
      
      connection.addEventListener('change', handleConnectionChange)
      
      return () => {
        connection.removeEventListener('change', handleConnectionChange)
      }
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!isMobile) return null

  return (
    <div className={`flex items-center gap-2 ${isMobile ? 'p-2' : 'p-1'}`}>
      {isOnline ? (
        <Wifi className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'} text-green-500`} />
      ) : (
        <WifiOff className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'} text-red-500`} />
      )}
      <span className={isMobile ? 'mobile-caption' : 'text-xs text-muted-foreground'}>
        {isOnline ? connectionType : 'Offline'}
      </span>
      <span className="sr-only">
        Connection status: {isOnline ? `Online (${connectionType})` : 'Offline'}
      </span>
    </div>
  )
}

// Mobile-optimized loading overlay
interface MobileLoadingOverlayProps {
  isLoading: boolean
  message?: string
  progress?: number
  children: React.ReactNode
}

export function MobileLoadingOverlay({ 
  isLoading, 
  message = "Loading...",
  progress,
  children 
}: MobileLoadingOverlayProps) {
  const isMobile = useIsMobile()

  return (
    <div className="relative">
      {children}
      {isLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className={`flex flex-col items-center gap-4 ${isMobile ? 'p-6' : 'p-4'}`}>
            <MobileLoadingSpinner size="lg" />
            <div className="text-center space-y-2">
              <p className={isMobile ? 'mobile-body' : 'text-sm'}>
                {message}
              </p>
              {typeof progress === 'number' && (
                <MobileProgressBar 
                  progress={progress} 
                  className={isMobile ? 'w-48' : 'w-32'}
                  showPercentage
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Hook for mobile-optimized loading states
export function useMobileLoadingState() {
  const [isLoading, setIsLoading] = React.useState(false)
  const [progress, setProgress] = React.useState(0)
  const [message, setMessage] = React.useState("")
  const isMobile = useIsMobile()

  const startLoading = React.useCallback((initialMessage = "Loading...") => {
    setIsLoading(true)
    setProgress(0)
    setMessage(initialMessage)
  }, [])

  const updateProgress = React.useCallback((newProgress: number, newMessage?: string) => {
    setProgress(newProgress)
    if (newMessage) setMessage(newMessage)
  }, [])

  const finishLoading = React.useCallback(() => {
    setProgress(100)
    // Small delay on mobile for visual feedback
    setTimeout(() => {
      setIsLoading(false)
      setProgress(0)
      setMessage("")
    }, isMobile ? 300 : 150)
  }, [isMobile])

  return {
    isLoading,
    progress,
    message,
    startLoading,
    updateProgress,
    finishLoading,
  }
}

// Mobile-friendly empty state
interface MobileEmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function MobileEmptyState({ 
  icon, 
  title, 
  description, 
  action, 
  className = "" 
}: MobileEmptyStateProps) {
  const isMobile = useIsMobile()

  return (
    <div className={`flex flex-col items-center justify-center text-center ${isMobile ? 'p-8' : 'p-6'} ${className}`}>
      {icon && (
        <div className={`${isMobile ? 'mb-6' : 'mb-4'} text-muted-foreground`}>
          {icon}
        </div>
      )}
      <h3 className={isMobile ? 'mobile-h4 mb-2' : 'text-lg font-medium mb-2'}>
        {title}
      </h3>
      {description && (
        <p className={`${isMobile ? 'mobile-body text-muted-foreground mb-6' : 'text-sm text-muted-foreground mb-4'} max-w-sm`}>
          {description}
        </p>
      )}
      {action && (
        <div className={isMobile ? 'mt-2' : 'mt-1'}>
          {action}
        </div>
      )}
    </div>
  )
}

// Mobile-optimized retry component
interface MobileRetryProps {
  onRetry: () => void
  error?: string
  className?: string
}

export function MobileRetry({ onRetry, error, className = "" }: MobileRetryProps) {
  const isMobile = useIsMobile()

  return (
    <div className={`flex flex-col items-center justify-center text-center ${isMobile ? 'p-6' : 'p-4'} ${className}`}>
      <div className={`${isMobile ? 'mb-4' : 'mb-3'} text-destructive`}>
        <WifiOff className={isMobile ? 'h-12 w-12' : 'h-8 w-8'} />
      </div>
      <h3 className={isMobile ? 'mobile-h5 mb-2' : 'text-base font-medium mb-2'}>
        Something went wrong
      </h3>
      {error && (
        <p className={`${isMobile ? 'mobile-caption mb-4' : 'text-sm text-muted-foreground mb-3'} max-w-sm`}>
          {error}
        </p>
      )}
      <button
        onClick={onRetry}
        className={`
          bg-primary text-primary-foreground hover:bg-primary/90 rounded-md font-medium transition-colors
          ${isMobile ? 'px-6 py-3 mobile-button-text touch-target' : 'px-4 py-2 text-sm'}
        `}
      >
        Try Again
      </button>
    </div>
  )
}
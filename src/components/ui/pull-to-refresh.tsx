"use client"

import * as React from "react"
import { RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"

interface PullToRefreshProps {
  children: React.ReactNode
  onRefresh: () => Promise<void> | void
  className?: string
  disabled?: boolean
  threshold?: number
  maxDistance?: number
}

export function PullToRefresh({
  children,
  onRefresh,
  className,
  disabled = false,
  threshold = 80,
  maxDistance = 150,
}: PullToRefreshProps) {
  const isMobile = useIsMobile()
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const [pullDistance, setPullDistance] = React.useState(0)
  const [isPulling, setIsPulling] = React.useState(false)
  const [startY, setStartY] = React.useState(0)
  const containerRef = React.useRef<HTMLDivElement>(null)

  // Only enable pull-to-refresh on mobile
  if (!isMobile || disabled) {
    return <div className={className}>{children}</div>
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0) {
      setStartY(e.touches[0].clientY)
      setIsPulling(true)
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling || isRefreshing) return

    const currentY = e.touches[0].clientY
    const distance = Math.max(0, currentY - startY)
    
    if (distance > 0) {
      e.preventDefault()
      setPullDistance(Math.min(distance, maxDistance))
    }
  }

  const handleTouchEnd = async () => {
    if (!isPulling || isRefreshing) return

    setIsPulling(false)

    if (pullDistance >= threshold) {
      setIsRefreshing(true)
      try {
        await onRefresh()
      } finally {
        setIsRefreshing(false)
      }
    }

    setPullDistance(0)
  }

  const pullProgress = Math.min(pullDistance / threshold, 1)
  const shouldRefresh = pullDistance >= threshold

  return (
    <div
      ref={containerRef}
      className={cn("relative h-full overflow-auto", className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: `translateY(${pullDistance * 0.5}px)`,
        transition: isPulling ? "none" : "transform 0.3s ease-out",
      }}
    >
      {/* Pull to refresh indicator */}
      {pullDistance > 0 && (
        <div
          className="absolute top-0 left-0 right-0 z-10 flex items-center justify-center"
          style={{
            height: `${pullDistance}px`,
            transform: `translateY(-${pullDistance}px)`,
          }}
        >
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <RefreshCw
              className={cn(
                "h-6 w-6 transition-all duration-200",
                isRefreshing && "animate-spin",
                shouldRefresh && !isRefreshing && "text-primary"
              )}
              style={{
                transform: `rotate(${pullProgress * 360}deg)`,
              }}
            />
            <span className="text-sm font-medium">
              {isRefreshing 
                ? "Refreshing..." 
                : shouldRefresh 
                  ? "Release to refresh" 
                  : "Pull to refresh"
              }
            </span>
          </div>
        </div>
      )}

      {children}
    </div>
  )
}
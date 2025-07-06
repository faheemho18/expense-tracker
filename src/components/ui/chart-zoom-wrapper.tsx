"use client"

import * as React from "react"
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"
import { Button } from "@/components/ui/button"

interface ChartZoomWrapperProps {
  children: React.ReactNode
  className?: string
  disabled?: boolean
}

export function ChartZoomWrapper({ 
  children, 
  className, 
  disabled = false 
}: ChartZoomWrapperProps) {
  const isMobile = useIsMobile()
  const [scale, setScale] = React.useState(1)
  const [position, setPosition] = React.useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = React.useState(false)
  const [lastTouchDistance, setLastTouchDistance] = React.useState(0)
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0, posX: 0, posY: 0 })
  
  const containerRef = React.useRef<HTMLDivElement>(null)

  // Only enable on mobile and when not disabled
  const isEnabled = isMobile && !disabled

  const resetZoom = () => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev * 1.3, 3))
  }

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev / 1.3, 0.8))
  }

  // Touch handlers for pinch-to-zoom and pan
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isEnabled) return

    if (e.touches.length === 1) {
      // Single touch - start panning
      setIsDragging(true)
      setDragStart({
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        posX: position.x,
        posY: position.y
      })
    } else if (e.touches.length === 2) {
      // Two touches - start pinch-to-zoom
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      )
      setLastTouchDistance(distance)
      setIsDragging(false)
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isEnabled) return
    
    e.preventDefault()
    
    if (e.touches.length === 1 && isDragging && scale > 1) {
      // Single touch - pan
      const deltaX = e.touches[0].clientX - dragStart.x
      const deltaY = e.touches[0].clientY - dragStart.y
      setPosition({
        x: dragStart.posX + deltaX,
        y: dragStart.posY + deltaY
      })
    } else if (e.touches.length === 2) {
      // Two touches - pinch-to-zoom
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      )
      
      if (lastTouchDistance > 0) {
        const scaleFactor = distance / lastTouchDistance
        setScale(prev => Math.max(0.8, Math.min(3, prev * scaleFactor)))
      }
      
      setLastTouchDistance(distance)
    }
  }

  const handleTouchEnd = () => {
    if (!isEnabled) return
    
    setIsDragging(false)
    setLastTouchDistance(0)
  }

  if (!isEnabled) {
    return <div className={className}>{children}</div>
  }

  return (
    <div className={cn("relative h-full w-full", className)}>
      {/* Zoom controls */}
      {scale !== 1 && (
        <div className="absolute top-2 right-2 z-10 flex gap-1">
          <Button
            variant="secondary"
            size="icon"
            onClick={handleZoomOut}
            disabled={scale <= 0.8}
            className="h-8 w-8 bg-white/90 text-black hover:bg-white shadow-md"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            onClick={handleZoomIn}
            disabled={scale >= 3}
            className="h-8 w-8 bg-white/90 text-black hover:bg-white shadow-md"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            onClick={resetZoom}
            className="h-8 w-8 bg-white/90 text-black hover:bg-white shadow-md"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Chart container with proper bounds */}
      <div
        ref={containerRef}
        className="h-full w-full overflow-hidden rounded-lg" // Added rounded borders and full size
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          cursor: isDragging ? 'grabbing' : scale > 1 ? 'grab' : 'default',
          // Ensure container respects bounds
          position: 'relative',
        }}
      >
        <div
          className="h-full w-full" // Ensure children take full space
          style={{
            transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.2s ease-out',
            // Prevent content from exceeding bounds
            minHeight: '100%',
            minWidth: '100%',
          }}
        >
          {children}
        </div>
      </div>

      {/* Instructions - only show on mobile and when not zoomed */}
      {scale === 1 && isMobile && (
        <div className="absolute bottom-2 left-2 right-2 z-10 pointer-events-none">
          <div className="rounded bg-black/60 px-3 py-1 text-center text-xs text-white backdrop-blur-sm">
            <p>Pinch to zoom • Drag to pan</p>
          </div>
        </div>
      )}
    </div>
  )
}
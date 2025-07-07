"use client"

import * as React from "react"
import { ZoomIn, ZoomOut, RotateCcw, Maximize2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useViewport } from "@/hooks/use-viewport"
import { useTouchGestures, useZoomGestures } from "@/hooks/use-touch-gestures"
import { TouchOptimizations, TouchDetection } from "@/lib/touch-utils"

export interface ChartZoomWrapperProps {
  children: React.ReactNode
  className?: string
  minZoom?: number
  maxZoom?: number
  enablePinchZoom?: boolean
  enableZoomControls?: boolean
  onZoomChange?: (zoom: number) => void
  initialZoom?: number
}

interface ZoomState {
  scale: number
  translateX: number
  translateY: number
  isZooming: boolean
}

/**
 * Wrapper component that adds touch-friendly zoom and pan functionality to charts
 * Provides pinch-to-zoom, zoom controls, and smooth touch interactions
 */
export function ChartZoomWrapper({
  children,
  className,
  minZoom = 0.5,
  maxZoom = 3,
  enablePinchZoom = true,
  enableZoomControls = true,
  onZoomChange,
  initialZoom = 1,
}: ChartZoomWrapperProps) {
  const viewport = useViewport()
  const containerRef = React.useRef<HTMLDivElement>(null)
  const contentRef = React.useRef<HTMLDivElement>(null)
  
  // Zoom state
  const [zoomState, setZoomState] = React.useState<ZoomState>({
    scale: initialZoom,
    translateX: 0,
    translateY: 0,
    isZooming: false,
  })

  // Touch gesture handling for pinch-to-zoom
  const { ref: touchRef, gestureState } = useZoomGestures(
    React.useCallback((scale: number, center: { x: number; y: number }) => {
      if (!enablePinchZoom) return

      const clampedScale = Math.max(minZoom, Math.min(maxZoom, scale))
      
      setZoomState(prev => ({
        ...prev,
        scale: clampedScale,
        isZooming: true,
      }))

      onZoomChange?.(clampedScale)
    }, [enablePinchZoom, minZoom, maxZoom, onZoomChange]),
    {
      minZoom,
      maxZoom,
      zoomSensitivity: 0.01,
    }
  )

  // Combine refs for container
  const combinedRef = React.useCallback((node: HTMLDivElement) => {
    ;(containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node
    ;(touchRef as React.MutableRefObject<HTMLDivElement | null>).current = node
  }, [touchRef])

  // Pan gesture handling for zoomed content
  const { ref: panRef } = useTouchGestures(
    {
      onPan: React.useCallback((state: any) => {
        if (zoomState.scale <= 1) return // Only allow panning when zoomed

        setZoomState(prev => ({
          ...prev,
          translateX: prev.translateX + state.panDelta.x * 0.5,
          translateY: prev.translateY + state.panDelta.y * 0.5,
        }))
      }, [zoomState.scale]),

      onGestureEnd: React.useCallback(() => {
        setZoomState(prev => ({ ...prev, isZooming: false }))
      }, []),
    },
    {
      enablePan: true,
      enableSwipe: false,
      enableZoom: false,
      panThreshold: 5,
    }
  )

  // Zoom control handlers
  const handleZoomIn = React.useCallback(() => {
    const newScale = Math.min(maxZoom, zoomState.scale * 1.2)
    setZoomState(prev => ({ ...prev, scale: newScale }))
    onZoomChange?.(newScale)
  }, [zoomState.scale, maxZoom, onZoomChange])

  const handleZoomOut = React.useCallback(() => {
    const newScale = Math.max(minZoom, zoomState.scale / 1.2)
    setZoomState(prev => ({ ...prev, scale: newScale }))
    onZoomChange?.(newScale)
  }, [zoomState.scale, minZoom, onZoomChange])

  const handleReset = React.useCallback(() => {
    setZoomState({
      scale: 1,
      translateX: 0,
      translateY: 0,
      isZooming: false,
    })
    onZoomChange?.(1)
  }, [onZoomChange])

  const handleFitToContainer = React.useCallback(() => {
    if (!containerRef.current || !contentRef.current) return

    const containerRect = containerRef.current.getBoundingClientRect()
    const contentRect = contentRef.current.getBoundingClientRect()

    const scaleX = containerRect.width / contentRect.width
    const scaleY = containerRect.height / contentRect.height
    const optimalScale = Math.min(scaleX, scaleY, maxZoom)

    setZoomState({
      scale: optimalScale,
      translateX: 0,
      translateY: 0,
      isZooming: false,
    })
    onZoomChange?.(optimalScale)
  }, [maxZoom, onZoomChange])

  // Touch-friendly control styles
  const controlButtonClass = cn(
    "h-8 w-8 p-0 shadow-lg",
    viewport.isMobile && "h-10 w-10", // Larger touch targets on mobile
    "bg-background/80 backdrop-blur-sm border border-border/50",
    "hover:bg-background/90 hover:scale-105 transition-all duration-200",
    "focus:ring-2 focus:ring-primary/20 focus:outline-none"
  )

  // Apply touch optimizations to controls
  React.useEffect(() => {
    if (!viewport.isTouchDevice) return

    const controls = containerRef.current?.querySelectorAll('button')
    if (!controls) return

    controls.forEach(control => {
      TouchOptimizations.applyTouchStyles(control as HTMLElement)
    })
  }, [viewport.isTouchDevice])

  const contentStyle: React.CSSProperties = {
    transform: `scale(${zoomState.scale}) translate(${zoomState.translateX}px, ${zoomState.translateY}px)`,
    transformOrigin: 'center center',
    transition: zoomState.isZooming ? 'none' : 'transform 0.2s ease-out',
    willChange: 'transform', // Optimize for transforms
  }

  const isZoomed = zoomState.scale !== 1 || zoomState.translateX !== 0 || zoomState.translateY !== 0
  const canZoomIn = zoomState.scale < maxZoom
  const canZoomOut = zoomState.scale > minZoom

  return (
    <div
      ref={combinedRef}
      className={cn(
        "relative w-full h-full overflow-hidden",
        "touch-pan-x touch-pan-y", // Enable touch scrolling when zoomed
        className
      )}
      style={{
        touchAction: enablePinchZoom ? 'none' : 'auto', // Prevent browser zoom when using custom zoom
      }}
    >
      {/* Zoom Controls */}
      {enableZoomControls && (viewport.isTouchDevice || viewport.isDesktop) && (
        <div className={cn(
          "absolute top-2 right-2 z-10 flex flex-col gap-1",
          viewport.isMobile && "top-3 right-3 gap-2" // More spacing on mobile
        )}>
          <Button
            size="sm"
            variant="outline"
            className={controlButtonClass}
            onClick={handleZoomIn}
            disabled={!canZoomIn}
            title="Zoom In"
            aria-label="Zoom In"
          >
            <ZoomIn className="h-3 w-3" />
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            className={controlButtonClass}
            onClick={handleZoomOut}
            disabled={!canZoomOut}
            title="Zoom Out"
            aria-label="Zoom Out"
          >
            <ZoomOut className="h-3 w-3" />
          </Button>
          
          {isZoomed && (
            <Button
              size="sm"
              variant="outline"
              className={controlButtonClass}
              onClick={handleReset}
              title="Reset Zoom"
              aria-label="Reset Zoom"
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
          )}
          
          <Button
            size="sm"
            variant="outline"
            className={controlButtonClass}
            onClick={handleFitToContainer}
            title="Fit to Container"
            aria-label="Fit to Container"
          >
            <Maximize2 className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Chart Content */}
      <div
        ref={contentRef}
        className="w-full h-full origin-center"
        style={contentStyle}
      >
        {children}
      </div>

      {/* Zoom Level Indicator */}
      {zoomState.scale !== 1 && (
        <div className={cn(
          "absolute bottom-2 left-2 z-10",
          "bg-background/80 backdrop-blur-sm border border-border/50 rounded-md px-2 py-1",
          "text-xs font-medium text-muted-foreground",
          viewport.isMobile && "bottom-3 left-3 text-sm" // Larger on mobile
        )}>
          {Math.round(zoomState.scale * 100)}%
        </div>
      )}

      {/* Touch Instructions (first time only) */}
      {enablePinchZoom && viewport.isTouchDevice && !gestureState.isActive && (
        <div className={cn(
          "absolute inset-0 flex items-center justify-center",
          "bg-background/5 backdrop-blur-sm",
          "pointer-events-none opacity-0 animate-in fade-in duration-1000",
          "text-center text-muted-foreground text-sm",
          zoomState.scale === 1 && "opacity-100"
        )}>
          <div className="space-y-1">
            <p>Pinch to zoom • Drag to pan</p>
            <p className="text-xs opacity-75">Long press for options</p>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Hook to provide zoom state to child components
 */
export function useChartZoom() {
  const context = React.useContext(ChartZoomContext)
  if (!context) {
    return {
      scale: 1,
      translateX: 0,
      translateY: 0,
      isZoomed: false,
      zoomIn: () => {},
      zoomOut: () => {},
      reset: () => {},
    }
  }
  return context
}

interface ChartZoomContextType {
  scale: number
  translateX: number
  translateY: number
  isZoomed: boolean
  zoomIn: () => void
  zoomOut: () => void
  reset: () => void
}

const ChartZoomContext = React.createContext<ChartZoomContextType | null>(null)

/**
 * Provider component for chart zoom context
 */
export function ChartZoomProvider({ 
  children, 
  ...props 
}: ChartZoomWrapperProps) {
  const [zoomState, setZoomState] = React.useState<ZoomState>({
    scale: props.initialZoom || 1,
    translateX: 0,
    translateY: 0,
    isZooming: false,
  })

  const contextValue: ChartZoomContextType = React.useMemo(() => ({
    scale: zoomState.scale,
    translateX: zoomState.translateX,
    translateY: zoomState.translateY,
    isZoomed: zoomState.scale !== 1 || zoomState.translateX !== 0 || zoomState.translateY !== 0,
    zoomIn: () => setZoomState(prev => ({ 
      ...prev, 
      scale: Math.min(props.maxZoom || 3, prev.scale * 1.2) 
    })),
    zoomOut: () => setZoomState(prev => ({ 
      ...prev, 
      scale: Math.max(props.minZoom || 0.5, prev.scale / 1.2) 
    })),
    reset: () => setZoomState({
      scale: 1,
      translateX: 0,
      translateY: 0,
      isZooming: false,
    }),
  }), [zoomState, props.maxZoom, props.minZoom])

  return (
    <ChartZoomContext.Provider value={contextValue}>
      <ChartZoomWrapper {...props}>
        {children}
      </ChartZoomWrapper>
    </ChartZoomContext.Provider>
  )
}
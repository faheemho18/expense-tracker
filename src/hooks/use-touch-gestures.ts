"use client"

import { useRef, useEffect, useCallback, useState } from 'react'

export interface TouchPoint {
  x: number
  y: number
  id: number
}

export interface GestureState {
  // Pan/Swipe
  isPanning: boolean
  panDelta: { x: number; y: number }
  panVelocity: { x: number; y: number }
  swipeDirection: 'left' | 'right' | 'up' | 'down' | null
  
  // Zoom/Pinch
  isZooming: boolean
  zoomScale: number
  zoomDelta: number
  zoomCenter: { x: number; y: number }
  
  // General
  touchCount: number
  isActive: boolean
}

export interface TouchGestureOptions {
  // Pan/Swipe options
  enablePan?: boolean
  enableSwipe?: boolean
  swipeThreshold?: number
  swipeVelocityThreshold?: number
  panThreshold?: number
  
  // Zoom options
  enableZoom?: boolean
  minZoom?: number
  maxZoom?: number
  zoomSensitivity?: number
  
  // General options
  preventDefault?: boolean
  stopPropagation?: boolean
}

export interface TouchGestureCallbacks {
  onPanStart?: (state: GestureState) => void
  onPan?: (state: GestureState) => void
  onPanEnd?: (state: GestureState) => void
  
  onSwipe?: (direction: NonNullable<GestureState['swipeDirection']>, state: GestureState) => void
  
  onZoomStart?: (state: GestureState) => void
  onZoom?: (state: GestureState) => void
  onZoomEnd?: (state: GestureState) => void
  
  onGestureStart?: (state: GestureState) => void
  onGestureEnd?: (state: GestureState) => void
}

const DEFAULT_OPTIONS: Required<TouchGestureOptions> = {
  enablePan: true,
  enableSwipe: true,
  swipeThreshold: 50,
  swipeVelocityThreshold: 0.5,
  panThreshold: 10,
  enableZoom: true,
  minZoom: 0.5,
  maxZoom: 3,
  zoomSensitivity: 0.01,
  preventDefault: true,
  stopPropagation: false,
}

/**
 * Hook for handling touch gestures (pan, swipe, pinch-to-zoom)
 * Provides comprehensive touch interaction support for charts and widgets
 */
export function useTouchGestures<T extends HTMLElement = HTMLElement>(
  callbacks: TouchGestureCallbacks = {},
  options: TouchGestureOptions = {}
) {
  const ref = useRef<T>(null)
  const opts = { ...DEFAULT_OPTIONS, ...options }
  
  // Touch tracking state
  const touchesRef = useRef<Map<number, TouchPoint>>(new Map())
  const initialDistanceRef = useRef<number>(0)
  const initialCenterRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const lastPanTimeRef = useRef<number>(0)
  const lastPanPositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const panStartPositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  
  // Gesture state
  const [gestureState, setGestureState] = useState<GestureState>({
    isPanning: false,
    panDelta: { x: 0, y: 0 },
    panVelocity: { x: 0, y: 0 },
    swipeDirection: null,
    isZooming: false,
    zoomScale: 1,
    zoomDelta: 0,
    zoomCenter: { x: 0, y: 0 },
    touchCount: 0,
    isActive: false,
  })

  // Helper functions
  const getDistance = useCallback((touches: TouchPoint[]): number => {
    if (touches.length < 2) return 0
    const [touch1, touch2] = touches
    return Math.sqrt(
      Math.pow(touch2.x - touch1.x, 2) + Math.pow(touch2.y - touch1.y, 2)
    )
  }, [])

  const getCenter = useCallback((touches: TouchPoint[]): { x: number; y: number } => {
    if (touches.length === 0) return { x: 0, y: 0 }
    
    const centerX = touches.reduce((sum, touch) => sum + touch.x, 0) / touches.length
    const centerY = touches.reduce((sum, touch) => sum + touch.y, 0) / touches.length
    
    return { x: centerX, y: centerY }
  }, [])

  const updateGestureState = useCallback((updates: Partial<GestureState>) => {
    setGestureState(prev => ({ ...prev, ...updates }))
  }, [])

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (opts.preventDefault) e.preventDefault()
    if (opts.stopPropagation) e.stopPropagation()

    const touches = Array.from(e.touches).map(touch => ({
      x: touch.clientX,
      y: touch.clientY,
      id: touch.identifier,
    }))

    // Update touches map
    touchesRef.current.clear()
    touches.forEach(touch => touchesRef.current.set(touch.id, touch))

    const touchCount = touches.length
    const center = getCenter(touches)

    if (touchCount === 1) {
      // Single touch - potential pan/swipe
      panStartPositionRef.current = { x: center.x, y: center.y }
      lastPanPositionRef.current = { x: center.x, y: center.y }
      lastPanTimeRef.current = Date.now()
    } else if (touchCount === 2 && opts.enableZoom) {
      // Two touches - potential zoom
      initialDistanceRef.current = getDistance(touches)
      initialCenterRef.current = center
    }

    const newState: GestureState = {
      ...gestureState,
      touchCount,
      isActive: true,
      zoomCenter: center,
    }

    updateGestureState(newState)
    callbacks.onGestureStart?.(newState)
  }, [opts, gestureState, getDistance, getCenter, updateGestureState, callbacks])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (opts.preventDefault) e.preventDefault()
    if (opts.stopPropagation) e.stopPropagation()

    const touches = Array.from(e.touches).map(touch => ({
      x: touch.clientX,
      y: touch.clientY,
      id: touch.identifier,
    }))

    const touchCount = touches.length
    const center = getCenter(touches)
    const now = Date.now()

    if (touchCount === 1 && (opts.enablePan || opts.enableSwipe)) {
      // Single touch pan/swipe
      const currentPos = center
      const deltaX = currentPos.x - panStartPositionRef.current.x
      const deltaY = currentPos.y - panStartPositionRef.current.y
      
      const timeDelta = now - lastPanTimeRef.current
      const velocityX = timeDelta > 0 ? (currentPos.x - lastPanPositionRef.current.x) / timeDelta : 0
      const velocityY = timeDelta > 0 ? (currentPos.y - lastPanPositionRef.current.y) / timeDelta : 0

      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
      const shouldStartPan = distance > opts.panThreshold

      if (shouldStartPan && !gestureState.isPanning) {
        const newState = {
          ...gestureState,
          isPanning: true,
          panDelta: { x: deltaX, y: deltaY },
          panVelocity: { x: velocityX, y: velocityY },
        }
        updateGestureState(newState)
        callbacks.onPanStart?.(newState)
      } else if (gestureState.isPanning) {
        const newState = {
          ...gestureState,
          panDelta: { x: deltaX, y: deltaY },
          panVelocity: { x: velocityX, y: velocityY },
        }
        updateGestureState(newState)
        callbacks.onPan?.(newState)
      }

      lastPanPositionRef.current = currentPos
      lastPanTimeRef.current = now
      
    } else if (touchCount === 2 && opts.enableZoom) {
      // Two touch zoom
      const currentDistance = getDistance(touches)
      const scale = currentDistance / initialDistanceRef.current
      const zoomDelta = scale - gestureState.zoomScale

      // Clamp zoom scale to min/max bounds
      const clampedScale = Math.max(opts.minZoom, Math.min(opts.maxZoom, scale))

      if (!gestureState.isZooming) {
        const newState = {
          ...gestureState,
          isZooming: true,
          zoomScale: clampedScale,
          zoomDelta,
          zoomCenter: center,
        }
        updateGestureState(newState)
        callbacks.onZoomStart?.(newState)
      } else {
        const newState = {
          ...gestureState,
          zoomScale: clampedScale,
          zoomDelta,
          zoomCenter: center,
        }
        updateGestureState(newState)
        callbacks.onZoom?.(newState)
      }
    }
  }, [opts, gestureState, getDistance, getCenter, updateGestureState, callbacks])

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (opts.preventDefault) e.preventDefault()
    if (opts.stopPropagation) e.stopPropagation()

    const remainingTouches = Array.from(e.touches).map(touch => ({
      x: touch.clientX,
      y: touch.clientY,
      id: touch.identifier,
    }))

    const touchCount = remainingTouches.length

    // Handle swipe detection
    if (gestureState.isPanning && touchCount === 0 && opts.enableSwipe) {
      const { panDelta, panVelocity } = gestureState
      const distance = Math.sqrt(panDelta.x * panDelta.x + panDelta.y * panDelta.y)
      const velocity = Math.sqrt(panVelocity.x * panVelocity.x + panVelocity.y * panVelocity.y)

      if (distance > opts.swipeThreshold && velocity > opts.swipeVelocityThreshold) {
        let swipeDirection: NonNullable<GestureState['swipeDirection']>
        
        if (Math.abs(panDelta.x) > Math.abs(panDelta.y)) {
          swipeDirection = panDelta.x > 0 ? 'right' : 'left'
        } else {
          swipeDirection = panDelta.y > 0 ? 'down' : 'up'
        }

        const newState = { ...gestureState, swipeDirection }
        updateGestureState(newState)
        callbacks.onSwipe?.(swipeDirection, newState)
      }
    }

    // Handle pan end
    if (gestureState.isPanning && touchCount === 0) {
      const newState = {
        ...gestureState,
        isPanning: false,
        panDelta: { x: 0, y: 0 },
        panVelocity: { x: 0, y: 0 },
      }
      updateGestureState(newState)
      callbacks.onPanEnd?.(newState)
    }

    // Handle zoom end
    if (gestureState.isZooming && touchCount < 2) {
      const newState = {
        ...gestureState,
        isZooming: false,
        zoomDelta: 0,
      }
      updateGestureState(newState)
      callbacks.onZoomEnd?.(newState)
    }

    // Handle gesture end
    if (touchCount === 0) {
      const newState = {
        ...gestureState,
        touchCount: 0,
        isActive: false,
        isPanning: false,
        isZooming: false,
        panDelta: { x: 0, y: 0 },
        panVelocity: { x: 0, y: 0 },
        swipeDirection: null,
        zoomDelta: 0,
      }
      updateGestureState(newState)
      callbacks.onGestureEnd?.(newState)
    } else {
      updateGestureState({ touchCount })
    }

    // Reset tracking
    touchesRef.current.clear()
    remainingTouches.forEach(touch => touchesRef.current.set(touch.id, touch))
  }, [opts, gestureState, updateGestureState, callbacks])

  // Set up event listeners
  useEffect(() => {
    const element = ref.current
    if (!element) return

    // Use passive: false to allow preventDefault
    const options = { passive: false }

    element.addEventListener('touchstart', handleTouchStart, options)
    element.addEventListener('touchmove', handleTouchMove, options)
    element.addEventListener('touchend', handleTouchEnd, options)
    element.addEventListener('touchcancel', handleTouchEnd, options)

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
      element.removeEventListener('touchcancel', handleTouchEnd)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd])

  return {
    ref,
    gestureState,
    isSupported: typeof window !== 'undefined' && 'ontouchstart' in window,
  }
}

/**
 * Simplified hook for swipe-only interactions (widget navigation)
 */
export function useSwipeGestures<T extends HTMLElement = HTMLElement>(
  onSwipe: (direction: 'left' | 'right' | 'up' | 'down') => void,
  options: Partial<TouchGestureOptions> = {}
) {
  return useTouchGestures<T>(
    {
      onSwipe: (direction) => onSwipe(direction),
    },
    {
      enablePan: false,
      enableZoom: false,
      enableSwipe: true,
      ...options,
    }
  )
}

/**
 * Simplified hook for zoom-only interactions (chart zooming)
 */
export function useZoomGestures<T extends HTMLElement = HTMLElement>(
  onZoom: (scale: number, center: { x: number; y: number }) => void,
  options: Partial<TouchGestureOptions> = {}
) {
  return useTouchGestures<T>(
    {
      onZoom: (state) => onZoom(state.zoomScale, state.zoomCenter),
    },
    {
      enablePan: false,
      enableSwipe: false,
      enableZoom: true,
      ...options,
    }
  )
}
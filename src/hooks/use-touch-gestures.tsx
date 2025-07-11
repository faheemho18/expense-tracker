"use client"

import * as React from "react"

interface TouchPosition {
  x: number
  y: number
}

interface SwipeGesture {
  direction: 'left' | 'right' | 'up' | 'down'
  distance: number
  velocity: number
}

interface TouchGestureConfig {
  swipeThreshold?: number
  velocityThreshold?: number
  longPressDelay?: number
  tapTolerance?: number
}

const DEFAULT_CONFIG: TouchGestureConfig = {
  swipeThreshold: 50,
  velocityThreshold: 0.3,
  longPressDelay: 500,
  tapTolerance: 10,
}

export function useSwipeGesture(
  onSwipe?: (gesture: SwipeGesture) => void,
  config: TouchGestureConfig = {}
) {
  const configRef = React.useRef({ ...DEFAULT_CONFIG, ...config })
  const touchStartRef = React.useRef<TouchPosition | null>(null)
  const touchTimeRef = React.useRef<number>(0)

  const handlers = React.useMemo(() => {
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0]
      touchStartRef.current = { x: touch.clientX, y: touch.clientY }
      touchTimeRef.current = Date.now()
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current || !onSwipe) return

      const touch = e.changedTouches[0]
      const endPos = { x: touch.clientX, y: touch.clientY }
      const startPos = touchStartRef.current
      const timeDiff = Date.now() - touchTimeRef.current

      const deltaX = endPos.x - startPos.x
      const deltaY = endPos.y - startPos.y
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
      const velocity = distance / timeDiff

      if (distance < configRef.current.swipeThreshold!) return
      if (velocity < configRef.current.velocityThreshold!) return

      let direction: SwipeGesture['direction']
      
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        direction = deltaX > 0 ? 'right' : 'left'
      } else {
        direction = deltaY > 0 ? 'down' : 'up'
      }

      onSwipe({ direction, distance, velocity })

      touchStartRef.current = null
    }

    return { handleTouchStart, handleTouchEnd }
  }, [onSwipe])

  return {
    onTouchStart: handlers.handleTouchStart,
    onTouchEnd: handlers.handleTouchEnd,
  }
}

export function useLongPress(
  onLongPress?: () => void,
  config: TouchGestureConfig = {}
) {
  const configRef = React.useRef({ ...DEFAULT_CONFIG, ...config })
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null)
  const touchStartRef = React.useRef<TouchPosition | null>(null)

  const handlers = React.useMemo(() => {
    const handleStart = (e: TouchEvent | MouseEvent) => {
      if (!onLongPress) return

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
      
      touchStartRef.current = { x: clientX, y: clientY }

      timeoutRef.current = setTimeout(() => {
        onLongPress()
      }, configRef.current.longPressDelay)
    }

    const handleMove = (e: TouchEvent | MouseEvent) => {
      if (!touchStartRef.current) return

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

      const distance = Math.sqrt(
        Math.pow(clientX - touchStartRef.current.x, 2) +
        Math.pow(clientY - touchStartRef.current.y, 2)
      )

      if (distance > configRef.current.tapTolerance!) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
          timeoutRef.current = null
        }
      }
    }

    const handleEnd = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      touchStartRef.current = null
    }

    return { handleStart, handleMove, handleEnd }
  }, [onLongPress])

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return {
    onTouchStart: handlers.handleStart,
    onTouchMove: handlers.handleMove,
    onTouchEnd: handlers.handleEnd,
    onMouseDown: handlers.handleStart,
    onMouseMove: handlers.handleMove,
    onMouseUp: handlers.handleEnd,
    onMouseLeave: handlers.handleEnd,
  }
}

export function useTap(
  onTap?: () => void,
  onDoubleTap?: () => void,
  config: TouchGestureConfig = {}
) {
  const configRef = React.useRef({ ...DEFAULT_CONFIG, ...config })
  const touchStartRef = React.useRef<TouchPosition | null>(null)
  const lastTapRef = React.useRef<number>(0)
  const tapCountRef = React.useRef<number>(0)

  const handlers = React.useMemo(() => {
    const handleStart = (e: TouchEvent | MouseEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
      
      touchStartRef.current = { x: clientX, y: clientY }
    }

    const handleEnd = (e: TouchEvent | MouseEvent) => {
      if (!touchStartRef.current) return

      const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : e.clientX
      const clientY = 'changedTouches' in e ? e.changedTouches[0].clientY : e.clientY

      const distance = Math.sqrt(
        Math.pow(clientX - touchStartRef.current.x, 2) +
        Math.pow(clientY - touchStartRef.current.y, 2)
      )

      if (distance <= configRef.current.tapTolerance!) {
        const now = Date.now()
        const timeSinceLastTap = now - lastTapRef.current

        if (onDoubleTap && timeSinceLastTap < 300) {
          tapCountRef.current += 1
          if (tapCountRef.current === 2) {
            onDoubleTap()
            tapCountRef.current = 0
            lastTapRef.current = 0
          }
        } else {
          tapCountRef.current = 1
          lastTapRef.current = now
          setTimeout(() => {
            if (tapCountRef.current === 1 && onTap) {
              onTap()
            }
            tapCountRef.current = 0
          }, 300)
        }
      }

      touchStartRef.current = null
    }

    return { handleStart, handleEnd }
  }, [onTap, onDoubleTap])

  return {
    onTouchStart: handlers.handleStart,
    onTouchEnd: handlers.handleEnd,
    onMouseDown: handlers.handleStart,
    onMouseUp: handlers.handleEnd,
  }
}

// Utility hook that combines multiple gestures
export function useTouchGestures(callbacks: {
  onSwipe?: (gesture: SwipeGesture) => void
  onLongPress?: () => void
  onTap?: () => void
  onDoubleTap?: () => void
}, config: TouchGestureConfig = {}) {
  const swipeHandlers = useSwipeGesture(callbacks.onSwipe, config)
  const longPressHandlers = useLongPress(callbacks.onLongPress, config)
  const tapHandlers = useTap(callbacks.onTap, callbacks.onDoubleTap, config)

  return React.useMemo(() => ({
    onTouchStart: (e: TouchEvent) => {
      swipeHandlers.onTouchStart(e)
      longPressHandlers.onTouchStart(e)
      tapHandlers.onTouchStart(e)
    },
    onTouchMove: (e: TouchEvent) => {
      longPressHandlers.onTouchMove(e)
    },
    onTouchEnd: (e: TouchEvent) => {
      swipeHandlers.onTouchEnd(e)
      longPressHandlers.onTouchEnd()
      tapHandlers.onTouchEnd(e)
    },
    onMouseDown: (e: MouseEvent) => {
      longPressHandlers.onMouseDown(e)
      tapHandlers.onMouseDown(e)
    },
    onMouseMove: (e: MouseEvent) => {
      longPressHandlers.onMouseMove(e)
    },
    onMouseUp: (e: MouseEvent) => {
      longPressHandlers.onMouseUp()
      tapHandlers.onMouseUp(e)
    },
    onMouseLeave: (e: MouseEvent) => {
      longPressHandlers.onMouseLeave()
    },
  }), [swipeHandlers, longPressHandlers, tapHandlers])
}
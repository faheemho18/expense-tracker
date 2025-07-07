/**
 * Touch interaction utilities for enhanced mobile experience
 * Provides helper functions for touch events, gestures, and mobile optimizations
 */

export interface TouchEventInfo {
  touches: TouchPoint[]
  changedTouches: TouchPoint[]
  event: TouchEvent
  timestamp: number
}

export interface TouchPoint {
  x: number
  y: number
  id: number
  force?: number
}

export interface SwipeResult {
  direction: 'left' | 'right' | 'up' | 'down'
  distance: number
  velocity: number
  duration: number
}

export interface PinchResult {
  scale: number
  center: { x: number; y: number }
  distance: number
}

/**
 * Touch device detection utilities
 */
export const TouchDetection = {
  /**
   * Check if device supports touch
   */
  isTouch(): boolean {
    if (typeof window === 'undefined') return false
    
    return (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      // @ts-ignore - Legacy support
      navigator.msMaxTouchPoints > 0
    )
  },

  /**
   * Check if device is likely mobile (combines touch + viewport width)
   */
  isMobile(): boolean {
    if (typeof window === 'undefined') return false
    
    return this.isTouch() && window.innerWidth < 768
  },

  /**
   * Check if device supports hover (non-touch or hybrid)
   */
  supportsHover(): boolean {
    if (typeof window === 'undefined') return true
    
    return window.matchMedia('(hover: hover)').matches
  },

  /**
   * Check if device supports fine pointer (mouse/stylus)
   */
  hasFinePointer(): boolean {
    if (typeof window === 'undefined') return true
    
    return window.matchMedia('(pointer: fine)').matches
  },
}

/**
 * Touch event utilities
 */
export const TouchEvents = {
  /**
   * Extract touch points from touch event
   */
  getTouchPoints(e: TouchEvent): TouchPoint[] {
    return Array.from(e.touches).map(touch => ({
      x: touch.clientX,
      y: touch.clientY,
      id: touch.identifier,
      force: touch.force,
    }))
  },

  /**
   * Get center point of multiple touches
   */
  getCenter(touches: TouchPoint[]): { x: number; y: number } {
    if (touches.length === 0) return { x: 0, y: 0 }
    
    const centerX = touches.reduce((sum, touch) => sum + touch.x, 0) / touches.length
    const centerY = touches.reduce((sum, touch) => sum + touch.y, 0) / touches.length
    
    return { x: centerX, y: centerY }
  },

  /**
   * Calculate distance between two touch points
   */
  getDistance(point1: TouchPoint, point2: TouchPoint): number {
    return Math.sqrt(
      Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2)
    )
  },

  /**
   * Calculate distance between all touches (for pinch detection)
   */
  getTouchDistance(touches: TouchPoint[]): number {
    if (touches.length < 2) return 0
    return this.getDistance(touches[0], touches[1])
  },

  /**
   * Calculate angle between two points (in degrees)
   */
  getAngle(point1: TouchPoint, point2: TouchPoint): number {
    const deltaX = point2.x - point1.x
    const deltaY = point2.y - point1.y
    return Math.atan2(deltaY, deltaX) * (180 / Math.PI)
  },

  /**
   * Get relative position within element
   */
  getRelativePosition(
    touch: TouchPoint, 
    element: HTMLElement
  ): { x: number; y: number } {
    const rect = element.getBoundingClientRect()
    return {
      x: touch.x - rect.left,
      y: touch.y - rect.top,
    }
  },

  /**
   * Prevent default touch behaviors (zoom, scroll, etc.)
   */
  preventDefaults(e: TouchEvent): void {
    e.preventDefault()
    e.stopPropagation()
  },

  /**
   * Safe way to prevent defaults with passive listener support
   */
  tryPreventDefaults(e: TouchEvent): void {
    try {
      e.preventDefault()
    } catch (err) {
      // Ignore errors in passive listeners
      console.warn('Cannot prevent default in passive listener')
    }
  },
}

/**
 * Gesture recognition utilities
 */
export const GestureRecognition = {
  /**
   * Detect swipe gesture from start and end points
   */
  detectSwipe(
    startPoint: TouchPoint,
    endPoint: TouchPoint,
    startTime: number,
    endTime: number,
    minDistance: number = 50,
    minVelocity: number = 0.5
  ): SwipeResult | null {
    const deltaX = endPoint.x - startPoint.x
    const deltaY = endPoint.y - startPoint.y
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    const duration = endTime - startTime
    const velocity = duration > 0 ? distance / duration : 0

    if (distance < minDistance || velocity < minVelocity) {
      return null
    }

    let direction: SwipeResult['direction']
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      direction = deltaX > 0 ? 'right' : 'left'
    } else {
      direction = deltaY > 0 ? 'down' : 'up'
    }

    return {
      direction,
      distance,
      velocity,
      duration,
    }
  },

  /**
   * Detect pinch gesture from touch points
   */
  detectPinch(
    currentTouches: TouchPoint[],
    initialDistance: number
  ): PinchResult | null {
    if (currentTouches.length < 2) return null

    const distance = TouchEvents.getTouchDistance(currentTouches)
    const center = TouchEvents.getCenter(currentTouches)
    const scale = initialDistance > 0 ? distance / initialDistance : 1

    return {
      scale,
      center,
      distance,
    }
  },

  /**
   * Detect long press gesture
   */
  isLongPress(
    startTime: number,
    currentTime: number,
    threshold: number = 500
  ): boolean {
    return currentTime - startTime >= threshold
  },
}

/**
 * Touch-friendly UI optimizations
 */
export const TouchOptimizations = {
  /**
   * Minimum touch target size (44px recommended by Apple/Google)
   */
  MIN_TOUCH_TARGET: 44,

  /**
   * Check if element meets minimum touch target size
   */
  hasValidTouchTarget(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect()
    return rect.width >= this.MIN_TOUCH_TARGET && rect.height >= this.MIN_TOUCH_TARGET
  },

  /**
   * Add touch-friendly styles to element
   */
  applyTouchStyles(element: HTMLElement): void {
    const style = element.style
    
    // Ensure minimum touch target
    style.minWidth = `${this.MIN_TOUCH_TARGET}px`
    style.minHeight = `${this.MIN_TOUCH_TARGET}px`
    
    // Improve touch responsiveness
    style.touchAction = 'manipulation'
    style.userSelect = 'none'
    ;(style as any).webkitTapHighlightColor = 'transparent'
    
    // Better touch feedback
    style.cursor = 'pointer'
  },

  /**
   * Create touch-friendly tooltip positioning
   */
  getTouchTooltipPosition(
    element: HTMLElement,
    touch: TouchPoint,
    tooltipWidth: number,
    tooltipHeight: number
  ): { x: number; y: number } {
    const rect = element.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    
    // Offset tooltip above finger to avoid occlusion
    const fingerOffset = 60
    
    let x = touch.x - tooltipWidth / 2
    let y = touch.y - tooltipHeight - fingerOffset
    
    // Ensure tooltip stays within viewport
    x = Math.max(10, Math.min(x, viewportWidth - tooltipWidth - 10))
    y = Math.max(10, Math.min(y, viewportHeight - tooltipHeight - 10))
    
    // If tooltip would be above viewport, place it below finger
    if (y < 10) {
      y = touch.y + fingerOffset
    }
    
    return { x, y }
  },

  /**
   * Debounce touch events to prevent excessive firing
   */
  debounceTouchEvent<T extends (...args: any[]) => void>(
    func: T,
    delay: number = 16
  ): T {
    let timeoutId: NodeJS.Timeout
    
    return ((...args: Parameters<T>) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => func(...args), delay)
    }) as T
  },

  /**
   * Throttle touch events for performance
   */
  throttleTouchEvent<T extends (...args: any[]) => void>(
    func: T,
    limit: number = 16
  ): T {
    let inThrottle: boolean
    
    return ((...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }) as T
  },
}

/**
 * Chart-specific touch utilities
 */
export const ChartTouchUtils = {
  /**
   * Convert touch position to chart data coordinates
   */
  touchToChartCoords(
    touch: TouchPoint,
    chartElement: HTMLElement,
    dataRange: { min: number; max: number },
    axis: 'x' | 'y' = 'x'
  ): number {
    const rect = chartElement.getBoundingClientRect()
    const relativePos = axis === 'x' 
      ? (touch.x - rect.left) / rect.width
      : (touch.y - rect.top) / rect.height
    
    // Clamp to 0-1 range
    const normalizedPos = Math.max(0, Math.min(1, relativePos))
    
    // Convert to data range
    return dataRange.min + (dataRange.max - dataRange.min) * normalizedPos
  },

  /**
   * Find nearest data point to touch position
   */
  findNearestDataPoint<T>(
    touch: TouchPoint,
    dataPoints: T[],
    getX: (item: T) => number,
    getY: (item: T) => number,
    chartElement: HTMLElement
  ): { item: T; distance: number } | null {
    if (!dataPoints.length) return null

    const rect = chartElement.getBoundingClientRect()
    const relativeX = touch.x - rect.left
    const relativeY = touch.y - rect.top

    let nearestItem = dataPoints[0]
    let minDistance = Infinity

    for (const item of dataPoints) {
      const itemX = getX(item)
      const itemY = getY(item)
      
      const distance = Math.sqrt(
        Math.pow(itemX - relativeX, 2) + Math.pow(itemY - relativeY, 2)
      )

      if (distance < minDistance) {
        minDistance = distance
        nearestItem = item
      }
    }

    return { item: nearestItem, distance: minDistance }
  },

  /**
   * Create touch-optimized chart configuration
   */
  getTouchChartConfig(isMobile: boolean, isTouch: boolean) {
    return {
      // Larger touch targets for mobile
      strokeWidth: isMobile ? 3 : 2,
      dotRadius: isMobile ? 6 : 4,
      
      // Enhanced tooltips for touch
      tooltip: {
        trigger: isTouch ? 'none' : 'hover', // Manual control for touch
        offset: isMobile ? 10 : 5,
        followCursor: !isTouch,
      },
      
      // Touch-friendly interactions
      interactions: {
        enabled: isTouch,
        longPressDelay: 500,
        doubleTapDelay: 300,
      },
      
      // Animation adjustments for touch
      animation: {
        duration: isMobile ? 200 : 300, // Faster on mobile
        easing: 'easeOutCubic',
      },
      
      // Legend optimizations
      legend: {
        position: isMobile ? 'bottom' : 'right',
        itemSpacing: isMobile ? 8 : 4,
        fontSize: isMobile ? 12 : 10,
      },
    }
  },
}

/**
 * Accessibility helpers for touch interactions
 */
export const TouchAccessibility = {
  /**
   * Add ARIA attributes for touch interactions
   */
  addTouchAriaAttributes(element: HTMLElement): void {
    element.setAttribute('role', 'button')
    element.setAttribute('tabindex', '0')
    element.setAttribute('aria-label', 'Touch interactive element')
  },

  /**
   * Handle keyboard events as touch equivalents
   */
  handleKeyboardAsTouch(
    e: KeyboardEvent,
    onActivate: () => void
  ): void {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onActivate()
    }
  },

  /**
   * Announce touch interactions to screen readers
   */
  announceTouch(message: string): void {
    const announcer = document.createElement('div')
    announcer.setAttribute('aria-live', 'polite')
    announcer.setAttribute('aria-atomic', 'true')
    announcer.style.position = 'absolute'
    announcer.style.left = '-10000px'
    announcer.textContent = message
    
    document.body.appendChild(announcer)
    
    setTimeout(() => {
      document.body.removeChild(announcer)
    }, 1000)
  },
}

/**
 * Performance optimization for touch events
 */
export const TouchPerformance = {
  /**
   * Request animation frame for smooth touch handling
   */
  requestTouchFrame(callback: () => void): number {
    return requestAnimationFrame(callback)
  },

  /**
   * Use passive listeners where appropriate
   */
  addPassiveListener(
    element: HTMLElement,
    event: string,
    handler: EventListener
  ): void {
    element.addEventListener(event, handler, { passive: true })
  },

  /**
   * Use active listeners for preventDefault
   */
  addActiveListener(
    element: HTMLElement,
    event: string,
    handler: EventListener
  ): void {
    element.addEventListener(event, handler, { passive: false })
  },

  /**
   * Cleanup touch event listeners
   */
  cleanupListeners(
    element: HTMLElement,
    events: string[],
    handler: EventListener
  ): void {
    events.forEach(event => {
      element.removeEventListener(event, handler)
    })
  },
}
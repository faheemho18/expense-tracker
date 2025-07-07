"use client"

import * as React from 'react'
import { useState, useEffect, useRef, RefObject } from 'react'

interface UseLazyChartOptions {
  /**
   * Root margin for intersection observer
   * Default: '50px' (load charts 50px before they come into view)
   */
  rootMargin?: string
  
  /**
   * Threshold for intersection observer  
   * Default: 0.1 (trigger when 10% visible)
   */
  threshold?: number
  
  /**
   * Disable lazy loading (always load immediately)
   * Default: false
   */
  disabled?: boolean
  
  /**
   * Delay before loading after intersection (debounce)
   * Default: 100ms
   */
  loadDelay?: number
}

interface UseLazyChartReturn<T extends HTMLElement> {
  /**
   * Ref to attach to the chart container element
   */
  ref: RefObject<T>
  
  /**
   * Whether the chart should be loaded/rendered
   */
  shouldLoad: boolean
  
  /**
   * Whether the chart is currently visible in viewport
   */
  isVisible: boolean
  
  /**
   * Force load the chart (bypass lazy loading)
   */
  forceLoad: () => void
}

/**
 * Hook for lazy loading charts based on viewport intersection
 * Improves performance by only rendering charts when they're visible or about to be visible
 */
export function useLazyChart<T extends HTMLElement = HTMLDivElement>(
  options: UseLazyChartOptions = {}
): UseLazyChartReturn<T> {
  const {
    rootMargin = '50px',
    threshold = 0.1,
    disabled = false,
    loadDelay = 100,
  } = options

  const ref = useRef<T>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [shouldLoad, setShouldLoad] = useState(disabled)
  const [forceLoaded, setForceLoaded] = useState(false)
  const loadTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    // If disabled, always load
    if (disabled) {
      setShouldLoad(true)
      return
    }

    // If forced to load, don't use intersection observer
    if (forceLoaded) {
      setShouldLoad(true)
      return
    }

    const element = ref.current
    if (!element) return

    // Check if IntersectionObserver is supported
    if (typeof IntersectionObserver === 'undefined') {
      // Fallback for older browsers - load immediately
      setShouldLoad(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const isIntersecting = entry.isIntersecting
          setIsVisible(isIntersecting)

          // Clear existing timeout
          if (loadTimeoutRef.current) {
            clearTimeout(loadTimeoutRef.current)
          }

          if (isIntersecting && !shouldLoad) {
            // Debounce the loading to avoid rapid state changes
            loadTimeoutRef.current = setTimeout(() => {
              setShouldLoad(true)
            }, loadDelay)
          }
        })
      },
      {
        rootMargin,
        threshold,
      }
    )

    observer.observe(element)

    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current)
      }
      observer.unobserve(element)
    }
  }, [disabled, forceLoaded, rootMargin, threshold, loadDelay, shouldLoad])

  const forceLoad = () => {
    setForceLoaded(true)
    setShouldLoad(true)
  }

  return {
    ref,
    shouldLoad,
    isVisible,
    forceLoad,
  }
}

/**
 * Performance-aware chart lazy loading with additional optimizations
 */
export function usePerformanceLazyChart<T extends HTMLElement = HTMLDivElement>(
  options: UseLazyChartOptions & {
    /**
     * Reduce load priority on mobile devices
     * Default: true
     */
    deprioritizeMobile?: boolean
    
    /**
     * Check for prefers-reduced-motion
     * Default: true
     */
    respectReducedMotion?: boolean
    
    /**
     * Check device memory constraints
     * Default: true
     */
    respectLowMemory?: boolean
  } = {}
): UseLazyChartReturn<T> {
  const {
    deprioritizeMobile = true,
    respectReducedMotion = true,
    respectLowMemory = true,
    loadDelay = 100,
    ...lazyOptions
  } = options

  // Detect performance constraints
  const [performanceConstraints, setPerformanceConstraints] = useState({
    isMobile: false,
    prefersReducedMotion: false,
    isLowMemory: false,
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const constraints = {
      isMobile: window.innerWidth < 768,
      prefersReducedMotion: respectReducedMotion 
        ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
        : false,
      isLowMemory: respectLowMemory 
        ? checkLowMemoryDevice()
        : false,
    }

    setPerformanceConstraints(constraints)
  }, [respectReducedMotion, respectLowMemory])

  // Adjust load delay based on performance constraints
  const adjustedLoadDelay = React.useMemo(() => {
    let delay = loadDelay

    if (deprioritizeMobile && performanceConstraints.isMobile) {
      delay += 200 // Add 200ms delay on mobile
    }

    if (performanceConstraints.prefersReducedMotion) {
      delay += 100 // Add 100ms for reduced motion preference
    }

    if (performanceConstraints.isLowMemory) {
      delay += 300 // Add 300ms for low memory devices
    }

    return delay
  }, [loadDelay, deprioritizeMobile, performanceConstraints])

  // Adjust root margin to be more conservative on constrained devices
  const adjustedRootMargin = React.useMemo(() => {
    if (performanceConstraints.isMobile || performanceConstraints.isLowMemory) {
      return '20px' // Smaller margin for mobile/low memory
    }
    return lazyOptions.rootMargin || '50px'
  }, [lazyOptions.rootMargin, performanceConstraints])

  return useLazyChart<T>({
    ...lazyOptions,
    rootMargin: adjustedRootMargin,
    loadDelay: adjustedLoadDelay,
  })
}

/**
 * Check if device has memory constraints
 */
function checkLowMemoryDevice(): boolean {
  if (typeof navigator === 'undefined') return false

  // Check device memory API (experimental)
  // @ts-ignore - Non-standard API
  const memory = navigator.deviceMemory
  if (memory && memory < 4) return true

  // Check connection speed as proxy for device capability
  // @ts-ignore - Non-standard API  
  const connection = navigator.connection
  if (connection?.effectiveType && ['slow-2g', '2g'].includes(connection.effectiveType)) {
    return true
  }

  return false
}

/**
 * Hook specifically for chart widgets with additional optimizations
 */
export function useChartWidgetLazyLoad<T extends HTMLElement = HTMLDivElement>(
  priority: 'high' | 'medium' | 'low' = 'medium'
): UseLazyChartReturn<T> {
  const priorityConfig = {
    high: {
      rootMargin: '100px',
      threshold: 0.05,
      loadDelay: 50,
      deprioritizeMobile: false,
    },
    medium: {
      rootMargin: '50px', 
      threshold: 0.1,
      loadDelay: 100,
      deprioritizeMobile: true,
    },
    low: {
      rootMargin: '20px',
      threshold: 0.2,
      loadDelay: 200,
      deprioritizeMobile: true,
    },
  }

  return usePerformanceLazyChart<T>(priorityConfig[priority])
}
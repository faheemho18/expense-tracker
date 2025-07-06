"use client"

import { useState, useEffect } from 'react'

export type ViewportType = 'mobile' | 'tablet' | 'desktop'

export interface ViewportInfo {
  type: ViewportType
  width: number
  height: number
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isTouchDevice: boolean
}

const BREAKPOINTS = {
  mobile: 640,   // sm breakpoint
  tablet: 1024,  // lg breakpoint
} as const

/**
 * Hook to detect viewport type and provide responsive information
 * for chart rendering and layout decisions
 */
export function useViewport(): ViewportInfo {
  const [viewport, setViewport] = useState<ViewportInfo>(() => {
    // Initialize with safe defaults for SSR
    if (typeof window === 'undefined') {
      return {
        type: 'desktop',
        width: 1024,
        height: 768,
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isTouchDevice: false,
      }
    }

    const width = window.innerWidth
    const height = window.innerHeight
    const type = getViewportType(width)
    
    return {
      type,
      width,
      height,
      isMobile: type === 'mobile',
      isTablet: type === 'tablet',
      isDesktop: type === 'desktop',
      isTouchDevice: detectTouchDevice(),
    }
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const updateViewport = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      const type = getViewportType(width)
      
      setViewport({
        type,
        width,
        height,
        isMobile: type === 'mobile',
        isTablet: type === 'tablet',
        isDesktop: type === 'desktop',
        isTouchDevice: detectTouchDevice(),
      })
    }

    // Initial update
    updateViewport()

    // Listen for resize events
    window.addEventListener('resize', updateViewport)
    
    // Listen for orientation changes on mobile devices
    window.addEventListener('orientationchange', () => {
      // Delay to ensure new dimensions are available
      setTimeout(updateViewport, 100)
    })

    return () => {
      window.removeEventListener('resize', updateViewport)
      window.removeEventListener('orientationchange', updateViewport)
    }
  }, [])

  return viewport
}

/**
 * Determine viewport type based on width
 */
function getViewportType(width: number): ViewportType {
  if (width < BREAKPOINTS.mobile) {
    return 'mobile'
  } else if (width < BREAKPOINTS.tablet) {
    return 'tablet'
  } else {
    return 'desktop'
  }
}

/**
 * Detect if the device supports touch
 */
function detectTouchDevice(): boolean {
  if (typeof window === 'undefined') return false
  
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-ignore - Legacy support
    navigator.msMaxTouchPoints > 0
  )
}

/**
 * Get responsive chart configuration based on viewport
 */
export function getResponsiveChartConfig(viewport: ViewportInfo) {
  const { type, width } = viewport

  const baseConfig = {
    // Common responsive settings
    margin: type === 'mobile' 
      ? { top: 10, right: 10, bottom: 20, left: 10 }
      : type === 'tablet'
      ? { top: 15, right: 15, bottom: 25, left: 15 }
      : { top: 20, right: 20, bottom: 30, left: 20 },
    
    fontSize: type === 'mobile' ? 10 : type === 'tablet' ? 12 : 14,
    
    // Legend positioning
    legendPosition: type === 'mobile' ? 'bottom' : 'right',
    
    // Tooltip settings
    tooltipOffset: type === 'mobile' ? 5 : 10,
    
    // Interactive elements
    strokeWidth: type === 'mobile' ? 1.5 : 2,
    
    // Data simplification for mobile
    maxDataPoints: type === 'mobile' ? 20 : type === 'tablet' ? 50 : 100,
    
    // Animation settings
    animationDuration: type === 'mobile' ? 300 : 500,
    
    // Chart specific heights
    pieChartRadius: type === 'mobile' 
      ? Math.min(width * 0.25, 80) 
      : type === 'tablet' 
      ? Math.min(width * 0.2, 120) 
      : 140,
    
    barChartHeight: type === 'mobile' ? 200 : type === 'tablet' ? 250 : 300,
    
    // Grid and axis settings
    showGrid: type !== 'mobile', // Hide grid on mobile for cleaner look
    showAxis: true,
    axisTickCount: type === 'mobile' ? 3 : type === 'tablet' ? 5 : 7,
  }

  return baseConfig
}
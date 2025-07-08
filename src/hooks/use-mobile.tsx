"use client"

import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const checkIsMobile = () => {
      return window.innerWidth < MOBILE_BREAKPOINT
    }

    // Set initial state immediately on client
    setIsMobile(checkIsMobile())

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(checkIsMobile())
    }
    
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  // Return false during SSR to prevent hydration mismatch
  // Return undefined during initial client render to show loading
  return isMobile
}

export function useViewportSize() {
  const [viewportSize, setViewportSize] = React.useState({
    width: 0,
    height: 0,
  })

  React.useEffect(() => {
    function handleResize() {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return viewportSize
}

export function useHapticFeedback() {
  const vibrate = React.useCallback((pattern: number | number[] = 10) => {
    if ('navigator' in window && 'vibrate' in navigator) {
      navigator.vibrate(pattern)
    }
  }, [])

  const isSupported = React.useMemo(() => {
    return typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator
  }, [])

  return { vibrate, isSupported }
}
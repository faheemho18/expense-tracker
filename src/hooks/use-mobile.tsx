"use client"

import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(false)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

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
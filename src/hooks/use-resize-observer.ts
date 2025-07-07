"use client"

import { useEffect, useRef, useState } from "react"

export interface ResizeObserverEntry {
  readonly borderBoxSize: ReadonlyArray<ResizeObserverSize>
  readonly contentBoxSize: ReadonlyArray<ResizeObserverSize>
  readonly contentRect: DOMRectReadOnly
  readonly devicePixelContentBoxSize?: ReadonlyArray<ResizeObserverSize>
  readonly target: Element
}

export interface ResizeObserverSize {
  readonly blockSize: number
  readonly inlineSize: number
}

export interface UseResizeObserverOptions {
  /**
   * The box model to observe. Defaults to 'content-box'.
   */
  box?: ResizeObserverBoxOptions
  /**
   * Debounce delay in milliseconds. Defaults to 0 (no debounce).
   */
  debounceMs?: number
  /**
   * Whether to trigger on mount. Defaults to true.
   */
  triggerOnMount?: boolean
}

export interface ResizeObserverResult {
  width: number
  height: number
  entry?: ResizeObserverEntry
}

/**
 * Custom hook that observes resize events on a DOM element using ResizeObserver.
 * Provides width, height, and the full ResizeObserverEntry for advanced use cases.
 * 
 * @param options Configuration options for the observer
 * @returns Object containing ref to attach to element and size information
 */
export function useResizeObserver<T extends HTMLElement = HTMLElement>(
  options: UseResizeObserverOptions = {}
) {
  const { box = "content-box", debounceMs = 0, triggerOnMount = true } = options
  
  const ref = useRef<T>(null)
  const [size, setSize] = useState<ResizeObserverResult>({
    width: 0,
    height: 0,
  })
  
  const debounceTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const updateSize = (entries: ResizeObserverEntry[]) => {
      const entry = entries[0]
      if (!entry) return

      const updateSizeState = () => {
        let width: number
        let height: number

        if (box === "border-box") {
          width = entry.borderBoxSize[0]?.inlineSize ?? element.offsetWidth
          height = entry.borderBoxSize[0]?.blockSize ?? element.offsetHeight
        } else if (box === "device-pixel-content-box") {
          width = entry.devicePixelContentBoxSize?.[0]?.inlineSize ?? element.offsetWidth
          height = entry.devicePixelContentBoxSize?.[0]?.blockSize ?? element.offsetHeight
        } else {
          // content-box (default)
          width = entry.contentBoxSize[0]?.inlineSize ?? element.clientWidth
          height = entry.contentBoxSize[0]?.blockSize ?? element.clientHeight
        }

        setSize({ width, height, entry })
      }

      if (debounceMs > 0) {
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current)
        }
        debounceTimeoutRef.current = setTimeout(updateSizeState, debounceMs)
      } else {
        updateSizeState()
      }
    }

    // Create ResizeObserver
    const observer = new ResizeObserver(updateSize)
    observer.observe(element, { box })

    // Trigger initial measurement if requested
    if (triggerOnMount) {
      const rect = element.getBoundingClientRect()
      setSize({
        width: box === "border-box" ? element.offsetWidth : element.clientWidth,
        height: box === "border-box" ? element.offsetHeight : element.clientHeight,
      })
    }

    return () => {
      observer.disconnect()
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [box, debounceMs, triggerOnMount])

  return { ref, ...size }
}

/**
 * Simplified hook that only returns width and height as numbers.
 * Useful for cases where you only need dimensions without the full entry.
 */
export function useElementSize<T extends HTMLElement = HTMLElement>(
  options: UseResizeObserverOptions = {}
): { ref: React.RefObject<T>; width: number; height: number } {
  const { ref, width, height } = useResizeObserver<T>(options)
  return { ref, width, height }
}

/**
 * Hook that provides responsive breakpoint information based on element width.
 * Useful for implementing container queries.
 */
export function useResponsiveBreakpoints<T extends HTMLElement = HTMLElement>(
  breakpoints: Record<string, number> = {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
  }
) {
  const { ref, width } = useResizeObserver<T>({ debounceMs: 100 })
  
  const activeBreakpoints = Object.entries(breakpoints)
    .filter(([, minWidth]) => width >= minWidth)
    .map(([name]) => name)
  
  const currentBreakpoint = activeBreakpoints[activeBreakpoints.length - 1] || 'xs'
  
  const isMobile = width < (breakpoints.md || 768)
  const isTablet = width >= (breakpoints.md || 768) && width < (breakpoints.lg || 1024)
  const isDesktop = width >= (breakpoints.lg || 1024)
  
  return {
    ref,
    width,
    currentBreakpoint,
    activeBreakpoints,
    isMobile,
    isTablet,
    isDesktop,
    breakpoints: Object.fromEntries(
      Object.entries(breakpoints).map(([name, minWidth]) => [
        name,
        width >= minWidth,
      ])
    ),
  }
}
"use client"

import * as React from "react"
import { useIsMobile } from "@/hooks/use-mobile"

// Hook for mobile screen reader support
export function useMobileAccessibility() {
  const isMobile = useIsMobile()
  const [screenReaderActive, setScreenReaderActive] = React.useState(false)
  const [reducedMotion, setReducedMotion] = React.useState(false)
  const [highContrast, setHighContrast] = React.useState(false)

  React.useEffect(() => {
    // Detect accessibility preferences (only in browser)
    const checkAccessibilityPreferences = () => {
      if (typeof window === 'undefined') return
      
      // Check for common screen reader indicators
      const hasScreenReader = 
        'speechSynthesis' in window ||
        window.navigator.userAgent.includes('JAWS') ||
        window.navigator.userAgent.includes('NVDA') ||
        window.navigator.userAgent.includes('VoiceOver') ||
        window.navigator.userAgent.includes('TalkBack')

      setScreenReaderActive(hasScreenReader)
      
      // Check media queries for accessibility preferences
      setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
      setHighContrast(window.matchMedia('(prefers-contrast: high)').matches)
    }

    checkAccessibilityPreferences()
  }, [])

  return {
    isMobile,
    screenReaderActive,
    shouldUseReducedMotion: reducedMotion,
    shouldUseHighContrast: highContrast,
  }
}

// Hook for mobile-specific announcements
export function useMobileAnnouncements() {
  const [announcements, setAnnouncements] = React.useState<string[]>([])
  const { isMobile, screenReaderActive } = useMobileAccessibility()

  const announce = React.useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!isMobile || !screenReaderActive || typeof document === 'undefined') return

    // Add announcement to state for screen reader
    setAnnouncements(prev => [...prev, message])

    // Use live region for immediate announcement
    const liveRegion = document.createElement('div')
    liveRegion.setAttribute('aria-live', priority)
    liveRegion.setAttribute('aria-atomic', 'true')
    liveRegion.className = 'sr-only'
    liveRegion.textContent = message

    document.body.appendChild(liveRegion)

    // Clean up after announcement
    setTimeout(() => {
      if (document.body.contains(liveRegion)) {
        document.body.removeChild(liveRegion)
      }
      setAnnouncements(prev => prev.filter(a => a !== message))
    }, 1000)
  }, [isMobile, screenReaderActive])

  return { announce, announcements }
}

// Component for mobile-specific screen reader content
interface MobileScreenReaderProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function MobileScreenReader({ children, fallback }: MobileScreenReaderProps) {
  const { isMobile, screenReaderActive } = useMobileAccessibility()

  if (!isMobile || !screenReaderActive) {
    return fallback ? <>{fallback}</> : null
  }

  return (
    <div className="sr-only" aria-live="polite">
      {children}
    </div>
  )
}

// Component for mobile-friendly focus indicators
interface MobileFocusProps {
  children: React.ReactNode
  className?: string
}

export function MobileFocus({ children, className = "" }: MobileFocusProps) {
  const { isMobile } = useMobileAccessibility()

  const mobileClasses = isMobile 
    ? "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    : "focus:ring-2 focus:ring-primary focus:ring-offset-2"

  return (
    <div className={`${mobileClasses} ${className}`}>
      {children}
    </div>
  )
}

// Hook for mobile touch accessibility
export function useMobileTouchAccessibility() {
  const { isMobile } = useMobileAccessibility()
  const [touchDevice, setTouchDevice] = React.useState(false)

  React.useEffect(() => {
    const checkTouchSupport = () => {
      if (typeof window === 'undefined') return
      
      setTouchDevice(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        (navigator as any).msMaxTouchPoints > 0
      )
    }

    checkTouchSupport()
  }, [])

  const getTouchProps = React.useCallback((element: 'button' | 'link' | 'input' = 'button') => {
    if (!isMobile || !touchDevice) return {}

    const baseProps = {
      'aria-describedby': 'touch-instructions',
      'data-touch-target': 'true',
    }

    switch (element) {
      case 'button':
        return {
          ...baseProps,
          'aria-label': 'Tap to activate',
          role: 'button',
          tabIndex: 0,
        }
      case 'link':
        return {
          ...baseProps,
          'aria-label': 'Tap to navigate',
          role: 'link',
          tabIndex: 0,
        }
      case 'input':
        return {
          ...baseProps,
          'aria-label': 'Tap to focus',
          role: 'textbox',
          tabIndex: 0,
        }
      default:
        return baseProps
    }
  }, [isMobile, touchDevice])

  return {
    isMobile,
    touchDevice,
    getTouchProps,
  }
}

// Component for mobile accessibility instructions
export function MobileAccessibilityInstructions() {
  const { isMobile, screenReaderActive } = useMobileAccessibility()

  if (!isMobile || !screenReaderActive) return null

  return (
    <div id="touch-instructions" className="sr-only">
      <h2>Touch Interface Instructions</h2>
      <ul>
        <li>Tap once to select and activate buttons</li>
        <li>Swipe left or right to navigate between elements</li>
        <li>Double-tap to activate links and buttons</li>
        <li>Use explore by touch to navigate content</li>
        <li>Long press for context menus</li>
        <li>Swipe up or down to scroll content</li>
      </ul>
    </div>
  )
}

// Component for mobile-friendly skip links
export function MobileSkipLinks() {
  const { isMobile } = useMobileAccessibility()

  if (isMobile === false) return null

  return (
    <div className="sr-only focus-within:not-sr-only">
      <a
        href="#main-content"
        className="fixed top-4 left-4 z-50 bg-primary text-primary-foreground px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-foreground"
      >
        Skip to main content
      </a>
      <a
        href="#navigation"
        className="fixed top-4 left-24 z-50 bg-primary text-primary-foreground px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-foreground"
      >
        Skip to navigation
      </a>
    </div>
  )
}

// Hook for mobile keyboard navigation
export function useMobileKeyboardNavigation() {
  const { isMobile } = useMobileAccessibility()
  const [keyboardVisible, setKeyboardVisible] = React.useState(false)

  React.useEffect(() => {
    if (isMobile === false || typeof document === 'undefined') return

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        setKeyboardVisible(true)
      }
    }

    const handleFocusOut = (e: FocusEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        setKeyboardVisible(false)
      }
    }

    document.addEventListener('focusin', handleFocusIn)
    document.addEventListener('focusout', handleFocusOut)

    return () => {
      document.removeEventListener('focusin', handleFocusIn)
      document.removeEventListener('focusout', handleFocusOut)
    }
  }, [isMobile])

  return { keyboardVisible }
}

// Component for mobile-friendly form labels
interface MobileFormLabelProps {
  htmlFor: string
  children: React.ReactNode
  required?: boolean
  className?: string
}

export function MobileFormLabel({ htmlFor, children, required, className = "" }: MobileFormLabelProps) {
  const { isMobile } = useMobileAccessibility()

  return (
    <label
      htmlFor={htmlFor}
      className={`${isMobile ? 'mobile-label' : 'text-sm font-medium'} ${className}`}
    >
      {children}
      {required && (
        <span className="text-destructive ml-1" aria-label="required">
          *
        </span>
      )}
    </label>
  )
}
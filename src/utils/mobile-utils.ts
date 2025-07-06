/**
 * Mobile-specific utility functions and constants
 */

// Touch target constants
export const TOUCH_TARGET_SIZE = {
  MINIMUM: 44, // Minimum recommended touch target size in pixels
  COMFORTABLE: 48, // Comfortable touch target size
  LARGE: 56, // Large touch target size for primary actions
} as const

// Touch gesture detection
export function detectTouchDevice(): boolean {
  if (typeof window === 'undefined') return false
  
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-ignore - Legacy support
    navigator.msMaxTouchPoints > 0
  )
}

// Check if device supports haptic feedback
export function supportsHapticFeedback(): boolean {
  if (typeof window === 'undefined') return false
  return 'navigator' in window && 'vibrate' in navigator
}

// Touch-friendly spacing utilities
export const MOBILE_SPACING = {
  TOUCH_TARGET_PADDING: 'p-3', // Extra padding for touch targets
  CARD_PADDING: 'p-4 sm:p-6', // Responsive card padding
  FORM_SPACING: 'space-y-4', // Form element spacing
  BUTTON_SPACING: 'gap-3', // Button group spacing
} as const

// Mobile-first responsive breakpoints
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
} as const

// Touch gesture configuration
export const GESTURE_CONFIG = {
  SWIPE_THRESHOLD: 50, // Minimum distance for swipe recognition
  SWIPE_VELOCITY: 0.3, // Minimum velocity for swipe
  LONG_PRESS_DURATION: 500, // Long press duration in ms
  TAP_TOLERANCE: 10, // Maximum movement for tap recognition
} as const

// CSS classes for touch optimization
export const TOUCH_CLASSES = {
  // Touch action classes
  TOUCH_PAN_X: 'touch-pan-x',
  TOUCH_PAN_Y: 'touch-pan-y',
  TOUCH_MANIPULATION: 'touch-manipulation',
  TOUCH_NONE: 'touch-none',
  
  // Touch target classes
  TOUCH_TARGET: 'min-h-[44px] min-w-[44px]',
  TOUCH_TARGET_LARGE: 'min-h-[48px] min-w-[48px]',
  
  // Mobile-friendly scrolling
  SMOOTH_SCROLL: 'scroll-smooth',
  HIDE_SCROLLBAR: 'scrollbar-hide',
  
  // Touch feedback
  TOUCH_FEEDBACK: 'active:scale-95 transition-transform duration-100',
  TOUCH_HIGHLIGHT: 'select-none touch-manipulation',
} as const

// Viewport meta tag configuration
export const VIEWPORT_CONFIG = {
  content: 'width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes',
  'theme-color': '#000000',
  'color-scheme': 'light dark',
} as const

// Performance optimization for mobile
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false
  
  const userAgent = navigator.userAgent.toLowerCase()
  const mobileKeywords = [
    'android', 'webos', 'iphone', 'ipad', 'ipod', 
    'blackberry', 'windows phone', 'opera mini'
  ]
  
  return mobileKeywords.some(keyword => userAgent.includes(keyword))
}

// Screen size detection
export function getScreenSize(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop'
  
  const width = window.innerWidth
  
  if (width < BREAKPOINTS.MD) return 'mobile'
  if (width < BREAKPOINTS.LG) return 'tablet'
  return 'desktop'
}

// Touch event helpers
export function preventDefault(e: Event): void {
  e.preventDefault()
}

export function stopPropagation(e: Event): void {
  e.stopPropagation()
}

// Mobile-specific focus management
export function handleMobileFocus(element: HTMLElement): void {
  // Scroll element into view on mobile when focused
  if (isMobileDevice()) {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })
  }
}
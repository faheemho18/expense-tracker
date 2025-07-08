"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useTouchGestures } from "@/hooks/use-touch-gestures"
import { useHapticFeedback } from "@/hooks/use-mobile"

interface MobileShortcutsProps {
  children: React.ReactNode
}

export function MobileShortcuts({ children }: MobileShortcutsProps) {
  const router = useRouter()
  const { triggerHaptic } = useHapticFeedback()
  const [gestureActive, setGestureActive] = React.useState(false)

  const gestureHandlers = useTouchGestures({
    onSwipe: (gesture) => {
      // Three-finger swipe shortcuts
      if (gesture.direction === 'up' && gesture.distance > 100) {
        triggerHaptic('light')
        // Scroll to top shortcut
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else if (gesture.direction === 'down' && gesture.distance > 100) {
        triggerHaptic('light')
        // Scroll to bottom shortcut
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
      }
    },
    onDoubleTap: () => {
      // Double tap to go back
      triggerHaptic('medium')
      if (window.history.length > 1) {
        router.back()
      }
    },
    onLongPress: () => {
      // Long press for quick actions menu
      triggerHaptic('heavy')
      setGestureActive(true)
      
      // Show quick actions (could be expanded)
      const quickActions = [
        { name: 'Add Expense', action: () => router.push('/?add=true') },
        { name: 'Dashboard', action: () => router.push('/dashboard') },
        { name: 'Settings', action: () => router.push('/settings') },
      ]
      
      // Simple alert for now - could be replaced with proper modal
      const action = window.confirm('Quick Actions:\n1. Add Expense\n2. Dashboard\n3. Settings\n\nTap OK for Add Expense')
      if (action) {
        router.push('/?add=true')
      }
      
      setGestureActive(false)
    }
  }, {
    swipeThreshold: 80,
    velocityThreshold: 0.4,
    longPressDelay: 800,
  })

  return (
    <div
      {...gestureHandlers}
      className={`relative ${gestureActive ? 'bg-accent/10' : ''}`}
      style={{ touchAction: 'manipulation' }}
    >
      {children}
    </div>
  )
}

// Hook for keyboard shortcuts on mobile (when external keyboard is connected)
export function useMobileKeyboardShortcuts() {
  const router = useRouter()
  const { triggerHaptic } = useHapticFeedback()

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle shortcuts if we're on mobile with external keyboard
      if (window.innerWidth > 768) return

      // Common mobile shortcuts
      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case 'n':
            e.preventDefault()
            triggerHaptic('light')
            router.push('/?add=true')
            break
          case 'd':
            e.preventDefault()
            triggerHaptic('light')
            router.push('/dashboard')
            break
          case ',':
            e.preventDefault()
            triggerHaptic('light')
            router.push('/settings')
            break
          case 'r':
            e.preventDefault()
            triggerHaptic('light')
            window.location.reload()
            break
          case 'h':
            e.preventDefault()
            triggerHaptic('light')
            router.push('/')
            break
        }
      }

      // Escape key actions
      if (e.key === 'Escape') {
        e.preventDefault()
        triggerHaptic('light')
        
        // Close any open modals or navigate back
        if (window.history.length > 1) {
          router.back()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [router, triggerHaptic])
}

// Component for mobile gesture hints
export function MobileGestureHints() {
  const [showHints, setShowHints] = React.useState(false)

  React.useEffect(() => {
    // Show hints for first-time users
    const hasSeenHints = localStorage.getItem('mobile-gesture-hints-seen')
    if (!hasSeenHints && window.innerWidth <= 768) {
      setShowHints(true)
      localStorage.setItem('mobile-gesture-hints-seen', 'true')
    }
  }, [])

  if (!showHints) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="mx-4 max-w-sm rounded-lg bg-card p-6 shadow-xl">
        <h3 className="mb-4 text-lg font-semibold">Mobile Gestures</h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-primary"></div>
            <span>Double tap to go back</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-primary"></div>
            <span>Long press for quick actions</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-primary"></div>
            <span>Swipe left/right to navigate</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-primary"></div>
            <span>Swipe up/down to scroll</span>
          </div>
        </div>
        <button
          onClick={() => setShowHints(false)}
          className="mt-4 w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Got it!
        </button>
      </div>
    </div>
  )
}
"use client"

import * as React from "react"
import { useRouter, usePathname } from "next/navigation"
import { useSwipeGesture } from "@/hooks/use-touch-gestures"
import { useIsMobile, useHapticFeedback } from "@/hooks/use-mobile"

interface SwipeNavigationProps {
  children: React.ReactNode
}

const routes = [
  { path: "/", name: "Expenses" },
  { path: "/dashboard", name: "Dashboard" },
  { path: "/data", name: "Data" },
  { path: "/themes", name: "Themes" },
  { path: "/settings", name: "Settings" },
]

export function SwipeNavigation({ children }: SwipeNavigationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const isMobile = useIsMobile()
  const { vibrate } = useHapticFeedback()
  
  const currentIndex = React.useMemo(() => {
    return routes.findIndex(route => route.path === pathname)
  }, [pathname])

  const navigateToRoute = React.useCallback((direction: 'left' | 'right') => {
    const newIndex = direction === 'left' 
      ? Math.max(0, currentIndex - 1)
      : Math.min(routes.length - 1, currentIndex + 1)
    
    if (newIndex !== currentIndex) {
      vibrate(50) // Haptic feedback
      router.push(routes[newIndex].path)
    }
  }, [currentIndex, router, vibrate])

  const swipeHandlers = useSwipeGesture(
    (gesture) => {
      if (gesture.direction === 'left') {
        navigateToRoute('right') // Swipe left = go to next route
      } else if (gesture.direction === 'right') {
        navigateToRoute('left') // Swipe right = go to previous route
      }
    },
    {
      swipeThreshold: 100,
      velocityThreshold: 0.3,
    }
  )

  // Only enable swipe navigation on mobile
  if (!isMobile) {
    return <>{children}</>
  }

  return (
    <div
      className="h-full w-full overflow-hidden"
      onTouchStart={(e) => swipeHandlers.onTouchStart(e.nativeEvent)}
      onTouchEnd={(e) => swipeHandlers.onTouchEnd(e.nativeEvent)}
      style={{
        transform: 'translateX(0)',
        transition: 'transform 0.2s ease-out',
      }}
    >
      {/* Swipe indicator for first-time users */}
      {currentIndex > 0 && (
        <div className="absolute left-0 top-1/2 z-10 h-16 w-1 -translate-y-1/2 bg-primary/20 rounded-full" />
      )}
      {currentIndex < routes.length - 1 && (
        <div className="absolute right-0 top-1/2 z-10 h-16 w-1 -translate-y-1/2 bg-primary/20 rounded-full" />
      )}
      
      {children}
    </div>
  )
}
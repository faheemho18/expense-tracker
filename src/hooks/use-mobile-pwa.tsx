"use client"

import * as React from "react"
import { useIsMobile } from "@/hooks/use-mobile"

// Hook for PWA install prompt
export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = React.useState<any>(null)
  const [isInstallable, setIsInstallable] = React.useState(false)
  const [isInstalled, setIsInstalled] = React.useState(false)
  const isMobile = useIsMobile()

  React.useEffect(() => {
    // Check if already installed
    const checkInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true)
      }
    }

    checkInstalled()

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsInstallable(true)
    }

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setIsInstallable(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const installApp = React.useCallback(async () => {
    if (!deferredPrompt) return false

    try {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        setIsInstalled(true)
        setIsInstallable(false)
        setDeferredPrompt(null)
        return true
      }
      return false
    } catch (error) {
      console.error('Error installing PWA:', error)
      return false
    }
  }, [deferredPrompt])

  return {
    isInstallable: isInstallable && isMobile,
    isInstalled,
    installApp,
  }
}

// Hook for mobile-specific offline support
export function useMobileOfflineSupport() {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine)
  const [offlineQueue, setOfflineQueue] = React.useState<any[]>([])
  const isMobile = useIsMobile()

  React.useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      // Process offline queue when coming back online
      if (offlineQueue.length > 0 && isMobile) {
        processOfflineQueue()
      }
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [offlineQueue, isMobile])

  const addToOfflineQueue = React.useCallback((action: any) => {
    if (!isMobile) return
    
    setOfflineQueue(prev => [...prev, {
      ...action,
      timestamp: Date.now(),
      id: Math.random().toString(36).substr(2, 9)
    }])
  }, [isMobile])

  const processOfflineQueue = React.useCallback(async () => {
    if (!isMobile || !isOnline || offlineQueue.length === 0) return

    try {
      // Process actions one by one
      for (const action of offlineQueue) {
        if (action.type === 'api-call' && action.url && action.data) {
          await fetch(action.url, {
            method: action.method || 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...action.headers
            },
            body: JSON.stringify(action.data)
          })
        }
      }
      
      // Clear queue after successful processing
      setOfflineQueue([])
    } catch (error) {
      console.error('Error processing offline queue:', error)
      // Keep queue for retry later
    }
  }, [offlineQueue, isOnline, isMobile])

  return {
    isOnline,
    offlineQueue,
    addToOfflineQueue,
    processOfflineQueue,
  }
}

// Hook for mobile-specific push notifications (future implementation)
export function useMobilePushNotifications() {
  const [permission, setPermission] = React.useState<NotificationPermission>('default')
  const [subscription, setSubscription] = React.useState<PushSubscription | null>(null)
  const isMobile = useIsMobile()

  React.useEffect(() => {
    if (!isMobile || !('Notification' in window)) return

    setPermission(Notification.permission)
  }, [isMobile])

  const requestPermission = React.useCallback(async () => {
    if (!isMobile || !('Notification' in window)) return false

    try {
      const permission = await Notification.requestPermission()
      setPermission(permission)
      return permission === 'granted'
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      return false
    }
  }, [isMobile])

  const subscribeToPush = React.useCallback(async () => {
    if (!isMobile || permission !== 'granted' || !('serviceWorker' in navigator)) {
      return null
    }

    try {
      const registration = await navigator.serviceWorker.ready
      
      // This would need a VAPID public key in production
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: null // Add your VAPID public key here
      })
      
      setSubscription(subscription)
      return subscription
    } catch (error) {
      console.error('Error subscribing to push notifications:', error)
      return null
    }
  }, [permission, isMobile])

  const sendNotification = React.useCallback((title: string, options?: NotificationOptions) => {
    if (!isMobile || permission !== 'granted') return

    new Notification(title, {
      icon: '/icon-192x192.png',
      badge: '/icon-72x72.png',
      ...options
    })
  }, [permission, isMobile])

  return {
    permission,
    subscription,
    requestPermission,
    subscribeToPush,
    sendNotification,
    isSupported: isMobile && 'Notification' in window,
  }
}

// Component for PWA install banner
export function PWAInstallBanner() {
  const { isInstallable, installApp } = usePWAInstall()
  const [dismissed, setDismissed] = React.useState(false)

  React.useEffect(() => {
    const wasDismissed = localStorage.getItem('pwa-install-dismissed')
    if (wasDismissed) {
      setDismissed(true)
    }
  }, [])

  const handleInstall = async () => {
    const success = await installApp()
    if (!success) {
      // Fallback for browsers that don't support prompt
      localStorage.setItem('pwa-install-dismissed', 'true')
      setDismissed(true)
    }
  }

  const handleDismiss = () => {
    localStorage.setItem('pwa-install-dismissed', 'true')
    setDismissed(true)
  }

  if (!isInstallable || dismissed) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 bg-primary text-primary-foreground rounded-lg p-4 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="font-medium mb-1">Install App</h3>
          <p className="text-sm opacity-90">
            Add to your home screen for quick access
          </p>
        </div>
        <div className="flex gap-2 ml-4">
          <button
            onClick={handleDismiss}
            className="px-3 py-1 text-sm bg-primary-foreground/20 rounded-md"
          >
            Not now
          </button>
          <button
            onClick={handleInstall}
            className="px-3 py-1 text-sm bg-primary-foreground text-primary rounded-md font-medium"
          >
            Install
          </button>
        </div>
      </div>
    </div>
  )
}

// Component for offline indicator
export function OfflineIndicator() {
  const { isOnline, offlineQueue } = useMobileOfflineSupport()
  const isMobile = useIsMobile()

  if (!isMobile || isOnline) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-yellow-900 px-4 py-2 text-center text-sm">
      <div className="flex items-center justify-center gap-2">
        <div className="h-2 w-2 bg-yellow-900 rounded-full animate-pulse"></div>
        <span>
          You're offline
          {offlineQueue.length > 0 && ` • ${offlineQueue.length} actions queued`}
        </span>
      </div>
    </div>
  )
}

// Component for notification permission prompt
export function NotificationPrompt() {
  const { permission, requestPermission, isSupported } = useMobilePushNotifications()
  const [dismissed, setDismissed] = React.useState(false)

  React.useEffect(() => {
    const wasDismissed = localStorage.getItem('notification-permission-dismissed')
    if (wasDismissed) {
      setDismissed(true)
    }
  }, [])

  const handleRequest = async () => {
    const granted = await requestPermission()
    if (!granted) {
      localStorage.setItem('notification-permission-dismissed', 'true')
      setDismissed(true)
    }
  }

  const handleDismiss = () => {
    localStorage.setItem('notification-permission-dismissed', 'true')
    setDismissed(true)
  }

  if (!isSupported || permission !== 'default' || dismissed) return null

  return (
    <div className="fixed top-16 left-4 right-4 z-50 bg-card border rounded-lg p-4 shadow-lg">
      <div className="flex items-start gap-3">
        <div className="h-6 w-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
          <div className="h-3 w-3 bg-primary-foreground rounded-full"></div>
        </div>
        <div className="flex-1">
          <h3 className="font-medium mb-1">Stay Updated</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Get notified about important updates and reminders
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleDismiss}
              className="px-3 py-1 text-sm border rounded-md"
            >
              Not now
            </button>
            <button
              onClick={handleRequest}
              className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded-md"
            >
              Allow
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
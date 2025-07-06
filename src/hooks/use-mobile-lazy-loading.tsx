"use client"

import * as React from "react"
import { useIsMobile } from "@/hooks/use-mobile"

interface LazyLoadOptions {
  threshold?: number
  rootMargin?: string
  triggerOnce?: boolean
  mobileOptimized?: boolean
}

export function useLazyLoad(
  options: LazyLoadOptions = {}
): [React.RefObject<HTMLDivElement>, boolean] {
  const {
    threshold = 0.1,
    rootMargin = "50px",
    triggerOnce = true,
    mobileOptimized = true,
  } = options

  const isMobile = useIsMobile()
  const [isInView, setIsInView] = React.useState(false)
  const [hasTriggered, setHasTriggered] = React.useState(false)
  const elementRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const element = elementRef.current
    if (!element) return

    // Mobile-specific optimizations
    const mobileThreshold = isMobile && mobileOptimized ? threshold * 2 : threshold
    const mobileRootMargin = isMobile && mobileOptimized ? "100px" : rootMargin

    const observer = new IntersectionObserver(
      ([entry]) => {
        const inView = entry.isIntersecting
        
        if (inView && (!triggerOnce || !hasTriggered)) {
          setIsInView(true)
          setHasTriggered(true)
        } else if (!triggerOnce && !inView) {
          setIsInView(false)
        }
      },
      {
        threshold: mobileThreshold,
        rootMargin: mobileRootMargin,
      }
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [threshold, rootMargin, triggerOnce, hasTriggered, isMobile, mobileOptimized])

  return [elementRef, isInView]
}

// Component for lazy loading images with mobile optimization
interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string
  alt: string
  placeholder?: string
  className?: string
  mobileOptimized?: boolean
}

export function LazyImage({
  src,
  alt,
  placeholder = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE4IiBmaWxsPSIjYWFhIiBkeT0iLjNlbSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+TG9hZGluZy4uLjwvdGV4dD48L3N2Zz4=",
  className = "",
  mobileOptimized = true,
  ...props
}: LazyImageProps) {
  const [ref, isInView] = useLazyLoad({ mobileOptimized })
  const [isLoaded, setIsLoaded] = React.useState(false)
  const [hasError, setHasError] = React.useState(false)

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      {isInView && (
        <img
          src={isLoaded ? src : placeholder}
          alt={alt}
          className={`transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-70'
          }`}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          {...props}
        />
      )}
      {!isInView && (
        <div className="flex h-full w-full items-center justify-center bg-muted">
          <div className="text-sm text-muted-foreground">Loading...</div>
        </div>
      )}
      {hasError && (
        <div className="flex h-full w-full items-center justify-center bg-muted">
          <div className="text-sm text-muted-foreground">Failed to load</div>
        </div>
      )}
    </div>
  )
}

// Component for lazy loading content with mobile optimization
interface LazyContentProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  className?: string
  mobileOptimized?: boolean
}

export function LazyContent({
  children,
  fallback,
  className = "",
  mobileOptimized = true,
}: LazyContentProps) {
  const [ref, isInView] = useLazyLoad({ mobileOptimized })

  return (
    <div ref={ref} className={className}>
      {isInView ? children : fallback}
    </div>
  )
}

// Hook for mobile-specific image optimization
export function useMobileImageOptimization() {
  const isMobile = useIsMobile()
  
  const getOptimizedImageSrc = React.useCallback((src: string, width?: number, height?: number) => {
    if (!isMobile) return src
    
    // For mobile, prefer smaller images
    const mobileWidth = width ? Math.min(width, 800) : 800
    const mobileHeight = height ? Math.min(height, 600) : undefined
    
    // If using a service like Cloudinary, you could add transformations here
    // For now, just return the original src
    return src
  }, [isMobile])

  const shouldPreload = React.useCallback((priority: 'high' | 'medium' | 'low' = 'medium') => {
    // On mobile, be more conservative with preloading
    if (isMobile) {
      return priority === 'high'
    }
    return priority === 'high' || priority === 'medium'
  }, [isMobile])

  return {
    getOptimizedImageSrc,
    shouldPreload,
    isMobile,
  }
}

// Component for mobile-optimized image lists
interface MobileImageListProps {
  images: Array<{
    src: string
    alt: string
    priority?: 'high' | 'medium' | 'low'
  }>
  className?: string
  itemClassName?: string
}

export function MobileImageList({
  images,
  className = "",
  itemClassName = "",
}: MobileImageListProps) {
  const { getOptimizedImageSrc, shouldPreload } = useMobileImageOptimization()
  
  return (
    <div className={className}>
      {images.map((image, index) => (
        <LazyImage
          key={index}
          src={getOptimizedImageSrc(image.src)}
          alt={image.alt}
          className={itemClassName}
          mobileOptimized={true}
          loading={shouldPreload(image.priority) ? "eager" : "lazy"}
        />
      ))}
    </div>
  )
}
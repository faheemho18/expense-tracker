"use client"

import * as React from "react"
import { X, ZoomIn, ZoomOut, RotateCw, Download } from "lucide-react"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface ImageViewerProps {
  src: string
  alt: string
  trigger?: React.ReactNode
  className?: string
}

export function ImageViewer({ src, alt, trigger, className }: ImageViewerProps) {
  const isMobile = useIsMobile()
  const [isOpen, setIsOpen] = React.useState(false)
  const [scale, setScale] = React.useState(1)
  const [rotation, setRotation] = React.useState(0)
  const [position, setPosition] = React.useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = React.useState(false)
  const [lastTouchDistance, setLastTouchDistance] = React.useState(0)
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0, posX: 0, posY: 0 })
  
  const imageRef = React.useRef<HTMLImageElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const resetImage = () => {
    setScale(1)
    setRotation(0)
    setPosition({ x: 0, y: 0 })
  }

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev * 1.5, 5))
  }

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev / 1.5, 0.5))
  }

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360)
  }

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = src
    link.download = `receipt-${Date.now()}.jpg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Touch/mouse event handlers for panning
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMobile === false) {
      setIsDragging(true)
      setDragStart({
        x: e.clientX,
        y: e.clientY,
        posX: position.x,
        posY: position.y
      })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && !isMobile && scale > 1) {
      const deltaX = e.clientX - dragStart.x
      const deltaY = e.clientY - dragStart.y
      setPosition({
        x: dragStart.posX + deltaX,
        y: dragStart.posY + deltaY
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Touch handlers for mobile pinch-to-zoom and pan
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      // Single touch - start panning
      setIsDragging(true)
      setDragStart({
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        posX: position.x,
        posY: position.y
      })
    } else if (e.touches.length === 2) {
      // Two touches - start pinch-to-zoom
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      )
      setLastTouchDistance(distance)
      setIsDragging(false)
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault()
    
    if (e.touches.length === 1 && isDragging && scale > 1) {
      // Single touch - pan
      const deltaX = e.touches[0].clientX - dragStart.x
      const deltaY = e.touches[0].clientY - dragStart.y
      setPosition({
        x: dragStart.posX + deltaX,
        y: dragStart.posY + deltaY
      })
    } else if (e.touches.length === 2) {
      // Two touches - pinch-to-zoom
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      )
      
      if (lastTouchDistance > 0) {
        const scaleFactor = distance / lastTouchDistance
        setScale(prev => Math.max(0.5, Math.min(5, prev * scaleFactor)))
      }
      
      setLastTouchDistance(distance)
    }
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
    setLastTouchDistance(0)
  }

  // Reset on dialog open/close
  React.useEffect(() => {
    if (isOpen) {
      resetImage()
    }
  }, [isOpen])

  const defaultTrigger = (
    <button
      className={cn(
        "relative overflow-hidden rounded-lg transition-all hover:opacity-80",
        className
      )}
    >
      <img
        src={src}
        alt={alt}
        className="h-full w-full object-cover"
      />
      <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity hover:opacity-100">
        <ZoomIn className="h-6 w-6 text-white" />
      </div>
    </button>
  )

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent 
        className={cn(
          "max-w-full max-h-full p-0 bg-black/95",
          isMobile ? "h-full w-full" : "h-[90vh] w-[90vw]"
        )}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Receipt Image</DialogTitle>
        </DialogHeader>
        
        {/* Controls */}
        <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="icon"
              onClick={handleZoomOut}
              disabled={scale <= 0.5}
              className="h-10 w-10 bg-white/90 text-black hover:bg-white"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              onClick={handleZoomIn}
              disabled={scale >= 5}
              className="h-10 w-10 bg-white/90 text-black hover:bg-white"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              onClick={handleRotate}
              className="h-10 w-10 bg-white/90 text-black hover:bg-white"
            >
              <RotateCw className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              onClick={handleDownload}
              className="h-10 w-10 bg-white/90 text-black hover:bg-white"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
          
          <Button
            variant="secondary"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="h-10 w-10 bg-white/90 text-black hover:bg-white"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Image container */}
        <div
          ref={containerRef}
          className="flex h-full w-full items-center justify-center overflow-hidden"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            cursor: isDragging ? 'grabbing' : scale > 1 ? 'grab' : 'default',
          }}
        >
          <img
            ref={imageRef}
            src={src}
            alt={alt}
            className="max-h-full max-w-full select-none transition-transform duration-100"
            style={{
              transform: `scale(${scale}) rotate(${rotation}deg) translate(${position.x / scale}px, ${position.y / scale}px)`,
              transformOrigin: 'center center',
            }}
            draggable={false}
          />
        </div>

        {/* Instructions for mobile */}
        {isMobile && (
          <div className="absolute bottom-4 left-4 right-4 z-10">
            <div className="rounded-lg bg-black/50 p-3 text-center text-sm text-white">
              <p>Pinch to zoom • Drag to pan • Tap controls to adjust</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
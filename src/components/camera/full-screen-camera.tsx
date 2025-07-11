"use client"

import * as React from "react"
import { Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { cn } from "@/lib/utils"
import { useCameraSelection, type CameraFacing } from "@/hooks/use-camera-selection"
import { useIsMobile, useHapticFeedback } from "@/hooks/use-mobile"
import { CameraControls } from "./camera-controls"
import type { CameraMode, CameraOptions, FlashState } from "@/lib/types"

interface FullScreenCameraProps {
  isOpen: boolean
  onClose: () => void
  onCapture: (imageData: string) => void
  mode?: CameraMode
  options?: CameraOptions
  className?: string
}

export function FullScreenCamera({
  isOpen,
  onClose,
  onCapture,
  mode = "receipt",
  options = {},
  className
}: FullScreenCameraProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const isMobile = useIsMobile()
  const { vibrate } = useHapticFeedback()

  // Camera state
  const {
    stream,
    currentFacing,
    hasPermission,
    isLoading,
    error: cameraError,
    startCamera,
    stopCamera,
    switchCamera
  } = useCameraSelection()

  // Local state
  const [showGrid, setShowGrid] = React.useState(options.showGrid ?? true)
  const [flashState, setFlashState] = React.useState<FlashState>({
    supported: false,
    enabled: false,
    available: false
  })
  const [isCapturing, setIsCapturing] = React.useState(false)

  // Initialize flash support detection
  React.useEffect(() => {
    const checkFlashSupport = async () => {
      try {
        if ('mediaDevices' in navigator && 'getSupportedConstraints' in navigator.mediaDevices) {
          const supportedConstraints = navigator.mediaDevices.getSupportedConstraints()
          const supported = 'torch' in supportedConstraints
          
          setFlashState(prev => ({
            ...prev,
            supported,
            available: supported
          }))
        }
      } catch (error) {
        console.log('Flash support detection failed:', error)
      }
    }

    if (isOpen) {
      checkFlashSupport()
    }
  }, [isOpen])

  // Start camera when component opens
  React.useEffect(() => {
    if (isOpen && !stream) {
      // For receipt mode, default to rear camera
      const defaultFacing: CameraFacing = mode === "receipt" ? "environment" : "user"
      startCamera(defaultFacing)
    }

    if (!isOpen && stream) {
      stopCamera()
    }
  }, [isOpen, stream, startCamera, stopCamera, mode])

  // Set video stream
  React.useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  // Handle flash toggle
  const handleToggleFlash = React.useCallback(async () => {
    if (!stream || !flashState.supported) return

    try {
      const track = stream.getVideoTracks()[0]
      if (!track) return

      const constraints = track.getConstraints()
      const newFlashState = !flashState.enabled

      await track.applyConstraints({
        ...constraints,
        advanced: [{ torch: newFlashState }]
      } as any)

      setFlashState(prev => ({
        ...prev,
        enabled: newFlashState
      }))

      if (isMobile) {
        vibrate(50)
      }
    } catch (error) {
      console.error('Failed to toggle flash:', error)
      // Flash might not be available, update state
      setFlashState(prev => ({
        ...prev,
        available: false
      }))
    }
  }, [stream, flashState.supported, flashState.enabled, isMobile, vibrate])

  // Handle camera switch
  const handleSwitchCamera = React.useCallback(async () => {
    if (isMobile) {
      vibrate(50)
    }
    
    try {
      await switchCamera()
    } catch (error) {
      console.error('Failed to switch camera:', error)
    }
  }, [switchCamera, isMobile, vibrate])

  // Handle capture
  const handleCapture = React.useCallback(() => {
    if (!videoRef.current || !stream || isCapturing) return

    setIsCapturing(true)

    try {
      const video = videoRef.current
      const canvas = canvasRef.current

      const finalCanvas = canvas || document.createElement("canvas")
      finalCanvas.width = video.videoWidth
      finalCanvas.height = video.videoHeight

      const context = finalCanvas.getContext("2d")
      if (!context) {
        throw new Error("Could not get canvas context")
      }

      // Draw video frame to canvas
      context.drawImage(video, 0, 0, finalCanvas.width, finalCanvas.height)

      // Convert to data URL with high quality for OCR
      const dataUrl = finalCanvas.toDataURL("image/jpeg", 0.92)

      // Haptic feedback for successful capture
      if (isMobile) {
        vibrate(100)
      }

      onCapture(dataUrl)
    } catch (error) {
      console.error("Failed to capture image:", error)
    } finally {
      setIsCapturing(false)
    }
  }, [stream, isCapturing, onCapture, isMobile, vibrate])

  // Handle grid toggle
  const handleToggleGrid = React.useCallback(() => {
    setShowGrid(prev => !prev)
    if (isMobile) {
      vibrate(50)
    }
  }, [isMobile, vibrate])

  // Handle close
  const handleClose = React.useCallback(() => {
    if (isMobile) {
      vibrate(50)
    }
    onClose()
  }, [onClose, isMobile, vibrate])

  // Don't render if not open
  if (!isOpen) return null

  return (
    <div className={cn(
      "fixed inset-0 z-[100] bg-black",
      "flex flex-col items-center justify-center",
      className
    )}>
      {/* Hidden canvas for image capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Video Stream */}
      {stream && hasPermission && (
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          muted
          playsInline
        />
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4" />
            <p className="text-lg font-medium">Starting camera...</p>
            <p className="text-sm opacity-80">Please wait</p>
          </div>
        </div>
      )}

      {/* Permission Error */}
      {hasPermission === false && (
        <div className="absolute inset-0 flex items-center justify-center bg-black p-6">
          <Alert variant="destructive" className="max-w-md bg-red-900/80 border-red-700 text-white">
            <AlertTitle className="text-lg font-medium mb-2">
              Camera Access Required
            </AlertTitle>
            <AlertDescription className="text-sm leading-relaxed">
              {cameraError || "Please allow camera access to capture receipts. Check your browser settings and try again."}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Camera Controls */}
      {stream && hasPermission && (
        <CameraControls
          onClose={handleClose}
          flashState={flashState}
          onToggleFlash={handleToggleFlash}
          showGrid={showGrid}
          onToggleGrid={handleToggleGrid}
          currentFacing={currentFacing}
          onSwitchCamera={handleSwitchCamera}
          canSwitchCamera={true}
          isLoading={isLoading || isCapturing}
        />
      )}

      {/* Capture Button */}
      {stream && hasPermission && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-50">
          <Button
            onClick={handleCapture}
            disabled={isLoading || isCapturing}
            className={cn(
              "h-20 w-20 rounded-full",
              "bg-white hover:bg-gray-100",
              "border-4 border-white",
              "shadow-lg shadow-black/30",
              "transition-transform duration-150",
              "active:scale-95",
              isCapturing && "animate-pulse"
            )}
          >
            <Camera className="h-8 w-8 text-black" />
            <span className="sr-only">Take photo</span>
          </Button>
        </div>
      )}

      {/* Mode Indicator */}
      {mode === "receipt" && stream && hasPermission && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-40">
          <div className="bg-black/50 text-white px-4 py-2 rounded-full backdrop-blur-sm">
            <p className="text-sm font-medium">Receipt Mode</p>
          </div>
        </div>
      )}
    </div>
  )
}
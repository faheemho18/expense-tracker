"use client"

import * as React from "react"
import { X, Zap, ZapOff, RotateCcw, Grid3x3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { CameraFacing } from "@/hooks/use-camera-selection"
import type { FlashState } from "@/lib/types"

interface CameraControlsProps {
  // Top controls
  onClose: () => void
  flashState: FlashState
  onToggleFlash: () => void
  showGrid: boolean
  onToggleGrid: () => void
  
  // Bottom controls
  currentFacing: CameraFacing
  onSwitchCamera: () => void
  canSwitchCamera: boolean
  
  // States
  isLoading?: boolean
  className?: string
}

export function CameraControls({
  onClose,
  flashState,
  onToggleFlash,
  showGrid,
  onToggleGrid,
  currentFacing,
  onSwitchCamera,
  canSwitchCamera,
  isLoading = false,
  className
}: CameraControlsProps) {
  return (
    <div className={cn("absolute inset-0 pointer-events-none", className)}>
      {/* Top Controls */}
      <div className="absolute top-0 left-0 right-0 z-50 pointer-events-auto">
        <div className="flex items-center justify-between p-4 safe-area-top">
          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-12 w-12 rounded-full bg-black/30 hover:bg-black/50 text-white border-0 backdrop-blur-sm"
            disabled={isLoading}
          >
            <X className="h-6 w-6" />
            <span className="sr-only">Close camera</span>
          </Button>

          {/* Flash and Grid Controls */}
          <div className="flex items-center gap-2">
            {/* Grid Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleGrid}
              className={cn(
                "h-12 w-12 rounded-full border-0 backdrop-blur-sm text-white",
                showGrid 
                  ? "bg-white/20 hover:bg-white/30" 
                  : "bg-black/30 hover:bg-black/50"
              )}
              disabled={isLoading}
            >
              <Grid3x3 className="h-5 w-5" />
              <span className="sr-only">
                {showGrid ? "Hide grid" : "Show grid"}
              </span>
            </Button>

            {/* Flash Control */}
            {flashState.supported && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleFlash}
                className={cn(
                  "h-12 w-12 rounded-full border-0 backdrop-blur-sm text-white",
                  flashState.enabled 
                    ? "bg-yellow-500/80 hover:bg-yellow-500/90" 
                    : "bg-black/30 hover:bg-black/50"
                )}
                disabled={isLoading || !flashState.available}
              >
                {flashState.enabled ? (
                  <Zap className="h-5 w-5" />
                ) : (
                  <ZapOff className="h-5 w-5" />
                )}
                <span className="sr-only">
                  {flashState.enabled ? "Turn off flash" : "Turn on flash"}
                </span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 z-50 pointer-events-auto">
        <div className="flex items-center justify-center p-6 safe-area-bottom">
          {/* Camera Switch Button */}
          <div className="absolute left-6">
            {canSwitchCamera && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onSwitchCamera}
                className="h-14 w-14 rounded-full bg-black/30 hover:bg-black/50 text-white border-0 backdrop-blur-sm"
                disabled={isLoading}
              >
                <RotateCcw className="h-6 w-6" />
                <span className="sr-only">
                  Switch to {currentFacing === "environment" ? "front" : "rear"} camera
                </span>
              </Button>
            )}
          </div>

          {/* Camera Info */}
          <div className="absolute right-6">
            <div className="text-white text-sm bg-black/30 px-3 py-2 rounded-full backdrop-blur-sm">
              {currentFacing === "environment" ? "Rear" : "Front"}
            </div>
          </div>
        </div>
      </div>

      {/* Document Grid Overlay */}
      {showGrid && (
        <div className="absolute inset-0 pointer-events-none">
          <svg
            className="w-full h-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {/* Grid lines */}
            <defs>
              <pattern
                id="grid"
                width="33.333"
                height="33.333"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 33.333 0 L 33.333 33.333 M 0 33.333 L 33.333 33.333"
                  fill="none"
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />
            
            {/* Center focus area for receipt */}
            <rect
              x="15"
              y="25"
              width="70"
              height="50"
              fill="none"
              stroke="rgba(255,255,255,0.5)"
              strokeWidth="1"
              strokeDasharray="5,5"
              rx="4"
            />
          </svg>
          
          {/* Grid instructions */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <div className="text-white text-center bg-black/40 px-4 py-2 rounded-lg backdrop-blur-sm">
              <p className="text-sm font-medium">Position receipt in center</p>
              <p className="text-xs opacity-80">Align with dotted lines</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
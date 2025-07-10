"use client"

import * as React from "react"

export type CameraFacing = "environment" | "user"
export type CameraDevice = {
  deviceId: string
  label: string
  facing: CameraFacing
}

export interface CameraSelectionState {
  devices: CameraDevice[]
  currentFacing: CameraFacing
  stream: MediaStream | null
  isLoading: boolean
  error: string | null
  hasPermission: boolean | null
}

export interface CameraSelectionActions {
  switchCamera: () => Promise<void>
  startCamera: (facing?: CameraFacing) => Promise<void>
  stopCamera: () => void
  requestPermission: () => Promise<boolean>
}

export function useCameraSelection(): CameraSelectionState & CameraSelectionActions {
  const [state, setState] = React.useState<CameraSelectionState>({
    devices: [],
    currentFacing: "environment", // Default to rear camera
    stream: null,
    isLoading: false,
    error: null,
    hasPermission: null,
  })

  // Clean up stream on unmount
  React.useEffect(() => {
    return () => {
      if (state.stream) {
        state.stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  // Enumerate available cameras
  const enumerateDevices = React.useCallback(async (): Promise<CameraDevice[]> => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) {
        throw new Error("Device enumeration not supported")
      }

      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(device => device.kind === 'videoinput')
      
      return videoDevices.map(device => ({
        deviceId: device.deviceId,
        label: device.label || `Camera ${device.deviceId.slice(0, 8)}`,
        facing: inferCameraFacing(device.label),
      }))
    } catch (error) {
      console.error("Failed to enumerate devices:", error)
      return []
    }
  }, [])

  // Infer camera facing from device label
  const inferCameraFacing = React.useCallback((label: string): CameraFacing => {
    const lowerLabel = label.toLowerCase()
    if (lowerLabel.includes('back') || lowerLabel.includes('rear') || lowerLabel.includes('environment')) {
      return "environment"
    }
    if (lowerLabel.includes('front') || lowerLabel.includes('user') || lowerLabel.includes('face')) {
      return "user"
    }
    // Default to environment (rear) for unlabeled cameras
    return "environment"
  }, [])

  // Get camera constraints with fallback priority
  const getCameraConstraints = React.useCallback((facing: CameraFacing): MediaStreamConstraints[] => {
    const constraints: MediaStreamConstraints[] = []
    
    // Primary: Use exact facing mode
    constraints.push({
      video: { 
        facingMode: { exact: facing },
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      }
    })
    
    // Fallback 1: Use ideal facing mode (less strict)
    constraints.push({
      video: { 
        facingMode: facing,
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      }
    })
    
    // Fallback 2: Any camera with good resolution
    constraints.push({
      video: {
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      }
    })
    
    // Final fallback: Any camera
    constraints.push({ video: true })
    
    return constraints
  }, [])

  // Request camera permission
  const requestPermission = React.useCallback(async (): Promise<boolean> => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera not supported by this browser")
      }

      setState(prev => ({ ...prev, isLoading: true, error: null }))

      // Try to get a temporary stream to check permissions
      const tempStream = await navigator.mediaDevices.getUserMedia({ video: true })
      tempStream.getTracks().forEach(track => track.stop())

      setState(prev => ({ ...prev, hasPermission: true, isLoading: false }))
      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Camera access denied"
      setState(prev => ({ 
        ...prev, 
        hasPermission: false, 
        error: errorMessage,
        isLoading: false 
      }))
      return false
    }
  }, [])

  // Start camera with specified facing mode
  const startCamera = React.useCallback(async (facing: CameraFacing = "environment") => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))

      // Stop existing stream
      if (state.stream) {
        state.stream.getTracks().forEach(track => track.stop())
      }

      const constraints = getCameraConstraints(facing)
      let stream: MediaStream | null = null
      let lastError: Error | null = null

      // Try constraints in order of preference
      for (const constraint of constraints) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraint)
          break
        } catch (error) {
          lastError = error instanceof Error ? error : new Error("Unknown camera error")
          continue
        }
      }

      if (!stream) {
        throw lastError || new Error("No camera available")
      }

      // Update devices list
      const devices = await enumerateDevices()

      setState(prev => ({
        ...prev,
        stream,
        currentFacing: facing,
        devices,
        hasPermission: true,
        isLoading: false,
        error: null
      }))

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to start camera"
      setState(prev => ({
        ...prev,
        stream: null,
        error: errorMessage,
        hasPermission: false,
        isLoading: false
      }))
    }
  }, [state.stream, getCameraConstraints, enumerateDevices])

  // Stop camera
  const stopCamera = React.useCallback(() => {
    if (state.stream) {
      state.stream.getTracks().forEach(track => track.stop())
      setState(prev => ({ ...prev, stream: null }))
    }
  }, [state.stream])

  // Switch between front and rear cameras
  const switchCamera = React.useCallback(async () => {
    const newFacing: CameraFacing = state.currentFacing === "environment" ? "user" : "environment"
    await startCamera(newFacing)
  }, [state.currentFacing, startCamera])

  return {
    ...state,
    switchCamera,
    startCamera,
    stopCamera,
    requestPermission,
  }
}
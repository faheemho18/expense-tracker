/**
 * Mobile-first chart configurations for responsive design
 * Provides optimized settings for different chart types and screen sizes
 * Enhanced with progressive complexity levels and performance optimization
 */

import type { ViewportInfo } from "@/hooks/use-viewport"

export type ChartComplexity = 'minimal' | 'standard' | 'enhanced'

export interface ChartDimensions {
  width: string | number
  height: string | number
  margin: {
    top: number
    right: number
    bottom: number
    left: number
  }
}

export interface PieChartConfig extends ChartDimensions {
  innerRadius: string
  outerRadius: string
  strokeWidth: number
  fontSize: number
  legendPosition: 'top' | 'bottom' | 'left' | 'right'
  legendFontSize: number
  showLabels: boolean
}

export interface BarChartConfig extends ChartDimensions {
  barSize: number
  fontSize: number
  tickFontSize: number
  legendFontSize: number
  showXAxis: boolean
  showYAxis: boolean
  showGrid: boolean
  orientation: 'horizontal' | 'vertical'
}

export interface AreaChartConfig extends ChartDimensions {
  strokeWidth: number
  fontSize: number
  tickFontSize: number
  legendFontSize: number
  showXAxis: boolean
  showYAxis: boolean
  showGrid: boolean
  showDots: boolean
  fillOpacity: number
}

export interface ChartBreakpoints {
  mobile: number    // 0 - 767px
  tablet: number    // 768 - 1023px
  desktop: number   // 1024px+
}

export const CHART_BREAKPOINTS: ChartBreakpoints = {
  mobile: 768,
  tablet: 1024,
  desktop: 1200,
}

/**
 * Get device type based on width
 */
export function getDeviceType(width: number): 'mobile' | 'tablet' | 'desktop' {
  if (width < CHART_BREAKPOINTS.mobile) return 'mobile'
  if (width < CHART_BREAKPOINTS.tablet) return 'tablet'
  return 'desktop'
}

/**
 * Pie Chart Configurations
 */
export const PIE_CHART_CONFIGS = {
  mobile: {
    width: '100%',
    height: 240,
    margin: { top: 10, right: 10, bottom: 10, left: 10 },
    innerRadius: '45%',
    outerRadius: '80%',
    strokeWidth: 2,
    fontSize: 11,
    legendPosition: 'bottom' as const,
    legendFontSize: 10,
    showLabels: false, // Hide labels on mobile for cleaner look
  } satisfies PieChartConfig,
  
  tablet: {
    width: '100%',
    height: 300,
    margin: { top: 15, right: 15, bottom: 15, left: 15 },
    innerRadius: '50%',
    outerRadius: '85%',
    strokeWidth: 3,
    fontSize: 12,
    legendPosition: 'right' as const,
    legendFontSize: 11,
    showLabels: true,
  } satisfies PieChartConfig,
  
  desktop: {
    width: '100%',
    height: 350,
    margin: { top: 20, right: 20, bottom: 20, left: 20 },
    innerRadius: '55%',
    outerRadius: '85%',
    strokeWidth: 4,
    fontSize: 13,
    legendPosition: 'right' as const,
    legendFontSize: 12,
    showLabels: true,
  } satisfies PieChartConfig,
}

/**
 * Bar Chart Configurations
 */
export const BAR_CHART_CONFIGS = {
  mobile: {
    width: '100%',
    height: 200,
    margin: { top: 10, right: 10, bottom: 40, left: 30 },
    barSize: 20,
    fontSize: 10,
    tickFontSize: 9,
    legendFontSize: 10,
    showXAxis: true,
    showYAxis: true,
    showGrid: false, // Hide grid on mobile for cleaner look
    orientation: 'vertical' as const,
  } satisfies BarChartConfig,
  
  tablet: {
    width: '100%',
    height: 250,
    margin: { top: 15, right: 15, bottom: 50, left: 40 },
    barSize: 25,
    fontSize: 11,
    tickFontSize: 10,
    legendFontSize: 11,
    showXAxis: true,
    showYAxis: true,
    showGrid: true,
    orientation: 'vertical' as const,
  } satisfies BarChartConfig,
  
  desktop: {
    width: '100%',
    height: 300,
    margin: { top: 20, right: 20, bottom: 60, left: 50 },
    barSize: 30,
    fontSize: 12,
    tickFontSize: 11,
    legendFontSize: 12,
    showXAxis: true,
    showYAxis: true,
    showGrid: true,
    orientation: 'vertical' as const,
  } satisfies BarChartConfig,
}

/**
 * Area Chart Configurations
 */
export const AREA_CHART_CONFIGS = {
  mobile: {
    width: '100%',
    height: 180,
    margin: { top: 10, right: 10, bottom: 30, left: 20 },
    strokeWidth: 2,
    fontSize: 10,
    tickFontSize: 9,
    legendFontSize: 10,
    showXAxis: true,
    showYAxis: false, // Hide Y-axis on mobile for more space
    showGrid: false,
    showDots: false, // Hide dots on mobile for performance
    fillOpacity: 0.3,
  } satisfies AreaChartConfig,
  
  tablet: {
    width: '100%',
    height: 220,
    margin: { top: 15, right: 15, bottom: 40, left: 30 },
    strokeWidth: 2.5,
    fontSize: 11,
    tickFontSize: 10,
    legendFontSize: 11,
    showXAxis: true,
    showYAxis: true,
    showGrid: true,
    showDots: true,
    fillOpacity: 0.4,
  } satisfies AreaChartConfig,
  
  desktop: {
    width: '100%',
    height: 280,
    margin: { top: 20, right: 20, bottom: 50, left: 40 },
    strokeWidth: 3,
    fontSize: 12,
    tickFontSize: 11,
    legendFontSize: 12,
    showXAxis: true,
    showYAxis: true,
    showGrid: true,
    showDots: true,
    fillOpacity: 0.5,
  } satisfies AreaChartConfig,
}

/**
 * Get pie chart configuration based on container width
 */
export function getPieChartConfig(containerWidth: number): PieChartConfig {
  const deviceType = getDeviceType(containerWidth)
  return PIE_CHART_CONFIGS[deviceType]
}

/**
 * Get bar chart configuration based on container width
 */
export function getBarChartConfig(containerWidth: number): BarChartConfig {
  const deviceType = getDeviceType(containerWidth)
  return BAR_CHART_CONFIGS[deviceType]
}

/**
 * Get area chart configuration based on container width
 */
export function getAreaChartConfig(containerWidth: number): AreaChartConfig {
  const deviceType = getDeviceType(containerWidth)
  return AREA_CHART_CONFIGS[deviceType]
}

/**
 * Responsive font sizes based on container width
 */
export function getResponsiveFontSize(containerWidth: number, baseSize: number = 12): number {
  if (containerWidth < 300) return Math.max(8, baseSize - 3)
  if (containerWidth < 500) return Math.max(9, baseSize - 2)
  if (containerWidth < 768) return Math.max(10, baseSize - 1)
  if (containerWidth < 1024) return baseSize
  return baseSize + 1
}

/**
 * Calculate optimal number of ticks based on container width
 */
export function getOptimalTickCount(containerWidth: number, isXAxis: boolean = true): number {
  if (isXAxis) {
    if (containerWidth < 300) return 3
    if (containerWidth < 500) return 4
    if (containerWidth < 768) return 5
    if (containerWidth < 1024) return 6
    return 8
  } else {
    // Y-axis typically needs fewer ticks
    if (containerWidth < 500) return 3
    if (containerWidth < 768) return 4
    return 5
  }
}

/**
 * Get responsive spacing based on container size
 */
export function getResponsiveSpacing(containerWidth: number) {
  if (containerWidth < 400) {
    return {
      padding: 8,
      gap: 8,
      margin: 4,
    }
  } else if (containerWidth < 768) {
    return {
      padding: 12,
      gap: 12,
      margin: 6,
    }
  } else {
    return {
      padding: 16,
      gap: 16,
      margin: 8,
    }
  }
}

/**
 * Chart color palette optimized for accessibility and mobile viewing
 */
export const MOBILE_CHART_COLORS = {
  primary: [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
  ],
  highContrast: [
    '#2563eb', // Blue
    '#dc2626', // Red
    '#059669', // Green
    '#d97706', // Orange
    '#7c3aed', // Purple
    '#db2777', // Pink
    '#0891b2', // Cyan
    '#65a30d', // Lime
  ],
  accessibility: [
    '#1f77b4', // Blue
    '#ff7f0e', // Orange
    '#2ca02c', // Green
    '#d62728', // Red
    '#9467bd', // Purple
    '#8c564b', // Brown
    '#e377c2', // Pink
    '#7f7f7f', // Gray
  ],
}

/**
 * Animation configurations for different device types
 */
export const ANIMATION_CONFIGS = {
  mobile: {
    animationBegin: 0,
    animationDuration: 500, // Shorter animations on mobile
    easing: 'ease-out',
  },
  tablet: {
    animationBegin: 0,
    animationDuration: 750,
    easing: 'ease-out',
  },
  desktop: {
    animationBegin: 0,
    animationDuration: 1000, // Longer animations on desktop
    easing: 'ease-out',
  },
}

/**
 * Get animation configuration based on container width
 */
export function getAnimationConfig(containerWidth: number) {
  const deviceType = getDeviceType(containerWidth)
  return ANIMATION_CONFIGS[deviceType]
}

/**
 * Progressive enhancement configuration based on device capabilities
 */
export interface ProgressiveFeatures {
  animations: boolean
  gradients: boolean
  shadows: boolean
  smoothing: boolean
  highDPI: boolean
  complexInteractions: boolean
}

/**
 * Data processing utilities for chart complexity adjustment
 */
export class ChartDataProcessor {
  /**
   * Simplify data based on viewport capabilities
   */
  static simplifyDataForViewport<T extends Record<string, any>>(
    data: T[], 
    viewport: ViewportInfo,
    maxPoints?: number
  ): T[] {
    const limits = {
      mobile: maxPoints || 10,
      tablet: maxPoints || 25,
      desktop: maxPoints || 100
    }
    
    const limit = viewport.isMobile 
      ? limits.mobile 
      : viewport.isTablet 
      ? limits.tablet 
      : limits.desktop
    
    if (data.length <= limit) {
      return data
    }
    
    // Use different strategies based on viewport
    if (viewport.isMobile) {
      return this.groupData(data, limit)
    } else if (viewport.isTablet) {
      return this.averageData(data, limit)
    } else {
      return data.slice(0, limit) // Desktop can handle more data
    }
  }
  
  private static groupData<T extends Record<string, any>>(data: T[], maxPoints: number): T[] {
    const groupSize = Math.ceil(data.length / maxPoints)
    const grouped: T[] = []
    
    for (let i = 0; i < data.length; i += groupSize) {
      const group = data.slice(i, i + groupSize)
      const representative = group[Math.floor(group.length / 2)] // Take middle item
      grouped.push(representative)
    }
    
    return grouped
  }
  
  private static averageData<T extends Record<string, any>>(data: T[], maxPoints: number): T[] {
    const groupSize = Math.ceil(data.length / maxPoints)
    const averaged: T[] = []
    
    for (let i = 0; i < data.length; i += groupSize) {
      const group = data.slice(i, i + groupSize)
      
      // Create averaged item by combining numeric fields
      const avgItem = { ...group[0] } as T
      
      // Average all numeric fields
      for (const key in avgItem) {
        if (typeof avgItem[key] === 'number') {
          const values = group.map(item => item[key] as number).filter(v => !isNaN(v))
          if (values.length > 0) {
            avgItem[key] = values.reduce((sum, val) => sum + val, 0) / values.length as T[typeof key]
          }
        }
      }
      
      averaged.push(avgItem)
    }
    
    return averaged
  }
  
  /**
   * Limit pie chart slices and group smaller ones into "Others"
   */
  static simplifyPieData<T extends { name: string; value: number }>(
    data: T[], 
    viewport: ViewportInfo
  ): T[] {
    const maxSlices = viewport.isMobile ? 5 : viewport.isTablet ? 8 : 12
    
    if (data.length <= maxSlices) {
      return data
    }
    
    // Sort by value descending
    const sorted = [...data].sort((a, b) => b.value - a.value)
    
    // Take top slices
    const topSlices = sorted.slice(0, maxSlices - 1)
    
    // Group remaining into "Others"
    const remaining = sorted.slice(maxSlices - 1)
    const othersValue = remaining.reduce((sum, item) => sum + item.value, 0)
    
    if (othersValue > 0) {
      topSlices.push({
        name: 'Others',
        value: othersValue
      } as T)
    }
    
    return topSlices
  }
}

/**
 * Progressive enhancement utilities
 */
export class ChartProgressiveEnhancement {
  /**
   * Determine if advanced features should be enabled based on device capabilities
   */
  static getProgressiveFeatures(viewport: ViewportInfo): ProgressiveFeatures {
    const isMobile = viewport.isMobile
    const isLowEndDevice = this.isLowEndDevice()
    const prefersReducedMotion = this.prefersReducedMotion()
    
    return {
      animations: !isMobile && !isLowEndDevice && !prefersReducedMotion,
      gradients: !isMobile && !isLowEndDevice,
      shadows: viewport.isDesktop && !isLowEndDevice,
      smoothing: !isMobile,
      highDPI: viewport.isDesktop && typeof window !== 'undefined' && window.devicePixelRatio > 1,
      complexInteractions: viewport.isDesktop && !viewport.isTouchDevice
    }
  }
  
  /**
   * Get viewport-optimized chart complexity
   */
  static getOptimalComplexity(viewport: ViewportInfo): ChartComplexity {
    if (viewport.isMobile || this.isLowEndDevice()) {
      return 'minimal'
    } else if (viewport.isTablet) {
      return 'standard'
    } else {
      return 'enhanced'
    }
  }
  
  /**
   * Detect potentially low-end devices for performance optimization
   */
  private static isLowEndDevice(): boolean {
    if (typeof navigator === 'undefined') return false
    
    // Check for low memory devices
    // @ts-ignore - Non-standard API
    const memory = navigator.deviceMemory
    if (memory && memory < 4) return true
    
    // Check for slow connection
    // @ts-ignore - Non-standard API
    const connection = navigator.connection
    if (connection?.effectiveType && ['slow-2g', '2g'].includes(connection.effectiveType)) {
      return true
    }
    
    return false
  }
  
  /**
   * Check if user prefers reduced motion
   */
  private static prefersReducedMotion(): boolean {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }
  
  /**
   * Get performance-optimized chart configuration
   */
  static getOptimizedChartConfig(viewport: ViewportInfo, containerWidth: number) {
    const features = this.getProgressiveFeatures(viewport)
    const complexity = this.getOptimalComplexity(viewport)
    const deviceType = getDeviceType(containerWidth)
    
    return {
      // Base configuration from existing system
      deviceType,
      complexity,
      
      // Animation settings
      animationsEnabled: features.animations,
      animationDuration: features.animations ? ANIMATION_CONFIGS[deviceType].animationDuration : 0,
      
      // Visual enhancements
      gradients: features.gradients,
      shadows: features.shadows,
      smoothCurves: features.smoothing,
      
      // Performance settings
      maxDataPoints: viewport.isMobile ? 10 : viewport.isTablet ? 25 : 100,
      useHighDPI: features.highDPI,
      enableComplexInteractions: features.complexInteractions,
      
      // Responsive settings
      fontSize: getResponsiveFontSize(containerWidth),
      spacing: getResponsiveSpacing(containerWidth),
      tickCount: getOptimalTickCount(containerWidth),
    }
  }
}

/**
 * Performance optimization utilities for mobile chart rendering
 */
export class ChartPerformanceOptimizer {
  /**
   * Get optimal data sampling rate based on device capabilities
   */
  static getOptimalSamplingRate(viewport: ViewportInfo, dataLength: number): number {
    const maxPoints = viewport.isMobile ? 20 : viewport.isTablet ? 50 : 100
    
    if (dataLength <= maxPoints) {
      return 1 // No sampling needed
    }
    
    return Math.ceil(dataLength / maxPoints)
  }
  
  /**
   * Sample data for optimal performance while preserving important points
   */
  static sampleDataForPerformance<T extends Record<string, any>>(
    data: T[],
    viewport: ViewportInfo,
    keyField: keyof T = 'value'
  ): T[] {
    const samplingRate = this.getOptimalSamplingRate(viewport, data.length)
    
    if (samplingRate === 1) {
      return data
    }
    
    // Always include first and last points
    const sampled: T[] = [data[0]]
    
    // Find peaks and troughs to preserve important data points
    const importantIndices = this.findImportantDataPoints(data, keyField)
    
    // Sample at regular intervals but include important points
    for (let i = samplingRate; i < data.length - 1; i += samplingRate) {
      sampled.push(data[i])
    }
    
    // Add important points if not already included
    for (const index of importantIndices) {
      if (!sampled.some((_, i) => i === index)) {
        sampled.push(data[index])
      }
    }
    
    // Always include last point
    if (data.length > 1) {
      sampled.push(data[data.length - 1])
    }
    
    // Sort by original index to maintain order
    return sampled.sort((a, b) => data.indexOf(a) - data.indexOf(b))
  }
  
  /**
   * Find peaks, troughs, and significant changes in data
   */
  private static findImportantDataPoints<T extends Record<string, any>>(
    data: T[],
    keyField: keyof T
  ): number[] {
    const important: number[] = []
    
    if (data.length < 3) return important
    
    // Find local maxima and minima
    for (let i = 1; i < data.length - 1; i++) {
      const prev = Number(data[i - 1][keyField])
      const curr = Number(data[i][keyField])
      const next = Number(data[i + 1][keyField])
      
      // Local maximum
      if (curr > prev && curr > next) {
        important.push(i)
      }
      
      // Local minimum
      if (curr < prev && curr < next) {
        important.push(i)
      }
      
      // Significant change (> 20% difference)
      const changeFromPrev = Math.abs((curr - prev) / prev)
      const changeToNext = Math.abs((next - curr) / curr)
      
      if (changeFromPrev > 0.2 || changeToNext > 0.2) {
        important.push(i)
      }
    }
    
    return important
  }
  
  /**
   * Get performance-optimized chart rendering options
   */
  static getPerformanceRenderOptions(viewport: ViewportInfo) {
    return {
      // Reduce rendering complexity on mobile
      useSimplifiedRendering: viewport.isMobile || this.isLowEndDevice(),
      
      // Disable expensive features on constrained devices
      enableAnimations: !viewport.isMobile && !this.isLowEndDevice() && !this.prefersReducedMotion(),
      enableGradients: !viewport.isMobile && !this.isLowEndDevice(),
      enableShadows: viewport.isDesktop && !this.isLowEndDevice(),
      
      // Optimize redraw frequency
      throttleRedraws: viewport.isMobile,
      redrawDelay: viewport.isMobile ? 100 : 50,
      
      // Memory optimization
      clearOffscreenCanvases: viewport.isMobile,
      maxCachedFrames: viewport.isMobile ? 2 : 5,
      
      // Interaction optimization
      touchOptimized: viewport.isTouchDevice,
      hoverEffects: !viewport.isTouchDevice,
    }
  }
  
  /**
   * Check if device should use simplified rendering
   */
  private static isLowEndDevice(): boolean {
    if (typeof navigator === 'undefined') return false
    
    // Check device memory
    // @ts-ignore - Non-standard API
    const memory = navigator.deviceMemory
    if (memory && memory < 4) return true
    
    // Check CPU cores as proxy for performance
    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) {
      return true
    }
    
    // Check connection speed
    // @ts-ignore - Non-standard API
    const connection = navigator.connection
    if (connection?.effectiveType && ['slow-2g', '2g'].includes(connection.effectiveType)) {
      return true
    }
    
    return false
  }
  
  /**
   * Check user preference for reduced motion
   */
  private static prefersReducedMotion(): boolean {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }
  
  /**
   * Optimize chart configuration for mobile performance
   */
  static optimizeForMobile<T extends ChartDimensions>(config: T): T {
    return {
      ...config,
      // Reduce chart height for faster rendering
      height: typeof config.height === 'number' 
        ? Math.min(config.height, 250) 
        : config.height,
      
      // Reduce margins to save space and rendering time
      margin: {
        top: Math.min(config.margin.top, 10),
        right: Math.min(config.margin.right, 10),
        bottom: Math.min(config.margin.bottom, 20),
        left: Math.min(config.margin.left, 10),
      },
    }
  }
  
  /**
   * Get debounced resize handler for performance
   */
  static getDebouncedResizeHandler(
    callback: () => void,
    delay: number = 150
  ): () => void {
    let timeoutId: NodeJS.Timeout
    
    return () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(callback, delay)
    }
  }
  
  /**
   * Create performance monitoring for chart rendering
   */
  static createPerformanceMonitor(chartId: string) {
    if (typeof performance === 'undefined') {
      return {
        startRender: () => {},
        endRender: () => {},
        getMetrics: () => ({}),
      }
    }
    
    let renderStart: number
    const metrics: Record<string, number> = {}
    
    return {
      startRender: () => {
        renderStart = performance.now()
      },
      
      endRender: () => {
        const renderTime = performance.now() - renderStart
        metrics[`${chartId}_render_time`] = renderTime
        
        // Log performance warnings for slow renders
        if (renderTime > 100) {
          console.warn(`Chart ${chartId} render took ${renderTime.toFixed(2)}ms`)
        }
      },
      
      getMetrics: () => ({ ...metrics }),
    }
  }
}
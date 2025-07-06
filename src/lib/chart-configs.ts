/**
 * Mobile-first chart configurations for responsive design
 * Provides optimized settings for different chart types and screen sizes
 */

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
/**
 * Dark Mode Utilities
 * 
 * Provides utilities for dark mode detection, theme conversion, and system preference handling
 */

import { HSLColor, Theme } from './types'

export type DarkModePreference = 'light' | 'dark' | 'auto'

/**
 * Detects if the user prefers dark mode based on system settings
 */
export function getSystemPreference(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  return mediaQuery.matches ? 'dark' : 'light'
}

/**
 * Listens to system dark mode preference changes
 */
export function onSystemPreferenceChange(callback: (isDark: boolean) => void): () => void {
  if (typeof window === 'undefined') return () => {}
  
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  
  const handleChange = (e: MediaQueryListEvent) => {
    callback(e.matches)
  }
  
  mediaQuery.addEventListener('change', handleChange)
  
  return () => {
    mediaQuery.removeEventListener('change', handleChange)
  }
}

/**
 * Converts HSL color to a darker variant for dark mode
 */
export function convertTooDarkVariant(color: HSLColor): HSLColor {
  const { h, s, l } = color
  
  // For dark mode, we generally want to:
  // 1. Reduce lightness for backgrounds significantly
  // 2. Increase lightness for text/foregrounds
  // 3. Slightly desaturate very bright colors
  
  let newLightness = l
  let newSaturation = s
  
  // If it's a very light color (likely background), make it very dark
  if (l > 70) {
    newLightness = Math.max(8, l - 85) // Make much darker for dark mode
  }
  // If it's a medium color, adjust more aggressively
  else if (l > 40) {
    newLightness = Math.max(15, l - 35) // Make darker
  }
  // If it's already dark, make it lighter for contrast
  else if (l < 30) {
    newLightness = Math.min(80, l + 50) // Make lighter
  }
  
  // Desaturate very bright colors slightly
  if (s > 80) {
    newSaturation = Math.max(60, s - 20)
  }
  
  return {
    h,
    s: newSaturation,
    l: newLightness
  }
}

/**
 * Converts a light theme to its dark variant
 */
export function convertThemeToDark(theme: Theme): Theme {
  // Convert base colors first
  const darkBackground = convertTooDarkVariant(theme.background)
  
  // For primary and accent, ensure they have good contrast with the dark background
  const darkPrimary = {
    ...theme.primary,
    l: Math.max(50, theme.primary.l) // Ensure primary is light enough for dark background
  }
  
  const darkAccent = {
    ...theme.accent,
    l: Math.max(45, theme.accent.l) // Ensure accent is light enough for dark background
  }
  
  const darkTheme: Theme = {
    ...theme,
    name: theme.name.includes('Dark') ? theme.name : `${theme.name} Dark`,
    isDark: true,
    primary: darkPrimary,
    background: darkBackground,
    accent: darkAccent,
  }
  
  return darkTheme
}

/**
 * Converts a dark theme to its light variant
 */
export function convertThemeToLight(theme: Theme): Theme {
  const lightTheme: Theme = {
    ...theme,
    name: theme.name.replace(' Dark', ''),
    isDark: false,
    primary: {
      h: theme.primary.h,
      s: theme.primary.s,
      l: Math.max(30, Math.min(70, theme.primary.l))
    },
    background: {
      h: theme.background.h,
      s: Math.max(0, theme.background.s - 20),
      l: Math.max(90, theme.background.l + 40)
    },
    accent: {
      h: theme.accent.h,
      s: theme.accent.s,
      l: Math.max(40, Math.min(80, theme.accent.l))
    },
  }
  
  return lightTheme
}

/**
 * Gets the appropriate theme variant based on dark mode preference
 */
export function getThemeVariant(baseTheme: Theme, isDark: boolean): Theme {
  if (isDark && !baseTheme.isDark) {
    return convertThemeToDark(baseTheme)
  }
  
  if (!isDark && baseTheme.isDark) {
    return convertThemeToLight(baseTheme)
  }
  
  return baseTheme
}

/**
 * Determines if dark mode should be active based on preference and system settings
 */
export function shouldUseDarkMode(preference: DarkModePreference): boolean {
  switch (preference) {
    case 'dark':
      return true
    case 'light':
      return false
    case 'auto':
      return getSystemPreference() === 'dark'
    default:
      return false
  }
}

/**
 * Applies dark mode class to document
 */
export function applyDarkModeClass(isDark: boolean): void {
  if (typeof document === 'undefined') return
  
  if (isDark) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

/**
 * Gets stored dark mode preference from localStorage
 */
export function getStoredDarkModePreference(): DarkModePreference {
  if (typeof window === 'undefined') return 'dark'
  
  const stored = localStorage.getItem('darkModePreference')
  if (stored === 'light' || stored === 'dark' || stored === 'auto') {
    return stored
  }
  
  return 'dark'
}

/**
 * Stores dark mode preference in localStorage
 */
export function setStoredDarkModePreference(preference: DarkModePreference): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('darkModePreference', preference)
}

/**
 * Creates a pair of light and dark themes from a base theme
 */
export function createThemePair(baseTheme: Theme): { light: Theme; dark: Theme } {
  const lightTheme = baseTheme.isDark ? convertThemeToLight(baseTheme) : baseTheme
  const darkTheme = baseTheme.isDark ? baseTheme : convertThemeToDark(baseTheme)
  
  return { light: lightTheme, dark: darkTheme }
}

/**
 * Validates if a theme is properly configured for dark mode
 */
export function validateDarkTheme(theme: Theme): boolean {
  if (!theme.isDark) return true
  
  // Check if background is dark enough
  if (theme.background.l > 30) {
    console.warn('Dark theme background may be too light:', theme.background.l)
    return false
  }
  
  // Check if there's enough contrast
  const contrastRatio = Math.abs(theme.primary.l - theme.background.l)
  if (contrastRatio < 30) {
    console.warn('Dark theme may not have enough contrast:', contrastRatio)
    return false
  }
  
  return true
}
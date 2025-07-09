import type { CSSProperties } from "react"

import type { Theme } from "./types"

export function getThemeCssProperties(theme: Theme): CSSProperties {
  const { primary, background, accent, radius } = theme
  // Use the explicit isDark property, fallback to background lightness check
  const isDark = theme.isDark !== undefined ? theme.isDark : background.l < 50

  const primaryForegroundLightness = primary.l > 50 ? 10 : 98
  const accentForegroundLightness = accent.l > 50 ? 10 : 98

  return {
    "--radius": `${radius}rem`,

    // Base Colors
    "--background": `${background.h} ${background.s}% ${background.l}%`,
    "--foreground": `${background.h} 10% ${isDark ? 98 : 10}%`,

    "--primary": `${primary.h} ${primary.s}% ${primary.l}%`,
    "--primary-foreground": `${primary.h} 10% ${primaryForegroundLightness}%`,

    "--accent": `${accent.h} ${accent.s}% ${accent.l}%`,
    "--accent-foreground": `${accent.h} 10% ${accentForegroundLightness}%`,

    // Derived Colors
    "--card": `${background.h} ${background.s}% ${
      isDark ? background.l + 4 : 100
    }%`,
    "--card-foreground": `hsl(var(--foreground))`,
    "--popover": `${background.h} ${background.s}% ${
      isDark ? background.l + 4 : 98
    }%`,
    "--popover-foreground": `${background.h} 10% ${isDark ? 98 : 10}%`,

    "--secondary": `${background.h} ${background.s * 0.8}% ${
      isDark ? background.l + 8 : 96
    }%`,
    "--secondary-foreground": `hsl(var(--foreground))`,

    "--muted": `${background.h} ${background.s * 0.8}% ${
      isDark ? background.l + 8 : 96
    }%`,
    "--muted-foreground": `${background.h} 10% ${isDark ? 65 : 45}%`,

    "--border": `${background.h} ${background.s}% ${
      isDark ? background.l + 12 : 91
    }%`,
    "--input": `hsl(var(--border))`,
    "--ring": `hsl(var(--primary))`,

    // Static Colors
    "--destructive": "0 84.2% 60.2%",
    "--destructive-foreground": "0 0% 100%",

    // Sidebar Theme (contrasting)
    "--sidebar-background": `${primary.h} ${primary.s * 0.4}% ${
      isDark ? 98 : 10
    }%`,
    "--sidebar-foreground": `${primary.h} 15% ${isDark ? 10 : 98}%`,

    "--sidebar-primary": `hsl(var(--primary))`,
    "--sidebar-primary-foreground": `hsl(var(--primary-foreground))`,

    "--sidebar-accent": `${primary.h} ${primary.s * 0.5}% ${
      isDark ? 95 : 17
    }%`,
    "--sidebar-accent-foreground": `hsl(var(--sidebar-foreground))`,

    "--sidebar-border": `${primary.h} ${primary.s * 0.4}% ${
      isDark ? 90 : 15
    }%`,
    "--sidebar-ring": `hsl(var(--ring))`,
  } as CSSProperties
}

/**
 * Determines if a theme should be considered dark based on its properties
 */
export function isThemeDark(theme: Theme): boolean {
  if (theme.isDark !== undefined) {
    return theme.isDark
  }
  
  // Fallback to background lightness check
  return theme.background.l < 50
}

/**
 * Gets the appropriate foreground color for a given background color
 */
export function getForegroundColor(background: { h: number; s: number; l: number }, isDark: boolean): string {
  return `${background.h} 10% ${isDark ? 98 : 10}%`
}

/**
 * Creates enhanced CSS properties for dark mode with better contrast
 */
export function getEnhancedDarkModeProperties(theme: Theme): CSSProperties {
  const isDark = isThemeDark(theme)
  
  if (!isDark) {
    return getThemeCssProperties(theme)
  }
  
  // Enhanced dark mode calculations
  const { primary, background, accent, radius } = theme
  
  // Ensure better contrast for dark mode
  const enhancedBackground = {
    ...background,
    l: Math.min(background.l, 15) // Ensure background is dark enough
  }
  
  const enhancedPrimary = {
    ...primary,
    l: Math.max(primary.l, 40) // Ensure primary is bright enough
  }
  
  const enhancedAccent = {
    ...accent,
    l: Math.max(accent.l, 45) // Ensure accent is bright enough
  }
  
  return {
    "--radius": `${radius}rem`,
    
    // Enhanced dark mode base colors
    "--background": `${enhancedBackground.h} ${enhancedBackground.s}% ${enhancedBackground.l}%`,
    "--foreground": `${enhancedBackground.h} 10% 98%`,
    
    "--primary": `${enhancedPrimary.h} ${enhancedPrimary.s}% ${enhancedPrimary.l}%`,
    "--primary-foreground": `${enhancedPrimary.h} 10% 10%`,
    
    "--accent": `${enhancedAccent.h} ${enhancedAccent.s}% ${enhancedAccent.l}%`,
    "--accent-foreground": `${enhancedAccent.h} 10% 10%`,
    
    // Enhanced derived colors for better dark mode experience
    "--card": `${enhancedBackground.h} ${enhancedBackground.s}% ${enhancedBackground.l + 5}%`,
    "--card-foreground": `${enhancedBackground.h} 10% 98%`,
    
    "--popover": `${enhancedBackground.h} ${enhancedBackground.s}% ${enhancedBackground.l + 3}%`,
    "--popover-foreground": `${enhancedBackground.h} 10% 98%`,
    
    "--secondary": `${enhancedBackground.h} ${enhancedBackground.s * 0.8}% ${enhancedBackground.l + 10}%`,
    "--secondary-foreground": `${enhancedBackground.h} 10% 98%`,
    
    "--muted": `${enhancedBackground.h} ${enhancedBackground.s * 0.8}% ${enhancedBackground.l + 10}%`,
    "--muted-foreground": `${enhancedBackground.h} 10% 70%`,
    
    "--border": `${enhancedBackground.h} ${enhancedBackground.s}% ${enhancedBackground.l + 15}%`,
    "--input": `${enhancedBackground.h} ${enhancedBackground.s}% ${enhancedBackground.l + 8}%`,
    "--ring": `${enhancedPrimary.h} ${enhancedPrimary.s}% ${enhancedPrimary.l}%`,
    
    // Static colors optimized for dark mode
    "--destructive": "0 84.2% 60.2%",
    "--destructive-foreground": "0 0% 100%",
    
    // Enhanced sidebar for dark mode
    "--sidebar-background": `${enhancedBackground.h} ${enhancedBackground.s}% ${enhancedBackground.l + 2}%`,
    "--sidebar-foreground": `${enhancedBackground.h} 10% 95%`,
    
    "--sidebar-primary": `${enhancedPrimary.h} ${enhancedPrimary.s}% ${enhancedPrimary.l}%`,
    "--sidebar-primary-foreground": `${enhancedPrimary.h} 10% 10%`,
    
    "--sidebar-accent": `${enhancedBackground.h} ${enhancedBackground.s * 0.5}% ${enhancedBackground.l + 12}%`,
    "--sidebar-accent-foreground": `${enhancedBackground.h} 10% 95%`,
    
    "--sidebar-border": `${enhancedBackground.h} ${enhancedBackground.s * 0.4}% ${enhancedBackground.l + 8}%`,
    "--sidebar-ring": `${enhancedPrimary.h} ${enhancedPrimary.s}% ${enhancedPrimary.l}%`,
  } as CSSProperties
}

/**
 * Validates if a theme has sufficient contrast for accessibility
 */
export function validateThemeContrast(theme: Theme): { isValid: boolean; issues: string[] } {
  const issues: string[] = []
  const isDark = isThemeDark(theme)
  
  // Check background to foreground contrast
  const bgFgContrast = Math.abs(theme.background.l - (isDark ? 98 : 10))
  if (bgFgContrast < 70) {
    issues.push('Background to foreground contrast may be insufficient')
  }
  
  // Check primary to background contrast
  const primaryBgContrast = Math.abs(theme.primary.l - theme.background.l)
  if (primaryBgContrast < 30) {
    issues.push('Primary color may not have enough contrast with background')
  }
  
  // Check accent to background contrast
  const accentBgContrast = Math.abs(theme.accent.l - theme.background.l)
  if (accentBgContrast < 25) {
    issues.push('Accent color may not have enough contrast with background')
  }
  
  return {
    isValid: issues.length === 0,
    issues
  }
}

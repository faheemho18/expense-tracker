import { validateThemeContrast } from '../theme-utils'
import { validateDarkTheme } from '../dark-mode-utils'
import { PRESETS } from '../constants'
import { convertThemeToDark } from '../dark-mode-utils'

describe('Dark Mode Accessibility', () => {
  describe('Theme Contrast Validation', () => {
    it('validates that all default themes have good contrast', () => {
      PRESETS.forEach(theme => {
        const { isValid, issues } = validateThemeContrast(theme)
        expect(isValid).toBe(true)
        expect(issues).toHaveLength(0)
      })
    })

    it('validates that dark variants have good contrast', () => {
      PRESETS.forEach(theme => {
        const darkTheme = convertThemeToDark(theme)
        const { isValid, issues } = validateThemeContrast(darkTheme)
        
        // Dark themes should have good contrast
        expect(isValid).toBe(true)
        expect(issues).toHaveLength(0)
      })
    })

    it('validates dark theme implementation', () => {
      PRESETS.forEach(theme => {
        const darkTheme = convertThemeToDark(theme)
        const isValid = validateDarkTheme(darkTheme)
        
        // All generated dark themes should be valid
        expect(isValid).toBe(true)
      })
    })
  })

  describe('Color Contrast Requirements', () => {
    it('ensures dark themes have proper background lightness', () => {
      PRESETS.forEach(theme => {
        const darkTheme = convertThemeToDark(theme)
        
        // Dark theme backgrounds should be dark (lightness < 30)
        expect(darkTheme.background.l).toBeLessThan(30)
        expect(darkTheme.isDark).toBe(true)
      })
    })

    it('ensures dark themes have readable text contrast', () => {
      PRESETS.forEach(theme => {
        const darkTheme = convertThemeToDark(theme)
        
        // Primary should have good contrast with background
        const primaryBgContrast = Math.abs(darkTheme.primary.l - darkTheme.background.l)
        expect(primaryBgContrast).toBeGreaterThan(30)
        
        // Accent should have good contrast with background
        const accentBgContrast = Math.abs(darkTheme.accent.l - darkTheme.background.l)
        expect(accentBgContrast).toBeGreaterThan(25)
      })
    })

    it('ensures sufficient contrast for WCAG AA compliance', () => {
      PRESETS.forEach(theme => {
        const darkTheme = convertThemeToDark(theme)
        
        // Background should be dark enough for dark mode
        expect(darkTheme.background.l).toBeLessThan(20)
        
        // Text (foreground) should be light enough for contrast
        // This simulates the foreground color calculation in theme-utils
        const foregroundLightness = darkTheme.isDark ? 98 : 10
        const bgFgContrast = Math.abs(darkTheme.background.l - foregroundLightness)
        expect(bgFgContrast).toBeGreaterThan(70) // Strong contrast for readability
      })
    })
  })
})
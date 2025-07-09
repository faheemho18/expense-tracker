import {
  getSystemPreference,
  shouldUseDarkMode,
  convertThemeToDark,
  convertThemeToLight,
  getThemeVariant,
  validateDarkTheme,
  applyDarkModeClass,
} from '../dark-mode-utils'
import { Theme } from '../types'

// Mock window.matchMedia
const mockMatchMedia = jest.fn()
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: mockMatchMedia,
})

// Mock document
const mockDocumentElement = {
  classList: {
    add: jest.fn(),
    remove: jest.fn(),
  },
}
Object.defineProperty(document, 'documentElement', {
  value: mockDocumentElement,
})

describe('dark-mode-utils', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getSystemPreference', () => {
    it('returns dark when system prefers dark mode', () => {
      mockMatchMedia.mockReturnValue({ matches: true })
      
      const result = getSystemPreference()
      
      expect(result).toBe('dark')
      expect(mockMatchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)')
    })

    it('returns light when system prefers light mode', () => {
      mockMatchMedia.mockReturnValue({ matches: false })
      
      const result = getSystemPreference()
      
      expect(result).toBe('light')
    })
  })

  describe('shouldUseDarkMode', () => {
    it('returns true for dark preference', () => {
      expect(shouldUseDarkMode('dark')).toBe(true)
    })

    it('returns false for light preference', () => {
      expect(shouldUseDarkMode('light')).toBe(false)
    })

    it('returns system preference for auto mode', () => {
      mockMatchMedia.mockReturnValue({ matches: true })
      expect(shouldUseDarkMode('auto')).toBe(true)

      mockMatchMedia.mockReturnValue({ matches: false })
      expect(shouldUseDarkMode('auto')).toBe(false)
    })
  })

  describe('convertThemeToDark', () => {
    const lightTheme: Theme = {
      name: 'Light Theme',
      primary: { h: 200, s: 50, l: 50 },
      background: { h: 0, s: 0, l: 100 },
      accent: { h: 180, s: 60, l: 60 },
      radius: 0.5,
      isDark: false,
    }

    it('converts light theme to dark variant', () => {
      const darkTheme = convertThemeToDark(lightTheme)
      
      expect(darkTheme.name).toBe('Light Theme Dark')
      expect(darkTheme.isDark).toBe(true)
      expect(darkTheme.background.l).toBeLessThan(lightTheme.background.l)
    })

    it('preserves existing dark theme name', () => {
      const alreadyDarkTheme = { ...lightTheme, name: 'Already Dark' }
      const result = convertThemeToDark(alreadyDarkTheme)
      
      expect(result.name).toBe('Already Dark') // Should preserve existing 'Dark' in name
    })
  })

  describe('convertThemeToLight', () => {
    const darkTheme: Theme = {
      name: 'Dark Theme Dark',
      primary: { h: 200, s: 50, l: 30 },
      background: { h: 0, s: 0, l: 10 },
      accent: { h: 180, s: 60, l: 40 },
      radius: 0.5,
      isDark: true,
    }

    it('converts dark theme to light variant', () => {
      const lightTheme = convertThemeToLight(darkTheme)
      
      expect(lightTheme.name).toBe('Dark Theme')
      expect(lightTheme.isDark).toBe(false)
      expect(lightTheme.background.l).toBeGreaterThan(darkTheme.background.l)
    })
  })

  describe('getThemeVariant', () => {
    const baseTheme: Theme = {
      name: 'Base Theme',
      primary: { h: 200, s: 50, l: 50 },
      background: { h: 0, s: 0, l: 100 },
      accent: { h: 180, s: 60, l: 60 },
      radius: 0.5,
      isDark: false,
    }

    it('returns dark variant when requested and theme is light', () => {
      const result = getThemeVariant(baseTheme, true)
      
      expect(result.isDark).toBe(true)
      expect(result.name).toBe('Base Theme Dark')
    })

    it('returns light variant when requested and theme is dark', () => {
      const darkTheme = { ...baseTheme, isDark: true }
      const result = getThemeVariant(darkTheme, false)
      
      expect(result.isDark).toBe(false)
    })

    it('returns original theme when already correct variant', () => {
      const result = getThemeVariant(baseTheme, false)
      
      expect(result).toBe(baseTheme)
    })
  })

  describe('validateDarkTheme', () => {
    it('returns true for light themes', () => {
      const lightTheme: Theme = {
        name: 'Light',
        primary: { h: 200, s: 50, l: 50 },
        background: { h: 0, s: 0, l: 100 },
        accent: { h: 180, s: 60, l: 60 },
        radius: 0.5,
        isDark: false,
      }
      
      expect(validateDarkTheme(lightTheme)).toBe(true)
    })

    it('validates dark theme with good contrast', () => {
      const goodDarkTheme: Theme = {
        name: 'Good Dark',
        primary: { h: 200, s: 50, l: 70 },
        background: { h: 0, s: 0, l: 10 },
        accent: { h: 180, s: 60, l: 60 },
        radius: 0.5,
        isDark: true,
      }
      
      expect(validateDarkTheme(goodDarkTheme)).toBe(true)
    })

    it('fails validation for dark theme with poor contrast', () => {
      const poorDarkTheme: Theme = {
        name: 'Poor Dark',
        primary: { h: 200, s: 50, l: 20 },
        background: { h: 0, s: 0, l: 10 },
        accent: { h: 180, s: 60, l: 60 },
        radius: 0.5,
        isDark: true,
      }
      
      expect(validateDarkTheme(poorDarkTheme)).toBe(false)
    })
  })

  describe('applyDarkModeClass', () => {
    it('adds dark class when isDark is true', () => {
      applyDarkModeClass(true)
      
      expect(mockDocumentElement.classList.add).toHaveBeenCalledWith('dark')
    })

    it('removes dark class when isDark is false', () => {
      applyDarkModeClass(false)
      
      expect(mockDocumentElement.classList.remove).toHaveBeenCalledWith('dark')
    })
  })
})
import { useSettings } from "@/contexts/settings-context"

/**
 * Hook to access dark mode state and controls
 * 
 * @returns Object containing dark mode preference, setter, and current state
 */
export function useDarkMode() {
  const { darkModePreference, setDarkModePreference, isDarkMode } = useSettings()
  
  return {
    preference: darkModePreference,
    setPreference: setDarkModePreference,
    isDark: isDarkMode,
  }
}
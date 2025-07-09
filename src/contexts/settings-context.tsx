
"use client"

import * as React from "react"

import { useLocalStorage } from "@/hooks/use-local-storage"
import { 
  useSupabaseAccounts, 
  useSupabaseCategories, 
  useSupabaseTheme,
  useDataServiceConfig 
} from "@/hooks/use-supabase-data"
import { useAuthDataService } from "@/hooks/use-auth-data-service"
import { useRealtimeSync } from "@/hooks/use-realtime-sync"
import {
  DEFAULT_ACCOUNTS,
  DEFAULT_CATEGORIES,
  DEFAULT_THEME,
} from "@/lib/constants"
import type { Account, Category, Theme } from "@/lib/types"
import type { DataSource } from "@/lib/supabase-data-service"
import { getThemeCssProperties } from "@/lib/theme-utils"
import { 
  DarkModePreference,
  shouldUseDarkMode,
  applyDarkModeClass,
  getStoredDarkModePreference,
  setStoredDarkModePreference,
  onSystemPreferenceChange,
  getThemeVariant
} from "@/lib/dark-mode-utils"

interface SettingsContextType {
  // Data
  categories: Category[]
  setCategories: (
    value: Category[] | ((val: Category[]) => Category[])
  ) => void
  accounts: Account[]
  setAccounts: (
    value: Account[] | ((val: Account[]) => Account[])
  ) => void
  theme: Theme
  setTheme: (theme: Theme) => void
  
  // Dark mode
  darkModePreference: DarkModePreference
  setDarkModePreference: (preference: DarkModePreference) => void
  isDarkMode: boolean
  
  // Data source management
  dataSource: DataSource
  setDataSource: (source: DataSource) => void
  isLoading: boolean
  error: Error | null
  
  // Sync operations
  syncData: () => Promise<void>
  clearCache: () => void
  
  // Real-time sync
  isRealtimeSyncEnabled: boolean
  isRealtimeSyncActive: boolean
  enableRealtimeSync: () => void
  disableRealtimeSync: () => void
}

const SettingsContext = React.createContext<SettingsContextType | undefined>(
  undefined
)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  // Connect auth state with data service
  const { isAuthenticated } = useAuthDataService()
  // Data service configuration
  const { config, updateConfig, clearCache } = useDataServiceConfig()
  
  // Real-time sync integration
  const { isActive: isRealtimeSyncActive, start: startRealtimeSync, stop: stopRealtimeSync } = useRealtimeSync({
    autoInit: config.primarySource === 'supabase' && isAuthenticated,
    pauseOnHidden: true
  })
  
  // Local storage hooks (fallback)
  const [localCategories, setLocalCategories] = useLocalStorage<Category[]>(
    "categories",
    DEFAULT_CATEGORIES
  )
  const [localAccounts, setLocalAccounts] = useLocalStorage<Account[]>(
    "accounts",
    DEFAULT_ACCOUNTS
  )
  const [localTheme, setLocalTheme] = useLocalStorage<Theme>("app-theme", DEFAULT_THEME)
  
  // Dark mode state
  const [darkModePreference, setDarkModePreferenceState] = useLocalStorage<DarkModePreference>(
    "darkModePreference", 
    "auto"
  )

  // Supabase hooks
  const supabaseAccounts = useSupabaseAccounts()
  const supabaseCategories = useSupabaseCategories()
  const supabaseTheme = useSupabaseTheme(DEFAULT_THEME)

  // Determine which data source to use
  const usingSupabase = config.primarySource === 'supabase'
  
  // Select data based on current source
  const categories = usingSupabase ? supabaseCategories.data : localCategories
  const accounts = usingSupabase ? supabaseAccounts.data : localAccounts
  const baseTheme = usingSupabase ? supabaseTheme.data : localTheme
  
  // Dark mode calculations
  const isDarkMode = shouldUseDarkMode(darkModePreference)
  const theme = React.useMemo(() => 
    getThemeVariant(baseTheme, isDarkMode), 
    [baseTheme, isDarkMode]
  )
  
  // Aggregate loading and error states
  const isLoading = usingSupabase ? (
    supabaseAccounts.loading || supabaseCategories.loading || supabaseTheme.loading
  ) : false
  
  const error = usingSupabase ? (
    supabaseAccounts.error || supabaseCategories.error || supabaseTheme.error
  ) : null

  // Setters that work with both data sources
  const setCategories = React.useCallback((
    value: Category[] | ((val: Category[]) => Category[])
  ) => {
    if (usingSupabase) {
      // For Supabase, we'd need to implement batch updates
      console.warn('Supabase category updates not yet implemented')
    } else {
      setLocalCategories(value)
    }
  }, [usingSupabase, setLocalCategories])

  const setAccounts = React.useCallback((
    value: Account[] | ((val: Account[]) => Account[])
  ) => {
    if (usingSupabase) {
      // For Supabase, we'd need to implement batch updates  
      console.warn('Supabase account updates not yet implemented')
    } else {
      setLocalAccounts(value)
    }
  }, [usingSupabase, setLocalAccounts])

  const setTheme = React.useCallback((newTheme: Theme) => {
    if (usingSupabase) {
      // Use the Supabase theme hook
      ;(supabaseTheme as any).setTheme?.(newTheme)
    } else {
      setLocalTheme(newTheme)
    }
  }, [usingSupabase, supabaseTheme, setLocalTheme])

  const setDarkModePreference = React.useCallback((preference: DarkModePreference) => {
    setDarkModePreferenceState(preference)
    setStoredDarkModePreference(preference)
  }, [setDarkModePreferenceState])

  const setDataSource = React.useCallback((source: DataSource) => {
    updateConfig({ primarySource: source })
  }, [updateConfig])

  const syncData = React.useCallback(async () => {
    if (usingSupabase) {
      await Promise.all([
        supabaseAccounts.refetch(),
        supabaseCategories.refetch(),
        supabaseTheme.refetch(),
      ])
    }
  }, [usingSupabase, supabaseAccounts, supabaseCategories, supabaseTheme])

  // Real-time sync control functions
  const enableRealtimeSync = React.useCallback(async () => {
    updateConfig({ enableRealTimeSync: true })
    if (isAuthenticated && config.primarySource === 'supabase') {
      await startRealtimeSync()
    }
  }, [updateConfig, isAuthenticated, config.primarySource, startRealtimeSync])

  const disableRealtimeSync = React.useCallback(() => {
    updateConfig({ enableRealTimeSync: false })
    stopRealtimeSync()
  }, [updateConfig, stopRealtimeSync])

  // Apply theme to DOM
  React.useEffect(() => {
    if (theme) {
      const root = document.documentElement
      const properties = getThemeCssProperties(theme)
      for (const [key, value] of Object.entries(properties)) {
        root.style.setProperty(key, value as string)
      }
    }
  }, [theme])

  // Apply dark mode class to document
  React.useEffect(() => {
    applyDarkModeClass(isDarkMode)
  }, [isDarkMode])

  // Listen for system preference changes
  React.useEffect(() => {
    if (darkModePreference === 'auto') {
      const cleanup = onSystemPreferenceChange(() => {
        // Force re-render when system preference changes
        setDarkModePreferenceState(current => current === 'auto' ? 'auto' : current)
      })
      return cleanup
    }
  }, [darkModePreference, setDarkModePreferenceState])

  const value = React.useMemo(
    () => ({
      // Data
      categories,
      setCategories,
      accounts,
      setAccounts,
      theme,
      setTheme,
      
      // Dark mode
      darkModePreference,
      setDarkModePreference,
      isDarkMode,
      
      // Data source management
      dataSource: config.primarySource,
      setDataSource,
      isLoading,
      error,
      
      // Sync operations
      syncData,
      clearCache,
      
      // Real-time sync
      isRealtimeSyncEnabled: config.enableRealTimeSync,
      isRealtimeSyncActive,
      enableRealtimeSync,
      disableRealtimeSync,
    }),
    [
      categories,
      setCategories,
      accounts, 
      setAccounts,
      theme,
      setTheme,
      darkModePreference,
      setDarkModePreference,
      isDarkMode,
      config.primarySource,
      setDataSource,
      isLoading,
      error,
      syncData,
      clearCache,
      config.enableRealTimeSync,
      isRealtimeSyncActive,
      enableRealtimeSync,
      disableRealtimeSync,
    ]
  )

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = React.useContext(SettingsContext)
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider")
  }
  return context
}

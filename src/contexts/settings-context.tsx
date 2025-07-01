
"use client"

import * as React from "react"

import { useLocalStorage } from "@/hooks/use-local-storage"
import {
  DEFAULT_ACCOUNTS,
  DEFAULT_CATEGORIES,
  DEFAULT_THEME,
} from "@/lib/constants"
import type { Account, Category, Theme } from "@/lib/types"
import { getThemeCssProperties } from "@/lib/theme-utils"

interface SettingsContextType {
  categories: Category[] | null
  setCategories: (
    value: Category[] | ((val: Category[] | null) => Category[])
  ) => void
  accounts: Account[] | null
  setAccounts: (
    value: Account[] | ((val: Account[] | null) => Account[])
  ) => void
}

const SettingsContext = React.createContext<SettingsContextType | undefined>(
  undefined
)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [categories, setCategories] = useLocalStorage<Category[]>(
    "categories",
    DEFAULT_CATEGORIES
  )
  const [accounts, setAccounts] = useLocalStorage<Account[]>(
    "accounts",
    DEFAULT_ACCOUNTS
  )
  const [theme] = useLocalStorage<Theme>("app-theme", DEFAULT_THEME)

  React.useEffect(() => {
    if (theme) {
      const root = document.documentElement
      const properties = getThemeCssProperties(theme)
      for (const [key, value] of Object.entries(properties)) {
        root.style.setProperty(key, value as string)
      }
    }
  }, [theme])

  const value = React.useMemo(
    () => ({
      categories,
      setCategories,
      accounts,
      setAccounts,
    }),
    [categories, setCategories, accounts, setAccounts]
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

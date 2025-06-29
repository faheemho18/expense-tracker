
"use client"

import * as React from "react"

import { useLocalStorage } from "@/hooks/use-local-storage"
import {
  DEFAULT_ACCOUNT_TYPES,
  DEFAULT_CATEGORIES,
} from "@/lib/constants"
import type { AccountType, Category, CategoryThreshold } from "@/lib/types"

interface SettingsContextType {
  categories: Category[] | null
  setCategories: (
    value: Category[] | ((val: Category[] | null) => Category[])
  ) => void
  accountTypes: AccountType[] | null
  setAccountTypes: (
    value: AccountType[] | ((val: AccountType[] | null) => AccountType[])
  ) => void
  categoryThresholds: CategoryThreshold[] | null
  setCategoryThresholds: (
    value:
      | CategoryThreshold[]
      | ((val: CategoryThreshold[] | null) => CategoryThreshold[])
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
  const [accountTypes, setAccountTypes] = useLocalStorage<AccountType[]>(
    "accountTypes",
    DEFAULT_ACCOUNT_TYPES
  )
  const [categoryThresholds, setCategoryThresholds] = useLocalStorage<
    CategoryThreshold[]
  >("categoryThresholds", [])

  const value = {
    categories,
    setCategories,
    accountTypes,
    setAccountTypes,
    categoryThresholds,
    setCategoryThresholds,
  }

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

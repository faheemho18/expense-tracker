import {
  Utensils,
  ShoppingBag,
  Car,
  Home,
  HeartPulse,
  Film,
  Grip,
  BookOpen,
  Gift,
  Settings,
  Banknote,
  Landmark,
  CreditCard,
  Wallet,
} from "lucide-react"

import type { AccountType, Category } from "./types"

export const ICONS = {
  Utensils,
  ShoppingBag,
  Car,
  Home,
  HeartPulse,
  Film,
  Grip,
  BookOpen,
  Gift,
  Settings,
  Banknote,
  Landmark,
  CreditCard,
  Wallet,
} as const

export type IconName = keyof typeof ICONS

export const DEFAULT_CATEGORIES: Category[] = [
  { value: "food", label: "Food & Dining", icon: "Utensils" },
  { value: "shopping", label: "Shopping", icon: "ShoppingBag" },
  { value: "transport", label: "Transportation", icon: "Car" },
  { value: "housing", label: "Housing", icon: "Home" },
  { value: "health", label: "Health & Wellness", icon: "HeartPulse" },
  { value: "entertainment", label: "Entertainment", icon: "Film" },
  { value: "education", label: "Education", icon: "BookOpen" },
  { value: "gifts", label: "Gifts & Donations", icon: "Gift" },
  { value: "other", label: "Other", icon: "Grip" },
]

export const DEFAULT_ACCOUNT_TYPES: AccountType[] = [
  { value: "cash", label: "Cash" },
  { value: "credit", label: "Credit Card" },
  { value: "debit", label: "Debit Card" },
  { value: "bank", label: "Bank Transfer" },
]

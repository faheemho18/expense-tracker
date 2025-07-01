
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

import type { Account, Category } from "./types"

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
  { value: "food", label: "Food & Dining", icon: "Utensils", color: "#FF6384" },
  {
    value: "shopping",
    label: "Shopping",
    icon: "ShoppingBag",
    color: "#36A2EB",
  },
  {
    value: "transport",
    label: "Transportation",
    icon: "Car",
    color: "#FFCE56",
  },
  { value: "housing", label: "Housing", icon: "Home", color: "#4BC0C0" },
  {
    value: "health",
    label: "Health & Wellness",
    icon: "HeartPulse",
    color: "#9966FF",
  },
  {
    value: "entertainment",
    label: "Entertainment",
    icon: "Film",
    color: "#FF9F40",
  },
  {
    value: "education",
    label: "Education",
    icon: "BookOpen",
    color: "#607D8B",
  },
  {
    value: "gifts",
    label: "Gifts & Donations",
    icon: "Gift",
    color: "#F7B2AD",
  },
  { value: "other", label: "Other", icon: "Grip", color: "#8C8C8C" },
]

export const DEFAULT_ACCOUNTS: Account[] = [
  {
    value: "primary-checking",
    label: "Primary Checking",
    icon: "Landmark",
    owner: "Me",
  },
  {
    value: "joint-savings",
    label: "Joint Savings",
    icon: "Banknote",
    owner: "Joint",
  },
  {
    value: "main-credit-card",
    label: "Main Credit Card",
    icon: "CreditCard",
    owner: "Me",
  },
  {
    value: "partner-credit-card",
    label: "Partner's Credit Card",
    icon: "CreditCard",
    owner: "Partner",
  },
  { value: "cash-wallet", label: "Cash", icon: "Wallet", owner: "Me" },
]

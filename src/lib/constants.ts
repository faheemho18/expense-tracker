
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

import type { Account, AccountOwner, Category, Theme } from "./types"

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

export const ACCOUNT_OWNERS: AccountOwner[] = ["Fayim", "Nining", "Conjugal"]

export const PRESETS: Theme[] = [
  {
    name: "Default",
    primary: { h: 210, s: 60, l: 50 },
    background: { h: 210, s: 20, l: 95 },
    accent: { h: 180, s: 50, l: 50 },
    radius: 0.75,
  },
  {
    name: "Forest",
    primary: { h: 140, s: 50, l: 40 },
    background: { h: 100, s: 10, l: 96 },
    accent: { h: 40, s: 60, l: 60 },
    radius: 0.5,
  },
  {
    name: "Ocean",
    primary: { h: 220, s: 70, l: 55 },
    background: { h: 210, s: 40, l: 97 },
    accent: { h: 190, s: 80, l: 70 },
    radius: 1.0,
  },
  {
    name: "Sunset",
    primary: { h: 25, s: 80, l: 55 },
    background: { h: 30, s: 50, l: 98 },
    accent: { h: 330, s: 70, l: 65 },
    radius: 0.3,
  },
]

export const DEFAULT_THEME: Theme = PRESETS[0]

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
    owner: "Fayim",
  },
  {
    value: "joint-savings",
    label: "Joint Savings",
    icon: "Banknote",
    owner: "Conjugal",
  },
  {
    value: "main-credit-card",
    label: "Main Credit Card",
    icon: "CreditCard",
    owner: "Fayim",
  },
  {
    value: "partner-credit-card",
    label: "Partner's Credit Card",
    icon: "CreditCard",
    owner: "Nining",
  },
  { value: "cash-wallet", label: "Cash", icon: "Wallet", owner: "Fayim" },
]

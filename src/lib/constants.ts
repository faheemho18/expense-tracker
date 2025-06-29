import {
  Utensils,
  ShoppingBag,
  Car,
  Home,
  HeartPulse,
  Film,
  Grip,
  BookOpen,
  Gift
} from "lucide-react"

import type { Category } from "./types"

export const CATEGORIES: Category[] = [
  { value: "food", label: "Food & Dining", icon: Utensils },
  { value: "shopping", label: "Shopping", icon: ShoppingBag },
  { value: "transport", label: "Transportation", icon: Car },
  { value: "housing", label: "Housing", icon: Home },
  { value: "health", label: "Health & Wellness", icon: HeartPulse },
  { value: "entertainment", label: "Entertainment", icon: Film },
  { value: "education", label: "Education", icon: BookOpen },
  { value: "gifts", label: "Gifts & Donations", icon: Gift },
  { value: "other", label: "Other", icon: Grip },
]

export const ACCOUNT_TYPES = [
  { value: "cash", label: "Cash" },
  { value: "credit", label: "Credit Card" },
  { value: "debit", label: "Debit Card" },
  { value: "bank", label: "Bank Transfer" },
] as const;


import type { LucideIcon } from "lucide-react"

export type Category = {
  value: string
  label: string
  icon: string // Corresponds to a key in the ICONS map
  color: string // Hex color string
  threshold?: number
  user_id?: string // Optional for backward compatibility
}

export type AccountOwner = "Fayim" | "Nining" | "Conjugal"

export type Account = {
  value: string
  label: string
  icon: string // Corresponds to a key in the ICONS map
  owner: AccountOwner
  user_id?: string // Optional for backward compatibility
}

export type Expense = {
  id: string
  description: string
  amount: number
  date: string // ISO string
  category: string // category value
  accountTypeId: string
  accountOwner: AccountOwner
  receiptImage?: string // Optional data URI of the receipt image
  user_id?: string // Optional for backward compatibility
}

export type WidgetType =
  | "stats"
  | "category-pie"
  | "over-time-bar"
  | "account-pie"
  | "stacked-area"
  | "heatmap-calendar"
  | "category-gauges"

export type WidgetFilters = {
  year?: string[]
  month?: string[]
  category?: string[]
  accountId?: string[]
}

export type WidgetConfig = {
  id: string
  type: WidgetType
  title: string
  filters?: WidgetFilters
  x?: number
  y?: number
  w?: number
  h?: number
  user_id?: string // Optional for backward compatibility
}

export type HSLColor = {
  h: number
  s: number
  l: number
}

export type Theme = {
  name: string
  primary: HSLColor
  background: HSLColor
  accent: HSLColor
  radius: number
  user_id?: string // Optional for backward compatibility
}

export type User = {
  id: string
  email: string
  name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export type AuthState = {
  user: User | null
  loading: boolean
  error: string | null
}

export type AuthContextType = {
  user: User | null
  loading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name?: string) => Promise<void>
  signOut: () => Promise<void>
  clearError: () => void
  canFallbackToLocalStorage: boolean
  switchToLocalStorage: () => void
}

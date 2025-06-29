
import type { LucideIcon } from "lucide-react"

export type Category = {
  value: string
  label: string
  icon: string // Corresponds to a key in the ICONS map
}

export type AccountType = {
  value: string
  label: string
}

export type Expense = {
  id: string
  description: string
  amount: number
  date: string // ISO string
  category: string // category value
  accountType: string // account type value
}

export type WidgetType =
  | "stats"
  | "category-pie"
  | "over-time-bar"
  | "account-type-pie"
  | "stacked-area"
  | "heatmap-calendar"
  | "category-gauges"

export type WidgetFilters = {
  month?: string[]
  category?: string[]
  accountType?: string[]
}

export type WidgetConfig = {
  id: string
  type: WidgetType
  title: string
  filters?: WidgetFilters
}

export type CategoryThreshold = {
  categoryValue: string
  threshold: number
}

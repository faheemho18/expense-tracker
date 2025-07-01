
import type { LucideIcon } from "lucide-react"

export type Category = {
  value: string
  label: string
  icon: string // Corresponds to a key in the ICONS map
  color: string // Hex color string
  threshold?: number
}

export type Account = {
  value: string
  label: string
  icon: string // Corresponds to a key in the ICONS map
  owner: string
}

export type Expense = {
  id: string
  description: string
  amount: number
  date: string // ISO string
  category: string // category value
  accountTypeId: string
  accountOwner: string
  receiptImage?: string // Optional data URI of the receipt image
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
}

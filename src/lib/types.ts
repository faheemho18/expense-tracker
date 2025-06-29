import type { LucideIcon } from "lucide-react"

export type Category = {
  value: string
  label: string
  icon: LucideIcon
}

export type Expense = {
  id: string
  description: string
  amount: number
  date: string // ISO string
  category: string // category value
}

export type WidgetType = "stats" | "category-pie" | "over-time-bar"

export type WidgetConfig = {
  id: string
  type: WidgetType
  title: string
}

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { LucideProps } from "lucide-react"

import { ICONS, type IconName } from "./constants"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(
  amount: number,
  notation: "standard" | "compact" = "standard"
) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation,
    maximumFractionDigits: notation === "compact" ? 1 : 2,
  }).format(amount)
}

export function exportToCsv<T extends Record<string, any>>(
  data: T[],
  filename: string
) {
  if (data.length === 0) {
    return
  }

  const headers = Object.keys(data[0])
  const csvRows = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((fieldName) =>
          JSON.stringify(row[fieldName], (_, value) =>
            value === null ? "" : value
          )
        )
        .join(",")
    ),
  ]

  const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\r\n")
  const encodedUri = encodeURI(csvContent)
  const link = document.createElement("a")
  link.setAttribute("href", encodedUri)
  link.setAttribute("download", filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function getIcon(
  name: IconName | string
): React.FC<LucideProps> {
  return ICONS[name as IconName] || ICONS.Grip
}

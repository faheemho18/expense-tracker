
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
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
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

/**
 * Parses a CSV string into an array of objects.
 * Note: This is a simple parser and may not handle all CSV edge cases,
 * such as commas within quoted fields.
 * @param csvText The CSV content as a string.
 * @returns An array of objects.
 */
export function parseCsv<T>(csvText: string): Partial<T>[] {
  const lines = csvText
    .trim()
    .split(/\r\n|\n/)
    .filter((line) => line.trim() !== "")

  if (lines.length < 2) {
    return []
  }

  const headers = lines[0]
    .split(",")
    .map((h) => h.trim().replace(/"/g, ""))

  const rows = lines.slice(1).map((line) => {
    // This regex handles simple cases and quoted fields without escaped quotes inside.
    const values = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || []

    const rowObject: { [key: string]: string } = {}
    headers.forEach((header, index) => {
      if (values[index]) {
        rowObject[header] = values[index].replace(/"/g, "").trim()
      }
    })
    return rowObject as Partial<T>
  })

  return rows
}

export function getIcon(
  name: IconName | string
): React.FC<LucideProps> {
  return ICONS[name as IconName] || ICONS.Grip
}

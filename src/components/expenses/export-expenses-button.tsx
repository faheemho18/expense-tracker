
"use client"

import { Download } from "lucide-react"

import { exportToCsv } from "@/lib/utils"
import type { Expense } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"

interface ExportExpensesButtonProps {
  expenses: Expense[]
}

export function ExportExpensesButton({ expenses }: ExportExpensesButtonProps) {
  const handleExport = () => {
    if (expenses.length === 0) {
      toast({
        title: "No expenses to export",
        description: "There are no expenses matching the current filters.",
        variant: "destructive",
      })
      return
    }

    const dataToExport = expenses.map(({ id, ...rest }) => rest)
    exportToCsv(dataToExport, "expenses.csv")
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      className="w-full"
    >
      <Download className="mr-2 h-4 w-4" />
      Export CSV
    </Button>
  )
}

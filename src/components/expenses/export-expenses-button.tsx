
"use client"

import { Download } from "lucide-react"

import { exportToCsv } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"

interface ExportExpensesButtonProps {
  data: Record<string, any>[]
}

export function ExportExpensesButton({ data }: ExportExpensesButtonProps) {
  const handleExport = () => {
    if (!data || data.length === 0) {
      toast({
        title: "No expenses to export",
        description: "There are no expenses matching the current filters.",
        variant: "destructive",
      })
      return
    }

    exportToCsv(data, "expenses.csv")
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

"use client"

import * as React from "react"
import { PlusCircle } from "lucide-react"

import { useLocalStorage } from "@/hooks/use-local-storage"
import type { Expense, WidgetConfig } from "@/lib/types"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AppLayout } from "@/components/app-layout"
import { AddExpenseSheet } from "@/components/expenses/add-expense-sheet"
import { ExpensesTable } from "@/components/expenses/expenses-table"
import { ExportExpensesButton } from "@/components/expenses/export-expenses-button"

export default function HomePage() {
  const [expenses, setExpenses] = useLocalStorage<Expense[]>("expenses", [])
  const [isSheetOpen, setIsSheetOpen] = React.useState(false)

  const addExpense = (expense: Omit<Expense, "id">) => {
    const newExpense = { ...expense, id: crypto.randomUUID() }
    setExpenses([...expenses, newExpense])
  }

  const deleteExpense = (id: string) => {
    setExpenses(expenses.filter((expense) => expense.id !== id))
  }
  
  // Initialize with some expenses for demo purposes if none exist
  React.useEffect(() => {
    if (expenses === null) {
      setExpenses([]);
    }
  }, [expenses, setExpenses]);
  
  // Initialize with some widgets for demo purposes if none exist
  const [widgets, setWidgets] = useLocalStorage<WidgetConfig[]>("widgets", [])
  React.useEffect(() => {
    if (widgets === null || widgets.length === 0) {
       setWidgets([
        { id: "1", type: "stats", title: "Overview" },
        { id: "2", type: "category-pie", title: "Spending by Category" },
        { id: "3", type: "over-time-bar", title: "Monthly Spending" },
      ]);
    }
  }, [widgets, setWidgets]);


  return (
    <AppLayout>
      <div className="flex-1 space-y-4 p-4 sm:p-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Your Expenses</CardTitle>
            <div className="flex items-center gap-2">
              <ExportExpensesButton expenses={expenses || []} />
              <Button onClick={() => setIsSheetOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Expense
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ExpensesTable expenses={expenses || []} deleteExpense={deleteExpense} />
          </CardContent>
        </Card>
      </div>
      <AddExpenseSheet
        isOpen={isSheetOpen}
        setIsOpen={setIsSheetOpen}
        addExpense={addExpense}
      />
    </AppLayout>
  )
}

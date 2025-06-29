"use client"

import * as React from "react"
import { Plus } from "lucide-react"

import { useLocalStorage } from "@/hooks/use-local-storage"
import type { Expense } from "@/lib/types"

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
    setExpenses((prevExpenses) => [...(prevExpenses || []), newExpense])
  }

  const deleteExpense = (id: string) => {
    setExpenses((prevExpenses) =>
      (prevExpenses || []).filter((expense) => expense.id !== id)
    )
  }

  return (
    <AppLayout>
      <div className="flex-1 space-y-4 p-4 sm:p-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Your Expenses</CardTitle>
            <div className="flex items-center gap-2">
              <ExportExpensesButton expenses={expenses || []} />
            </div>
          </CardHeader>
          <CardContent>
            <ExpensesTable
              expenses={expenses || []}
              deleteExpense={deleteExpense}
            />
          </CardContent>
        </Card>
      </div>
      <Button
        onClick={() => setIsSheetOpen(true)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg"
        size="icon"
      >
        <span className="sr-only">Add Expense</span>
        <Plus className="h-6 w-6" />
      </Button>
      <AddExpenseSheet
        isOpen={isSheetOpen}
        setIsOpen={setIsSheetOpen}
        addExpense={addExpense}
      />
    </AppLayout>
  )
}

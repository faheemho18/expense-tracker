"use client"

import { format } from "date-fns"
import { MoreHorizontal, Trash2 } from "lucide-react"

import { ACCOUNT_TYPES, CATEGORIES } from "@/lib/constants"
import { cn, formatCurrency } from "@/lib/utils"
import type { Expense } from "@/lib/types"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface ExpensesTableProps {
  expenses: Expense[]
  deleteExpense: (id: string) => void
}

export function ExpensesTable({ expenses, deleteExpense }: ExpensesTableProps) {
  const getCategory = (value: string) => {
    return CATEGORIES.find((c) => c.value === value)
  }

  const getAccountTypeLabel = (value: string) => {
    return ACCOUNT_TYPES.find((a) => a.value === value)?.label || "N/A"
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Account</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.length > 0 ? (
            expenses
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .map((expense) => {
              const category = getCategory(expense.category)
              const Icon = category?.icon
              return (
                <TableRow key={expense.id}>
                  <TableCell>{format(new Date(expense.date), "dd MMM, yyyy")}</TableCell>
                  <TableCell className="font-medium">{expense.description}</TableCell>
                  <TableCell>
                    {category && (
                      <Badge variant="outline" className="flex items-center gap-2 max-w-min">
                        {Icon && <Icon className="h-4 w-4" />}
                        {category.label}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{getAccountTypeLabel(expense.accountType)}</TableCell>
                  <TableCell
                    className={cn(
                      "text-right font-mono",
                      expense.amount < 0 ? "text-emerald-600" : "text-destructive"
                    )}
                  >
                    {formatCurrency(expense.amount)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => deleteExpense(expense.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                No expenses recorded yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

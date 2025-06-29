
"use client"

import * as React from "react"

import { useLocalStorage } from "@/hooks/use-local-storage"
import type { Expense } from "@/lib/types"

import { AppLayout } from "@/components/app-layout"
import { ImportDataCard } from "@/components/data/import-data-card"
import { ExportExpensesButton } from "@/components/expenses/export-expenses-button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function DataPage() {
  const [expenses] = useLocalStorage<Expense[]>("expenses", [])

  return (
    <AppLayout>
      <div className="flex-1 space-y-4 p-4 sm:p-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Import & Export Data
        </h1>
        <div className="grid gap-6 lg:grid-cols-2">
          <ImportDataCard />
          <Card>
            <CardHeader>
              <CardTitle>Export Your Data</CardTitle>
              <CardDescription>
                Download a CSV file of all your recorded expenses. This file can
                be used for backups or analysis in other tools.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ExportExpensesButton expenses={expenses || []} />
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}

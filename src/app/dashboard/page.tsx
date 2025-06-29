"use client"

import * as React from "react"
import { Plus } from "lucide-react"
import type { DropResult } from "react-beautiful-dnd"

import { useLocalStorage } from "@/hooks/use-local-storage"
import type { Expense, WidgetConfig } from "@/lib/types"

import { Button } from "@/components/ui/button"
import { AppLayout } from "@/components/app-layout"
import { AddWidgetDialog } from "@/components/dashboard/add-widget-dialog"
import { DashboardGrid } from "@/components/dashboard/dashboard-grid"

export default function DashboardPage() {
  const [expenses, setExpenses] = useLocalStorage<Expense[]>("expenses", [])
  const [widgets, setWidgets] = useLocalStorage<WidgetConfig[]>("widgets", [])
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)

  const addWidget = (widget: Omit<WidgetConfig, "id">) => {
    const newWidget = { ...widget, id: crypto.randomUUID() }
    setWidgets((prev) => [...(prev || []), newWidget])
  }

  const removeWidget = (id: string) => {
    setWidgets((prevWidgets) =>
      (prevWidgets || []).filter((widget) => widget.id !== id)
    )
  }

  const onDragEnd = (result: DropResult) => {
    if (!result.destination || !widgets) {
      return
    }

    const items = Array.from(widgets)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setWidgets(items)
  }

  return (
    <AppLayout>
      <div className="flex-1 space-y-4 p-4 sm:p-8">
        <div className="flex items-center justify-between space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        </div>

        <DashboardGrid
          expenses={expenses || []}
          widgets={widgets || []}
          removeWidget={removeWidget}
          onDragEnd={onDragEnd}
        />
      </div>
      <Button
        onClick={() => setIsDialogOpen(true)}
        className="fixed bottom-6 right-6 z-50 h-16 w-16 rounded-full shadow-lg"
        size="icon"
      >
        <span className="sr-only">Add Widget</span>
        <Plus className="h-6 w-6" />
      </Button>
      <AddWidgetDialog
        isOpen={isDialogOpen}
        setIsOpen={setIsDialogOpen}
        addWidget={addWidget}
      />
    </AppLayout>
  )
}


"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import type { WidgetConfig, WidgetType } from "@/lib/types"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"

const widgetSchema = z.object({
  title: z.string().min(1, "Title is required"),
  type: z.enum(
    [
      "stats",
      "category-pie",
      "over-time-bar",
      "account-type-pie",
      "stacked-area",
      "heatmap-calendar",
      "category-gauges",
    ],
    {
      required_error: "Widget type is required",
    }
  ),
})

type WidgetFormValues = z.infer<typeof widgetSchema>

interface AddWidgetDialogProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  addWidget: (widget: Omit<WidgetConfig, "id">) => void
}

const WIDGET_TYPE_OPTIONS: { value: WidgetType; label: string }[] = [
  { value: "stats", label: "Statistics Cards" },
  { value: "category-pie", label: "Spending by Category (Pie Chart)" },
  { value: "over-time-bar", label: "Spending Over Time (Bar Chart)" },
  { value: "account-type-pie", label: "Spending by Account Type (Pie Chart)" },
  { value: "stacked-area", label: "Monthly Spending Breakdown (Area Chart)" },
  { value: "heatmap-calendar", label: "Yearly Spending Heatmap" },
  { value: "category-gauges", label: "Category Budget Gauges" },
]

export function AddWidgetDialog({
  isOpen,
  setIsOpen,
  addWidget,
}: AddWidgetDialogProps) {
  const [isPending, startTransition] = React.useTransition()

  const form = useForm<WidgetFormValues>({
    resolver: zodResolver(widgetSchema),
    defaultValues: {
      title: "",
    },
  })

  const onSubmit = (values: WidgetFormValues) => {
    startTransition(() => {
      try {
        addWidget(values)
        toast({
          title: "Widget added",
          description: "Your new widget has been added to the dashboard.",
        })
        setIsOpen(false)
        form.reset()
      } catch (error) {
        toast({
          title: "Error",
          description: "Something went wrong. Please try again.",
          variant: "destructive",
        })
      }
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a New Widget</DialogTitle>
          <DialogDescription>
            Choose a widget type and give it a title to add it to your
            dashboard.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Widget Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Monthly Overview" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Widget Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a widget type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {WIDGET_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Add Widget
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

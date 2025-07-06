
"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import type { WidgetConfig, WidgetType } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"
import { MOBILE_SPACING } from "@/utils/mobile-utils"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
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
      "account-pie",
      "stacked-area",
      "heatmap-calendar",
    ],
    {
      required_error: "Widget type is required",
    }
  ),
})

type WidgetFormValues = z.infer<typeof widgetSchema>

interface AddWidgetSheetProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  addWidget: (widget: Pick<WidgetConfig, "title" | "type">) => void
}

const WIDGET_TYPE_OPTIONS: { value: WidgetType; label: string }[] = [
  { value: "stats", label: "Statistics Cards" },
  { value: "category-pie", label: "Spending by Category (Pie Chart)" },
  { value: "over-time-bar", label: "Spending Over Time (Bar Chart)" },
  { value: "account-pie", label: "Spending by Owner (Pie Chart)" },
  { value: "stacked-area", label: "Monthly Spending Breakdown (Area Chart)" },
  { value: "heatmap-calendar", label: "Yearly Spending Heatmap" },
]

export function AddWidgetSheet({
  isOpen,
  setIsOpen,
  addWidget,
}: AddWidgetSheetProps) {
  const [isPending, startTransition] = React.useTransition()
  const isMobile = useIsMobile()

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
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Add a New Widget</SheetTitle>
          <SheetDescription>
            Choose a widget type and give it a title to add it to your
            dashboard.
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className={cn(
              "mt-4",
              isMobile ? "space-y-6" : "space-y-4"
            )}
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={cn(
                    "text-sm font-medium",
                    isMobile ? "text-base" : "text-sm"
                  )}>
                    Widget Title
                  </FormLabel>
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
                  <FormLabel className={cn(
                    "text-sm font-medium",
                    isMobile ? "text-base" : "text-sm"
                  )}>
                    Widget Type
                  </FormLabel>
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
            <div className={cn(
              "flex gap-2 pt-4",
              isMobile ? "flex-col space-y-2" : "flex-row"
            )}>
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                type="button"
                className={cn(
                  isMobile ? "w-full h-12" : "flex-1"
                )}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isPending} 
                className={cn(
                  isMobile ? "w-full h-12" : "flex-1"
                )}
              >
                {isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Add Widget
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}

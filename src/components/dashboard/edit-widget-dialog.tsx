
"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import type { WidgetConfig } from "@/lib/types"
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
import { toast } from "@/hooks/use-toast"

const widgetTitleSchema = z.object({
  title: z.string().min(1, "Title is required"),
})

type WidgetTitleFormValues = z.infer<typeof widgetTitleSchema>

interface EditWidgetDialogProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  widget: WidgetConfig
  updateWidgetTitle: (id: string, title: string) => void
}

export function EditWidgetDialog({
  isOpen,
  setIsOpen,
  widget,
  updateWidgetTitle,
}: EditWidgetDialogProps) {
  const [isPending, startTransition] = React.useTransition()

  const form = useForm<WidgetTitleFormValues>({
    resolver: zodResolver(widgetTitleSchema),
    defaultValues: {
      title: widget.title,
    },
  })

  React.useEffect(() => {
    if (widget) {
      form.reset({ title: widget.title })
    }
  }, [widget, form, isOpen])

  const onSubmit = (values: WidgetTitleFormValues) => {
    startTransition(() => {
      try {
        updateWidgetTitle(widget.id, values.title)
        toast({
          title: "Widget updated",
          description: "Your widget title has been updated.",
        })
        setIsOpen(false)
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
          <DialogTitle>Edit Widget Title</DialogTitle>
          <DialogDescription>
            Update the title for your dashboard widget.
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
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

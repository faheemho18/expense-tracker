
"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { CalendarIcon, Loader2, Camera } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { useSettings } from "@/contexts/settings-context"
import type { Expense } from "@/lib/types"
import { cn, getIcon } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/hooks/use-toast"

const expenseSchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z.coerce.number().refine((val) => val !== 0, "Amount cannot be zero"),
  date: z.date(),
  category: z.string().min(1, "Category is required"),
  accountType: z.string().min(1, "Account type is required"),
  receiptImage: z.string().optional(),
})

type ExpenseFormValues = z.infer<typeof expenseSchema>

interface AddExpenseSheetProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  addExpense: (expense: Omit<Expense, "id">) => void
}

export function AddExpenseSheet({
  isOpen,
  setIsOpen,
  addExpense,
}: AddExpenseSheetProps) {
  const [isPending, startTransition] = React.useTransition()
  const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false)
  const { categories, accountTypes } = useSettings()

  const videoRef = React.useRef<HTMLVideoElement>(null)
  const [showCamera, setShowCamera] = React.useState(false)
  const [hasCameraPermission, setHasCameraPermission] = React.useState<
    boolean | null
  >(null)

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: "",
      amount: 0,
      date: new Date(),
      category: "",
      accountType: "",
      receiptImage: "",
    },
  })

  React.useEffect(() => {
    let stream: MediaStream | null = null
    const getCamera = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("Camera not supported by this browser.")
        }
        stream = await navigator.mediaDevices.getUserMedia({ video: true })
        setHasCameraPermission(true)

        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      } catch (error) {
        console.error("Error accessing camera:", error)
        setHasCameraPermission(false)
        toast({
          variant: "destructive",
          title: "Camera Access Denied",
          description:
            "Please enable camera permissions in your browser settings.",
        })
      }
    }

    if (isOpen && showCamera) {
      getCamera()
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
    }
  }, [isOpen, showCamera])

  const onSubmit = (values: ExpenseFormValues) => {
    startTransition(() => {
      try {
        addExpense({ ...values, date: values.date.toISOString() })
        toast({
          title: "Expense added",
          description: "Your expense has been successfully recorded.",
        })
        setIsOpen(false)
        form.reset()
        setShowCamera(false)
      } catch (error) {
        toast({
          title: "Error",
          description: "Something went wrong. Please try again.",
          variant: "destructive",
        })
      }
    })
  }

  const handleCapture = () => {
    const video = videoRef.current
    if (video) {
      const canvas = document.createElement("canvas")
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const context = canvas.getContext("2d")
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height)
        const dataUrl = canvas.toDataURL("image/jpeg")
        form.setValue("receiptImage", dataUrl, { shouldValidate: true })
        setShowCamera(false)
      }
    }
  }

  const isLoading = !categories || !accountTypes

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          setShowCamera(false)
          form.reset()
        }
        setIsOpen(open)
      }}
    >
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Add New Expense</SheetTitle>
          <SheetDescription>
            Enter the details of your expense. Click save when you're done.
          </SheetDescription>
        </SheetHeader>
        {isLoading ? (
          <div className="mt-4 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="mt-4 space-y-4"
            >
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Coffee with friends"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Enter amount (use negative for refunds)"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <Popover
                      open={isDatePickerOpen}
                      onOpenChange={setIsDatePickerOpen}
                    >
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            field.onChange(date)
                            setIsDatePickerOpen(false)
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => {
                          const Icon = getIcon(category.icon)
                          return (
                            <SelectItem
                              key={category.value}
                              value={category.value}
                            >
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                {category.label}
                              </div>
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="accountType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an account type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {accountTypes.map((accountType) => {
                          const Icon = getIcon(accountType.icon)
                          return (
                            <SelectItem
                              key={accountType.value}
                              value={accountType.value}
                            >
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                {accountType.label}
                              </div>
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="receiptImage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Receipt</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        {!showCamera && !field.value && (
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            onClick={() => setShowCamera(true)}
                            disabled={isPending}
                          >
                            <Camera className="mr-2 h-4 w-4" />
                            Add Receipt
                          </Button>
                        )}

                        {showCamera && (
                          <>
                            <video
                              ref={videoRef}
                              className="w-full aspect-video rounded-md bg-muted"
                              autoPlay
                              muted
                              playsInline
                            />
                            {hasCameraPermission === false && (
                              <Alert variant="destructive">
                                <AlertTitle>Camera Access Required</AlertTitle>
                                <AlertDescription>
                                  Please allow camera access to use this
                                  feature.
                                </AlertDescription>
                              </Alert>
                            )}
                            {hasCameraPermission && (
                              <Button
                                type="button"
                                onClick={handleCapture}
                                className="w-full"
                                disabled={isPending || !hasCameraPermission}
                              >
                                <Camera className="mr-2 h-4 w-4" /> Take Picture
                              </Button>
                            )}
                          </>
                        )}

                        {field.value && !showCamera && (
                          <div className="space-y-2">
                            <img
                              src={field.value}
                              alt="Receipt preview"
                              className="rounded-md max-h-48 w-auto border"
                            />
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  form.setValue("receiptImage", "", {
                                    shouldValidate: true,
                                  })
                                  setShowCamera(true)
                                }}
                                disabled={isPending}
                              >
                                Retake
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                onClick={() => {
                                  form.setValue("receiptImage", "", {
                                    shouldValidate: true,
                                  })
                                }}
                                disabled={isPending}
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Expense
              </Button>
            </form>
          </Form>
        )}
      </SheetContent>
    </Sheet>
  )
}

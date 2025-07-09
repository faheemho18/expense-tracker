
"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { CalendarIcon, Loader2, Camera, Scan } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { useSettings } from "@/contexts/settings-context"
import type { Expense } from "@/lib/types"
import { cn, getIcon } from "@/lib/utils"
import { useReceiptOCR } from "@/hooks/use-receipt-ocr"
import { useIsMobile, useHapticFeedback } from "@/hooks/use-mobile"
import { TOUCH_CLASSES, MOBILE_SPACING } from "@/utils/mobile-utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { ShimmerButton } from "@/components/magicui/shimmer-button"
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
  accountId: z.string().min(1, "Account is required"),
  receiptImage: z.string().optional(),
})

type ExpenseFormValues = z.infer<typeof expenseSchema>

interface AddExpenseSheetProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  addExpense: (expense: Omit<Expense, "id">) => void
  expenseToEdit?: Expense | null
  updateExpense?: (expense: Expense) => void
}

export function AddExpenseSheet({
  isOpen,
  setIsOpen,
  addExpense,
  expenseToEdit,
  updateExpense,
}: AddExpenseSheetProps) {
  const [isPending, startTransition] = React.useTransition()
  const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false)
  const { categories, accounts } = useSettings()
  const { processReceipt, isProcessing: isOCRProcessing } = useReceiptOCR()
  const isMobile = useIsMobile()
  const { vibrate } = useHapticFeedback()

  const videoRef = React.useRef<HTMLVideoElement>(null)
  const [showCamera, setShowCamera] = React.useState(false)
  const [hasCameraPermission, setHasCameraPermission] = React.useState<
    boolean | null
  >(null)

  const isEditMode = !!expenseToEdit

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: "",
      amount: 0,
      date: new Date(),
      category: "",
      accountId: "",
      receiptImage: "",
    },
  })

  React.useEffect(() => {
    if (isOpen) {
      if (isEditMode && expenseToEdit) {
        form.reset({
          description: expenseToEdit.description,
          amount: expenseToEdit.amount,
          date: new Date(expenseToEdit.date),
          category: expenseToEdit.category,
          accountId: expenseToEdit.accountTypeId,
          receiptImage: expenseToEdit.receiptImage || "",
        })
      } else {
        form.reset({
          description: "",
          amount: 0,
          date: new Date(),
          category: "",
          accountId: "",
          receiptImage: "",
        })
      }
    }
  }, [isOpen, isEditMode, expenseToEdit, form])

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
    // Haptic feedback for mobile
    if (isMobile) {
      vibrate(50)
    }
    
    startTransition(() => {
      try {
        if (!accounts) throw new Error("Accounts not loaded")

        const selectedAccount = accounts.find(
          (a) => a.value === values.accountId
        )
        if (!selectedAccount) throw new Error("Selected account not found")

        const expenseData = {
          description: values.description,
          amount: values.amount,
          date: values.date.toISOString(),
          category: values.category,
          receiptImage: values.receiptImage,
          accountTypeId: selectedAccount.value,
          accountOwner: selectedAccount.owner,
        }

        if (isEditMode && updateExpense && expenseToEdit) {
          updateExpense({
            ...expenseData,
            id: expenseToEdit.id,
          })
          toast({
            title: "Expense updated",
            description: "Your expense has been successfully updated.",
          })
        } else {
          addExpense(expenseData)
          toast({
            title: "Expense added",
            description: "Your expense has been successfully recorded.",
          })
        }
        setIsOpen(false)
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
    // Haptic feedback for mobile
    if (isMobile) {
      vibrate(100)
    }
    
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
        
        // Automatically process the receipt
        handleReceiptProcessing(dataUrl)
      }
    }
  }



  const handleReceiptProcessing = async (imageData: string) => {
    try {
      const result = await processReceipt(imageData)
      
      if (result.success && result.extractedData.confidence > 0.3) {
        const { extractedData } = result
        
        // Auto-fill form fields with extracted data
        if (extractedData.amount > 0) {
          form.setValue("amount", extractedData.amount, { shouldValidate: true })
        }
        
        if (extractedData.description) {
          form.setValue("description", extractedData.description, { shouldValidate: true })
        }
        
        if (extractedData.date) {
          try {
            const parsedDate = new Date(extractedData.date)
            if (!isNaN(parsedDate.getTime())) {
              form.setValue("date", parsedDate, { shouldValidate: true })
            }
          } catch (e) {
            console.warn('Could not parse date from receipt:', extractedData.date)
          }
        }
        
        // Try to match and set category if available
        if (extractedData.category && categories) {
          const matchingCategory = categories.find(c => c.value === extractedData.category)
          if (matchingCategory) {
            form.setValue("category", matchingCategory.value, { shouldValidate: true })
          }
        }
        
        toast({
          title: "Receipt Processed",
          description: `Extracted expense data with ${Math.round(extractedData.confidence * 100)}% confidence`,
        })
      } else {
        toast({
          title: "Receipt Processing",
          description: "Could not extract clear data from receipt. Please fill in details manually.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Processing Failed",
        description: "Unable to process receipt. Please enter details manually.",
        variant: "destructive",
      })
    }
  }

  const isLoading = !categories || !accounts

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          setShowCamera(false)
        }
        setIsOpen(open)
      }}
    >
      <SheetContent className={cn(
        "overflow-y-auto",
        isMobile ? "w-full max-w-full" : "w-full max-w-sm"
      )}>
        <SheetHeader className={cn(
          "pb-4",
          isMobile ? "pb-6" : "pb-4"
        )}>
          <SheetTitle className={cn(
            "text-left",
            isMobile ? "text-xl" : "text-lg"
          )}>
            {isEditMode ? "Edit Expense" : "Add New Expense"}
          </SheetTitle>
          <SheetDescription className={cn(
            "text-left",
            isMobile ? "text-base" : "text-sm"
          )}>
            {isEditMode
              ? "Update the details of your expense."
              : "Enter the details of your expense. Click save when you're done."}
          </SheetDescription>
        </SheetHeader>
        {isLoading ? (
          <div className={cn(
            "mt-4",
            isMobile ? "space-y-6" : "space-y-4"
          )}>
            <Skeleton className={cn(
              "w-full",
              isMobile ? "h-12" : "h-10"
            )} />
            <Skeleton className={cn(
              "w-full",
              isMobile ? "h-12" : "h-10"
            )} />
            <Skeleton className={cn(
              "w-full",
              isMobile ? "h-12" : "h-10"
            )} />
            <Skeleton className={cn(
              "w-full",
              isMobile ? "h-12" : "h-10"
            )} />
            <Skeleton className={cn(
              "w-full",
              isMobile ? "h-12" : "h-10"
            )} />
          </div>
        ) : (
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
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={cn(
                      "text-sm font-medium",
                      isMobile ? "text-base" : "text-sm"
                    )}>
                      Description
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Coffee with friends"
                        autoComplete="off"
                        autoCapitalize="sentences"
                        autoCorrect="on"
                        className={cn(
                          TOUCH_CLASSES.TOUCH_TARGET,
                          TOUCH_CLASSES.TOUCH_FEEDBACK,
                          isMobile ? "h-12 text-base" : "h-11 text-sm"
                        )}
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
                    <FormLabel className={cn(
                      "text-sm font-medium",
                      isMobile ? "text-base" : "text-sm"
                    )}>
                      Amount
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        placeholder="Enter amount (use negative for refunds)"
                        autoComplete="transaction-amount"
                        className={cn(
                          TOUCH_CLASSES.TOUCH_TARGET,
                          TOUCH_CLASSES.TOUCH_FEEDBACK,
                          isMobile ? "h-12 text-base" : "h-11 text-sm"
                        )}
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
                    <FormLabel className={cn(
                      "text-sm font-medium",
                      isMobile ? "text-base" : "text-sm"
                    )}>
                      Date
                    </FormLabel>
                    <Popover
                      open={isDatePickerOpen}
                      onOpenChange={setIsDatePickerOpen}
                    >
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal justify-start",
                              !field.value && "text-muted-foreground",
                              TOUCH_CLASSES.TOUCH_TARGET,
                              TOUCH_CLASSES.TOUCH_FEEDBACK,
                              isMobile ? "h-12 text-base" : "h-11 text-sm"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className={cn(
                              "ml-auto opacity-50",
                              isMobile ? "h-5 w-5" : "h-4 w-4"
                            )} />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent 
                        className={cn(
                          "w-auto p-0",
                          isMobile ? "w-screen max-w-sm" : "w-auto"
                        )} 
                        align={isMobile ? "center" : "start"}
                      >
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            field.onChange(date)
                            setIsDatePickerOpen(false)
                            // Haptic feedback for mobile
                            if (isMobile) {
                              vibrate(50)
                            }
                          }}
                          initialFocus
                          className={cn(
                            isMobile ? "text-base" : "text-sm"
                          )}
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
                    <FormLabel className={cn(
                      "text-sm font-medium",
                      isMobile ? "text-base" : "text-sm"
                    )}>
                      Category
                    </FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value)
                        // Haptic feedback for mobile
                        if (isMobile) {
                          vibrate(50)
                        }
                      }}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className={cn(
                          TOUCH_CLASSES.TOUCH_TARGET,
                          TOUCH_CLASSES.TOUCH_FEEDBACK,
                          isMobile ? "h-12 text-base" : "h-11 text-sm"
                        )}>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className={cn(
                        isMobile ? "max-h-[300px]" : "max-h-[200px]"
                      )}>
                        {categories.map((category) => {
                          const Icon = getIcon(category.icon)
                          return (
                            <SelectItem
                              key={category.value}
                              value={category.value}
                              className={cn(
                                TOUCH_CLASSES.TOUCH_TARGET,
                                isMobile ? "py-3 text-base" : "py-2 text-sm"
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <Icon className={cn(
                                  isMobile ? "h-5 w-5" : "h-4 w-4"
                                )} />
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
                name="accountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={cn(
                      "text-sm font-medium",
                      isMobile ? "text-base" : "text-sm"
                    )}>
                      Account
                    </FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value)
                        // Haptic feedback for mobile
                        if (isMobile) {
                          vibrate(50)
                        }
                      }}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className={cn(
                          TOUCH_CLASSES.TOUCH_TARGET,
                          TOUCH_CLASSES.TOUCH_FEEDBACK,
                          isMobile ? "h-12 text-base" : "h-11 text-sm"
                        )}>
                          <SelectValue placeholder="Select an account" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className={cn(
                        isMobile ? "max-h-[300px]" : "max-h-[200px]"
                      )}>
                        {accounts.map((account) => {
                          const Icon = getIcon(account.icon)
                          return (
                            <SelectItem
                              key={account.value}
                              value={account.value}
                              className={cn(
                                TOUCH_CLASSES.TOUCH_TARGET,
                                isMobile ? "py-3 text-base" : "py-2 text-sm"
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <Icon className={cn(
                                  isMobile ? "h-5 w-5" : "h-4 w-4"
                                )} />
                                {account.label} ({account.owner})
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
                    <FormLabel className={cn(
                      "text-sm font-medium",
                      isMobile ? "text-base" : "text-sm"
                    )}>
                      Receipt
                    </FormLabel>
                    <FormControl>
                      <div className={cn(
                        isMobile ? "space-y-4" : "space-y-2"
                      )}>
                        {!showCamera && !field.value && (
                          <Button
                            type="button"
                            variant="outline"
                            className={cn(
                              "w-full",
                              TOUCH_CLASSES.TOUCH_TARGET,
                              TOUCH_CLASSES.TOUCH_FEEDBACK,
                              isMobile ? "h-12 text-base" : "h-11 text-sm"
                            )}
                            onClick={() => {
                              setShowCamera(true)
                              if (isMobile) {
                                vibrate(50)
                              }
                            }}
                            disabled={isPending}
                          >
                            <Camera className={cn(
                              "mr-2",
                              isMobile ? "h-5 w-5" : "h-4 w-4"
                            )} />
                            Add Receipt
                          </Button>
                        )}

                        {showCamera && (
                          <>
                            <video
                              ref={videoRef}
                              className={cn(
                                "w-full rounded-md bg-muted",
                                isMobile ? "aspect-[4/3]" : "aspect-video"
                              )}
                              autoPlay
                              muted
                              playsInline
                            />
                            {hasCameraPermission === false && (
                              <Alert variant="destructive" className={cn(
                                isMobile ? "p-4" : "p-3"
                              )}>
                                <AlertTitle className={cn(
                                  isMobile ? "text-base" : "text-sm"
                                )}>
                                  Camera Access Required
                                </AlertTitle>
                                <AlertDescription className={cn(
                                  isMobile ? "text-sm" : "text-xs"
                                )}>
                                  Please allow camera access to use this feature.
                                </AlertDescription>
                              </Alert>
                            )}
                            {hasCameraPermission && (
                              <div className={cn(
                                "flex gap-2",
                                isMobile ? "flex-col space-y-2" : "flex-row"
                              )}>
                                <Button
                                  type="button"
                                  onClick={handleCapture}
                                  className={cn(
                                    "flex-1",
                                    TOUCH_CLASSES.TOUCH_TARGET,
                                    TOUCH_CLASSES.TOUCH_FEEDBACK,
                                    isMobile ? "h-12 text-base" : "text-sm"
                                  )}
                                  disabled={isPending || !hasCameraPermission}
                                >
                                  <Camera className={cn(
                                    "mr-2",
                                    isMobile ? "h-5 w-5" : "h-4 w-4"
                                  )} />
                                  Take Picture
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => {
                                    setShowCamera(false)
                                    if (isMobile) {
                                      vibrate(50)
                                    }
                                  }}
                                  className={cn(
                                    isMobile ? "h-12 text-base" : "text-sm",
                                    TOUCH_CLASSES.TOUCH_TARGET,
                                    TOUCH_CLASSES.TOUCH_FEEDBACK
                                  )}
                                  disabled={isPending}
                                >
                                  Cancel
                                </Button>
                              </div>
                            )}
                          </>
                        )}

                        {field.value && !showCamera && (
                          <div className={cn(
                            isMobile ? "space-y-4" : "space-y-2"
                          )}>
                            <img
                              src={field.value}
                              alt="Receipt preview"
                              className={cn(
                                "rounded-md w-full border object-cover",
                                isMobile ? "max-h-64" : "max-h-48"
                              )}
                            />
                            <div className={cn(
                              "flex gap-2",
                              isMobile ? "flex-col space-y-2" : "flex-row"
                            )}>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  handleReceiptProcessing(field.value)
                                  if (isMobile) {
                                    vibrate(100)
                                  }
                                }}
                                disabled={isPending || isOCRProcessing}
                                className={cn(
                                  "flex-1",
                                  TOUCH_CLASSES.TOUCH_TARGET,
                                  TOUCH_CLASSES.TOUCH_FEEDBACK,
                                  isMobile ? "h-12 text-base" : "text-sm"
                                )}
                              >
                                {isOCRProcessing ? (
                                  <Loader2 className={cn(
                                    "mr-2 animate-spin",
                                    isMobile ? "h-5 w-5" : "h-4 w-4"
                                  )} />
                                ) : (
                                  <Scan className={cn(
                                    "mr-2",
                                    isMobile ? "h-5 w-5" : "h-4 w-4"
                                  )} />
                                )}
                                Process Receipt
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  form.setValue("receiptImage", "", {
                                    shouldValidate: true,
                                  })
                                  setShowCamera(true)
                                  if (isMobile) {
                                    vibrate(50)
                                  }
                                }}
                                disabled={isPending || isOCRProcessing}
                                className={cn(
                                  TOUCH_CLASSES.TOUCH_TARGET,
                                  TOUCH_CLASSES.TOUCH_FEEDBACK,
                                  isMobile ? "h-12 text-base flex-1" : "text-sm"
                                )}
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
                                  if (isMobile) {
                                    vibrate(50)
                                  }
                                }}
                                disabled={isPending || isOCRProcessing}
                                className={cn(
                                  TOUCH_CLASSES.TOUCH_TARGET,
                                  TOUCH_CLASSES.TOUCH_FEEDBACK,
                                  isMobile ? "h-12 text-base flex-1" : "text-sm"
                                )}
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
              <ShimmerButton 
                type="submit" 
                className={cn(
                  "w-full",
                  TOUCH_CLASSES.TOUCH_TARGET,
                  TOUCH_CLASSES.TOUCH_FEEDBACK,
                  isMobile ? "h-14 text-base font-semibold mt-6" : "h-11 text-sm mt-4"
                )}
                disabled={isPending}
                shimmerColor="#ffffff40"
                background="hsl(var(--primary))"
              >
                {isPending && (
                  <Loader2 className={cn(
                    "mr-2 animate-spin",
                    isMobile ? "h-5 w-5" : "h-4 w-4"
                  )} />
                )}
                {isEditMode ? "Save Changes" : "Save Expense"}
              </ShimmerButton>
            </form>
          </Form>
        )}
      </SheetContent>
    </Sheet>
  )
}

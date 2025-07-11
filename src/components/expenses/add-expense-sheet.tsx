
"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { CalendarIcon, Loader2, Camera, Scan, RotateCcw, X } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { useSettings } from "@/contexts/settings-context"
import type { Expense } from "@/lib/types"
import { cn, getIcon } from "@/lib/utils"
import { useReceiptOCR } from "@/hooks/use-receipt-ocr"
import { useIsMobile, useHapticFeedback } from "@/hooks/use-mobile"
import { useCameraSelection } from "@/hooks/use-camera-selection"
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
  const {
    stream,
    currentFacing,
    hasPermission,
    isLoading: isCameraLoading,
    error: cameraError,
    startCamera,
    stopCamera,
    switchCamera
  } = useCameraSelection()

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
    if (isOpen && showCamera && !stream) {
      // Start with rear camera (environment) by default
      startCamera("environment")
    }

    if (!showCamera && stream) {
      stopCamera()
    }
  }, [isOpen, showCamera, stream, startCamera, stopCamera])

  React.useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  React.useEffect(() => {
    if (cameraError && showCamera) {
      toast({
        variant: "destructive",
        title: "Camera Access Error",
        description: cameraError,
      })
    }
  }, [cameraError, showCamera])

  // Mobile-specific handling for full-screen camera
  React.useEffect(() => {
    if (showCamera && isMobile) {
      // Prevent body scroll when camera is open on mobile
      document.body.style.overflow = 'hidden'
      document.documentElement.style.overflow = 'hidden'
      
      // Force viewport height update on mobile
      const viewport = document.querySelector('meta[name="viewport"]')
      if (viewport) {
        const originalContent = viewport.getAttribute('content')
        viewport.setAttribute('content', 'width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no')
        
        return () => {
          // Restore on cleanup
          document.body.style.overflow = ''
          document.documentElement.style.overflow = ''
          if (originalContent) {
            viewport.setAttribute('content', originalContent)
          }
        }
      }
    }
    
    // Cleanup when camera closes
    if (!showCamera && isMobile) {
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
    }
  }, [showCamera, isMobile])

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
    const video = videoRef.current
    if (video && stream) {
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

  const handleCameraSwitch = async () => {
    if (isMobile) {
      vibrate(50)
    }
    try {
      await switchCamera()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Camera Switch Failed",
        description: "Unable to switch camera. Please try again.",
      })
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
                        {!field.value && (
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


                        {field.value && (
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
                                  if (field.value) {
                                    handleReceiptProcessing(field.value)
                                  }
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

      {/* Full-Screen Camera */}
      {showCamera && (
        <div 
          className={cn(
            "fixed inset-0 bg-black flex flex-col",
            // Mobile-specific styles for proper full-screen
            isMobile ? [
              "z-[9999]", // Higher z-index for mobile
              "min-h-screen", // Ensure full height on mobile
              "w-screen", // Full width override
              "h-screen", // Full height override
              "touch-none", // Prevent scroll on mobile
              "overscroll-none", // Prevent bounce on iOS
            ] : "z-[100]"
          )}
          style={isMobile ? {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100dvh', // Dynamic viewport height for modern mobile browsers
          } : {}}
        >
          {/* Mobile Debug Info (only in development) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="absolute top-16 left-4 z-[60] bg-red-500 text-white text-xs p-2 rounded">
              <div>Mobile: {isMobile ? 'Yes' : 'No'}</div>
              <div>Permission: {hasPermission ? 'Granted' : hasPermission === false ? 'Denied' : 'Pending'}</div>
              <div>Stream: {stream ? 'Active' : 'None'}</div>
              <div>Loading: {isCameraLoading ? 'Yes' : 'No'}</div>
              <div>Error: {cameraError || 'None'}</div>
            </div>
          )}
          
          {/* Camera Video */}
          {stream && hasPermission && (
            <video
              ref={videoRef}
              className={cn(
                "object-cover",
                isMobile ? [
                  "w-screen h-screen", // Full screen on mobile
                  "fixed inset-0", // Ensure it covers everything
                ] : "w-full h-full"
              )}
              autoPlay
              muted
              playsInline
              style={isMobile ? {
                transform: 'translateZ(0)', // Force hardware acceleration
                backfaceVisibility: 'hidden', // Improve mobile performance
              } : {}}
            />
          )}
          
          {/* Loading State */}
          {isCameraLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black">
              <div className="text-white text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4" />
                <p className="text-lg font-medium">Starting camera...</p>
              </div>
            </div>
          )}
          
          {/* Permission Error */}
          {hasPermission === false && (
            <div className="absolute inset-0 flex items-center justify-center bg-black p-6">
              <Alert variant="destructive" className="max-w-md bg-red-900/80 border-red-700 text-white">
                <AlertTitle className="text-lg font-medium mb-2">
                  Camera Access Required
                </AlertTitle>
                <AlertDescription className="text-sm leading-relaxed">
                  {cameraError || "Please allow camera access to capture receipts."}
                </AlertDescription>
              </Alert>
            </div>
          )}
          
          {/* WhatsApp-style Controls */}
          {hasPermission && stream && (
            <>
              {/* Top Controls */}
              <div className={cn(
                "absolute top-0 left-0 right-0 z-50",
                isMobile ? [
                  "pt-safe-top px-4 pb-4", // Use safe area padding
                  "bg-gradient-to-b from-black/50 to-transparent", // Better visibility on mobile
                ] : "p-4 safe-area-top"
              )}>
                <div className="flex items-center justify-between">
                  {/* Close Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setShowCamera(false)
                      if (isMobile) vibrate(50)
                    }}
                    className={cn(
                      "rounded-full bg-black/30 hover:bg-black/50 text-white border-0 backdrop-blur-sm",
                      isMobile ? [
                        "h-14 w-14", // Larger for mobile touch
                        "active:scale-95", // Touch feedback
                        "touch-manipulation", // Better touch handling
                      ] : "h-12 w-12"
                    )}
                  >
                    <X className={cn(isMobile ? "h-7 w-7" : "h-6 w-6")} />
                  </Button>
                  
                  {/* Receipt Mode Indicator */}
                  <div className="bg-black/50 text-white px-4 py-2 rounded-full backdrop-blur-sm">
                    <p className="text-sm font-medium">Receipt Mode</p>
                  </div>
                  
                  <div /> {/* Spacer */}
                </div>
              </div>
              
              {/* Bottom Controls */}
              <div className={cn(
                "absolute bottom-0 left-0 right-0 z-50",
                isMobile ? [
                  "pb-safe-bottom px-4 pt-6", // Use safe area padding for mobile
                  "bg-gradient-to-t from-black/50 to-transparent", // Better visibility
                ] : "p-6 safe-area-bottom"
              )}>
                <div className="flex items-center justify-between">
                  {/* Camera Switch */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCameraSwitch}
                    className={cn(
                      "rounded-full bg-black/30 hover:bg-black/50 text-white border-0 backdrop-blur-sm",
                      "h-14 w-14", // Good size for both desktop and mobile
                      "active:scale-95 touch-manipulation", // Touch feedback
                    )}
                    disabled={isCameraLoading}
                  >
                    <RotateCcw className="h-6 w-6" />
                  </Button>
                  
                  {/* Capture Button */}
                  <Button
                    onClick={handleCapture}
                    disabled={isCameraLoading}
                    className={cn(
                      "rounded-full bg-white hover:bg-gray-100 border-4 border-white shadow-lg shadow-black/30",
                      "transition-transform duration-150 active:scale-95 touch-manipulation",
                      isMobile ? [
                        "h-24 w-24", // Larger on mobile for easier touch
                        "active:bg-gray-200", // Better mobile feedback
                      ] : "h-20 w-20"
                    )}
                    style={{
                      WebkitTapHighlightColor: 'transparent', // Remove mobile tap highlight
                    }}
                  >
                    <Camera className={cn(
                      "text-black",
                      isMobile ? "h-10 w-10" : "h-8 w-8"
                    )} />
                  </Button>
                  
                  {/* Camera Info */}
                  <div className="text-white text-sm bg-black/30 px-3 py-2 rounded-full backdrop-blur-sm">
                    {currentFacing === "environment" ? "Rear" : "Front"}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </Sheet>
  )
}

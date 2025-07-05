
"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { CalendarIcon, Loader2, Camera, Sparkles, CheckCircle, Scan } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { useSettings } from "@/contexts/settings-context"
import type { Expense } from "@/lib/types"
import { cn, getIcon } from "@/lib/utils"
import { useExpenseCategorization } from "@/hooks/use-expense-categorization"
import { useReceiptOCR } from "@/hooks/use-receipt-ocr"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { ShimmerButton } from "@/components/magicui/shimmer-button"
import { PulsatingButton } from "@/components/magicui/pulsating-button"
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
  const { categorizeExpense, isLoading: isCategorizationLoading } = useExpenseCategorization()
  const { processReceipt, isProcessing: isOCRProcessing } = useReceiptOCR()
  const [aiSuggestions, setAiSuggestions] = React.useState<{category: string, confidence: number, reasoning: string}[]>([])
  const [showAiSuggestions, setShowAiSuggestions] = React.useState(false)

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

  const handleAiCategorization = async () => {
    if (!categories) return
    
    const description = form.getValues("description")
    const amount = form.getValues("amount")
    
    if (!description || !amount) {
      toast({
        title: "Missing Information",
        description: "Please enter a description and amount first.",
        variant: "destructive",
      })
      return
    }

    try {
      const result = await categorizeExpense({
        description,
        amount,
        availableCategories: categories,
      })
      
      setAiSuggestions(result.suggestions)
      setShowAiSuggestions(true)
      
      // Auto-apply the primary suggestion if confidence is high
      if (result.primarySuggestion.confidence > 0.8) {
        form.setValue("category", result.primarySuggestion.category, { shouldValidate: true })
        toast({
          title: "Category Suggested",
          description: `AI categorized as "${categories.find(c => c.value === result.primarySuggestion.category)?.label}" with ${Math.round(result.primarySuggestion.confidence * 100)}% confidence.`,
        })
      }
    } catch (error) {
      toast({
        title: "Categorization Failed",
        description: "Unable to categorize expense. Please select manually.",
        variant: "destructive",
      })
    }
  }

  const applySuggestion = (categoryValue: string) => {
    form.setValue("category", categoryValue, { shouldValidate: true })
    setShowAiSuggestions(false)
    
    const categoryName = categories?.find(c => c.value === categoryValue)?.label
    toast({
      title: "Category Applied",
      description: `Set category to "${categoryName}"`,
    })
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
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {isEditMode ? "Edit Expense" : "Add New Expense"}
          </SheetTitle>
          <SheetDescription>
            {isEditMode
              ? "Update the details of your expense."
              : "Enter the details of your expense. Click save when you're done."}
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
                    <div className="flex items-center justify-between">
                      <FormLabel>Category</FormLabel>
                      <PulsatingButton
                        type="button"
                        onClick={handleAiCategorization}
                        disabled={isCategorizationLoading || isPending}
                        className="h-auto px-2 py-1 text-xs"
                        pulseColor="#8b5cf6"
                        duration="2s"
                      >
                        {isCategorizationLoading ? (
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        ) : (
                          <Sparkles className="mr-1 h-3 w-3" />
                        )}
                        AI Suggest
                      </PulsatingButton>
                    </div>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value)
                        setShowAiSuggestions(false)
                      }}
                      defaultValue={field.value}
                      value={field.value}
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
                    
                    {showAiSuggestions && aiSuggestions.length > 0 && (
                      <div className="mt-2 space-y-2">
                        <div className="text-sm text-muted-foreground">AI Suggestions:</div>
                        {aiSuggestions.map((suggestion, index) => {
                          const category = categories.find(c => c.value === suggestion.category)
                          if (!category) return null
                          
                          const Icon = getIcon(category.icon)
                          const confidenceColor = suggestion.confidence > 0.8 
                            ? "text-green-600" 
                            : suggestion.confidence > 0.6 
                            ? "text-yellow-600" 
                            : "text-orange-600"
                          
                          return (
                            <div
                              key={index}
                              className="flex items-center justify-between p-2 rounded-md border cursor-pointer hover:bg-muted/50"
                              onClick={() => applySuggestion(suggestion.category)}
                            >
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                <span className="text-sm font-medium">{category.label}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={cn("text-xs font-medium", confidenceColor)}>
                                  {Math.round(suggestion.confidence * 100)}%
                                </span>
                                {suggestion.confidence > 0.8 && (
                                  <CheckCircle className="h-3 w-3 text-green-600" />
                                )}
                              </div>
                            </div>
                          )
                        })}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowAiSuggestions(false)}
                          className="w-full text-xs"
                        >
                          Hide suggestions
                        </Button>
                      </div>
                    )}
                    
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="accountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an account" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {accounts.map((account) => {
                          const Icon = getIcon(account.icon)
                          return (
                            <SelectItem
                              key={account.value}
                              value={account.value}
                            >
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4" />
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
                                onClick={() => handleReceiptProcessing(field.value)}
                                disabled={isPending || isOCRProcessing}
                                className="flex-1"
                              >
                                {isOCRProcessing ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <Scan className="mr-2 h-4 w-4" />
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
                                }}
                                disabled={isPending || isOCRProcessing}
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
                                disabled={isPending || isOCRProcessing}
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
                className="w-full" 
                disabled={isPending}
                shimmerColor="#ffffff40"
                background="hsl(var(--primary))"
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditMode ? "Save Changes" : "Save Expense"}
              </ShimmerButton>
            </form>
          </Form>
        )}
      </SheetContent>
    </Sheet>
  )
}

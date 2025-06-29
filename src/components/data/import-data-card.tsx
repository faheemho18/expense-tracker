
"use client"

import * as React from "react"
import { z } from "zod"
import { Upload, Loader2, AlertTriangle } from "lucide-react"

import { useLocalStorage } from "@/hooks/use-local-storage"
import type { Expense } from "@/lib/types"
import { parseCsv } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { toast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// Zod schema to validate each row of the imported CSV
const expenseImportSchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z.coerce.number().refine((val) => val !== 0, "Amount cannot be zero"),
  date: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date format" }),
  category: z.string().min(1, "Category is required"),
  accountType: z.string().min(1, "Account type is required"),
})

type ImportedExpense = z.infer<typeof expenseImportSchema>

export function ImportDataCard() {
  const [expenses, setExpenses] = useLocalStorage<Expense[]>("expenses", [])
  const [isPending, startTransition] = React.useTransition()
  const [file, setFile] = React.useState<File | null>(null)
  const [isAlertOpen, setIsAlertOpen] = React.useState(false)
  const [parsedData, setParsedData] = React.useState<ImportedExpense[]>([])
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
    }
  }

  const handleImportClick = () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please choose a CSV file to import.",
        variant: "destructive",
      })
      return
    }

    startTransition(() => {
      const reader = new FileReader()
      reader.onload = async (event) => {
        const text = event.target?.result as string
        try {
          const parsed = parseCsv(text)
          const validationResult = z.array(expenseImportSchema).safeParse(parsed)

          if (!validationResult.success) {
            console.error(validationResult.error)
            toast({
              title: "Import Failed",
              description:
                "The CSV file has invalid data or incorrect formatting.",
              variant: "destructive",
            })
            return
          }

          setParsedData(validationResult.data)
          setIsAlertOpen(true)
        } catch (error) {
          console.error(error)
          toast({
            title: "Import Error",
            description: "An unexpected error occurred while parsing the file.",
            variant: "destructive",
          })
        }
      }
      reader.readAsText(file)
    })
  }

  const handleImportConfirm = (mode: "replace" | "augment") => {
    startTransition(() => {
      const newExpenses = parsedData.map((exp) => ({
        ...exp,
        id: crypto.randomUUID(),
        date: new Date(exp.date).toISOString(), // Ensure date is ISO string
      }))

      if (mode === "replace") {
        setExpenses(newExpenses)
      } else {
        setExpenses((prevExpenses) => [...(prevExpenses || []), ...newExpenses])
      }

      toast({
        title: "Import Successful",
        description: `${newExpenses.length} expenses have been ${
          mode === "replace" ? "imported" : "added"
        }.`,
      })

      // Reset state
      setFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      setParsedData([])
      setIsAlertOpen(false)
    })
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Import Data from CSV</CardTitle>
          <CardDescription>
            Upload a CSV file to add expenses. Ensure your file has headers:
            `description`, `amount`, `date`, `category`, `accountType`.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            ref={fileInputRef}
            disabled={isPending}
          />
          <Button
            onClick={handleImportClick}
            disabled={!file || isPending}
            className="w-full"
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            Import
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Choose Import Mode</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to import{" "}
              <span className="font-bold">{parsedData.length}</span> expenses.
              How would you like to add them?
              <div className="mt-4 rounded-lg border border-yellow-300 bg-yellow-50 p-3 text-yellow-900">
                <div className="flex items-start">
                  <AlertTriangle className="mr-2 mt-0.5 h-4 w-4" />
                  <p className="text-sm">
                    <strong>Warning:</strong> 'Replace' will permanently delete
                    all your current expense data. This action cannot be undone.
                  </p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <Button
              variant="secondary"
              onClick={() => handleImportConfirm("augment")}
              disabled={isPending}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Augment (Add to existing)
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleImportConfirm("replace")}
              disabled={isPending}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Replace (Delete all and import)
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

import { supabase } from './supabase'
import { Account, Category, Expense, Theme } from './types'

// Helper to get data from local storage
const getLocalStorageData = <T>(key: string): T[] => {
  if (typeof window === 'undefined') return []
  const item = window.localStorage.getItem(key)
  return item ? JSON.parse(item) : []
}

// Helper to get single item from local storage
const getLocalStorageItem = <T>(key: string): T | null => {
  if (typeof window === 'undefined') return null
  const item = window.localStorage.getItem(key)
  return item ? JSON.parse(item) : null
}

export const migrateData = async () => {
  console.log('Starting data migration...')

  if (!supabase) {
    throw new Error('Supabase not configured. Cannot perform migration.')
  }

  try {
    // 1. Migrate Accounts
    const localAccounts: Account[] = getLocalStorageData('accounts')
    const { data: insertedAccounts, error: accountsError } = await supabase
      .from('accounts')
      .upsert(localAccounts.map(acc => ({
        value: acc.value,
        label: acc.label,
        icon: acc.icon,
        owner: acc.owner,
      })))
      .select()

    if (accountsError) throw accountsError
    console.log('Accounts migrated:', insertedAccounts?.length)

    const accountMap = new Map<string, string>()
    insertedAccounts?.forEach(acc => accountMap.set(acc.value, acc.id))

    // 2. Migrate Categories
    const localCategories: Category[] = getLocalStorageData('categories')
    const { data: insertedCategories, error: categoriesError } = await supabase
      .from('categories')
      .upsert(localCategories.map(cat => ({
        value: cat.value,
        label: cat.label,
        icon: cat.icon,
        color: cat.color,
        threshold: cat.threshold,
      })))
      .select()

    if (categoriesError) throw categoriesError
    console.log('Categories migrated:', insertedCategories?.length)

    const categoryMap = new Map<string, string>()
    insertedCategories?.forEach(cat => categoryMap.set(cat.value, cat.id))

    // 3. Migrate Theme
    const localTheme: Theme | null = getLocalStorageItem('app-theme')
    if (localTheme) {
      const { data: insertedTheme, error: themeError } = await supabase
        .from('themes')
        .upsert({
          name: localTheme.name,
          primary_hue: localTheme.primary.h,
          primary_saturation: localTheme.primary.s,
          primary_lightness: localTheme.primary.l,
          background_hue: localTheme.background.h,
          background_saturation: localTheme.background.s,
          background_lightness: localTheme.background.l,
          accent_hue: localTheme.accent.h,
          accent_saturation: localTheme.accent.s,
          accent_lightness: localTheme.accent.l,
          radius: localTheme.radius,
        })
        .select()

      if (themeError) throw themeError
      console.log('Theme migrated:', insertedTheme?.length)
    } else {
      console.log('No theme found to migrate')
    }

    // 4. Migrate Expenses
    const localExpenses: Expense[] = getLocalStorageData('expenses')
    const expensesToInsert = localExpenses.map(exp => {
      const category_id = categoryMap.get(exp.category)
      const account_id = accountMap.get(exp.accountTypeId)

      if (!category_id) {
        console.warn(`Category ID not found for category: ${exp.category}`)
      }
      if (!account_id) {
        console.warn(`Account ID not found for account: ${exp.accountTypeId}`)
      }

      return {
        description: exp.description,
        amount: exp.amount,
        date: exp.date, // Assuming date is already in a format Supabase can handle (e.g., ISO string)
        category_id: category_id,
        account_id: account_id,
        receipt_image: exp.receiptImage || null,
      }
    }).filter(exp => exp.category_id && exp.account_id) // Only insert if category and account are found

    if (expensesToInsert.length > 0) {
      const { error: expensesError } = await supabase
        .from('expenses')
        .insert(expensesToInsert)

      if (expensesError) throw expensesError
      console.log('Expenses migrated:', expensesToInsert.length)
    } else {
      console.log('No expenses to migrate or all expenses filtered out.')
    }

    // Optional: Clear local storage after successful migration
    // window.localStorage.clear()
    console.log('Data migration complete.')
  } catch (error) {
    console.error('Error during data migration:', error)
  }
}

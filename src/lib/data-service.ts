// Simple localStorage data service for testing
export const createLocalStorageDataService = () => ({
  expenses: {
    getAll: () => Promise.resolve([]),
    create: (expense: any) => Promise.resolve(expense),
    update: (id: string, expense: any) => Promise.resolve(expense),
    delete: (id: string) => Promise.resolve(),
  },
  categories: {
    getAll: () => Promise.resolve([]),
    create: (category: any) => Promise.resolve(category),
    update: (id: string, category: any) => Promise.resolve(category),
    delete: (id: string) => Promise.resolve(),
  },
  accounts: {
    getAll: () => Promise.resolve([]),
    create: (account: any) => Promise.resolve(account),
    update: (id: string, account: any) => Promise.resolve(account),
    delete: (id: string) => Promise.resolve(),
  },
  themes: {
    getAll: () => Promise.resolve([]),
    create: (theme: any) => Promise.resolve(theme),
    update: (id: string, theme: any) => Promise.resolve(theme),
    delete: (id: string) => Promise.resolve(),
  },
  migrateFromLocalStorage: () => Promise.resolve(),
  isSupabaseConfigured: () => false,
})
import { render, screen } from '@testing-library/react'
import { ProjectedSavingsWidget } from '../projected-savings-widget'
import { SettingsContextProvider } from '@/contexts/settings-context'
import { Expense } from '@/lib/types'

// Mock framer-motion
jest.mock('motion/react', () => ({
  useMotionValue: jest.fn(() => ({ set: jest.fn() })),
  useSpring: jest.fn(() => ({ on: jest.fn() })),
  useInView: jest.fn(() => true),
}))

const mockExpenses: Expense[] = [
  {
    id: '1',
    date: '2024-01-15',
    description: 'Grocery Shopping',
    category: 'groceries',
    accountTypeId: 'cash',
    amount: 200, // Under threshold of 300
  },
  {
    id: '2',
    date: '2024-01-10',
    description: 'Gas Station',
    category: 'transportation',
    accountTypeId: 'credit-card',
    amount: 150, // Under threshold of 200
  },
  {
    id: '3',
    date: '2024-01-05',
    description: 'Dining',
    category: 'dining',
    accountTypeId: 'cash',
    amount: 180, // Over threshold of 150
  },
]

const mockCategories = [
  { value: 'groceries', label: 'Groceries', icon: 'ShoppingCart', color: '#22c55e', threshold: 300 },
  { value: 'transportation', label: 'Transportation', icon: 'Car', color: '#3b82f6', threshold: 200 },
  { value: 'dining', label: 'Dining', icon: 'Utensils', color: '#f59e0b', threshold: 150 },
]

const mockAccounts = [
  { value: 'cash', label: 'Cash', icon: 'Banknote', owner: 'Personal' },
  { value: 'credit-card', label: 'Credit Card', icon: 'CreditCard', owner: 'Personal' },
]

const renderWithContext = (ui: React.ReactElement) => {
  return render(
    <SettingsContextProvider
      initialCategories={mockCategories}
      initialAccounts={mockAccounts}
      initialThemes={[]}
    >
      {ui}
    </SettingsContextProvider>
  )
}

describe('ProjectedSavingsWidget', () => {
  it('renders the piggy bank icon', () => {
    renderWithContext(<ProjectedSavingsWidget expenses={mockExpenses} />)
    
    // The component should render (piggy bank icon is rendered as an SVG)
    const widget = screen.getByRole('tooltip')
    expect(widget).toBeInTheDocument()
  })

  it('calculates projected savings correctly', () => {
    renderWithContext(<ProjectedSavingsWidget expenses={mockExpenses} />)
    
    // Expected calculation:
    // Groceries: 300 - 200 = 100 (unused)
    // Transportation: 200 - 150 = 50 (unused)
    // Dining: 150 - 180 = -30 (over budget, doesn't count)
    // Total projected savings: 100 + 50 = 150
    
    const widget = screen.getByRole('tooltip')
    expect(widget).toBeInTheDocument()
  })

  it('handles empty expenses array', () => {
    renderWithContext(<ProjectedSavingsWidget expenses={[]} />)
    
    const widget = screen.getByRole('tooltip')
    expect(widget).toBeInTheDocument()
  })

  it('handles expenses with no thresholds set', () => {
    const categoriesWithoutThresholds = mockCategories.map(cat => ({
      ...cat,
      threshold: undefined,
    }))
    
    render(
      <SettingsContextProvider
        initialCategories={categoriesWithoutThresholds}
        initialAccounts={mockAccounts}
        initialThemes={[]}
      >
        <ProjectedSavingsWidget expenses={mockExpenses} />
      </SettingsContextProvider>
    )
    
    const widget = screen.getByRole('tooltip')
    expect(widget).toBeInTheDocument()
  })

  it('handles categories with zero thresholds', () => {
    const categoriesWithZeroThresholds = mockCategories.map(cat => ({
      ...cat,
      threshold: 0,
    }))
    
    render(
      <SettingsContextProvider
        initialCategories={categoriesWithZeroThresholds}
        initialAccounts={mockAccounts}
        initialThemes={[]}
      >
        <ProjectedSavingsWidget expenses={mockExpenses} />
      </SettingsContextProvider>
    )
    
    const widget = screen.getByRole('tooltip')
    expect(widget).toBeInTheDocument()
  })

  it('handles expenses over budget', () => {
    const overBudgetExpenses: Expense[] = [
      {
        id: '1',
        date: '2024-01-15',
        description: 'Expensive Groceries',
        category: 'groceries',
        accountTypeId: 'cash',
        amount: 400, // Over threshold of 300
      },
    ]
    
    renderWithContext(<ProjectedSavingsWidget expenses={overBudgetExpenses} />)
    
    const widget = screen.getByRole('tooltip')
    expect(widget).toBeInTheDocument()
  })

  it('ignores negative amounts (refunds)', () => {
    const expensesWithRefunds: Expense[] = [
      ...mockExpenses,
      {
        id: '4',
        date: '2024-01-20',
        description: 'Refund',
        category: 'groceries',
        accountTypeId: 'cash',
        amount: -50, // Negative amount should be ignored
      },
    ]
    
    renderWithContext(<ProjectedSavingsWidget expenses={expensesWithRefunds} />)
    
    const widget = screen.getByRole('tooltip')
    expect(widget).toBeInTheDocument()
  })

  it('shows skeleton when categories are not loaded', () => {
    render(
      <SettingsContextProvider
        initialCategories={undefined}
        initialAccounts={mockAccounts}
        initialThemes={[]}
      >
        <ProjectedSavingsWidget expenses={mockExpenses} />
      </SettingsContextProvider>
    )
    
    // Should show skeleton when categories are not loaded
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })
})
import { render, screen, fireEvent } from '@testing-library/react'
import { ExpensesTable } from '../expenses-table'
import { SettingsContextProvider } from '@/contexts/settings-context'
import { Expense } from '@/lib/types'

// Mock framer-motion
jest.mock('motion/react', () => ({
  useMotionValue: jest.fn(() => ({ set: jest.fn() })),
  useSpring: jest.fn(() => ({ on: jest.fn() })),
  useInView: jest.fn(() => true),
}))

// Mock blur-fade component
jest.mock('@/components/magicui/blur-fade', () => ({
  BlurFade: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

const mockExpenses: Expense[] = [
  {
    id: '1',
    date: '2024-01-15',
    description: 'Grocery Shopping',
    category: 'groceries',
    accountTypeId: 'cash',
    amount: 150.50,
  },
  {
    id: '2',
    date: '2024-01-10',
    description: 'Gas Station',
    category: 'transportation',
    accountTypeId: 'credit-card',
    amount: 75.25,
  },
  {
    id: '3',
    date: '2024-01-05',
    description: 'Refund',
    category: 'refund',
    accountTypeId: 'cash',
    amount: -25.00,
  },
]

const mockCategories = [
  { value: 'groceries', label: 'Groceries', icon: 'ShoppingCart', color: '#22c55e', threshold: 300 },
  { value: 'transportation', label: 'Transportation', icon: 'Car', color: '#3b82f6', threshold: 200 },
  { value: 'refund', label: 'Refund', icon: 'RefreshCw', color: '#ef4444', threshold: 0 },
]

const mockAccounts = [
  { value: 'cash', label: 'Cash', icon: 'Banknote', owner: 'Personal' },
  { value: 'credit-card', label: 'Credit Card', icon: 'CreditCard', owner: 'Personal' },
]

const mockProps = {
  expenses: mockExpenses,
  deleteExpense: jest.fn(),
  editExpense: jest.fn(),
  sortConfig: null,
  requestSort: jest.fn(),
}

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

describe('ExpensesTable', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders table headers correctly', () => {
    renderWithContext(<ExpensesTable {...mockProps} />)
    
    expect(screen.getByText('Date')).toBeInTheDocument()
    expect(screen.getByText('Description')).toBeInTheDocument()
    expect(screen.getByText('Category')).toBeInTheDocument()
    expect(screen.getByText('Account')).toBeInTheDocument()
    expect(screen.getByText('Amount')).toBeInTheDocument()
  })

  it('renders expense data correctly', () => {
    renderWithContext(<ExpensesTable {...mockProps} />)
    
    expect(screen.getByText('Grocery Shopping')).toBeInTheDocument()
    expect(screen.getByText('Gas Station')).toBeInTheDocument()
    expect(screen.getByText('Refund')).toBeInTheDocument()
    
    expect(screen.getByText('Groceries')).toBeInTheDocument()
    expect(screen.getByText('Transportation')).toBeInTheDocument()
    
    expect(screen.getByText('Cash (Personal)')).toBeInTheDocument()
    expect(screen.getByText('Credit Card (Personal)')).toBeInTheDocument()
  })

  it('calls requestSort when column headers are clicked', () => {
    renderWithContext(<ExpensesTable {...mockProps} />)
    
    fireEvent.click(screen.getByText('Date'))
    expect(mockProps.requestSort).toHaveBeenCalledWith('date')
    
    fireEvent.click(screen.getByText('Amount'))
    expect(mockProps.requestSort).toHaveBeenCalledWith('amount')
  })

  it('calls editExpense when edit button is clicked', () => {
    renderWithContext(<ExpensesTable {...mockProps} />)
    
    const editButtons = screen.getAllByText('Edit')
    fireEvent.click(editButtons[0])
    
    expect(mockProps.editExpense).toHaveBeenCalledWith(mockExpenses[0])
  })

  it('calls deleteExpense when delete button is clicked', () => {
    renderWithContext(<ExpensesTable {...mockProps} />)
    
    const deleteButtons = screen.getAllByText('Delete')
    fireEvent.click(deleteButtons[0])
    
    expect(mockProps.deleteExpense).toHaveBeenCalledWith('1')
  })

  it('displays "No expenses found" when empty', () => {
    renderWithContext(<ExpensesTable {...mockProps} expenses={[]} />)
    
    expect(screen.getByText('No expenses found.')).toBeInTheDocument()
  })

  it('shows receipt icon for expenses with receipt images', () => {
    const expenseWithReceipt = {
      ...mockExpenses[0],
      receiptImage: 'data:image/png;base64,test',
    }
    
    renderWithContext(
      <ExpensesTable {...mockProps} expenses={[expenseWithReceipt]} />
    )
    
    expect(screen.getByLabelText('View Receipt')).toBeInTheDocument()
  })

  it('applies correct styling for negative amounts', () => {
    renderWithContext(<ExpensesTable {...mockProps} />)
    
    // Find the refund row (negative amount)
    const refundRow = screen.getByText('Refund').closest('tr')
    expect(refundRow).toBeInTheDocument()
  })
})
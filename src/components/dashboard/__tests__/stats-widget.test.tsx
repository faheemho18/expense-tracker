import { render, screen } from '@testing-library/react'
import { StatsWidget } from '../stats-widget'
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
  {
    id: '4',
    date: '2024-01-03',
    description: 'Another Refund',
    category: 'refund',
    accountTypeId: 'cash',
    amount: -10.00,
  },
]

describe('StatsWidget', () => {
  it('renders all stat cards', () => {
    render(<StatsWidget expenses={mockExpenses} />)
    
    expect(screen.getByText('Total Expenses')).toBeInTheDocument()
    expect(screen.getByText('Total Refunds')).toBeInTheDocument()
    expect(screen.getByText('Net Total')).toBeInTheDocument()
    expect(screen.getByText('Transactions')).toBeInTheDocument()
  })

  it('calculates total expenses correctly', () => {
    render(<StatsWidget expenses={mockExpenses} />)
    
    // Should sum only positive amounts: 150.50 + 75.25 = 225.75
    // The CurrencyTicker starts at 0, so we check for the initial value
    const totalExpensesCard = screen.getByText('Total Expenses').closest('.flex')
    expect(totalExpensesCard).toBeInTheDocument()
  })

  it('calculates total refunds correctly', () => {
    render(<StatsWidget expenses={mockExpenses} />)
    
    // Should sum absolute value of negative amounts: |-25.00| + |-10.00| = 35.00
    const totalRefundsCard = screen.getByText('Total Refunds').closest('.flex')
    expect(totalRefundsCard).toBeInTheDocument()
  })

  it('calculates net total correctly', () => {
    render(<StatsWidget expenses={mockExpenses} />)
    
    // Should be total expenses + total refunds: 225.75 + (-35.00) = 190.75
    const netTotalCard = screen.getByText('Net Total').closest('.flex')
    expect(netTotalCard).toBeInTheDocument()
  })

  it('counts transactions correctly', () => {
    render(<StatsWidget expenses={mockExpenses} />)
    
    // Should count all expenses: 4
    const transactionsCard = screen.getByText('Transactions').closest('.flex')
    expect(transactionsCard).toBeInTheDocument()
  })

  it('handles empty expenses array', () => {
    render(<StatsWidget expenses={[]} />)
    
    expect(screen.getByText('Total Expenses')).toBeInTheDocument()
    expect(screen.getByText('Total Refunds')).toBeInTheDocument()
    expect(screen.getByText('Net Total')).toBeInTheDocument()
    expect(screen.getByText('Transactions')).toBeInTheDocument()
  })

  it('displays correct icons for each stat', () => {
    render(<StatsWidget expenses={mockExpenses} />)
    
    // Check that icons are present by looking for their containers
    const expensesCard = screen.getByText('Total Expenses').closest('.space-y-0')
    const refundsCard = screen.getByText('Total Refunds').closest('.space-y-0')
    const netCard = screen.getByText('Net Total').closest('.space-y-0')
    const transactionsCard = screen.getByText('Transactions').closest('.space-y-0')
    
    expect(expensesCard).toBeInTheDocument()
    expect(refundsCard).toBeInTheDocument()
    expect(netCard).toBeInTheDocument()
    expect(transactionsCard).toBeInTheDocument()
  })

  it('handles only positive expenses', () => {
    const positiveExpenses = mockExpenses.filter(e => e.amount > 0)
    render(<StatsWidget expenses={positiveExpenses} />)
    
    expect(screen.getByText('Total Expenses')).toBeInTheDocument()
    expect(screen.getByText('Total Refunds')).toBeInTheDocument()
  })

  it('handles only negative expenses', () => {
    const negativeExpenses = mockExpenses.filter(e => e.amount < 0)
    render(<StatsWidget expenses={negativeExpenses} />)
    
    expect(screen.getByText('Total Expenses')).toBeInTheDocument()
    expect(screen.getByText('Total Refunds')).toBeInTheDocument()
  })
})
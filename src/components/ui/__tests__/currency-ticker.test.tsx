import { render, screen } from '@testing-library/react'
import { CurrencyTicker } from '../currency-ticker'

// Mock framer-motion
jest.mock('motion/react', () => ({
  useMotionValue: jest.fn(() => ({ set: jest.fn() })),
  useSpring: jest.fn(() => ({ on: jest.fn() })),
  useInView: jest.fn(() => true),
}))

describe('CurrencyTicker', () => {
  it('renders with default props', () => {
    render(<CurrencyTicker value={100} />)
    
    const element = screen.getByText(/₱0\.00/)
    expect(element).toBeInTheDocument()
  })

  it('renders with custom currency', () => {
    render(<CurrencyTicker value={100} currency="USD" locale="en-US" />)
    
    const element = screen.getByText(/\$0\.00/)
    expect(element).toBeInTheDocument()
  })

  it('renders with compact notation', () => {
    render(<CurrencyTicker value={1000} notation="compact" />)
    
    const element = screen.getByText(/₱0\.0/)
    expect(element).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(<CurrencyTicker value={100} className="test-class" />)
    
    const element = screen.getByText(/₱0\.00/)
    expect(element).toHaveClass('test-class')
    expect(element).toHaveClass('inline-block')
    expect(element).toHaveClass('tabular-nums')
  })

  it('starts with custom start value', () => {
    render(<CurrencyTicker value={100} startValue={50} />)
    
    const element = screen.getByText(/₱50\.00/)
    expect(element).toBeInTheDocument()
  })

  it('supports negative values', () => {
    render(<CurrencyTicker value={-100} startValue={-50} />)
    
    const element = screen.getByText(/-₱50\.00/)
    expect(element).toBeInTheDocument()
  })
})
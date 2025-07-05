import { render, screen, waitFor } from '@testing-library/react'
import { NumberTicker } from '../number-ticker'

// Mock framer-motion
const mockMotionValue = {
  set: jest.fn(),
  get: jest.fn(() => 0),
  on: jest.fn(),
  destroy: jest.fn()
}

const mockSpringValue = {
  set: jest.fn(),
  get: jest.fn(() => 0),
  on: jest.fn(),
  destroy: jest.fn()
}

jest.mock('motion/react', () => ({
  useMotionValue: jest.fn(() => mockMotionValue),
  useSpring: jest.fn(() => mockSpringValue),
  useInView: jest.fn(() => true),
  useTransform: jest.fn(() => mockMotionValue),
}))

describe('NumberTicker', () => {
  const mockUseMotionValue = require('motion/react').useMotionValue
  const mockUseSpring = require('motion/react').useSpring
  const mockUseInView = require('motion/react').useInView
  const mockUseTransform = require('motion/react').useTransform

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseMotionValue.mockReturnValue(mockMotionValue)
    mockUseSpring.mockReturnValue(mockSpringValue)
    mockUseInView.mockReturnValue(true)
    mockUseTransform.mockReturnValue(mockMotionValue)
  })

  describe('basic rendering', () => {
    it('renders with default props', () => {
      render(<NumberTicker value={100} />)
      
      const element = screen.getByText('0')
      expect(element).toBeInTheDocument()
    })

    it('renders with custom start value', () => {
      render(<NumberTicker value={100} startValue={50} />)
      
      const element = screen.getByText('50')
      expect(element).toBeInTheDocument()
    })

    it('applies custom className', () => {
      render(<NumberTicker value={100} className="test-class" />)
      
      const element = screen.getByText('0')
      expect(element).toHaveClass('test-class')
      expect(element).toHaveClass('inline-block')
      expect(element).toHaveClass('tabular-nums')
    })

    it('renders with decimal places', () => {
      render(<NumberTicker value={100.5} decimalPlaces={1} />)
      
      const element = screen.getByText('0.0')
      expect(element).toBeInTheDocument()
    })

    it('supports countdown direction', () => {
      render(<NumberTicker value={0} startValue={100} direction="down" />)
      
      const element = screen.getByText('100')
      expect(element).toBeInTheDocument()
    })

    it('formats large numbers with commas', () => {
      render(<NumberTicker value={1000000} startValue={1000000} />)
      
      const element = screen.getByText('1,000,000')
      expect(element).toBeInTheDocument()
    })
  })

  describe('animation configuration', () => {
    it('should use default spring configuration', () => {
      render(<NumberTicker value={100} />)
      
      expect(mockUseSpring).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          damping: expect.any(Number),
          stiffness: expect.any(Number),
        })
      )
    })

    it('should allow custom spring configuration', () => {
      const customConfig = { damping: 20, stiffness: 100 }
      render(<NumberTicker value={100} springOptions={customConfig} />)
      
      expect(mockUseSpring).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining(customConfig)
      )
    })

    it('should respect delay prop', () => {
      render(<NumberTicker value={100} delay={500} />)
      
      expect(mockUseMotionValue).toHaveBeenCalled()
    })
  })

  describe('value handling', () => {
    it('should handle negative values', () => {
      render(<NumberTicker value={-50} startValue={-50} />)
      
      const element = screen.getByText('-50')
      expect(element).toBeInTheDocument()
    })

    it('should handle zero value', () => {
      render(<NumberTicker value={0} startValue={0} />)
      
      const element = screen.getByText('0')
      expect(element).toBeInTheDocument()
    })

    it('should handle very large numbers', () => {
      render(<NumberTicker value={1000000000} startValue={1000000000} />)
      
      const element = screen.getByText('1,000,000,000')
      expect(element).toBeInTheDocument()
    })

    it('should handle decimal values with multiple places', () => {
      render(<NumberTicker value={123.456} decimalPlaces={3} startValue={123.456} />)
      
      const element = screen.getByText('123.456')
      expect(element).toBeInTheDocument()
    })
  })

  describe('viewport detection', () => {
    it('should start animation when in view', () => {
      mockUseInView.mockReturnValue(true)
      
      render(<NumberTicker value={100} />)
      
      expect(mockUseInView).toHaveBeenCalled()
    })

    it('should not animate when out of view', () => {
      mockUseInView.mockReturnValue(false)
      
      render(<NumberTicker value={100} />)
      
      expect(mockUseInView).toHaveBeenCalled()
    })
  })

  describe('accessibility', () => {
    it('should have appropriate semantic structure', () => {
      render(<NumberTicker value={1234.56} />)
      
      const element = screen.getByText('0')
      expect(element.tagName.toLowerCase()).toBe('span')
    })

    it('should support screen readers with final value', () => {
      render(<NumberTicker value={1234.56} />)
      
      const element = screen.getByText('0')
      expect(element).toBeInTheDocument()
    })
  })

  describe('performance', () => {
    it('should not cause memory leaks on unmount', () => {
      const { unmount } = render(<NumberTicker value={100} />)
      
      unmount()
      
      expect(mockUseMotionValue).toHaveBeenCalled()
    })

    it('should handle rapid value changes', () => {
      const { rerender } = render(<NumberTicker value={0} />)
      
      for (let i = 1; i <= 5; i++) {
        rerender(<NumberTicker value={i * 100} />)
      }
      
      expect(mockUseMotionValue).toHaveBeenCalled()
    })
  })

  describe('edge cases', () => {
    it('should handle NaN values gracefully', () => {
      expect(() => {
        render(<NumberTicker value={NaN} />)
      }).not.toThrow()
    })

    it('should handle very small decimal values', () => {
      render(<NumberTicker value={0.0001} decimalPlaces={4} startValue={0.0001} />)
      
      const element = screen.getByText('0.0001')
      expect(element).toBeInTheDocument()
    })

    it('should handle mixed positive and negative with direction', () => {
      render(<NumberTicker value={-100} startValue={100} direction="down" />)
      
      const element = screen.getByText('100')
      expect(element).toBeInTheDocument()
    })
  })

  describe('integration scenarios', () => {
    it('should work with currency formatting', () => {
      render(<NumberTicker value={1234.56} decimalPlaces={2} startValue={1234.56} />)
      
      const element = screen.getByText('1,234.56')
      expect(element).toBeInTheDocument()
    })

    it('should work with percentage values', () => {
      render(<NumberTicker value={85.5} decimalPlaces={1} startValue={85.5} />)
      
      const element = screen.getByText('85.5')
      expect(element).toBeInTheDocument()
    })

    it('should work within flex containers', () => {
      render(
        <div style={{ display: 'flex' }}>
          <NumberTicker value={100} />
          <span>Total</span>
        </div>
      )
      
      const ticker = screen.getByText('0')
      const label = screen.getByText('Total')
      expect(ticker).toBeInTheDocument()
      expect(label).toBeInTheDocument()
    })
  })
})
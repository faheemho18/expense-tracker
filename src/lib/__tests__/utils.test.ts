import { formatCurrency, exportToCsv, parseCsv, cn, getIcon } from '../utils'
import { ICONS } from '../constants'

// Mock DOM methods for CSV export
Object.defineProperty(document, 'createElement', {
  value: jest.fn(() => ({
    setAttribute: jest.fn(),
    click: jest.fn(),
  })),
})

Object.defineProperty(document.body, 'appendChild', {
  value: jest.fn(),
})

Object.defineProperty(document.body, 'removeChild', {
  value: jest.fn(),
})

describe('Utils', () => {
  describe('formatCurrency', () => {
    it('formats currency with default PHP locale', () => {
      expect(formatCurrency(100)).toBe('₱100.00')
      expect(formatCurrency(1000)).toBe('₱1,000.00')
      expect(formatCurrency(1000000)).toBe('₱1,000,000.00')
    })

    it('formats currency with compact notation', () => {
      expect(formatCurrency(1000, 'compact')).toBe('₱1K')
      expect(formatCurrency(1000000, 'compact')).toBe('₱1M')
      expect(formatCurrency(1500, 'compact')).toBe('₱1.5K')
    })

    it('handles negative amounts', () => {
      expect(formatCurrency(-100)).toBe('-₱100.00')
      expect(formatCurrency(-1000, 'compact')).toBe('-₱1K')
    })

    it('handles zero and decimal amounts', () => {
      expect(formatCurrency(0)).toBe('₱0.00')
      expect(formatCurrency(10.5)).toBe('₱10.50')
      expect(formatCurrency(10.99)).toBe('₱10.99')
    })
  })

  describe('cn (className utility)', () => {
    it('merges class names', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2')
    })

    it('handles conditional classes', () => {
      expect(cn('class1', false && 'class2', 'class3')).toBe('class1 class3')
      expect(cn('class1', true && 'class2')).toBe('class1 class2')
    })

    it('merges tailwind classes correctly', () => {
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
      expect(cn('p-4', 'px-2')).toBe('p-4 px-2')
    })
  })

  describe('getIcon', () => {
    it('returns correct icon for valid name', () => {
      const ShoppingCartIcon = getIcon('ShoppingCart')
      expect(ShoppingCartIcon).toBe(ICONS.ShoppingCart)
    })

    it('returns default icon for invalid name', () => {
      const defaultIcon = getIcon('NonExistentIcon')
      expect(defaultIcon).toBe(ICONS.Grip)
    })

    it('handles empty string', () => {
      const defaultIcon = getIcon('')
      expect(defaultIcon).toBe(ICONS.Grip)
    })
  })

  describe('exportToCsv', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('creates CSV download for valid data', () => {
      const testData = [
        { name: 'John', age: 30, city: 'New York' },
        { name: 'Jane', age: 25, city: 'Los Angeles' },
      ]

      exportToCsv(testData, 'test.csv')

      expect(document.createElement).toHaveBeenCalledWith('a')
      expect(document.body.appendChild).toHaveBeenCalled()
      expect(document.body.removeChild).toHaveBeenCalled()
    })

    it('handles empty data array', () => {
      exportToCsv([], 'empty.csv')

      // Should not create any elements for empty data
      expect(document.createElement).not.toHaveBeenCalled()
    })

    it('handles data with null values', () => {
      const testData = [
        { name: 'John', age: null, city: 'New York' },
      ]

      exportToCsv(testData, 'test-null.csv')

      expect(document.createElement).toHaveBeenCalled()
    })
  })

  describe('parseCsv', () => {
    it('parses simple CSV correctly', () => {
      const csvText = 'name,age,city\nJohn,30,New York\nJane,25,Los Angeles'
      const result = parseCsv(csvText)

      expect(result).toEqual([
        { name: 'John', age: '30', city: 'New York' },
        { name: 'Jane', age: '25', city: 'Los Angeles' },
      ])
    })

    it('handles CSV with quoted fields', () => {
      const csvText = 'name,description\n"John Doe","A person with spaces"\n"Jane Smith","Another person"'
      const result = parseCsv(csvText)

      expect(result).toEqual([
        { name: 'John Doe', description: 'A person with spaces' },
        { name: 'Jane Smith', description: 'Another person' },
      ])
    })

    it('handles empty CSV', () => {
      expect(parseCsv('')).toEqual([])
      expect(parseCsv('header')).toEqual([])
    })

    it('handles CSV with empty lines', () => {
      const csvText = 'name,age\n\nJohn,30\n\nJane,25\n'
      const result = parseCsv(csvText)

      expect(result).toEqual([
        { name: 'John', age: '30' },
        { name: 'Jane', age: '25' },
      ])
    })

    it('handles malformed CSV gracefully', () => {
      const csvText = 'name,age\nJohn,30,extra\nJane'
      const result = parseCsv(csvText)

      expect(result).toHaveLength(2)
      expect(result[0]).toHaveProperty('name', 'John')
      expect(result[1]).toHaveProperty('name', 'Jane')
    })
  })
})
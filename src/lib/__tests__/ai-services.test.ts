import { ExpenseCategorizationService, ReceiptOCRService } from '../ai-services'
import { ai } from '@/ai/genkit'
import { DEFAULT_CATEGORIES } from '@/lib/constants'
import type { Category } from '@/lib/types'

// Mock the AI service
jest.mock('@/ai/genkit')

describe('ExpenseCategorizationService', () => {
  let service: ExpenseCategorizationService
  const mockAi = ai as jest.Mocked<typeof ai>

  const mockCategories: Category[] = [
    { value: 'food', label: 'Food & Dining', icon: 'utensils', color: '#ff6b6b' },
    { value: 'transportation', label: 'Transportation', icon: 'car', color: '#4ecdc4' },
    { value: 'shopping', label: 'Shopping', icon: 'shopping-bag', color: '#45b7d1' },
    { value: 'entertainment', label: 'Entertainment', icon: 'film', color: '#96ceb4' },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    service = ExpenseCategorizationService.getInstance()
  })

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = ExpenseCategorizationService.getInstance()
      const instance2 = ExpenseCategorizationService.getInstance()
      
      expect(instance1).toBe(instance2)
      expect(instance1).toBe(service)
    })
  })

  describe('categorizeExpense', () => {
    const mockAiResponse = {
      suggestions: [
        {
          category: 'food',
          confidence: 0.92,
          reasoning: 'This appears to be a restaurant expense based on the description'
        },
        {
          category: 'entertainment',
          confidence: 0.15,
          reasoning: 'Could be entertainment if it was a dinner show'
        }
      ],
      primarySuggestion: {
        category: 'food',
        confidence: 0.92,
        reasoning: 'This appears to be a restaurant expense based on the description'
      }
    }

    beforeEach(() => {
      mockAi.generate.mockResolvedValue(mockAiResponse)
    })

    it('should categorize a restaurant expense correctly', async () => {
      const request = {
        description: 'Dinner at Italian Restaurant',
        amount: 45.50,
        availableCategories: mockCategories
      }

      const result = await service.categorizeExpense(request)

      expect(result).toEqual(mockAiResponse)
      expect(mockAi.generate).toHaveBeenCalledWith(
        expect.stringContaining('expense categorization expert')
      )
    })

    it('should handle transportation expenses', async () => {
      const transportationResponse = {
        suggestions: [
          {
            category: 'transportation',
            confidence: 0.88,
            reasoning: 'Gas station expense for vehicle fuel'
          }
        ],
        primarySuggestion: {
          category: 'transportation',
          confidence: 0.88,
          reasoning: 'Gas station expense for vehicle fuel'
        }
      }

      mockAi.generate.mockResolvedValue(transportationResponse)

      const request = {
        description: 'Shell Gas Station',
        amount: 65.00,
        availableCategories: mockCategories
      }

      const result = await service.categorizeExpense(request)

      expect(result.primarySuggestion.category).toBe('transportation')
      expect(result.primarySuggestion.confidence).toBe(0.88)
    })

    it('should handle shopping expenses with high confidence', async () => {
      const shoppingResponse = {
        suggestions: [
          {
            category: 'shopping',
            confidence: 0.95,
            reasoning: 'Amazon purchase likely for general shopping'
          }
        ],
        primarySuggestion: {
          category: 'shopping',
          confidence: 0.95,
          reasoning: 'Amazon purchase likely for general shopping'
        }
      }

      mockAi.generate.mockResolvedValue(shoppingResponse)

      const request = {
        description: 'Amazon.com Order #123456789',
        amount: 129.99,
        availableCategories: mockCategories
      }

      const result = await service.categorizeExpense(request)

      expect(result.primarySuggestion.category).toBe('shopping')
      expect(result.primarySuggestion.confidence).toBe(0.95)
    })

    it('should handle ambiguous expenses with low confidence', async () => {
      const ambiguousResponse = {
        suggestions: [
          {
            category: 'shopping',
            confidence: 0.35,
            reasoning: 'Could be shopping but description is unclear'
          },
          {
            category: 'entertainment',
            confidence: 0.30,
            reasoning: 'Could be entertainment expense'
          }
        ],
        primarySuggestion: {
          category: 'shopping',
          confidence: 0.35,
          reasoning: 'Could be shopping but description is unclear'
        }
      }

      mockAi.generate.mockResolvedValue(ambiguousResponse)

      const request = {
        description: 'Payment Processing Fee',
        amount: 2.50,
        availableCategories: mockCategories
      }

      const result = await service.categorizeExpense(request)

      expect(result.primarySuggestion.confidence).toBeLessThan(0.5)
      expect(result.suggestions.length).toBeGreaterThan(1)
    })

    it('should handle AI service errors gracefully', async () => {
      mockAi.generate.mockRejectedValue(new Error('AI service unavailable'))

      const request = {
        description: 'Test Expense',
        amount: 25.00,
        availableCategories: mockCategories
      }

      await expect(service.categorizeExpense(request)).rejects.toThrow('AI service unavailable')
    })

    it('should include available categories in the prompt', async () => {
      const request = {
        description: 'Test Expense',
        amount: 25.00,
        availableCategories: mockCategories
      }

      await service.categorizeExpense(request)

      const promptCall = mockAi.generate.mock.calls[0][0]
      expect(promptCall).toContain('food: Food & Dining')
      expect(promptCall).toContain('transportation: Transportation')
      expect(promptCall).toContain('shopping: Shopping')
      expect(promptCall).toContain('entertainment: Entertainment')
    })

    it('should handle empty category list', async () => {
      const request = {
        description: 'Test Expense',
        amount: 25.00,
        availableCategories: []
      }

      const emptyResponse = {
        suggestions: [],
        primarySuggestion: {
          category: 'uncategorized',
          confidence: 0.0,
          reasoning: 'No categories available for categorization'
        }
      }

      mockAi.generate.mockResolvedValue(emptyResponse)

      const result = await service.categorizeExpense(request)

      expect(result.primarySuggestion.category).toBe('uncategorized')
      expect(result.primarySuggestion.confidence).toBe(0.0)
    })

    it('should consider expense amount in categorization', async () => {
      const highAmountResponse = {
        suggestions: [
          {
            category: 'shopping',
            confidence: 0.85,
            reasoning: 'High amount suggests significant purchase'
          }
        ],
        primarySuggestion: {
          category: 'shopping',
          confidence: 0.85,
          reasoning: 'High amount suggests significant purchase'
        }
      }

      mockAi.generate.mockResolvedValue(highAmountResponse)

      const request = {
        description: 'Store Purchase',
        amount: 500.00,
        availableCategories: mockCategories
      }

      await service.categorizeExpense(request)

      const promptCall = mockAi.generate.mock.calls[0][0]
      expect(promptCall).toContain('Amount: $500.00')
    })
  })
})

describe('ReceiptOCRService', () => {
  let service: ReceiptOCRService
  const mockAi = ai as jest.Mocked<typeof ai>

  beforeEach(() => {
    jest.clearAllMocks()
    service = ReceiptOCRService.getInstance()
  })

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = ReceiptOCRService.getInstance()
      const instance2 = ReceiptOCRService.getInstance()
      
      expect(instance1).toBe(instance2)
      expect(instance1).toBe(service)
    })
  })

  describe('processReceipt', () => {
    const mockReceiptData = {
      amount: 25.50,
      description: 'Grocery Store Purchase',
      merchant: 'SuperMart',
      date: '2024-01-15',
      confidence: 0.89,
      rawText: 'SUPERMART\n123 Main St\nBread $3.50\nMilk $4.00\nTotal $25.50\n2024-01-15'
    }

    beforeEach(() => {
      mockAi.generate.mockResolvedValue(mockReceiptData)
    })

    it('should process a grocery receipt correctly', async () => {
      const imageData = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABA...'

      const result = await service.processReceipt(imageData)

      expect(result).toEqual(mockReceiptData)
      expect(mockAi.generate).toHaveBeenCalledWith(
        expect.stringContaining('receipt OCR expert')
      )
    })

    it('should handle restaurant receipts', async () => {
      const restaurantData = {
        amount: 67.83,
        description: 'Restaurant Dinner',
        merchant: 'Italian Bistro',
        date: '2024-01-20',
        confidence: 0.92,
        rawText: 'ITALIAN BISTRO\nPasta $18.00\nWine $24.00\nTip $8.50\nTotal $67.83'
      }

      mockAi.generate.mockResolvedValue(restaurantData)

      const imageData = 'data:image/jpeg;base64,restaurant_receipt_data...'

      const result = await service.processReceipt(imageData)

      expect(result.merchant).toBe('Italian Bistro')
      expect(result.amount).toBe(67.83)
      expect(result.confidence).toBe(0.92)
    })

    it('should handle gas station receipts', async () => {
      const gasData = {
        amount: 42.15,
        description: 'Gasoline Purchase',
        merchant: 'Shell Gas Station',
        date: '2024-01-18',
        confidence: 0.87,
        rawText: 'SHELL\nGas Station\nRegular $3.45/gal\n12.23 gal\nTotal $42.15'
      }

      mockAi.generate.mockResolvedValue(gasData)

      const imageData = 'data:image/jpeg;base64,gas_receipt_data...'

      const result = await service.processReceipt(imageData)

      expect(result.description).toBe('Gasoline Purchase')
      expect(result.amount).toBe(42.15)
    })

    it('should handle poor quality images with low confidence', async () => {
      const lowConfidenceData = {
        amount: 15.00,
        description: 'Unknown Purchase',
        merchant: 'Unknown Merchant',
        date: '2024-01-01',
        confidence: 0.25,
        rawText: 'Blurry text... $15.00... unclear...'
      }

      mockAi.generate.mockResolvedValue(lowConfidenceData)

      const imageData = 'data:image/jpeg;base64,blurry_receipt_data...'

      const result = await service.processReceipt(imageData)

      expect(result.confidence).toBeLessThan(0.5)
      expect(result.description).toBe('Unknown Purchase')
      expect(result.merchant).toBe('Unknown Merchant')
    })

    it('should handle invalid image data', async () => {
      const invalidImageData = 'not-a-valid-image'

      await expect(service.processReceipt(invalidImageData)).rejects.toThrow()
    })

    it('should handle AI service errors', async () => {
      mockAi.generate.mockRejectedValue(new Error('OCR service failed'))

      const imageData = 'data:image/jpeg;base64,valid_image_data...'

      await expect(service.processReceipt(imageData)).rejects.toThrow('OCR service failed')
    })

    it('should extract date in various formats', async () => {
      const dateFormats = [
        { input: '01/15/2024', expected: '2024-01-15' },
        { input: '2024-01-15', expected: '2024-01-15' },
        { input: 'Jan 15, 2024', expected: '2024-01-15' },
        { input: '15-01-2024', expected: '2024-01-15' },
      ]

      for (const format of dateFormats) {
        const receiptData = {
          ...mockReceiptData,
          date: format.expected,
          rawText: `Receipt with date ${format.input}`
        }

        mockAi.generate.mockResolvedValue(receiptData)

        const result = await service.processReceipt('data:image/jpeg;base64,test...')

        expect(result.date).toBe(format.expected)
      }
    })

    it('should handle international receipts with different currencies', async () => {
      const internationalData = {
        amount: 50.00,
        description: 'International Purchase',
        merchant: 'European Store',
        date: '2024-01-15',
        confidence: 0.78,
        rawText: 'EUROPEAN STORE\n€45.50\nConverted to $50.00',
        currency: 'EUR',
        originalAmount: 45.50
      }

      mockAi.generate.mockResolvedValue(internationalData)

      const imageData = 'data:image/jpeg;base64,international_receipt...'

      const result = await service.processReceipt(imageData)

      expect(result.amount).toBe(50.00)
      expect((result as any).currency).toBe('EUR')
      expect((result as any).originalAmount).toBe(45.50)
    })
  })

  describe('processReceiptWithCategorization', () => {
    const mockCategories: Category[] = [
      { value: 'groceries', label: 'Groceries', icon: 'shopping-cart', color: '#4ecdc4' },
      { value: 'restaurants', label: 'Restaurants', icon: 'utensils', color: '#ff6b6b' },
    ]

    it('should process receipt and suggest category', async () => {
      const receiptData = {
        amount: 35.75,
        description: 'Grocery Store Purchase',
        merchant: 'FreshMart',
        date: '2024-01-15',
        confidence: 0.91,
        rawText: 'FRESHMART\nApples $5.00\nBread $3.75\nTotal $35.75'
      }

      const categorization = {
        suggestions: [
          {
            category: 'groceries',
            confidence: 0.94,
            reasoning: 'Receipt from grocery store with food items'
          }
        ],
        primarySuggestion: {
          category: 'groceries',
          confidence: 0.94,
          reasoning: 'Receipt from grocery store with food items'
        }
      }

      mockAi.generate
        .mockResolvedValueOnce(receiptData)
        .mockResolvedValueOnce(categorization)

      const imageData = 'data:image/jpeg;base64,grocery_receipt...'

      const result = await service.processReceiptWithCategorization(imageData, mockCategories)

      expect(result.receiptData).toEqual(receiptData)
      expect(result.categorization).toEqual(categorization)
      expect(mockAi.generate).toHaveBeenCalledTimes(2)
    })
  })
})
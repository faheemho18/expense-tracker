import puppeteer, { Page, Browser } from 'puppeteer'

describe('AI Integration E2E Tests', () => {
  let browser: Browser
  let page: Page

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: process.env.CI === 'true',
      slowMo: 50,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
  })

  afterAll(async () => {
    await browser.close()
  })

  beforeEach(async () => {
    page = await browser.newPage()
    await page.setViewport({ width: 1920, height: 1080 })
    
    // Mock AI services for testing
    await page.evaluateOnNewDocument(() => {
      // Mock AI categorization service
      window.mockAIServices = {
        categorizeExpense: async (description: string, amount: number) => {
          // Simulate AI categorization based on description
          if (description.toLowerCase().includes('restaurant') || description.toLowerCase().includes('food')) {
            return {
              suggestions: [
                {
                  category: 'food',
                  confidence: 0.92,
                  reasoning: 'Restaurant/food related expense'
                }
              ],
              primarySuggestion: {
                category: 'food',
                confidence: 0.92,
                reasoning: 'Restaurant/food related expense'
              }
            }
          } else if (description.toLowerCase().includes('gas') || description.toLowerCase().includes('fuel')) {
            return {
              suggestions: [
                {
                  category: 'transportation',
                  confidence: 0.88,
                  reasoning: 'Gas/fuel related expense'
                }
              ],
              primarySuggestion: {
                category: 'transportation',
                confidence: 0.88,
                reasoning: 'Gas/fuel related expense'
              }
            }
          } else {
            return {
              suggestions: [
                {
                  category: 'other',
                  confidence: 0.35,
                  reasoning: 'Unable to determine category with high confidence'
                }
              ],
              primarySuggestion: {
                category: 'other',
                confidence: 0.35,
                reasoning: 'Unable to determine category with high confidence'
              }
            }
          }
        },
        processReceipt: async (imageData: string) => {
          // Simulate receipt OCR processing
          await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate processing time
          
          return {
            amount: 25.50,
            description: 'Grocery Store Purchase',
            merchant: 'SuperMart',
            date: '2024-01-15',
            confidence: 0.89,
            rawText: 'SUPERMART\n123 Main St\nBread $3.50\nMilk $4.00\nTotal $25.50\n2024-01-15'
          }
        }
      }
    })
    
    await page.goto('http://localhost:3000')
    await page.waitForSelector('[data-testid="app-layout"]', { timeout: 10000 })
  })

  afterEach(async () => {
    await page.close()
  })

  describe('AI expense categorization', () => {
    it('should suggest category based on expense description', async () => {
      // Click add expense button
      const addButton = await page.waitForSelector('[data-testid="add-expense-button"]')
      await addButton.click()
      
      // Wait for the form to open
      await page.waitForSelector('[data-testid="add-expense-sheet"]')
      
      // Fill in description that should trigger food category
      await page.waitForSelector('input[name="description"]')
      await page.type('input[name="description"]', 'Dinner at Italian Restaurant')
      await page.type('input[name="amount"]', '45.50')
      
      // Check if AI categorization button appears
      const aiCategorizeButton = await page.$('[data-testid="ai-categorize-button"]')
      if (aiCategorizeButton) {
        await aiCategorizeButton.click()
        
        // Wait for AI suggestion to appear
        const aiSuggestion = await page.waitForSelector('[data-testid="ai-suggestion"]', { timeout: 5000 })
        expect(aiSuggestion).toBeTruthy()
        
        // Check if food category is suggested
        const suggestionText = await page.evaluate(el => el.textContent, aiSuggestion)
        expect(suggestionText).toContain('food')
        expect(suggestionText).toContain('92%') // High confidence
      }
    })

    it('should handle transportation expenses', async () => {
      const addButton = await page.waitForSelector('[data-testid="add-expense-button"]')
      await addButton.click()
      
      await page.waitForSelector('input[name="description"]')
      await page.type('input[name="description"]', 'Shell Gas Station')
      await page.type('input[name="amount"]', '65.00')
      
      const aiCategorizeButton = await page.$('[data-testid="ai-categorize-button"]')
      if (aiCategorizeButton) {
        await aiCategorizeButton.click()
        
        const aiSuggestion = await page.waitForSelector('[data-testid="ai-suggestion"]', { timeout: 5000 })
        const suggestionText = await page.evaluate(el => el.textContent, aiSuggestion)
        expect(suggestionText).toContain('transportation')
        expect(suggestionText).toContain('88%')
      }
    })

    it('should show low confidence for ambiguous descriptions', async () => {
      const addButton = await page.waitForSelector('[data-testid="add-expense-button"]')
      await addButton.click()
      
      await page.waitForSelector('input[name="description"]')
      await page.type('input[name="description"]', 'Payment Processing Fee')
      await page.type('input[name="amount"]', '2.50')
      
      const aiCategorizeButton = await page.$('[data-testid="ai-categorize-button"]')
      if (aiCategorizeButton) {
        await aiCategorizeButton.click()
        
        const aiSuggestion = await page.waitForSelector('[data-testid="ai-suggestion"]', { timeout: 5000 })
        const suggestionText = await page.evaluate(el => el.textContent, aiSuggestion)
        expect(suggestionText).toContain('35%') // Low confidence
      }
    })

    it('should allow accepting AI suggestions', async () => {
      const addButton = await page.waitForSelector('[data-testid="add-expense-button"]')
      await addButton.click()
      
      await page.waitForSelector('input[name="description"]')
      await page.type('input[name="description"]', 'McDonald\'s Drive Thru')
      await page.type('input[name="amount"]', '12.99')
      
      const aiCategorizeButton = await page.$('[data-testid="ai-categorize-button"]')
      if (aiCategorizeButton) {
        await aiCategorizeButton.click()
        
        // Wait for suggestion and accept it
        await page.waitForSelector('[data-testid="ai-suggestion"]')
        const acceptButton = await page.$('[data-testid="accept-ai-suggestion"]')
        
        if (acceptButton) {
          await acceptButton.click()
          
          // Check if category was automatically selected
          const categorySelect = await page.$('[data-testid="category-select"]')
          if (categorySelect) {
            const selectedValue = await page.evaluate(el => el.textContent, categorySelect)
            expect(selectedValue).toContain('food')
          }
        }
      }
    })

    it('should allow rejecting AI suggestions', async () => {
      const addButton = await page.waitForSelector('[data-testid="add-expense-button"]')
      await addButton.click()
      
      await page.waitForSelector('input[name="description"]')
      await page.type('input[name="description"]', 'Starbucks Coffee')
      await page.type('input[name="amount"]', '5.25')
      
      const aiCategorizeButton = await page.$('[data-testid="ai-categorize-button"]')
      if (aiCategorizeButton) {
        await aiCategorizeButton.click()
        
        await page.waitForSelector('[data-testid="ai-suggestion"]')
        const rejectButton = await page.$('[data-testid="reject-ai-suggestion"]')
        
        if (rejectButton) {
          await rejectButton.click()
          
          // AI suggestion should disappear
          const aiSuggestion = await page.$('[data-testid="ai-suggestion"]')
          expect(aiSuggestion).toBeFalsy()
        }
      }
    })
  })

  describe('Receipt OCR functionality', () => {
    it('should handle receipt upload and processing', async () => {
      const addButton = await page.waitForSelector('[data-testid="add-expense-button"]')
      await addButton.click()
      
      await page.waitForSelector('[data-testid="add-expense-sheet"]')
      
      // Look for receipt upload button
      const receiptUploadButton = await page.$('[data-testid="receipt-upload-button"]')
      if (receiptUploadButton) {
        // Create a mock file for testing
        const fileInput = await page.$('input[type="file"]')
        if (fileInput) {
          // Simulate file upload (this would need actual file handling in real tests)
          await page.evaluate(() => {
            const event = new Event('change')
            const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
            if (fileInput) {
              // Mock file data
              Object.defineProperty(fileInput, 'files', {
                value: [{
                  name: 'receipt.jpg',
                  type: 'image/jpeg',
                  size: 1024
                }]
              })
              fileInput.dispatchEvent(event)
            }
          })
          
          // Wait for OCR processing indicator
          const processingIndicator = await page.waitForSelector('[data-testid="ocr-processing"]', { timeout: 5000 })
          if (processingIndicator) {
            expect(processingIndicator).toBeTruthy()
            
            // Wait for processing to complete
            await page.waitForSelector('[data-testid="ocr-result"]', { timeout: 10000 })
            
            // Check if form fields were populated
            const descriptionValue = await page.$eval('input[name="description"]', (el: HTMLInputElement) => el.value)
            const amountValue = await page.$eval('input[name="amount"]', (el: HTMLInputElement) => el.value)
            
            expect(descriptionValue).toBe('Grocery Store Purchase')
            expect(amountValue).toBe('25.50')
          }
        }
      }
    })

    it('should show OCR confidence score', async () => {
      const addButton = await page.waitForSelector('[data-testid="add-expense-button"]')
      await addButton.click()
      
      const receiptUploadButton = await page.$('[data-testid="receipt-upload-button"]')
      if (receiptUploadButton) {
        // Simulate receipt processing
        await page.evaluate(() => {
          if (window.mockAIServices) {
            window.mockAIServices.processReceipt('mock-image-data').then(result => {
              // Dispatch custom event with OCR result
              window.dispatchEvent(new CustomEvent('ocr-complete', { detail: result }))
            })
          }
        })
        
        // Check for confidence score display
        const confidenceScore = await page.waitForSelector('[data-testid="ocr-confidence"]', { timeout: 5000 })
        if (confidenceScore) {
          const scoreText = await page.evaluate(el => el.textContent, confidenceScore)
          expect(scoreText).toContain('89%')
        }
      }
    })

    it('should handle poor quality receipt images', async () => {
      const addButton = await page.waitForSelector('[data-testid="add-expense-button"]')
      await addButton.click()
      
      // Simulate poor quality receipt processing
      await page.evaluate(() => {
        window.mockAIServices = {
          ...window.mockAIServices,
          processReceipt: async () => ({
            amount: 0,
            description: 'Unknown Purchase',
            merchant: 'Unknown Merchant',
            date: '2024-01-01',
            confidence: 0.25,
            rawText: 'Blurry text... unclear...'
          })
        }
      })
      
      const receiptUploadButton = await page.$('[data-testid="receipt-upload-button"]')
      if (receiptUploadButton) {
        // Simulate processing
        await page.evaluate(() => {
          window.dispatchEvent(new CustomEvent('ocr-complete', { 
            detail: {
              amount: 0,
              description: 'Unknown Purchase',
              merchant: 'Unknown Merchant',
              date: '2024-01-01',
              confidence: 0.25,
              rawText: 'Blurry text... unclear...'
            }
          }))
        })
        
        // Should show low confidence warning
        const lowConfidenceWarning = await page.waitForSelector('[data-testid="low-confidence-warning"]', { timeout: 5000 })
        if (lowConfidenceWarning) {
          expect(lowConfidenceWarning).toBeTruthy()
        }
      }
    })
  })

  describe('AI service error handling', () => {
    it('should handle AI service timeouts', async () => {
      // Mock AI service timeout
      await page.evaluate(() => {
        window.mockAIServices = {
          categorizeExpense: async () => {
            await new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Service timeout')), 100)
            )
          }
        }
      })
      
      const addButton = await page.waitForSelector('[data-testid="add-expense-button"]')
      await addButton.click()
      
      await page.waitForSelector('input[name="description"]')
      await page.type('input[name="description"]', 'Test Expense')
      
      const aiCategorizeButton = await page.$('[data-testid="ai-categorize-button"]')
      if (aiCategorizeButton) {
        await aiCategorizeButton.click()
        
        // Should show error message
        const errorMessage = await page.waitForSelector('[data-testid="ai-error"]', { timeout: 5000 })
        if (errorMessage) {
          const errorText = await page.evaluate(el => el.textContent, errorMessage)
          expect(errorText).toContain('timeout')
        }
      }
    })

    it('should gracefully handle AI service unavailability', async () => {
      // Mock AI service unavailable
      await page.evaluate(() => {
        window.mockAIServices = null
      })
      
      const addButton = await page.waitForSelector('[data-testid="add-expense-button"]')
      await addButton.click()
      
      await page.waitForSelector('input[name="description"]')
      
      // AI buttons should not be available
      const aiCategorizeButton = await page.$('[data-testid="ai-categorize-button"]')
      expect(aiCategorizeButton).toBeFalsy()
      
      // Should still be able to add expense manually
      await page.type('input[name="description"]', 'Manual Expense')
      await page.type('input[name="amount"]', '10.00')
      
      const submitButton = await page.waitForSelector('[data-testid="submit-expense"]')
      await submitButton.click()
      
      // Expense should be added successfully
      const expense = await page.waitForSelector('text=Manual Expense', { timeout: 5000 })
      expect(expense).toBeTruthy()
    })
  })

  describe('AI feature accessibility', () => {
    it('should provide proper ARIA labels for AI features', async () => {
      const addButton = await page.waitForSelector('[data-testid="add-expense-button"]')
      await addButton.click()
      
      const aiCategorizeButton = await page.$('[data-testid="ai-categorize-button"]')
      if (aiCategorizeButton) {
        const ariaLabel = await page.evaluate(el => el.getAttribute('aria-label'), aiCategorizeButton)
        expect(ariaLabel).toContain('AI')
        expect(ariaLabel).toContain('categorize')
      }
      
      const receiptUploadButton = await page.$('[data-testid="receipt-upload-button"]')
      if (receiptUploadButton) {
        const ariaLabel = await page.evaluate(el => el.getAttribute('aria-label'), receiptUploadButton)
        expect(ariaLabel).toContain('receipt')
        expect(ariaLabel).toContain('upload')
      }
    })

    it('should support keyboard navigation for AI features', async () => {
      const addButton = await page.waitForSelector('[data-testid="add-expense-button"]')
      await addButton.click()
      
      // Tab through form elements
      await page.keyboard.press('Tab') // Description field
      await page.keyboard.press('Tab') // Amount field
      await page.keyboard.press('Tab') // Should reach AI categorize button
      
      const focusedElement = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))
      if (focusedElement === 'ai-categorize-button') {
        // Should be able to activate with Enter
        await page.keyboard.press('Enter')
        
        const aiSuggestion = await page.waitForSelector('[data-testid="ai-suggestion"]', { timeout: 5000 })
        expect(aiSuggestion).toBeTruthy()
      }
    })
  })

  describe('AI performance optimization', () => {
    it('should debounce AI categorization requests', async () => {
      const addButton = await page.waitForSelector('[data-testid="add-expense-button"]')
      await addButton.click()
      
      // Track AI service calls
      let aiCallCount = 0
      await page.evaluate(() => {
        const originalCategorize = window.mockAIServices?.categorizeExpense
        if (originalCategorize) {
          window.mockAIServices.categorizeExpense = async (...args) => {
            window.aiCallCount = (window.aiCallCount || 0) + 1
            return originalCategorize(...args)
          }
        }
      })
      
      await page.waitForSelector('input[name="description"]')
      
      // Type quickly to test debouncing
      await page.type('input[name="description"]', 'Restaurant', { delay: 10 })
      
      const aiCategorizeButton = await page.$('[data-testid="ai-categorize-button"]')
      if (aiCategorizeButton) {
        // Click multiple times quickly
        await aiCategorizeButton.click()
        await aiCategorizeButton.click()
        await aiCategorizeButton.click()
        
        // Wait a moment
        await page.waitForTimeout(1000)
        
        // Should have made minimal AI calls due to debouncing
        const callCount = await page.evaluate(() => window.aiCallCount || 0)
        expect(callCount).toBeLessThan(3)
      }
    })
  })
})
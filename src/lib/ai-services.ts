import { aiClient } from '@/lib/ai-client';
import { DEFAULT_CATEGORIES } from '@/lib/constants';
import type { Category } from '@/lib/types';

export interface CategorySuggestion {
  category: string;
  confidence: number;
  reasoning: string;
}

export interface ExpenseCategorizationRequest {
  description: string;
  amount: number;
  availableCategories: Category[];
}

export interface ExpenseCategorizationResponse {
  suggestions: CategorySuggestion[];
  primarySuggestion: CategorySuggestion;
}

/**
 * AI-powered expense categorization service
 */
export class ExpenseCategorizationService {
  private static instance: ExpenseCategorizationService;

  public static getInstance(): ExpenseCategorizationService {
    if (!this.instance) {
      this.instance = new ExpenseCategorizationService();
    }
    return this.instance;
  }

  /**
   * Categorize an expense using AI
   */
  async categorizeExpense(
    request: ExpenseCategorizationRequest
  ): Promise<ExpenseCategorizationResponse> {
    const { description, amount, availableCategories } = request;

    // Prepare category options for the AI
    const categoryOptions = availableCategories.map(cat => 
      `${cat.value}: ${cat.label}`
    ).join('\n');

    const prompt = `
You are an expense categorization expert. Analyze the following expense and suggest the most appropriate category.

Expense Details:
- Description: "${description}"
- Amount: $${amount}

Available Categories:
${categoryOptions}

Please provide your analysis in the following JSON format:
{
  "suggestions": [
    {
      "category": "category_value",
      "confidence": 0.95,
      "reasoning": "Brief explanation of why this category fits"
    }
  ],
  "primarySuggestion": {
    "category": "category_value",
    "confidence": 0.95,
    "reasoning": "Brief explanation of why this is the best match"
  }
}

Rules:
1. Confidence should be between 0 and 1 (1 being 100% confident)
2. Provide 1-3 suggestions, ordered by confidence
3. The primarySuggestion should be the highest confidence option
4. Only suggest categories from the available list
5. Consider both the description and amount when categorizing
6. Be concise but clear in your reasoning

Focus on accuracy and provide thoughtful reasoning for each suggestion.
`;

    try {
      const response = await aiClient.generate({
        model: 'googleai/gemini-2.0-flash',
        prompt,
        config: {
          temperature: 0.1, // Low temperature for consistent categorization
          maxOutputTokens: 500,
        },
      });

      if (!response.success) {
        throw new Error(response.error || 'AI categorization failed');
      }

      const result = this.parseAIResponse(response.text);
      
      // Validate suggestions against available categories
      const validatedResult = this.validateSuggestions(result, availableCategories);
      
      return validatedResult;
    } catch (error) {
      console.error('Error categorizing expense:', error);
      
      // Fallback to rule-based categorization
      return this.fallbackCategorization(request);
    }
  }

  /**
   * Parse AI response and extract categorization data
   */
  private parseAIResponse(responseText: string): ExpenseCategorizationResponse {
    try {
      // Clean up the response text (remove markdown formatting if present)
      const cleanText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      const parsed = JSON.parse(cleanText);
      
      // Ensure the response has the expected structure
      if (!parsed.suggestions || !Array.isArray(parsed.suggestions)) {
        throw new Error('Invalid response format: missing suggestions array');
      }
      
      if (!parsed.primarySuggestion) {
        throw new Error('Invalid response format: missing primarySuggestion');
      }
      
      return parsed;
    } catch (error) {
      console.error('Error parsing AI response:', error);
      throw new Error('Failed to parse AI categorization response');
    }
  }

  /**
   * Validate suggestions against available categories
   */
  private validateSuggestions(
    result: ExpenseCategorizationResponse,
    availableCategories: Category[]
  ): ExpenseCategorizationResponse {
    const validCategoryValues = new Set(availableCategories.map(cat => cat.value));
    
    // Filter out invalid suggestions
    const validSuggestions = result.suggestions.filter(suggestion => 
      validCategoryValues.has(suggestion.category)
    );
    
    // Ensure primary suggestion is valid
    const validPrimary = validCategoryValues.has(result.primarySuggestion.category)
      ? result.primarySuggestion
      : validSuggestions[0] || this.getDefaultSuggestion();
    
    return {
      suggestions: validSuggestions.length > 0 ? validSuggestions : [this.getDefaultSuggestion()],
      primarySuggestion: validPrimary,
    };
  }

  /**
   * Fallback categorization when AI fails
   */
  private fallbackCategorization(
    request: ExpenseCategorizationRequest
  ): ExpenseCategorizationResponse {
    const { description, availableCategories } = request;
    const descriptionLower = description.toLowerCase();
    
    // Simple keyword-based categorization
    const rules = [
      { keywords: ['restaurant', 'food', 'cafe', 'pizza', 'burger', 'lunch', 'dinner', 'breakfast'], category: 'food' },
      { keywords: ['gas', 'fuel', 'uber', 'taxi', 'parking', 'bus', 'train', 'car'], category: 'transport' },
      { keywords: ['grocery', 'supermarket', 'walmart', 'target', 'costco', 'shopping'], category: 'shopping' },
      { keywords: ['rent', 'mortgage', 'utilities', 'electric', 'water', 'internet'], category: 'housing' },
      { keywords: ['doctor', 'pharmacy', 'medicine', 'hospital', 'dental', 'medical'], category: 'health' },
      { keywords: ['movie', 'cinema', 'netflix', 'spotify', 'game', 'entertainment'], category: 'entertainment' },
      { keywords: ['book', 'school', 'course', 'education', 'tuition'], category: 'education' },
      { keywords: ['gift', 'donation', 'charity', 'present'], category: 'gifts' },
    ];

    for (const rule of rules) {
      if (rule.keywords.some(keyword => descriptionLower.includes(keyword))) {
        const category = availableCategories.find(cat => cat.value === rule.category);
        if (category) {
          const suggestion: CategorySuggestion = {
            category: category.value,
            confidence: 0.7,
            reasoning: `Matched keyword pattern for ${category.label}`,
          };
          return {
            suggestions: [suggestion],
            primarySuggestion: suggestion,
          };
        }
      }
    }

    // Default to "other" category
    return {
      suggestions: [this.getDefaultSuggestion()],
      primarySuggestion: this.getDefaultSuggestion(),
    };
  }

  /**
   * Get default suggestion when no match is found
   */
  private getDefaultSuggestion(): CategorySuggestion {
    return {
      category: 'other',
      confidence: 0.5,
      reasoning: 'No clear category match found, defaulting to Other',
    };
  }
}

// Export singleton instance
export const expenseCategorizationService = ExpenseCategorizationService.getInstance();

export interface ReceiptData {
  amount: number;
  description: string;
  date?: string;
  merchant?: string;
  category?: string;
  confidence: number;
}

export interface ReceiptOCRResponse {
  extractedData: ReceiptData;
  rawText?: string;
  success: boolean;
  error?: string;
}

/**
 * AI-powered receipt OCR service
 */
export class ReceiptOCRService {
  private static instance: ReceiptOCRService;

  public static getInstance(): ReceiptOCRService {
    if (!this.instance) {
      this.instance = new ReceiptOCRService();
    }
    return this.instance;
  }

  /**
   * Extract expense data from receipt image
   */
  async extractFromReceipt(imageData: string): Promise<ReceiptOCRResponse> {
    try {
      // Convert data URL to base64 if needed
      const base64Data = imageData.startsWith('data:') 
        ? imageData.split(',')[1] 
        : imageData;

      const prompt = `
You are an expert at extracting expense information from receipt images. 
Analyze this receipt image and extract the following information:

1. Total amount (the final amount paid)
2. Merchant/business name
3. Date of transaction (if visible)
4. Brief description of the purchase
5. Suggested expense category

Please respond in the following JSON format:
{
  "amount": 25.99,
  "description": "Coffee and pastry at Starbucks",
  "date": "2024-01-15",
  "merchant": "Starbucks",
  "category": "food",
  "confidence": 0.95,
  "rawText": "Any relevant text you can see on the receipt"
}

Rules:
1. Amount should be a number (the total/final amount paid)
2. Date should be in YYYY-MM-DD format if found, null if not visible
3. Description should be brief but descriptive
4. Category should be one of: food, shopping, transport, housing, health, entertainment, education, gifts, other
5. Confidence should be 0-1 based on how clear the receipt is
6. If you cannot read the receipt clearly, set confidence to 0.3 or lower
7. Focus on the total amount - ignore subtotals, taxes shown separately, etc.

Be accurate and conservative with confidence scoring.
`;

      const response = await aiClient.generate({
        model: 'googleai/gemini-2.0-flash',
        prompt,
        media: [
          {
            url: `data:image/jpeg;base64,${base64Data}`,
          },
        ],
        config: {
          temperature: 0.1,
          maxOutputTokens: 500,
        },
      });

      if (!response.success) {
        throw new Error(response.error || 'OCR processing failed');
      }

      const result = this.parseOCRResponse(response.text);
      
      return {
        extractedData: result,
        success: true,
      };
    } catch (error) {
      console.error('Error processing receipt:', error);
      
      return {
        extractedData: {
          amount: 0,
          description: 'Receipt processing failed',
          confidence: 0,
        },
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Parse AI response and extract receipt data
   */
  private parseOCRResponse(responseText: string): ReceiptData {
    try {
      // Clean up the response text
      const cleanText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      const parsed = JSON.parse(cleanText);
      
      // Validate required fields
      if (typeof parsed.amount !== 'number') {
        throw new Error('Invalid amount in response');
      }
      
      if (!parsed.description || typeof parsed.description !== 'string') {
        throw new Error('Invalid description in response');
      }
      
      // Return validated data with defaults
      return {
        amount: Math.abs(parsed.amount), // Ensure positive amount
        description: parsed.description.trim(),
        date: parsed.date || undefined,
        merchant: parsed.merchant || undefined,
        category: parsed.category || undefined,
        confidence: Math.min(Math.max(parsed.confidence || 0.5, 0), 1), // Clamp between 0-1
      };
    } catch (error) {
      console.error('Error parsing OCR response:', error);
      
      // Return fallback data
      return {
        amount: 0,
        description: 'Could not extract receipt data',
        confidence: 0.1,
      };
    }
  }
}

// Export singleton instance
export const receiptOCRService = ReceiptOCRService.getInstance();
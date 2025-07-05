// Quick test file to verify AI services integration
// This is for development testing only

import { expenseCategorizationService } from '@/lib/ai-services';
import { DEFAULT_CATEGORIES } from '@/lib/constants';

export async function testAIServices() {
  console.log('Testing AI services...');
  
  try {
    // Test expense categorization
    const result = await expenseCategorizationService.categorizeExpense({
      description: 'Starbucks coffee and breakfast sandwich',
      amount: 12.50,
      availableCategories: DEFAULT_CATEGORIES,
    });
    
    console.log('Categorization result:', result);
    return result;
  } catch (error) {
    console.error('AI services test failed:', error);
    throw error;
  }
}

// Example usage:
// testAIServices().then(console.log).catch(console.error);
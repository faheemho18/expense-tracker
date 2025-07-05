import { useState, useCallback } from 'react';

// Temporarily disable AI services to fix module resolution issues
// import { expenseCategorizationService, type ExpenseCategorizationRequest, type ExpenseCategorizationResponse } from '@/lib/ai-services';

export interface ExpenseCategorizationRequest {
  description: string;
  amount: number;
  availableCategories: Array<{
    value: string;
    label: string;
  }>;
}

export interface ExpenseCategorizationResponse {
  suggestedCategory: string;
  confidence: number;
  reasoning?: string;
}

export interface UseExpenseCategorizationResult {
  categorizeExpense: (request: ExpenseCategorizationRequest) => Promise<ExpenseCategorizationResponse>;
  isLoading: boolean;
  error: string | null;
  lastResult: ExpenseCategorizationResponse | null;
}


/**
 * Hook for AI-powered expense categorization
 */
export function useExpenseCategorization(): UseExpenseCategorizationResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<ExpenseCategorizationResponse | null>(null);

  const categorizeExpense = useCallback(async (request: ExpenseCategorizationRequest): Promise<ExpenseCategorizationResponse> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Call AI categorization API route
      const response = await fetch('/api/ai/categorize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      
      // Convert new format to old format for compatibility
      const compatResult: ExpenseCategorizationResponse = {
        suggestedCategory: result.primarySuggestion?.category || 'other',
        confidence: result.primarySuggestion?.confidence || 0.5,
        reasoning: result.primarySuggestion?.reasoning || 'AI categorization',
      };
      
      setLastResult(compatResult);
      return compatResult;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to categorize expense';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    categorizeExpense,
    isLoading,
    error,
    lastResult,
  };
}
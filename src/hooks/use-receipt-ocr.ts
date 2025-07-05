import { useState, useCallback } from 'react';

export interface ReceiptOCRResponse {
  extractedData: {
    amount: number;
    description: string;
    confidence: number;
    date?: string;
    merchant?: string;
    category?: string;
  };
  success: boolean;
  error?: string;
}

export interface UseReceiptOCRResult {
  processReceipt: (imageData: string) => Promise<ReceiptOCRResponse>;
  isProcessing: boolean;
  error: string | null;
  lastResult: ReceiptOCRResponse | null;
}


/**
 * Hook for AI-powered receipt OCR processing
 */
export function useReceiptOCR(): UseReceiptOCRResult {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<ReceiptOCRResponse | null>(null);

  const processReceipt = useCallback(async (imageData: string): Promise<ReceiptOCRResponse> => {
    setIsProcessing(true);
    setError(null);
    
    try {
      // Call AI OCR API route
      const response = await fetch('/api/ai/ocr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageData }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      setLastResult(result);
      
      if (!result.success && result.error) {
        setError(result.error);
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process receipt';
      setError(errorMessage);
      
      const failureResult: ReceiptOCRResponse = {
        extractedData: {
          amount: 0,
          description: 'Receipt processing failed',
          confidence: 0,
        },
        success: false,
        error: errorMessage,
      };
      
      setLastResult(failureResult);
      return failureResult;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return {
    processReceipt,
    isProcessing,
    error,
    lastResult,
  };
}
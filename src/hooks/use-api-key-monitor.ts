import { useState, useEffect, useCallback } from 'react';

export interface APIKeyMonitorData {
  manager: string;
  keys: number;
  activeKeys: number;
  totalRequests: number;
  currentKeyIndex: number;
  hasAvailableKeys: boolean;
  keyDetails: Array<{
    key: string;
    isActive: boolean;
    lastError?: string;
    lastErrorTime?: number;
    requestCount: number;
    failureCount: number;
  }>;
}

export interface UseAPIKeyMonitorResult {
  data: APIKeyMonitorData | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
  resetKeys: () => void;
}

/**
 * Hook to monitor API key status and manage rotation
 */
export function useAPIKeyMonitor(): UseAPIKeyMonitorResult {
  const [data, setData] = useState<APIKeyMonitorData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/ai/status');
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const status = await response.json();
      setData(status as APIKeyMonitorData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch API key status';
      setError(errorMessage);
      console.error('Error fetching API key status:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetKeys = useCallback(async () => {
    try {
      const response = await fetch('/api/ai/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'reset' }),
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      fetchStatus(); // Refresh status after reset
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reset API keys';
      setError(errorMessage);
      console.error('Error resetting API keys:', err);
    }
  }, [fetchStatus]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return {
    data,
    isLoading,
    error,
    refresh: fetchStatus,
    resetKeys,
  };
}
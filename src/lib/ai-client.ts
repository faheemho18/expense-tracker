/**
 * Enhanced AI client with automatic API key rotation and error handling
 */

// Only import AI modules on server-side
let ai: any = null;
let apiKeyManager: any = null;

if (typeof window === 'undefined') {
  try {
    const genkitModule = require('@/ai/genkit');
    ai = genkitModule.ai;
    apiKeyManager = genkitModule.apiKeyManager;
  } catch (error) {
    console.warn('AI modules not available:', error);
  }
}

export interface AIRequestOptions {
  model?: string;
  prompt: string;
  media?: Array<{ url: string }>;
  config?: {
    temperature?: number;
    maxOutputTokens?: number;
    topP?: number;
    topK?: number;
  };
  retries?: number;
}

export interface AIResponse {
  text: string;
  success: boolean;
  error?: string;
  keyUsed?: string;
  retryCount?: number;
}

/**
 * Enhanced AI client that handles API key rotation and quota exhaustion
 */
export class AIClient {
  private static instance: AIClient;
  
  public static getInstance(): AIClient {
    if (!this.instance) {
      this.instance = new AIClient();
    }
    return this.instance;
  }

  /**
   * Generate AI response with automatic failover
   */
  async generate(options: AIRequestOptions): Promise<AIResponse> {
    // Check if AI is available (server-side only)
    if (!ai) {
      return {
        text: '',
        success: false,
        error: 'AI services not available on client-side',
        retryCount: 0,
      };
    }
    const {
      model = 'googleai/gemini-2.0-flash',
      prompt,
      media,
      config = {},
      retries = 3
    } = options;

    let lastError: string = '';
    let retryCount = 0;

    // Default config
    const defaultConfig = {
      temperature: 0.1,
      maxOutputTokens: 1000,
      ...config,
    };

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // Check if we have available API keys
        if (apiKeyManager && !apiKeyManager.hasAvailableKeys()) {
          throw new Error('No available API keys. All keys may have exceeded their quota.');
        }

        const currentKey = apiKeyManager?.getCurrentKey();
        console.log(`Attempting AI request with key: ${this.maskKey(currentKey || 'fallback')}`);

        const response = await ai.generate({
          model,
          prompt,
          media,
          config: defaultConfig,
        });

        const responseText = response.text();
        
        // Mark key as successful
        if (apiKeyManager) {
          apiKeyManager.markCurrentKeyAsSuccessful();
        }

        return {
          text: responseText,
          success: true,
          keyUsed: this.maskKey(currentKey || 'fallback'),
          retryCount: attempt,
        };

      } catch (error) {
        retryCount = attempt;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        lastError = errorMessage;

        console.error(`AI request failed (attempt ${attempt + 1}/${retries + 1}):`, errorMessage);

        // Check for quota/credit exhaustion errors
        if (this.isQuotaExhaustedError(errorMessage)) {
          console.warn('Quota exhausted error detected, rotating API key');
          if (apiKeyManager) {
            apiKeyManager.markCurrentKeyAsFailed(`Quota exhausted: ${errorMessage}`);
          }
        } else if (this.isAuthenticationError(errorMessage)) {
          console.warn('Authentication error detected, rotating API key');
          if (apiKeyManager) {
            apiKeyManager.markCurrentKeyAsFailed(`Authentication error: ${errorMessage}`);
          }
        } else if (this.isRateLimitError(errorMessage)) {
          console.warn('Rate limit error detected, waiting before retry');
          if (apiKeyManager) {
            apiKeyManager.markCurrentKeyAsFailed(`Rate limit: ${errorMessage}`);
          }
          // Wait before retrying
          await this.sleep(2000 * (attempt + 1)); // Exponential backoff
        } else {
          // For other errors, don't immediately mark key as failed
          console.warn('Non-quota error, will retry with same key:', errorMessage);
        }

        // Don't retry if no more attempts or no available keys
        if (attempt >= retries || (apiKeyManager && !apiKeyManager.hasAvailableKeys())) {
          break;
        }

        // Wait before retrying
        await this.sleep(1000 * (attempt + 1));
      }
    }

    return {
      text: '',
      success: false,
      error: lastError,
      retryCount,
    };
  }

  /**
   * Check if error indicates quota exhaustion
   */
  private isQuotaExhaustedError(error: string): boolean {
    const quotaPatterns = [
      'quota exceeded',
      'quota exhausted', 
      'billing not enabled',
      'insufficient quota',
      'rate limit exceeded',
      'daily limit exceeded',
      'monthly limit exceeded',
      'credits exhausted',
      'usage limit exceeded',
      'resource_exhausted',
      'RESOURCE_EXHAUSTED',
    ];

    return quotaPatterns.some(pattern => 
      error.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  /**
   * Check if error indicates authentication issues
   */
  private isAuthenticationError(error: string): boolean {
    const authPatterns = [
      'invalid api key',
      'authentication failed',
      'unauthorized',
      'api key not valid',
      'invalid_api_key',
      'unauthenticated',
      'UNAUTHENTICATED',
      'permission denied',
      'PERMISSION_DENIED',
    ];

    return authPatterns.some(pattern => 
      error.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  /**
   * Check if error indicates rate limiting
   */
  private isRateLimitError(error: string): boolean {
    const rateLimitPatterns = [
      'rate limit',
      'too many requests',
      'request rate too high',
      'rate_limit_exceeded',
      'RATE_LIMIT_EXCEEDED',
    ];

    return rateLimitPatterns.some(pattern => 
      error.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Mask API key for logging
   */
  private maskKey(key: string): string {
    if (!key || key.length <= 12) return '***';
    return `${key.substring(0, 8)}...${key.substring(key.length - 4)}`;
  }

  /**
   * Get API key manager status
   */
  public getStatus() {
    if (!apiKeyManager) {
      return {
        manager: 'disabled',
        keys: 0,
        activeKeys: 0,
      };
    }

    const stats = apiKeyManager.getStatistics();
    const status = apiKeyManager.getStatus();

    return {
      manager: 'active',
      ...stats,
      keyDetails: status,
    };
  }

  /**
   * Reset all API keys (for manual recovery)
   */
  public resetAPIKeys(): void {
    if (apiKeyManager) {
      apiKeyManager.resetAllKeys();
      console.log('All API keys have been reset');
    }
  }
}

// Export singleton instance
export const aiClient = AIClient.getInstance();
/**
 * API Key Manager for Google AI services
 * Manages multiple API keys and automatic failover when credits are exhausted
 */

export interface APIKeyStatus {
  key: string;
  isActive: boolean;
  lastError?: string;
  lastErrorTime?: number;
  requestCount: number;
  failureCount: number;
}

export interface APIKeyManagerConfig {
  keys: string[];
  cooldownPeriod: number; // Time in ms before retrying a failed key
  maxFailures: number; // Max failures before marking key as inactive
}

export class APIKeyManager {
  private static instance: APIKeyManager;
  private keyStatuses: APIKeyStatus[] = [];
  private currentKeyIndex: number = 0;
  private config: APIKeyManagerConfig;

  private constructor(config: APIKeyManagerConfig) {
    this.config = config;
    this.initializeKeys();
  }

  public static getInstance(config?: APIKeyManagerConfig): APIKeyManager {
    if (!this.instance) {
      if (!config) {
        throw new Error('APIKeyManager must be initialized with config on first use');
      }
      this.instance = new APIKeyManager(config);
    }
    return this.instance;
  }

  private initializeKeys(): void {
    this.keyStatuses = this.config.keys.map(key => ({
      key,
      isActive: true,
      requestCount: 0,
      failureCount: 0,
    }));
  }

  /**
   * Get the current active API key
   */
  public getCurrentKey(): string | null {
    const activeKeys = this.getActiveKeys();
    
    if (activeKeys.length === 0) {
      console.warn('No active API keys available. Checking for recoverable keys...');
      this.checkRecoverableKeys();
      return this.getActiveKeys()[0]?.key || null;
    }

    // Rotate to next key if current has too many failures
    const currentKey = activeKeys[this.currentKeyIndex % activeKeys.length];
    if (currentKey.failureCount >= this.config.maxFailures) {
      this.rotateToNextKey();
      return this.getCurrentKey();
    }

    return currentKey.key;
  }

  /**
   * Get all currently active keys
   */
  private getActiveKeys(): APIKeyStatus[] {
    return this.keyStatuses.filter(status => status.isActive);
  }

  /**
   * Check if failed keys can be reactivated after cooldown period
   */
  private checkRecoverableKeys(): void {
    const now = Date.now();
    
    this.keyStatuses.forEach(status => {
      if (!status.isActive && status.lastErrorTime) {
        const timeSinceError = now - status.lastErrorTime;
        if (timeSinceError > this.config.cooldownPeriod) {
          console.log(`Reactivating API key after cooldown: ${this.maskKey(status.key)}`);
          status.isActive = true;
          status.failureCount = 0;
          status.lastError = undefined;
          status.lastErrorTime = undefined;
        }
      }
    });
  }

  /**
   * Enhanced error pattern detection
   */
  private isQuotaError(error: string): boolean {
    const quotaPatterns = [
      'quota exceeded',
      'billing not enabled',
      'credits exhausted',
      'usage limit exceeded',
      'monthly quota',
      'daily quota',
      'rate limit exceeded',
      'too many requests'
    ];
    return quotaPatterns.some(pattern => error.toLowerCase().includes(pattern));
  }

  private isAuthError(error: string): boolean {
    const authPatterns = [
      'invalid api key',
      'unauthorized',
      'permission denied',
      'authentication failed',
      'invalid key',
      'api key not found'
    ];
    return authPatterns.some(pattern => error.toLowerCase().includes(pattern));
  }

  private isTemporaryError(error: string): boolean {
    const temporaryPatterns = [
      'service unavailable',
      'internal server error',
      'timeout',
      'network error',
      'connection reset',
      'temporary failure'
    ];
    return temporaryPatterns.some(pattern => error.toLowerCase().includes(pattern));
  }

  /**
   * Mark current key as failed and rotate to next
   */
  public markCurrentKeyAsFailed(error: string): void {
    const activeKeys = this.getActiveKeys();
    if (activeKeys.length === 0) return;

    const currentKey = activeKeys[this.currentKeyIndex % activeKeys.length];
    currentKey.lastError = error;
    currentKey.lastErrorTime = Date.now();

    // Different handling based on error type
    if (this.isQuotaError(error)) {
      // Quota errors should immediately deactivate the key
      currentKey.failureCount = this.config.maxFailures;
      currentKey.isActive = false;
      console.warn(`API key immediately deactivated due to quota error: ${this.maskKey(currentKey.key)} - ${error}`);
    } else if (this.isAuthError(error)) {
      // Auth errors should immediately deactivate the key
      currentKey.failureCount = this.config.maxFailures;
      currentKey.isActive = false;
      console.warn(`API key immediately deactivated due to auth error: ${this.maskKey(currentKey.key)} - ${error}`);
    } else if (this.isTemporaryError(error)) {
      // Temporary errors should not count as much against the key
      currentKey.failureCount += 0.5;
      console.warn(`API key temporary failure (${currentKey.failureCount}/${this.config.maxFailures}): ${this.maskKey(currentKey.key)} - ${error}`);
    } else {
      // Unknown errors count as normal failures
      currentKey.failureCount++;
      console.warn(`API key failed (${currentKey.failureCount}/${this.config.maxFailures}): ${this.maskKey(currentKey.key)} - ${error}`);
    }

    // Deactivate key if it has reached max failures
    if (currentKey.failureCount >= this.config.maxFailures && currentKey.isActive) {
      currentKey.isActive = false;
      console.warn(`API key deactivated due to repeated failures: ${this.maskKey(currentKey.key)}`);
    }

    this.rotateToNextKey();
  }

  /**
   * Mark current key as successful
   */
  public markCurrentKeyAsSuccessful(): void {
    const activeKeys = this.getActiveKeys();
    if (activeKeys.length === 0) return;

    const currentKey = activeKeys[this.currentKeyIndex % activeKeys.length];
    currentKey.requestCount++;
    
    // Reset failure count on successful request
    if (currentKey.failureCount > 0) {
      console.log(`API key recovered: ${this.maskKey(currentKey.key)}`);
      currentKey.failureCount = 0;
      currentKey.lastError = undefined;
    }
  }

  /**
   * Rotate to the next available API key
   */
  private rotateToNextKey(): void {
    const activeKeys = this.getActiveKeys();
    if (activeKeys.length > 1) {
      this.currentKeyIndex = (this.currentKeyIndex + 1) % activeKeys.length;
      console.log(`Rotated to API key: ${this.maskKey(activeKeys[this.currentKeyIndex].key)}`);
    }
  }

  /**
   * Get status of all API keys
   */
  public getStatus(): APIKeyStatus[] {
    return this.keyStatuses.map(status => ({
      ...status,
      key: this.maskKey(status.key), // Mask keys for security
    }));
  }

  /**
   * Reset all API keys to active state
   */
  public resetAllKeys(): void {
    this.keyStatuses.forEach(status => {
      status.isActive = true;
      status.failureCount = 0;
      status.lastError = undefined;
      status.lastErrorTime = undefined;
    });
    this.currentKeyIndex = 0;
    console.log('All API keys have been reset to active state');
  }

  /**
   * Mask API key for logging (show only first 8 and last 4 characters)
   */
  private maskKey(key: string): string {
    if (key.length <= 12) return '***';
    return `${key.substring(0, 8)}...${key.substring(key.length - 4)}`;
  }

  /**
   * Check if any API keys are available
   */
  public hasAvailableKeys(): boolean {
    return this.getActiveKeys().length > 0;
  }

  /**
   * Get statistics for monitoring
   */
  public getStatistics() {
    const totalRequests = this.keyStatuses.reduce((sum, status) => sum + status.requestCount, 0);
    const activeKeyCount = this.getActiveKeys().length;
    const totalKeyCount = this.keyStatuses.length;

    return {
      totalRequests,
      activeKeyCount,
      totalKeyCount,
      currentKeyIndex: this.currentKeyIndex,
      hasAvailableKeys: this.hasAvailableKeys(),
    };
  }
}

/**
 * Initialize API Key Manager with environment variables
 */
export function initializeAPIKeyManager(): APIKeyManager {
  const keys = [
    process.env.GOOGLE_AI_API_KEY_1,
    process.env.GOOGLE_AI_API_KEY_2,
    process.env.GOOGLE_AI_API_KEY_3,
  ].filter(Boolean) as string[];

  if (keys.length === 0) {
    console.warn('No Google AI API keys configured. Using single key fallback.');
    const fallbackKey = process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
    if (fallbackKey) {
      keys.push(fallbackKey);
    }
  }

  if (keys.length === 0) {
    throw new Error('No Google AI API keys found in environment variables');
  }

  const config: APIKeyManagerConfig = {
    keys,
    cooldownPeriod: 5 * 60 * 1000, // 5 minutes
    maxFailures: 3, // Max 3 failures before deactivation
  };

  console.log(`Initialized API Key Manager with ${keys.length} keys`);
  return APIKeyManager.getInstance(config);
}
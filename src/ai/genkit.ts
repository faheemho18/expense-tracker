import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import { initializeAPIKeyManager } from '@/lib/api-key-manager';

// Initialize API Key Manager
let apiKeyManager: ReturnType<typeof initializeAPIKeyManager> | null = null;

try {
  apiKeyManager = initializeAPIKeyManager();
} catch (error) {
  console.warn('Failed to initialize API Key Manager:', error);
}

// Create Genkit instance with dynamic API key
export const ai = genkit({
  plugins: [googleAI({
    apiKey: () => {
      if (!apiKeyManager) {
        // Fallback to environment variables
        return process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
      }
      return apiKeyManager.getCurrentKey();
    }
  })],
  model: 'googleai/gemini-2.0-flash',
});

// Export API key manager for monitoring and management
export { apiKeyManager };

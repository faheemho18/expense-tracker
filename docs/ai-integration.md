# AI Integration Documentation

## Overview

The application includes AI-powered receipt OCR processing, powered by Google AI with a sophisticated multi-key rotation system for cost optimization. **Note: AI expense categorization has been removed from the user interface.**

## AI Components

### Server-Side Architecture
- `src/ai/genkit.ts` - Genkit configuration with Google AI and dynamic API key rotation
- `src/ai/dev.ts` - Development AI utilities
- `src/lib/ai-services.ts` - AI-powered expense categorization and receipt OCR services (server-side)
- `src/lib/ai-client.ts` - Enhanced AI client with automatic failover and retry logic
- `src/lib/api-key-manager.ts` - Multi-API key rotation system for cost optimization

### API Routes
- `src/app/api/ai/categorize/route.ts` - API route for expense categorization
- `src/app/api/ai/ocr/route.ts` - API route for receipt OCR processing
- `src/app/api/ai/status/route.ts` - API route for API key monitoring and management

### Client Components
- `src/hooks/use-expense-categorization.ts` - ❌ **REMOVED** - AI categorization no longer available in UI
- `src/hooks/use-receipt-ocr.ts` - Client hook calling AI OCR API
- `src/hooks/use-api-key-monitor.ts` - Hook for monitoring API key status via API
- `src/components/settings/api-key-monitor.tsx` - Real-time UI for API key management

## AI Features

### ❌ Smart Expense Categorization (REMOVED)
- **Status**: Removed from user interface as of latest update
- **Reason**: Streamlined user experience focusing on manual category selection
- **API**: Backend endpoints still available but not exposed in UI
- **Alternative**: Manual category selection with enhanced dropdown interface

### Receipt OCR Processing
- Automatic extraction of amount, description, date, and merchant from receipts
- AI-powered category suggestion from receipt content
- Auto-population of expense form fields
- Confidence-based validation and error handling

## Multi-API Key Rotation System

### Environment Configuration

**Required Environment Variables:**
```bash
# Primary API key (tested and active)
GOOGLE_AI_API_KEY_1=AIzaSyAsOk2g98gB6-o-8RsVJM7_V53s_aK0qgQ

# Additional keys for rotation (add when available)
GOOGLE_AI_API_KEY_2=your_second_google_ai_api_key  
GOOGLE_AI_API_KEY_3=your_third_google_ai_api_key

# Fallback keys (for backward compatibility)
GOOGLE_AI_API_KEY=your_fallback_google_ai_api_key
GOOGLE_GENAI_API_KEY=your_alternative_api_key_name
```

### Core Features

**Automatic Key Rotation:**
- Intelligent detection of quota exhaustion, authentication errors, and rate limits
- Immediate failover to next available API key when one fails
- 5-minute cooldown period before retrying failed keys
- Maximum 3 failures before temporarily deactivating a key

**Smart Error Detection:**
- Quota exhaustion: "quota exceeded", "billing not enabled", "credits exhausted"
- Authentication: "invalid api key", "unauthorized", "permission denied"
- Rate limiting: "rate limit exceeded", "too many requests"
- Automatic key rotation on detected issues

**Cost Optimization:**
- Distributes requests across multiple API keys to maximize free tier usage
- Prevents hitting quota limits by spreading load
- Real-time monitoring of usage per key
- Configurable failure thresholds and retry logic

### Security-First Design
- All AI processing happens server-side to protect API keys
- Client-side components use secure API routes
- No API keys exposed to browser or client-side code
- Comprehensive error handling and logging

### API Endpoints
- `POST /api/ai/categorize` - ❌ **Not exposed in UI** - Expense categorization with fallback logic
- `POST /api/ai/ocr` - ✅ **Active** - Receipt OCR processing with confidence scoring
- `GET /api/ai/status` - ✅ **Active** - Real-time API key status and statistics
- `POST /api/ai/status` - ✅ **Active** - Manual API key reset and management

## Monitoring & Management

### Real-Time Dashboard (Settings → API Keys)
- Live status of all configured API keys
- Request counts and failure statistics per key
- Error details and last failure timestamps
- Manual refresh and reset controls
- Visual indicators for active/inactive keys

### Statistics Tracked
- Total requests across all keys
- Active vs. total key count
- Current key in rotation
- Individual key performance metrics
- Failure patterns and recovery status

## Implementation Status

### Currently Active
- ✅ 1 Google AI API key configured and tested
- ✅ Server successfully builds and runs with AI functionality
- ✅ Receipt OCR processing working via API routes
- ❌ **Expense categorization UI removed** - API endpoints remain but not exposed
- ✅ Real-time monitoring dashboard operational
- ✅ Automatic failover system ready for additional keys

### Performance & Costs
- Typical OCR request: ~600 tokens input + ~100 tokens output = ~$0.000075
- ~~Categorization request: ~300 tokens input + ~50 tokens output = ~$0.00003~~ (UI removed)
- Monthly cost for 1000 receipts: ~$0.075 (reduced cost with categorization UI removed)

### Error Recovery
- Exponential backoff: 1s, 2s, 4s delays between retries
- Conservative confidence scoring prevents unreliable data usage
- ~~Graceful degradation to rule-based categorization on AI failure~~ (categorization UI removed)
- Comprehensive logging for debugging and monitoring

## Next Steps

1. Add additional Google AI API keys to environment variables
2. Test multi-key rotation under load
3. Monitor cost distribution across keys
4. Configure alerting for key failures

The system is production-ready and actively managing AI costs while ensuring reliable functionality.
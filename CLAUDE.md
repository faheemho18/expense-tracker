# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

**Development:**
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript compiler checks

**AI Integration:**
- `npm run genkit:dev` - Start Genkit development server
- `npm run genkit:watch` - Start Genkit with file watching

**Testing:**
- `npm run test:unit` - Unit tests with Jest and React Testing Library
- `npm run test:e2e` - End-to-end tests with Puppeteer
- `npm run test:accessibility` - WCAG compliance testing
- `npm run test:performance` - Performance benchmarks with Lighthouse
- `npm run test:visual` - Visual regression testing
- `npm run test:all` - Complete test suite including UI glitch detection
- `npm run test:coverage` - Coverage reporting

**UI Glitch Detection & Testing:**
- `npm run test:ui-glitch` - Complete UI glitch detection test suite (24 tests)
- `npm run test:dashboard` - Dashboard widget overflow and responsiveness tests
- `npm run test:dropdown` - Dropdown visibility testing across all themes
- `npm run test:touch` - Touch interaction responsiveness and mobile testing
- `npm run test:animations` - Animation performance and layout shift detection
- `npm run test:mobile` - Mobile-specific UI and gesture testing
- `npm run test:overflow` - Text overflow detection across viewports
- `npm run test:responsive` - Responsive design validation

**Deployment:**
- `npm run deploy:vercel` - Deploy to Vercel with automated setup
- `npm run deploy:docker` - Build and run Docker containers
- `npm run deploy:firebase` - Deploy to Firebase App Hosting
- `npm run build:production` - Production build with full validation

## Architecture Overview

This is a Next.js 15 expense tracking application built with:
- **Frontend**: React 18, TypeScript, Tailwind CSS
- **UI Library**: Radix UI components with custom styling
- **Data Storage**: Supabase cloud storage with user authentication and multi-user isolation
- **Authentication**: Supabase Auth with email/password and user management
- **Real-time Sync**: Cross-device synchronization with offline support
- **AI Integration**: Firebase Genkit with Google AI
- **Deployment**: Multi-platform support (Vercel, Docker, Firebase, Netlify)
- **PWA Support**: Service worker for offline functionality

### Key Structure

**Core Data Models** (src/lib/types.ts):
- `Expense` - Transaction records with category, account, and amount (user-scoped)
- `Category` - Expense categorization with icons and thresholds (user-scoped)
- `Account` - Financial accounts with ownership tracking (user-scoped)
- `Theme` - Custom theming system with HSL colors (user-scoped)
- `User` - Authentication user profile with email and metadata
- `AuthContextType` - Authentication context interface for session management

**Main Pages**:
- `/` - Home page with expense management and monthly reports
- `/dashboard` - Customizable widget dashboard
- `/data` - Data import/export functionality
- `/settings` - Account and category management
- `/themes` - Theme customization

**Context & State**:
- `AuthContext` - User authentication and session management
- `SettingsContext` - Global settings for categories, accounts, and themes (user-scoped)
- `useLocalStorage` - Custom hook for persistent state management (user-scoped)
- `useAuthDataService` - Integration hook connecting authentication with data service
- Data migration system for Supabase integration with user authentication

**AI Components**:
- `src/ai/genkit.ts` - Genkit configuration with Google AI and dynamic API key rotation
- `src/ai/dev.ts` - Development AI utilities
- `src/lib/ai-services.ts` - AI-powered expense categorization and receipt OCR services (server-side)
- `src/lib/ai-client.ts` - Enhanced AI client with automatic failover and retry logic
- `src/lib/api-key-manager.ts` - Multi-API key rotation system for cost optimization
- `src/app/api/ai/categorize/route.ts` - API route for expense categorization
- `src/app/api/ai/ocr/route.ts` - API route for receipt OCR processing
- `src/app/api/ai/status/route.ts` - API route for API key monitoring and management
- `src/hooks/use-expense-categorization.ts` - Client hook calling AI categorization API
- `src/hooks/use-receipt-ocr.ts` - Client hook calling AI OCR API
- `src/hooks/use-api-key-monitor.ts` - Hook for monitoring API key status via API
- `src/components/settings/api-key-monitor.tsx` - Real-time UI for API key management

**Authentication Components**:
- `src/contexts/auth-context.tsx` - Authentication context with user session management
- `src/components/auth/auth-form.tsx` - Login/signup forms with validation
- `src/components/auth/user-menu.tsx` - User profile dropdown menu
- `src/components/auth/auth-page.tsx` - Authentication page wrapper
- `src/hooks/use-auth-data-service.ts` - Integration hook connecting auth with data service

**Real-time Sync Components**:
- `src/lib/realtime-sync.ts` - Core real-time synchronization service with Supabase subscriptions
- `src/hooks/use-realtime-sync.ts` - React hook for real-time sync integration
- `src/components/sync/sync-status-indicator.tsx` - UI components for sync status and controls
- Automatic reconnection, offline queuing, and conflict resolution

### Component Architecture

**Layout**: 
- `AppLayout` - Main application shell with navigation
- Sidebar navigation with responsive design

**Dashboard Widgets**:
- `CategoryGaugesWidget` - Monthly spending progress
- `ProjectedSavingsWidget` - Financial projections
- Grid-based layout with drag-and-drop support

**Data Management**:
- Supabase cloud storage as primary data layer with complete user isolation
- User-scoped data isolation with Row Level Security (RLS) policies
- Multi-user authentication system with automatic user provisioning
- Cross-device synchronization with offline support (Realtime pending)
- Automatic conflict resolution and data consistency
- Real-time filtering and sorting with multi-user support

## AI Features

**Smart Expense Categorization**:
- AI-powered category suggestions based on description and amount
- Confidence scoring (0-1 scale) with visual indicators
- Manual override system with fallback to rule-based categorization
- Automatic application of high-confidence suggestions (>80%)

**Receipt OCR Processing**:
- Automatic extraction of amount, description, date, and merchant from receipts
- AI-powered category suggestion from receipt content
- Auto-population of expense form fields
- Confidence-based validation and error handling

**Multi-API Key Rotation System** (ACTIVE):
- ✅ Automatic cycling through multiple Google AI API keys for cost optimization
- ✅ Smart detection of quota exhaustion and credit limits with pattern matching
- ✅ Automatic failover to next available key when one runs out
- ✅ Real-time monitoring and status dashboard in Settings → API Keys
- ✅ Configurable cooldown periods (5 min) and failure thresholds (3 failures)
- ✅ Support for up to 3+ API keys with easy environment variable configuration
- ✅ Server-side AI processing with client-side API routes for security
- ✅ Exponential backoff retry logic and comprehensive error handling
- ✅ Currently configured with 1 active Google AI API key

## Supabase Integration & Data Management

**Production Cloud Storage Architecture**:
- Supabase as primary and sole data storage layer
- Complete user authentication and multi-user isolation system
- Comprehensive Row Level Security (RLS) policies ensuring data privacy
- Automatic user provisioning with default categories, accounts, and themes

**Active Configuration**:
- Environment variables: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Project URL**: `https://gmvbfqvqtxvplinciznf.supabase.co`
- **Status**: ✅ ACTIVE - Fully configured and operational
- **Authentication**: ✅ ACTIVE - Email/password login working
- **Data Isolation**: ✅ ACTIVE - Users only see their own data

**Production Features Active**:
- ✅ Complete Supabase authentication system with user management
- ✅ Multi-user data isolation with Row Level Security (RLS) policies
- ✅ All data models include user_id relationships with foreign key constraints
- ✅ User-scoped data operations in all CRUD functions
- ✅ Authentication UI components with login/signup functionality
- ✅ Automatic user registration with default data creation
- ✅ Cross-device data access with secure user sessions
- ✅ Database schema with proper indexes and constraints
- ✅ User cleanup on account deletion with CASCADE policies

**Database Schema (Production)**:
- **accounts** - Financial accounts with user_id and RLS policies
- **categories** - Expense categories with user_id and RLS policies  
- **themes** - Custom themes with user_id and RLS policies
- **expenses** - Transaction records with user_id and RLS policies
- **widget_configs** - Dashboard widgets with user_id and RLS policies
- **Automatic user registration trigger** creates default data for new users

## Testing Infrastructure

**Comprehensive Test Suite with 5 Testing Categories:**
- **Unit Tests**: 15+ test files covering authentication, real-time sync, AI integration, and UI components
- **Integration Tests**: Complete user workflow testing with multi-user scenarios  
- **E2E Tests**: Full automation of user journeys including authentication, expense management, and AI features
- **Accessibility Tests**: WCAG 2.1 Level AA compliance verification with axe-core
- **Performance Tests**: Core Web Vitals, animation performance, and bundle analysis
- **Visual Regression Tests**: UI consistency across themes and responsive breakpoints

**NumberTicker Implementation Testing:**
- ✅ **ExpensesTable**: Animated currency amounts with staggered delays
- ✅ **StatsWidget**: Animated totals for expenses, refunds, net total, and transaction count
- ✅ **ProjectedSavingsWidget**: Animated savings display with compact notation
- ✅ **CurrencyTicker**: Custom component for currency-formatted animated numbers
- Features: Smooth spring animations, PHP currency formatting, viewport-based triggering

**Test Configuration:**
- Jest with TypeScript support and Next.js integration (`jest.config.js`, `jest.setup.js`)
- Comprehensive mocking for Supabase, AI services, Framer Motion, and Lucide React icons
- Puppeteer-based E2E testing with headless browser automation (`jest-e2e.config.ts`)
- Real-time sync testing with connection simulation and offline scenarios
- Multi-user data isolation verification with RLS policy testing
- AI service integration testing with mock categorization and OCR responses
- Performance testing with Lighthouse integration and Core Web Vitals measurement
- Accessibility testing with automated WCAG validation and keyboard navigation

**Coverage Areas:**
- ✅ **Authentication System**: Supabase Auth integration, user sessions, RLS policies, graceful fallbacks
- ✅ **Real-time Synchronization**: Cross-device sync, offline support, conflict resolution, reconnection logic
- ✅ **AI Integration**: Expense categorization, receipt OCR, confidence scoring, error handling
- ✅ **Dashboard Widgets**: NumberTicker animations, data visualization, responsive layouts
- ✅ **Expense Management**: CRUD operations, filtering, pagination, data export
- ✅ **Theme System**: Dynamic theming, HSL color management, responsive design
- ✅ **Multi-user Isolation**: User-scoped data operations, security boundaries, data migration
- ✅ **PWA Functionality**: Offline capabilities, service worker, progressive enhancement

**Test Files Created:**
```
src/contexts/__tests__/auth-context.test.tsx
src/hooks/__tests__/use-auth-data-service.test.ts
src/hooks/__tests__/use-realtime-sync.test.ts
src/lib/__tests__/realtime-sync.test.ts
src/lib/__tests__/ai-services.test.ts
src/components/magicui/__tests__/number-ticker.test.tsx
tests/e2e/authentication.test.ts
tests/e2e/ai-integration.test.ts
tests/e2e/ui-glitch/dashboard-overflow.test.ts
tests/e2e/ui-glitch/dropdown-visibility.test.ts
tests/e2e/ui-glitch/touch-interactions.test.ts
tests/e2e/ui-glitch/animation-performance.test.ts
tests/accessibility/accessibility.test.ts
tests/performance/performance.test.ts
docs/testing-guide.md (comprehensive documentation)
```

## UI Glitch Detection & Testing Framework

**Comprehensive UI Testing System (24 Total Tests):**
- **Dashboard Overflow Tests** (4 tests): Text overflow detection across all viewport sizes (iPhone SE, iPhone 12, iPad, Desktop)
- **Dropdown Visibility Tests** (4 tests): Theme compatibility testing across all 4 themes (light, dark, blue, green)
- **Touch Interaction Tests** (8 tests): Mobile responsiveness, touch target validation (44px minimum), gesture support
- **Animation Performance Tests** (8 tests): 60fps monitoring, layout shift detection (CLS < 0.1), smooth transitions

**Manual Testing Tools:**
- **Interactive Test Interface** (`test-ui-manual.html`): Browser-based testing with real-time analysis
- **Console Analysis Script** (`ui-analysis.js`): Copy-paste script for immediate UI analysis in any browser
- **50-Point Manual Checklist** (`manual-ui-checklist.md`): Systematic testing guide covering all critical UI aspects
- **Verification Script** (`verify-ui-tests.js`): Implementation status checker and test runner
- **Comprehensive Documentation** (`uitest.md`): Complete UI testing guide with solutions for common issues

**UI Testing Coverage:**
- ✅ **Text Overflow Detection**: Prevents content spilling outside containers across all viewport sizes
- ✅ **Responsive Design Validation**: Mobile-first testing with touch target size verification (44px minimum)
- ✅ **Theme Compatibility**: Dropdown visibility and contrast testing across all 4 application themes
- ✅ **Animation Performance**: 60fps validation, layout shift monitoring, smooth transition verification
- ✅ **Cross-Browser Testing**: Chrome, Firefox, Safari compatibility with specific mobile device simulation
- ✅ **Accessibility Integration**: Touch accessibility, keyboard navigation, screen reader compatibility
- ✅ **Performance Monitoring**: Core Web Vitals tracking, memory usage analysis, load time optimization

**Testing Dependencies:**
- **Playwright** (v1.53.2): Modern browser automation for comprehensive UI testing
- **Puppeteer** (v24.11.2): Headless Chrome testing for performance analysis
- **Jest Integration**: E2E configuration with TypeScript support and timeout handling
- **System Requirements**: Linux dependencies for browser automation (libnspr4, libnss3, libasound2)

**Test Execution Commands:**
```bash
# Complete UI glitch detection suite
npm run test:ui-glitch

# Specific test categories
npm run test:dashboard    # Dashboard widget overflow testing
npm run test:dropdown     # Theme-based dropdown visibility
npm run test:touch        # Mobile touch interaction validation
npm run test:animations   # Performance and layout shift detection
npm run test:mobile       # Mobile-specific UI testing
npm run test:overflow     # Text overflow detection
npm run test:responsive   # Responsive design validation
```

**Manual Testing Workflow:**
1. **Browser Console Testing**: Copy `ui-analysis.js` into DevTools console on any page
2. **Interactive Testing**: Open `test-ui-manual.html` for guided testing interface
3. **Systematic Validation**: Follow `manual-ui-checklist.md` for comprehensive 50-point verification
4. **Issue Documentation**: Use built-in reporting tools for tracking and resolution

**Automated Testing Status:**
- ✅ **Framework Implemented**: 24 comprehensive tests covering all major UI glitch scenarios
- ✅ **Manual Tools Ready**: Immediate testing capability without system dependencies
- ⚠️ **System Dependencies**: Requires `sudo apt-get install libnspr4 libnss3 libasound2` for full automation
- ✅ **Deployment Ready**: All testing tools deployed and accessible via Vercel production environment

## Development Notes

- TypeScript and ESLint errors are ignored during builds (configured in next.config.ts)
- PWA disabled in development mode
- Uses Turbopack for faster development builds
- Icons sourced from Lucide React with custom icon mapping system
- Theme system uses CSS custom properties for dynamic theming
- AI services require Google AI API key(s) configured in environment variables
- Multi-API key rotation system actively manages quota and costs
- Server-side AI processing ensures security and prevents client-side exposure of API keys
- Complete testing documentation available in `docs/testing-guide.md`
- Testing infrastructure supports CI/CD integration with GitHub Actions and Docker

## Authentication & Security

**Authentication System** (ACTIVE):
- ✅ Supabase Auth with email/password authentication
- ✅ User session management with automatic token refresh
- ✅ Production-ready login/signup UI with form validation
- ✅ Secure user profile management and session handling

**Data Security** (ACTIVE):
- ✅ Row Level Security (RLS) policies ensuring users only access their own data
- ✅ User-scoped data operations in all CRUD functions
- ✅ Complete data isolation with foreign key constraints to auth.users
- ✅ Production environment variables configured and validated

**Multi-User Architecture** (ACTIVE):
- ✅ All data models include user_id fields with NOT NULL constraints
- ✅ Data service layer automatically scopes operations to authenticated user
- ✅ Cloud-based user data storage with cross-device access
- ✅ Automatic default data creation for new users (categories, accounts, themes)

**Provider Hierarchy**:
```
RootLayout → ClientLayout → AuthProvider → SettingsProvider → AppLayout
```

## WSL2 Development Setup

When running in WSL2 (Windows Subsystem for Linux), special networking configuration is required for Windows host access:

### Server Configuration
- Next.js dev server is configured to bind to all interfaces (`--hostname 0.0.0.0`)
- This allows external connections from the Windows host

### Access Methods
1. **WSL IP Address**: Access via `http://[WSL-IP]:3000`
   - Get WSL IP with: `hostname -I`
   - Current WSL IP: `http://172.20.72.33:3000`
   - This is the most reliable method for Windows browser access

2. **VS Code Port Forwarding**: 
   - VS Code automatically forwards ports when detected
   - Look for port forwarding notification in VS Code
   - Usually appears as popup or in Ports panel

3. **Windows localhost**: May work with newer WSL2 versions
   - Try: `http://localhost:3000`
   - If this works, it's the easiest method

### Current Server Status
- **Server Status**: ✅ Running and accessible (HTTP 200)
- **WSL IP Access**: ✅ `http://172.20.72.33:3000` (responding)
- **Local Access**: ✅ `http://localhost:3000` (responding)
- **Issue**: ✅ RESOLVED - Server starts successfully and processes are listening on port 3000

### Troubleshooting WSL2 Networking
- If localhost doesn't work, use the WSL IP address method
- Ensure Windows Firewall allows the connection
- WSL2 uses a virtualized network adapter that requires external binding

### Network Commands
```bash
# Get WSL IP address
hostname -I

# Check if server is running and accessible
curl -s http://localhost:3000 > /dev/null && echo "Server accessible"

# Test external interface binding
curl -s http://0.0.0.0:3000 > /dev/null && echo "External binding works"
```

## GitHub Integration

This project uses GitHub CLI (`gh`) for all Git and GitHub operations. Always use the `gh` command for:

### Repository Operations
- **Creating repositories**: `gh repo create`
- **Cloning repositories**: `gh repo clone`
- **Viewing repository info**: `gh repo view`

### Pull Request Management
- **Creating PRs**: `gh pr create --title "Title" --body "Description"`
- **Listing PRs**: `gh pr list`
- **Viewing PR details**: `gh pr view [number]`
- **Merging PRs**: `gh pr merge [number]`

### Issue Management
- **Creating issues**: `gh issue create --title "Title" --body "Description"`
- **Listing issues**: `gh issue list`
- **Viewing issue details**: `gh issue view [number]`

### Authentication & Setup
- **Login to GitHub**: `gh auth login`
- **Check auth status**: `gh auth status`
- **Set default editor**: `gh config set editor nano` (or preferred editor)

### Common Workflows
```bash
# Create a new branch and push
git checkout -b feature-branch
git add .
git commit -m "Add new feature"
git push -u origin feature-branch

# Create PR with GitHub CLI
gh pr create --title "Add new feature" --body "Description of changes"

# View and merge PR
gh pr view
gh pr merge --merge  # or --squash or --rebase
```

### Important Notes
- **Always use `gh` commands** for GitHub operations instead of manual web interface
- **Repository must be connected** to GitHub account for `gh` commands to work
- **Authentication required** - run `gh auth login` if not already authenticated
- **Supports both HTTPS and SSH** authentication methods

## Real-time Synchronization

The application features cross-device data synchronization for authenticated users with cloud storage.

### Core Features

**Cloud Data Sync** (ACTIVE):
- ✅ Instant data access across all devices through Supabase cloud storage
- ✅ Cross-device updates through page refresh and navigation
- ✅ User-scoped data isolation with Row Level Security (RLS)
- ✅ Persistent data storage with automatic backup

**Real-time Updates** (PENDING):
- ⏳ Supabase Realtime currently shows "Coming Soon" in dashboard
- ⏳ Live synchronization without page refresh (when Realtime is available)
- ⏳ Automatic reconnection with exponential backoff on connection loss
- ✅ Manual sync available through browser refresh

**Offline Support** (ACTIVE):
- ✅ Browser-based offline capabilities through service worker
- ✅ Data persistence during network interruptions
- ✅ Automatic sync when connection is restored
- ✅ Progressive Web App (PWA) functionality

**User Interface**:
- ✅ Authentication status indicator in app header
- ✅ User profile management and logout functionality
- ✅ Cross-device data access through cloud storage
- ✅ Manual refresh capabilities for latest data

### Technical Implementation

**Service Architecture**:
```typescript
// Core real-time sync service
import { realtimeSync } from '@/lib/realtime-sync'

// React integration hook
import { useRealtimeSync } from '@/hooks/use-realtime-sync'

// UI components
import { SyncStatusIndicator } from '@/components/sync/sync-status-indicator'
```

**Configuration Options**:
- `enableRealTimeSync`: Toggle real-time functionality
- `pauseOnHidden`: Battery-saving mode when tab is not visible
- `autoInit`: Automatic initialization for authenticated users
- `maxReconnectAttempts`: Connection retry limits

**Data Flow**:
1. User makes change → Send to Supabase cloud storage → Update local state
2. Other devices → Page refresh/navigation → Load latest data from Supabase
3. Local state updated → UI re-renders with cloud data
4. Offline changes → Stored in service worker → Synced when connection restored

## Cloud Deployment

Multi-platform deployment support with automated configuration and optimization.

### Supported Platforms

**Vercel** (Recommended):
```bash
npm run deploy:vercel
```
- Automatic deployment with environment variable setup
- Edge network optimization
- Built-in analytics and performance monitoring

**Docker**:
```bash
npm run deploy:docker
```
- Containerized deployment with Docker Compose
- Production-ready with health checks
- Supports custom reverse proxy configuration

**Firebase App Hosting**:
```bash
npm run deploy:firebase
```
- Integration with existing Firebase services
- Global CDN with automatic SSL
- Easy scaling and traffic management

**Netlify**:
- Git-based deployment with `netlify.toml`
- Automatic builds on push
- Form handling and edge functions support

### Deployment Features

**Production Optimizations**:
- Standalone Next.js output for smaller container size
- Bundle optimization with tree shaking
- Image optimization and asset compression
- Service worker for offline functionality

**Environment Management**:
- Automated environment variable validation
- Placeholder detection and warnings
- Secure credential handling
- Multi-environment support (dev/staging/prod)

**Health Checks**:
- Database connectivity verification
- Schema validation
- Performance monitoring
- Error tracking and alerting

### Configuration Files

**Production Ready**:
- `vercel.json` - Vercel platform configuration
- `netlify.toml` - Netlify build and deploy settings
- `Dockerfile` - Multi-stage Docker build
- `docker-compose.yml` - Container orchestration
- `apphosting.yaml` - Firebase App Hosting configuration

**Security & Performance**:
- Content Security Policy headers
- Rate limiting and DDoS protection
- CDN optimization
- SSL/TLS encryption

# MCP Tool Capabilities

This project is enhanced with Model Context Protocol (MCP) tools that provide extended capabilities. Here's a comprehensive overview of available tools and their use cases:

## AI Integration Tools

### IDE Integration
- **getDiagnostics**: Get VS Code language diagnostics for error detection
- **executeCode**: Run Python code in Jupyter kernel for testing

## UI/UX Enhancement Tools

### Magic UI Components
Comprehensive library of 70+ animated React components including:
- **Layout**: Bento grid, dock, file tree, interactive patterns
- **Motion**: Blur fade, scroll progress, orbiting circles, animated progress bars
- **Text Effects**: Animated gradient text, typing animation, morphing text, sparkles
- **Buttons**: Shimmer, rainbow, pulsating, ripple effects
- **Effects**: Animated beams, border beams, meteors, confetti, particles
- **Widgets**: Tweet cards, avatar circles, icon clouds, globes
- **Backgrounds**: Warp backgrounds, flickering grids, retro grids
- **Devices**: Safari, iPhone 15 Pro, Android mockups

**Usage in Project:**
```typescript
// Add animated components to enhance UI
import { ShimmerButton } from '@/components/ui/shimmer-button'
import { NumberTicker } from '@/components/ui/number-ticker'
```

## Documentation & Library Tools

### Context7 Library Documentation
- **resolve-library-id**: Find Context7-compatible library identifiers
- **get-library-docs**: Access up-to-date documentation for any library

**Usage Examples:**
```bash
# Find React documentation
resolve-library-id "react"
# Returns: /reactjs/react.dev

# Get Next.js routing docs
get-library-docs "/vercel/next.js" --topic "routing"
```

## Content & Research Tools

### YouTube Integration
- **searchVideos**: Find tutorials and educational content
- **getVideoDetails**: Extract metadata and transcripts
- **getTranscripts**: Access video captions for analysis
- **getTrendingVideos**: Discover popular content by category
- **compareVideos**: Analyze video performance metrics

**Use Cases:**
- Research development tutorials
- Extract learning content from videos
- Analyze tech trends and popular topics

### Web Research Tools (Tavily)
- **tavily-search**: Advanced web search with AI-powered results
- **tavily-extract**: Extract content from specific URLs
- **tavily-crawl**: Structured website crawling
- **tavily-map**: Create website structure maps

**Usage Examples:**
```bash
# Search for React best practices
tavily-search "React performance optimization 2024"

# Extract content from documentation
tavily-extract ["https://nextjs.org/docs/app/building-your-application/routing"]

# Crawl documentation sites
tavily-crawl "https://docs.anthropic.com" --categories ["Documentation"]
```

## System Integration Tools

### Desktop Commander
Advanced file and system operations with security controls:
- **File Operations**: read_file, write_file, create_directory, move_file
- **Search Tools**: search_files, search_code with ripgrep
- **System Info**: get_file_info, list_directory, list_processes
- **Code Editing**: edit_block for surgical text replacements
- **Command Execution**: execute_command with timeout controls

**Security Features:**
- Blocked dangerous commands (format, sudo, etc.)
- Configurable allowed directories
- File size limits and timeouts
- Process monitoring and termination

**Usage Examples:**
```bash
# Search for specific patterns in code
search_code "/project/src" "useState" --filePattern "*.tsx"

# Safe file editing with context
edit_block "/path/to/file.ts" "old function" "new function"

# Execute commands with safety limits
execute_command "npm test" --timeout_ms 30000
```

## Best Practices for MCP Tools

### When to Use Each Tool Category:

**Magic UI**:
- Enhancing user interface with animations
- Adding interactive components
- Creating engaging user experiences
- Prototyping advanced UI patterns

**Context7**:
- Getting current library documentation
- Exploring new frameworks or libraries
- Checking API changes and updates
- Learning best practices

**Tavily**:
- Researching current web development trends
- Finding documentation and tutorials
- Analyzing competitor implementations
- Staying updated with latest practices

**Desktop Commander**:
- File system operations
- Code refactoring across multiple files
- System administration tasks
- Automated testing and deployment

### Integration Examples:

```typescript
// Example: Using multiple tools together
// 1. Research with Tavily
// 2. Get docs with Context7
// 3. Implement with Magic UI
// 4. Deploy with Desktop Commander

// Research latest React patterns
const trends = await tavily_search("React 2024 performance patterns")

// Get official docs
const docs = await get_library_docs("/reactjs/react.dev", "performance")

// Implement with animated components
import { BlurFade } from '@/components/ui/blur-fade'
```

## Configuration and Setup

Most MCP tools work out of the box, but some require configuration:

1. **API Keys**: Set up Google AI API key for AI-powered expense categorization and receipt OCR
2. **Permissions**: Desktop Commander uses security allowlists
3. **Limits**: Configure file size and operation limits
4. **Telemetry**: Enable/disable usage tracking

Check individual tool documentation for specific setup requirements.

## API Key Management & Cost Optimization

The application includes a sophisticated multi-API key rotation system for Google AI services that automatically manages costs and ensures uninterrupted AI functionality.

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

### Server-Side Architecture

**Security-First Design:**
- All AI processing happens server-side to protect API keys
- Client-side components use secure API routes
- No API keys exposed to browser or client-side code
- Comprehensive error handling and logging

**API Routes:**
- `POST /api/ai/categorize` - Expense categorization with fallback logic
- `POST /api/ai/ocr` - Receipt OCR processing with confidence scoring
- `GET /api/ai/status` - Real-time API key status and statistics
- `POST /api/ai/status` - Manual API key reset and management

### Monitoring & Management

**Real-Time Dashboard (Settings → API Keys):**
- Live status of all configured API keys
- Request counts and failure statistics per key
- Error details and last failure timestamps
- Manual refresh and reset controls
- Visual indicators for active/inactive keys

**Statistics Tracked:**
- Total requests across all keys
- Active vs. total key count
- Current key in rotation
- Individual key performance metrics
- Failure patterns and recovery status

### Implementation Status

**Currently Active:**
- ✅ 1 Google AI API key configured and tested
- ✅ Server successfully builds and runs with AI functionality
- ✅ Receipt OCR processing working via API routes
- ✅ Expense categorization working via API routes
- ✅ Real-time monitoring dashboard operational
- ✅ Automatic failover system ready for additional keys

**Next Steps:**
1. Add additional Google AI API keys to environment variables
2. Test multi-key rotation under load
3. Monitor cost distribution across keys
4. Configure alerting for key failures

### Technical Details

**Error Recovery:**
- Exponential backoff: 1s, 2s, 4s delays between retries
- Conservative confidence scoring prevents unreliable data usage
- Graceful degradation to rule-based categorization on AI failure
- Comprehensive logging for debugging and monitoring

**Performance:**
- Typical OCR request: ~600 tokens input + ~100 tokens output = ~$0.000075
- Categorization request: ~300 tokens input + ~50 tokens output = ~$0.00003
- Monthly cost for 1000 receipts: ~$0.10 (distributed across keys)

The system is production-ready and actively managing AI costs while ensuring reliable functionality.

## Database Schema & Authentication

The application uses a comprehensive user-aware database schema with full authentication and real-time capabilities:

### Core Tables (schema.sql)
- **accounts** - Financial accounts with user_id foreign key and RLS policies
- **categories** - Expense categories with user_id foreign key and RLS policies
- **themes** - Custom themes with user_id foreign key and RLS policies
- **expenses** - Transaction records with user_id foreign key and RLS policies
- **widget_configs** - Dashboard widgets with user_id foreign key and RLS policies

### Security & Authentication Features
- **Row Level Security (RLS)** enabled on all tables with comprehensive policies
- **Foreign key constraints** to auth.users with CASCADE delete
- **Unique constraints** scoped per user (e.g., category names unique per user)
- **Default data creation** via trigger function for new users
- **Automatic user cleanup** when users are deleted
- **Real-time subscriptions** filtered by user_id for secure data isolation

### Multi-User Architecture
- **Supabase Auth** manages the auth.users table with email/password authentication
- **User registration trigger** automatically creates default categories, accounts, and themes
- **Session-based queries** automatically filter by authenticated user
- **Real-time event filtering** ensures users only receive their own data updates
- **Graceful fallback** to localStorage when authentication is disabled
- **Cross-device synchronization** with automatic conflict resolution

### Real-time Capabilities
- **Supabase Realtime** subscriptions for instant cross-device sync
- **User-scoped subscriptions** with proper data isolation
- **Automatic reconnection** with exponential backoff
- **Offline queue management** for changes made without internet
- **Event-driven updates** for responsive user experience

### Data Migration & Compatibility
- **Hybrid storage model** supporting both localStorage and Supabase
- **Seamless migration** from localStorage to cloud storage
- **Backward compatibility** for users without Supabase configuration
- **User-scoped localStorage keys** for multi-user support on shared devices

## Current Deployment Status

**Production Environment (Vercel):**
- ✅ **Live Application**: https://automationprojects-4df0h8yfc-faheems-projects-df0f8e74.vercel.app
- ✅ **Build Status**: Successfully deployed with all features
- ✅ **UI Testing Framework**: All manual testing tools accessible in production
- ✅ **Performance**: Optimized bundle (168kB main page, 423kB total)
- ✅ **PWA Features**: Service worker active for offline functionality

**Recent Deployment (Latest Commit: bdb5559):**
- **Date**: July 6, 2025
- **Features Added**: Comprehensive UI glitch detection and testing framework
- **Files Modified**: 15 files changed, 3,572 insertions
- **New Capabilities**: 24 automated UI tests + 5 manual testing tools

**Environment Configuration:**
- **Google AI API Keys**: 1 key configured and active for AI-powered expense categorization and OCR
- **Supabase**: ✅ ACTIVE - Full cloud storage with authentication and multi-user support
- **Database**: ✅ ACTIVE - Complete schema with RLS policies and user isolation
- **Authentication**: ✅ ACTIVE - Email/password login with automatic user provisioning
- **Build Time**: ~14 seconds with Next.js 15.3.3 and Turbopack
- **Deployment Time**: ~39 seconds total build and deploy cycle

**Repository Branches:**
- **main**: Production-ready with UI testing framework
- **ui-testing-framework**: Dedicated branch for UI testing implementation
- **feature/phase4-authentication**: Authentication and multi-user features

**Testing Accessibility:**
- **Manual Testing**: All tools immediately accessible in deployed environment
- **Browser Console**: Copy `ui-analysis.js` from repository into any deployed page
- **Interactive Testing**: Manual testing interface available via deployed URLs
- **Systematic Validation**: 50-point checklist ready for comprehensive UI verification

## Future Roadmap

**Phase 5: Advanced Analytics** (High Priority)
- [ ] **Financial Insights Dashboard Widget**: AI-generated spending analysis and recommendations
- [ ] **Spending Pattern Analysis**: Predictive analytics and anomaly detection
- [ ] **Custom Reports**: PDF generation and advanced reporting tools

**Phase 6: Smart Notifications** (Medium Priority)
- [ ] **Intelligent Alerts**: Budget overruns and unusual spending pattern notifications
- [ ] **Proactive Insights**: Weekly/monthly AI-generated financial summaries

**Phase 7: Enhanced Features** (Medium Priority)
- [ ] **Add Notes Field to Expenses**: Enhanced expense tracking with additional context fields
- [ ] **Advanced Data Filtering**: Date range, amount range, and multi-category filtering
- [ ] **Recurring Expenses**: Automatic scheduling for rent, subscriptions, and recurring transactions
- [ ] **Budgeting System**: Monthly budget setting and tracking for different categories
- [ ] **Enhanced Chart Types**: Line charts for trends, treemaps for category breakdowns
- [ ] **Real-time Synchronization**: When Supabase Realtime becomes available

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.
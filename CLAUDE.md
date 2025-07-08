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
- `AppLayout` - Main application shell with adaptive navigation
- **Desktop**: Sidebar navigation with collapsible icon behavior
- **Mobile**: Header + bottom navigation (sidebar removed for cleaner UX)
- Responsive design with 768px breakpoint for navigation transition

**Navigation Architecture**:
- **Mobile Navigation (< 768px)**:
  - Header: Logo + MiniSyncStatus + UserMenu
  - Bottom Navigation: 5 primary routes (Expenses, Dashboard, Data, Themes, Settings)
  - Touch-optimized with 44px minimum target sizes
  - No sidebar elements for cleaner mobile UX
- **Desktop Navigation (≥ 768px)**:
  - Collapsible sidebar with icon/expanded states
  - SidebarTrigger for manual collapse/expand
  - UserMenu in both sidebar footer and header
  - All 5 navigation routes accessible via sidebar
- **UserMenu Placement**:
  - Mobile: Header only (accessible via top-right)
  - Desktop: Dual placement (sidebar footer + header)
  - Consistent functionality across all placements

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

**Comprehensive Test Suite** (5 categories, 15+ test files):
- **Unit Tests**: Authentication, real-time sync, AI integration, UI components
- **Integration Tests**: Multi-user workflow testing with RLS policy verification  
- **E2E Tests**: Full user journeys (auth, expense management, AI features)
- **Accessibility Tests**: WCAG 2.1 Level AA compliance with axe-core
- **Performance Tests**: Core Web Vitals, animation performance, bundle analysis

**Test Configuration**: Jest + TypeScript, Puppeteer E2E, comprehensive mocking for Supabase/AI services

**Coverage**: Authentication system, real-time sync, AI integration, dashboard widgets, expense management, theming, multi-user isolation, PWA functionality

## UI Glitch Detection & Testing Framework

**24-Test UI System**: Dashboard overflow (4), dropdown visibility (4), touch interactions (8), animation performance (8)

**Navigation Testing Framework**: Mobile sidebar redundancy removal validation, cross-platform navigation testing, responsive breakpoint testing, UserMenu accessibility validation

**Testing Tools**: Interactive browser interface, console analysis script, 50-point manual checklist, automated touch target validation

**Coverage**: Text overflow detection, responsive design validation, theme compatibility, animation performance (60fps), cross-browser testing, accessibility integration, navigation behavior validation

**Dependencies**: Playwright (v1.53.2), Puppeteer (v24.11.2), Jest integration

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

**Server Configuration**: Next.js dev server binds to all interfaces (`--hostname 0.0.0.0`) for Windows host access

**Access Methods**: 
1. WSL IP address (`hostname -I` → `http://172.20.72.33:3000`)
2. VS Code port forwarding (automatic)
3. Windows localhost (`http://localhost:3000`)

**Status**: ✅ Server running and accessible on all interfaces

## GitHub Integration

Uses GitHub CLI (`gh`) for all Git/GitHub operations:
- **Repository**: `gh repo create/clone/view`
- **Pull Requests**: `gh pr create/list/view/merge`
- **Issues**: `gh issue create/list/view`
- **Auth**: `gh auth login/status`

**Workflow**: Create branch → Push → `gh pr create` → `gh pr merge`

## Real-time Synchronization

**Cloud Data Sync** (ACTIVE): Instant cross-device access via Supabase cloud storage with RLS data isolation

**Real-time Updates** (PENDING): Supabase Realtime "Coming Soon" - currently manual sync via page refresh

**Offline Support** (ACTIVE): Service worker for PWA functionality, data persistence during network interruptions

**Data Flow**: User change → Supabase cloud → Update local state → UI re-render

## Cloud Deployment

**Supported Platforms**: Vercel (recommended), Docker, Firebase App Hosting, Netlify

**Production Optimizations**: Standalone Next.js output, bundle optimization, image compression, service worker

**Security**: CSP headers, rate limiting, CDN optimization, SSL/TLS encryption

**Configuration Files**: `vercel.json`, `netlify.toml`, `Dockerfile`, `docker-compose.yml`, `apphosting.yaml`


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

**Recent Deployment (Latest Commit: da04b02):**
- **Date**: July 7, 2025
- **Features Added**: Mobile dashboard responsiveness testing and verification
- **Major Milestones**: Successfully resolved dashboard module client-side errors
- **UI Improvements**: Critical viewport and table responsiveness fixes implemented
- **Testing Status**: Complete mobile dashboard responsiveness verification completed

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

## Development History & Evolution

### Phase 1: Initial Supabase Setup & Configuration
**Date**: July 6, 2025 | **Status**: ✅ COMPLETED

**Objectives**: Establish Supabase project connection and prepare for multi-user authentication

**Key Achievements**:
- Successfully connected to Supabase cloud infrastructure (Project: `https://gmvbfqvqtxvplinciznf.supabase.co`)
- Configured production environment variables
- Established foundation for cloud storage migration

### Phase 2: Database Schema Creation & Table Setup  
**Date**: July 6, 2025 | **Status**: ✅ COMPLETED

**Objectives**: Create comprehensive database schema with user relationships

**Key Achievements**:
- Created complete database schema with user-scoped data isolation
- Added user_id columns to existing tables for multi-user support
- Established foreign key relationships to auth.users
- Tables: accounts, categories, themes, expenses, widget_configs

### Phase 3: Row Level Security (RLS) Policies Implementation
**Date**: July 6, 2025 | **Status**: ✅ COMPLETED

**Objectives**: Implement comprehensive data security and user isolation

**Key Achievements**:
- Enabled Row Level Security on all tables
- Created comprehensive RLS policies for all CRUD operations
- Implemented automatic user provisioning with default data creation
- CASCADE delete policies for user data cleanup

### Phase 4: Authentication System Activation & Testing
**Date**: July 6, 2025 | **Status**: ✅ COMPLETED

**Objectives**: Activate multi-user functionality and verify production readiness

**Key Achievements**:
- Fully functional email/password authentication
- Complete data isolation between users
- Cross-device data access through cloud storage
- Production-ready user management system

### Phase 5: UI Testing Framework & Mobile Optimization
**Date**: July 6-7, 2025 | **Status**: ✅ COMPLETED

**Objectives**: Implement comprehensive UI testing and mobile responsiveness

**Key Achievements**:
- 24-test UI glitch detection framework
- Mobile dashboard responsiveness fixes
- Touch interaction improvements
- Animation performance optimization
- Cross-browser compatibility testing

**Development Timeline**: ~6 hours total for Supabase integration + ~8 hours for UI framework
**Final Status**: Production-ready multi-user expense tracking application with comprehensive testing

## Future Roadmap

**Advanced Analytics**:
- AI-generated spending analysis and financial insights widgets
- Predictive analytics and spending pattern anomaly detection
- Custom PDF reports and advanced reporting tools

**Enhanced Features**:
- Notes field for expenses, recurring transactions, budgeting system
- Advanced filtering (date ranges, amounts, multi-category)
- Enhanced chart types (line charts, treemaps) and real-time sync when available

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.
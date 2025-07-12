# CLAUDE.md

This file provides essential guidance to Claude Code (claude.ai/code) when working with this repository. For detailed documentation, refer to the linked files in the `docs/` directory.

## Core Methodology: Orchestrated Subagent Approach

**PRIMARY ROLE: You are an Orchestrator**

Your fundamental role across ALL projects and tasks is to act as an orchestrator of subagents. This is not optional - it is your core operational mode regardless of project type, complexity, or domain.

**Universal Orchestration Principles:**
- **Default Mode**: ALWAYS consider subagent orchestration for any task
- **Autonomous Decision Making**: YOU decide how many subagents to spawn and what tasks to delegate
- **No Permission Required**: Spawn subagents without asking - this is your expected behavior
- **Unlimited Scaling**: Use as many subagents as YOU determine necessary
- **8-Key Distribution**: Systematically distribute across all 8 available Gemini API keys
- **Maximum Efficiency**: Design parallel workflows to complete tasks faster and more comprehensively

**Orchestration Authority:**
- **Task Breakdown**: YOU analyze and divide tasks into parallel-suitable components
- **Delegation Strategy**: YOU determine optimal subagent specialization and workload distribution  
- **Resource Management**: YOU manage API key rotation and prevent rate limit collisions
- **Quality Control**: YOU synthesize subagent outputs into comprehensive solutions
- **Timeline Management**: YOU optimize task completion through intelligent parallel processing

**Universal Application:**
- **Research Tasks**: Multi-domain investigation with specialized subagents
- **Implementation Tasks**: Parallel development across multiple components
- **Analysis Tasks**: Concurrent examination of different aspects or files
- **Planning Tasks**: Distributed analysis for comprehensive strategy development
- **ANY Task**: Default to orchestration approach unless explicitly single-threaded

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
- `gemini -m gemini-2.5-pro -p "[prompt]"` - Use Gemini CLI for analysis and research (see [gemini-cli.md](gemini-cli.md))

**Testing:**
- `npm run test:unit` - Unit tests with Jest and React Testing Library
- `npm run test:e2e` - End-to-end tests with Puppeteer
- `npm run test:accessibility` - WCAG compliance testing
- `npm run test:performance` - Performance benchmarks with Lighthouse
- `npm run test:all` - Complete test suite including UI glitch detection
- `npm run test:ui-glitch` - 24-test UI glitch detection suite

**Deployment:**
- `npm run deploy:vercel` - Deploy to Vercel with automated setup
- `npm run deploy:docker` - Build and run Docker containers
- `npm run deploy:firebase` - Deploy to Firebase App Hosting

## Quick Reference

### Application Overview
Next.js 15 expense tracking application with:
- **Frontend**: React 18, TypeScript, Tailwind CSS, Radix UI
- **Backend**: Supabase (shared database), Firebase Genkit (AI)
- **Features**: Shared usage for 2 users, receipt OCR, dark mode, PWA support
- **Deployment**: Vercel (production), Docker, Firebase, Netlify

### Current Status
- ✅ **Production**: https://automationprojects-4df0h8yfc-faheems-projects-df0f8e74.vercel.app
- ✅ **Dark Mode**: Comprehensive dark mode implementation with toggle and system preference detection
- ✅ **Mobile Navigation**: Optimized with sidebar redundancy removed
- ✅ **Mobile Responsiveness**: Settings tables optimized for mobile viewport
- ✅ **Shared Usage**: No authentication required - direct access for 2 users
- ✅ **Cloud Storage**: Supabase shared database with persistent data
- ✅ **AI Features**: Receipt OCR with Google AI (expense categorization removed)
- ✅ **Camera Interface**: Large embedded camera with rear camera default and front/rear toggle for receipt capture
- ✅ **Testing**: 24-test UI framework with comprehensive coverage
- ✅ **TypeScript**: Zero compilation errors - complete type safety across entire codebase

### Key Architecture
- **Navigation**: Desktop sidebar + Mobile bottom nav (768px breakpoint)
- **Theme System**: HSL-based themes with dark mode support and system preference detection
- **Access Model**: No authentication - direct shared access for 2 users
- **Data Storage**: Supabase cloud with shared database (no user isolation)
- **AI Integration**: Server-side processing with automatic failover
- **Testing**: Jest + Puppeteer + axe-core + Lighthouse integration

## Detailed Documentation

### 📐 [Architecture Documentation](docs/architecture.md)
Complete system architecture, component structure, navigation system, data models, and security implementation.

**Key Sections:**
- System overview and tech stack
- Core data models and application structure
- Navigation architecture (mobile vs desktop)
- Component hierarchy and layout system
- Data management and security architecture

### 🤖 [AI Integration Documentation](docs/ai-integration.md)
Comprehensive AI features including expense categorization, receipt OCR, and multi-API key management.

**Key Sections:**
- AI components and server-side architecture
- Smart expense categorization and receipt OCR
- Multi-API key rotation system
- Environment configuration and security
- Monitoring, management, and cost optimization

### 🧪 [Testing Framework Documentation](docs/testing-framework.md)
Complete testing infrastructure covering unit tests, E2E tests, accessibility, performance, and UI glitch detection.

**Key Sections:**
- 5 test categories with 24 specialized UI tests
- Testing tools and commands
- UI glitch detection framework
- Performance and accessibility testing
- CI/CD integration and coverage areas

### 🗄️ [Database Schema Documentation](docs/database-schema.md)
Database design, authentication system, Row Level Security policies, and multi-user architecture.

**Key Sections:**
- Supabase configuration and core tables
- Row Level Security (RLS) implementation
- Authentication system and user management
- Real-time capabilities and data migration
- Performance optimization and security features

### 📚 [Development History Documentation](docs/development-history.md)
Complete development timeline across 6 phases, from Supabase setup to camera selection implementation.

**Key Sections:**
- 6 development phases with technical details
- Recent commit analysis and major milestones
- Mobile navigation crash resolution and camera selection implementation
- Performance improvements and bug fixes
- Development metrics and current status

### 🚀 [Deployment Documentation](docs/deployment.md)
Multi-platform deployment, production optimization, environment configuration, and monitoring.

**Key Sections:**
- Supported platforms (Vercel, Docker, Firebase, Netlify)
- Production deployment and environment configuration
- Build optimization and security implementation
- Monitoring, analytics, and real-time synchronization
- GitHub integration and WSL2 development setup

## Development Notes

### Mobile Navigation Architecture
- **Desktop (≥768px)**: Sidebar with collapsible icon behavior
- **Mobile (<768px)**: Header + bottom navigation only (sidebar hidden)
- **Implementation**: `{!isMobile && <Sidebar>}` conditional rendering
- **UserMenu**: Header-only on mobile, dual placement on desktop

### Mobile Responsiveness
- **Settings Tables**: Categories and Accounts tabs use responsive card layouts
- **Mobile Layout**: Vertical stacking with touch-friendly controls (h-11 inputs, h-9 buttons)  
- **Desktop Layout**: Preserved original table structure and functionality
- **Touch Optimization**: Larger touch targets and mobile-specific interactions
- **Implementation**: Conditional rendering using `useIsMobile()` hook

**📐 For complete navigation system details, see [Architecture Documentation](docs/architecture.md)**

### Dark Mode Implementation
- **Default Mode**: Dark mode is now the default user preference
- **Toggle Location**: Header (next to sync status) with dropdown options
- **Options**: Light, Dark, Auto (system preference)
- **System Integration**: Automatic detection and response to system preference changes
- **Theme Integration**: Seamless integration with existing HSL-based theme system
- **Accessibility**: WCAG AA compliant contrast ratios in all themes
- **Storage**: Persisted in localStorage as `darkModePreference`
- **Components**: All UI components adapt automatically to dark mode

**🎨 For complete theme system and dark mode implementation details, see [Architecture Documentation](docs/architecture.md)**

### Shared Usage Model
- **Access**: No authentication required - direct app access
- **Data Sharing**: Shared Supabase database for 2 users
- **Storage**: Persistent cloud storage with real-time synchronization
- **Environment**: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**🗄️ For database schema and shared usage implementation, see [Database Schema Documentation](docs/database-schema.md)**

### AI Features (OCR Only)
- **1 Google AI API Key**: Currently configured and operational  
- **Receipt OCR**: Automatic receipt data extraction from photos with rear camera default
- **Camera Interface**: Large embedded camera with smart defaults (rear camera for receipts) and toggle functionality
- **Multi-Key Rotation**: Ready for additional keys (GOOGLE_AI_API_KEY_1, _2, _3)
- **Smart Categorization**: ❌ **REMOVED** - Manual category selection only

**🤖 For AI integration details and cost optimization, see [AI Integration Documentation](docs/ai-integration.md)**

### Testing Infrastructure
- **Unit**: Jest + React Testing Library
- **E2E**: Puppeteer automation
- **Accessibility**: axe-core WCAG 2.1 AA compliance
- **Performance**: Lighthouse integration
- **UI Glitch**: 24 specialized tests for comprehensive validation

**🧪 For complete testing framework and commands, see [Testing Framework Documentation](docs/testing-framework.md)**

### Current Deployment
- **Live**: Vercel production deployment
- **Status**: ✅ All features operational
- **Performance**: 173kB main page, PWA enabled
- **Build**: ~14s with Next.js 15.3.3 + Turbopack
- **Dark Mode**: Enabled by default with full theme integration

**🚀 For deployment configuration and multi-platform setup, see [Deployment Documentation](docs/deployment.md)**

## Development Workflow

1. **Feature Development**: Create branch → Code → Test locally
2. **Testing**: Run `npm run test:all` for comprehensive validation
3. **TypeScript**: Always run `npm run typecheck` before commits - zero errors required
4. **Deployment**: Push branch → Create PR → Merge → Auto-deploy
5. **Monitoring**: Vercel analytics + real-time error tracking

### TypeScript Quality Assurance
- **Zero Tolerance**: All TypeScript errors must be resolved before merging
- **Comprehensive Coverage**: 85+ errors eliminated through systematic 4-phase approach
- **Type Safety**: Complete type annotations across components, hooks, and utilities
- **Validation**: Functional testing ensures no regressions during error resolution

**📚 For complete development timeline and phase details, see [Development History Documentation](docs/development-history.md)**

## GitHub Integration

Uses GitHub CLI (`gh`) for all operations:
- **Workflow**: `gh pr create` → `gh pr merge` → Auto-deploy
- **Branches**: main (production), feature branches for development

**🚀 For GitHub Actions and CI/CD setup, see [Deployment Documentation](docs/deployment.md)**

## For Comprehensive Understanding

This CLAUDE.md provides essential quick reference information. For thorough understanding of any system component, always refer to the detailed documentation files:

- **📐 [Architecture](docs/architecture.md)** - Complete system design, components, and navigation
- **🤖 [AI Integration](docs/ai-integration.md)** - AI features, multi-key rotation, and optimization  
- **🧪 [Testing Framework](docs/testing-framework.md)** - 24-test UI framework and comprehensive testing
- **🗄️ [Database Schema](docs/database-schema.md)** - Supabase integration, RLS policies, and security
- **📚 [Development History](docs/development-history.md)** - 6-phase timeline and commit analysis
- **🚀 [Deployment](docs/deployment.md)** - Multi-platform deployment and production setup
- **🔧 [Gemini CLI Integration](gemini-cli.md)** - Gemini AI usage patterns, API key rotation, and workflow integration

These documents contain the complete technical implementation details, troubleshooting guides, and comprehensive context needed for effective development and maintenance.

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.
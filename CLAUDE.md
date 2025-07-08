# CLAUDE.md

This file provides essential guidance to Claude Code (claude.ai/code) when working with this repository. For detailed documentation, refer to the linked files in the `docs/` directory.

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
- **Backend**: Supabase (auth + database), Firebase Genkit (AI)
- **Features**: Multi-user authentication, AI categorization, PWA support
- **Deployment**: Vercel (production), Docker, Firebase, Netlify

### Current Status
- ✅ **Production**: https://automationprojects-4df0h8yfc-faheems-projects-df0f8e74.vercel.app
- ✅ **Mobile Navigation**: Optimized with sidebar redundancy removed
- ✅ **Mobile Responsiveness**: Settings tables optimized for mobile viewport
- ✅ **Authentication**: Supabase Auth with RLS data isolation
- ✅ **AI Features**: Google AI with multi-key rotation system
- ✅ **Testing**: 24-test UI framework with comprehensive coverage

### Key Architecture
- **Navigation**: Desktop sidebar + Mobile bottom nav (768px breakpoint)
- **Authentication**: Supabase Auth with automatic user provisioning
- **Data Storage**: Supabase cloud with Row Level Security (RLS)
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
Complete development timeline across 6 phases, from Supabase setup to mobile navigation optimization.

**Key Sections:**
- 6 development phases with technical details
- Recent commit analysis and major milestones
- Mobile navigation crash resolution
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

### Authentication & Security
- **Supabase Auth**: Email/password with automatic token refresh
- **Data Isolation**: Row Level Security (RLS) policies on all tables
- **Multi-User**: Complete user-scoped data operations
- **Environment**: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**🗄️ For database schema and security implementation, see [Database Schema Documentation](docs/database-schema.md)**

### AI Features (Active)
- **1 Google AI API Key**: Currently configured and operational
- **Smart Categorization**: AI-powered expense category suggestions
- **Receipt OCR**: Automatic receipt data extraction
- **Multi-Key Rotation**: Ready for additional keys (GOOGLE_AI_API_KEY_1, _2, _3)

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
- **Performance**: 168kB main page, PWA enabled
- **Build**: ~14s with Next.js 15.3.3 + Turbopack

**🚀 For deployment configuration and multi-platform setup, see [Deployment Documentation](docs/deployment.md)**

## Development Workflow

1. **Feature Development**: Create branch → Code → Test locally
2. **Testing**: Run `npm run test:all` for comprehensive validation
3. **Deployment**: Push branch → Create PR → Merge → Auto-deploy
4. **Monitoring**: Vercel analytics + real-time error tracking

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

These documents contain the complete technical implementation details, troubleshooting guides, and comprehensive context needed for effective development and maintenance.

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.
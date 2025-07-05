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

## Architecture Overview

This is a Next.js 15 expense tracking application built with:
- **Frontend**: React 18, TypeScript, Tailwind CSS
- **UI Library**: Radix UI components with custom styling
- **Data Storage**: Hybrid localStorage + Supabase with user authentication
- **Authentication**: Supabase Auth with email/password and user management
- **AI Integration**: Firebase Genkit with Google AI
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
- `src/ai/genkit.ts` - Genkit configuration with Google AI
- `src/ai/dev.ts` - Development AI utilities
- `src/lib/ai-services.ts` - AI-powered expense categorization and receipt OCR services
- `src/hooks/use-expense-categorization.ts` - Hook for AI expense categorization
- `src/hooks/use-receipt-ocr.ts` - Hook for AI receipt processing

**Authentication Components**:
- `src/contexts/auth-context.tsx` - Authentication context with user session management
- `src/components/auth/auth-form.tsx` - Login/signup forms with validation
- `src/components/auth/user-menu.tsx` - User profile dropdown menu
- `src/components/auth/auth-page.tsx` - Authentication page wrapper
- `src/hooks/use-auth-data-service.ts` - Integration hook connecting auth with data service

### Component Architecture

**Layout**: 
- `AppLayout` - Main application shell with navigation
- Sidebar navigation with responsive design

**Dashboard Widgets**:
- `CategoryGaugesWidget` - Monthly spending progress
- `ProjectedSavingsWidget` - Financial projections
- Grid-based layout with drag-and-drop support

**Data Management**:
- Hybrid data storage: localStorage with Supabase cloud sync capability
- User-scoped data isolation with Row Level Security (RLS)
- Migration system for Supabase transition with user authentication
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

## Supabase Integration & Data Management

**Hybrid Data Storage Architecture**:
- Primary storage in localStorage for immediate development
- Supabase integration layer with graceful fallback handling
- Null-safety checks preventing crashes when Supabase is not configured
- Migration system for transitioning from localStorage to cloud storage

**Configuration Handling**:
- Environment variables: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Automatic detection of placeholder values vs real configuration
- Console warnings when running in localStorage-only mode
- Data service automatically switches primary source based on availability

**Recent Fixes Applied**:
- Fixed Supabase client initialization errors that prevented server startup
- Added null checks to all Supabase operations in data service layer
- Updated data migration functions to handle missing Supabase configuration
- Server now starts successfully regardless of Supabase configuration status

**Phase 4 Authentication Implementation (COMPLETED)**:
- Implemented complete Supabase authentication system with user management
- Added multi-user data isolation with Row Level Security (RLS) policies
- Updated all data models to include user_id relationships
- Enhanced data service layer with user-scoped operations
- Created authentication UI components and user session management
- Maintained backward compatibility with localStorage-only mode

## Development Notes

- TypeScript and ESLint errors are ignored during builds (configured in next.config.ts)
- PWA disabled in development mode
- Uses Turbopack for faster development builds
- Icons sourced from Lucide React with custom icon mapping system
- Theme system uses CSS custom properties for dynamic theming
- AI services require Google AI API key configured in environment variables

## Authentication & Security

**Authentication System**:
- Supabase Auth with email/password authentication
- User session management with automatic token refresh
- Graceful fallback to localStorage mode when Supabase is not configured
- Authentication UI components with form validation and error handling

**Data Security**:
- Row Level Security (RLS) policies ensuring users only access their own data
- User-scoped data operations in all CRUD functions
- Secure data isolation with foreign key constraints to auth.users
- Environment variable validation with placeholder detection

**Multi-User Architecture**:
- All data models include optional user_id fields for backward compatibility
- Data service layer automatically scopes operations to authenticated user
- localStorage keys scoped per user (e.g., 'expenses_user123')
- Default data creation for new users (categories, accounts, themes)

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

## Database Schema

The application uses a user-aware database schema with Row Level Security:

### Core Tables (schema.sql)
- **accounts** - Financial accounts with user_id foreign key and RLS policies
- **categories** - Expense categories with user_id foreign key and RLS policies
- **themes** - Custom themes with user_id foreign key and RLS policies
- **expenses** - Transaction records with user_id foreign key and RLS policies
- **widget_configs** - Dashboard widgets with user_id foreign key and RLS policies

### Security Features
- **Row Level Security (RLS)** enabled on all tables
- **Foreign key constraints** to auth.users with CASCADE delete
- **Unique constraints** scoped per user (e.g., category names unique per user)
- **Default data creation** via trigger function for new users
- **Automatic user cleanup** when users are deleted

### Authentication Integration
- **Supabase Auth** manages the auth.users table
- **User registration trigger** automatically creates default data
- **Session-based queries** automatically filter by authenticated user
- **Graceful fallback** to localStorage when authentication is disabled

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.
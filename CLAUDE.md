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
- **Data Storage**: Local storage with Supabase migration capability
- **AI Integration**: Firebase Genkit with Google AI
- **PWA Support**: Service worker for offline functionality

### Key Structure

**Core Data Models** (src/lib/types.ts):
- `Expense` - Transaction records with category, account, and amount
- `Category` - Expense categorization with icons and thresholds
- `Account` - Financial accounts with ownership tracking
- `Theme` - Custom theming system with HSL colors

**Main Pages**:
- `/` - Home page with expense management and monthly reports
- `/dashboard` - Customizable widget dashboard
- `/data` - Data import/export functionality
- `/settings` - Account and category management
- `/themes` - Theme customization

**Context & State**:
- `SettingsContext` - Global settings for categories, accounts, and themes
- `useLocalStorage` - Custom hook for persistent state management
- Data migration system for Supabase integration

**AI Components**:
- `src/ai/genkit.ts` - Genkit configuration with Google AI
- `src/ai/dev.ts` - Development AI utilities
- `src/lib/ai-services.ts` - AI-powered expense categorization and receipt OCR services
- `src/hooks/use-expense-categorization.ts` - Hook for AI expense categorization
- `src/hooks/use-receipt-ocr.ts` - Hook for AI receipt processing

### Component Architecture

**Layout**: 
- `AppLayout` - Main application shell with navigation
- Sidebar navigation with responsive design

**Dashboard Widgets**:
- `CategoryGaugesWidget` - Monthly spending progress
- `ProjectedSavingsWidget` - Financial projections
- Grid-based layout with drag-and-drop support

**Data Management**:
- Local storage as primary data store
- Migration system for Supabase transition
- Real-time filtering and sorting

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

## Development Notes

- TypeScript and ESLint errors are ignored during builds (configured in next.config.ts)
- PWA disabled in development mode
- Uses Turbopack for faster development builds
- Icons sourced from Lucide React with custom icon mapping system
- Theme system uses CSS custom properties for dynamic theming
- AI services require Google AI API key configured in environment variables

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

### Verified Working Access (Latest Test)
- **Server Status**: ✅ Running on port 3000
- **WSL IP Access**: ✅ `http://172.20.72.33:3000` (tested)
- **Local Access**: ✅ `http://localhost:3000` (WSL internal)
- **External Binding**: ✅ Server bound to `0.0.0.0:3000`

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

# Using Gemini CLI for Large Codebase Analysis

When analyzing large codebases or multiple files that might exceed context limits, use the Gemini CLI with its massive
context window. Use `gemini -p` to leverage Google Gemini's large context capacity.

## File and Directory Inclusion Syntax

Use the `@` syntax to include files and directories in your Gemini prompts. The paths should be relative to WHERE you run the
  gemini command:

### Examples:

**Single file analysis:**
gemini -p "@src/main.py Explain this file's purpose and structure"

Multiple files:
gemini -p "@package.json @src/index.js Analyze the dependencies used in the code"

Entire directory:
gemini -p "@src/ Summarize the architecture of this codebase"

Multiple directories:
gemini -p "@src/ @tests/ Analyze test coverage for the source code"

Current directory and subdirectories:
gemini -p "@./ Give me an overview of this entire project"

# Or use --all_files flag:
gemini --all_files -p "Analyze the project structure and dependencies"

Implementation Verification Examples

Check if a feature is implemented:
gemini -p "@src/ @lib/ Has dark mode been implemented in this codebase? Show me the relevant files and functions"

Verify authentication implementation:
gemini -p "@src/ @middleware/ Is JWT authentication implemented? List all auth-related endpoints and middleware"

Check for specific patterns:
gemini -p "@src/ Are there any React hooks that handle WebSocket connections? List them with file paths"

Verify error handling:
gemini -p "@src/ @api/ Is proper error handling implemented for all API endpoints? Show examples of try-catch blocks"

Check for rate limiting:
gemini -p "@backend/ @middleware/ Is rate limiting implemented for the API? Show the implementation details"

Verify caching strategy:
gemini -p "@src/ @lib/ @services/ Is Redis caching implemented? List all cache-related functions and their usage"

Check for specific security measures:
gemini -p "@src/ @api/ Are SQL injection protections implemented? Show how user inputs are sanitized"

Verify test coverage for features:
gemini -p "@src/payment/ @tests/ Is the payment processing module fully tested? List all test cases"

When to Use Gemini CLI

Use gemini -p when:
- Analyzing entire codebases or large directories
- Comparing multiple large files
- Need to understand project-wide patterns or architecture
- Current context window is insufficient for the task
- Working with files totaling more than 100KB
- Verifying if specific features, patterns, or security measures are implemented
- Checking for the presence of certain coding patterns across the entire codebase

Important Notes

- Paths in @ syntax are relative to your current working directory when invoking gemini
- The CLI will include file contents directly in the context
- No need for --yolo flag for read-only analysis
- Gemini's context window can handle entire codebases that would overflow Claude's context
- When checking implementations, be specific about what you're looking for to get accurate results

# MCP Tool Capabilities

This project is enhanced with Model Context Protocol (MCP) tools that provide extended capabilities. Here's a comprehensive overview of available tools and their use cases:

## AI Integration Tools

### Gemini CLI Integration
- **ask-gemini**: Execute Gemini AI analysis with massive context windows
- **sandbox-test**: Safely test code in isolated environments
- **Ping/Help**: Test connectivity and get command documentation

**Usage Examples:**
```bash
# Analyze large codebases beyond Claude's context limits
gemini -p "@src/ @lib/ Analyze this entire codebase architecture"

# Safe code testing in sandbox
gemini -s -p "Test this Python script and explain potential issues"
```

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

**Gemini CLI**: 
- Large codebase analysis (>100KB)
- Architecture reviews
- Cross-file pattern analysis
- When Claude's context is insufficient

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
// 4. Test with Gemini CLI
// 5. Deploy with Desktop Commander

// Research latest React patterns
const trends = await tavily_search("React 2024 performance patterns")

// Get official docs
const docs = await get_library_docs("/reactjs/react.dev", "performance")

// Implement with animated components
import { BlurFade } from '@/components/ui/blur-fade'

// Test implementation
gemini -s -p "@src/components/ Test these new React patterns"
```

## Configuration and Setup

Most MCP tools work out of the box, but some require configuration:

1. **API Keys**: Set up Google AI API key for Gemini integration
2. **Permissions**: Desktop Commander uses security allowlists
3. **Limits**: Configure file size and operation limits
4. **Telemetry**: Enable/disable usage tracking

Check individual tool documentation for specific setup requirements.
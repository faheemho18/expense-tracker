# Architecture Documentation

## System Overview

This is a Next.js 15 expense tracking application built with:
- **Frontend**: React 18, TypeScript, Tailwind CSS
- **UI Library**: Radix UI components with custom styling
- **Data Storage**: Supabase cloud storage with user authentication and multi-user isolation
- **Authentication**: Supabase Auth with email/password and user management
- **Real-time Sync**: Cross-device synchronization with offline support
- **AI Integration**: Firebase Genkit with Google AI
- **Deployment**: Multi-platform support (Vercel, Docker, Firebase, Netlify)
- **PWA Support**: Service worker for offline functionality

## Core Data Models

**Located in src/lib/types.ts:**
- `Expense` - Transaction records with category, account, and amount (user-scoped)
- `Category` - Expense categorization with icons and thresholds (user-scoped)
- `Account` - Financial accounts with ownership tracking (user-scoped)
- `Theme` - Custom theming system with HSL colors (user-scoped)
- `User` - Authentication user profile with email and metadata
- `AuthContextType` - Authentication context interface for session management

## Application Structure

### Main Pages
- `/` - Home page with expense management and monthly reports
- `/dashboard` - Customizable widget dashboard
- `/data` - Data import/export functionality
- `/settings` - Account and category management
- `/themes` - Theme customization

### Context & State Management
- `AuthContext` - User authentication and session management
- `SettingsContext` - Global settings for categories, accounts, and themes (user-scoped)
- `useLocalStorage` - Custom hook for persistent state management (user-scoped)
- `useAuthDataService` - Integration hook connecting authentication with data service
- Data migration system for Supabase integration with user authentication

## Component Architecture

### Navigation System

**Mobile Navigation (< 768px)**:
- Header: Logo + MiniSyncStatus + UserMenu
- Bottom Navigation: 5 primary routes (Expenses, Dashboard, Data, Themes, Settings)
- Touch-optimized with 44px minimum target sizes
- No sidebar elements for cleaner mobile UX

**Desktop Navigation (≥ 768px)**:
- Collapsible sidebar with icon/expanded states
- SidebarTrigger for manual collapse/expand
- UserMenu in both sidebar footer and header
- All 5 navigation routes accessible via sidebar

**UserMenu Placement**:
- Mobile: Header only (accessible via top-right)
- Desktop: Dual placement (sidebar footer + header)
- Consistent functionality across all placements

### Layout Components
- `AppLayout` - Main application shell with adaptive navigation
- **Desktop**: Sidebar navigation with collapsible icon behavior
- **Mobile**: Header + bottom navigation (sidebar removed for cleaner UX)
- Responsive design with 768px breakpoint for navigation transition

### Dashboard Widgets
- `CategoryGaugesWidget` - Monthly spending progress
- `ProjectedSavingsWidget` - Financial projections
- Grid-based layout with drag-and-drop support

## Data Management Architecture

### Supabase Integration
- Supabase cloud storage as primary data layer with complete user isolation
- User-scoped data isolation with Row Level Security (RLS) policies
- Multi-user authentication system with automatic user provisioning
- Cross-device synchronization with offline support (Realtime pending)
- Automatic conflict resolution and data consistency
- Real-time filtering and sorting with multi-user support

### Provider Hierarchy
```
RootLayout → ClientLayout → AuthProvider → SettingsProvider → AppLayout
```

## Security Architecture

### Authentication System
- ✅ Supabase Auth with email/password authentication
- ✅ User session management with automatic token refresh
- ✅ Production-ready login/signup UI with form validation
- ✅ Secure user profile management and session handling

### Data Security
- ✅ Row Level Security (RLS) policies ensuring users only access their own data
- ✅ User-scoped data operations in all CRUD functions
- ✅ Complete data isolation with foreign key constraints to auth.users
- ✅ Production environment variables configured and validated

### Multi-User Architecture
- ✅ All data models include user_id fields with NOT NULL constraints
- ✅ Data service layer automatically scopes operations to authenticated user
- ✅ Cloud-based user data storage with cross-device access
- ✅ Automatic default data creation for new users (categories, accounts, themes)
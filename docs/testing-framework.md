# Testing Framework Documentation

## Overview

Comprehensive testing infrastructure covering unit tests, integration tests, E2E tests, accessibility compliance, performance monitoring, and specialized UI glitch detection.

## Test Categories

### 1. Unit Tests
**Location**: `src/components/__tests__/`, `tests/unit/`
**Framework**: Jest + React Testing Library
**Coverage**:
- Authentication system components
- Real-time sync functionality
- AI integration hooks
- UI components and interactions
- Data service operations

### 2. Integration Tests
**Location**: `tests/integration/`
**Framework**: Jest + Puppeteer
**Coverage**:
- Multi-user workflow testing
- RLS policy verification
- Cross-component data flow
- Authentication + data service integration

### 3. End-to-End Tests
**Location**: `tests/e2e/`
**Framework**: Puppeteer
**Coverage**:
- Full user journeys (auth, expense management, AI features)
- Navigation behavior validation
- Cross-platform compatibility testing
- Production environment validation

### 4. Accessibility Tests
**Location**: `tests/accessibility/`
**Framework**: axe-core + Puppeteer
**Coverage**:
- WCAG 2.1 Level AA compliance
- Navigation accessibility validation
- Touch target size verification
- Screen reader compatibility
- Keyboard navigation testing

### 5. Performance Tests
**Location**: `tests/performance/`
**Framework**: Lighthouse + Puppeteer
**Coverage**:
- Core Web Vitals monitoring
- Animation performance (60fps validation)
- Bundle size analysis
- Load time optimization
- Navigation performance

## UI Glitch Detection Framework

### Comprehensive Test Suite (24 Tests)

**Dashboard Overflow Tests (4 tests)**:
- Widget content overflow detection
- Responsive grid layout validation
- Mobile chart display verification
- Text truncation behavior

**Dropdown Visibility Tests (4 tests)**:
- Theme compatibility across all themes
- Z-index layer conflicts
- Mobile dropdown positioning
- Accessibility compliance

**Touch Interaction Tests (8 tests)**:
- 44px minimum target size validation
- Touch gesture responsiveness
- Mobile navigation behavior
- Haptic feedback integration

**Animation Performance Tests (8 tests)**:
- 60fps animation validation
- Layout shift detection
- Transition smoothness
- Performance impact analysis

### Navigation Testing Framework

**Mobile Sidebar Redundancy Validation**:
- Conditional rendering verification
- Mobile vs desktop navigation testing
- UserMenu placement validation
- Responsive breakpoint testing

**Cross-Platform Navigation Testing**:
- Touch target accessibility
- Keyboard navigation support
- Screen reader compatibility
- Multi-device synchronization

### Testing Tools & Infrastructure

**Interactive Browser Interface**:
- Real-time UI validation
- Manual testing controls
- Visual diff comparison
- Performance monitoring

**Console Analysis Script**:
- Automated UI analysis
- Error detection and reporting
- Performance metrics collection
- Accessibility audit automation

**50-Point Manual Checklist**:
- Systematic UI verification
- Cross-browser compatibility
- Mobile responsiveness validation
- User experience assessment

**Dependencies**:
- Playwright (v1.53.2) - Modern browser automation
- Puppeteer (v24.11.2) - Headless Chrome testing
- Jest integration - Unit and integration testing
- axe-core - Accessibility testing

## Test Commands

### Essential Testing Commands
```bash
# Unit tests with Jest and React Testing Library
npm run test:unit

# End-to-end tests with Puppeteer
npm run test:e2e

# WCAG compliance testing
npm run test:accessibility

# Performance benchmarks with Lighthouse
npm run test:performance

# Visual regression testing
npm run test:visual

# Complete test suite including UI glitch detection
npm run test:all

# Coverage reporting
npm run test:coverage
```

### Specialized UI Testing Commands
```bash
# Complete UI glitch detection test suite (24 tests)
npm run test:ui-glitch

# Dashboard widget overflow and responsiveness tests
npm run test:dashboard

# Dropdown visibility testing across all themes
npm run test:dropdown

# Touch interaction responsiveness and mobile testing
npm run test:touch

# Animation performance and layout shift detection
npm run test:animations

# Mobile-specific UI and gesture testing
npm run test:mobile

# Text overflow detection across viewports
npm run test:overflow

# Responsive design validation
npm run test:responsive
```

## Test Configuration

### Jest Configuration
- TypeScript support enabled
- React Testing Library integration
- Comprehensive mocking for Supabase/AI services
- Coverage reporting with threshold enforcement

### Puppeteer E2E Configuration
- Headless Chrome automation
- Mobile device emulation
- Network throttling simulation
- Screenshot comparison testing

### Accessibility Testing Setup
- WCAG 2.1 Level AA compliance
- Automated accessibility audits
- Screen reader simulation
- Keyboard navigation validation

## Coverage Areas

### Functional Coverage
- Authentication system
- Real-time sync
- AI integration
- Dashboard widgets
- Expense management
- Theming system
- Multi-user isolation
- PWA functionality

### UI/UX Coverage
- Text overflow detection
- Responsive design validation
- Theme compatibility
- Animation performance (60fps)
- Cross-browser testing
- Accessibility integration
- Navigation behavior validation
- Touch interaction responsiveness

### Performance Coverage
- Bundle size optimization
- Load time analysis
- Animation performance
- Memory usage monitoring
- Network request efficiency
- Core Web Vitals tracking

## CI/CD Integration

### GitHub Actions Support
- Automated test execution on PR creation
- Performance regression detection
- Accessibility compliance validation
- Cross-browser compatibility testing

### Docker Integration
- Containerized test environments
- Consistent testing across platforms
- Isolated test execution
- Parallel test runner support

## Testing Accessibility

### Production Environment Testing
- All manual testing tools immediately accessible in deployed environment
- Browser console integration with `ui-analysis.js`
- Interactive testing interface available via deployed URLs
- Systematic validation with 50-point checklist

### Development Environment Testing
- Local test runner with hot reload
- Real-time UI validation during development
- Automated test execution on file changes
- Performance monitoring integration

The testing framework provides comprehensive coverage ensuring production-ready quality across all application features and user interactions.
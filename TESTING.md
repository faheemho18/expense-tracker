# Testing Guide

This project includes a comprehensive testing suite covering unit tests, integration tests, visual regression tests, accessibility tests, and performance tests.

## NumberTicker Implementation

✅ **Completed**: NumberTicker has been successfully implemented for expense amounts throughout the application:

- **ExpensesTable**: Animated currency amounts with staggered delays
- **StatsWidget**: Animated totals for expenses, refunds, net total, and transaction count
- **ProjectedSavingsWidget**: Animated savings display with compact notation
- **CurrencyTicker**: Custom component for currency-formatted animated numbers

### Features:
- Smooth spring animations using Framer Motion
- PHP currency formatting with Intl.NumberFormat
- Support for compact notation (K, M abbreviations)
- Viewport-based animation triggering
- Staggered animations for multiple elements
- Customizable delays and styling

## Test Suites

### 1. Unit Tests (`npm run test:unit`)

**Location**: `src/**/*.test.{ts,tsx}`

Tests individual components and utilities:
- ✅ CurrencyTicker component
- ✅ NumberTicker component  
- ✅ ExpensesTable component
- ✅ StatsWidget component
- ✅ ProjectedSavingsWidget component
- ✅ Utility functions (formatCurrency, exportToCsv, parseCsv, etc.)
- ✅ Custom hooks (useLocalStorage)

**Features**:
- Jest with React Testing Library
- Mock implementations for Framer Motion
- Component rendering and interaction tests
- Utility function validation
- Hook behavior testing

### 2. End-to-End Tests (`npm run test:e2e`)

**Location**: `tests/e2e/**/*.test.ts`

Tests complete user workflows:
- ✅ Application loading and navigation
- ✅ Expense management (add, edit, delete)
- ✅ Filtering and sorting
- ✅ Responsive design
- ✅ NumberTicker animations
- ✅ Error handling

### 3. Visual Regression Tests (`npm run test:visual`)

**Location**: `tests/visual/**/*.test.ts`

Automated screenshot comparison testing:
- ✅ Homepage layouts (desktop and mobile)
- ✅ Dashboard widgets
- ✅ Expense table rendering
- ✅ Modal and sheet components
- ✅ NumberTicker animations
- ✅ Theme consistency

**Commands**:
```bash
npm run test:visual:baseline  # Generate baseline images
npm run test:visual:compare   # Compare against baselines
npm run test:visual          # Full visual test suite
```

**Screenshot Storage**:
- `tests/visual/screenshots/expected/` - Baseline images
- `tests/visual/screenshots/actual/` - Current screenshots
- `tests/visual/screenshots/diff/` - Difference highlights

### 4. Accessibility Tests (`npm run test:accessibility`)

**Location**: `tests/accessibility/**/*.test.ts`

WCAG compliance and accessibility validation:
- ✅ Automated accessibility scanning with axe-core
- ✅ Keyboard navigation testing
- ✅ Focus management validation
- ✅ ARIA label verification
- ✅ Heading hierarchy checks
- ✅ NumberTicker accessibility considerations

**Standards Tested**:
- WCAG 2.1 Level AA compliance
- Keyboard accessibility
- Screen reader compatibility
- Color contrast (configurable)
- Semantic HTML structure

### 5. Performance Tests (`npm run test:performance`)

**Location**: `tests/performance/**/*.test.ts`

Performance metrics and optimization validation:
- ✅ Core Web Vitals measurement
- ✅ NumberTicker animation performance
- ✅ Memory leak detection
- ✅ Rendering efficiency
- ✅ Bundle size analysis
- ✅ Large dataset handling

**Metrics Tracked**:
- First Contentful Paint (FCP)
- DOM Content Loaded
- Animation duration
- Memory usage
- Bundle sizes
- Interaction response times

## Configuration Files

### Jest Configuration
- `jest.config.ts` - Unit test configuration
- `jest-e2e.config.ts` - E2E test configuration
- `jest.setup.js` - Test environment setup
- `jest-puppeteer.config.js` - Puppeteer configuration

### Visual Testing
- `tests/visual/config/visual-config.ts` - Test scenarios and settings
- `tests/visual/visual-helper.ts` - Screenshot utilities

## Running Tests

### Individual Test Suites
```bash
npm run test:unit           # Unit tests only
npm run test:e2e           # E2E tests only
npm run test:visual        # Visual regression tests
npm run test:accessibility # Accessibility tests
npm run test:performance   # Performance tests
```

### Combined Testing
```bash
npm run test:all           # Unit + Accessibility + Performance
npm run test               # All tests (default Jest)
npm run test:coverage      # Unit tests with coverage report
npm run test:watch         # Unit tests in watch mode
```

## Test Environment Setup

### Prerequisites
1. **Node.js 18+** - Required for all testing
2. **Development Server** - Must be running on `http://localhost:3000`
3. **Chrome/Chromium** - For Puppeteer-based tests

### Installation
```bash
npm install  # Installs all testing dependencies
```

### Environment Variables
```bash
CI=true                    # Enables headless mode for CI/CD
NODE_ENV=test             # Test environment configuration
```

## Continuous Integration

### GitHub Actions Example
```yaml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm run dev &
      - run: sleep 10  # Wait for server
      - run: npm run test:all
```

### Docker Testing
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
RUN npm run test:all
```

## Debugging Tests

### Visual Test Debugging
1. Check `tests/visual/screenshots/diff/` for visual differences
2. Compare expected vs actual images
3. Adjust threshold values in `visual-config.ts` if needed

### E2E Test Debugging
1. Set `headless: false` in Puppeteer config
2. Add `await page.waitForTimeout(5000)` for manual inspection
3. Use `page.screenshot()` for debugging

### Performance Test Debugging
1. Check browser DevTools Performance tab
2. Monitor memory usage in test output
3. Analyze bundle sizes in Network tab

## Best Practices

### Writing Tests
1. **Descriptive Names** - Clear test descriptions
2. **Isolation** - Each test should be independent
3. **Realistic Data** - Use representative test data
4. **Async/Await** - Proper handling of asynchronous operations
5. **Cleanup** - Reset state between tests

### NumberTicker Testing
1. **Animation Timing** - Allow sufficient time for animations
2. **Viewport Testing** - Test on different screen sizes
3. **Data Variation** - Test with various number formats
4. **Performance** - Monitor animation performance impact

### Maintenance
1. **Update Baselines** - When UI changes are intentional
2. **Review Failures** - Investigate all test failures
3. **Performance Budgets** - Set and maintain performance thresholds
4. **Accessibility** - Regular accessibility audits

## Troubleshooting

### Common Issues

**Puppeteer Launch Failures**:
```bash
# Install Chrome dependencies (Ubuntu/Debian)
sudo apt-get install -y chromium-browser

# Set executable path
export PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

**Visual Test Inconsistencies**:
- Font rendering differences across systems
- Animation timing variations
- Screen resolution differences

**Memory Issues**:
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
```

**CI/CD Failures**:
- Ensure server is running before tests
- Use headless mode in CI environments
- Set appropriate timeouts for slower CI systems

## Test Coverage

The test suite aims for comprehensive coverage:
- ✅ **Unit Tests**: 80%+ code coverage
- ✅ **Integration**: All major user workflows
- ✅ **Visual**: Key UI components and states
- ✅ **Accessibility**: WCAG 2.1 compliance
- ✅ **Performance**: Core Web Vitals benchmarks

## NumberTicker Implementation Summary

The NumberTicker implementation has been successfully integrated throughout the expense tracking application:

### Components Enhanced:
1. **ExpensesTable** - Animated expense amounts in table rows
2. **StatsWidget** - Animated statistics dashboard
3. **ProjectedSavingsWidget** - Animated savings calculations

### Technical Implementation:
- Custom `CurrencyTicker` component for currency formatting
- Integration with existing Magic UI `NumberTicker` component
- Framer Motion for smooth spring animations
- Viewport-based animation triggering
- Staggered animation delays for visual appeal

### Testing Coverage:
- Unit tests for all NumberTicker components
- Visual regression tests for animation consistency
- Performance tests for animation efficiency
- Accessibility tests for inclusive user experience

The implementation provides a smooth, professional user experience with animated financial data that enhances the application's visual appeal while maintaining excellent performance and accessibility standards.
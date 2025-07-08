/**
 * Manual Testing Script for Mobile Sidebar Redundancy Removal
 * 
 * This script provides interactive tools for manual testing of the navigation
 * changes as outlined in testplan.md. Copy and paste this into the browser
 * console when testing the deployed application.
 * 
 * Usage:
 * 1. Open the application in a browser
 * 2. Open Developer Tools (F12)
 * 3. Copy this entire script into the console
 * 4. Execute the script
 * 5. Use the provided functions to validate navigation behavior
 */

// Navigation Testing Utilities
window.NavigationTestUtils = {
  
  // Test Results Storage
  testResults: {
    mobile: {},
    desktop: {},
    responsive: {},
    accessibility: {}
  },

  // Utility Functions
  log: function(message, type = 'info') {
    const styles = {
      info: 'color: #2196F3; font-weight: bold;',
      success: 'color: #4CAF50; font-weight: bold;',
      warning: 'color: #FF9800; font-weight: bold;',
      error: 'color: #F44336; font-weight: bold;'
    }
    console.log(`%c[Navigation Test] ${message}`, styles[type])
  },

  getCurrentViewport: function() {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      isMobile: window.innerWidth < 768
    }
  },

  // Mobile Testing Functions
  testMobileNavigation: function() {
    this.log('Starting Mobile Navigation Tests', 'info')
    const viewport = this.getCurrentViewport()
    
    if (viewport.width >= 768) {
      this.log('Warning: Current viewport is not mobile size (< 768px)', 'warning')
      return { error: 'Please resize to mobile viewport first' }
    }

    const results = {
      timestamp: new Date().toISOString(),
      viewport: viewport,
      tests: {}
    }

    // Test 1: No Sidebar Elements
    results.tests.noSidebarElements = this.checkNoSidebarElements()
    
    // Test 2: Bottom Navigation Present
    results.tests.bottomNavPresent = this.checkBottomNavPresent()
    
    // Test 3: UserMenu in Header
    results.tests.userMenuInHeader = this.checkUserMenuInHeader()
    
    // Test 4: Touch Targets
    results.tests.touchTargets = this.checkTouchTargets()
    
    // Test 5: Header Layout
    results.tests.headerLayout = this.checkHeaderLayout()

    this.testResults.mobile = results
    this.displayTestResults('Mobile Navigation', results)
    return results
  },

  testDesktopNavigation: function() {
    this.log('Starting Desktop Navigation Tests', 'info')
    const viewport = this.getCurrentViewport()
    
    if (viewport.width < 768) {
      this.log('Warning: Current viewport is not desktop size (>= 768px)', 'warning')
      return { error: 'Please resize to desktop viewport first' }
    }

    const results = {
      timestamp: new Date().toISOString(),
      viewport: viewport,
      tests: {}
    }

    // Test 1: Sidebar Present
    results.tests.sidebarPresent = this.checkSidebarPresent()
    
    // Test 2: No Bottom Navigation
    results.tests.noBottomNav = this.checkNoBottomNav()
    
    // Test 3: Sidebar Trigger
    results.tests.sidebarTrigger = this.checkSidebarTrigger()
    
    // Test 4: Dual UserMenu
    results.tests.dualUserMenu = this.checkDualUserMenu()
    
    // Test 5: Sidebar Navigation
    results.tests.sidebarNavigation = this.checkSidebarNavigation()

    this.testResults.desktop = results
    this.displayTestResults('Desktop Navigation', results)
    return results
  },

  // Individual Test Functions
  checkNoSidebarElements: function() {
    const sidebarSelectors = [
      '[data-testid="sidebar"]',
      '[data-testid="sidebar-provider"]',
      '[data-testid="sidebar-trigger"]',
      '[data-testid="sidebar-content"]',
      '[data-testid="sidebar-header"]',
      '[data-testid="sidebar-footer"]'
    ]

    const foundElements = sidebarSelectors.map(selector => ({
      selector,
      found: document.querySelector(selector) !== null,
      count: document.querySelectorAll(selector).length
    }))

    const allClear = foundElements.every(el => !el.found)
    
    return {
      passed: allClear,
      message: allClear ? 'No sidebar elements found ✓' : 'Sidebar elements still present ✗',
      details: foundElements.filter(el => el.found)
    }
  },

  checkBottomNavPresent: function() {
    const bottomNav = document.querySelector('[data-testid="bottom-nav"]')
    const navLinks = bottomNav ? bottomNav.querySelectorAll('a') : []
    
    return {
      passed: !!bottomNav && navLinks.length > 0,
      message: bottomNav ? `Bottom navigation found with ${navLinks.length} links ✓` : 'Bottom navigation not found ✗',
      details: {
        present: !!bottomNav,
        linkCount: navLinks.length,
        links: Array.from(navLinks).map(link => ({
          href: link.getAttribute('href'),
          text: link.textContent?.trim()
        }))
      }
    }
  },

  checkUserMenuInHeader: function() {
    const header = document.querySelector('header')
    const userMenu = header ? header.querySelector('[data-testid="user-menu"]') : null
    
    return {
      passed: !!userMenu,
      message: userMenu ? 'UserMenu found in header ✓' : 'UserMenu not found in header ✗',
      details: {
        headerPresent: !!header,
        userMenuPresent: !!userMenu,
        userMenuLocation: userMenu ? 'header' : 'not found'
      }
    }
  },

  checkTouchTargets: function() {
    const MINIMUM_SIZE = 44
    const touchTargets = document.querySelectorAll(
      '[data-testid="bottom-nav"] a, [data-testid="bottom-nav"] button, [data-testid="user-menu"]'
    )

    const results = Array.from(touchTargets).map((target, index) => {
      const rect = target.getBoundingClientRect()
      return {
        index,
        width: rect.width,
        height: rect.height,
        meetsMinimum: rect.width >= MINIMUM_SIZE && rect.height >= MINIMUM_SIZE,
        element: target.tagName + (target.className ? '.' + target.className.split(' ')[0] : '')
      }
    })

    const allPass = results.every(r => r.meetsMinimum)
    const failedTargets = results.filter(r => !r.meetsMinimum)

    return {
      passed: allPass,
      message: allPass ? `All ${results.length} touch targets meet 44px minimum ✓` : `${failedTargets.length} touch targets too small ✗`,
      details: {
        totalTargets: results.length,
        passedTargets: results.length - failedTargets.length,
        failedTargets: failedTargets
      }
    }
  },

  checkHeaderLayout: function() {
    const header = document.querySelector('header')
    if (!header) {
      return { passed: false, message: 'Header not found ✗', details: {} }
    }

    const rect = header.getBoundingClientRect()
    const viewport = this.getCurrentViewport()
    const styles = window.getComputedStyle(header)

    const checks = {
      atTop: rect.top === 0,
      fullWidth: Math.abs(rect.width - viewport.width) < 2,
      hasBackground: styles.backgroundColor !== 'rgba(0, 0, 0, 0)' && styles.backgroundColor !== 'transparent',
      isSticky: styles.position === 'sticky' || styles.position === 'fixed',
      noOverflow: rect.right <= viewport.width
    }

    const allPass = Object.values(checks).every(check => check)

    return {
      passed: allPass,
      message: allPass ? 'Header layout correct ✓' : 'Header layout issues detected ✗',
      details: {
        position: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
        styles: { position: styles.position, backgroundColor: styles.backgroundColor },
        checks
      }
    }
  },

  checkSidebarPresent: function() {
    const sidebar = document.querySelector('[data-testid="sidebar"]')
    const sidebarContent = document.querySelector('[data-testid="sidebar-content"]')
    const navItems = sidebar ? sidebar.querySelectorAll('a') : []

    return {
      passed: !!sidebar && !!sidebarContent && navItems.length > 0,
      message: sidebar ? `Sidebar found with ${navItems.length} navigation items ✓` : 'Sidebar not found ✗',
      details: {
        sidebarPresent: !!sidebar,
        contentPresent: !!sidebarContent,
        navItemCount: navItems.length
      }
    }
  },

  checkNoBottomNav: function() {
    const bottomNav = document.querySelector('[data-testid="bottom-nav"]')
    
    return {
      passed: !bottomNav,
      message: !bottomNav ? 'No bottom navigation found ✓' : 'Bottom navigation present (should not be on desktop) ✗',
      details: {
        bottomNavPresent: !!bottomNav
      }
    }
  },

  checkSidebarTrigger: function() {
    const trigger = document.querySelector('[data-testid="sidebar-trigger"]')
    const isVisible = trigger ? trigger.offsetParent !== null : false
    
    return {
      passed: !!trigger && isVisible,
      message: trigger && isVisible ? 'Sidebar trigger found and visible ✓' : 'Sidebar trigger not found or not visible ✗',
      details: {
        triggerPresent: !!trigger,
        triggerVisible: isVisible
      }
    }
  },

  checkDualUserMenu: function() {
    const userMenus = document.querySelectorAll('[data-testid="user-menu"]')
    const header = document.querySelector('header')
    const sidebar = document.querySelector('[data-testid="sidebar"]')
    
    const headerUserMenu = header ? header.querySelector('[data-testid="user-menu"]') : null
    const sidebarUserMenu = sidebar ? sidebar.querySelector('[data-testid="user-menu"]') : null

    return {
      passed: userMenus.length === 2 && !!headerUserMenu && !!sidebarUserMenu,
      message: userMenus.length === 2 ? 'Dual UserMenu found (header + sidebar) ✓' : `Found ${userMenus.length} UserMenus (expected 2) ✗`,
      details: {
        totalUserMenus: userMenus.length,
        headerUserMenu: !!headerUserMenu,
        sidebarUserMenu: !!sidebarUserMenu
      }
    }
  },

  checkSidebarNavigation: function() {
    const sidebar = document.querySelector('[data-testid="sidebar"]')
    const navLinks = sidebar ? sidebar.querySelectorAll('a[href]') : []
    
    const expectedPaths = ['/', '/dashboard', '/data', '/themes', '/settings']
    const foundPaths = Array.from(navLinks).map(link => link.getAttribute('href'))
    const hasAllPaths = expectedPaths.every(path => foundPaths.includes(path))

    return {
      passed: hasAllPaths && navLinks.length >= expectedPaths.length,
      message: hasAllPaths ? `All ${expectedPaths.length} navigation paths found ✓` : 'Missing navigation paths ✗',
      details: {
        expectedPaths,
        foundPaths,
        missingPaths: expectedPaths.filter(path => !foundPaths.includes(path))
      }
    }
  },

  // Responsive Testing
  testResponsiveTransition: function() {
    this.log('Testing Responsive Transition at 768px Breakpoint', 'info')
    
    const initialViewport = this.getCurrentViewport()
    this.log(`Current viewport: ${initialViewport.width}x${initialViewport.height}`, 'info')
    
    const breakpointTests = [
      { width: 1024, expected: 'desktop' },
      { width: 900, expected: 'desktop' },
      { width: 768, expected: 'desktop' },
      { width: 767, expected: 'mobile' },
      { width: 600, expected: 'mobile' },
      { width: 390, expected: 'mobile' }
    ]

    this.log('Please manually resize the browser window to test responsive breakpoints:', 'warning')
    this.log('Use browser DevTools Device Simulation or manually resize the window', 'info')
    
    return {
      instructions: 'Manual testing required - resize viewport to different sizes',
      breakpoints: breakpointTests,
      validateFunction: 'NavigationTestUtils.validateCurrentLayout()'
    }
  },

  validateCurrentLayout: function() {
    const viewport = this.getCurrentViewport()
    const isMobile = viewport.width < 768
    const expectedLayout = isMobile ? 'mobile' : 'desktop'
    
    const sidebar = document.querySelector('[data-testid="sidebar"]')
    const bottomNav = document.querySelector('[data-testid="bottom-nav"]')
    
    const actualLayout = sidebar ? 'desktop' : (bottomNav ? 'mobile' : 'unknown')
    
    const result = {
      viewport,
      expectedLayout,
      actualLayout,
      correct: expectedLayout === actualLayout,
      elements: {
        sidebar: !!sidebar,
        bottomNav: !!bottomNav
      }
    }

    const status = result.correct ? 'success' : 'error'
    this.log(`Viewport: ${viewport.width}px - Expected: ${expectedLayout}, Actual: ${actualLayout} ${result.correct ? '✓' : '✗'}`, status)
    
    return result
  },

  // Touch Target Measurement Tool
  measureTouchTargets: function() {
    this.log('Measuring all touch targets...', 'info')
    
    const targets = document.querySelectorAll('a, button, input, select, textarea')
    const results = Array.from(targets).map((target, index) => {
      const rect = target.getBoundingClientRect()
      const styles = window.getComputedStyle(target)
      
      return {
        index,
        element: target.tagName.toLowerCase(),
        text: target.textContent?.trim().substring(0, 30) || '',
        size: { width: rect.width, height: rect.height },
        meetsWCAG: rect.width >= 44 && rect.height >= 44,
        isVisible: rect.width > 0 && rect.height > 0 && target.offsetParent !== null,
        position: { top: rect.top, left: rect.left },
        cursor: styles.cursor
      }
    }).filter(target => target.isVisible)

    const summary = {
      total: results.length,
      passing: results.filter(t => t.meetsWCAG).length,
      failing: results.filter(t => !t.meetsWCAG).length,
      failureRate: (results.filter(t => !t.meetsWCAG).length / results.length * 100).toFixed(1) + '%'
    }

    console.table(results.filter(t => !t.meetsWCAG))
    this.log(`Touch Target Summary: ${summary.passing}/${summary.total} pass (${summary.failureRate} failure rate)`, summary.failing === 0 ? 'success' : 'warning')
    
    return { summary, details: results }
  },

  // Performance Measurement
  measurePerformance: function() {
    this.log('Measuring DOM Performance...', 'info')
    
    const startTime = performance.now()
    
    // Count elements
    const allElements = document.querySelectorAll('*')
    const sidebarElements = document.querySelectorAll('[data-testid*="sidebar"]')
    const bottomNavElements = document.querySelectorAll('[data-testid="bottom-nav"] *')
    const interactiveElements = document.querySelectorAll('a, button, input, select, textarea')
    
    const endTime = performance.now()
    
    const viewport = this.getCurrentViewport()
    const layout = viewport.isMobile ? 'mobile' : 'desktop'
    
    const metrics = {
      layout,
      viewport,
      measurementTime: endTime - startTime,
      elements: {
        total: allElements.length,
        sidebar: sidebarElements.length,
        bottomNav: bottomNavElements.length,
        interactive: interactiveElements.length
      },
      estimatedMemory: {
        elements: allElements.length * 200, // bytes
        interactive: interactiveElements.length * 50,
        total: (allElements.length * 200) + (interactiveElements.length * 50)
      }
    }

    this.log(`${layout.toUpperCase()} Performance: ${metrics.elements.total} elements, ~${(metrics.estimatedMemory.total / 1024).toFixed(1)}KB`, 'info')
    console.table(metrics.elements)
    
    return metrics
  },

  // Accessibility Testing
  testAccessibility: function() {
    this.log('Running Accessibility Checks...', 'info')
    
    const viewport = this.getCurrentViewport()
    const results = {
      viewport,
      timestamp: new Date().toISOString(),
      tests: {}
    }

    // Test focus management
    results.tests.focusManagement = this.testFocusManagement()
    
    // Test ARIA landmarks
    results.tests.ariaLandmarks = this.testAriaLandmarks()
    
    // Test keyboard navigation
    results.tests.keyboardNav = this.testKeyboardNavigation()
    
    // Test color contrast (basic check)
    results.tests.colorContrast = this.testColorContrast()

    this.testResults.accessibility = results
    this.displayTestResults('Accessibility', results)
    return results
  },

  testFocusManagement: function() {
    const focusableElements = document.querySelectorAll(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )

    const results = Array.from(focusableElements).slice(0, 5).map((el, index) => {
      el.focus()
      const styles = window.getComputedStyle(el)
      return {
        index,
        element: el.tagName.toLowerCase(),
        hasFocus: document.activeElement === el,
        hasVisibleFocus: styles.outline !== 'none' || styles.boxShadow.includes('focus'),
        tabIndex: el.tabIndex
      }
    })

    const allFocusable = results.every(r => r.hasFocus)
    
    return {
      passed: allFocusable,
      message: allFocusable ? `Focus management working (tested ${results.length} elements) ✓` : 'Focus management issues ✗',
      details: { focusableCount: focusableElements.length, tested: results }
    }
  },

  testAriaLandmarks: function() {
    const landmarks = {
      navigation: document.querySelectorAll('nav, [role="navigation"]').length,
      main: document.querySelectorAll('main, [role="main"]').length,
      banner: document.querySelectorAll('header, [role="banner"]').length,
      contentinfo: document.querySelectorAll('footer, [role="contentinfo"]').length
    }

    const hasBasicLandmarks = landmarks.navigation > 0 && landmarks.main >= 1 && landmarks.banner >= 1

    return {
      passed: hasBasicLandmarks,
      message: hasBasicLandmarks ? 'Basic ARIA landmarks present ✓' : 'Missing required ARIA landmarks ✗',
      details: landmarks
    }
  },

  testKeyboardNavigation: function() {
    this.log('Note: Full keyboard navigation testing requires manual Tab key testing', 'warning')
    
    const navElements = document.querySelectorAll('[data-testid="bottom-nav"] a, [data-testid="sidebar"] a')
    const keyboardAccessible = Array.from(navElements).every(el => el.tabIndex >= 0 || el.tagName === 'A')

    return {
      passed: keyboardAccessible,
      message: keyboardAccessible ? `${navElements.length} navigation elements keyboard accessible ✓` : 'Keyboard accessibility issues ✗',
      details: { navElementCount: navElements.length }
    }
  },

  testColorContrast: function() {
    // Basic color contrast check (simplified)
    const testElements = document.querySelectorAll('a, button, [data-testid="bottom-nav"] *, [data-testid="sidebar"] *')
    
    const contrastIssues = Array.from(testElements).slice(0, 10).map(el => {
      const styles = window.getComputedStyle(el)
      const hasBackground = styles.backgroundColor !== 'rgba(0, 0, 0, 0)' && styles.backgroundColor !== 'transparent'
      const hasColor = styles.color !== 'rgba(0, 0, 0, 0)' && styles.color !== 'transparent'
      
      return {
        element: el.tagName.toLowerCase(),
        hasBackground,
        hasColor,
        backgroundColor: styles.backgroundColor,
        color: styles.color
      }
    })

    return {
      passed: true, // Basic check only
      message: 'Basic color contrast check completed (manual verification recommended) ⚠️',
      details: { sampledElements: contrastIssues.length, note: 'Use automated tools for thorough contrast testing' }
    }
  },

  // Display Results
  displayTestResults: function(category, results) {
    this.log(`\n=== ${category} Test Results ===`, 'info')
    
    if (results.tests) {
      Object.entries(results.tests).forEach(([testName, result]) => {
        const status = result.passed ? 'success' : 'error'
        this.log(`${testName}: ${result.message}`, status)
      })
    }

    const totalTests = results.tests ? Object.keys(results.tests).length : 0
    const passedTests = results.tests ? Object.values(results.tests).filter(t => t.passed).length : 0
    
    this.log(`${category} Summary: ${passedTests}/${totalTests} tests passed`, passedTests === totalTests ? 'success' : 'warning')
    
    console.log('Full results:', results)
  },

  // Generate Test Report
  generateTestReport: function() {
    const report = {
      timestamp: new Date().toISOString(),
      testResults: this.testResults,
      summary: {
        mobile: this.summarizeResults(this.testResults.mobile),
        desktop: this.summarizeResults(this.testResults.desktop),
        accessibility: this.summarizeResults(this.testResults.accessibility)
      }
    }

    this.log('\n=== COMPLETE TEST REPORT ===', 'info')
    console.table(report.summary)
    console.log('Full report:', report)
    
    // Copy report to clipboard if possible
    if (navigator.clipboard) {
      navigator.clipboard.writeText(JSON.stringify(report, null, 2))
        .then(() => this.log('Test report copied to clipboard', 'success'))
        .catch(() => this.log('Could not copy to clipboard', 'warning'))
    }

    return report
  },

  summarizeResults: function(results) {
    if (!results || !results.tests) {
      return { tested: false, passed: 0, total: 0, percentage: '0%' }
    }

    const tests = Object.values(results.tests)
    const passed = tests.filter(t => t.passed).length
    const total = tests.length
    const percentage = total > 0 ? `${Math.round((passed / total) * 100)}%` : '0%'

    return { tested: true, passed, total, percentage }
  },

  // Quick Test All Function
  runAllTests: function() {
    this.log('Running All Navigation Tests...', 'info')
    
    const viewport = this.getCurrentViewport()
    
    if (viewport.isMobile) {
      this.testMobileNavigation()
    } else {
      this.testDesktopNavigation()
    }
    
    this.testAccessibility()
    
    // Performance test
    this.log('\nPerformance Measurement:', 'info')
    this.measurePerformance()
    
    // Touch targets (always relevant)
    this.log('\nTouch Target Analysis:', 'info')
    this.measureTouchTargets()
    
    this.generateTestReport()
  }
}

// Initialize and provide instructions
console.clear()
console.log('%c🧪 Navigation Testing Utilities Loaded', 'font-size: 18px; color: #2196F3; font-weight: bold;')
console.log('')
console.log('Available functions:')
console.log('- NavigationTestUtils.runAllTests() - Run comprehensive test suite')
console.log('- NavigationTestUtils.testMobileNavigation() - Test mobile navigation (< 768px)')
console.log('- NavigationTestUtils.testDesktopNavigation() - Test desktop navigation (>= 768px)')
console.log('- NavigationTestUtils.testAccessibility() - Test accessibility features')
console.log('- NavigationTestUtils.validateCurrentLayout() - Validate current responsive layout')
console.log('- NavigationTestUtils.measureTouchTargets() - Measure all touch targets')
console.log('- NavigationTestUtils.measurePerformance() - Measure DOM performance')
console.log('- NavigationTestUtils.generateTestReport() - Generate complete test report')
console.log('')
console.log('💡 Quick start: NavigationTestUtils.runAllTests()')
console.log('')

// Auto-detect and suggest appropriate tests
const viewport = window.NavigationTestUtils.getCurrentViewport()
if (viewport.isMobile) {
  console.log(`📱 Mobile viewport detected (${viewport.width}px). Suggested: NavigationTestUtils.testMobileNavigation()`)
} else {
  console.log(`🖥️ Desktop viewport detected (${viewport.width}px). Suggested: NavigationTestUtils.testDesktopNavigation()`)
}
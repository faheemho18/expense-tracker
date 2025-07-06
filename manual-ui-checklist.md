# Manual UI Testing Checklist
**Based on uitest.md - Execute this checklist manually**

## Quick 5-Minute UI Check

### Desktop Testing (Chrome/Firefox)
- [ ] **Dashboard loads without layout shifts**
  - Go to http://localhost:3000/dashboard
  - Check for jumping content during load
  - ✅/❌ Result: ________________

- [ ] **All widgets display content properly**
  - Check each widget for content overflow
  - Look for cut-off text or numbers
  - ✅/❌ Result: ________________

- [ ] **Dropdowns are visible and clickable**
  - Test user menu dropdown (if present)
  - Test filter dropdowns
  - Check visibility in all themes
  - ✅/❌ Result: ________________

- [ ] **Sidebar collapse/expand works smoothly**
  - Click sidebar toggle button
  - Check animation smoothness
  - ✅/❌ Result: ________________

- [ ] **Text doesn't overflow in any widgets**
  - Check number displays
  - Check category names
  - Check chart legends
  - ✅/❌ Result: ________________

### Mobile Testing (DevTools Mobile View)
**Set viewport to iPhone 12 (390x844)**

- [ ] **Touch targets are large enough**
  - Check all buttons are at least 44px
  - Test add expense button
  - ✅/❌ Result: ________________

- [ ] **Sidebar becomes offcanvas menu**
  - Check if sidebar collapses on mobile
  - Test menu accessibility
  - ✅/❌ Result: ________________

- [ ] **Widgets stack vertically**
  - Dashboard should show single column
  - No horizontal scrolling
  - ✅/❌ Result: ________________

- [ ] **Add expense button is reachable**
  - Button should be visible and tappable
  - Check positioning doesn't block content
  - ✅/❌ Result: ________________

- [ ] **Scrolling works smoothly**
  - Test vertical scrolling
  - No janky animations
  - ✅/❌ Result: ________________

### Theme Testing
**Test each theme: light, dark, blue, green**

- [ ] **Switch between all 4 themes**
  - Go to /themes page
  - Click each theme option
  - ✅/❌ Result: ________________

- [ ] **Dropdowns visible in each theme**
  - Check dropdown background colors
  - Ensure text is readable
  - ✅/❌ Result: ________________

- [ ] **Text remains readable**
  - Check contrast ratios
  - Look for invisible text
  - ✅/❌ Result: ________________

- [ ] **Contrast is sufficient**
  - Text should stand out from background
  - No pure white on white
  - ✅/❌ Result: ________________

## Critical User Flows

### Expense Management Flow
1. **Add expense → form opens smoothly**
   - Click "Add Expense" button
   - Form/modal should appear with animation
   - ✅/❌ Result: ________________

2. **Fill form → no input issues**
   - Test description field
   - Test amount input
   - Test category dropdown
   - ✅/❌ Result: ________________

3. **Submit → success feedback**
   - Submit form
   - Check for confirmation
   - ✅/❌ Result: ________________

4. **View in table → no overflow**
   - Check expense appears in list
   - Text should fit properly
   - ✅/❌ Result: ________________

### Dashboard Interaction Flow
1. **Drag widget → smooth movement**
   - Try dragging a dashboard widget
   - Movement should be fluid
   - ✅/❌ Result: ________________

2. **Resize widget → content adapts**
   - If resizing is supported
   - Content should reflow properly
   - ✅/❌ Result: ________________

3. **Filter data → widgets update**
   - Apply any available filters
   - Widgets should update accordingly
   - ✅/❌ Result: ________________

4. **Export data → modal opens correctly**
   - Find export functionality
   - Modal should appear properly
   - ✅/❌ Result: ________________

## Browser-Specific Testing

### Chrome
- [ ] **Inspect mode overflow detection**
  ```
  1. Open DevTools (F12)
  2. Go to Console tab
  3. Paste ui-analysis.js script
  4. Run and check results
  ```
  - ✅/❌ Result: ________________

### Firefox
- [ ] **Test same functionality in Firefox**
  - Dropdowns work
  - Animations smooth
  - ✅/❌ Result: ________________

### Safari (if available)
- [ ] **Test WebKit-specific issues**
  - Check date pickers
  - Test iOS-style interactions
  - ✅/❌ Result: ________________

## Performance Quick Checks

### Page Load Performance
- [ ] **Home page loads in < 3 seconds**
  - Time from navigation to interactive
  - ✅/❌ Result: ______ seconds

- [ ] **Dashboard loads in < 3 seconds**
  - Include widget rendering time
  - ✅/❌ Result: ______ seconds

### Animation Performance
- [ ] **Sidebar animation is smooth (60fps)**
  - No stuttering or jank
  - ✅/❌ Result: ________________

- [ ] **Number tickers animate smoothly**
  - If present, should count up fluidly
  - ✅/❌ Result: ________________

### Memory Usage
- [ ] **No obvious memory leaks**
  - Check DevTools Memory tab
  - Navigate between pages multiple times
  - ✅/❌ Result: ________________

## Automated Script Tests

### Run UI Analysis Script
```javascript
// Copy and paste this in browser console on each page:
// (Content of ui-analysis.js)
```

**Results Summary:**
- Text overflow issues: ______
- Undersized touch targets: ______
- Accessibility issues: ______
- Layout problems: ______

## Issue Documentation

### Found Issues
**Issue #1:**
- Description: ________________________________
- Severity: High/Medium/Low
- Page/Component: ____________________________
- Steps to reproduce: _________________________

**Issue #2:**
- Description: ________________________________
- Severity: High/Medium/Low
- Page/Component: ____________________________
- Steps to reproduce: _________________________

**Issue #3:**
- Description: ________________________________
- Severity: High/Medium/Low
- Page/Component: ____________________________
- Steps to reproduce: _________________________

## Test Environment Details
- **Date/Time:** ___________________________
- **Browser:** ______________________________
- **Screen Resolution:** ____________________
- **Operating System:** _____________________
- **Mobile Device (if tested):** _____________

## Overall Assessment

### UI Health Score
- **Excellent (0-2 issues):** _______________
- **Good (3-5 issues):** ____________________
- **Needs Improvement (6+ issues):** ________

### Priority Fixes Needed
1. ________________________________________
2. ________________________________________
3. ________________________________________

### Testing Completion
- **Total Tests Completed:** _____ / 50
- **Pass Rate:** ______ %
- **Critical Issues:** ______
- **Recommended Actions:** ________________

---

## Next Steps
1. Fix critical issues first
2. Refer to uitest.md for detailed solutions
3. Re-run tests after fixes
4. Consider automated testing setup for continuous monitoring

**Tested by:** ___________________________
**Date:** ___________________________________
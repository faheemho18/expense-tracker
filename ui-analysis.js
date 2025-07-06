/**
 * UI Analysis Script
 * Client-side JavaScript for manual UI glitch detection
 * Run this in browser console for comprehensive UI analysis
 */

(function() {
  'use strict';
  
  console.log('🔍 Starting UI Glitch Analysis...\n');
  
  // Test 1: Text Overflow Detection
  function detectTextOverflow() {
    console.log('📝 Checking for text overflow...');
    
    const elements = Array.from(document.querySelectorAll('*'));
    const overflowing = elements.filter(el => {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      
      return (
        rect.right > window.innerWidth && 
        rect.width > 0 &&
        style.overflow !== 'hidden' &&
        style.overflowX !== 'hidden'
      );
    });
    
    console.log(`Found ${overflowing.length} elements with text overflow`);
    overflowing.forEach((el, i) => {
      if (i < 5) { // Show first 5
        console.log(`  - ${el.tagName}.${el.className}: ${el.textContent?.substring(0, 50)}...`);
      }
    });
    
    return overflowing.length;
  }
  
  // Test 2: Touch Target Size Analysis
  function analyzeTouchTargets() {
    console.log('\n📱 Analyzing touch target sizes...');
    
    const interactive = Array.from(document.querySelectorAll(
      'button, a, input, [role="button"], [tabindex="0"], select, textarea'
    ));
    
    const results = {
      total: interactive.length,
      tooSmall: 0,
      acceptable: 0,
      good: 0
    };
    
    interactive.forEach(el => {
      const rect = el.getBoundingClientRect();
      const minDimension = Math.min(rect.width, rect.height);
      
      if (rect.width > 0 && rect.height > 0) {
        if (minDimension < 32) {
          results.tooSmall++;
        } else if (minDimension < 44) {
          results.acceptable++;
        } else {
          results.good++;
        }
      }
    });
    
    console.log(`Touch Target Analysis:`);
    console.log(`  Total interactive elements: ${results.total}`);
    console.log(`  Too small (< 32px): ${results.tooSmall}`);
    console.log(`  Acceptable (32-44px): ${results.acceptable}`);
    console.log(`  Good (≥ 44px): ${results.good}`);
    
    return results;
  }
  
  // Test 3: Color Contrast Check
  function checkColorContrast() {
    console.log('\n🎨 Checking color contrast...');
    
    const textElements = Array.from(document.querySelectorAll('p, span, h1, h2, h3, h4, h5, h6, button, a'));
    let lowContrastCount = 0;
    
    textElements.slice(0, 20).forEach(el => { // Check first 20 elements
      const style = window.getComputedStyle(el);
      const color = style.color;
      const backgroundColor = style.backgroundColor;
      
      // Simple heuristic: if both are very light or very dark
      const isLowContrast = (
        (color.includes('rgb(255') && backgroundColor.includes('rgb(255')) ||
        (color.includes('rgb(0') && backgroundColor.includes('rgb(0'))
      );
      
      if (isLowContrast) {
        lowContrastCount++;
      }
    });
    
    console.log(`Potential low contrast elements: ${lowContrastCount}/20 checked`);
    
    return lowContrastCount;
  }
  
  // Test 4: Widget Content Analysis
  function analyzeWidgetContent() {
    console.log('\n📊 Analyzing widget content...');
    
    const widgets = Array.from(document.querySelectorAll(
      '[data-testid*="widget"], .widget, [class*="widget"]'
    ));
    
    console.log(`Found ${widgets.length} widget elements`);
    
    widgets.forEach((widget, i) => {
      const rect = widget.getBoundingClientRect();
      const hasOverflow = widget.scrollWidth > widget.clientWidth || 
                         widget.scrollHeight > widget.clientHeight;
      
      console.log(`  Widget ${i + 1}: ${rect.width}x${rect.height}px, overflow: ${hasOverflow}`);
    });
    
    return widgets.length;
  }
  
  // Test 5: Form Input Analysis
  function analyzeFormInputs() {
    console.log('\n📝 Analyzing form inputs...');
    
    const inputs = Array.from(document.querySelectorAll('input, textarea, select'));
    const results = {
      total: inputs.length,
      withLabels: 0,
      withPlaceholders: 0,
      required: 0
    };
    
    inputs.forEach(input => {
      const label = document.querySelector(`label[for="${input.id}"]`) || 
                   input.closest('label');
      const hasLabel = !!label;
      const hasPlaceholder = !!input.placeholder;
      const isRequired = input.hasAttribute('required');
      
      if (hasLabel) results.withLabels++;
      if (hasPlaceholder) results.withPlaceholders++;
      if (isRequired) results.required++;
    });
    
    console.log(`Form Input Analysis:`);
    console.log(`  Total inputs: ${results.total}`);
    console.log(`  With labels: ${results.withLabels}`);
    console.log(`  With placeholders: ${results.withPlaceholders}`);
    console.log(`  Required fields: ${results.required}`);
    
    return results;
  }
  
  // Test 6: Animation Performance Check
  function checkAnimationPerformance() {
    console.log('\n🎬 Checking animation performance...');
    
    const animatedElements = Array.from(document.querySelectorAll('*')).filter(el => {
      const style = window.getComputedStyle(el);
      return style.animationName !== 'none' || 
             style.transitionProperty !== 'none' ||
             el.classList.toString().includes('animate');
    });
    
    console.log(`Found ${animatedElements.length} animated elements`);
    
    // Check for potential performance issues
    const expensiveAnimations = animatedElements.filter(el => {
      const style = window.getComputedStyle(el);
      return style.animationName.includes('transform') || 
             style.transitionProperty.includes('transform') ||
             style.transitionProperty.includes('opacity');
    });
    
    console.log(`${expensiveAnimations.length} elements use performant animations (transform/opacity)`);
    
    return {
      total: animatedElements.length,
      performant: expensiveAnimations.length
    };
  }
  
  // Test 7: Responsive Layout Check
  function checkResponsiveLayout() {
    console.log('\n📐 Checking responsive layout...');
    
    const viewportWidth = window.innerWidth;
    const breakpoints = {
      mobile: viewportWidth < 640,
      tablet: viewportWidth >= 640 && viewportWidth < 1024,
      desktop: viewportWidth >= 1024
    };
    
    const currentBreakpoint = Object.keys(breakpoints).find(bp => breakpoints[bp]);
    console.log(`Current viewport: ${viewportWidth}px (${currentBreakpoint})`);
    
    // Check for horizontal scrolling
    const hasHorizontalScroll = document.body.scrollWidth > window.innerWidth;
    console.log(`Horizontal scrolling: ${hasHorizontalScroll ? '❌ Present' : '✅ None'}`);
    
    // Check for fixed-width elements that might cause issues
    const fixedWidthElements = Array.from(document.querySelectorAll('*')).filter(el => {
      const style = window.getComputedStyle(el);
      return style.width.includes('px') && parseInt(style.width) > viewportWidth;
    });
    
    console.log(`Fixed-width elements wider than viewport: ${fixedWidthElements.length}`);
    
    return {
      currentBreakpoint,
      hasHorizontalScroll,
      oversizedElements: fixedWidthElements.length
    };
  }
  
  // Test 8: Accessibility Quick Check
  function quickAccessibilityCheck() {
    console.log('\n♿ Quick accessibility check...');
    
    const results = {
      imagesWithoutAlt: document.querySelectorAll('img:not([alt])').length,
      buttonsWithoutText: Array.from(document.querySelectorAll('button')).filter(btn => 
        !btn.textContent.trim() && !btn.getAttribute('aria-label')
      ).length,
      linksWithoutText: Array.from(document.querySelectorAll('a')).filter(link => 
        !link.textContent.trim() && !link.getAttribute('aria-label')
      ).length,
      inputsWithoutLabels: Array.from(document.querySelectorAll('input')).filter(input => {
        const label = document.querySelector(`label[for="${input.id}"]`) || input.closest('label');
        return !label && !input.getAttribute('aria-label');
      }).length
    };
    
    console.log(`Accessibility Issues:`);
    console.log(`  Images without alt text: ${results.imagesWithoutAlt}`);
    console.log(`  Buttons without text/label: ${results.buttonsWithoutText}`);
    console.log(`  Links without text/label: ${results.linksWithoutText}`);
    console.log(`  Inputs without labels: ${results.inputsWithoutLabels}`);
    
    return results;
  }
  
  // Run all tests
  const results = {
    textOverflow: detectTextOverflow(),
    touchTargets: analyzeTouchTargets(),
    colorContrast: checkColorContrast(),
    widgets: analyzeWidgetContent(),
    forms: analyzeFormInputs(),
    animations: checkAnimationPerformance(),
    responsive: checkResponsiveLayout(),
    accessibility: quickAccessibilityCheck()
  };
  
  // Summary
  console.log('\n📋 UI Analysis Summary:');
  console.log('═══════════════════════════');
  
  const issues = [];
  
  if (results.textOverflow > 0) {
    issues.push(`${results.textOverflow} text overflow issues`);
  }
  
  if (results.touchTargets.tooSmall > 0) {
    issues.push(`${results.touchTargets.tooSmall} undersized touch targets`);
  }
  
  if (results.responsive.hasHorizontalScroll) {
    issues.push('Horizontal scrolling detected');
  }
  
  if (results.accessibility.imagesWithoutAlt > 0) {
    issues.push(`${results.accessibility.imagesWithoutAlt} accessibility issues`);
  }
  
  if (issues.length === 0) {
    console.log('✅ No major UI issues detected!');
  } else {
    console.log('⚠️  Issues found:');
    issues.forEach(issue => console.log(`   - ${issue}`));
  }
  
  console.log('\nTo fix issues, refer to the uitest.md guide for detailed solutions.');
  
  // Store results globally for further inspection
  window.uiAnalysisResults = results;
  
  return results;
})();
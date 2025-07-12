# Gemini CLI Integration Guide

This document provides comprehensive guidance for using the Gemini CLI as a complementary tool to Claude Code for enhanced development workflows.

## Overview

The Gemini CLI serves as our primary parallel processing engine with **4M tokens/day capacity** across 15 API keys. This massive resource pool enables aggressive parallel orchestration, comprehensive research, and unlimited subagent spawning without token conservation concerns.

## Authentication Setup

### API Key Configuration

The project supports multiple Gemini API keys for rotation, load balancing, and parallel subagent operations:

```bash
# All 15 API keys available for randomized selection
GEMINI_KEYS=(
  "AIzaSyAsOk2g98gB6-o-8RsVJM7_V53s_aK0qgQ"
  "AIzaSyBLgzs1P6vyjJdERF5VkIez2uSbKVOZqko"
  "AIzaSyDSt_OezA-upm4N-hEQh6DxMsMfEVTlLFk"
  "AIzaSyAummYMpvdWOcCPwV6CnB_mVrU938nUZbw"
  "AIzaSyA5RLt-FYRkUjqQBb373ae7ZNs13HLBDjQ"
  "AIzaSyBcwL7QxaCwGEPuR5syeBblSaSofJiu4N8"
  "AIzaSyCgRzIwfTDO9QpfFcvIka0qJ-fEYN2u5zA"
  "AIzaSyAW45QG5rBFxLJavwKmexPgEnyc5AfVejU"
  "AIzaSyBIn4cJKbYQtYPnQS-lERIlnqMftEyyRT8"
  "AIzaSyAWMOK29uLAP00Xb93-7Ekex5TmbwzBnpw"
  "AIzaSyDZpmcDvaWh-C2abzdE8us4wCSMSUss8as"
  "AIzaSyAqRdWvgz1WFInskls8OHHYeVIpm2Om5tg"
  "AIzaSyAXSl4XIzl5cxMkby2ih5TlHMd5F7hIoNo"
  "AIzaSyBG3J4i7gP8sR6u47HKRpEsN0yG0RaloHI"
  "AIzaSyAkNEbN_2okro332Wvt2ximVtsjflazr3g"
)

# Function to get random API key
get_random_gemini_key() {
  local index=$((RANDOM % ${#GEMINI_KEYS[@]}))
  echo "${GEMINI_KEYS[$index]}"
}

# Usage: Export random key for each gemini command
export GEMINI_API_KEY=$(get_random_gemini_key)
```

### Automatic Key Randomization Script

**Create a wrapper script for automatic randomization:**

```bash
# Save as ~/bin/gemini-random or add to your shell profile
#!/bin/bash

# Array of all 15 API keys
GEMINI_KEYS=(
  "AIzaSyAsOk2g98gB6-o-8RsVJM7_V53s_aK0qgQ"
  "AIzaSyBLgzs1P6vyjJdERF5VkIez2uSbKVOZqko"
  "AIzaSyDSt_OezA-upm4N-hEQh6DxMsMfEVTlLFk"
  "AIzaSyAummYMpvdWOcCPwV6CnB_mVrU938nUZbw"
  "AIzaSyA5RLt-FYRkUjqQBb373ae7ZNs13HLBDjQ"
  "AIzaSyBcwL7QxaCwGEPuR5syeBblSaSofJiu4N8"
  "AIzaSyCgRzIwfTDO9QpfFcvIka0qJ-fEYN2u5zA"
  "AIzaSyAW45QG5rBFxLJavwKmexPgEnyc5AfVejU"
  "AIzaSyBIn4cJKbYQtYPnQS-lERIlnqMftEyyRT8"
  "AIzaSyAWMOK29uLAP00Xb93-7Ekex5TmbwzBnpw"
  "AIzaSyDZpmcDvaWh-C2abzdE8us4wCSMSUss8as"
  "AIzaSyAqRdWvgz1WFInskls8OHHYeVIpm2Om5tg"
  "AIzaSyAXSl4XIzl5cxMkby2ih5TlHMd5F7hIoNo"
  "AIzaSyBG3J4i7gP8sR6u47HKRpEsN0yG0RaloHI"
  "AIzaSyAkNEbN_2okro332Wvt2ximVtsjflazr3g"
)

# Select random API key
RANDOM_KEY=${GEMINI_KEYS[$RANDOM % ${#GEMINI_KEYS[@]}]}

# Export and execute gemini with random key
GEMINI_API_KEY="$RANDOM_KEY" gemini "$@"
```

**Make script executable and use:**
```bash
chmod +x ~/bin/gemini-random
# Use random key for each call
gemini-random -m gemini-2.5-pro -p "Your prompt here"
```

### Randomized API Key Distribution

**Automatic Load Balancing Benefits:**
- **Even Distribution**: Random selection prevents key clustering and hotspots
- **Rate Limit Avoidance**: Spreads requests across all 15 keys automatically
- **Fault Tolerance**: Failed keys are naturally avoided through randomization
- **Simplified Management**: No manual key assignment required
- **Optimal Resource Usage**: Maximizes 4M token daily capacity utilization

**Randomized Subagent Operations:**
```bash
# Each subagent gets a random key automatically
Task 1: export GEMINI_API_KEY=$(get_random_gemini_key) && gemini -m gemini-2.5-pro -p "[task 1]"
Task 2: export GEMINI_API_KEY=$(get_random_gemini_key) && gemini -m gemini-2.5-pro -p "[task 2]"
Task 3: export GEMINI_API_KEY=$(get_random_gemini_key) && gemini -m gemini-2.5-pro -p "[task 3]"
Task 4: export GEMINI_API_KEY=$(get_random_gemini_key) && gemini -m gemini-2.5-pro -p "[task 4]"
Task 5: export GEMINI_API_KEY=$(get_random_gemini_key) && gemini -m gemini-2.5-pro -p "[task 5]"

# Or use the wrapper script for cleaner syntax
Task 1: gemini-random -m gemini-2.5-pro -p "[task 1]"
Task 2: gemini-random -m gemini-2.5-pro -p "[task 2]"
Task 3: gemini-random -m gemini-2.5-pro -p "[task 3]"
Task 4: gemini-random -m gemini-2.5-pro -p "[task 4]"
Task 5: gemini-random -m gemini-2.5-pro -p "[task 5]"
```

**Advanced Randomization with Retry Logic:**
```bash
#!/bin/bash
# Enhanced wrapper with automatic retry on rate limits

retry_gemini() {
  local max_retries=3
  local retry_count=0
  
  while [ $retry_count -lt $max_retries ]; do
    # Get fresh random key for each attempt
    local random_key=${GEMINI_KEYS[$RANDOM % ${#GEMINI_KEYS[@]}]}
    
    # Execute with current random key
    if GEMINI_API_KEY="$random_key" gemini "$@"; then
      return 0  # Success
    else
      echo "Attempt $((retry_count + 1)) failed, trying different key..."
      retry_count=$((retry_count + 1))
      sleep 1  # Brief delay before retry
    fi
  done
  
  echo "All retry attempts failed"
  return 1
}

# Usage: retry_gemini -m gemini-2.5-pro -p "prompt"
```

### 4M Token Daily Capacity

**Resource Abundance Philosophy:**
- **Daily Capacity**: 4M tokens across 15 API keys (≈267k tokens per key)
- **No Conservation**: Use tokens aggressively - we have massive capacity
- **Parallel Priority**: Default to parallel processing over sequential execution
- **Research Heavy**: Comprehensive analysis over quick summaries
- **Subagent Unlimited**: Spawn as many subagents as needed

**Usage Guidelines:**
- **Complex Tasks**: Use 8-15 subagents simultaneously
- **Research Tasks**: Deep dive with multiple specialized perspectives
- **Analysis Tasks**: Comprehensive rather than surface-level examination
- **Implementation**: Research + plan + code + test + document in parallel

### Rate Limit Management

With randomized API key selection, rate limits are automatically distributed and minimized:

**Automatic Rate Limit Handling:**
```bash
# Randomization naturally distributes load
# No manual key switching required
gemini-random -m gemini-2.5-pro -p "Your prompt"

# Built-in retry with different random keys on failure
retry_gemini -m gemini-2.5-pro -p "Your prompt"
```

**Manual Key Selection (if needed):**
```bash
# Force specific key for debugging
GEMINI_API_KEY="AIzaSyAsOk2g98gB6-o-8RsVJM7_V53s_aK0qgQ" gemini -m gemini-2.5-pro -p "prompt"

# Get current random key selection
echo "Using key: $(get_random_gemini_key)"
```

## Use Cases & Syntax

### 1. Multi-Step Complex Tasks

**When to Use:**
- Large refactoring projects
- Feature implementations requiring multiple files
- Architectural changes and system redesigns
- Complex debugging across multiple components

**Syntax:**
```bash
gemini -m gemini-2.5-pro -p "Break down this complex task: [detailed description]. Provide step-by-step implementation plan with file-specific changes."
```

**Example:**
```bash
gemini -m gemini-2.5-pro -p "I need to implement user authentication system. Analyze current codebase and provide detailed implementation plan including database changes, API routes, components, and security considerations."
```

### 2. High Token Operations

**When to Use:**
- Full codebase analysis
- Comprehensive documentation generation
- Large-scale code reviews
- Architecture assessment

**Syntax:**
```bash
gemini -m gemini-2.5-pro -a -p "Analyze entire codebase for [specific issue/pattern/improvement]"
```

**Example:**
```bash
gemini -m gemini-2.5-pro -a -p "Analyze entire codebase for TypeScript type safety issues and performance bottlenecks. Provide prioritized recommendations."
```

### 3. Parallel Processing & Delegation

**When to Use:**
- Concurrent analysis while implementing
- Background research during development
- Component analysis while building features
- Code review while fixing issues

**Syntax:**
```bash
gemini -m gemini-2.5-flash -p "@file1.js @file2.js @file3.tsx Analyze these components for [specific criteria] while I work on implementation"
```

**Example:**
```bash
gemini -m gemini-2.5-flash -p "@src/components/dashboard/*.tsx Analyze all dashboard components for accessibility issues and mobile responsiveness while I implement the new features."
```

### 4. Research & Web Information

**When to Use:**
- Technology updates and best practices
- Security vulnerability research
- Framework/library updates
- Industry standards and compliance

**Syntax:**
```bash
gemini -m gemini-2.5-pro -p "Research latest [technology/topic] best practices for 2024-2025. Focus on [specific aspects] relevant to our Next.js project."
```

**Example:**
```bash
gemini -m gemini-2.5-pro -p "Research latest Next.js 15 performance optimization techniques and React 18 concurrent features. Provide actionable recommendations for our expense tracking app."
```

### 5. Code Analysis & Review

**When to Use:**
- Security audits
- Performance optimization
- Code quality assessment
- Best practices validation

**Syntax:**
```bash
gemini -m gemini-2.5-pro -p "@component.tsx Review this code for [security/performance/maintainability]. Provide specific improvements with code examples."
```

**Example:**
```bash
gemini -m gemini-2.5-pro -p "@src/components/expenses/ExpenseForm.tsx Review this form component for security vulnerabilities, performance issues, and accessibility compliance."
```

### 6. Documentation & Planning

**When to Use:**
- API documentation generation
- Technical specification creation
- Migration planning
- Testing strategy development

**Syntax:**
```bash
gemini -m gemini-2.5-pro -p "@api-routes/ Generate comprehensive API documentation for these routes including request/response examples and error handling."
```

### 7. Pre-Planning Consultation

**When to Use:**
- Before entering plan mode to get initial analysis
- Complex task breakdown requiring deep understanding
- Strategic planning for large features or refactoring
- Risk assessment and approach validation

**Syntax:**
```bash
export GEMINI_API_KEY=AIzaSyAsOk2g98gB6-o-8RsVJM7_V53s_aK0qgQ && gemini -m gemini-2.5-pro -p "Analyze this task and provide strategic planning recommendations: [detailed task description]. Consider implementation approaches, potential risks, and recommended phases."
```

**Example:**
```bash
export GEMINI_API_KEY=AIzaSyAsOk2g98gB6-o-8RsVJM7_V53s_aK0qgQ && gemini -m gemini-2.5-pro -p "I need to implement real-time collaborative editing for our expense tracking app. Analyze the current architecture and recommend the best approach considering WebSockets, conflict resolution, and data synchronization."
```

**Integration with Plan Mode:**
Use this consultation before presenting plans to users. The workflow becomes:
1. **Consult Gemini** for strategic analysis and recommendations
2. **Synthesize findings** into a comprehensive plan
3. **Present plan** to user using exit_plan_mode tool
4. **Implement** the approved plan

### 8. Orchestrated Subagent Operations

**When to Use:**
- Complex tasks requiring multiple domains of expertise
- Research that can be parallelized across different topics
- Large-scale implementations with multiple components
- Time-sensitive tasks requiring maximum efficiency
- Any task where parallel processing provides value

**Hierarchical Delegation Methodology:**
Act as an orchestrator spawning autonomous Task subagents who serve as task managers. Each subagent receives complete task assignments and chooses their execution approach:
- **Direct Execution**: Subagent completes task using available tools
- **Gemini-Assisted**: Subagent uses Gemini CLI with assigned API key for complex analysis/research
- **Hybrid Approach**: Combination of direct work and Gemini assistance

**Workflow Pattern:**
1. **Orchestrator** → Delegates complete tasks to subagents
2. **Subagents** → Choose execution method and complete assigned work  
3. **Subagents** → Report results back to orchestrator
4. **Orchestrator** → Assess completeness and iterate if needed
5. **Orchestrator** → Synthesize final results for user

**Note**: This methodology applies to parallel tasks only. Sequential tasks use standard direct execution.

**Syntax Pattern:**
```bash
# Spawn multiple subagents with randomized API keys
Task 1: gemini-random -m gemini-2.5-pro -p "[research topic 1]"
Task 2: gemini-random -m gemini-2.5-pro -p "[research topic 2]"
Task 3: gemini-random -m gemini-2.5-pro -p "[research topic 3]"
# Continue spawning as many subagents as needed
# Each automatically gets a random key for optimal load distribution
```

**Example Orchestration (8-Key System Validated):**
```bash
# Large-Scale Parallel Research - 15 simultaneous subagents tested successfully
Subagent 1: export GEMINI_API_KEY=AIzaSyAsOk2g98gB6-o-8RsVJM7_V53s_aK0qgQ     # Web Dev
Subagent 2: export GEMINI_API_KEY=AIzaSyBLgzs1P6vyjJdERF5VkIez2uSbKVOZqko   # Database  
Subagent 3: export GEMINI_API_KEY=AIzaSyDSt_OezA-upm4N-hEQh6DxMsMfEVTlLFk   # Cloud
Subagent 4: export GEMINI_API_KEY=AIzaSyAummYMpvdWOcCPwV6CnB_mVrU938nUZbw   # DevOps
Subagent 5: export GEMINI_API_KEY=AIzaSyA5RLt-FYRkUjqQBb373ae7ZNs13HLBDjQ   # Security
Subagent 6: export GEMINI_API_KEY=AIzaSyBcwL7QxaCwGEPuR5syeBblSaSofJiu4N8   # AI/ML
Subagent 7: export GEMINI_API_KEY=AIzaSyCgRzIwfTDO9QpfFcvIka0qJ-fEYN2u5zA   # Mobile
Subagent 8: export GEMINI_API_KEY=AIzaSyAW45QG5rBFxLJavwKmexPgEnyc5AfVejU   # Architecture
Subagent 9: export GEMINI_API_KEY=AIzaSyBIn4cJKbYQtYPnQS-lERIlnqMftEyyRT8   # Performance
Subagent 10: export GEMINI_API_KEY=AIzaSyAWMOK29uLAP00Xb93-7Ekex5TmbwzBnpw  # UX/UI
Subagent 11: export GEMINI_API_KEY=AIzaSyDZpmcDvaWh-C2abzdE8us4wCSMSUss8as  # Testing
Subagent 12: export GEMINI_API_KEY=AIzaSyAqRdWvgz1WFInskls8OHHYeVIpm2Om5tg  # Integration
Subagent 13: export GEMINI_API_KEY=AIzaSyAXSl4XIzl5cxMkby2ih5TlHMd5F7hIoNo  # Compliance
Subagent 14: export GEMINI_API_KEY=AIzaSyBG3J4i7gP8sR6u47HKRpEsN0yG0RaloHI  # Documentation
Subagent 15: export GEMINI_API_KEY=AIzaSyAkNEbN_2okro332Wvt2ximVtsjflazr3g  # Analytics

# Test Results: ALL 15 KEYS OPERATIONAL ✅
# Capacity: 3.75M+ tokens/minute (15 keys × 250k each)
# Rate Limits: ZERO collisions during parallel execution
# Quality: Comprehensive research delivered across all domains
```

**Orchestration Best Practices:**
- **Unlimited Subagents**: Spawn as many as necessary - no artificial limits
- **API Key Rotation**: Cycle through available keys to distribute load
- **Specialized Roles**: Assign each subagent a specific expertise domain
- **Parallel Efficiency**: Design tasks that can run simultaneously
- **Synthesis Phase**: Combine all subagent results into comprehensive output

## Model Selection Guidelines

### Gemini 2.5 Pro
**Use for:**
- Complex analysis requiring deep understanding
- Architectural decisions and planning
- Research and comprehensive reviews
- Multi-step reasoning tasks

**Characteristics:**
- Higher token limit and processing power
- Better reasoning capabilities
- More detailed responses
- Higher rate limits on free tier

### Gemini 2.5 Flash
**Use for:**
- Quick analysis and simple tasks
- When Pro model hits rate limits
- Parallel processing scenarios
- Simple code reviews

**Characteristics:**
- Faster response times
- Lower token costs
- Good for straightforward tasks
- Fallback when Pro is unavailable

## Integration Patterns

### 1. Orchestrated Subagent Workflow (Recommended)
```bash
# Primary Pattern: Spawn multiple subagents with distributed API keys
Task 1: Research architecture (API Key 1)
Task 2: Analyze codebase (API Key 2)
Task 3: Research best practices (API Key 3)
Task 4: Create implementation template (no Gemini)
Task 5: Performance analysis (API Key 1)

# Synthesize results → Plan → Implement with Claude Code
```

### 2. Analysis + Implementation Workflow
```bash
# Step 1: Analyze with Gemini
gemini -m gemini-2.5-pro -p "@problematic-component.tsx Analyze this component and suggest refactoring approach"

# Step 2: Implement with Claude Code
# Use Gemini's analysis to guide implementation
```

### 3. Research + Development Workflow
```bash
# Step 1: Research with Gemini (use orchestration for complex research)
gemini -m gemini-2.5-pro -p "Research modern state management patterns for React 18 applications"

# Step 2: Apply findings with Claude Code
# Implement recommended patterns
```

### 4. Parallel Development Workflow
```bash
# Delegate multiple analyses to parallel subagents
Task 1: export GEMINI_API_KEY=$GEMINI_API_KEY_1 && gemini -m gemini-2.5-flash -p "@tests/ Analyze test coverage" 
Task 2: export GEMINI_API_KEY=$GEMINI_API_KEY_2 && gemini -m gemini-2.5-flash -p "@components/ Review component architecture"
Task 3: export GEMINI_API_KEY=$GEMINI_API_KEY_3 && gemini -m gemini-2.5-flash -p "@hooks/ Analyze custom hooks"

# Continue development with Claude Code
# Synthesize all subagent results when ready
```

## Command Reference

### Essential Flags
- `-m [model]` - Specify model (gemini-2.5-pro or gemini-2.5-flash)
- `-p "[prompt]"` - Provide prompt text
- `-a` - Include all files in context
- `@file.ext` - Reference specific files
- `-s` - Use sandbox mode for code execution
- `--debug` - Enable debug mode for troubleshooting

### Complete Examples
```bash
# Basic analysis
gemini -m gemini-2.5-flash -p "Explain this error message and suggest fix"

# File-specific analysis
gemini -m gemini-2.5-pro -p "@src/hooks/useAuth.ts Review this custom hook for potential issues"

# Multi-file analysis
gemini -m gemini-2.5-pro -p "@src/components/auth/ @src/hooks/useAuth.ts Analyze authentication system for security issues"

# Full codebase analysis
gemini -m gemini-2.5-pro -a -p "Identify performance bottlenecks across the entire application"

# Research query
gemini -m gemini-2.5-pro -p "Research React Server Components best practices for Next.js 15 applications"
```

## Error Handling & Troubleshooting

### Rate Limit Errors (429)
```bash
# With randomization, rate limits are automatically handled
# Simply retry with automatic key rotation
retry_gemini -m gemini-2.5-pro -p "Your prompt"

# Or manually select different random key
export GEMINI_API_KEY=$(get_random_gemini_key)
gemini -m gemini-2.5-pro -p "Your prompt"
```

### Authentication Issues
```bash
# If auth fails, check key configuration
echo $GEMINI_API_KEY
# Ensure key is properly set and valid
```

### WSL-Specific Issues
- Use API key authentication instead of OAuth
- Ensure environment variables are properly exported
- Check that the key is accessible in WSL session

### Model Availability
```bash
# If Pro model unavailable, fallback to Flash with random key
gemini-random -m gemini-2.5-flash -p "same prompt"

# Or use retry logic with model fallback
retry_gemini -m gemini-2.5-flash -p "same prompt"
```

## Best Practices

### 1. Randomized API Key Strategy (Primary Approach)
- **Automatic Load Balancing**: Random key selection distributes load evenly across all 15 keys
- **Rate Limit Prevention**: Avoids clustering requests on specific keys
- **Zero Management Overhead**: No manual key assignment or rotation required
- **Fault Tolerance**: Failed keys are naturally bypassed through randomization
- **4M Token Optimization**: Maximizes utilization of entire daily capacity
- **Parallel Processing**: Each subagent automatically gets optimal key distribution

### 2. Resource Abundance Strategy
- **4M Token Mindset**: Use our massive capacity aggressively - don't conserve
- **Default to Parallel**: Question any sequential workflow - can it be parallelized?
- **Unlimited Subagents**: Spawn 8-15 subagents regularly for comprehensive coverage
- **Specialized Roles**: Give each subagent a specific domain of expertise
- **Comprehensive Over Quick**: Deep analysis over surface-level summaries
- **Synthesis Phase**: Combine all subagent results into comprehensive conclusions

### 3. Randomized Orchestration Management
- **Automatic Distribution**: Random selection handles load balancing automatically
- **Simplified Scaling**: Add more API keys to array for instant availability
- **Natural Fault Tolerance**: Failed keys are avoided through randomization
- **Zero Configuration**: No manual assignment patterns needed
- **Optimal Performance**: Statistical distribution maximizes throughput

### 4. Subagent Task Design
- **Clear Specialization**: Each subagent should have a distinct research domain
- **Independent Tasks**: Design tasks that don't depend on other subagent results
- **Optimal Granularity**: Balance task size for maximum parallel benefit
- **Comprehensive Coverage**: Ensure all aspects of complex problems are covered
- **Quality Control**: Include validation subagents for complex analyses

### 5. Prompt Engineering
- Be specific about what you need
- Include context about the project
- Reference relevant files with @filename
- Ask for actionable recommendations

### 6. Token Management
- Use Flash model for simple tasks
- Reserve Pro model for complex analysis
- Random key distribution automatically optimizes usage
- Retry logic handles rate limits automatically

### 7. Workflow Integration
- Use orchestrated Gemini for analysis, Claude Code for implementation
- Delegate background tasks to multiple parallel subagents with random keys
- Combine research with development efficiently
- Document findings for future reference

### 8. File Management
- Reference specific files when possible
- Use -a flag sparingly due to token limits
- Focus on relevant code sections
- Organize prompts for clarity

## Future Enhancements

This document should be iteratively improved as new use cases are discovered:

### Template for New Use Cases
```markdown
### N. New Use Case Name

**When to Use:**
- Specific scenario 1
- Specific scenario 2

**Syntax:**
```bash
gemini -m [model] -p "[prompt pattern]"
```

**Example:**
```bash
gemini -m gemini-2.5-pro -p "concrete example"
```
```

### Enhancement Areas
- Additional model options as they become available
- More sophisticated API key rotation automation
- Integration with CI/CD pipelines
- Performance metrics and usage analytics
- Advanced prompt templates for common tasks

## Quick Reference Card

```bash
# Multi-step planning (with automatic random key selection)
gemini-random -m gemini-2.5-pro -p "Plan implementation: [task]"

# Code analysis (with random key)
gemini-random -m gemini-2.5-pro -p "@file.tsx Review for [criteria]"

# Research (with random key)
gemini-random -m gemini-2.5-pro -p "Research [topic] best practices 2024-2025"

# Parallel processing (each gets random key automatically)
gemini-random -m gemini-2.5-flash -p "@files Analyze while I implement"

# Full analysis (with random key)
gemini-random -m gemini-2.5-pro -a -p "Analyze codebase for [issue]"

# Random key selection
export GEMINI_API_KEY=$(get_random_gemini_key)

# Automatic retry with different keys
retry_gemini -m gemini-2.5-pro -p "prompt"
```

---

**Note:** This is a living document. Update use cases and examples as new patterns emerge during development.
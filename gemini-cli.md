# Gemini CLI Integration Guide

This document provides comprehensive guidance for using the Gemini CLI as a complementary tool to Claude Code for enhanced development workflows.

## Overview

The Gemini CLI serves as a powerful auxiliary tool for tasks requiring high token usage, parallel processing, research capabilities, or specialized analysis. It's designed to work seamlessly alongside Claude Code to maximize development efficiency.

## Authentication Setup

### API Key Configuration

The project supports multiple Gemini API keys for rotation, load balancing, and parallel subagent operations:

```bash
# Primary key (currently configured)
export GEMINI_API_KEY=AIzaSyAsOk2g98gB6-o-8RsVJM7_V53s_aK0qgQ

# Additional keys for parallel subagent distribution and rotation
export GEMINI_API_KEY_1=AIzaSyBLgzs1P6vyjJdERF5VkIez2uSbKVOZqko
export GEMINI_API_KEY_2=AIzaSyDSt_OezA-upm4N-hEQh6DxMsMfEVTlLFk
export GEMINI_API_KEY_3=AIzaSyAummYMpvdWOcCPwV6CnB_mVrU938nUZbw
export GEMINI_API_KEY_4=AIzaSyA5RLt-FYRkUjqQBb373ae7ZNs13HLBDjQ
export GEMINI_API_KEY_5=AIzaSyBcwL7QxaCwGEPuR5syeBblSaSofJiu4N8
export GEMINI_API_KEY_6=AIzaSyCgRzIwfTDO9QpfFcvIka0qJ-fEYN2u5zA
export GEMINI_API_KEY_7=AIzaSyAW45QG5rBFxLJavwKmexPgEnyc5AfVejU
# 8-key rotation system for maximum parallel capacity
```

### Parallel Subagent API Key Distribution

**For Orchestrated Subagent Operations:**
- **Key Distribution Strategy**: Assign different API keys to each subagent to avoid rate limits
- **Unlimited Scaling**: Add more API keys as needed for larger subagent operations
- **Load Balancing**: Distribute workload across all available keys
- **Fault Tolerance**: If one key hits limits, subagents using other keys continue working

**Subagent Key Assignment Pattern:**
```bash
# Subagent 1 uses primary key
export GEMINI_API_KEY=AIzaSyAsOk2g98gB6-o-8RsVJM7_V53s_aK0qgQ

# Subagent 2 uses rotation key 1
export GEMINI_API_KEY=AIzaSyBLgzs1P6vyjJdERF5VkIez2uSbKVOZqko

# Subagent 3 uses rotation key 2  
export GEMINI_API_KEY=AIzaSyDSt_OezA-upm4N-hEQh6DxMsMfEVTlLFk

# Subagent 4 uses rotation key 3
export GEMINI_API_KEY=AIzaSyAummYMpvdWOcCPwV6CnB_mVrU938nUZbw

# Subagent 5 uses rotation key 4
export GEMINI_API_KEY=AIzaSyA5RLt-FYRkUjqQBb373ae7ZNs13HLBDjQ

# Subagent 6 uses rotation key 5
export GEMINI_API_KEY=AIzaSyBcwL7QxaCwGEPuR5syeBblSaSofJiu4N8

# Subagent 7 uses rotation key 6
export GEMINI_API_KEY=AIzaSyCgRzIwfTDO9QpfFcvIka0qJ-fEYN2u5zA

# Subagent 8 uses rotation key 7
export GEMINI_API_KEY=AIzaSyAW45QG5rBFxLJavwKmexPgEnyc5AfVejU

# Continue pattern cycling back to primary key for additional subagents
```

### Rate Limit Management

When hitting rate limits (429 errors), rotate to the next available key:

```bash
# If primary key fails, switch to rotation keys
export GEMINI_API_KEY=$GEMINI_API_KEY_1
export GEMINI_API_KEY=$GEMINI_API_KEY_2
export GEMINI_API_KEY=$GEMINI_API_KEY_3
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

**Methodology:**
Act as an orchestrator spawning unlimited Task subagents to work in parallel. Distribute different API keys to each subagent to avoid rate limits and maximize throughput.

**Syntax Pattern:**
```bash
# Spawn multiple subagents with different API keys
Task 1: export GEMINI_API_KEY=AIzaSyAsOk2g98gB6-o-8RsVJM7_V53s_aK0qgQ && gemini -m gemini-2.5-pro -p "[research topic 1]"
Task 2: export GEMINI_API_KEY=$GEMINI_API_KEY_1 && gemini -m gemini-2.5-pro -p "[research topic 2]"  
Task 3: export GEMINI_API_KEY=$GEMINI_API_KEY_2 && gemini -m gemini-2.5-pro -p "[research topic 3]"
# Continue spawning as many subagents as needed
```

**Example Orchestration (8-Key System Validated):**
```bash
# Large-Scale Parallel Research - 8 simultaneous subagents tested successfully
Subagent 1: export GEMINI_API_KEY=AIzaSyAsOk2g98gB6-o-8RsVJM7_V53s_aK0qgQ     # Web Dev
Subagent 2: export GEMINI_API_KEY=AIzaSyBLgzs1P6vyjJdERF5VkIez2uSbKVOZqko   # Database  
Subagent 3: export GEMINI_API_KEY=AIzaSyDSt_OezA-upm4N-hEQh6DxMsMfEVTlLFk   # Cloud
Subagent 4: export GEMINI_API_KEY=AIzaSyAummYMpvdWOcCPwV6CnB_mVrU938nUZbw   # DevOps
Subagent 5: export GEMINI_API_KEY=AIzaSyA5RLt-FYRkUjqQBb373ae7ZNs13HLBDjQ   # Security
Subagent 6: export GEMINI_API_KEY=AIzaSyBcwL7QxaCwGEPuR5syeBblSaSofJiu4N8   # AI/ML
Subagent 7: export GEMINI_API_KEY=AIzaSyCgRzIwfTDO9QpfFcvIka0qJ-fEYN2u5zA   # Mobile
Subagent 8: export GEMINI_API_KEY=AIzaSyAW45QG5rBFxLJavwKmexPgEnyc5AfVejU   # Architecture

# Test Results: ALL 8 KEYS OPERATIONAL ✅
# Capacity: 2M+ tokens/minute (8 keys × 250k each)
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
# Error indicates quota exceeded
# Solution: Rotate to next API key
export GEMINI_API_KEY=$GEMINI_API_KEY_1
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
# If Pro model unavailable, fallback to Flash
gemini -m gemini-2.5-flash -p "same prompt"
```

## Best Practices

### 1. Orchestration Strategy (Primary Approach)
- **Default to Orchestration**: Use subagent orchestration for any complex task
- **Unlimited Subagents**: Spawn as many subagents as needed - no artificial limits
- **API Key Distribution**: Assign different keys to each subagent to avoid rate limits
- **Specialized Roles**: Give each subagent a specific domain of expertise
- **Parallel Design**: Structure tasks to run simultaneously for maximum efficiency
- **Synthesis Phase**: Combine all subagent results into comprehensive conclusions

### 2. API Key Management for Orchestration
- **Load Distribution**: Cycle through available API keys systematically
- **Rate Limit Avoidance**: Never use the same key for parallel subagents
- **Scaling Strategy**: Add more API keys as subagent operations grow
- **Fault Tolerance**: If one key fails, other subagents continue working
- **Key Assignment**: Use clear patterns for which subagent gets which key

### 3. Subagent Task Design
- **Clear Specialization**: Each subagent should have a distinct research domain
- **Independent Tasks**: Design tasks that don't depend on other subagent results
- **Optimal Granularity**: Balance task size for maximum parallel benefit
- **Comprehensive Coverage**: Ensure all aspects of complex problems are covered
- **Quality Control**: Include validation subagents for complex analyses

### 4. Prompt Engineering
- Be specific about what you need
- Include context about the project
- Reference relevant files with @filename
- Ask for actionable recommendations

### 5. Token Management
- Use Flash model for simple tasks
- Reserve Pro model for complex analysis
- Monitor usage to avoid hitting limits
- Rotate keys proactively

### 6. Workflow Integration
- Use orchestrated Gemini for analysis, Claude Code for implementation
- Delegate background tasks to multiple parallel subagents
- Combine research with development efficiently
- Document findings for future reference

### 7. File Management
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
# Multi-step planning
gemini -m gemini-2.5-pro -p "Plan implementation: [task]"

# Code analysis
gemini -m gemini-2.5-pro -p "@file.tsx Review for [criteria]"

# Research
gemini -m gemini-2.5-pro -p "Research [topic] best practices 2024-2025"

# Parallel processing
gemini -m gemini-2.5-flash -p "@files Analyze while I implement"

# Full analysis
gemini -m gemini-2.5-pro -a -p "Analyze codebase for [issue]"

# Key rotation on rate limit
export GEMINI_API_KEY=$GEMINI_API_KEY_1
```

---

**Note:** This is a living document. Update use cases and examples as new patterns emerge during development.
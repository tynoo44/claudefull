# Setter AI - Professional Appointment Setting Platform

## Project Overview

Personal MVP platform for professional appointment setting with AI-powered conversation management using Quantum Creators B2B methodology. 

**CURRENT PRIORITY:** Fix critical issues and optimize for personal use (functionality over security).

**AUDIT STATUS (2025-07-07):**
- ✅ Comprehensive 3-phase audit completed
- 📋 Detailed PRD created with prioritized improvements
- 🚨 3 critical fixes identified (30 min work)
- 🔴 Major performance bottlenecks found
- 🟡 Architecture improvements needed

**Core Features:**
- AI appointment setting (Gemini 2.5 Pro)
- Lead CRM with 5-phase sales tracking
- Real-time script validation
- Multi-platform messaging (Instagram, WhatsApp, Facebook)
- Dynamic script templates

## Technical Stack

- **Frontend**: React 19.1.0 + TypeScript + Vite
- **AI**: Google Gemini 2.5 Pro API
- **Database**: Supabase (PostgreSQL + real-time)
- **Auth**: Supabase Auth (User ID: `4435e069-4294-4e44-8fd3-25840e5a3aa0`)
- **Styling**: Tailwind CSS 3.4.17
- **Dev Tools**: ESLint + Prettier + Husky
- **Testing**: Vitest + React Testing Library (TO BE ADDED)

## Key Files & Structure

```
src/
├── lib/
│   ├── gemini.ts              # AI response generation (NEEDS: leadId fix)
│   ├── prompt-manager.ts      # Hierarchical prompts (NEEDS: refactor)
│   ├── response-validator.ts  # Script validation (0.0-1.0 scoring)
│   └── supabase.ts           # Database client
├── components/
│   ├── Chat/
│   │   ├── AIChatSidebar.tsx  # Main AI assistant (NEEDS: props fix)
│   │   └── ChatInterface.tsx  # Chat UI (NEEDS: virtualization)
│   └── Leads/                 # Lead management
├── contexts/
│   └── AppContext.tsx         # Monolithic context (NEEDS: splitting)
├── hooks/                     # Custom hooks (NEEDS: pagination)
├── pages/
│   └── ChatsPage.tsx          # Main chat page (NEEDS: props fix)
└── types/index.ts            # TypeScript interfaces
```

**Config Files:**
- `.taskmaster/config.json` - AI models configuration
- `.taskmaster/docs/prd.txt` - Product requirements
- `.taskmaster/tasks/tasks.json` - Development tasks (18/27 completed)
- `AI_GUIDE/COMPREHENSIVE_PRD.md` - Complete improvement roadmap

## Database Schema (11 tables total)

```sql
-- AI System
prompts (id, prompt_type, role_definition, content, active)
script_templates (id, phase, lead_type, content, variables)
few_shot_examples (id, phase, example_input, example_output)
objection_handlers (id, objection_type, response_template, phase)
prompt_analytics (id, prompt_id, response_quality, execution_time)

-- Business Logic  
leads (id, instagram_id, username, status, procedence)
conversations (id, lead_id, current_phase, qualification_score, history)
messages (id, conversation_id, content, sender, timestamp)
message_templates (id, name, content, category, conversion_rate)
conversation_memory (id, lead_id, conversation_id, current_phase, qualification_score) # CRITICAL: Only 1 record!

-- Users
users (id, email, name, created_at)
```

**⚠️ KNOWN ISSUE**: conversation_memory has only 1 record despite 194 conversations (see Priority 0 fixes)

## Development Commands

```bash
# Core
npm run dev                    # Start dev server
npm run build                 # Production build
npm run lint                  # ESLint check
npm run format               # Prettier format

# TaskMaster
task-master next             # Get next task
task-master show <id>        # Task details
task-master set-status --id=<id> --status=done
```

## MCP Tools & Integrations

### Available MCP Servers
- **mcp__supabase__**: Database operations, SQL execution, schema management
- **mcp__taskmaster-ai__**: Task management, PRD parsing, progress tracking
- **mcp__puppeteer__**: Browser automation for testing
- **mcp__ddg-search__**: Web search and content fetching
- **mcp__memory__**: Knowledge graph for context retention

### Key MCP Commands
```bash
# Supabase
mcp__supabase__list_projects      # Get project list
mcp__supabase__execute_sql         # Run SQL queries
mcp__supabase__get_advisors        # Security/performance checks

# TaskMaster
mcp__taskmaster-ai__get_tasks      # List all tasks
mcp__taskmaster-ai__expand_task    # Create subtasks
mcp__taskmaster-ai__set_task_status # Update progress
```

## Development Protocol (UPDATED with Audit Findings)

### 1. Language Requirements
- All technical work in English (logs, plans, docs, commits)
- Spanish only for user-facing content

### 2. Task Planning
- **CHECK FIRST**: Review `AI_GUIDE/COMPREHENSIVE_PRD.md` for priorities
- Create structured plan BEFORE any work
- Break into <10 minute subtasks
- Each subtask independently verifiable
- **NEW**: Verify task aligns with current priorities (0-7)

### 3. Task Logging
- **MANDATORY**: Create `.taskmaster/logs/taskid_log.md` for each task
- Update after EVERY action
- Include: action, reasoning, process, tools, outcomes
- **NEW**: Reference specific audit findings when applicable

### 4. Error Handling
- STOP on any error
- Analyze: what, why, how to fix, prevention
- Get user confirmation before fixes
- **NEW**: Check if error relates to known issues from audits

### 5. Change Management
When plans change: PAUSE → ANALYZE → PLAN → RECORD → CONFIRM → EXECUTE
**NEW**: Consult audit findings before proposing changes

### 6. Context Management
- Check length every 3-5 tasks
- Alert thresholds: 50 (yellow), 80 (red), 100 (critical)

### 7. Testing Protocol (NEW)
- **IMMEDIATE**: Set up Vitest for any new code
- Test critical paths first (conversation tracking, AI responses)
- Aim for 70%+ coverage on new code

## Communication Templates

**Progress Report:**
```
COMPLETED: [Task] - SUCCESS/FAILED
DURATION: [Time]
OUTCOME: [Result]
NEXT: [Next task]
```

**Error Report:**
```
🚨 ERROR:
WHAT: [Description]
WHERE: [Location]
WHY: [Root cause]
SOLUTION: [Steps to fix]
```

**Task Plan:**
```
MAIN TASK: [Objective]
├── SUBTASK 1: [Action] - [Time est]
├── SUBTASK 2: [Action] - [Time est]
└── VERIFICATION: [Success criteria]
```

## Task Log Format

`.taskmaster/logs/[taskid]_log.md`:
```markdown
# Task [ID]: [Title]

## Overview
- Start: [Timestamp]
- Status: [In Progress/Completed]

## Work Log
### [Time] - Subtask X.Y
**Action**: [What]
**Reasoning**: [Why]
**Process**: [How]
**Outcome**: [Result]

## Summary
- Total Time: [Duration]
- Key Outcomes: [Results]
```

## Current Status (Updated 2025-07-07)

### 🚨 CRITICAL FIXES NEEDED (Priority 0 - 30 minutes)
1. **ChatsPage.tsx**: Add `conversationId` and `leadId` props to AIChatSidebar
2. **AIChatSidebar.tsx**: Pass `conversationId` and `leadId` to generateAIResponse
3. **gemini.ts**: Replace hardcoded empty `leadId` with actual parameter

### 🔴 Performance Bottlenecks (Priority 1)
- **ChatInterface**: Implement virtual scrolling (TanStack Virtual)
- **useLeads/useTemplates**: Add pagination (20-50 items)
- **Database**: Add indexes and foreign key constraints

### 🟡 Architecture Improvements (Priority 2)
- Split monolithic AppContext into domain contexts
- Refactor AI prompt engine with phase-based logic
- Implement React Router for proper navigation

### 📊 Task Progress
- **Completed**: 18/27 main tasks
- **Critical Gap**: No testing framework
- **Deferred**: Task 3 (RLS policies) - acceptable for local use

## Environment Variables

```bash
VITE_GEMINI_API_KEY=AIzaSyCKeLG_pcE2nHNgyxddFgwCvGwzC1vS17w
VITE_SUPABASE_URL=https://awyslztbkykhjhhykacf.supabase.co
VITE_SUPABASE_ANON_KEY=[your_key]
VITE_USER_ID=4435e069-4294-4e44-8fd3-25840e5a3aa0
```

## Essential Rules Summary

1. **Always use English** for technical work
2. **Plan before acting** - no improvisation
3. **Log everything** in task files
4. **Stop on errors** - analyze before fixing
5. **Get confirmation** for changes
6. **Monitor context** length regularly
7. **Use MCP tools** for database, tasks, and testing
8. **Follow templates** for communication
9. **Check audit findings** in `AI_GUIDE/` before making changes
10. **Prioritize functionality** over security (local use)

**FAILURE TO FOLLOW = STOP & REPLAN**

## Audit-Based Development Guidelines (NEW)

### From Global Audit (AI_GUIDE/1-GLOBAL-AUDIT/)
- **Critical Performance**: Chat virtualization, database pagination MUST be implemented
- **Architecture Debt**: Tasks 6-12 pending, prioritize before new features
- **Code Organization**: Follow `src/lib/`, `src/hooks/`, `src/contexts/` structure

### From Workflow Audit (AI_GUIDE/2-WORKFLOW-AUDIT/)
- **Integration Gaps**: 3 simple prop-passing fixes restore conversation tracking
- **Testing Required**: Verify conversation_memory population after fixes
- **Success Metrics**: 194 conversations should have tracking data

### From Tasks Audit (AI_GUIDE/3-tasks_audit.md)
- **Testing Gap**: Add Vitest + React Testing Library immediately
- **Security Acceptable**: RLS deferred for local use is OK
- **Complexity Warning**: Don't over-engineer, stick to PRD priorities

## Database Operational Guidelines

- **Database Table Management**:
  - Avoid modifying the structure or data of the supabase leads, messages, conversations, and message_templates tables unless strictly necessary, and under authorization. If you need data from these tables, create links to them in new tables.
- **Performance First**: Add indexes for frequently queried columns
- **Schema Integrity**: Use foreign key constraints for data consistency
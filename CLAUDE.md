# Setter AI - Professional Appointment Setting Platform

## Project Overview

Personal MVP platform for professional appointment setting with AI-powered conversation management using Quantum Creators B2B methodology.

**CURRENT PRIORITY:** Fix critical issues and optimize for personal use (functionality over security).

**AUDIT STATUS (2025-07-20):**

- ✅ **COMPREHENSIVE AUDIT COMPLETED** - 60+ files examined, reality-based PRD created
- 🏆 **CODEBASE QUALITY**: 8.5/10 - Enterprise-grade with advanced AI integration
- 🚨 **CRITICAL FIX NEEDED**: Chat virtualization missing in MessageList.tsx
- 🛠️ **CODE QUALITY**: 21 ESLint/TS errors blocking development
- ✅ **MAJOR DISCOVERY**: Router, contexts, testing, DB optimization already complete
- 📋 **FRESH TASKS**: 15 new tasks generated from updated PRD, replacing outdated tracking

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
- **Testing**: Vitest + React Testing Library ✅

## Key Files & Structure (UPDATED)

```
src/
├── lib/
│   ├── gemini.ts              # AI response generation ✅
│   ├── conversation-analyzer.ts # AI conversation analysis ✅
│   ├── prompt-manager.ts      # Basic prompt handling (basic implementation)
│   └── supabase.ts           # Database client ✅
├── components/Chat/
│   ├── AIChatSidebar.tsx      # Main AI assistant ✅
│   ├── MessageList.tsx        # Chat UI (⚠️ MISSING virtualization)
│   └── ResizableLayout.tsx    # Layout management ✅
├── contexts/
│   ├── AuthContext.tsx        # ✅ Authentication (59 lines)
│   └── ThemeContext.tsx       # ✅ Theme management (43 lines)
├── hooks/
│   ├── useMessagesPagination.ts # ✅ TanStack Query pagination
│   ├── useLeadsPagination.ts    # ✅ 20 items/page + prefetch
│   └── useLeadsVirtualization.ts # ✅ Leads virtualization
├── pages/ # ✅ React Router implemented
└── test/ # ✅ Vitest + RTL configured + actual tests
```

**Config Files:**

- `.taskmaster/config.json` - AI models configuration
- `.taskmaster/docs/prd.txt` - Product requirements
- `.taskmaster/tasks/tasks.json` - Fresh tasks (15 tasks based on comprehensive audit)
- `AI_GUIDE/COMPREHENSIVE_PRD.md` - Complete improvement roadmap
- `AI_GUIDE/4-2025-07-20-COMPLETE-AUDIT.md` - Latest comprehensive audit

## Database Schema (8 tables total - UPDATED 2025-07-20)

```sql
-- AI System
prompts (id, prompt_type, role_definition, content, active, metadata)
script_templates (id, phase, lead_type, content, variables, priority)
few_shot_examples (id, phase, scenario, lead_message, setter_response)

-- Business Logic
leads (id, instagram_id, username, status, procedence, user_id) # 287 records
conversations (id, lead_id, current_phase, qualification_score, conversation_state, phase_history) # 287 records - ENHANCED
messages (id, conversation_id, sender_type, text, platform_message_id) # 1,670 records
message_templates (id, name, content, category, tone, variables) # 3 records

-- Users
users (id, email, full_name, avatar_url, created_at) # 0 records
```

**✅ MAJOR UPDATE**: `conversation_memory` merged into `conversations` (2025-07-20)
**✅ REMOVED**: `objection_handlers`, `prompt_analytics` (unused tables)

## Development Commands

```bash
# Core
npm run dev                    # Start dev server (MUST run on port 5173!)
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

- **mcp**supabase\*\*\*\*: Database operations, SQL execution, schema management
- **mcp**taskmaster-ai\*\*\*\*: Task management, PRD parsing, progress tracking
- **mcp**puppeteer\*\*\*\*: Browser automation for testing
- **mcp**ddg-search\*\*\*\*: Web search and content fetching
- **mcp**memory\*\*\*\*: Knowledge graph for context retention

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

## Current Status (Updated 2025-07-20)

### ✅ COMPLETED CRITICAL FIXES (Priority 0 - DONE)

**DEVELOPMENT UNBLOCKED:**

1. ✅ **18 ESLint Errors** → 0 (100% eliminated - lexical declarations, undefined variables, unused vars)
2. ✅ **3 TypeScript Errors** → 0 (100% eliminated - interface compatibility fixed)
3. ✅ **54 'any' Types** → 0 (100% eliminated - proper TypeScript interfaces implemented)
4. ✅ **ALL Warnings** → 0 (100% eliminated - non-null assertions fixed)

**REMAINING HIGH PRIORITY:**

1. **Chat Virtualization Missing** - MessageList.tsx uses basic scrolling despite claims

### ✅ VERIFIED IMPLEMENTATIONS

- **Router & Navigation**: ✅ React Router fully implemented in App.tsx
- **Context Architecture**: ✅ Already split (AuthContext + ThemeContext)
- **Testing Framework**: ✅ Vitest + RTL configured with actual tests
- **Database Pagination**: ✅ TanStack Query with 20 items/page
- **Conversation Tracking**: ✅ Props flow correctly implemented
- **Database Schema**: ✅ Optimized with foreign keys and indexes

### 📋 NEW TASK SYSTEM

**Fresh TaskMaster Setup (15 tasks):**

- **Priority High**: Code quality fixes, chat virtualization, testing expansion
- **Priority Medium**: Performance optimization, AI enhancements
- **Priority Low**: Advanced features, analytics, multi-provider support
- **Accurate Tracking**: Based on comprehensive source code audit

**Key References:**

- Updated PRD: `.taskmaster/docs/prd_updated_2025-07-20.md`
- Detailed audit: `AI_GUIDE/4-2025-07-20-COMPLETE-AUDIT.md`
- Fresh tasks: Check `task-master get_tasks` for current status

## Environment Variables

```bash
VITE_GEMINI_API_KEY=AIzaSyCKeLG_pcE2nHNgyxddFgwCvGwzC1vS17w
VITE_SUPABASE_URL=https://awyslztbkykhjhhykacf.supabase.co
VITE_SUPABASE_ANON_KEY=[your_key]
VITE_USER_ID=4435e069-4294-4e44-8fd3-25840e5a3aa0
```

## Essential Rules Summary (UPDATED 2025-07-20)

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
11. **NEW: Fix all errors before new features** - Zero tolerance for ESLint/TS errors
12. **NEW: Always plan multiple options** - Consider alternatives before implementing
13. **NEW: Update CLAUDE.md every 2 weeks** - Keep documentation current
14. **NEW: Request approval for error fixes** - Collaborate on solutions
15. **NEW: Run lint + type-check before commits** - Mandatory quality gates

**FAILURE TO FOLLOW = STOP & REPLAN**

## Audit-Based Development Guidelines (UPDATED 2025-07-20)

### From Source Code Verification (2025-07-20)

- **CRITICAL**: Code quality issues block development (18 ESLint + 3 TS errors)
- **MAJOR GAP**: Chat virtualization claimed complete but MessageList.tsx uses basic scrolling
- **COMPLETED**: Router, contexts, testing framework, database pagination all working
- **TASK TRACKING**: TaskMaster significantly out of sync with reality

### Updated Priority Matrix

```
PHASE 0 (IMMEDIATE): Fix 21 code errors + implement missing chat virtualization
PHASE 1 (1 WEEK): Audit & correct TaskMaster tracking + complete AI engine
PHASE 2 (2-3 WEEKS): Advanced features + performance optimization
PHASE 3 (4+ WEEKS): New features based on updated roadmap
```

**Key References:**

- Full verification details: `AI_GUIDE/4-2025-07-20-COMPLETE-AUDIT.md`
- Current task status: Check TaskMaster vs actual source code
- Development priorities: Focus on missing virtualization + error resolution

## Database Operational Guidelines

- **Database Table Management**:
  - Avoid modifying the structure or data of the supabase leads, messages, conversations, and message_templates tables unless strictly necessary, and under authorization. If you need data from these tables, create links to them in new tables.
- **Performance First**: Add indexes for frequently queried columns
- **Schema Integrity**: Use foreign key constraints for data consistency

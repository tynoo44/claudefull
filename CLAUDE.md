# Setter AI - Professional Appointment Setting Platform

## Project Overview

SaaS platform for professional appointment setting with AI-powered conversation management using Quantum Creators B2B methodology.

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

## Key Files & Structure

```
src/
├── lib/
│   ├── gemini.ts              # AI response generation
│   ├── prompt-manager.ts      # Hierarchical prompts
│   ├── response-validator.ts  # Script validation (0.0-1.0 scoring)
│   └── supabase.ts           # Database client
├── components/
│   ├── Chat/AIChatSidebar.tsx # Main AI assistant
│   └── Leads/                 # Lead management
└── types/index.ts            # TypeScript interfaces
```

**Config Files:**
- `.taskmaster/config.json` - AI models configuration
- `.taskmaster/docs/prd.txt` - Product requirements
- `.taskmaster/tasks/tasks.json` - Development tasks (17/27 completed)

## Database Schema

```sql
-- AI System
prompts (id, prompt_type, role_definition, content, active)
script_templates (id, phase, lead_type, content, variables)
few_shot_examples (id, phase, example_input, example_output)
conversations (id, lead_id, current_phase, qualification_score, history)

-- Business Logic  
leads (id, instagram_id, username, status, procedence)
message_templates (id, name, content, category, conversion_rate)
```

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

## Development Protocol

### 1. Language Requirements
- All technical work in English (logs, plans, docs, commits)
- Spanish only for user-facing content

### 2. Task Planning
- Create structured plan BEFORE any work
- Break into <10 minute subtasks
- Each subtask independently verifiable

### 3. Task Logging
- **MANDATORY**: Create `.taskmaster/logs/taskid_log.md` for each task
- Update after EVERY action
- Include: action, reasoning, process, tools, outcomes

### 4. Error Handling
- STOP on any error
- Analyze: what, why, how to fix, prevention
- Get user confirmation before fixes

### 5. Change Management
When plans change: PAUSE → ANALYZE → PLAN → RECORD → CONFIRM → EXECUTE

### 6. Context Management
- Check length every 3-5 tasks
- Alert thresholds: 50 (yellow), 80 (red), 100 (critical)

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

## Current Status

- **Progress**: Task 18 (Conversation State Management) in progress
- **Next**: Subtask 18.3 - Create ConversationStateManager service
- **Completed**: 17/27 main tasks

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

**FAILURE TO FOLLOW = STOP & REPLAN**

## Database Operational Guidelines

- **Database Table Management**:
  - Avoid modifying the structure or data of the supabase leads, messages, conversations, and message_templates tables unless strictly necessary, and under authorization. If you need data from these tables, create links to them in new tables.
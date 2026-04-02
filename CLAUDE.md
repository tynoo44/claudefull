# Setter AI - Professional Appointment Setting Platform

## Project Overview

Personal MVP platform for professional appointment setting with AI-powered conversation management using Quantum Creators B2B methodology.

**Production URL:** https://aideal.vortekai.es
**Supabase Project:** QuantumDB (`awyslztbkykhjhhykacf`) - ACTIVE_HEALTHY

## Technical Stack

- **Frontend**: React 19.1.0 + TypeScript + Vite
- **AI**: Google Gemini 2.5 Pro API
- **Database**: Supabase (PostgreSQL + real-time + RLS)
- **Auth**: Supabase Auth with Google OAuth2 + Calendar scopes
- **Calendar**: Google Calendar API via Supabase Edge Functions
- **Styling**: Tailwind CSS 3.4.17
- **Deployment**: Docker (multi-stage) + nginx + Easypanel + Cloudflare
- **Dev Tools**: ESLint + Prettier + Husky

## Key Files & Structure

```
src/
├── lib/
│   ├── gemini.ts                # AI response generation (intent + personalization)
│   ├── ai-service.ts            # AI service client (Edge Functions + n8n)
│   ├── conversation-analyzer.ts # AI conversation analysis (realistic scoring)
│   ├── prompt-manager.ts        # Database-driven prompt hierarchy
│   ├── response-validator.ts    # Permissive natural language validation
│   ├── intent-detector.ts       # Advanced intent & emotion detection
│   ├── lead-personalizer.ts     # Dynamic lead profiling & adaptation
│   ├── n8n-integration.ts       # N8N webhook integration service
│   ├── google-calendar.ts       # Google Calendar integration service
│   ├── calendar-cache.ts        # Calendar data caching
│   ├── auth.ts                  # Authentication (Google OAuth2 + email/password)
│   ├── supabase.ts              # Database client
│   └── supabase-functions.ts    # Database helper functions
├── components/Chat/
│   ├── EnhancedAIChatSidebar.tsx # Main AI assistant (used in ChatsPage)
│   ├── ChatInterface.tsx         # Chat interface with n8n integration
│   ├── ChatSidebar.tsx           # Conversation list sidebar
│   ├── MessageList.tsx           # Chat UI (VIRTUALIZED with TanStack Virtual)
│   ├── MessageInputOptimized.tsx # Optimized message input (memoized)
│   └── ResizableLayout.tsx       # Layout management
├── components/Calendar/Premium/  # Complete calendar system
│   ├── Core/                     # Provider, reducer, hooks
│   ├── Views/                    # Month, Week, Day, Agenda view components
│   ├── Layout/                   # Navigation, Sidebar, Toolbar, StatusBar
│   ├── EventModal/               # BasicInfo, Attendees, Reminders tabs
│   ├── EventCreateModal.tsx      # Event creation/editing
│   └── EventDetailModal.tsx      # Event details with actions
├── contexts/
│   ├── AuthContext.tsx            # Auth with isLoading state for session persistence
│   ├── ThemeContext.tsx           # Dark/light theme management
│   └── CalendarCacheContext.tsx   # Calendar cache provider
├── hooks/
│   ├── useMessagesPagination.ts  # TanStack Query pagination
│   ├── useLeadsPagination.ts     # 20 items/page + prefetch
│   ├── useLeadsVirtualization.ts # Leads virtualization
│   ├── useCalendar.ts            # Calendar state management
│   └── useConversationAnalysis.ts # Analysis hook
├── services/
│   ├── conversationAnalysisService.ts # Background analysis service
│   └── analysis/                      # Modular analysis (sentiment, enrichment, queue)
├── pages/
│   ├── AuthPage.tsx              # Login (Google OAuth + email/password)
│   ├── AuthCallbackPage.tsx      # OAuth callback handler
│   ├── DashboardPage.tsx         # Main dashboard
│   ├── ChatsPage.tsx             # Chat interface
│   ├── LeadsPage.tsx             # Lead management
│   ├── TemplatesPage.tsx         # Message templates
│   ├── CalendarPage.tsx          # Basic calendar
│   └── PremiumCalendarAdvanced.tsx # Enterprise calendar (all views)
├── components/Layout/
│   ├── GlobalNavbar.tsx          # Top navigation
│   └── ProtectedRoute.tsx        # Auth guard with loading state
└── types/index.ts                # All TypeScript interfaces
```

**Deployment Files:**

- `Dockerfile` - Multi-stage build (node + nginx)
- `nginx.conf` - SPA routing + gzip + caching
- `.dockerignore` - Excludes node_modules, docs, etc.

**Config Files:**

- `.taskmaster/` - TaskMaster config, tasks, docs
- `AI_GUIDE/` - Audit docs and PRD

## Database Schema (11 tables - Supabase)

```sql
-- Core Business
leads (id, instagram_id, username, status, procedence, user_id)
conversations (id, lead_id, current_phase, qualification_score, conversation_state, phase_history, phase_info, lead_profile)
messages (id, conversation_id, sender_type, text, platform_message_id)
message_templates (id, name, content, category, tone, variables)
users (id, email, full_name, avatar_url)

-- AI System
prompts (id, prompt_type, role_definition, content, active, metadata)
script_templates (id, phase, lead_type, content, variables, priority)
few_shot_examples (id, phase, scenario, lead_message, setter_response)

-- Analysis & AI Conversations
conversation_analysis (id, conversation_id, lead_id, analysis_data, sentiment_scores, urgency_score)
ai_conversations (id, conversation_id, lead_id, messages, total_messages)
lead_insights (id, lead_id, business_info, pain_points, goals, personality_profile)
```

**NOTE:** All tables currently have 0 records. RLS enabled on all tables.
**DO NOT** modify leads, messages, conversations, message_templates structure without authorization.

## Development Commands

```bash
npm run dev          # Dev server (port 5173, HMR via wss)
npm run build        # Production build (tsc + vite build)
npm run lint         # ESLint check
npm run lint:fix     # ESLint autofix
npm run format       # Prettier format
npm run type-check   # TypeScript check (tsc --noEmit)
```

## Code Quality Status (Updated 2026-04-01)

- **TypeScript**: 0 errors
- **ESLint**: 0 errors, 105 warnings (all `no-explicit-any`)
- **Build**: Passes (851KB JS, 69KB CSS)
- **Tests**: Framework configured (Vitest + RTL + MSW), no test files currently

## Auth Flow

1. User visits `https://aideal.vortekai.es` -> redirects to `/auth`
2. Google OAuth via `supabase.auth.signInWithOAuth()` with Calendar scopes
3. Redirect: Google -> Supabase callback -> `aideal.vortekai.es/auth/callback`
4. `AuthCallbackPage` processes token -> navigates to `/dashboard`
5. Session persists in localStorage; `AuthContext.isLoading` prevents flash redirect

**Supabase Auth Config Required:**

- Site URL: `https://aideal.vortekai.es`
- Redirect URLs: `https://aideal.vortekai.es/auth/callback`, `https://aideal.vortekai.es/**`

**Google Cloud Console Required:**

- Authorized JS origins: `https://aideal.vortekai.es`
- Authorized redirect URIs: `https://awyslztbkykhjhhykacf.supabase.co/auth/v1/callback`

## Environment Variables

```bash
# All secrets stored in .env (NEVER commit to git)
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_TEXT_MODEL=gemini-2.5-flash
VITE_N8N_WEBHOOK_URL=  # Optional
```

## Deployment (Easypanel + Cloudflare)

- Push to GitHub -> Easypanel auto-builds via Dockerfile
- Dockerfile: node:20-alpine build -> nginx:alpine serve
- VITE\_\* vars passed as Docker build args in Easypanel
- Cloudflare DNS CNAME to Easypanel domain, SSL Full (strict)
- nginx handles SPA routing (try_files -> index.html)

## Supabase Advisors Summary

**Security:** RLS policies use permissive `USING(true)` on core tables (acceptable for personal use). Postgres version has pending security patches.
**Performance:** Duplicate index on messages table. Many unused indexes. RLS policies should use `(select auth.uid())` instead of `auth.uid()`.

## Development Rules

1. All technical work in English; Spanish only for user-facing content
2. Plan before acting - no improvisation
3. Stop on errors - analyze before fixing, get user confirmation
4. Run lint + type-check before commits
5. Prioritize functionality over security (personal use)
6. Do NOT modify leads/messages/conversations/message_templates table structure without authorization
7. Check `AI_GUIDE/` docs before major changes

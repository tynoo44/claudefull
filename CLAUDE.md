# AIdeal - AI-Powered Sales & Appointment Setting Platform

## Project Overview

Professional SaaS platform for AI-powered appointment setting and lead management. Combines CRM, real-time messaging, AI conversation analysis, and Google Calendar integration.

**Production URL:** https://aideal.vortekai.es
**Supabase Project:** QuantumDB (`awyslztbkykhjhhykacf`) - ACTIVE_HEALTHY

## Technical Stack

- **Frontend**: React 19.1.0 + TypeScript + Vite 5
- **AI**: Google Gemini 2.5 Pro/Flash API
- **Database**: Supabase (PostgreSQL + real-time + RLS)
- **Auth**: Supabase Auth with Google OAuth2 + Calendar scopes
- **Calendar**: Google Calendar API via Supabase Edge Functions
- **Styling**: Tailwind CSS 3.4.17 + Inter font
- **PWA**: vite-plugin-pwa (installable, offline-capable)
- **Deployment**: Docker (multi-stage node+nginx) + Easypanel + Cloudflare
- **Dev Tools**: ESLint + Prettier + Husky + lint-staged

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
│   ├── n8n-integration.ts       # N8N webhook integration (message sending)
│   ├── google-calendar.ts       # Google Calendar integration service
│   ├── calendar-cache.ts        # Calendar data caching
│   ├── auth.ts                  # Authentication (Google OAuth2 + email/password)
│   ├── supabase.ts              # Database client
│   └── supabase-functions.ts    # Database helper functions
├── components/
│   ├── Layout/
│   │   ├── GlobalNavbar.tsx     # Top navigation bar (desktop + mobile)
│   │   ├── MobileDrawer.tsx     # Slide-in mobile navigation drawer
│   │   ├── Modal.tsx            # Reusable modal (full-screen mobile, centered desktop)
│   │   └── ProtectedRoute.tsx   # Auth guard with loading state
│   ├── Chat/                    # Chat system components
│   ├── Leads/                   # Lead management components
│   ├── Templates/               # Template management components
│   ├── Dashboard/               # Dashboard stats, charts, activity feed
│   ├── Calendar/Premium/        # Full calendar system (Month/Week/Day/Agenda)
│   ├── Notifications/           # Real-time notification center + toasts
│   └── common/                  # Shared components (skeletons, tags)
├── contexts/
│   ├── AuthContext.tsx           # Auth with isLoading for session persistence
│   ├── ThemeContext.tsx          # Dark/light theme management
│   └── CalendarCacheContext.tsx  # Calendar cache provider
├── hooks/
│   ├── useMediaQuery.ts         # Responsive breakpoint hooks (useIsMobile, etc.)
│   ├── useMessagesPagination.ts # TanStack Query chat pagination
│   ├── useLeadsPagination.ts    # 20 items/page + prefetch
│   ├── useLeadsVirtualization.ts # Leads virtualization
│   └── useRealtimeNotifications.ts # Supabase real-time notifications
├── services/
│   ├── conversationAnalysisService.ts # Background analysis
│   └── analysis/                      # Modular analysis modules
├── pages/
│   ├── AuthPage.tsx             # Login (Google OAuth + email/password)
│   ├── AuthCallbackPage.tsx     # OAuth callback handler
│   ├── DashboardPage.tsx        # Main dashboard with stats & charts
│   ├── ChatsPage.tsx            # Chat interface (responsive single/split view)
│   ├── LeadsPage.tsx            # Lead CRM (Kanban + List views)
│   ├── TemplatesPage.tsx        # Message templates
│   ├── AnalyticsPage.tsx        # Analytics & reporting
│   ├── SettingsPage.tsx         # User settings & integrations
│   ├── CalendarPage.tsx         # Basic calendar
│   └── PremiumCalendarAdvanced.tsx # Enterprise calendar (all views)
├── styles/globals.css           # Global styles, PWA standalone, safe-area
└── types/index.ts               # All TypeScript interfaces
```

**Deployment Files:**

- `Dockerfile` - Multi-stage build (node:20-alpine -> nginx:alpine), .env from build args
- `nginx.conf` - SPA routing + gzip + security headers + PWA cache control
- `.dockerignore` - Excludes node_modules, .env, IDE configs

## Database Schema (11 tables - Supabase)

```sql
-- Core Business
leads (id, instagram_id, username, status, procedence, user_id)
conversations (id, lead_id, current_phase, qualification_score, conversation_state, phase_history)
messages (id, conversation_id, sender_type, text, platform_message_id)
message_templates (id, name, content, category, tone, variables)
users (id, email, full_name, avatar_url)

-- AI System
prompts (id, prompt_type, role_definition, content, active, metadata)
script_templates (id, phase, lead_type, content, variables, priority)
few_shot_examples (id, phase, scenario, lead_message, setter_response)

-- Analysis
conversation_analysis (id, conversation_id, lead_id, analysis_data, sentiment_scores)
ai_conversations (id, conversation_id, lead_id, messages, total_messages)
lead_insights (id, lead_id, business_info, pain_points, goals, personality_profile)
```

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

## Environment Variables

```bash
# All secrets stored in .env (NEVER commit to git)
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_TEXT_MODEL=gemini-2.5-flash
VITE_N8N_WEBHOOK_URL=your_n8n_webhook_url
# Optional: VITE_HMR_HOST for Easypanel dev mode
```

## Auth Flow

1. User visits `https://aideal.vortekai.es` -> redirects to `/auth`
2. Google OAuth via `supabase.auth.signInWithOAuth()` with Calendar scopes
3. Redirect: Google -> Supabase callback -> `/auth/callback`
4. `AuthCallbackPage` processes token -> navigates to `/dashboard`
5. Session persists in localStorage; `AuthContext.isLoading` prevents flash redirect

**Supabase Auth Config:**

- Site URL: `https://aideal.vortekai.es`
- Redirect URLs: `https://aideal.vortekai.es/auth/callback`, `https://aideal.vortekai.es/**`

**Google Cloud Console:**

- Authorized JS origins: `https://aideal.vortekai.es`
- Authorized redirect URIs: `https://awyslztbkykhjhhykacf.supabase.co/auth/v1/callback`

## Deployment (Easypanel + Cloudflare)

- Push to GitHub -> Easypanel auto-builds via Dockerfile
- VITE\_\* vars set as Environment Variables in Easypanel (Dockerfile writes .env from build args)
- Cloudflare DNS CNAME to Easypanel domain, SSL Full (strict)
- nginx serves SPA with try_files, gzip, security headers, PWA cache control

## Development Rules

1. All technical work in English; Spanish only for user-facing content
2. Plan before acting - no improvisation
3. Stop on errors - analyze before fixing, get user confirmation
4. Run lint + type-check before commits
5. Do NOT modify leads/messages/conversations/message_templates table structure without authorization
6. N8N integration is active - do not remove it

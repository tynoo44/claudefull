# Setter AI - Comprehensive Product Requirements Document (PRD)

**Based on Multi-Phase Audit Analysis**  
**Date:** 2025-07-07  
**Version:** 2.0  
**Priority:** Personal MVP - Focus on Functionality Over Security

---

## Executive Summary

This PRD consolidates all findings from three comprehensive audits:

1. **Global Architecture Audit** - Identified critical performance bottlenecks and architectural improvements
2. **Workflow Integration Audit** - Found 3 simple integration gaps preventing conversation tracking
3. **TaskMaster Progress Audit** - Revealed 18/27 tasks completed with critical gaps in testing and security

**Core Goal:** Transform Setter AI into a reliable, efficient personal tool for appointment setting with AI-powered conversation management.

**Key Principle:** Prioritize functionality, speed, and reliability over security features (running locally).

---

## Priority 0: Critical Integration Fixes (30 minutes)

_These fixes will immediately restore broken functionality_

### 🚨 Fix Conversation Tracking System

**Issue:** Task 18 infrastructure works perfectly but is disconnected from UI
**Impact:** No conversation history, no lead qualification scoring, AI assistant blind to context

#### Required Changes:

1. **Fix ChatsPage.tsx** (Line 150-163)

   ```typescript
   // Add missing props to AIChatSidebar
   <AIChatSidebar
     darkMode={darkMode}
     conversationContext={...}
     currentConversation={...}
     conversationId={selectedChat?.id}  // ADD THIS
     leadId={selectedChat?.lead_id || selectedChat?.leads?.id}  // ADD THIS
   />
   ```

2. **Fix AIChatSidebar.tsx** (Line 81-86)

   ```typescript
   // Pass conversationId and leadId to generateAIResponse
   const response = await generateAIResponse({
     messages: messages.concat(userMessage),
     model: selectedModel,
     conversationContext: fullContext,
     currentPhase,
     conversationId, // ADD THIS
     leadId, // ADD THIS
     enableTracking: true, // ADD THIS
   });
   ```

3. **Fix gemini.ts** (Line 216)
   ```typescript
   // Replace hardcoded empty leadId
   leadId: leadId || '',  // CHANGE FROM: leadId: ''
   ```

**Verification:** After these changes, conversation_memory table should populate automatically.

---

## Priority 1: Critical Performance & Stability (1-2 days)

_Without these, the app will crash or become unusable with real data_

### 🔴 1.1 Chat Message Virtualization

**File:** `src/components/Chat/ChatInterface.tsx`  
**Issue:** Rendering all messages at once = browser crash with long conversations  
**Solution:** Implement virtual scrolling using TanStack Virtual

**Implementation:**

```bash
npm install @tanstack/react-virtual
```

**Key Changes:**

- Only render visible messages in DOM
- Maintain scroll position
- Handle dynamic message heights
- Support smooth scrolling

### 🔴 1.2 Database-Level Pagination

**Files:** `src/hooks/useLeads.ts`, `src/hooks/useTemplates.ts`  
**Issue:** Loading ALL records on mount = slow startup, memory bloat  
**Solution:** Implement paginated data fetching

**Implementation:**

- Fetch 20-50 items initially
- Add "Load More" functionality
- Use Supabase range queries
- Implement cursor-based pagination

### 🔴 1.3 Strengthen Database Schema

**Location:** New Supabase migration  
**Issue:** Missing indexes, constraints, and basic security  
**Solution:** Create comprehensive migration

**Migration Content:**

```sql
-- Add foreign key constraints
ALTER TABLE conversations ADD CONSTRAINT fk_lead FOREIGN KEY (lead_id) REFERENCES leads(id);
ALTER TABLE messages ADD CONSTRAINT fk_conversation FOREIGN KEY (conversation_id) REFERENCES conversations(id);

-- Add performance indexes
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_conversations_lead_id ON conversations(lead_id);
CREATE INDEX idx_leads_status ON leads(status);

-- Basic RLS policies (since running locally, minimal security)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own leads" ON leads FOR ALL USING (true);
```

---

## Priority 2: Architectural Improvements (3-5 days)

_These prevent future refactoring and improve maintainability_

### 🟡 2.1 Split Monolithic AppContext

**File:** `src/contexts/AppContext.tsx`  
**Issue:** Single context causes app-wide re-renders  
**Solution:** Domain-specific contexts

**New Structure:**

```
contexts/
├── LeadsContext.tsx      # Lead management state
├── TemplatesContext.tsx  # Template management
├── ChatContext.tsx       # Active chat state
└── UIContext.tsx         # UI preferences (theme, etc)
```

### 🟡 2.2 Refactor AI Prompt Engine

**Files:** `src/lib/prompt-manager.ts`, `src/lib/response-validator.ts`  
**Issue:** Hardcoded prompts, no phase-based logic  
**Solution:** Implement sophisticated prompt pipeline

**Key Features:**

- Dynamic prompt construction based on conversation phase
- Few-shot example injection
- Context-aware prompt tailoring
- Response validation with scoring (0.0-1.0)
- Use strategies from `appointment_setting/PROMPT_ENGINEERING_ANALYSIS.md`

### 🟡 2.3 Implement Proper Routing

**Issue:** No routing library, implicit navigation  
**Solution:** Add React Router

```bash
npm install react-router-dom
```

**Benefits:**

- URL-based navigation
- Browser back/forward support
- Route guards for future auth
- Lazy loading routes

---

## Priority 3: Testing Infrastructure (2 days)

_Critical for preventing regressions_

### 🟢 3.1 Add Testing Framework

**Issue:** Zero test coverage  
**Solution:** Vitest + React Testing Library

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

**Initial Test Coverage:**

- Core AI functions (gemini.ts)
- Database operations (supabase functions)
- Critical UI components (Chat components)
- Integration tests for conversation tracking

### 🟢 3.2 E2E Testing Setup

**Solution:** Playwright for critical workflows

**Test Scenarios:**

- Lead creation → Conversation → AI assistance
- Message sending → Conversation tracking
- Template selection → Message customization

---

## Priority 4: Complete Pending Architecture Tasks (5-7 days)

### 📋 4.1 Task 6: DRY Implementation

- Identify and eliminate code duplication
- Create shared utilities and hooks
- Consolidate similar functions

### 📋 4.2 Task 7: Component Refactoring

- Break down monolithic components
- Create reusable UI primitives
- Implement proper separation of concerns

### 📋 4.3 Task 8: Context API Implementation

- Eliminate prop drilling
- Implement proper state management patterns
- Use React Context effectively

---

## Priority 5: Performance Optimizations (3-5 days)

### ⚡ 5.1 Tasks 9-12: Core Optimizations

- **Memoization:** React.memo, useMemo, useCallback
- **Query Optimization:** Database query improvements
- **Lazy Loading:** Code splitting, dynamic imports
- **CSS Optimization:** Tailwind purging, critical CSS

### ⚡ 5.2 Bundle Size Optimization

- Analyze bundle with webpack-bundle-analyzer
- Tree-shake unused code
- Optimize dependencies

---

## Priority 6: Enhanced Features (5-7 days)

### ✨ 6.1 Task 19: Dynamic Context Loading

- Token-optimized context injection
- Phase-aware context selection
- Conversation history summarization

### ✨ 6.2 Task 20: Few-Shot Examples

- Dynamic example selection
- Phase-specific examples
- Performance tracking

### ✨ 6.3 Task 21: Script Template Engine

- Lead-type specific templates
- Variable interpolation
- A/B testing preparation

---

## Priority 7: Advanced Integrations (Future)

### 🔮 7.1 Workflow Automation

- Integrate tracking in message flow
- Automatic phase progression
- Lead scoring automation

### 🔮 7.2 Analytics & Monitoring

- Implement analytics tracking
- Performance monitoring
- User behavior analysis

---

## Development Guidelines

### Code Organization

```
src/
├── lib/           # Core business logic
├── hooks/         # Custom React hooks
├── contexts/      # React contexts (split by domain)
├── components/    # UI components
│   ├── ui/       # Primitive components
│   ├── features/ # Feature-specific components
│   └── layouts/  # Layout components
├── pages/        # Route components
├── types/        # TypeScript definitions
└── utils/        # Shared utilities
```

### Testing Strategy

- Unit tests for all business logic
- Integration tests for API interactions
- Component tests for critical UI
- E2E tests for user workflows

### Performance Targets

- Initial load: < 3 seconds
- Chat message render: < 100ms
- AI response time: < 2 seconds
- Database queries: < 200ms

---

## Implementation Roadmap

### Week 1: Critical Fixes

- [ ] Day 1: Priority 0 integration fixes (30 min)
- [ ] Day 1-2: Chat virtualization
- [ ] Day 2-3: Database pagination
- [ ] Day 3-4: Database migration
- [ ] Day 4-5: Testing framework setup

### Week 2: Architecture

- [ ] Day 6-7: Split AppContext
- [ ] Day 8-9: AI prompt refactoring
- [ ] Day 10: React Router implementation

### Week 3: Pending Tasks

- [ ] Day 11-12: DRY implementation
- [ ] Day 13-14: Component refactoring
- [ ] Day 15: Context API completion

### Week 4: Optimization & Features

- [ ] Day 16-18: Performance optimizations
- [ ] Day 19-20: Dynamic context loading
- [ ] Day 21+: Advanced features

---

## Success Metrics

### Functionality

- ✅ Conversation tracking works in UI
- ✅ AI provides context-aware responses
- ✅ All 194 conversations have tracking data
- ✅ Lead qualification scoring active

### Performance

- ✅ 1000+ message conversations load smoothly
- ✅ Initial page load < 3 seconds
- ✅ No UI freezing or lag
- ✅ Memory usage stable

### Code Quality

- ✅ 70%+ test coverage
- ✅ No ESLint errors
- ✅ TypeScript strict mode
- ✅ Clean architecture

### Developer Experience

- ✅ Hot reload works
- ✅ Clear error messages
- ✅ Comprehensive logging
- ✅ Easy debugging

---

## Risk Mitigation

### Technical Risks

1. **Virtual scrolling complexity** → Use proven library (TanStack)
2. **State management refactor** → Incremental migration
3. **Test implementation time** → Start with critical paths

### Business Risks

1. **Feature creep** → Stick to PRD priorities
2. **Over-engineering** → YAGNI principle
3. **Perfectionism** → Ship iteratively

---

## Conclusion

This PRD represents a comprehensive improvement plan based on three detailed audits. The prioritization focuses on:

1. **Immediate fixes** that restore broken functionality (30 minutes)
2. **Critical improvements** preventing app crashes (1-2 days)
3. **Architectural changes** ensuring maintainability (3-5 days)
4. **Quality improvements** through testing (2 days)
5. **Feature completion** of existing plans (5-10 days)

**Total estimated timeline:** 3-4 weeks for complete implementation

By following this plan, Setter AI will transform from a prototype into a robust, efficient personal tool ready for intensive daily use.

---

_PRD Version 2.0 - Based on comprehensive audit analysis_  
_Created: 2025-07-07_

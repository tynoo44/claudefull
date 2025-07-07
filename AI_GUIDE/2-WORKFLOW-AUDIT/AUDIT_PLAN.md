# AUDIT PLAN - Setter AI Workflow Investigation

## Executive Summary

**Objective**: Investigate why conversation tracking system (Task 18) works via MCP but fails in actual UI usage.

**Duration**: ~210 minutes (3.5 hours)
**Phases**: 5 investigation phases with 20 structured subtasks
**Deliverable**: Complete WORKFLOW_APP.md with actionable issue resolution plan

## Problem Statement

✅ **Working**: Conversation tracking via MCP Supabase tools
❌ **Broken**: UI doesn't show conversation state, no database records during app usage
🔍 **Investigation**: Complete application workflow understanding required

## Investigation Strategy

### Systematic Approach
1. **Foundation** → **Integration** → **Components** → **Issues** → **Documentation**
2. Use MCP tools exclusively for database inspection
3. Trace complete data flow from user action to database storage
4. Document every finding with code references and test results
5. No code modifications during investigation phase

### Key Investigation Questions
- How does the UI trigger conversation tracking?
- When should conversation_memory records be created?
- What's the connection between AIChatSidebar and ConversationStateManager?
- Why do MCP tests work but real usage doesn't?
- Where are the missing integration points?

## Phase Breakdown

### PHASE 1: Foundation Analysis (45 min)
**Goal**: Understand project structure, configuration, and database state

#### Subtask 1.1: Project Structure Mapping (15 min)
- **Action**: Map complete file structure and purpose
- **Method**: File system analysis + dependency tracing
- **Output**: Annotated file tree with component relationships

#### Subtask 1.2: Configuration Analysis (15 min)
- **Action**: Review all environment variables and configs
- **Method**: Read .env, config files, and MCP setup
- **Output**: Complete configuration documentation

#### Subtask 1.3: Database Schema Analysis (15 min)
- **Action**: Query all tables, relationships, and current data
- **Method**: MCP Supabase tools for schema inspection
- **Output**: Database diagram with data samples

### PHASE 2: Integration Deep Dive (60 min)
**Goal**: Understand how app connects to Supabase and Gemini

#### Subtask 2.1: Supabase Client Investigation (20 min)
- **Action**: Analyze supabase.ts setup and all query locations
- **Method**: Code analysis + MCP connectivity tests
- **Output**: Supabase integration map with call sites

#### Subtask 2.2: Gemini API Analysis (20 min)
- **Action**: Review gemini.ts and AI response processing
- **Method**: Code tracing + API call pattern analysis
- **Output**: Gemini integration workflow documentation

#### Subtask 2.3: Data Flow Tracing (20 min)
- **Action**: Follow complete user interaction → database flow
- **Method**: Code tracing + workflow reconstruction
- **Output**: End-to-end data flow diagram

### PHASE 3: Component Analysis (45 min)
**Goal**: Understand UI components and their data integration

#### Subtask 3.1: Chat System Analysis (20 min)
- **Action**: Analyze AIChatSidebar and ConversationStateIndicator
- **Method**: Component code review + props tracing
- **Output**: Chat component interaction map

#### Subtask 3.2: Lead Management Investigation (15 min)
- **Action**: Review lead creation and conversation initialization
- **Method**: Component analysis + state management review
- **Output**: Lead-to-conversation workflow documentation

#### Subtask 3.3: State Management Review (10 min)
- **Action**: Analyze React state patterns and data binding
- **Method**: Hook usage review + prop drilling analysis
- **Output**: State management pattern documentation

### PHASE 4: Issue Identification (30 min)
**Goal**: Identify specific gaps and broken integrations

#### Subtask 4.1: Integration Gap Analysis (15 min)
- **Action**: Compare expected vs actual behavior patterns
- **Method**: Code analysis + testing gap identification
- **Output**: Specific missing integration points list

#### Subtask 4.2: Error Pattern Investigation (15 min)
- **Action**: Identify silent failures and missing triggers
- **Method**: Code review + potential race condition analysis
- **Output**: Issue prioritization matrix with fix complexity

### PHASE 5: Documentation & Planning (30 min)
**Goal**: Create comprehensive documentation and fix plan

#### Subtask 5.1: WORKFLOW_APP.md Creation (20 min)
- **Action**: Compile complete application workflow documentation
- **Method**: Consolidate all investigation findings
- **Output**: WORKFLOW_APP.md with diagrams and references

#### Subtask 5.2: Issue Resolution Planning (10 min)
- **Action**: Create prioritized fix plan with implementation estimates
- **Method**: Issue analysis + complexity assessment
- **Output**: Actionable resolution roadmap

## Tools and Resources

### Primary MCP Tools
- **mcp__supabase__execute_sql**: Database queries and schema analysis
- **mcp__supabase__list_tables**: Table structure inspection
- **mcp__supabase__get_project**: Project configuration review

### Investigation Methods
- **Systematic Code Reading**: Line-by-line critical path analysis
- **Dependency Mapping**: Import/export chain following
- **Pattern Recognition**: Common code pattern identification
- **Integration Testing**: Component interaction verification

### Documentation Standards
- **English Only**: All technical documentation in English
- **Code References**: Every finding with file:line references
- **Test Results**: MCP query results and verification data
- **Visual Diagrams**: Flow charts and architecture diagrams where helpful

## Risk Management

### Investigation Risks
- **Context Loss**: Systematic logging to prevent information loss
- **Scope Creep**: Strict adherence to 5-phase structure
- **Time Overrun**: 10-minute buffer per phase for unexpected complexity

### Mitigation Strategies
- **No Code Changes**: Pure investigation phase, modifications only after user approval
- **Comprehensive Logging**: Document every action and finding
- **Structured Approach**: Follow phase sequence strictly
- **Regular Checkpoints**: Validate findings before proceeding

## Success Metrics

### Completion Criteria
1. ✅ **Complete Architecture Understanding** - All components and integrations mapped
2. ✅ **Root Cause Identification** - Specific reasons for UI/database disconnect found
3. ✅ **Actionable Fix Plan** - Concrete steps to resolve each identified issue
4. ✅ **Comprehensive Documentation** - WORKFLOW_APP.md serves as definitive reference
5. ✅ **Testing Strategy** - Clear verification plan for proposed fixes

### Quality Standards
- **Code Reference Accuracy** - Every claim backed by specific file:line references
- **Test Verifiability** - All findings reproducible via documented MCP commands
- **Implementation Clarity** - Fix proposals specific enough for immediate implementation
- **Future-Proof Documentation** - WORKFLOW_APP.md useful for long-term maintenance

---

## Next Steps

1. **User Approval**: Present this plan for confirmation or modifications
2. **Investigation Execution**: Follow 5-phase structure systematically
3. **Findings Presentation**: Review discoveries before implementation
4. **Implementation Planning**: Create detailed fix schedule based on findings
5. **Verification Testing**: Execute comprehensive testing plan

**Ready to begin systematic investigation upon user approval.**
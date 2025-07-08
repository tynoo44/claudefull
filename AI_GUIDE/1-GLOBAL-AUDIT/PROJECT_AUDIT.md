# Project Audit & File Tree

This document provides a comprehensive overview of the `claudefull2` project structure. It serves as the central index for the detailed audit analysis.

- **Health Status:**
  - `[🟢 Healthy]`: Well-structured, follows best practices.
  - `[🟡 Needs Improvement]`: Functional, but could be refactored or improved.
  - `[🔴 Critical]`: Potential bugs, security risks, or major architectural issues.
  - `[⚪ Not Audited]`: Not yet analyzed.
- **Analysis Link:** A link to the detailed markdown file in the `audit_analysis/` directory.

---

## Root Directory

- `claudefull2/`
  - **`.claude/`**: Configuration for the Claude AI assistant.
    - `settings.local.json`: [⚪ Not Audited]
  - **`.clinerules/`**: Project-specific rules and guidelines.
    - `[🟢 Healthy]` - [Analysis](./audit_analysis/02_Root_Context_and_Tooling.md)
  - **`.cursor/`**: Cursor IDE specific settings.
    - `[⚪ Not Audited]`
  - **`.git/`**: Git version control directory.
    - `[⚪ Not Audited]`
  - **`.github/`**: GitHub-specific files (e.g., workflows, issue templates).
    - `[⚪ Not Audited]`
  - **`.husky/`**: Git hooks configuration.
    - `[⚪ Not Audited]`
  - **`.roo/`**: Roo Code AI assistant configuration.
    - `[⚪ Not Audited]`
  - **`.taskmaster/`**: Taskmaster AI configuration and data.
    - `[⚪ Not Audited]`
  - **`.env`**: Local environment variables (SECRET).
    - `[🟢 Healthy]` - [Analysis](./audit_analysis/01_Environment_and_Ignore_Files.md)
  - **`.env.example`**: Example environment variables.
    - `[🟢 Healthy]` - [Analysis](./audit_analysis/01_Environment_and_Ignore_Files.md)
  - **`.gitignore`**: Specifies files for Git to ignore.
    - `[🟢 Healthy]` - [Analysis](./audit_analysis/01_Environment_and_Ignore_Files.md)
  - **`.mcp.json`**: Model Context Protocol server configurations.
    - `[🟡 Needs Improvement]` - [Analysis](./audit_analysis/02_Root_Context_and_Tooling.md)
  - **`.prettierignore`**: Files for Prettier to ignore.
    - `[🟢 Healthy]` - [Analysis](./audit_analysis/02_Root_Context_and_Tooling.md)
  - **`.prettierrc.json`**: Prettier configuration.
    - `[🟢 Healthy]` - [Analysis](./audit_analysis/02_Root_Context_and_Tooling.md)
  - **`.roomodes`**: Roo Code AI modes configuration.
    - `[🟡 Needs Improvement]` - [Analysis](./audit_analysis/02_Root_Context_and_Tooling.md)
  - **`AGENTS.md`**: Documentation for Task Master AI integration.
    - `[🟡 Needs Improvement]` - [Analysis](./audit_analysis/02_Root_Context_and_Tooling.md)
  - **`CLAUDE.md`**: Main project context file for Claude.
    - `[🟡 Needs Improvement]` - [Analysis](./audit_analysis/02_Root_Context_and_Tooling.md)
  - **`eslint.config.js`**: ESLint configuration.
    - `[🟢 Healthy]` - [Analysis](./audit_analysis/00_Root_Configuration.md)
  - **`index.html`**: Main HTML entry point.
    - `[🟢 Healthy]` - [Analysis](./audit_analysis/04_Public_and_HTML_Entry.md)
  - **`package-lock.json`**: Exact dependency tree.
    - `[🟢 Healthy]` - [Analysis](./audit_analysis/00_Root_Configuration.md)
  - **`package.json`**: Project dependencies and scripts.
    - `[🟢 Healthy]` - [Analysis](./audit_analysis/00_Root_Configuration.md)
  - **`PLAN_IA.md`**: Legacy AI implementation plan.
    - `[🔴 Critical]` - [Analysis](./audit_analysis/02_Root_Context_and_Tooling.md)
  - **`postcss.config.js`**: PostCSS configuration.
    - `[🟢 Healthy]` - [Analysis](./audit_analysis/00_Root_Configuration.md)
  - **`README.md`**: Original project README.
    - `[🟡 Needs Improvement]` - [Analysis](./audit_analysis/02_Root_Context_and_Tooling.md)
  - **`tailwind.config.js`**: Tailwind CSS configuration.
    - `[🟢 Healthy]` - [Analysis](./audit_analysis/00_Root_Configuration.md)
  - **`tsconfig.json`**: TypeScript configuration for the project.
    - `[🟢 Healthy]` - [Analysis](./audit_analysis/00_Root_Configuration.md)
  - **`tsconfig.node.json`**: TypeScript configuration for Node.js environment (Vite).
    - `[🟢 Healthy]` - [Analysis](./audit_analysis/00_Root_Configuration.md)
  - **`vite-env.d.ts`**: Vite TypeScript environment declarations.
    - `[🟢 Healthy]` - [Analysis](./audit_analysis/00_Root_Configuration.md)
  - **`vite.config.ts`**: Vite configuration.
    - `[🟢 Healthy]` - [Analysis](./audit_analysis/00_Root_Configuration.md)

---

### `appointment_setting/`

- **Description:** Contains the core business logic and context for the AI appointment setter.
- **Overall Health:** `[🟡 Needs Improvement]` - [Analysis](./audit_analysis/03_Appointment_Setting_Context.md)
  - `AI_Instructions.md`
  - `PROMPT_ENGINEERING_ANALYSIS.md`
  - `QUANTUM_SCRIPT_B2B.md`

---

### `public/`

- **Description:** Static assets served directly by the web server.
- **Overall Health:** `[🟢 Healthy]` - [Analysis](./audit_analysis/04_Public_and_HTML_Entry.md)
  - `index.html`
  - `vite.svg`

---

### `src/`

- **Description:** The main application source code.
- **Overall Health:** `[🟡 Needs Improvement]` - [Analysis](./audit_analysis/05_Src_Entry_and_Structure.md)
  - `main.tsx`: The main entry point for the React application.
  - **`components/`**: Reusable UI components.
    - **`ui/`**: [🟢 Healthy] - [Analysis](./audit_analysis/11_Components_UI.md)
    - **`Layout/`**: [🟢 Healthy] - [Analysis](./audit_analysis/12_Components_Layout.md)
    - **`Leads/`**: [🟡 Needs Improvement] - [Analysis](./audit_analysis/13_Components_Leads.md)
    - **`Templates/`**: [🟡 Needs Improvement] - [Analysis](./audit_analysis/14_Components_Templates.md)
    - **`Chat/`**: [🟡 Needs Improvement] - [Analysis](./audit_analysis/15_Components_Chat.md)
  - **`contexts/`**: React Context providers.
    - `[🟡 Needs Improvement]` - [Analysis](./audit_analysis/09_Src_Contexts.md)
  - **`hooks/`**: Custom React hooks.
    - `[🟡 Needs Improvement]` - [Analysis](./audit_analysis/08_Src_Hooks.md)
  - **`lib/`**: Core logic and service integrations.
    - `[🟡 Needs Improvement]` - [Analysis](./audit_analysis/06_Src_Lib.md)
  - **`pages/`**: Top-level page components.
    - `[🟡 Needs Improvement]` - [Analysis](./audit_analysis/10_Src_Pages.md)
  - **`scripts/`**: Utility scripts.
    - `[🟢 Healthy]` - [Analysis](./audit_analysis/16_Src_Scripts.md)
  - **`types/`**: TypeScript type definitions.
    - `[🟢 Healthy]` - [Analysis](./audit_analysis/07_Src_Types.md)

---

### `supabase/`

- **Description:** Supabase-specific configuration and database migrations.
- **Overall Health:** `[🟡 Needs Improvement]` - [Analysis](./audit_analysis/17_Supabase.md)
  - `config.toml`
  - **`migrations/`**
    - `20240706193348_initial_schema.sql`

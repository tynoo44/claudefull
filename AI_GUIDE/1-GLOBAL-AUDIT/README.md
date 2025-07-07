# Setter AI - AI Guide & Development Protocol

## 1. Core Philosophy & Objective

This document outlines the development and audit protocol for the **Setter AI** project. The primary objective is to rapidly develop a **highly efficient, reliable, and powerful personal tool** for appointment setting.

The core philosophy is guided by these principles:
-   **Functionality First:** The absolute priority is a working, fluid, and effective application.
-   **Efficiency is Key:** All technical decisions must favor performance, speed, and a smooth user experience, especially concerning Supabase integrations and AI response times.
-   **Clean Code for a Solo Developer:** While time-to-market is critical, the code must be clean, well-documented, and easy to maintain to prevent future refactoring and bugs. Simplicity is paramount.
-   **Personal Use, Not Public Release:** Security, multi-tenancy, and privacy features are **not** a current priority. The focus is on building a robust tool for a single user.

## 2. Technical Stack Overview

-   **Frontend**: React 19 + TypeScript + Vite
-   **AI**: Google Gemini API
-   **Database & Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
-   **Styling**: Tailwind CSS
-   **Dev Tools**: ESLint, Prettier, Husky, Task Master

## 3. Execution Protocol

This audit and any subsequent development will adhere to the following strict protocol, as defined in the project's `MASTER_PLAN.md` and `task_detailed.json`.

### 3.1. Language Requirements
-   **All technical work must be in English.** This includes all logs, plans, reports, code comments, and commit messages.
-   User-facing content and UI elements may be in Spanish as required.

### 3.2. Task Management & Logging
-   All work is broken down into sequential phases and tasks, tracked in `MASTER_PLAN.md`.
-   Every action taken must be logged in `logs/main_audit_log.md` with a timestamp, objective, process, outcome, and analysis.
-   No action may be performed unless it is explicitly defined in the current task of the action plan.

### 3.3. Error & Change Management
-   **On any error: HALT.** Stop all work immediately.
-   **Analyze:** Perform a root cause analysis in the log.
-   **Plan:** Create a new, detailed set of sub-tasks in the master plan to address the failure.
-   **Execute & Verify:** Follow the new plan and thoroughly test the solution.
-   **Resume:** Continue with the original task only after the fix is verified.

## 4. Audit Structure

The project audit is structured as follows:
1.  **`PROJECT_AUDIT.md`**: The central document containing a complete file tree of the project. Each file/directory has a health status and a link to its detailed analysis.
2.  **`audit_analysis/`**: A directory containing detailed markdown reports for each module or file group.
3.  **`FINAL_AUDIT_SUMMARY.md`**: A high-level summary of all findings, with prioritized recommendations for the next steps.

This guide is the single source of truth for this project's development. It supersedes any conflicting information in older `README.md` or `CLAUDE.md` files.

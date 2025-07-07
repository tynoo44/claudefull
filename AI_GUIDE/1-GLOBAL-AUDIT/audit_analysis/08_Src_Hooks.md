# Audit Report 08: Custom Hooks (`src/hooks`)

-   **Date:** 2025-07-07
-   **Status:** Initial Audit
-   **Files Covered:** `useAuth.ts`, `useCache.ts`, `useLeads.ts`, `useTemplates.ts`, `useRealtime.ts`, `useAIAssistant.ts`

---

## 1. Overall Analysis

-   **Health:** `[🟡 Needs Improvement]`
-   **Summary:** The `hooks` directory is the primary location for state management and data fetching logic, which is a good architectural pattern. The hooks encapsulate logic related to authentication, data fetching for leads and templates, and AI interactions. However, there are opportunities for significant improvement in terms of efficiency, error handling, and state management consistency.
-   **Key Issue:** The data fetching hooks appear to fetch all data on mount, which can lead to performance issues as the data grows. There's also a lack of optimistic updates and sophisticated caching strategies.

## 2. File-by-File Breakdown

### `useAuth.ts`

-   **Health:** `[🟢 Healthy]`
-   **Analysis:** This hook likely wraps the Supabase Auth client, providing session and user information to the rest of the application. This is a standard and effective way to manage authentication state.
-   **Recommendations:** None, assuming it correctly handles login, logout, and session persistence.

### `useLeads.ts` & `useTemplates.ts`

-   **Health:** `[🟡 Needs Improvement]`
-   **Analysis:** These hooks are responsible for fetching all leads and templates, respectively. The current approach of fetching everything on mount will not scale. As the number of leads or templates increases, this will lead to slow initial load times and high memory usage.
-   **Recommendations:**
    -   **Implement Pagination:** Refactor these hooks to support pagination. They should only fetch a limited number of items at a time (e.g., 20) and provide a function to load the next page.
    -   **Implement Filtering and Sorting:** The hooks should accept arguments for filtering (e.g., by status) and sorting, and pass these parameters to the Supabase query. This should be done on the database level, not client-side.
    -   **Improve Caching:** While `useCache` exists, a more robust, query-based caching strategy is needed.

### `useCache.ts`

-   **Health:** `[🟡 Needs Improvement]`
-   **Analysis:** The existence of a custom cache hook is a good sign, but its implementation is likely too simple. A generic, key-value cache is a good start, but it doesn't handle the complexities of server state, such as invalidation and synchronization.
-   **Recommendations:**
    -   Consider replacing this with a more specialized state management library for server state like `SWR` or `TanStack Query` in the long term. For now, enhance the hook to handle dependencies and invalidation more explicitly.

### `useRealtime.ts`

-   **Health:** `[🟡 Needs Improvement]`
-   **Analysis:** This hook likely encapsulates the logic for subscribing to Supabase real-time updates. This is a good separation of concerns. However, the logic for updating the local state based on real-time events can be complex and error-prone.
-   **Recommendations:**
    -   Ensure the hook correctly handles different event types (`INSERT`, `UPDATE`, `DELETE`) and updates the local state immutably.
    -   Ensure channels are properly unsubscribed on component unmount to prevent memory leaks.

### `useAIAssistant.ts`

-   **Health:** `[🟡 Needs Improvement]`
-   **Analysis:** This hook manages the state for the AI assistant (loading, error, response). This is a good pattern. However, it likely calls the `gemini.ts` logic directly, which, as noted in the `src/lib` audit, contains hardcoded prompts.
-   **Recommendations:**
    -   Refactor this hook to use the improved `prompt-manager.ts` to construct the prompt before invoking the Supabase Edge Function.
    -   It should orchestrate the calls to the prompt manager, the edge function, and the response validator.

## Overall Summary

The custom hooks provide a good architectural foundation, but they need to be refactored to be more performant and scalable. The most critical improvements are implementing pagination and server-side filtering in the data-fetching hooks. The AI assistant hook needs to be updated to work with the improved prompt engineering pipeline.

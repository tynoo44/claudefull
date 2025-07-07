# Audit Report 09: React Contexts (`src/contexts`)

-   **Date:** 2025-07-07
-   **Status:** Initial Audit
-   **Files Covered:** `AuthContext.tsx`, `AppContext.tsx`

---

## 1. Overall Analysis

-   **Health:** `[🟡 Needs Improvement]`
-   **Summary:** The project uses the React Context API for global state management, which is a reasonable choice for an application of this size to avoid external dependencies like Redux. The separation into `AuthContext` and `AppContext` is logical. However, the implementation could lead to performance issues as the application scales.
-   **Key Issue:** Providing large, frequently changing objects or multiple data arrays through a single context (`AppContext`) can cause unnecessary re-renders in consuming components.

## 2. File-by-File Breakdown

### `AuthContext.tsx`

-   **Health:** `[🟢 Healthy]`
-   **Analysis:** This context is likely dedicated solely to providing user and session information from the `useAuth` hook. This is a good practice, as authentication state is global and changes infrequently. It correctly separates auth concerns from the main application state.
-   **Recommendations:** None, assuming it's implemented as a standard auth provider.

### `AppContext.tsx`

-   **Health:** `[🟡 Needs Improvement]`
-   **Analysis:** This context appears to be a "catch-all" provider for the main application data, likely including leads, templates, conversations, etc. While convenient, this is an anti-pattern. Any component consuming this context will re-render whenever *any* piece of the provided state changes, even if that piece is not relevant to the component. For example, a component displaying only templates would re-render every time a new lead is added.
-   **Recommendations:**
    -   **Split the Context:** Break down `AppContext` into multiple, more granular contexts based on the domain. For example:
        -   `LeadsProvider`: Manages and provides only the leads data.
        -   `TemplatesProvider`: Manages and provides only the templates data.
        -   `ConversationsProvider`: Manages the state for the active conversations.
    -   **Use `useReducer` for Complex State:** For contexts that manage complex state with multiple actions (like adding, updating, and deleting leads), use the `useReducer` hook within the provider. This centralizes the update logic and can be more performant than passing down multiple callback functions.
    -   **Memoize Provider Value:** Ensure the `value` prop of the context provider is memoized with `useMemo` to prevent re-renders of consumers when the provider itself re-renders for other reasons.

## Overall Summary

The use of Context for state management is appropriate, but the current implementation of a single, monolithic `AppContext` is a significant performance risk. Refactoring this into smaller, domain-specific contexts is the most critical improvement needed in this directory. This will ensure that components only re-render when the specific data they care about actually changes, leading to a more efficient and scalable application.

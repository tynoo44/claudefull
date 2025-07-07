# Structure and Functions Map

This document defines the architectural blueprint for the Setter AI application. All development and refactoring must adhere to these standards to ensure consistency, maintainability, and performance.

## 1. Core Technologies

-   **Frontend Framework:** React 19
-   **Language:** TypeScript 5.x
-   **Build Tool:** Vite
-   **Styling:** Tailwind CSS
-   **State Management:** React Context API + Custom Hooks (`useContext`, `useState`, `useReducer`)
-   **Data Fetching:** Direct calls to Supabase client within custom hooks.
-   **Backend-as-a-Service (BaaS):** Supabase
    -   **Database:** PostgreSQL
    -   **Authentication:** Supabase Auth
    -   **Serverless Functions:** Supabase Edge Functions (for secure API calls)
-   **AI Model:** Google Gemini API

## 2. Project Structure

The project will follow a standard feature-based directory structure within `src/`.

```
src/
├── assets/             # Static assets like images, fonts
├── components/         # Reusable UI components
│   ├── ui/             # Generic, unstyled components (Button, Card, etc.)
│   ├── Layout/         # Main layout components (Header, Sidebar)
│   └── features/       # Components specific to a feature (Chat, Leads)
├── contexts/           # React Context providers for global state
├── hooks/              # Custom hooks for reusable logic (e.g., useLeads, useAuth)
├── lib/                # Core logic, external service clients (Supabase, Gemini)
├── pages/              # Top-level page components for routing
├── styles/             # Global styles and Tailwind base configuration
├── types/              # TypeScript type definitions and interfaces
└── utils/              # Utility functions (date formatting, etc.)
```

## 3. Data Models & State Management

### 3.1. Supabase Schema (Single Source of Truth)

The database schema defined in the `supabase/migrations` is the ultimate source of truth for our data structures. Key tables include:
-   `leads`: Stores lead information.
-   `conversations`: Manages conversation history and state.
-   `messages`: Individual messages within a conversation.
-   `script_templates`: Stores reusable message templates.
-   `prompts`: Contains prompts for the AI system.

### 3.2. State Management Philosophy

-   **Local State:** Use `useState` for component-specific, non-persistent state.
-   **Shared State:** Use `useContext` combined with `useReducer` for complex state shared across multiple components (e.g., `AppContext` for leads, templates).
-   **Server State:** Data fetched from Supabase is considered server state. It will be managed via custom hooks (e.g., `useLeads`) that handle fetching, caching, and real-time updates. There is **no separate client-side cache** like React Query; the "cache" is the state held within our hooks, updated via Supabase's real-time subscriptions.

## 4. Key Function Maps

### 4.1. Data Fetching Pattern

All interactions with the Supabase database **must** be encapsulated within a custom hook in the `src/hooks/` directory.

```typescript
// Example: src/hooks/useLeads.ts

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Lead } from '@/types';

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeads = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('leads').select('*');
      if (error) {
        console.error('Error fetching leads:', error);
      } else {
        setLeads(data || []);
      }
      setLoading(false);
    };

    fetchLeads();

    // Set up real-time subscription
    const channel = supabase
      .channel('realtime-leads')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, (payload) => {
        // Logic to update leads state based on the payload
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { leads, loading };
}
```

### 4.2. AI Interaction Pattern

All calls to the Gemini API **must** be routed through a dedicated Supabase Edge Function for security and to centralize prompt logic.

-   **Edge Function Location:** `supabase/functions/gemini-assistant/`
-   **Client-side Invocation:** Use the `supabase.functions.invoke()` method, likely within a dedicated hook like `useAIAssistant`.

### 4.3. Component Architecture

-   **Container/Presentational Pattern:**
    -   **Page Components (`src/pages/`)**: Act as containers. They are responsible for fetching data (via hooks) and managing the state for a specific view.
    -   **Feature Components (`src/components/features/`)**: Receive data and callbacks as props from page components. They handle the rendering of specific features.
    -   **UI Components (`src/components/ui/`)**: Are purely presentational. They receive all data and functions via props and have no knowledge of the application's state.

This map serves as the definitive guide for all architectural decisions. Any deviation must be justified and documented in the project's log.

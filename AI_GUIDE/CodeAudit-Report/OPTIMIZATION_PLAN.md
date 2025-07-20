# Plan de Optimización de Carga de Datos

Este documento detalla los cambios necesarios para refactorizar la carga de datos en la aplicación, implementando paginación para mejorar el rendimiento y la escalabilidad.

## Fase 1: Paginación de la Lista de Conversaciones

### 1.1. Actualizar la Función RPC de Supabase

Se debe modificar la función `get_conversations_with_details_rpc` para que acepte parámetros de paginación.

**Archivo a modificar:** `supabase/migrations/20250720024200_create_rpc_get_conversations_with_last_message.sql`

**Nuevo contenido:**
```sql
-- Migration: Create RPC for fetching conversations with last message
-- Date: 2025-07-20
-- Purpose: Solve N+1 query problem and add pagination.

CREATE OR REPLACE FUNCTION get_conversations_with_details_rpc(page_size integer, page_offset integer)
RETURNS TABLE (
  -- Columns from 'conversations' table
  id uuid,
  lead_id uuid,
  opened_at timestamptz,
  updated_at timestamptz,
  -- Columns from the last message
  last_message_text text,
  last_message_created_at timestamptz,
  last_message_sender_type text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.lead_id,
    c.opened_at,
    c.updated_at,
    m.text AS last_message_text,
    m.created_at AS last_message_created_at,
    m.sender_type::text AS last_message_sender_type
  FROM
    conversations c
  LEFT JOIN LATERAL (
    SELECT
      msg.text,
      msg.created_at,
      msg.sender_type
    FROM
      messages msg
    WHERE
      msg.conversation_id = c.id
    ORDER BY
      msg.created_at DESC
    LIMIT 1
  ) m ON true
  ORDER BY
    c.updated_at DESC
  LIMIT page_size
  OFFSET page_offset;
END;
$$ LANGUAGE plpgsql;
```

### 1.2. Actualizar el Hook de React Query

Se debe reemplazar `useQuery` por `useInfiniteQuery` para gestionar la carga paginada de conversaciones.

**Archivo a modificar:** `src/hooks/useConversationsQuery.ts`

**Nuevo contenido:**
```typescript
import { useInfiniteQuery } from '@tanstack/react-query';
import { getPaginatedConversations } from '../lib/supabase-functions';

const CONVERSATIONS_PAGE_SIZE = 20;

export const useConversationsQuery = () => {
  return useInfiniteQuery({
    queryKey: ['conversations'],
    queryFn: ({ pageParam = 0 }) => {
      return getPaginatedConversations(CONVERSATIONS_PAGE_SIZE, pageParam * CONVERSATIONS_PAGE_SIZE);
    },
    getNextPageParam: (lastPage, allPages) => {
      // If the last page has fewer items than the page size, we've reached the end.
      if (lastPage.length < CONVERSATIONS_PAGE_SIZE) {
        return undefined;
      }
      return allPages.length;
    },
    initialPageParam: 0,
  });
};
```

### 1.3. Actualizar la Función de Supabase en el Frontend

Se debe crear una nueva función en `src/lib/supabase-functions.ts` para llamar a la RPC paginada.

**Archivo a modificar:** `src/lib/supabase-functions.ts`

**Añadir esta función:**
```typescript
export const getPaginatedConversations = async (pageSize: number, pageOffset: number) => {
  const { data, error } = await supabase.rpc('get_conversations_with_details_rpc', {
    page_size: pageSize,
    page_offset: pageOffset,
  });

  if (error) {
    console.error('Error fetching paginated conversations:', error);
    throw new Error(error.message);
  }

  return data || [];
};
```

### 1.4. Actualizar el Componente de la UI

Se debe modificar `ChatsPage.tsx` y `ChatSidebar.tsx` para usar el nuevo hook infinito y disparar la carga de la siguiente página.

**Archivo a modificar:** `src/pages/ChatsPage.tsx`

**Cambios:**
- Actualizar la llamada al hook:
  `const { data: conversationsData, error: conversationsError, isLoading: conversationsLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useConversationsQuery();`
- Aplanar los datos:
  `const allConversations = conversationsData?.pages.flatMap(page => page) || [];`
- Pasar las nuevas props a `ChatSidebar`:
  `<ChatSidebar ... fetchNextPage={fetchNextPage} hasNextPage={hasNextPage} isFetchingNextPage={isFetchingNextPage} />`

**Archivo a modificar:** `src/components/Chat/ChatSidebar.tsx`

**Cambios:**
- Añadir un `div` observable al final de la lista de conversaciones. Cuando este `div` se haga visible en la pantalla, se llamará a `fetchNextPage`. Se puede usar la librería `react-intersection-observer` para esto.

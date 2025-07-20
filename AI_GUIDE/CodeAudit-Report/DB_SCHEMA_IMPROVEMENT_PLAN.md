# Plan de Mejora del Esquema de la Base de Datos (Revisión Final)

Este documento describe el plan para refactorizar el esquema de la base de datos. Las acciones se centran en fusionar tablas para mejorar el rendimiento, y en eliminar tablas no utilizadas para simplificar la arquitectura.

## Fase 1: Fusión de Tablas de Conversación

**Objetivo:** Mejorar el rendimiento eliminando la necesidad de un `JOIN` entre los datos de la conversación y su estado.

### 1.1. Crear una Nueva Migración

Crear un nuevo archivo de migración de Supabase para realizar los siguientes cambios en el esquema:

**1. Añadir columnas a `conversations`:**
Añadir todas las columnas de `conversation_memory` a la tabla `conversations`.

```sql
ALTER TABLE public.conversations
ADD COLUMN IF NOT EXISTS current_phase INTEGER DEFAULT 1 CHECK (current_phase >= 1 AND current_phase <= 5),
ADD COLUMN IF NOT EXISTS qualification_score DECIMAL(3,2) DEFAULT 0.00 CHECK (qualification_score >= 0 AND qualification_score <= 1),
ADD COLUMN IF NOT EXISTS conversation_state JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS phase_history JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS phase_info JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS last_analysis_timestamp TIMESTAMPTZ;
```

**2. Migrar los Datos (Backfill):**
Copiar los datos existentes de `conversation_memory` a las nuevas columnas en `conversations`.

```sql
UPDATE public.conversations c
SET
    current_phase = cm.current_phase,
    qualification_score = cm.qualification_score,
    conversation_state = cm.conversation_state,
    phase_history = cm.phase_history,
    phase_info = cm.phase_info,
    last_analysis_timestamp = cm.last_analysis_timestamp
FROM public.conversation_memory cm
WHERE c.id = cm.conversation_id;
```

**3. Eliminar la Tabla Antigua:**
Una vez que los datos han sido migrados, eliminar la tabla `conversation_memory`.

```sql
DROP TABLE IF EXISTS public.conversation_memory;
```

**4. Crear Índices Optimizados:**
Crear nuevos índices en la tabla `conversations` para soportar las consultas comunes.

```sql
CREATE INDEX IF NOT EXISTS idx_conversations_current_phase ON public.conversations(current_phase);
CREATE INDEX IF NOT EXISTS idx_conversations_qualification_score ON public.conversations(qualification_score);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON public.conversations(updated_at DESC);
```

## Fase 2: Eliminación de Tablas No Utilizadas

**Objetivo:** Simplificar el esquema y reducir el desorden eliminando tablas que no son leídas por la aplicación.

### 2.1. Crear una Nueva Migración

Añadir los siguientes comandos a la migración creada en la Fase 1, o crear una nueva.

**1. Eliminar `objection_handlers`:**
Esta tabla se llena mediante un script pero nunca se lee en la aplicación.

```sql
DROP TABLE IF EXISTS public.objection_handlers;
```

**2. Eliminar `prompt_analytics`:**
Esta tabla no se lee ni se escribe en ninguna parte del código de la aplicación.

```sql
DROP TABLE IF EXISTS public.prompt_analytics;
```

## Fase 3: Actualizar el Código de la Aplicación

### 3.1. Actualizar Lógica de la Aplicación

Revisar todo el código que hacía referencia a `conversation_memory` (principalmente en `src/lib/conversation-state-manager.ts`) y modificarlo para que ahora consulte la tabla `conversations` fusionada.

### 3.2. Eliminar Código Obsoleto

Eliminar cualquier referencia a `conversation_memory`, `objection_handlers`, y `prompt_analytics` en el frontend y los scripts.

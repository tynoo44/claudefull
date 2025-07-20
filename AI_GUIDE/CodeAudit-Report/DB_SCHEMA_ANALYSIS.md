# Análisis del Esquema de la Base de Datos (vía Supabase MCP)

A continuación se presenta la estructura actual de las tablas principales de la base de datos, obtenida a través del análisis de la información más reciente del esquema.

---

## Tabla: `public.leads`

| Columna      | Tipo de Dato  | Restricciones   | Descripción                                        |
| ------------ | ------------- | --------------- | -------------------------------------------------- |
| `id`         | `uuid`        | `PRIMARY KEY`   | Identificador único del lead.                      |
| `name`       | `text`        |                 | Nombre del lead.                                   |
| `email`      | `text`        |                 | Correo electrónico del lead.                       |
| `phone`      | `text`        |                 | Teléfono del lead.                                 |
| `status`     | `text`        |                 | Estado actual del lead (e.g., 'new', 'contacted'). |
| `source`     | `text`        |                 | Origen del lead (e.g., 'website', 'referral').     |
| `created_at` | `timestamptz` | `DEFAULT now()` | Timestamp de creación.                             |

**Índices:**

- `idx_leads_status`

---

## Tabla: `public.conversations`

| Columna      | Tipo de Dato  | Restricciones            | Descripción                             |
| ------------ | ------------- | ------------------------ | --------------------------------------- |
| `id`         | `uuid`        | `PRIMARY KEY`            | Identificador único de la conversación. |
| `lead_id`    | `uuid`        | `FOREIGN KEY (leads.id)` | Vínculo con el lead asociado.           |
| `opened_at`  | `timestamptz` | `DEFAULT now()`          | Timestamp de inicio de la conversación. |
| `updated_at` | `timestamptz` | `DEFAULT now()`          | Timestamp de la última actualización.   |

**Índices:**

- `one_convo_per_lead` (índice único en `lead_id`)

---

## Tabla: `public.messages`

| Columna           | Tipo de Dato  | Restricciones                    | Descripción                                     |
| ----------------- | ------------- | -------------------------------- | ----------------------------------------------- |
| `id`              | `uuid`        | `PRIMARY KEY`                    | Identificador único del mensaje.                |
| `conversation_id` | `uuid`        | `FOREIGN KEY (conversations.id)` | Vínculo con la conversación a la que pertenece. |
| `text`            | `text`        |                                  | Contenido del mensaje.                          |
| `sender_type`     | `text`        |                                  | 'user' o 'ai'.                                  |
| `created_at`      | `timestamptz` | `DEFAULT now()`                  | Timestamp de creación.                          |

**Índices:**

- `idx_messages_conversation_id`
- `idx_messages_created_at` (descendente)

---

## Tabla: `public.conversation_tracking`

| Columna                   | Tipo de Dato   | Restricciones                            | Descripción                                      |
| ------------------------- | -------------- | ---------------------------------------- | ------------------------------------------------ |
| `id`                      | `uuid`         | `PRIMARY KEY`                            | Identificador único del registro de seguimiento. |
| `conversation_id`         | `uuid`         | `FOREIGN KEY (conversations.id), UNIQUE` | Vínculo 1:1 con la conversación.                 |
| `current_phase`           | `integer`      |                                          | Fase actual de la venta (1-5).                   |
| `qualification_score`     | `decimal(3,2)` |                                          | Puntuación de cualificación del lead (0.0-1.0).  |
| `conversation_state`      | `jsonb`        |                                          | Estado detallado de la conversación.             |
| `phase_history`           | `jsonb`        |                                          | Historial de transiciones de fase.               |
| `phase_info`              | `jsonb`        |                                          | Información estructurada por fase.               |
| `last_analysis_timestamp` | `timestamptz`  |                                          | Timestamp del último análisis de IA.             |
| `created_at`              | `timestamptz`  | `DEFAULT now()`                          | Timestamp de creación.                           |
| `updated_at`              | `timestamptz`  | `DEFAULT now()`                          | Timestamp de la última actualización.            |

**Índices:**

- `idx_tracking_conversation_id`
- `idx_tracking_current_phase`
- `idx_tracking_qualification_score`
- `idx_tracking_updated_at`

---

## Conclusión del Análisis

El análisis del esquema revela una relación 1:1 entre `conversations` y `conversation_tracking`. Esta estructura requiere un `JOIN` para la mayoría de las consultas de estado, lo que representa una oportunidad de optimización.

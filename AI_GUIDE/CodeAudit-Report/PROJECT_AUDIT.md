# Informe de Auditoría y Refactorización: Setter AI

## 1. Resumen Ejecutivo

Este informe presenta una auditoría exhaustiva de la base de código de la aplicación "Setter AI". La aplicación se basa en un stack tecnológico moderno (React 19, Vite, TypeScript, Supabase) y demuestra un buen enfoque inicial en la calidad del código con herramientas de linting y formateo.

Sin embargo, la auditoría ha revelado **dos áreas arquitectónicas críticas** que requieren atención inmediata para asegurar la escalabilidad, mantenibilidad y estabilidad de la plataforma:

1.  **Gestión de Estado Fragmentada y Conflictiva:** El problema más grave es la existencia de múltiples fuentes de verdad para el estado de la aplicación. El estado de los datos (leads, chats) se gestiona de forma inconsistente a través de un hook global monolítico (`useAppState`), un hook de obtención de datos (`useSupabaseData`) y una capa de caché (`useGlobalCache`). Esto conduce a datos obsoletos, una alta probabilidad de bugs y una complejidad innecesaria que dificulta el desarrollo.

2.  **Alto Acoplamiento y "Prop Drilling" Excesivo:** El hook monolítico `useAppState` provoca que los componentes estén fuertemente acoplados a un estado global masivo. Esto, combinado con el paso manual de props a través de múltiples niveles de componentes ("prop drilling"), hace que el código sea frágil, difícil de refactorizar y propenso a re-renderizados innecesarios que afectan al rendimiento.

La resolución de estos dos puntos es fundamental y desbloqueará mejoras significativas en toda la aplicación. El roadmap de refactorización priorizará la unificación de la gestión del estado como el primer y más importante paso.

---

_Esta es la sección inicial del informe. Las siguientes secciones se completarán a medida que se detallen los hallazgos específicos._

## 2. Análisis de Arquitectura y Diseño

### 2.1. Estado Global Monolítico y Múltiples Fuentes de Verdad

- **Problema:** La aplicación centraliza casi todo el estado global en un único hook monolítico, `useAppState`. Al mismo tiempo, otros hooks como `useSupabaseData` y `useGlobalCache` también gestionan su propia versión del mismo estado (leads, chats), creando múltiples fuentes de verdad que no están sincronizadas.
- **Impacto:** **Crítico**.
  - **Mantenibilidad:** Extremadamente difícil de mantener. Un cambio en una parte del estado puede tener efectos secundarios impredecibles en toda la aplicación.
  - **Rendimiento:** Causa re-renderizados masivos e innecesarios. Cualquier componente que consuma una pequeña parte del estado de `useAppState` se volverá a renderizar cada vez que cualquier otro valor en el hook cambie.
  - **Consistencia de Datos:** Conduce a bugs donde la UI puede mostrar datos obsoletos o inconsistentes, ya que no hay una única fuente de verdad. Las acciones de mutación en `useAppState` (ej. `addLead`) no se reflejan en los datos obtenidos por `useSupabaseData`.
- **Ubicación:**
  - [`src/hooks/useAppState.ts`](src/hooks/useAppState.ts:): Definición del hook monolítico.
  - [`src/hooks/useSupabaseData.ts`](src/hooks/useSupabaseData.ts:): Obtención y gestión de una copia separada de los datos.
  - [`src/App.tsx`](src/App.tsx:14): Consumo masivo del estado y "prop drilling" a componentes hijos.
- **Justificación:** Este diseño viola varios principios fundamentales de la arquitectura de software:
  - **Principio de Responsabilidad Única (SRP):** El hook `useAppState` tiene docenas de responsabilidades no relacionadas (UI, autenticación, datos, formularios).
  - **Principio de Segregación de Interfaces (ISP):** Los componentes se ven obligados a depender de un "contrato" de estado masivo, incluso si solo necesitan una pequeña parte de él.
  - **Don't Repeat Yourself (DRY):** La lógica de gestión de estado para las mismas entidades (leads, chats) se repite en diferentes hooks.
- **Solución Propuesta:** Desmantelar el hook `useAppState` y adoptar una estrategia de gestión de estado más granular y cohesiva.
  1.  **Eliminar `useAppState`:** Su funcionalidad debe ser distribuida.
  2.  **Centralizar la Obtención de Datos:** Utilizar una librería de gestión de estado de servidor como **React Query (TanStack Query)**. Esta librería se encargará de la obtención, el almacenamiento en caché, la sincronización en segundo plano y las mutaciones de todos los datos de Supabase. Esto reemplazará la lógica manual en `useSupabaseData` y `useGlobalCache`.
  3.  **Crear Contextos de React Específicos por Dominio:** Para el estado de UI que es genuinamente global (ej. `darkMode`, `showModal`), se pueden crear contextos pequeños y específicos. Por ejemplo, un `ThemeContext` y un `ModalContext`.
  4.  **Refactorizar Componentes:** Los componentes ya no recibirán props masivas. En su lugar, consumirán los datos directamente desde el hook de React Query (`useQuery`) o el contexto específico que necesiten.
- **Ejemplo de Código:**

  **Antes (En `App.tsx`):**

  ```tsx
  const { chats, selectChat, ...muchasMasProps } = useAppState();

  // ...

  <ChatsPage chats={chats} selectChat={selectChat} {...muchasMasProps} />;
  ```

  **Después (En `ChatsPage.tsx` o un componente contenedor):**

  ```tsx
  // 1. Hook para obtener los chats con React Query
  import { useQuery } from '@tanstack/react-query';
  import { getConversationsWithDetails } from '@/lib/supabase-functions';

  const useChats = () => {
    return useQuery({
      queryKey: ['chats'],
      queryFn: getConversationsWithDetails,
      // Opciones de staleTime, cacheTime, etc.
    });
  };

  // 2. En el componente, sin prop drilling
  const ChatsPage = () => {
    const { data: chats, isLoading, error } = useChats();
    // La lógica de selección de chat (selectChat) se manejaría localmente
    // o con un estado de URL.

    if (isLoading) return <div>Cargando...</div>;
    if (error) return <div>Error: {error.message}</div>;

    // ... renderizar la página con los datos de 'chats'
  };
  ```

### 2.2. "Prop Drilling" Excesivo y Lógica de Rutas Repetitiva

- **Problema:** El estado global obtenido del hook `useAppState` se pasa explícitamente a través de múltiples capas de componentes como props. Además, la lógica para proteger cada ruta se repite para casi todas las rutas de la aplicación.
- **Impacto:** **Alto**.
  - **Mantenibilidad:** Refactorizar o cambiar la forma de un dato requiere modificar cada componente intermedio en la cadena de props, incluso si no usan el dato. Es un proceso tedioso y propenso a errores.
  - **Legibilidad:** El código de los componentes se ve saturado con la recepción y reenvío de props, lo que oculta su verdadera responsabilidad.
  - **Reusabilidad:** Los componentes están fuertemente acoplados a la estructura de props que reciben, lo que los hace difíciles de reutilizar en otros contextos.
- **Ubicación:**
  - [`src/App.tsx:87-107`](src/App.tsx:87): El componente `ChatsPage` recibe un gran número de props que probablemente solo reenvía a sus hijos.
  - [`src/App.tsx:73-126`](src/App.tsx:73): La estructura `<Route element={isAuthenticated ? <Componente /> : <Navigate to="/auth" />}>` se repite para cada ruta protegida.
- **Justificación:**
  - **Acoplamiento:** El "prop drilling" crea un fuerte acoplamiento entre componentes padres e hijos.
  - **Violación de DRY (Don't Repeat Yourself):** La lógica de autenticación para las rutas se copia y pega en lugar de ser abstraída.
- **Solución Propuesta:**
  1.  **Eliminar el "Prop Drilling":** Como se mencionó en el punto 2.1, adoptar una herramienta como React Query y contextos específicos por dominio permitirá que los componentes que necesitan datos los consuman directamente, eliminando la necesidad de pasar props a través de intermediarios.
  2.  **Crear un Componente de Ruta Protegida (Layout Route):** Abstraer la lógica de protección de rutas en un componente reutilizable. Se puede crear un componente `ProtectedRoute` que verifique el estado de autenticación y, si es exitoso, renderice el componente hijo (o un `Outlet` de `react-router-dom`), y si no, redirija al usuario.
- **Ejemplo de Código:**

  **Antes (En `App.tsx`):**

  ```tsx
  <Route
    path="/dashboard"
    element={
      isAuthenticated ? <DashboardPage darkMode={darkMode} /> : <Navigate to="/auth" />
    }
  />
  <Route
    path="/leads"
    element={isAuthenticated ? <LeadsPage darkMode={darkMode} /> : <Navigate to="/auth" />}
  />
  ```

  **Después (Creando `ProtectedRoute.tsx` y usándolo en `App.tsx`):**

  ```tsx
  // 1. Crear el componente ProtectedRoute.tsx
  import { Navigate, Outlet } from 'react-router-dom';
  import { useAuth } from '@/hooks/useAuth'; // Un nuevo hook específico para autenticación

  const ProtectedRoute = () => {
    const { isAuthenticated } = useAuth(); // Consume de un AuthContext dedicado

    if (!isAuthenticated) {
      return <Navigate to="/auth" replace />;
    }

    return <Outlet />; // Renderiza el componente hijo de la ruta
  };

  // 2. Usarlo en App.tsx para simplificar las rutas
  <Routes>
    <Route path="/auth" element={<AuthPage />} />
    <Route path="/auth/callback" element={<AuthCallbackPage />} />

    {/* Rutas Protegidas */}
    <Route element={<ProtectedRoute />}>
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/leads" element={<LeadsPage />} />
      <Route path="/chats" element={<ChatsPage />} />
      {/* ...otras rutas protegidas */}
    </Route>

    <Route path="/" element={<Navigate to="/dashboard" />} />
  </Routes>;
  ```

## 3. Optimización de Rendimiento

### 3.1. Transformaciones de Datos No Memorizadas y Potencialmente Peligrosas

- **Problema:** En el hook `useSupabaseData`, las funciones que transforman los datos brutos de la API a formatos compatibles con la UI (`getChatsFromConversations`, `getLeadsFormatted`, etc.) se ejecutan en cada renderizado del componente que consume el hook. Además, la función `getLeadsFormatted` realiza una conversión de tipo insegura de un `string` (UUID) a `number`.
- **Impacto:** **Medio**.
  - **Rendimiento:** Aunque el impacto puede ser bajo con pocos datos, esta práctica no escala. Con cientos o miles de leads/conversaciones, recalcular estas transformaciones en cada render puede causar una degradación notable del rendimiento y una experiencia de usuario lenta.
  - **Bugs Potenciales:** La conversión `parseInt(lead.id)` es una bomba de tiempo. Los UUIDs de Supabase no son números y esta conversión fallará o, peor aún, podría producir colisiones de ID si los primeros caracteres de dos UUIDs diferentes son numéricamente iguales, llevando a bugs muy difíciles de depurar.
- **Ubicación:**
  - [`src/hooks/useSupabaseData.ts:90-158`](src/hooks/useSupabaseData.ts:90): Funciones de transformación de datos.
  - [`src/hooks/useSupabaseData.ts:144`](src/hooks/useSupabaseData.ts:144): Conversión insegura de `id`.
- **Justificación:**
  - **Eficiencia Computacional:** Se realizan cálculos redundantes en cada render. La memorización (caching de los resultados de una función) es una técnica estándar para evitar este tipo de trabajo innecesario.
  - **Seguridad de Tipos:** El código no respeta los tipos de datos definidos por la base de datos, introduciendo un punto de fallo. Los identificadores deben ser tratados como cadenas opacas en todo el sistema.
- **Solución Propuesta:**
  1.  **Memorizar las Transformaciones:** Envolver las funciones de transformación con el hook `useMemo` de React. Esto asegurará que la transformación solo se vuelva a calcular si los datos de entrada (ej. `conversations`, `leads`) cambian.
  2.  **Corregir el Tipo de ID:** Eliminar la conversión `parseInt(lead.id)`. La aplicación debe ser refactorizada para manejar los IDs de los leads como `string` en todo momento, de acuerdo con el esquema de la base de datos. Esto puede requerir la actualización de tipos y la lógica en componentes como `KanbanCard`, `LeadModal`, etc.
- **Ejemplo de Código:**

  **Antes (En `useSupabaseData.ts`):**

  ```tsx
  // ...
  const getLeadsFormatted = () => {
    return leads.map(lead => ({
      id: parseInt(lead.id), // ❌ INSEGURO Y NO MEMORIZADO
      // ...
    }));
  };

  return {
    // ...
    leadsFormatted: getLeadsFormatted(),
  };
  ```

  **Después (En `useSupabaseData.ts`):**

  ```tsx
  import { useMemo } from 'react';
  // ...

  // ...
  const leadsFormatted = useMemo(() => {
    return leads.map(lead => ({
      id: lead.id, // ✅ SEGURO: Se mantiene como string
      // ...
    }));
  }, [leads]); // ✅ MEMORIZADO: Solo se recalcula si 'leads' cambia

  return {
    // ...
    leadsFormatted, // Se devuelve el valor memorizado
  };
  ```

## 4. Seguridad

### 4.1. Políticas de Seguridad a Nivel de Fila (RLS) Inseguras

- **Problema:** Las políticas de RLS de Supabase están configuradas de manera que permiten el acceso no autorizado a los datos.
  1.  **Acceso Anónimo Total:** El rol `anon` tiene permisos de lectura (`SELECT`) para las tablas `leads`, `conversations` y `messages` con una política de `USING (true)`. Esto significa que cualquier persona con la URL de la API y la clave anónima (que son públicas) puede descargar todos los datos de estas tablas.
  2.  **Falta de Aislamiento de Datos (Multi-Tenancy):** Las políticas para el rol `authenticated` también usan `USING (true)`, lo que permite que un usuario autenticado pueda leer, actualizar y eliminar los datos pertenecientes a **todos los demás usuarios** de la plataforma.
- **Impacto:** **Crítico**.
  - **Exposición de Datos:** Riesgo masivo de fuga de datos. Toda la información de los leads y las conversaciones es públicamente accesible.
  - **Violación de Privacidad:** Un usuario malintencionado puede acceder y manipular los datos de otros usuarios.
  - **Incumplimiento Normativo:** Esto podría violar normativas de protección de datos como GDPR.
- **Ubicación:**
  - [`supabase/migrations/20250708010000_fix_anon_rls_policies.sql`](supabase/migrations/20250708010000_fix_anon_rls_policies.sql:): Define las políticas permisivas para el rol `anon`.
  - [`supabase/migrations/20250708003320_optimize_rls_policies.sql`](supabase/migrations/20250708003320_optimize_rls_policies.sql:): Define las políticas sin aislamiento para el rol `authenticated`.
- **Justificación:** La seguridad a nivel de fila es la principal línea de defensa en una arquitectura que expone una API de base de datos directamente al cliente como lo hace Supabase. La configuración actual anula por completo esta defensa. Aunque el fichero de migración menciona que es una solución temporal para un MVP, es una vulnerabilidad que nunca debería llegar a un entorno, ni siquiera de staging.
- **Solución Propuesta:** Reescribir por completo las políticas de RLS para implementar un modelo de "denegación por defecto" y aislamiento estricto de datos.
  1.  **Añadir `user_id` a las Tablas:** Asegurarse de que todas las tablas que contienen datos de usuario (como `leads`, `conversations`, etc.) tengan una columna `user_id` que referencie al propietario del registro.
  2.  **Políticas para Autenticados:** Implementar políticas estrictas que comparen el `user_id` del registro con el `uid()` del usuario autenticado.
  3.  **Políticas para Anónimos:** Eliminar las políticas de `USING (true)` para el rol `anon`. Los usuarios anónimos no deberían tener acceso de lectura a los datos de la aplicación. El flujo de la aplicación debe garantizar que las solicitudes de datos solo se realicen _después_ de que el usuario se haya autenticado correctamente.
- **Ejemplo de Código:**

  **Antes (En `..._fix_anon_rls_policies.sql`):**

  ```sql
  CREATE POLICY "leads_select_anon" ON public.leads
      FOR SELECT TO anon
      USING (true); -- ❌ PERMITE A CUALQUIERA LEER TODOS LOS LEADS
  ```

  **Antes (En `..._optimize_rls_policies.sql`):**

  ```sql
  CREATE POLICY "leads_select_authenticated" ON public.leads
      FOR SELECT TO authenticated
      USING (true); -- ❌ PERMITE A UN USUARIO LEER LOS LEADS DE OTROS
  ```

  **Después (Nueva migración de seguridad):**

  ```sql
  -- 1. Eliminar las políticas inseguras para anon
  DROP POLICY IF EXISTS "leads_select_anon" ON public.leads;
  -- (Repetir para todas las tablas y políticas de anon)

  -- 2. Recrear políticas seguras para usuarios autenticados
  -- Asumiendo que la tabla 'leads' tiene una columna 'user_id'
  CREATE POLICY "leads_select_own_data" ON public.leads
      FOR SELECT TO authenticated
      USING (auth.uid() = user_id); -- ✅ SOLO PERMITE LEER LOS DATOS PROPIOS

  CREATE POLICY "leads_insert_own_data" ON public.leads
      FOR INSERT TO authenticated
      WITH CHECK (auth.uid() = user_id); -- ✅ SOLO PERMITE INSERTAR DATOS PROPIOS

  -- (Repetir para UPDATE, DELETE y para todas las demás tablas)
  ```

## 5. Calidad del Código y Mantenibilidad

### 5.1. Problema de Rendimiento N+1 en la Obtención de Datos

- **Problema:** La función `SupabaseService.getConversationsWithLastMessage` obtiene una lista de conversaciones y luego, dentro de un bucle (`Promise.all(conversations.map(...))`), ejecuta una nueva consulta a la base de datos por cada conversación para obtener su último mensaje. Esto se conoce como el problema de consulta "N+1".
- **Impacto:** **Alto**.
  - **Rendimiento:** El número de consultas a la base de datos escala linealmente con el número de conversaciones. Si un usuario tiene 100 conversaciones, se ejecutarán 101 consultas (1 para las conversaciones + 100 para los mensajes). Esto degrada severamente el rendimiento, aumenta la carga en la base de datos y puede agotar los recursos del servidor rápidamente.
  - **Escalabilidad:** La función no es escalable y se convertirá en un cuello de botella importante a medida que crezca la cantidad de datos.
- **Ubicación:**
  - [`src/lib/supabase.ts:216-252`](src/lib/supabase.ts:216)
- **Justificación:** Este patrón es uno de los anti-patrones de acceso a datos más conocidos. Las bases de datos relacionales están optimizadas para operaciones basadas en conjuntos. Realizar múltiples consultas pequeñas en lugar de una única consulta más compleja pero eficiente es casi siempre una mala práctica.
- **Solución Propuesta:** Refactorizar la obtención de datos para usar una única consulta SQL o una función RPC (Remote Procedure Call) en Supabase que obtenga tanto las conversaciones como el último mensaje de cada una de forma conjunta. Se puede usar una `LATERAL JOIN` o una subconsulta con `ROW_NUMBER()` para lograr esto de manera eficiente.
- **Ejemplo de Código:**

  **Antes (En `supabase.ts`):**

  ```typescript
  // ...
  const conversationsWithMessages = await Promise.all(
    conversations?.map(async conv => {
      // <-- Bucle que causa el N+1
      const { data: messages } = await supabase
        .from('messages')
        .select('text, created_at, sender_type')
        .eq('conversation_id', conv.id) // <-- Consulta por cada conversación
        .order('created_at', { ascending: false })
        .limit(1);

      return {
        ...conv,
        lastMessage: messages?.[0] || null,
      };
    }) || [],
  );
  ```

  **Después (Usando una función RPC en Supabase):**

  ```sql
  -- 1. Crear una función RPC en una nueva migración de Supabase
  CREATE OR REPLACE FUNCTION get_conversations_with_last_message()
  RETURNS TABLE (
    -- Columnas de la tabla 'conversations'
    id uuid,
    lead_id uuid,
    -- ... etc
    -- Columnas del último mensaje
    last_message_text text,
    last_message_created_at timestamptz
  ) AS $$
  BEGIN
    RETURN QUERY
    SELECT
      c.*,
      m.text AS last_message_text,
      m.created_at AS last_message_created_at
    FROM
      conversations c
    LEFT JOIN LATERAL (
      SELECT
        msg.text,
        msg.created_at
      FROM
        messages msg
      WHERE
        msg.conversation_id = c.id
      ORDER BY
        msg.created_at DESC
      LIMIT 1
    ) m ON true;
  END;
  $$ LANGUAGE plpgsql;
  ```

  ```typescript
  // 2. Llamar a la función RPC desde el código
  static async getConversationsWithLastMessage() {
    const { data, error } = await supabase.rpc('get_conversations_with_last_message');
    if (error) throw error;
    return data;
  }
  ```

### 5.2. Uso Innecesario de Clase para Servicios Estáticos

- **Problema:** El fichero `supabase.ts` define una `SupabaseService` class que solo contiene métodos estáticos. Esto es un anti-patrón en JavaScript/TypeScript moderno, ya que la clase se usa simplemente como un objeto para agrupar funciones, no para instanciar objetos.
- **Impacto:** **Bajo**.
  - **Calidad de Código:** No es un error funcional, pero va en contra de las prácticas idiomáticas de la comunidad. Puede ser confuso para nuevos desarrolladores y añade una capa de indirección innecesaria (`SupabaseService.getLeads()` en lugar de `getLeads()`).
- **Ubicación:**
  - [`src/lib/supabase.ts:67`](src/lib/supabase.ts:67)
- **Justificación:** Las clases en la programación orientada a objetos están destinadas a ser planos para crear objetos que encapsulan estado y comportamiento. Cuando una clase solo tiene métodos estáticos, no se aprovecha ninguna de estas características. Un módulo de ES6 (un fichero) ya proporciona un mecanismo nativo y más simple para agrupar funciones relacionadas.
- **Solución Propuesta:** Refactorizar el fichero para exportar las funciones directamente.
- **Ejemplo de Código:**

  **Antes (En `supabase.ts`):**

  ```typescript
  export class SupabaseService {
    static async getLeads() {
      // ...
    }
    static async getLeadById(id: string) {
      // ...
    }
  }
  ```

  **Después (En `supabase.ts`):**

  ```typescript
  // Se elimina la clase y se exportan las funciones directamente
  export const getLeads = async () => {
    // ...
  };
  export const getLeadById = async (id: string) => {
    // ...
  };
  ```

---

## 6. Hoja de Ruta (Roadmap) de Refactorización

Se propone la siguiente hoja de ruta para abordar los problemas identificados, priorizando el impacto y las dependencias entre tareas.

### Fase 1: Correcciones Críticas de Seguridad y Rendimiento (Prioridad Inmediata)

- **Objetivo:** Sellar las vulnerabilidades de seguridad más graves y solucionar el cuello de botella de rendimiento más significativo. Estas acciones son prerrequisitos para una base estable.
- **Tareas:**
  1.  **Reescribir Políticas RLS (Ref. 4.1):**
      - Añadir la columna `user_id` a las tablas relevantes.
      - Implementar políticas RLS estrictas para `authenticated` (`auth.uid() = user_id`).
      - Eliminar las políticas de acceso para el rol `anon`.
  2.  **Solucionar Consulta N+1 (Ref. 5.1):**
      - Crear la función RPC `get_conversations_with_last_message` en Supabase.
      - Refactorizar el código del cliente para usar esta función RPC en lugar del bucle `Promise.all`.

### Fase 2: Refactorización Arquitectónica Central

- **Objetivo:** Desmantelar los anti-patrones centrales (`God Hook`, "prop drilling") y establecer una arquitectura de gestión de estado escalable y mantenible.
- **Tareas:**
  1.  **Integrar React Query (TanStack Query):**
      - Añadir la dependencia al proyecto.
      - Configurar el `QueryClientProvider` en el nivel superior de la aplicación.
  2.  **Desmantelar `useAppState` (Ref. 2.1):**
      - Migrar toda la lógica de obtención de datos de `useSupabaseData` y `useGlobalCache` a hooks de React Query (`useQuery`, `useMutation`).
      - Crear contextos específicos para el estado de UI global (ej. `ThemeContext` para `darkMode`).
  3.  **Refactorizar Componentes para Usar React Query:**
      - Eliminar el "prop drilling" masivo. Los componentes ahora obtendrán sus datos directamente con los nuevos hooks de React Query.
  4.  **Implementar Rutas Protegidas (Ref. 2.2):**
      - Crear el componente `ProtectedRoute` y `useAuth` (que consumirá el estado de autenticación de Supabase, ahora gestionado por su propio hook/contexto).
      - Simplificar la configuración de rutas en `App.tsx`.
  5.  **Corregir Manejo de IDs (Ref. 3.1):**
      - A lo largo de la refactorización, asegurarse de que todos los IDs se manejen como `string`, eliminando todas las llamadas a `parseInt(id)`.

### Fase 3: Mejora de Calidad de Código y Optimizaciones Finales

- **Objetivo:** Abordar los problemas restantes de calidad de código y aplicar optimizaciones de rendimiento secundarias.
- **Tareas:**
  1.  **Refactorizar `SupabaseService` (Ref. 5.2):**
      - Eliminar la clase y exportar las funciones de servicio directamente. Actualizar todas las llamadas en la aplicación.
  2.  **Memorizar Transformaciones de Datos (Ref. 3.1):**
      - En los nuevos hooks de React Query, usar `useMemo` o el selector `select` de `useQuery` para realizar las transformaciones de datos de manera eficiente.
  3.  **Auditoría Final de Estilo y Consistencia:**
      - Realizar una pasada final por el código para asegurar que las nuevas estructuras se usan de manera consistente en toda la aplicación.

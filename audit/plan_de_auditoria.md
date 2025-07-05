# Plan de Auditoría de Código Exhaustivo

## 1. Objetivo

El objetivo principal de esta auditoría es realizar un análisis integral y detallado del estado actual del código base del proyecto. Se busca identificar, documentar y priorizar todos los posibles defectos, áreas de mejora, código obsoleto o redundante, y oportunidades de optimización. El resultado final de la implementación de los hallazgos de esta auditoría debe ser un código más limpio, mantenible, seguro y con un rendimiento superior.

## 2. Metodología

La auditoría se llevará a cabo en tres fases principales:

1.  **Análisis Estático Automatizado:** Utilización de herramientas para detectar problemas comunes de forma automática (calidad del código, dependencias no usadas, duplicación).
2.  **Revisión Manual Detallada:** Inspección manual del código por áreas clave, centrándose en la arquitectura, lógica de negocio y patrones de diseño.
3.  **Análisis de Rendimiento en Tiempo de Ejecución:** Profiling de la aplicación para detectar cuellos de botella en el rendimiento, tanto en el frontend como en las interacciones con el backend.

## 3. Áreas Clave de la Auditoría

### 3.1. Calidad y Consistencia del Código

- **Linting y Formato:** Verificar que la configuración de ESLint y Prettier se aplique de forma consistente en todo el proyecto. Identificar y listar todos los archivos que no cumplan las reglas.
- **Convenciones de Nomenclatura:** Asegurar que se sigan convenciones consistentes para archivos, componentes (`PascalCase`), funciones/variables (`camelCase`), y tipos.
- **Comentarios y TODOs:** Revisar todos los comentarios `// TODO:`, `// FIXME:` o similares para evaluar su vigencia y convertirlos en tareas accionables. Evaluar la calidad y necesidad de los comentarios existentes.

### 3.2. Arquitectura de Componentes (React)

- **Granularidad y Reusabilidad:** Analizar los componentes en `src/components` para identificar aquellos que son demasiado grandes y violan el Principio de Responsabilidad Única. Proponer su división en componentes más pequeños y reutilizables.
- **Props Drilling:** Detectar cadenas de propiedades que se pasan a través de múltiples niveles de componentes. Evaluar si es más adecuado usar React Context, Zustand o Jotai para gestionar ese estado global o compartido.
- **Memoización:** Revisar el uso de `React.memo`, `useMemo` y `useCallback` para prevenir re-renders innecesarios, especialmente en componentes complejos como los de las listas (`LeadsList.tsx`) y el kanban (`LeadsKanban.tsx`).

### 3.3. Gestión de Estado

- **Hooks Personalizados:** Analizar en profundidad los hooks de estado como [`useAppState.ts`](src/hooks/useAppState.ts:1) y [`useGlobalCache.ts`](src/hooks/useGlobalCache.ts:1). Determinar si la estrategia de estado global es cohesiva y eficiente o si introduce complejidad innecesaria.
- **Sincronización de Estado:** Evaluar cómo se sincroniza el estado entre diferentes partes de la aplicación (ej. entre los filtros y las listas).

### 3.4. Rendimiento y Optimización

- **Tamaño del Bundle:** Analizar el bundle de producción con herramientas como `vite-plugin-bundle-analyzer` para identificar las dependencias que más contribuyen al tamaño final.
- **Lazy Loading:** Implementar `React.lazy` para las páginas en [`src/pages/`](src/pages/:1) y para componentes pesados que no son visibles inicialmente.
- **Virtualización de Listas:** Para componentes como [`MessageList.tsx`](src/components/Chat/MessageList.tsx:1) y [`LeadsListNew.tsx`](src/components/Leads/LeadsListNew.tsx:1), evaluar la implementación de librerías de virtualización (como `react-window` o `tanstack-virtual`) si se espera manejar grandes volúmenes de datos.

### 3.5. Gestión de Dependencias

- **Dependencias Obsoletas:** Ejecutar `npm outdated` para listar todas las dependencias que no están en su última versión y evaluar los riesgos y beneficios de actualizarlas.
- **Dependencias No Utilizadas:** Utilizar `depcheck` para identificar paquetes instalados en [`package.json`](package.json:1) que no se están importando en ningún lugar del código.

### 3.6. Detección de Código Duplicado (Principio DRY)

- **Lógica de Utilidades:** Revisar la carpeta [`src/utils/`](src/utils/:1) en busca de funciones que podrían ser genéricas y reutilizadas en más lugares.
- **Lógica de Componentes:** Analizar componentes con funcionalidades similares, como [`ChatSidebarFilters.tsx`](src/components/Chat/ChatSidebarFilters.tsx:1) y [`LeadsFilters.tsx`](src/components/Leads/LeadsFilters.tsx:1), para extraer lógica de filtrado común a un hook o utilidad reutilizable.
- **Uso de Herramientas:** Emplear herramientas como `jscpd` para un análisis automatizado de duplicación de código.

### 3.7. Estilos y CSS

- **Consistencia de Tailwind CSS:** Revisar el uso de clases de Tailwind y la configuración en [`tailwind.config.js`](tailwind.config.js:1). Minimizar el uso de CSS personalizado en archivos como [`src/styles/kanban.css`](src/styles/kanban.css:1) y favorecer la configuración de Tailwind o el uso de clases JIT.
- **CSS No Utilizado:** Analizar los archivos CSS en busca de selectores y clases que ya no se aplican a ningún componente.

### 3.8. Interacción con Supabase (Seguridad y Rendimiento)

- **Seguridad (RLS):** **Punto crítico.** Auditar que todas las tablas de Supabase expuestas al cliente tengan políticas de Row Level Security (RLS) activadas y correctamente configuradas para evitar fugas de datos.
- **Rendimiento de Queries:** Revisar todas las llamadas a Supabase (ej. en [`useSupabaseData.ts`](src/hooks/useSupabaseData.ts:1)) para asegurar que sean eficientes. Verificar que se use `select()` para traer solo los campos necesarios.
- **Exposición de Claves:** Asegurarse de que ninguna clave de servicio (`service_role`) esté expuesta en el código del cliente. Todas las operaciones privilegiadas deben realizarse a través de Supabase Functions.

### 3.9. Tipado (TypeScript)

- **Consistencia y Precisión:** Revisar el archivo [`src/types/index.ts`](src/types/index.ts:1). ¿Son los tipos precisos? ¿Se corresponden con el esquema de la base de datos?
- **Uso de `any`:** Realizar una búsqueda global de `any` y reemplazarlo por tipos más específicos siempre que sea posible.

### 3.10. Estructura de Archivos y Obsolescencia

- **Archivos Obsoletos:** **Punto crítico.** Investigar la existencia de componentes duplicados con el sufijo "New":
  - [`LeadsFilters.tsx`](src/components/Leads/LeadsFilters.tsx:1) vs [`LeadsFiltersNew.tsx`](src/components/Leads/LeadsFiltersNew.tsx:1)
  - [`LeadsHeader.tsx`](src/components/Leads/LeadsHeader.tsx:1) vs [`LeadsHeaderNew.tsx`](src/components/Leads/LeadsHeaderNew.tsx:1)
  - [`LeadsKanban.tsx`](src/components/Leads/LeadsKanban.tsx:1) vs [`LeadsKanbanNew.tsx`](src/components/Leads/LeadsKanbanNew.tsx:1)
  - [`LeadsList.tsx`](src/components/Leads/LeadsList.tsx:1) vs [`LeadsListNew.tsx`](src/components/Leads/LeadsListNew.tsx:1)
    El plan debe proponer la unificación y eliminación de las versiones antiguas.
- **Archivos Públicos:** Revisar la carpeta `public` en busca de assets que ya no se utilicen.

## 4. Herramientas Recomendadas

- **Análisis de Código:** ESLint, Prettier, `jscpd`.
- **Análisis de Dependencias:** `npm outdated`, `depcheck`.
- **Análisis de Bundle:** `vite-plugin-bundle-analyzer`.
- **Profiling de Rendimiento:** React Developer Tools Profiler, Lighthouse.

## 5. Entregables de la Auditoría

1.  **Informe de Auditoría (este documento expandido):** Un documento en Markdown que detalle todos los hallazgos, clasificados por área y priorizados por impacto y urgencia.
2.  **Listado de Tareas Accionables:** Una lista de tareas (que pueden ser convertidas a tickets en un sistema de gestión de proyectos) con una descripción clara del problema y la solución propuesta para cada hallazgo.

## 6. Plan de Ejecución y Próximos Pasos

1.  **Fase 1 (1-2 días):** Configuración de herramientas y ejecución de los análisis automatizados.
2.  **Fase 2 (3-5 días):** Revisión manual detallada de cada una de las áreas clave mencionadas.
3.  **Fase 3 (1 día):** Consolidación de todos los hallazgos en el informe final de auditoría.
4.  **Fase 4:** Reunión de presentación de resultados y planificación del sprint o ciclo de refactorización para abordar los problemas identificados.

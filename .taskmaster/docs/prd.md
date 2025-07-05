# PRD: Auditoría y Refactorización Integral del Código

## 1. Resumen del Proyecto

Este proyecto consiste en realizar una auditoría completa del código base para identificar y planificar la corrección de defectos, la eliminación de código obsoleto/redundante y la implementación de optimizaciones de rendimiento y seguridad.

## 2. Objetivos

- Realizar un análisis estático y manual del código.
- Identificar problemas de calidad, rendimiento, seguridad y mantenibilidad.
- Proponer un plan de acción claro para la refactorización.
- El objetivo final es tener un código base más robusto, seguro y optimizado.

## 3. Requisitos Clave (Áreas de Auditoría)

### 3.1. Calidad y Consistencia del Código

- **Requisito 1.1:** Asegurar la aplicación consistente de ESLint y Prettier.
- **Requisito 1.2:** Estandarizar las convenciones de nomenclatura.
- **Requisito 1.3:** Revisar y procesar todos los comentarios TODO/FIXME.

### 3.2. Arquitectura de Componentes (React)

- **Requisito 2.1:** Refactorizar componentes monolíticos en componentes más pequeños y reutilizables.
- **Requisito 2.2:** Eliminar el "prop drilling" mediante un gestor de estado o Context API.
- **Requisito 2.3:** Aplicar técnicas de memoización (`React.memo`, `useMemo`, `useCallback`) para optimizar renders.

### 3.3. Gestión de Estado

- **Requisito 3.1:** Auditar los hooks de estado personalizados (`useAppState`, `useGlobalCache`) para evaluar su eficiencia.
- **Requisito 3.2:** Garantizar una sincronización de estado coherente en toda la aplicación.

### 3.4. Rendimiento y Optimización

- **Requisito 4.1:** Analizar y reducir el tamaño del bundle de producción.
- **Requisito 4.2:** Implementar lazy loading para páginas y componentes pesados.
- **Requisito 4.3:** Considerar la virtualización para listas con grandes volúmenes de datos.

### 3.5. Gestión de Dependencias

- **Requisito 5.1:** Actualizar dependencias obsoletas.
- **Requisito 5.2:** Eliminar dependencias no utilizadas del `package.json`.

### 3.6. Código Duplicado (DRY)

- **Requisito 6.1:** Centralizar la lógica de utilidades duplicada.
- **Requisito 6.2:** Abstraer la lógica común de componentes similares en hooks reutilizables.

### 3.7. Estilos y CSS

- **Requisito 7.1:** Maximizar el uso de Tailwind CSS y minimizar el CSS personalizado.
- **Requisito 7.2:** Purgar CSS no utilizado.

### 3.8. Interacción con Supabase

- **Requisito 8.1 (Crítico):** Auditar y aplicar políticas de Row Level Security (RLS) en todas las tablas.
- **Requisito 8.2:** Optimizar las queries a Supabase para mejorar el rendimiento.
- **Requisito 8.3:** Asegurar que no haya claves de servicio (`service_role`) expuestas en el cliente.

### 3.9. Tipado (TypeScript)

- **Requisito 9.1:** Mejorar la precisión de los tipos en `src/types/index.ts`.
- **Requisito 9.2:** Eliminar el uso de `any` y reemplazarlo con tipos específicos.

### 3.10. Estructura de Archivos y Obsolescencia

- **Requisito 10.1 (Crítico):** Investigar, unificar y eliminar los componentes duplicados con el sufijo "New" (ej. `LeadsList.tsx` vs `LeadsListNew.tsx`).
- **Requisito 10.2:** Limpiar assets no utilizados de la carpeta `public`.

## 4. Plan de Ejecución General

1.  **Fase 1:** Análisis automatizado y configuración de herramientas.
2.  **Fase 2:** Revisión manual detallada por áreas.
3.  **Fase 3:** Consolidación de hallazgos y creación de tareas de refactorización.
4.  **Fase 4:** Ejecución de las tareas de refactorización.

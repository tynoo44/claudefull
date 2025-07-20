# Plan de Refactorización Integral: Setter AI

Basado en el informe de auditoría del 2025-07-20, este documento detalla el plan de acción para refactorizar la aplicación, priorizando la corrección de errores, la robustez y la mantenibilidad para uso personal.

## Estrategia General

La refactorización se ejecutará en fases, ordenadas por dificultad y riesgo ascendente, para construir una base sólida antes de abordar cambios arquitectónicos complejos.

1.  **Fase 0: Preparación y Cimientos (Riesgo: Muy Bajo)** - Establecer una red de seguridad (pruebas) y realizar cambios de bajo impacto.
2.  **Fase 1: Optimizaciones Contenidas (Riesgo: Bajo a Medio)** - Solucionar problemas de rendimiento claros y aislados.
3.  **Fase 2: Refactorización Arquitectónica Central (Riesgo: Alto)** - Desmantelar los anti-patrones de gestión de estado y reconstruir la arquitectura.
4.  **Fase 3: Consolidación y Limpieza (Riesgo: Medio)** - Endurecer la base de datos y validar la nueva arquitectura con pruebas.

## Diagrama del Plan

```mermaid
graph TD
    subgraph Fase 0: Preparación y Bajo Riesgo
        A[1. Instalar y Configurar Vitest] --> B[2. Refactorizar SupabaseService];
    end

    subgraph Fase 1: Optimizaciones Contenidas
        B --> C[3. Solucionar Consulta N+1 con RPC];
        C --> D[4. Optimizar UI con Virtualización y Paginación];
    end

    subgraph Fase 2: Refactorización Arquitectónica Central
        D --> E[5. Integrar TanStack Query (React Query)];
        E --> F[6. Crear Contextos de UI Específicos];
        F --> G[7. Implementar Rutas Protegidas];
        G --> H[8. Migrar Componentes a React Query y eliminar Prop Drilling];
        H --> I[9. Eliminar Hooks Obsoletos];
    end

    subgraph Fase 3: Consolidación y Limpieza
        I --> J[10. Corregir Políticas RLS y Esquema DB];
        J --> K[11. Escribir Pruebas para la Nueva Arquitectura];
    end

    style A fill:#d4edda,stroke:#155724
    style B fill:#d4edda,stroke:#155724
    style C fill:#fff3cd,stroke:#856404
    style D fill:#fff3cd,stroke:#856404
    style E fill:#f8d7da,stroke:#721c24
    style F fill:#f8d7da,stroke:#721c24
    style G fill:#f8d7da,stroke:#721c24
    style H fill:#f8d7da,stroke:#721c24
    style I fill:#f8d7da,stroke:#721c24
    style J fill:#d1ecf1,stroke:#0c5460
    style K fill:#d1ecf1,stroke:#0c5460
```

---

## Fases Detalladas

### **Fase 0: Preparación y Cimientos (Riesgo: Muy Bajo)**

**Objetivo:** Establecer una red de seguridad y realizar cambios de bajo riesgo que mejoren la calidad del código sin alterar la lógica de negocio.

**Tarea 1: Implementar un Framework de Pruebas (Vitest)**

- **Justificación:** Esencial para validar la refactorización y prevenir regresiones.
- **Acciones:**
  1.  Instalar `vitest`, `@testing-library/react`, `jsdom`.
  2.  Configurar `vite.config.ts` para las pruebas.
  3.  Crear un test de ejemplo para una función de utilidad para confirmar que el entorno funciona.

**Tarea 2: Refactorizar `SupabaseService` a Funciones Puras (Ref. 5.2)**

- **Justificación:** Cambio idiomático de bajo riesgo que mejora la legibilidad y elimina un anti-patrón.
- **Acciones:**
  1.  Modificar `src/lib/supabase.ts` para exportar cada método como una función individual.
  2.  Realizar una búsqueda y reemplazo global para actualizar todas las llamadas.

---

### **Fase 1: Optimizaciones Contenidas y Correcciones (Riesgo: Bajo a Medio)**

**Objetivo:** Abordar problemas de rendimiento claros y aislados.

**Tarea 3: Solucionar Consulta N+1 (Ref. 5.1)**

- **Justificación:** Soluciona el problema de rendimiento más grave de la aplicación de forma contenida.
- **Acciones:**
  1.  Crear una migración en Supabase para la función RPC `get_conversations_with_last_message()`.
  2.  Modificar el código cliente para llamar a este nuevo RPC.
  3.  Escribir un test de integración para la nueva función.

**Tarea 4: Optimizar la Interfaz de Usuario (Virtualización y Paginación)**

- **Justificación:** Prevenir cuelgues del navegador con grandes volúmenes de datos.
- **Acciones:**
  1.  **Virtualización del Chat:** Implementar `@tanstack/react-virtual` en `MessageList.tsx`.
  2.  **Paginación de Datos:** Refactorizar los hooks de obtención de listas para usar `.range()` de Supabase y añadir UI de "Cargar más".

---

### **Fase 2: Refactorización Arquitectónica Central (Riesgo: Alto)**

**Objetivo:** Desmantelar los anti-patrones centrales y establecer una arquitectura de gestión de estado escalable.

**Tarea 5: Integrar TanStack Query (React Query) (Ref. 2.1)**

- **Justificación:** Pilar de la nueva arquitectura para el estado del servidor.
- **Acciones:**
  1.  Instalar `@tanstack/react-query`.
  2.  Envolver la aplicación en `QueryClientProvider`.

**Tarea 6: Crear Contextos de UI Específicos (Ref. 2.1)**

- **Justificación:** Separar el estado de UI del estado del servidor.
- **Acciones:**
  1.  Identificar estado de UI en `useAppState` (ej. `darkMode`).
  2.  Crear contextos específicos (ej. `ThemeContext`).

**Tarea 7: Implementar Rutas Protegidas (Ref. 2.2)**

- **Justificación:** Eliminar lógica de autenticación repetitiva.
- **Acciones:**
  1.  Crear un `AuthContext` para la sesión de Supabase.
  2.  Crear el componente `ProtectedRoute`.
  3.  Refactorizar `<Routes>` en `App.tsx`.

**Tarea 8: Migración Progresiva de Componentes a React Query (Ref. 2.1, 3.1)**

- **Justificación:** El corazón de la refactorización, a realizar de forma incremental.
- **Acciones (por dominio):**
  1.  Crear hooks `useQuery` (ej. `useLeadsQuery`).
  2.  Usar `select` o `useMemo` para transformaciones de datos.
  3.  Refactorizar componentes para usar los nuevos hooks y eliminar props.
  4.  Asegurar que los IDs se manejen como `string`.

**Tarea 9: Eliminar Hooks y Estado Obsoletos (Ref. 2.1)**

- **Justificación:** Consolidar la nueva arquitectura.
- **Acciones:**
  1.  Eliminar `useAppState.ts`, `useSupabaseData.ts`, y `useGlobalCache.ts` una vez que no tengan dependencias.

---

### **Fase 3: Consolidación y Limpieza (Riesgo: Medio)**

**Objetivo:** Endurecer la base de datos y validar el trabajo realizado.

**Tarea 10: Corregir Políticas RLS y Esquema de Base de Datos (Ref. 4.1)**

- **Justificación:** Aplicar buenas prácticas de seguridad y completar el esquema de la BD.
- **Acciones:**
  1.  Crear una nueva migración SQL.
  2.  Añadir columna `user_id` donde sea necesario.
  3.  Implementar políticas RLS estrictas (`auth.uid() = user_id`).
  4.  Añadir índices y claves foráneas faltantes.

**Tarea 11: Escribir Pruebas para la Nueva Arquitectura**

- **Justificación:** Validar el éxito de la refactorización y proteger contra regresiones.
- **Acciones:**
  1.  Escribir tests de integración para los hooks de React Query.
  2.  Escribir tests unitarios para la lógica de transformación de datos.
  3.  Escribir tests para componentes clave.

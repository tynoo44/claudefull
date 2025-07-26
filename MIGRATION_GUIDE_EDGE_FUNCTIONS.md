# Guía de Migración a Edge Functions de Supabase

## Estructura de Edge Functions

```
supabase/functions/
├── function-name/
│   └── index.ts          # Punto de entrada de la función
├── shared/               # Código compartido entre funciones
│   ├── utils.ts          # Utilidades comunes (CORS, etc.)
│   ├── types.ts          # Tipos TypeScript compartidos
│   └── database-client.ts # Cliente de base de datos
```

## Pasos para crear una nueva Edge Function

### 1. Crear la función

```bash
# Crear nueva función
supabase functions new my-function
```

### 2. Estructura básica de una Edge Function

```typescript
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../shared/utils.ts';

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Tu lógica aquí
    
    return new Response(
      JSON.stringify({ success: true }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
```

### 3. Autenticación en Edge Functions

```typescript
// Obtener token de autorización
const authHeader = req.headers.get('Authorization');

// Crear cliente con contexto de usuario
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  global: {
    headers: {
      Authorization: authHeader,
    },
  },
});

// Verificar usuario
const { data: { user }, error } = await supabase.auth.getUser();
if (error || !user) {
  return new Response(
    JSON.stringify({ error: 'Unauthorized' }),
    { status: 401, headers: corsHeaders }
  );
}
```

### 4. Llamar Edge Functions desde el frontend

```typescript
// Ejemplo de llamada a Edge Function
const { data, error } = await supabase.functions.invoke('function-name', {
  body: {
    param1: 'value1',
    param2: 'value2',
  },
});

if (error) {
  console.error('Error:', error);
} else {
  console.log('Response:', data);
}
```

## Variables de entorno

Las Edge Functions tienen acceso a:
- `SUPABASE_URL` - URL de tu proyecto
- `SUPABASE_ANON_KEY` - Clave anónima
- `SUPABASE_SERVICE_ROLE_KEY` - Clave de servicio (uso cuidadoso)
- Variables personalizadas definidas en el dashboard

## Despliegue

```bash
# Desplegar una función específica
supabase functions deploy function-name

# Desplegar todas las funciones
supabase functions deploy
```

## Mejores prácticas

1. **Manejo de CORS**: Siempre incluir headers CORS
2. **Validación**: Validar todos los inputs
3. **Autenticación**: Verificar usuario cuando sea necesario
4. **Errores**: Manejar errores con mensajes descriptivos
5. **Logs**: Usar `console.log` para debugging (visible en dashboard)
6. **Tipos**: Definir interfaces para requests/responses
7. **Código compartido**: Usar carpeta `shared/` para reutilizar código

## Migración desde APIs externas

### Antes (Webhook externo):
```typescript
const response = await fetch('https://external-api.com/webhook', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ data }),
});
```

### Después (Edge Function):
```typescript
const { data, error } = await supabase.functions.invoke('my-function', {
  body: { data },
});
```

## Debugging

1. Ver logs en el dashboard de Supabase
2. Usar `supabase functions serve` para desarrollo local
3. Probar con Postman/Insomnia usando el endpoint:
   ```
   https://<project-ref>.supabase.co/functions/v1/<function-name>
   ```

## Ejemplos implementados

- `/send-message` - Proxy autenticado hacia webhook n8n (no toca base de datos)
- `/example-api` - Ejemplo completo con autenticación y manejo de errores
- `/ai-response` - Generación de respuestas AI
- `/get-google-calendar-events-v2` - Integración con Google Calendar

### Función send-message

Esta función actúa como un proxy autenticado hacia n8n:

```typescript
// Verifica autenticación con Supabase
const { data: { user }, error } = await supabase.auth.getUser();

// Reenvía a n8n con datos adicionales
const n8nResponse = await fetch(n8nWebhookUrl, {
  method: 'POST',
  body: JSON.stringify({
    instagram_id,
    message,
    conversation_id,
    user_id: user.id,
    timestamp: new Date().toISOString(),
  }),
});

// Retorna la respuesta de n8n al cliente
return new Response(JSON.stringify({
  success: true,
  n8n_response: n8nData,
}));
```
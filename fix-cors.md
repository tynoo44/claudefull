# Solución CORS para Supabase

## Opción 1: Forzar Puerto 5173 (YA IMPLEMENTADO)
```bash
# 1. Detener servidor actual
Ctrl+C

# 2. Verificar puerto libre
lsof -i :5173

# 3. Si está ocupado, matar proceso
kill -9 <PID>

# 4. Iniciar servidor
npm run dev
```

## Opción 2: Actualizar CORS en Supabase Dashboard

1. Ir a: https://app.supabase.com/project/awyslztbkykhjhhykacf/settings/api
2. En la sección "CORS Settings"
3. Agregar estos orígenes permitidos:
   - http://localhost:5173
   - http://localhost:5174
   - http://localhost:5175
4. Guardar cambios

## Opción 3: Proxy en Vite (Solución Local)

Si no tienes acceso al dashboard de Supabase, actualiza `vite.config.ts`:

```typescript
export default defineConfig({
  // ... existing config
  server: {
    proxy: {
      '/supabase': {
        target: 'https://awyslztbkykhjhhykacf.supabase.co',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/supabase/, ''),
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            proxyReq.setHeader('apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3eXNsenRia3lraGpoaHlrYWNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxNzEyNjEsImV4cCI6MjA2NTc0NzI2MX0.chmGUF4NxbsE8D3tujYzDC7Xm0zEQP7j6_L0VGrqyVc');
          });
        },
      },
    },
  },
});
```

Y actualizar el cliente Supabase para usar el proxy en desarrollo.

## Verificación
Después de aplicar cualquier solución, deberías ver:
- Sin errores CORS en la consola
- Las conversaciones cargan correctamente
- Network tab muestra respuestas 200 OK
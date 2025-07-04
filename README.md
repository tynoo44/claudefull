# SetterAI - CRM Vertical para Appointment Setters

SetterAI es una plataforma SaaS completa diseñada específicamente para appointment setters profesionales que trabajan con coaches, consultores y agencias de alto ticket. Combina gestión de leads, mensajería unificada y herramientas de productividad en una sola interfaz.

## 🚀 Características Principales

- **🔐 Autenticación Completa** - Login con Google OAuth y email/contraseña via Supabase
- **📊 Dashboard en Tiempo Real** - KPIs y métricas actualizadas desde Supabase
- **💬 Chat Unificado** - Interfaz de mensajería con integración de plantillas
- **👥 Gestión de Leads** - CRM completo con estados, etiquetas, notas y procedencia
- **📝 Sistema de Plantillas** - Mensajes reutilizables con variables y tracking
- **🌓 Modo Oscuro/Claro** - Interfaz adaptable a preferencias del usuario

## 📋 Prerrequisitos

- Node.js 18+ 
- NPM o Yarn
- Cuenta de Supabase con proyecto configurado

## 🛠️ Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/setterai.git
cd setterai
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crear archivo `.env.local` en la raíz del proyecto:

```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_anon_key_de_supabase
```

### 4. Configurar Supabase

#### Google OAuth
1. Ir a Supabase Dashboard → Authentication → Providers
2. Habilitar Google provider
3. Configurar OAuth credentials desde Google Cloud Console
4. Agregar URLs de redirección:
   - `http://localhost:5173/auth/callback` (desarrollo)
   - `https://tudominio.com/auth/callback` (producción)

#### Base de datos
Ejecutar las siguientes migraciones en el SQL Editor de Supabase:

```sql
-- Habilitar RLS en todas las tablas
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;

-- Agregar columna procedence a leads (si no existe)
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS procedence TEXT CHECK (procedence IN ('Outbound', 'Inbound', 'CTA'));

-- Políticas básicas de lectura para usuarios autenticados
CREATE POLICY "Users can read own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can read leads" ON public.leads
  FOR SELECT USING (auth.role() = 'authenticated');

-- Agregar más políticas según necesidades
```

### 5. Iniciar el servidor de desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

## 🏗️ Arquitectura

### Stack Tecnológico
- **Frontend**: React 19 + TypeScript + Vite
- **Estilos**: Tailwind CSS 3 con soporte dark mode
- **Base de datos**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth con Google OAuth
- **Iconos**: Lucide React
- **Routing**: React Router DOM

### Estructura del Proyecto

```
src/
├── components/           # Componentes reutilizables
│   ├── Layout/          # GlobalNavbar, Modal
│   ├── Chat/            # Componentes modulares de chat
│   │   ├── ChatHeader.tsx    # Header con procedencia y status
│   │   ├── LeadInfoModal.tsx # Modal de información del lead
│   │   └── ...          # Otros componentes de chat
│   └── Leads/           # Componentes de gestión de leads
│       ├── LeadsFilters.tsx  # Filtros con procedencia
│       ├── LeadModal.tsx     # Modal de leads
│       └── ...          # Otros componentes de leads
├── pages/               # Páginas de la aplicación
│   ├── AuthPage.tsx     # Login/registro
│   ├── DashboardPage.tsx # Panel principal
│   ├── ChatsPage.tsx    # Interfaz de mensajería
│   ├── LeadsPage.tsx    # Gestión de leads con procedencia
│   └── TemplatesPage.tsx # Plantillas de mensajes
├── hooks/               # Custom hooks
│   ├── useAppState.ts   # Estado global con autenticación
│   └── useSupabaseData.ts # Integración datos Supabase
├── lib/                 # Servicios y configuración
│   ├── supabase.ts      # Cliente Supabase con tipos Lead
│   ├── auth.ts          # Servicio de autenticación
│   └── supabase-functions.ts # Funciones de datos
├── types/               # Definiciones TypeScript
└── styles/              # Estilos globales
```

## 📱 Funcionalidades Detalladas

### Sistema de Autenticación
- Login con Google OAuth
- Registro y login con email/contraseña
- Gestión de sesiones persistentes
- Protección de rutas privadas
- Perfil de usuario en navbar

### Dashboard
- Métricas en tiempo real desde Supabase
- 92 leads activos
- 406 mensajes enviados
- Tasa de respuesta 73%
- Enlaces rápidos a funciones principales

### Gestión de Leads
- CRUD completo (Crear, Leer, Actualizar, Eliminar)
- Estados personalizables (Open, Conectar y Cualificar, etc.)
- Sistema de procedencia (Outbound, Inbound, CTA)
- Sistema de etiquetas
- Notas y seguimiento
- Búsqueda y filtros avanzados con procedencia

### Sistema de Plantillas
- Categorías dinámicas
- Variables personalizables
- Tracking de uso
- Favoritos
- Integración con chat

### Chat Unificado
- Columnas redimensionables
- Lista de conversaciones
- Vista de chat principal
- Barra lateral de plantillas
- Asistente IA (próximamente)

## 🚀 Comandos Disponibles

```bash
# Desarrollo
npm run dev          # Servidor de desarrollo con HMR

# Producción
npm run build        # Build optimizado para producción
npm run preview      # Preview del build de producción

# Calidad de código
npm run lint         # Verificación de tipos TypeScript
```

## 🔧 Configuración Adicional

### Variables de Entorno

```env
# Supabase (Requerido)
VITE_SUPABASE_URL=https://tuproyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key

# Opcionales (futuras integraciones)
VITE_OPENAI_API_KEY=tu_api_key_openai
VITE_WHATSAPP_TOKEN=tu_token_whatsapp
```

### Políticas de Seguridad (RLS)

Es importante configurar las políticas RLS apropiadas para cada tabla. Ejemplo básico:

```sql
-- Política para que usuarios solo vean sus propios leads
CREATE POLICY "Users can manage own leads" ON public.leads
  FOR ALL USING (user_id = auth.uid());

-- Política para mensajes de conversaciones propias
CREATE POLICY "Users can view own messages" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      JOIN public.leads l ON c.lead_id = l.id
      WHERE c.id = messages.conversation_id
      AND l.user_id = auth.uid()
    )
  );
```

## 📝 Guía de Desarrollo

### Convenciones de Código
- **Idioma**: UI en español, código y comentarios en inglés
- **Componentes**: Functional components con TypeScript
- **Estado**: Hooks de React y estado global con useAppState
- **Estilos**: Tailwind CSS con clases condicionales para dark mode
- **Datos**: Siempre usar Supabase, no datos mock

### Patrón de Componentes CRUD

```typescript
// Ejemplo de componente con CRUD
const [showModal, setShowModal] = useState(false);
const [editingItem, setEditingItem] = useState<Item | null>(null);

const handleSave = async () => {
  try {
    if (editingItem) {
      await SupabaseService.updateItem(editingItem.id, formData);
    } else {
      await SupabaseService.createItem(formData);
    }
    await refetchData();
    setShowModal(false);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### Dark Mode

Siempre incluir clases condicionales:

```typescript
className={`${
  darkMode 
    ? 'bg-gray-900 text-white' 
    : 'bg-white text-gray-900'
}`}
```

## 🐛 Solución de Problemas Comunes

### Error: "Missing Supabase environment variables"
- Verificar que `.env.local` existe y contiene las variables correctas
- Reiniciar el servidor de desarrollo después de cambiar variables de entorno

### Error: "RLS policy violation"
- Verificar que el usuario está autenticado
- Revisar las políticas RLS en Supabase Dashboard
- Asegurarse de que las políticas permiten la operación deseada

### Google OAuth no funciona
- Verificar configuración en Google Cloud Console
- Confirmar URLs de redirección en Supabase
- Revisar logs en Supabase Dashboard → Logs → Auth

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama para feature (`git checkout -b feature/NuevaFuncionalidad`)
3. Commit cambios (`git commit -m 'Agrega nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/NuevaFuncionalidad`)
5. Abrir Pull Request

### Estándares de Código
- Mantener archivos bajo 500 líneas
- Modularizar componentes grandes
- Incluir tipos TypeScript
- Probar en modo claro y oscuro
- Verificar responsividad

## 📄 Licencia

Este proyecto está bajo la Licencia ISC. Ver archivo `LICENSE` para más detalles.

## 🙏 Agradecimientos

- Equipo de Supabase por la excelente plataforma
- Comunidad de React por las herramientas y recursos
- Todos los appointment setters que inspiraron esta herramienta

---

**SetterAI** - Transformando la forma en que los appointment setters gestionan su trabajo diario. 🚀
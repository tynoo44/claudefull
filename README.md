# SetterAI - Plataforma de Appointment Setting

Una plataforma SaaS completa para appointment setters y gestión de leads, desarrollada con React y TypeScript.

## 🚀 Inicio Rápido

### Instalación

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Construir para producción
npm run build

# Vista previa de la construcción
npm run preview
```

### Estructura del Proyecto

```
src/
├── components/           # Componentes reutilizables
│   └── Layout/          # Componentes de diseño (Navbar, Modal)
├── pages/               # Páginas de la aplicación
├── hooks/               # Custom hooks (useAppState)
├── types/               # Definiciones de TypeScript
├── data/                # Datos de ejemplo
├── styles/              # Estilos globales
└── utils/               # Utilidades (pendiente)
```

## 🛠️ Tecnologías

- **React 19** - Framework principal
- **TypeScript** - Tipado estático
- **Tailwind CSS 3** - Estilos utilitarios
- **Vite 5** - Build tool y dev server
- **Lucide React** - Iconos
- **React Router DOM** - Navegación (preparado)

## 📱 Funcionalidades

### Implementadas
- ✅ **Autenticación** - Página de login con múltiples opciones
- ✅ **Dashboard** - KPIs, métricas y acciones rápidas
- ✅ **Chats** - Interfaz de mensajería con plantillas de IA
- ✅ **Navegación** - Navbar global con modo oscuro
- ✅ **Estado global** - Hook personalizado para gestión de estado

### En desarrollo
- 🚧 **Gestión de Leads** - CRM con vista lista/kanban
- 🚧 **Plantillas** - Gestión de mensajes predefinidos
- 🚧 **Calendario** - Programación de citas
- 🚧 **Analíticas** - Métricas de rendimiento
- 🚧 **Configuración** - Ajustes de usuario

## 🎨 Diseño

- **Modo oscuro/claro** - Cambio dinámico de tema
- **Responsive** - Diseño adaptativo para móviles y escritorio
- **Componentización** - Arquitectura modular y reutilizable

## 📝 Scripts Disponibles

- `npm run dev` - Servidor de desarrollo
- `npm run build` - Construcción para producción
- `npm run lint` - Verificación de tipos TypeScript
- `npm run preview` - Vista previa de la construcción

## 🤝 Contribución

1. Mantener la estructura de componentes establecida
2. Seguir las convenciones de TypeScript
3. Usar Tailwind CSS para estilos
4. Probar en modo oscuro y claro
5. Mantener la responsividad

## 📄 Licencia

ISC
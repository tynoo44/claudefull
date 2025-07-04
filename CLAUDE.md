# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SetterAI is a comprehensive React-based SaaS application for appointment setting and lead management. It's designed as a CRM vertical specifically for "Appointment Setters" - professionals who convert initial contacts into scheduled meetings. The application combines productivity tools, unified communication, and AI assistance in a single interface.

**Key Business Context**: This is a specialized CRM for appointment setters working with high-ticket coaches, consultants, and agencies. The application focuses on the initial sales funnel stages (lead qualification → appointment scheduling) rather than full customer lifecycle management.

## Architecture & Structure

### Modern React Architecture
- **Framework**: React 19 with TypeScript and Vite 5
- **Architecture**: Modular component-based SPA with React Router and Supabase integration
- **Build System**: Vite for fast development and optimized production builds
- **Styling**: Tailwind CSS 3 with dark mode support
- **Database**: Supabase with real-time data integration

### File Structure
```
src/
├── components/
│   └── Layout/
│       ├── GlobalNavbar.tsx     # Main navigation component with React Router
│       └── Modal.tsx            # Reusable modal component
├── pages/
│   ├── AuthPage.tsx             # Login/authentication
│   ├── DashboardPage.tsx        # KPI overview with real Supabase data
│   ├── ChatsPage.tsx            # Real-time messaging with Supabase
│   ├── LeadsPage.tsx            # Complete CRUD lead management
│   ├── TemplatesPage.tsx        # Template system with usage tracking
│   └── CalendarPage.tsx         # Calendar (omitted per user request)
├── hooks/
│   ├── useAppState.ts           # Global state management hook
│   └── useSupabaseData.ts       # Supabase data integration hook
├── lib/
│   └── supabase.ts              # Supabase client and service functions
├── types/
│   └── index.ts                 # TypeScript type definitions
├── data/
│   └── sampleData.ts            # Legacy sample data (minimal usage)
├── styles/
│   └── globals.css              # Global styles and Tailwind imports
└── main.tsx                     # Application entry point
```

### State Management Pattern
Combines local state management with Supabase real-time data:

```typescript
// Global application state
const {
  darkMode, isAuthenticated, selectedChat, selectedLead, selectedTemplate,
  // Actions
  toggleDarkMode, login, logout, selectChat, selectLead
} = useAppState();

// Real-time Supabase data
const { dashboardStats, chats, leads, templatesFormatted } = useSupabaseData();
```

### Component Organization
- **Layout Components**: `GlobalNavbar`, `Modal` - Persistent UI elements with React Router
- **Page Components**: Complete CRUD interfaces for leads, templates, and messaging
- **Custom Hooks**: `useAppState` for global state, `useSupabaseData` for backend integration
- **Service Layer**: `SupabaseService` with comprehensive CRUD operations

### Database Schema
Supabase tables with optimized structure:
- **leads**: Lead information with status, notes, tags (migrated status from conversations)
- **conversations**: Chat threads linked to leads
- **messages**: Individual messages with sender type and timestamps
- **message_templates**: Reusable message templates with usage tracking

## Development Commands

```bash
# Start development server
npm run dev

# Build for production  
npm run build

# Type checking
npm run lint

# Preview production build
npm run preview
```

## Development Guidelines

### Code Conventions
- **Language**: Spanish for UI labels and user-facing text
- **TypeScript**: Strict typing with proper interfaces
- **Styling**: Tailwind CSS with dark mode support (`dark:` prefix)
- **Icons**: Lucide React icon library
- **Components**: Functional components with TypeScript interfaces
- **Data**: Real Supabase data throughout (no mock data)

### Key Patterns to Follow

#### 1. Adding New Pages with React Router
```typescript
// 1. Create page component in src/pages/
// 2. Add route to App.tsx
<Route path="/newpage" element={
  isAuthenticated ? (
    <NewPage darkMode={darkMode} />
  ) : (
    <Navigate to="/auth" />
  )
} />

// 3. Add navigation item to GlobalNavbar.tsx
{ id: 'newpage', label: 'Nueva Página', icon: IconName, path: '/newpage' }
```

#### 2. Supabase Integration
```typescript
// Use SupabaseService for all data operations
const leads = await SupabaseService.getLeads();
const newLead = await SupabaseService.createLead(leadData);
const updatedLead = await SupabaseService.updateLead(id, updates);
await SupabaseService.deleteLead(id);

// Real-time data with useSupabaseData hook
const { dashboardStats, chats, leads, templatesFormatted } = useSupabaseData();
```

#### 3. CRUD Operations Pattern
```typescript
// Standard CRUD modal pattern
const [showModal, setShowModal] = useState(false);
const [editingItem, setEditingItem] = useState<Item | null>(null);
const [newItem, setNewItem] = useState(initialState);

const handleAdd = async () => {
  const created = await SupabaseService.createItem(newItem);
  setItems(prev => [created, ...prev]);
  setShowModal(false);
  resetForm();
};

const handleEdit = async () => {
  const updated = await SupabaseService.updateItem(editingItem.id, newItem);
  setItems(prev => prev.map(item => item.id === editingItem.id ? updated : item));
  setShowModal(false);
  resetForm();
};
```

#### 4. Dark Mode Support
```typescript
// Always include dark mode conditional classes
className={`${
  darkMode 
    ? 'bg-gray-900 text-white border-gray-700' 
    : 'bg-gray-50 text-gray-900 border-gray-200'
}`}
```

### UI/UX Patterns

#### Responsive Grid Layouts
- Dashboard: 4-column KPI cards with real metrics, then 2-column grid
- Chats: 3-column layout (chat list, active chat, templates) with real messages
- Leads: Grid layout with comprehensive CRUD modals
- Templates: Card-based layout with usage statistics and favorites

#### Component Styling Standards
- Cards: `bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm`
- Buttons: Primary buttons use blue-600, secondary use gray
- Forms: Consistent spacing with `space-y-4` for form groups
- Icons: Lucide React with consistent sizing (16-20px for UI, 24px for features)
- Modals: Full-screen overlay with form validation and error handling

## Application Features

### ✅ Fully Implemented (Production Ready)
- **Authentication**: Login page with Google OAuth and guest access
- **Dashboard**: Real KPI metrics from Supabase (92 leads, 406 messages, etc.)
- **Lead Management**: Complete CRUD with status tracking, notes, tags, and search
- **Template System**: Full CRUD with categories, usage tracking, favorites, and variables
- **Chat Interface**: Real-time messaging with Supabase integration and template insertion
- **Global Navigation**: React Router with responsive navbar and dark mode
- **Database Integration**: Optimized Supabase schema with status migration

### 🚧 Calendar Features (Omitted)
- Calendar and appointment scheduling intentionally omitted per user requirements
- Related appointment functionality disabled but code structure maintained

### AI Integration Points (Active)
- Template suggestions in chat interface
- Template usage analytics and conversion tracking
- Message template variables and personalization
- Performance insights from real usage data

### Business Logic
- **Lead Status**: 'open', 'Follow UP', 'Conectar y Cualificar', 'Situación Actual', 'Situación Deseada'
- **Template Categories**: Dynamic categories from database ('Apertura', 'Seguimiento', 'Objeciones', 'Cierre')
- **Message Flow**: Real conversation threads with sender type tracking
- **Usage Analytics**: Template usage counts and performance metrics

## Working with the Codebase

### Adding New Features
1. **Follow Supabase-first approach** - All data comes from database
2. **Use TypeScript interfaces** - Define props and data types properly  
3. **Implement CRUD patterns** - Follow established modal and service patterns
4. **Test dark mode compatibility** - All UI elements support both themes
5. **Maintain responsive design** - Test on different screen sizes
6. **Preserve Spanish language** - Keep UI labels and user-facing text in Spanish

### Data Flow Understanding
- **Frontend State**: Minimal local state with React hooks
- **Backend Integration**: Supabase for all persistent data
- **Real-time Updates**: Live data synchronization where applicable
- **Service Layer**: Centralized API calls through SupabaseService
- **Type Safety**: Full TypeScript coverage with proper interfaces

### Adding New CRUD Operations
```typescript
// 1. Add method to SupabaseService
static async createItem(itemData: Omit<Item, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('items')
    .insert([itemData])
    .select()
    .single();
  
  if (error) throw error;
  return data as Item;
}

// 2. Use in component with error handling
try {
  const newItem = await SupabaseService.createItem(itemData);
  setItems(prev => [newItem, ...prev]);
} catch (error) {
  console.error('Error creating item:', error);
  alert('Error al crear el elemento');
}
```

### Styling Approach
- **Tailwind CSS**: Use utility classes consistently
- **Dark mode**: Always include conditional `dark:` classes
- **Responsive**: Use `md:`, `lg:` prefixes for breakpoints
- **Components**: Reuse CRUD modal patterns and form styles
- **Loading States**: Implement proper loading spinners and skeletons

## Current Status & Achievements

### ✅ Recently Completed (Production Implementation)
- **Complete Supabase Integration**: All mock data eliminated, real database throughout
- **CRUD Operations**: Full Create, Read, Update, Delete for leads and templates
- **Database Optimization**: Migrated status column from conversations to leads
- **Real-time Messaging**: Functional chat system with message persistence
- **Template Management**: Advanced template system with usage tracking and variables
- **Search & Filtering**: Comprehensive search and filter capabilities
- **Type Safety**: Complete TypeScript coverage with proper error handling
- **UI/UX Polish**: Professional interface with dark mode and responsive design

### 📊 Database Metrics (Real Data)
- **92 Leads** with Instagram integration and status tracking
- **406 Messages** across multiple conversation threads  
- **Active Templates** with usage statistics and conversion tracking
- **Optimized Schema** with proper indexing and relationships

### 🔧 Technical Implementation
- **React Router**: Full URL-based navigation
- **Supabase Service**: Comprehensive API layer with error handling
- **Modal System**: Reusable CRUD modals with form validation
- **State Management**: Efficient combination of local and global state
- **Performance**: Optimized queries and real-time data synchronization

### 🎯 Business Value Delivered
- **Functional CRM**: Complete lead management workflow
- **Template Library**: Reusable message templates with analytics
- **Communication Hub**: Real-time messaging with conversation history
- **Data-Driven Insights**: Usage metrics and performance tracking
- **Professional UI**: Dark mode, responsive design, Spanish localization

### Next Enhancement Opportunities
1. **Advanced Analytics**: Conversion funnel analysis and performance dashboards
2. **Notification System**: Real-time alerts and activity notifications
3. **Export Functionality**: Data export capabilities for leads and conversations
4. **Advanced Search**: Full-text search across messages and templates
5. **User Management**: Multi-user support and permissions system

### Performance Considerations
- **Code Splitting**: Implemented with Vite and React Router
- **Database Optimization**: Indexed queries and efficient data fetching
- **Bundle Size**: Optimized builds with tree shaking
- **Development Experience**: Fast HMR with Vite dev server
- **Error Handling**: Comprehensive error boundaries and user feedback
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SetterAI is a comprehensive React-based SaaS application for appointment setting and lead management. It's designed as a CRM vertical specifically for "Appointment Setters" - professionals who convert initial contacts into scheduled meetings. The application combines productivity tools, unified communication, and AI assistance in a single interface.

**Key Business Context**: This is a specialized CRM for appointment setters working with high-ticket coaches, consultants, and agencies. The application focuses on the initial sales funnel stages (lead qualification → appointment scheduling) rather than full customer lifecycle management.

## Architecture & Structure

### Modern React Architecture
- **Framework**: React 19 with TypeScript and Vite 5
- **Architecture**: Modular component-based SPA with proper separation of concerns
- **Build System**: Vite for fast development and optimized production builds
- **Styling**: Tailwind CSS 3 with dark mode support

### File Structure
```
src/
├── components/
│   └── Layout/
│       ├── GlobalNavbar.tsx     # Main navigation component
│       └── Modal.tsx            # Reusable modal component
├── pages/
│   ├── AuthPage.tsx             # Login/authentication
│   ├── DashboardPage.tsx        # KPI overview and metrics
│   ├── ChatsPage.tsx            # Message management with AI suggestions
│   └── [Other pages TBD]       # LeadsPage, TemplatesPage, etc.
├── hooks/
│   └── useAppState.ts           # Global state management hook
├── types/
│   └── index.ts                 # TypeScript type definitions
├── data/
│   └── sampleData.ts            # Sample data for development
├── styles/
│   └── globals.css              # Global styles and Tailwind imports
└── main.tsx                     # Application entry point
```

### State Management Pattern
Uses a custom hook (`useAppState`) for centralized state management:

```typescript
// Core application state
const {
  currentPage, darkMode, isAuthenticated,
  selectedChat, selectedLead, selectedTemplate,
  leads, chats, templates, appointments,
  // Actions
  setCurrentPage, toggleDarkMode, login, logout,
  selectChat, selectLead, updateLead, addLead
} = useAppState();
```

### Component Organization
- **Layout Components**: `GlobalNavbar`, `Modal` - Persistent UI elements
- **Page Components**: `AuthPage`, `DashboardPage`, `ChatsPage` - Main application views
- **Custom Hooks**: `useAppState` - State management and business logic

### Data Structure
Sample data is organized in TypeScript interfaces:
- **Template**: Message templates with categories, tone, and usage stats
- **Lead**: Customer data with status, stage, and tags  
- **Chat**: Conversation history and messages
- **Appointment**: Calendar events and scheduling

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

### Key Patterns to Follow

#### 1. Adding New Pages
```typescript
// 1. Create page component in src/pages/
// 2. Add to App.tsx routing
{currentPage === 'newpage' && <NewPage {...props} />}

// 3. Add navigation item to GlobalNavbar.tsx
{ id: 'newpage' as Page, label: 'Nueva Página', icon: IconName }
```

#### 2. State Management
```typescript
// Use the useAppState hook for global state
const { currentPage, setCurrentPage, darkMode } = useAppState();

// For local component state, use useState
const [localState, setLocalState] = useState(initialValue);
```

#### 3. Dark Mode Support
```typescript
// Always include dark mode conditional classes
className={`${
  darkMode 
    ? 'bg-gray-900 text-white border-gray-700' 
    : 'bg-gray-50 text-gray-900 border-gray-200'
}`}
```

#### 4. Component Props Interface
```typescript
interface ComponentProps {
  darkMode: boolean;
  // Add other required props
  onAction: () => void;
}

export const Component: React.FC<ComponentProps> = ({ darkMode, onAction }) => {
  // Component implementation
};
```

### UI/UX Patterns

#### Responsive Grid Layouts
- Dashboard: 4-column KPI cards, then 2-column grid
- Chats: 3-column layout (chat list, active chat, templates)
- Leads: Flexible list/kanban view switching (when implemented)

#### Component Styling Standards
- Cards: `bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm`
- Buttons: Primary buttons use blue-600, secondary use gray
- Forms: Consistent spacing with `space-y-4` for form groups
- Icons: Lucide React with consistent sizing (16-20px for UI, 24px for features)

## Application Features

### Currently Implemented
- ✅ **Authentication**: Login page with Google OAuth and guest access
- ✅ **Dashboard**: KPI overview, quick actions, sales funnel, recent activity
- ✅ **Chat Interface**: 3-column layout with message history and templates
- ✅ **Global Navigation**: Responsive navbar with dark mode toggle
- ✅ **State Management**: Centralized state with custom hook

### In Development (Placeholder Pages)
- 🚧 **Lead Management**: CRM with list/kanban views
- 🚧 **Template System**: Message template management
- 🚧 **Calendar**: Appointment scheduling
- 🚧 **Analytics**: Performance tracking and metrics
- 🚧 **Settings**: User configuration and preferences

### AI Integration Points (Planned)
- Template suggestions in chat interface
- Message generation with customizable tone
- Performance analytics and insights
- Script import functionality (converts scripts to templates)

### Business Logic
- **Lead Stages**: 'open' → 'qualify' → 'interested' → 'appointment' → 'closed'
- **Template Categories**: 'Apertura', 'Seguimiento', 'Objeciones', 'Cierre'
- **Priority System**: 'high', 'medium', 'low' for both leads and tasks

## Working with the Codebase

### Adding New Features
1. **Follow modular structure** - Create components in appropriate folders
2. **Use TypeScript interfaces** - Define props and data types properly
3. **Test dark mode compatibility** - All UI elements should support both themes
4. **Maintain responsive design** - Test on different screen sizes
5. **Preserve Spanish language** - Keep UI labels and user-facing text in Spanish

### Data Flow Understanding
- Global state managed through `useAppState` custom hook
- Local component state using standard React `useState`
- Sample data defined in `src/data/sampleData.ts`
- No persistence layer - data resets on page refresh

### Adding New Components
```typescript
// 1. Create component file in appropriate folder
// src/components/Feature/ComponentName.tsx

// 2. Define TypeScript interface
interface ComponentNameProps {
  darkMode: boolean;
  // other props
}

// 3. Export component with proper typing
export const ComponentName: React.FC<ComponentNameProps> = (props) => {
  // Implementation
};
```

### Styling Approach
- **Tailwind CSS**: Use utility classes consistently
- **Dark mode**: Always include conditional `dark:` classes
- **Responsive**: Use `md:`, `lg:` prefixes for breakpoints
- **Components**: Reuse common patterns from existing components

## Current Status & Next Steps

### Recently Completed (Refactoring)
- ✅ **Modular Architecture**: Broke down monolithic file into organized components
- ✅ **TypeScript Setup**: Added proper typing throughout the application
- ✅ **Build System**: Configured Vite with Tailwind CSS
- ✅ **State Management**: Created centralized state management hook
- ✅ **Component Structure**: Organized components, pages, hooks, and types

### Immediate Next Steps
1. **Complete remaining pages**: LeadsPage, TemplatesPage, CalendarPage, etc.
2. **Add React Router**: Implement proper URL-based routing
3. **Modal system**: Implement reusable modal components
4. **Form components**: Create reusable form elements
5. **Data persistence**: Add localStorage or API integration

### Technical Debt to Address
- **Error boundaries**: Add React error boundaries
- **Loading states**: Implement loading spinners and skeletons
- **Form validation**: Add input validation and error handling
- **Testing**: Set up Jest and React Testing Library
- **Accessibility**: Improve ARIA labels and keyboard navigation

### Performance Considerations
- **Code splitting**: Already set up with Vite
- **Lazy loading**: Ready to implement for routes
- **Bundle optimization**: Configured through Vite
- **Development experience**: Fast HMR with Vite dev server
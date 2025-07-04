import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Users, 
  BarChart3, 
  Settings, 
  Search, 
  Filter,
  Plus,
  Moon,
  Sun,
  Send,
  Sparkles,
  Clock,
  CheckCircle,
  X,
  ChevronRight,
  Star,
  Trash2,
  Edit3,
  Copy,
  Target,
  TrendingUp,
  AlertCircle,
  Calendar,
  Tag,
  MoreVertical,
  Globe,
  ArrowUp,
  FileText,
  Upload,
  Bell,
  Home,
  LogOut,
  User,
  Shield,
  Link,
  Brain,
  ChevronDown,
  Move,
  Eye,
  Grid,
  List,
  Save,
  Import,
  DollarSign,
  BarChart,
  LineChart,
  PieChart,
  TrendingDown,
  Activity,
  UserPlus,
  MessageCircle,
  CheckSquare,
  UserCheck
} from 'lucide-react';

const SetterAI = () => {
  const [currentPage, setCurrentPage] = useState('auth');
  const [darkMode, setDarkMode] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showModal, setShowModal] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // Para Leads: 'list' o 'kanban'
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedChat, setSelectedChat] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [message, setMessage] = useState('');
  const [showAISuggestion, setShowAISuggestion] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Sample data
  const templates = [
    {
      id: 'FU24',
      name: 'FU 24',
      content: 'Buenas! Paso por aquí para subirte el chat, por si se te había enterrado',
      category: 'Seguimiento',
      tone: 'Directo',
      variables: 'Ninguna',
      uses: 5,
      conversionRate: 15,
      isFavorite: true
    },
    {
      id: 'INTRO1',
      name: 'Introducción Cálida',
      content: 'Hola {nombre}! Vi tu perfil y me pareció muy interesante lo que haces en {nicho}...',
      category: 'Apertura',
      tone: 'Amigable',
      variables: 'nombre, nicho',
      uses: 23,
      conversionRate: 42,
      isFavorite: false
    }
  ];

  const leads = [
    { id: 1, username: 'gersantacreu', fullName: 'Gerard Santacreu', status: 'Open', stage: 'open', lastUpdated: '4 jul', avatar: '👤', tags: ['Interesado', 'Coaching'] },
    { id: 2, username: 'stekovisuals', fullName: 'StekoVisuals', status: 'Open', stage: 'qualify', lastUpdated: '4 jul', avatar: '👤', tags: ['Agencia'] },
    { id: 3, username: 'mario_mania_', fullName: 'Mario Rodriguez Paradela', status: 'Qualifying', stage: 'current', lastUpdated: '30 jun', avatar: '👤', tags: ['Consultor'] },
    { id: 4, username: 'elyza_ac', fullName: 'Elyza', status: 'Scheduled', stage: 'desired', lastUpdated: '28 jun', avatar: '👤', tags: ['High-ticket'] }
  ];

  const kanbanColumns = [
    { id: 'open', title: 'Open', color: 'blue' },
    { id: 'qualify', title: 'Conectar y Cualificar', color: 'purple' },
    { id: 'current', title: 'Situación Actual', color: 'orange' },
    { id: 'desired', title: 'Situación Deseada', color: 'green' },
    { id: 'obstacle', title: 'Obstáculo', color: 'red' }
  ];

  const chats = [
    { id: 1, lead: leads[0], lastMessage: 'Muy buenas Gerard! pudiste ver el video?', unread: 2, time: '10:25' },
    { id: 2, lead: leads[1], lastMessage: 'Perfecto, agendamos para mañana entonces', unread: 0, time: 'Ayer' },
    { id: 3, lead: leads[2], lastMessage: 'Gracias por la información!', unread: 0, time: '2 días' }
  ];

  const messages = [
    { id: 1, sender: 'user', content: 'integrando todos los conocimientos (que eso tambien es importante y es lo que llevo haciendo estos meses), entender el nicho.', time: '10:25', isOwn: false },
    { id: 2, sender: 'setter', content: 'Total al final la adquisición de clientes suele ser lo que cuesta un poquito más', time: '10:51', isOwn: true },
    { id: 3, sender: 'user', content: 'lo bueno es que entiendes el nicho, solo falta que la estrategia se dirija a la adquisición de clientes', time: '10:51', isOwn: false },
    { id: 4, sender: 'setter', content: 'te voy a dejar por aquí un video de Miguel por si resuena contigo y crees que podemos ayudarte:\n\nhttps://vimeo.com/1086426869/e1a8d82e5b?share=copy', time: '10:53', isOwn: true },
    { id: 5, sender: 'user', content: 'de acuerdo, gracias!', time: '11:13', isOwn: false },
    { id: 6, sender: 'setter', content: 'Muy buenas Gerard! pudiste ver el video?', time: '20:44', isOwn: true }
  ];

  const appointments = [
    { id: 1, leadName: 'Gerard Santacreu', time: '10:00', type: 'Llamada de Descubrimiento' },
    { id: 2, leadName: 'Mario Rodriguez', time: '14:30', type: 'Demo del Producto' },
    { id: 3, leadName: 'Elyza', time: '16:00', type: 'Seguimiento' }
  ];

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'chats', label: 'Chats', icon: MessageSquare },
    { id: 'leads', label: 'Leads', icon: Users },
    { id: 'templates', label: 'Plantillas', icon: FileText },
    { id: 'calendar', label: 'Calendario', icon: Calendar },
    { id: 'analytics', label: 'Analíticas', icon: BarChart3 }
  ];

  // Funciones auxiliares
  const handleLogin = (e) => {
    e.preventDefault();
    setIsAuthenticated(true);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentPage('auth');
    setShowProfileMenu(false);
  };

  const toggleDarkMode = () => setDarkMode(!darkMode);

  // Componente de Modal Base
  const Modal = ({ children, onClose, title }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto animate-scaleIn`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {title}
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors duration-150`}
          >
            <X className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );

  // Barra de Navegación Global
  const GlobalNavbar = () => (
    <header className={`h-16 ${darkMode ? 'bg-gray-800' : 'bg-white'} border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} fixed top-0 left-0 right-0 z-40`}>
      <div className="h-full px-6 flex items-center justify-between">
        {/* Logo y Navegación Principal */}
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">S</span>
            </div>
            <span className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>SetterAI</span>
          </div>
          
          <nav className="flex gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 ${
                  currentPage === item.id
                    ? 'bg-purple-600 text-white'
                    : darkMode
                      ? 'text-gray-400 hover:bg-gray-700 hover:text-white'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Búsqueda Global y Acciones */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar en toda la app..."
              className={`pl-9 pr-4 py-2 rounded-lg text-sm ${
                darkMode
                  ? 'bg-gray-700 text-white placeholder-gray-400'
                  : 'bg-gray-100 text-gray-900 placeholder-gray-500'
              } outline-none focus:ring-2 focus:ring-purple-600 w-64`}
            />
          </div>
          
          <button
            onClick={toggleDarkMode}
            className={`p-2 rounded-lg transition-all duration-200 ${
              darkMode
                ? 'text-gray-400 hover:bg-gray-700 hover:text-white'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          
          <button className={`p-2 rounded-lg transition-all duration-200 relative ${
            darkMode
              ? 'text-gray-400 hover:bg-gray-700 hover:text-white'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}>
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-700 transition-all duration-200"
            >
              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold">J</span>
              </div>
              <ChevronDown className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
            </button>
            
            {showProfileMenu && (
              <div className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg ${
                darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
              } py-1`}>
                <button
                  onClick={() => {
                    setCurrentPage('profile');
                    setShowProfileMenu(false);
                  }}
                  className={`w-full px-4 py-2 text-left flex items-center gap-2 ${
                    darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                  } transition-colors duration-150`}
                >
                  <User className="w-4 h-4" />
                  <span className="text-sm">Mi Perfil</span>
                </button>
                <button
                  onClick={() => {
                    setCurrentPage('profile');
                    setShowProfileMenu(false);
                  }}
                  className={`w-full px-4 py-2 text-left flex items-center gap-2 ${
                    darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                  } transition-colors duration-150`}
                >
                  <Settings className="w-4 h-4" />
                  <span className="text-sm">Configuración</span>
                </button>
                <div className={`my-1 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}></div>
                <button
                  onClick={handleLogout}
                  className={`w-full px-4 py-2 text-left flex items-center gap-2 ${
                    darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                  } transition-colors duration-150`}
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm">Cerrar Sesión</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );

  // Página de Autenticación
  const AuthPage = () => (
    <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className={`w-full max-w-md p-8 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-2xl`}>
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">S</span>
          </div>
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Bienvenido a SetterAI
          </h1>
          <p className={`text-sm mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Tu asistente inteligente para appointment setting
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Email
            </label>
            <input
              type="email"
              className={`w-full px-4 py-3 rounded-lg ${
                darkMode
                  ? 'bg-gray-700 text-white placeholder-gray-400'
                  : 'bg-gray-100 text-gray-900 placeholder-gray-500'
              } outline-none focus:ring-2 focus:ring-purple-600`}
              placeholder="tu@email.com"
            />
          </div>
          
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Contraseña
            </label>
            <input
              type="password"
              className={`w-full px-4 py-3 rounded-lg ${
                darkMode
                  ? 'bg-gray-700 text-white placeholder-gray-400'
                  : 'bg-gray-100 text-gray-900 placeholder-gray-500'
              } outline-none focus:ring-2 focus:ring-purple-600`}
              placeholder="••••••••"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="rounded" />
              <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Recordarme
              </span>
            </label>
            <a href="#" className="text-sm text-purple-600 hover:text-purple-700">
              ¿Olvidaste tu contraseña?
            </a>
          </div>
          
          <button
            type="submit"
            className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200 font-medium"
          >
            Iniciar Sesión
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className={`w-full border-t ${darkMode ? 'border-gray-700' : 'border-gray-300'}`}></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className={`px-2 ${darkMode ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-600'}`}>
                O continúa con
              </span>
            </div>
          </div>
          
          <div className="mt-6 space-y-3">
            <button
              onClick={handleLogin}
              className={`w-full py-3 rounded-lg flex items-center justify-center gap-2 ${
                darkMode
                  ? 'bg-gray-700 text-white hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
              } transition-all duration-200`}
            >
              <Globe className="w-5 h-5" />
              <span>Continuar con Google</span>
            </button>
            
            <button
              onClick={handleLogin}
              className={`w-full py-3 rounded-lg border ${
                darkMode
                  ? 'border-gray-700 text-gray-400 hover:bg-gray-700'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              } transition-all duration-200`}
            >
              Acceder como Invitado
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Página de Dashboard
  const DashboardPage = () => {
    const kpis = [
      { label: 'Total Leads', value: '847', change: '+12%', icon: Users, trend: 'up' },
      { label: 'Conversaciones Activas', value: '234', change: '+8%', icon: MessageSquare, trend: 'up' },
      { label: 'Citas Agendadas', value: '45', change: '+23%', icon: Calendar, trend: 'up' },
      { label: 'Tasa de Conversión', value: '18.5%', change: '-2%', icon: TrendingUp, trend: 'down' }
    ];

    const funnelData = [
      { stage: 'Nuevos Leads', count: 847, percentage: 100 },
      { stage: 'Contactados', count: 634, percentage: 75 },
      { stage: 'Calificados', count: 423, percentage: 50 },
      { stage: 'Propuesta Enviada', count: 211, percentage: 25 },
      { stage: 'Cita Agendada', count: 156, percentage: 18.5 }
    ];

    return (
      <div className="p-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-4 gap-4">
          {kpis.map((kpi, index) => (
            <div key={index} className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg`}>
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <kpi.icon className="w-6 h-6 text-purple-600" />
                </div>
                <span className={`text-sm font-medium ${
                  kpi.trend === 'up' ? 'text-green-500' : 'text-red-500'
                } flex items-center gap-1`}>
                  {kpi.trend === 'up' ? <ArrowUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {kpi.change}
                </span>
              </div>
              <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {kpi.value}
              </h3>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                {kpi.label}
              </p>
            </div>
          ))}
        </div>

        {/* Grid de Widgets */}
        <div className="grid grid-cols-2 gap-6">
          {/* Columna Izquierda - Accesos Rápidos */}
          <div className="space-y-4">
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg`}>
              <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Accesos Rápidos
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setCurrentPage('chats')}
                  className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'} transition-all duration-200`}
                >
                  <MessageSquare className="w-8 h-8 text-purple-600 mb-2" />
                  <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Ver Chats
                  </p>
                </button>
                <button
                  onClick={() => setCurrentPage('templates')}
                  className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'} transition-all duration-200`}
                >
                  <FileText className="w-8 h-8 text-purple-600 mb-2" />
                  <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Plantillas
                  </p>
                </button>
                <button
                  onClick={() => setCurrentPage('leads')}
                  className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'} transition-all duration-200`}
                >
                  <UserPlus className="w-8 h-8 text-purple-600 mb-2" />
                  <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Nuevo Lead
                  </p>
                </button>
                <button
                  onClick={() => setCurrentPage('calendar')}
                  className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'} transition-all duration-200`}
                >
                  <Calendar className="w-8 h-8 text-purple-600 mb-2" />
                  <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Calendario
                  </p>
                </button>
              </div>
            </div>

            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg`}>
              <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Actividad Reciente
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Nueva cita agendada con Gerard Santacreu
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Lead cualificado: Mario Rodriguez
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Plantilla actualizada: FU 24
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Columna Derecha - Gráfico de Funnel */}
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg`}>
            <h3 className={`text-lg font-semibold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Funnel de Ventas
            </h3>
            <div className="space-y-4">
              {funnelData.map((stage, index) => (
                <div key={index} className="group cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {stage.stage}
                    </span>
                    <span className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {stage.count}
                    </span>
                  </div>
                  <div className="relative h-8 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-600 to-blue-600 rounded-full transition-all duration-500 group-hover:opacity-80"
                      style={{ width: `${stage.percentage}%` }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                      {stage.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Página de Chats
  const ChatsPage = () => (
    <div className="flex h-full">
      {/* Columna 1: Panel de Conversaciones */}
      <div className={`w-80 ${darkMode ? 'bg-gray-800' : 'bg-white'} border-r ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex flex-col`}>
        <div className="p-4 border-b border-gray-700">
          <h2 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Conversaciones
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar conversación..."
              className={`w-full pl-9 pr-3 py-2 rounded-lg text-sm ${
                darkMode
                  ? 'bg-gray-700 text-white placeholder-gray-400'
                  : 'bg-gray-100 text-gray-900 placeholder-gray-500'
              } outline-none focus:ring-2 focus:ring-purple-600`}
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {chats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => setSelectedChat(chat)}
              className={`p-4 cursor-pointer transition-all duration-200 border-b ${
                selectedChat?.id === chat.id
                  ? darkMode ? 'bg-gray-700' : 'bg-purple-50'
                  : darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
              } ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">{chat.lead.avatar}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className={`font-medium text-sm truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {chat.lead.fullName}
                    </h4>
                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {chat.time}
                    </span>
                  </div>
                  <p className={`text-sm truncate ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {chat.lastMessage}
                  </p>
                </div>
                {chat.unread > 0 && (
                  <span className="bg-purple-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {chat.unread}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Columna 2: Panel de Chat Activo */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} px-6 py-4`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                    <span className="text-white">{selectedChat.lead.avatar}</span>
                  </div>
                  <div>
                    <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {selectedChat.lead.fullName}
                    </h3>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      @{selectedChat.lead.username} • {selectedChat.lead.status}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selectedChat.lead.tags.map((tag, index) => (
                    <span key={index} className="px-2 py-1 bg-purple-600 bg-opacity-20 text-purple-600 rounded text-xs font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-md px-4 py-3 rounded-2xl ${
                      msg.isOwn
                        ? 'bg-purple-600 text-white'
                        : darkMode
                          ? 'bg-gray-700 text-white'
                          : 'bg-white text-gray-900 shadow-sm'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <span className={`text-xs mt-1 block ${
                        msg.isOwn ? 'text-purple-200' : darkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {msg.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} p-4`}>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Escribe tu mensaje..."
                  className={`flex-1 px-4 py-3 rounded-xl ${
                    darkMode
                      ? 'bg-gray-700 text-white placeholder-gray-400'
                      : 'bg-gray-100 text-gray-900 placeholder-gray-500'
                  } outline-none focus:ring-2 focus:ring-purple-600 transition-all duration-200`}
                />
                <button
                  onClick={() => setShowAISuggestion(!showAISuggestion)}
                  className={`p-3 rounded-xl ${
                    showAISuggestion
                      ? 'bg-purple-600 text-white'
                      : darkMode
                        ? 'bg-gray-700 text-gray-400 hover:text-white'
                        : 'bg-gray-100 text-gray-600 hover:text-gray-900'
                  } transition-all duration-200`}
                >
                  <Sparkles className="w-5 h-5" />
                </button>
                <button className="p-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all duration-200">
                  <Send className="w-5 h-5" />
                </button>
              </div>
              
              {showAISuggestion && (
                <div className={`mt-3 p-4 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} animate-fadeIn`}>
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-purple-600 mt-0.5" />
                    <div className="flex-1">
                      <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        <span className="font-medium">Sugerencia de IA:</span> "¡Hola Gerard! Vi que viste el video. ¿Qué te pareció? ¿Hay algo específico que te gustaría discutir sobre la estrategia?"
                      </p>
                      <div className="flex gap-2 mt-2">
                        <button className="text-xs text-purple-600 hover:text-purple-700 font-medium">
                          Usar sugerencia
                        </button>
                        <button className="text-xs text-gray-500 hover:text-gray-600">
                          Generar otra
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Selecciona una conversación para comenzar
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Columna 3: Panel de Asistente de Plantillas */}
      <div className={`w-80 ${darkMode ? 'bg-gray-800' : 'bg-white'} border-l ${darkMode ? 'border-gray-700' : 'border-gray-200'} p-6`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Plantillas Rápidas
          </h3>
          <button
            onClick={() => setShowModal('template')}
            className={`p-1 rounded hover:bg-gray-700`}
          >
            <Plus className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar plantilla..."
              className={`w-full pl-9 pr-3 py-2 rounded-lg text-sm ${
                darkMode
                  ? 'bg-gray-700 text-white placeholder-gray-400'
                  : 'bg-gray-100 text-gray-900 placeholder-gray-500'
              } outline-none focus:ring-2 focus:ring-purple-600`}
            />
          </div>
        </div>

        <div className="mb-4">
          <select className={`w-full px-3 py-2 rounded-lg text-sm ${
            darkMode
              ? 'bg-gray-700 text-white'
              : 'bg-gray-100 text-gray-900'
          } outline-none focus:ring-2 focus:ring-purple-600`}>
            <option value="">Todas las categorías</option>
            <option value="apertura">Apertura</option>
            <option value="seguimiento">Seguimiento</option>
            <option value="objeciones">Objeciones</option>
            <option value="cierre">Cierre</option>
          </select>
        </div>

        <div className="space-y-3">
          {templates.map((template) => (
            <div
              key={template.id}
              className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                darkMode
                  ? 'bg-gray-700 hover:bg-gray-600'
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <h4 className={`font-medium text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {template.name}
                </h4>
                {template.isFavorite && (
                  <Star className="w-3 h-3 text-yellow-500 fill-current" />
                )}
              </div>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} line-clamp-2 mb-2`}>
                {template.content}
              </p>
              <div className="flex items-center justify-between">
                <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  {template.category}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedTemplate(template);
                      setShowModal('templateView');
                    }}
                    className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                  >
                    Ver
                  </button>
                  <button
                    onClick={() => setMessage(template.content)}
                    className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                  >
                    Insertar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Página de Leads
  const LeadsPage = () => (
    <div className="p-6">
      {/* Barra de Controles */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar leads..."
              className={`pl-10 pr-4 py-2 rounded-lg ${
                darkMode
                  ? 'bg-gray-800 text-white placeholder-gray-400'
                  : 'bg-gray-100 text-gray-900 placeholder-gray-500'
              } outline-none focus:ring-2 focus:ring-purple-600 w-80`}
            />
          </div>
          
          <select className={`px-4 py-2 rounded-lg ${
            darkMode
              ? 'bg-gray-800 text-white'
              : 'bg-gray-100 text-gray-900'
          } outline-none focus:ring-2 focus:ring-purple-600`}>
            <option value="">Todos los Estados</option>
            <option value="open">Open</option>
            <option value="qualifying">Qualifying</option>
            <option value="scheduled">Scheduled</option>
          </select>
          
          <button className={`px-4 py-2 rounded-lg ${
            darkMode
              ? 'bg-gray-800 text-white hover:bg-gray-700'
              : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
          } transition-all duration-200 flex items-center gap-2`}>
            <Filter className="w-4 h-4" />
            Filtrar por Tags
          </button>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex gap-1 p-1 bg-gray-800 rounded-lg">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${
                viewMode === 'list' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
              } transition-all duration-200`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-2 rounded ${
                viewMode === 'kanban' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
              } transition-all duration-200`}
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>
          
          <button
            onClick={() => setShowModal('lead')}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Crear Lead
          </button>
        </div>
      </div>

      {/* Vista de Lista */}
      {viewMode === 'list' && (
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl overflow-hidden shadow-lg`}>
          <table className="w-full">
            <thead className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <tr>
                <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                  Username
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                  Full Name
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                  Status
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                  Tags
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                  Last Updated
                </th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className={`${darkMode ? 'bg-gray-800' : 'bg-white'} divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {leads.map((lead) => (
                <tr
                  key={lead.id}
                  onClick={() => {
                    setSelectedLead(lead);
                    setShowModal('leadEdit');
                  }}
                  className={`${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors duration-150 cursor-pointer`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center mr-3">
                        <span className="text-white text-sm">{lead.avatar}</span>
                      </div>
                      <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {lead.username}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {lead.fullName}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      lead.status === 'Open'
                        ? 'bg-green-100 text-green-800'
                        : lead.status === 'Qualifying'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                    }`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-1">
                      {lead.tags.map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-purple-600 bg-opacity-20 text-purple-600 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {lead.lastUpdated}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentPage('chats');
                      }}
                      className="text-purple-600 hover:text-purple-700"
                    >
                      Abrir Chat
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Vista Kanban */}
      {viewMode === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {kanbanColumns.map((column) => (
            <div key={column.id} className="flex-shrink-0 w-80">
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-4 min-h-[600px] shadow-lg`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {column.title}
                  </h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {leads.filter(l => l.stage === column.id).length}
                  </span>
                </div>
                
                <div className="space-y-3">
                  {leads.filter(l => l.stage === column.id).map((lead) => (
                    <div
                      key={lead.id}
                      onClick={() => {
                        setSelectedLead(lead);
                        setShowModal('leadEdit');
                      }}
                      className={`p-4 rounded-lg cursor-pointer transition-all duration-200 ${
                        darkMode
                          ? 'bg-gray-700 hover:bg-gray-600 hover:shadow-lg'
                          : 'bg-gray-50 hover:bg-gray-100 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm">{lead.avatar}</span>
                        </div>
                        <div className="flex-1">
                          <h4 className={`font-medium text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {lead.fullName}
                          </h4>
                          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            @{lead.username}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {lead.tags.map((tag, index) => (
                          <span key={index} className="px-2 py-0.5 bg-purple-600 bg-opacity-20 text-purple-600 rounded text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {lead.lastUpdated}
                        </span>
                        <Move className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Página de Plantillas
  const TemplatesPage = () => (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Gestión de Plantillas
        </h1>
        <div className="flex gap-3">
          <button
            onClick={() => setShowModal('template')}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Crear Plantilla
          </button>
          <button
            onClick={() => setShowModal('importScript')}
            className="px-4 py-2 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900 transition-all duration-200 flex items-center gap-2"
          >
            <Import className="w-4 h-4" />
            Importar Script
          </button>
        </div>
      </div>

      <div className="mb-6 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar plantillas..."
            className={`w-full pl-10 pr-4 py-2 rounded-lg ${
              darkMode
                ? 'bg-gray-800 text-white placeholder-gray-400'
                : 'bg-gray-100 text-gray-900 placeholder-gray-500'
            } outline-none focus:ring-2 focus:ring-purple-600`}
          />
        </div>
        
        <select className={`px-4 py-2 rounded-lg ${
          darkMode
            ? 'bg-gray-800 text-white'
            : 'bg-gray-100 text-gray-900'
        } outline-none focus:ring-2 focus:ring-purple-600`}>
          <option value="">Todas las categorías</option>
          <option value="apertura">Apertura</option>
          <option value="seguimiento">Seguimiento</option>
          <option value="objeciones">Objeciones</option>
          <option value="cierre">Cierre</option>
        </select>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {templates.map((template) => (
          <div
            key={template.id}
            onClick={() => {
              setSelectedTemplate(template);
              setShowModal('templateView');
            }}
            className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg cursor-pointer transition-all duration-200 hover:shadow-xl hover:scale-[1.02]`}
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className={`font-semibold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {template.name}
              </h3>
              {template.isFavorite && (
                <Star className="w-5 h-5 text-yellow-500 fill-current" />
              )}
            </div>
            
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-4 line-clamp-3`}>
              {template.content}
            </p>
            
            <div className="flex items-center justify-between mb-3">
              <span className="px-2 py-1 bg-purple-600 bg-opacity-20 text-purple-600 rounded text-xs font-medium">
                {template.category}
              </span>
              <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                {template.tone}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  <span className="font-medium">{template.uses}</span> usos
                </span>
                <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  <span className="font-medium">{template.conversionRate}%</span> conversión
                </span>
              </div>
              <button className="text-purple-600 hover:text-purple-700">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Página de Calendario
  const CalendarPage = () => {
    const getDaysInMonth = (date) => {
      const year = date.getFullYear();
      const month = date.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const days = [];
      
      for (let i = 0; i < firstDay.getDay(); i++) {
        days.push(null);
      }
      
      for (let i = 1; i <= lastDay.getDate(); i++) {
        days.push(new Date(year, month, i));
      }
      
      return days;
    };

    const days = getDaysInMonth(selectedDate);
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    return (
      <div className="p-6">
        <div className="grid grid-cols-2 gap-6">
          {/* Columna 1: Widget de Calendario */}
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
              </h2>
              <div className="flex gap-2">
                <button className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                  <ChevronRight className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'} transform rotate-180`} />
                </button>
                <button className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                  <ChevronRight className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                <div key={day} className={`text-center text-xs font-medium py-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {day}
                </div>
              ))}
              
              {days.map((day, index) => (
                <div
                  key={index}
                  onClick={() => day && setSelectedDate(day)}
                  className={`aspect-square flex items-center justify-center rounded-lg cursor-pointer transition-all duration-200 ${
                    day
                      ? selectedDate.toDateString() === day.toDateString()
                        ? 'bg-purple-600 text-white'
                        : darkMode
                          ? 'hover:bg-gray-700 text-white'
                          : 'hover:bg-gray-100 text-gray-900'
                      : ''
                  }`}
                >
                  {day && day.getDate()}
                </div>
              ))}
            </div>
          </div>

          {/* Columna 2: Vista de Agenda Diaria */}
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Agenda del {selectedDate.getDate()} de {monthNames[selectedDate.getMonth()]}
              </h2>
              <button
                onClick={() => setShowModal('appointment')}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Agendar Cita
              </button>
            </div>
            
            <div className="space-y-3">
              {appointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} hover:shadow-md transition-all duration-200`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {appointment.leadName}
                    </h4>
                    <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {appointment.time}
                    </span>
                  </div>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {appointment.type}
                  </p>
                  <div className="flex gap-2 mt-3">
                    <button className="text-xs text-purple-600 hover:text-purple-700 font-medium">
                      Ver detalles
                    </button>
                    <button className="text-xs text-purple-600 hover:text-purple-700 font-medium">
                      Reprogramar
                    </button>
                  </div>
                </div>
              ))}
              
              {appointments.length === 0 && (
                <div className="text-center py-12">
                  <Calendar className={`w-12 h-12 mx-auto mb-3 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                  <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    No hay citas programadas para este día
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Página de Analíticas
  const AnalyticsPage = () => {
    const performanceData = [
      { month: 'Ene', leads: 234, conversiones: 45, tasa: 19.2 },
      { month: 'Feb', leads: 267, conversiones: 52, tasa: 19.5 },
      { month: 'Mar', leads: 298, conversiones: 61, tasa: 20.5 },
      { month: 'Abr', leads: 312, conversiones: 58, tasa: 18.6 },
      { month: 'May', leads: 347, conversiones: 67, tasa: 19.3 },
      { month: 'Jun', leads: 389, conversiones: 78, tasa: 20.1 }
    ];

    const sourceData = [
      { source: 'Instagram DM', percentage: 45, color: 'bg-purple-600' },
      { source: 'WhatsApp', percentage: 30, color: 'bg-green-600' },
      { source: 'Email', percentage: 15, color: 'bg-blue-600' },
      { source: 'Otros', percentage: 10, color: 'bg-gray-600' }
    ];

    return (
      <div className="p-6 space-y-6">
        {/* Métricas de Rendimiento */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg`}>
          <h2 className={`text-xl font-semibold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Rendimiento Mensual
          </h2>
          <div className="grid grid-cols-6 gap-4">
            {performanceData.map((month, index) => (
              <div key={index} className="text-center">
                <div className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {month.month}
                </div>
                <div className="space-y-2">
                  <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {month.leads}
                  </div>
                  <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Leads
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full"
                      style={{ width: `${month.tasa * 5}%` }}
                    />
                  </div>
                  <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    {month.tasa}% conv.
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Gráficos en Grid */}
        <div className="grid grid-cols-2 gap-6">
          {/* Fuentes de Leads */}
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg`}>
            <h3 className={`text-lg font-semibold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Fuentes de Leads
            </h3>
            <div className="space-y-4">
              {sourceData.map((source, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {source.source}
                    </span>
                    <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {source.percentage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div
                      className={`${source.color} h-3 rounded-full transition-all duration-500`}
                      style={{ width: `${source.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rendimiento de Plantillas */}
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg`}>
            <h3 className={`text-lg font-semibold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Top Plantillas por Conversión
            </h3>
            <div className="space-y-3">
              {templates.map((template, index) => (
                <div key={index} className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {template.name}
                    </span>
                    <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {template.uses} usos
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${template.conversionRate}%` }}
                      />
                    </div>
                    <span className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {template.conversionRate}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actividad del Equipo */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg`}>
          <h3 className={`text-lg font-semibold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Actividad del Equipo (Últimos 7 días)
          </h3>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                1,234
              </div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Mensajes Enviados
              </p>
            </div>
            <div className="text-center">
              <div className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                89%
              </div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Tasa de Respuesta
              </p>
            </div>
            <div className="text-center">
              <div className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                156
              </div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Leads Cualificados
              </p>
            </div>
            <div className="text-center">
              <div className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                45
              </div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Citas Agendadas
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Página de Perfil y Configuración
  const ProfilePage = () => (
    <div className="p-6">
      <h1 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        Perfil y Configuración
      </h1>
      
      <div className="space-y-6">
        {/* Sección de Perfil */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg`}>
          <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Información Personal
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Nombre
              </label>
              <input
                type="text"
                defaultValue="John Doe"
                className={`w-full px-4 py-2 rounded-lg ${
                  darkMode
                    ? 'bg-gray-700 text-white'
                    : 'bg-gray-100 text-gray-900'
                } outline-none focus:ring-2 focus:ring-purple-600`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Email
              </label>
              <input
                type="email"
                defaultValue="john@example.com"
                className={`w-full px-4 py-2 rounded-lg ${
                  darkMode
                    ? 'bg-gray-700 text-white'
                    : 'bg-gray-100 text-gray-900'
                } outline-none focus:ring-2 focus:ring-purple-600`}
              />
            </div>
          </div>
        </div>

        {/* Sección de Seguridad */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg`}>
          <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
            <Shield className="w-5 h-5" />
            Seguridad
          </h2>
          <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200">
            Cambiar Contraseña
          </button>
        </div>

        {/* Sección de Integraciones */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg`}>
          <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
            <Link className="w-5 h-5" />
            Integraciones
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Globe className="w-8 h-8 text-blue-600" />
                <div>
                  <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Google</p>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Calendario y contactos</p>
                </div>
              </div>
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm">
                Conectado
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="w-8 h-8 text-green-600" />
                <div>
                  <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Calendly</p>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Agendamiento automático</p>
                </div>
              </div>
              <button className="px-4 py-2 border border-gray-600 text-gray-600 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-700">
                Conectar
              </button>
            </div>
          </div>
        </div>

        {/* Sección de Configuración de IA */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg`}>
          <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
            <Brain className="w-5 h-5" />
            Configuración de IA
          </h2>
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Modelo de IA
              </label>
              <select className={`w-full px-4 py-2 rounded-lg ${
                darkMode
                  ? 'bg-gray-700 text-white'
                  : 'bg-gray-100 text-gray-900'
              } outline-none focus:ring-2 focus:ring-purple-600`}>
                <option>GPT-4 (Recomendado)</option>
                <option>GPT-3.5 Turbo</option>
                <option>Claude 2</option>
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Tono de comunicación
              </label>
              <select className={`w-full px-4 py-2 rounded-lg ${
                darkMode
                  ? 'bg-gray-700 text-white'
                  : 'bg-gray-100 text-gray-900'
              } outline-none focus:ring-2 focus:ring-purple-600`}>
                <option>Profesional</option>
                <option>Amigable</option>
                <option>Directo</option>
                <option>Personalizado</option>
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Prompt Base
              </label>
              <textarea
                rows={4}
                className={`w-full px-4 py-2 rounded-lg ${
                  darkMode
                    ? 'bg-gray-700 text-white'
                    : 'bg-gray-100 text-gray-900'
                } outline-none focus:ring-2 focus:ring-purple-600`}
                defaultValue="Actúa como un appointment setter profesional. Tu objetivo es cualificar leads y agendar citas de manera efectiva..."
              />
            </div>
          </div>
        </div>

        {/* Botón de Guardar */}
        <div className="flex justify-end">
          <button className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200 flex items-center gap-2">
            <Save className="w-5 h-5" />
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );

  // Modales
  const renderModals = () => {
    if (!showModal) return null;

    switch (showModal) {
      case 'template':
        return (
          <Modal onClose={() => setShowModal(null)} title="Crear Nueva Plantilla">
            <form className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Nombre de la Plantilla
                </label>
                <input
                  type="text"
                  className={`w-full px-4 py-2 rounded-lg ${
                    darkMode
                      ? 'bg-gray-700 text-white'
                      : 'bg-gray-100 text-gray-900'
                  } outline-none focus:ring-2 focus:ring-purple-600`}
                  placeholder="Ej: Seguimiento 24h"
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Contenido
                </label>
                <textarea
                  rows={4}
                  className={`w-full px-4 py-2 rounded-lg ${
                    darkMode
                      ? 'bg-gray-700 text-white'
                      : 'bg-gray-100 text-gray-900'
                  } outline-none focus:ring-2 focus:ring-purple-600`}
                  placeholder="Escribe el contenido de tu plantilla aquí..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Categoría
                  </label>
                  <select className={`w-full px-4 py-2 rounded-lg ${
                    darkMode
                      ? 'bg-gray-700 text-white'
                      : 'bg-gray-100 text-gray-900'
                  } outline-none focus:ring-2 focus:ring-purple-600`}>
                    <option>Apertura</option>
                    <option>Seguimiento</option>
                    <option>Objeciones</option>
                    <option>Cierre</option>
                  </select>
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Tono
                  </label>
                  <select className={`w-full px-4 py-2 rounded-lg ${
                    darkMode
                      ? 'bg-gray-700 text-white'
                      : 'bg-gray-100 text-gray-900'
                  } outline-none focus:ring-2 focus:ring-purple-600`}>
                    <option>Profesional</option>
                    <option>Amigable</option>
                    <option>Directo</option>
                    <option>Casual</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(null)}
                  className={`px-4 py-2 rounded-lg ${
                    darkMode
                      ? 'bg-gray-700 text-white hover:bg-gray-600'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  } transition-all duration-200`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200"
                >
                  Crear Plantilla
                </button>
              </div>
            </form>
          </Modal>
        );

      case 'importScript':
        return (
          <Modal onClose={() => setShowModal(null)} title="Importar Script">
            <div className="space-y-4">
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Pega tu script completo aquí. La IA lo analizará y creará plantillas automáticamente para cada parte del proceso.
              </p>
              
              <textarea
                rows={12}
                className={`w-full px-4 py-2 rounded-lg ${
                  darkMode
                    ? 'bg-gray-700 text-white'
                    : 'bg-gray-100 text-gray-900'
                } outline-none focus:ring-2 focus:ring-purple-600 font-mono text-sm`}
                placeholder="Pega tu script aquí..."
              />
              
              <div className="flex items-center gap-2 p-4 bg-purple-600 bg-opacity-10 rounded-lg">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  La IA detectará automáticamente las diferentes secciones de tu script y las categorizará
                </p>
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setShowModal(null)}
                  className={`px-4 py-2 rounded-lg ${
                    darkMode
                      ? 'bg-gray-700 text-white hover:bg-gray-600'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  } transition-all duration-200`}
                >
                  Cancelar
                </button>
                <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200 flex items-center gap-2">
                  <Import className="w-4 h-4" />
                  Importar y Procesar
                </button>
              </div>
            </div>
          </Modal>
        );

      case 'lead':
      case 'leadEdit':
        return (
          <Modal onClose={() => setShowModal(null)} title={showModal === 'lead' ? 'Crear Nuevo Lead' : 'Editar Lead'}>
            <form className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    defaultValue={selectedLead?.fullName || ''}
                    className={`w-full px-4 py-2 rounded-lg ${
                      darkMode
                        ? 'bg-gray-700 text-white'
                        : 'bg-gray-100 text-gray-900'
                    } outline-none focus:ring-2 focus:ring-purple-600`}
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Username
                  </label>
                  <input
                    type="text"
                    defaultValue={selectedLead?.username || ''}
                    className={`w-full px-4 py-2 rounded-lg ${
                      darkMode
                        ? 'bg-gray-700 text-white'
                        : 'bg-gray-100 text-gray-900'
                    } outline-none focus:ring-2 focus:ring-purple-600`}
                  />
                </div>
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Estado
                </label>
                <select className={`w-full px-4 py-2 rounded-lg ${
                  darkMode
                    ? 'bg-gray-700 text-white'
                    : 'bg-gray-100 text-gray-900'
                } outline-none focus:ring-2 focus:ring-purple-600`}>
                  <option value="open">Open</option>
                  <option value="qualifying">Qualifying</option>
                  <option value="scheduled">Scheduled</option>
                </select>
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Tags
                </label>
                <input
                  type="text"
                  placeholder="Separa los tags con comas"
                  defaultValue={selectedLead?.tags.join(', ') || ''}
                  className={`w-full px-4 py-2 rounded-lg ${
                    darkMode
                      ? 'bg-gray-700 text-white'
                      : 'bg-gray-100 text-gray-900'
                  } outline-none focus:ring-2 focus:ring-purple-600`}
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Notas
                </label>
                <textarea
                  rows={3}
                  className={`w-full px-4 py-2 rounded-lg ${
                    darkMode
                      ? 'bg-gray-700 text-white'
                      : 'bg-gray-100 text-gray-900'
                  } outline-none focus:ring-2 focus:ring-purple-600`}
                  placeholder="Añade notas sobre este lead..."
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(null)}
                  className={`px-4 py-2 rounded-lg ${
                    darkMode
                      ? 'bg-gray-700 text-white hover:bg-gray-600'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  } transition-all duration-200`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200"
                >
                  {showModal === 'lead' ? 'Crear Lead' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </Modal>
        );

      case 'appointment':
        return (
          <Modal onClose={() => setShowModal(null)} title="Agendar Nueva Cita">
            <form className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Lead
                </label>
                <select className={`w-full px-4 py-2 rounded-lg ${
                  darkMode
                    ? 'bg-gray-700 text-white'
                    : 'bg-gray-100 text-gray-900'
                } outline-none focus:ring-2 focus:ring-purple-600`}>
                  {leads.map(lead => (
                    <option key={lead.id} value={lead.id}>
                      {lead.fullName}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Fecha
                  </label>
                  <input
                    type="date"
                    className={`w-full px-4 py-2 rounded-lg ${
                      darkMode
                        ? 'bg-gray-700 text-white'
                        : 'bg-gray-100 text-gray-900'
                    } outline-none focus:ring-2 focus:ring-purple-600`}
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Hora
                  </label>
                  <input
                    type="time"
                    className={`w-full px-4 py-2 rounded-lg ${
                      darkMode
                        ? 'bg-gray-700 text-white'
                        : 'bg-gray-100 text-gray-900'
                    } outline-none focus:ring-2 focus:ring-purple-600`}
                  />
                </div>
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Tipo de Cita
                </label>
                <select className={`w-full px-4 py-2 rounded-lg ${
                  darkMode
                    ? 'bg-gray-700 text-white'
                    : 'bg-gray-100 text-gray-900'
                } outline-none focus:ring-2 focus:ring-purple-600`}>
                  <option>Llamada de Descubrimiento</option>
                  <option>Demo del Producto</option>
                  <option>Seguimiento</option>
                  <option>Cierre</option>
                </select>
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Notas
                </label>
                <textarea
                  rows={3}
                  className={`w-full px-4 py-2 rounded-lg ${
                    darkMode
                      ? 'bg-gray-700 text-white'
                      : 'bg-gray-100 text-gray-900'
                  } outline-none focus:ring-2 focus:ring-purple-600`}
                  placeholder="Información adicional sobre la cita..."
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(null)}
                  className={`px-4 py-2 rounded-lg ${
                    darkMode
                      ? 'bg-gray-700 text-white hover:bg-gray-600'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  } transition-all duration-200`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200"
                >
                  Agendar Cita
                </button>
              </div>
            </form>
          </Modal>
        );

      case 'templateView':
        return (
          <Modal onClose={() => setShowModal(null)} title={selectedTemplate?.name}>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Contenido:
                </label>
                <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {selectedTemplate?.content}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Categoría:
                  </label>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {selectedTemplate?.category}
                  </p>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Tono:
                  </label>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {selectedTemplate?.tone}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Variables:
                  </label>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {selectedTemplate?.variables}
                  </p>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Usos:
                  </label>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {selectedTemplate?.uses}
                  </p>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Tasa de Conversión:
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-purple-600 to-blue-600 h-3 rounded-full"
                      style={{ width: `${selectedTemplate?.conversionRate}%` }}
                    />
                  </div>
                  <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {selectedTemplate?.conversionRate}%
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4">
                <button className="flex items-center gap-2 text-yellow-500 hover:text-yellow-600 transition-colors duration-150">
                  <Star className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {selectedTemplate?.isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                  </span>
                </button>
                
                <div className="flex gap-3">
                  <button className={`px-4 py-2 rounded-lg ${
                    darkMode 
                      ? 'bg-gray-700 text-white hover:bg-gray-600' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } transition-all duration-200 flex items-center gap-2`}>
                    <Trash2 className="w-4 h-4" />
                    Eliminar
                  </button>
                  <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200 flex items-center gap-2">
                    <Edit3 className="w-4 h-4" />
                    Editar
                  </button>
                </div>
              </div>
            </div>
          </Modal>
        );

      default:
        return null;
    }
  };

  // Render principal
  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {!isAuthenticated ? (
        <AuthPage />
      ) : (
        <>
          <GlobalNavbar />
          <div className="pt-16">
            {currentPage === 'dashboard' && <DashboardPage />}
            {currentPage === 'chats' && <ChatsPage />}
            {currentPage === 'leads' && <LeadsPage />}
            {currentPage === 'templates' && <TemplatesPage />}
            {currentPage === 'calendar' && <CalendarPage />}
            {currentPage === 'analytics' && <AnalyticsPage />}
            {currentPage === 'profile' && <ProfilePage />}
          </div>
        </>
      )}
      
      {renderModals()}
      
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.2s ease-out;
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default SetterAI;
import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Plus,
  ChevronLeft,
  ChevronRight,
  Settings,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useCalendar } from '../hooks/useCalendar';
import { CalendarGrid } from '../components/Calendar/CalendarGrid';
import { UpcomingEventsSidebar } from '../components/Calendar/UpcomingEventsSidebar';
import { EventModal } from '../components/Calendar/EventModal';
import { GoogleCalendarConnect } from '../components/Calendar/GoogleCalendarConnect';
import type { CalendarEvent } from '../types/calendar';

interface CalendarPageProps {
  darkMode: boolean;
}

const months = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const CalendarPage: React.FC<CalendarPageProps> = ({ darkMode }) => {
  const {
    currentDate,
    view,
    calendars,
    events,
    upcomingEvents,
    calendarsLoading,
    eventsLoading,
    isConnecting,
    isSyncing,
    isCreating,
    isUpdating,
    isDeleting,
    setView,
    navigateDate,
    goToToday,
    goToDate,
    getEventsForDate,
    connectGoogle,
    syncCalendars,
    createEvent,
    updateEvent,
    deleteEvent,
    connectError,
    syncError,
    eventError
  } = useCalendar();

  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | undefined>();
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Handle auth callback from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code && window.location.pathname === '/calendar') {
      // Handle Google OAuth callback here if needed
      // The hook should handle this automatically
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setSelectedEvent(undefined);
    setShowEventModal(true);
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setSelectedDate(null);
    setShowEventModal(true);
  };

  const handleCreateEvent = () => {
    setSelectedEvent(undefined);
    setSelectedDate(new Date());
    setShowEventModal(true);
  };

  const handleSaveEvent = async (eventData: any) => {
    try {
      if (selectedEvent) {
        await updateEvent(eventData);
      } else {
        await createEvent(eventData);
      }
      setShowEventModal(false);
      setSelectedEvent(undefined);
      setSelectedDate(null);
    } catch (error) {
      console.error('Error saving event:', error);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await deleteEvent(eventId);
      setShowEventModal(false);
      setSelectedEvent(undefined);
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const handleConnectGoogle = () => {
    connectGoogle();
  };

  const handleSyncCalendars = () => {
    if (calendars.length > 0) {
      // Sync the first calendar account
      // In a real app, you might want to sync all accounts
      syncCalendars(calendars[0].calendar_account_id);
    }
  };

  const handleToggleCalendar = (calendarId: string, visible: boolean) => {
    // This would update the calendar visibility in the database
    // For now, we'll skip this implementation
    console.log('Toggle calendar visibility:', calendarId, visible);
  };

  const isConnected = calendars.length > 0;

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} p-6`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                <Calendar className="inline-block mr-3 h-8 w-8" />
                Calendario
              </h1>
              <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Gestiona tus eventos y citas
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={goToToday}
                className={`px-3 py-2 rounded-lg transition-colors ${
                  darkMode
                    ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                Hoy
              </button>
              
              <button
                onClick={handleCreateEvent}
                disabled={!isConnected}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Nuevo Evento
              </button>
              
              <button
                onClick={() => setShowConnectModal(!showConnectModal)}
                className={`p-2 rounded-lg transition-colors ${
                  darkMode
                    ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Error Messages */}
        {(connectError || syncError || eventError) && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg">
            <p className="text-red-800 dark:text-red-200 text-sm">
              {connectError?.message || syncError?.message || eventError?.message}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendar Settings Sidebar */}
          {showConnectModal && (
            <div className="lg:col-span-1 order-first lg:order-none">
              <GoogleCalendarConnect
                calendars={calendars}
                isConnected={isConnected}
                isConnecting={isConnecting}
                isSyncing={isSyncing}
                darkMode={darkMode}
                onConnect={handleConnectGoogle}
                onSync={handleSyncCalendars}
                onToggleCalendar={handleToggleCalendar}
              />
            </div>
          )}

          {/* Calendario Principal */}
          <div className={showConnectModal ? 'lg:col-span-2' : 'lg:col-span-3'}>
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-6`}>
              {/* Controles del Calendario */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => navigateDate('prev')}
                    className={`p-2 rounded-lg transition-colors ${
                      darkMode
                        ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-300'
                        : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>

                  <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {view === 'month' && `${months[currentMonth]} ${currentYear}`}
                    {view === 'week' && format(currentDate, 'MMMM yyyy', { locale: es })}
                    {view === 'day' && format(currentDate, 'EEEE, d MMMM yyyy', { locale: es })}
                  </h2>

                  <button
                    onClick={() => navigateDate('next')}
                    className={`p-2 rounded-lg transition-colors ${
                      darkMode
                        ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-300'
                        : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex space-x-2">
                  {(['month', 'week', 'day'] as const).map(viewType => (
                    <button
                      key={viewType}
                      onClick={() => setView(viewType)}
                      className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                        view === viewType
                          ? 'bg-blue-600 text-white'
                          : darkMode
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {viewType === 'month' ? 'Mes' : viewType === 'week' ? 'Semana' : 'Día'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Loading State */}
              {(calendarsLoading || eventsLoading) && (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
                  <span className={`ml-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Cargando calendario...
                  </span>
                </div>
              )}

              {/* Calendar Grid */}
              {!calendarsLoading && !eventsLoading && (
                <CalendarGrid
                  currentDate={currentDate}
                  view={view}
                  events={events}
                  darkMode={darkMode}
                  onDateClick={handleDateClick}
                  onEventClick={handleEventClick}
                />
              )}
            </div>
          </div>

          {/* Sidebar con próximos eventos */}
          <div className="lg:col-span-1">
            <UpcomingEventsSidebar
              events={upcomingEvents}
              darkMode={darkMode}
              onEventClick={handleEventClick}
              onCreateEvent={handleCreateEvent}
            />
          </div>
        </div>
      </div>

      {/* Event Modal */}
      <EventModal
        isOpen={showEventModal}
        onClose={() => {
          setShowEventModal(false);
          setSelectedEvent(undefined);
          setSelectedDate(null);
        }}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
        event={selectedEvent}
        calendars={calendars}
        darkMode={darkMode}
        defaultDate={selectedDate || undefined}
        defaultCalendarId={calendars[0]?.id}
      />
    </div>
  );
};

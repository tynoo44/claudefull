import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface NotificationMessage {
  id: string;
  conversationId: string;
  leadName: string;
  messageText: string;
  timestamp: string;
  read: boolean;
}

interface NotificationState {
  messages: NotificationMessage[];
  unreadCount: number;
  isVisible: boolean;
}

const MAX_NOTIFICATIONS = 50;
const NOTIFICATION_DURATION = 5000; // 5 segundos

export const useRealtimeNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationState>({
    messages: [],
    unreadCount: 0,
    isVisible: false,
  });

  const [activeToasts, setActiveToasts] = useState<string[]>([]);
  const subscriptionRef = useRef<RealtimeChannel | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Inicializar audio para notificaciones
  useEffect(() => {
    // Crear un tono simple usando Web Audio API
    const createNotificationSound = () => {
      const audioContext = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.3);
    };

    audioRef.current = { play: createNotificationSound } as HTMLAudioElement;
  }, []);

  // Configurar suscripción a mensajes en tiempo real
  const setupRealtimeSubscription = useCallback(() => {
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
    }

    subscriptionRef.current = supabase
      .channel('notifications-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: 'sender_type=eq.Lead', // Solo mensajes de leads
        },
        async payload => {
          console.log('New lead message for notification:', payload);

          try {
            // Obtener información del lead y conversación
            const { data: conversationData } = await supabase
              .from('conversations')
              .select(
                `
                id,
                leads (
                  full_name,
                  username
                )
              `,
              )
              .eq('id', payload.new.conversation_id)
              .single();

            if (conversationData) {
              const leadName =
                conversationData.leads?.[0]?.full_name ||
                conversationData.leads?.[0]?.username ||
                'Usuario desconocido';

              const newNotification: NotificationMessage = {
                id: payload.new.id,
                conversationId: payload.new.conversation_id,
                leadName,
                messageText: payload.new.text,
                timestamp: payload.new.created_at,
                read: false,
              };

              // Añadir notificación
              setNotifications(prev => ({
                messages: [newNotification, ...prev.messages].slice(0, MAX_NOTIFICATIONS),
                unreadCount: prev.unreadCount + 1,
                isVisible: true,
              }));

              // Mostrar toast
              setActiveToasts(prev => [...prev, newNotification.id]);

              // Reproducir sonido
              if (audioRef.current?.play) {
                try {
                  audioRef.current.play();
                } catch (error) {
                  console.log('Could not play notification sound:', error);
                }
              }

              // Solicitar permiso para notificaciones del navegador
              if (Notification.permission === 'granted') {
                const notification = new Notification(`Nuevo mensaje de ${leadName}`, {
                  body:
                    payload.new.text.length > 100
                      ? payload.new.text.substring(0, 100) + '...'
                      : payload.new.text,
                  icon: '/vite.svg',
                  tag: payload.new.conversation_id, // Previene notificaciones duplicadas
                });

                notification.onclick = () => {
                  window.focus();
                  // Aquí podrías agregar navegación a la conversación específica
                  notification.close();
                };

                // Auto cerrar después de 5 segundos
                setTimeout(() => notification.close(), 5000);
              }

              // Remover toast después del tiempo especificado
              setTimeout(() => {
                setActiveToasts(prev => prev.filter(id => id !== newNotification.id));
              }, NOTIFICATION_DURATION);
            }
          } catch (error) {
            console.error('Error processing notification:', error);
          }
        },
      )
      .subscribe();

    console.log('Realtime notifications subscription configured');
  }, []);

  // Solicitar permisos de notificación
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }, []);

  // Marcar notificación como leída
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => ({
      ...prev,
      messages: prev.messages.map(msg =>
        msg.id === notificationId ? { ...msg, read: true } : msg,
      ),
      unreadCount: Math.max(0, prev.unreadCount - 1),
    }));
  }, []);

  // Marcar todas como leídas
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => ({
      ...prev,
      messages: prev.messages.map(msg => ({ ...msg, read: true })),
      unreadCount: 0,
    }));
  }, []);

  // Limpiar notificaciones
  const clearNotifications = useCallback(() => {
    setNotifications({
      messages: [],
      unreadCount: 0,
      isVisible: false,
    });
  }, []);

  // Ocultar panel de notificaciones
  const hideNotifications = useCallback(() => {
    setNotifications(prev => ({ ...prev, isVisible: false }));
  }, []);

  // Mostrar panel de notificaciones
  const showNotifications = useCallback(() => {
    setNotifications(prev => ({ ...prev, isVisible: true }));
  }, []);

  // Remover toast específico
  const removeToast = useCallback((notificationId: string) => {
    setActiveToasts(prev => prev.filter(id => id !== notificationId));
  }, []);

  // Inicializar suscripción
  useEffect(() => {
    setupRealtimeSubscription();

    // Solicitar permisos automáticamente
    requestNotificationPermission();

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, [setupRealtimeSubscription, requestNotificationPermission]);

  return {
    notifications: notifications.messages,
    unreadCount: notifications.unreadCount,
    isVisible: notifications.isVisible,
    activeToasts,

    // Funciones
    markAsRead,
    markAllAsRead,
    clearNotifications,
    hideNotifications,
    showNotifications,
    removeToast,
    requestNotificationPermission,

    // Estado
    hasUnread: notifications.unreadCount > 0,
  };
};

import { supabase } from './supabase';

export interface AuthUser {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
}

export class AuthService {
  // Obtener usuario actual
  static async getCurrentUser() {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user) return null;

    return {
      id: user.id,
      email: user.email || '',
      full_name: user.user_metadata?.full_name,
      avatar_url: user.user_metadata?.avatar_url,
    } as AuthUser;
  }

  // Login con Google
  static async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) throw error;
    return data;
  }

  // Login con email y contraseña
  static async signInWithEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  }

  // Registro con email y contraseña
  static async signUpWithEmail(email: string, password: string, fullName?: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) throw error;
    return data;
  }

  // Cerrar sesión
  static async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  // Escuchar cambios de autenticación
  static onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return supabase.auth.onAuthStateChange(async (_, session) => {
      if (session?.user) {
        const user: AuthUser = {
          id: session.user.id,
          email: session.user.email || '',
          full_name: session.user.user_metadata?.full_name,
          avatar_url: session.user.user_metadata?.avatar_url,
        };
        callback(user);
      } else {
        callback(null);
      }
    });
  }

  // Obtener sesión actual
  static async getSession() {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  }

  // Refrescar sesión
  static async refreshSession() {
    const {
      data: { session },
      error,
    } = await supabase.auth.refreshSession();
    if (error) throw error;
    return session;
  }

  // Verificar si el usuario está autenticado
  static async isAuthenticated(): Promise<boolean> {
    const session = await this.getSession();
    return !!session;
  }

  // Crear o actualizar perfil de usuario en la tabla public.users
  static async upsertUserProfile(
    userId: string,
    data: {
      email: string;
      full_name?: string;
      avatar_url?: string;
    },
  ) {
    const { error } = await supabase.from('users').upsert(
      {
        id: userId,
        email: data.email,
        full_name: data.full_name,
        avatar_url: data.avatar_url,
        created_at: new Date().toISOString(),
      },
      {
        onConflict: 'id',
      },
    );

    if (error) throw error;
  }
}

import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';
import { AuthService } from '../lib/auth';

interface AuthPageProps {
  darkMode: boolean;
}

export const AuthPage: React.FC<AuthPageProps> = ({ darkMode }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        const result = await AuthService.signUpWithEmail(email, password, fullName);
        if (result.user) {
          await AuthService.upsertUserProfile(result.user.id, {
            email: result.user.email || '',
            full_name: fullName,
          });
        }
        alert('Registro exitoso. Revisa tu email para confirmar tu cuenta.');
      } else {
        await AuthService.signInWithEmail(email, password);
      }
    } catch (err: unknown) {
      console.error('Auth error:', err);
      setError(err instanceof Error ? err.message : 'Error al autenticar');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);

    try {
      await AuthService.signInWithGoogle();
    } catch (err: unknown) {
      console.error('Google auth error:', err);
      setError(err instanceof Error ? err.message : 'Error al autenticar con Google');
      setLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex ${
        darkMode ? 'bg-gray-950' : 'bg-gradient-to-br from-gray-50 to-blue-50/30'
      }`}
    >
      {/* Left side - branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800">
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight">
              <span className="text-blue-200">AI</span>deal
            </h2>
          </div>
          <div className="max-w-md">
            <h3 className="text-4xl font-bold leading-tight mb-6">
              Ventas inteligentes, resultados reales
            </h3>
            <p className="text-lg text-blue-100/80 leading-relaxed">
              Gestiona leads, automatiza conversaciones y cierra citas con inteligencia artificial
              avanzada.
            </p>
            <div className="mt-10 flex gap-8">
              <div>
                <div className="text-3xl font-bold">3x</div>
                <div className="text-sm text-blue-200/70 mt-1">Conversiones</div>
              </div>
              <div>
                <div className="text-3xl font-bold">-60%</div>
                <div className="text-sm text-blue-200/70 mt-1">Tiempo respuesta</div>
              </div>
              <div>
                <div className="text-3xl font-bold">24/7</div>
                <div className="text-sm text-blue-200/70 mt-1">Disponibilidad</div>
              </div>
            </div>
          </div>
          <p className="text-sm text-blue-200/50">aideal.vortekai.es</p>
        </div>
        {/* Decorative shapes */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      {/* Right side - form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-8">
        <div className="w-full max-w-md">
          {/* Logo - mobile */}
          <div className="lg:hidden text-center mb-8">
            <h1
              className={`text-3xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}
            >
              <span className="text-blue-500">AI</span>deal
            </h1>
            <p className={`mt-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Ventas inteligentes con IA
            </p>
          </div>

          {/* Form card */}
          <div
            className={`p-6 sm:p-8 rounded-2xl ${
              darkMode
                ? 'bg-gray-900 border border-gray-800'
                : 'bg-white shadow-xl shadow-gray-200/50'
            }`}
          >
            <div className="mb-6">
              <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {isSignUp ? 'Crear cuenta' : 'Bienvenido de nuevo'}
              </h2>
              <p className={`mt-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {isSignUp ? 'Completa tus datos para empezar' : 'Inicia sesion para continuar'}
              </p>
            </div>

            {/* Error */}
            {error && (
              <div
                className={`mb-4 p-3 rounded-lg text-sm ${
                  darkMode
                    ? 'bg-red-900/20 text-red-400 border border-red-800/30'
                    : 'bg-red-50 text-red-600 border border-red-100'
                }`}
              >
                {error}
              </div>
            )}

            {/* Google Login */}
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className={`w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl font-medium transition-all border ${
                darkMode
                  ? 'bg-gray-800 border-gray-700 text-white hover:bg-gray-750 hover:border-gray-600'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continuar con Google
                </>
              )}
            </button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div
                  className={`w-full border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}
                />
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-wider">
                <span
                  className={`px-3 ${
                    darkMode ? 'bg-gray-900 text-gray-500' : 'bg-white text-gray-400'
                  }`}
                >
                  o con email
                </span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div>
                  <label
                    className={`block text-sm font-medium mb-1.5 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}
                  >
                    Nombre completo
                  </label>
                  <input
                    type="text"
                    required={isSignUp}
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all ${
                      darkMode
                        ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500'
                        : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:bg-white focus:border-blue-500'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                    placeholder="Tu nombre"
                  />
                </div>
              )}

              <div>
                <label
                  className={`block text-sm font-medium mb-1.5 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  Email
                </label>
                <div className="relative">
                  <Mail
                    className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${
                      darkMode ? 'text-gray-500' : 'text-gray-400'
                    }`}
                  />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className={`w-full pl-11 pr-4 py-2.5 rounded-xl border text-sm transition-all ${
                      darkMode
                        ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500'
                        : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:bg-white focus:border-blue-500'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                    placeholder="tu@email.com"
                  />
                </div>
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-1.5 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  Contrasena
                </label>
                <div className="relative">
                  <Lock
                    className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${
                      darkMode ? 'text-gray-500' : 'text-gray-400'
                    }`}
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className={`w-full pl-11 pr-11 py-2.5 rounded-xl border text-sm transition-all ${
                      darkMode
                        ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500'
                        : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:bg-white focus:border-blue-500'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-3.5 top-1/2 -translate-y-1/2 ${
                      darkMode
                        ? 'text-gray-500 hover:text-gray-300'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {isSignUp ? 'Creando cuenta...' : 'Iniciando sesion...'}
                  </>
                ) : (
                  <>
                    {isSignUp ? 'Crear cuenta' : 'Iniciar sesion'}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Toggle */}
            <div className="mt-6 text-center">
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {isSignUp ? 'Ya tienes cuenta?' : 'No tienes cuenta?'}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError(null);
                  }}
                  className={`font-semibold ${
                    darkMode
                      ? 'text-blue-400 hover:text-blue-300'
                      : 'text-blue-600 hover:text-blue-500'
                  }`}
                >
                  {isSignUp ? 'Inicia sesion' : 'Registrate'}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Globe, Eye } from 'lucide-react';

interface AuthPageProps {
  darkMode: boolean;
  login: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ darkMode, login }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login();
  };

  return (
    <div className={`min-h-screen flex items-center justify-center ${
      darkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <div className={`max-w-md w-full mx-4 p-8 rounded-lg shadow-lg ${
        darkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className={`text-3xl font-bold ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>
            SetterAI
          </h1>
          <p className={`mt-2 text-sm ${
            darkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Plataforma de Appointment Setting
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className={`block text-sm font-medium ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Correo Electrónico
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className={`block text-sm font-medium ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
              placeholder="••••••••"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className={`ml-2 block text-sm ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Recordarme
              </label>
            </div>

            <button
              type="button"
              className={`text-sm ${
                darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'
              }`}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Iniciar Sesión
          </button>
        </form>

        {/* Alternative Login Options */}
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className={`w-full border-t ${
                darkMode ? 'border-gray-600' : 'border-gray-300'
              }`} />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className={`px-2 ${
                darkMode ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-500'
              }`}>
                O continúa con
              </span>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <button
              onClick={login}
              className={`w-full flex items-center justify-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium transition-colors ${
                darkMode 
                  ? 'border-gray-600 text-gray-300 bg-gray-700 hover:bg-gray-600' 
                  : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
              }`}
            >
              <Globe className="w-5 h-5 mr-2" />
              Continuar con Google
            </button>

            <button
              onClick={login}
              className={`w-full flex items-center justify-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium transition-colors ${
                darkMode 
                  ? 'border-gray-600 text-gray-300 bg-gray-700 hover:bg-gray-600' 
                  : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
              }`}
            >
              <Eye className="w-5 h-5 mr-2" />
              Acceso de Invitado
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className={`text-xs ${
            darkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            Al iniciar sesión, aceptas nuestros{' '}
            <a href="#" className={`${
              darkMode ? 'text-blue-400' : 'text-blue-600'
            } hover:underline`}>
              Términos de Servicio
            </a>{' '}
            y{' '}
            <a href="#" className={`${
              darkMode ? 'text-blue-400' : 'text-blue-600'
            } hover:underline`}>
              Política de Privacidad
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
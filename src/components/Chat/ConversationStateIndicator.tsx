import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  Circle,
  TrendingUp,
  Clock,
  MessageCircle,
  Target,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { ConversationStateManager, ConversationMemory } from '@/lib/conversation-state-manager';

interface ConversationStateIndicatorProps {
  conversationId?: string;
  leadId?: string;
  darkMode?: boolean;
  className?: string;
  isAnalyzing?: boolean;
  analysisError?: string;
}

// Phase configuration with descriptions and colors
const PHASE_CONFIG = {
  1: {
    name: 'Situación Actual',
    description: 'Identificando el estado actual del lead',
    color: 'blue',
    icon: Circle,
  },
  2: {
    name: 'Dolor',
    description: 'Explorando problemas y necesidades',
    color: 'orange',
    icon: AlertCircle,
  },
  3: {
    name: 'Situación Deseada',
    description: 'Definiendo objetivos y metas',
    color: 'purple',
    icon: Target,
  },
  4: {
    name: 'Obstáculo',
    description: 'Identificando barreras y objeciones',
    color: 'red',
    icon: AlertCircle,
  },
  5: {
    name: 'Oferta',
    description: 'Presentando solución y agendando',
    color: 'green',
    icon: CheckCircle,
  },
};

// Score level configuration
const getScoreLevel = (score: number) => {
  if (score >= 0.8)
    return { level: 'Alto', color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-800' };
  if (score >= 0.5)
    return {
      level: 'Medio',
      color: 'yellow',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-800',
    };
  return { level: 'Bajo', color: 'red', bgColor: 'bg-red-100', textColor: 'text-red-800' };
};

export const ConversationStateIndicator: React.FC<ConversationStateIndicatorProps> = ({
  conversationId,
  leadId,
  darkMode = false,
  className = '',
  isAnalyzing = false,
  analysisError,
}) => {
  const [conversationMemory, setConversationMemory] = useState<ConversationMemory | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load or create conversation memory data
  useEffect(() => {
    const loadOrCreateMemory = async () => {
      if (!conversationId || !leadId) return;

      setLoading(true);
      setError(null);

      try {
        let memory = await ConversationStateManager.getConversationMemory(conversationId);

        // If memory doesn't exist, create it
        if (!memory) {
          memory = await ConversationStateManager.createInitialMemory(conversationId, leadId);
        }

        setConversationMemory(memory);
      } catch (err) {
        console.error('Error loading or creating conversation data:', err);
        setError('Error al procesar la memoria de la conversación.');
      } finally {
        setLoading(false);
      }
    };

    loadOrCreateMemory();
  }, [conversationId, leadId]);

  // Don't render if no data and not loading
  if (!loading && !conversationMemory && !error) {
    return null;
  }

  const currentPhase = conversationMemory?.current_phase || 1;
  const qualificationScore = conversationMemory?.qualification_score?.score || 0;
  const scoreBreakdown = conversationMemory?.qualification_score?.breakdown;
  const phaseConfig = PHASE_CONFIG[currentPhase as keyof typeof PHASE_CONFIG];
  const scoreLevel = getScoreLevel(qualificationScore);

  return (
    <div
      className={`${className} ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-4 space-y-4`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
          <h3 className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Estado de Conversación
          </h3>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`p-1 rounded-md transition-colors ${
            darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
          }`}
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Loading State */}
      {(loading || isAnalyzing) && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
          <p className={`text-sm mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {isAnalyzing ? 'Analizando conversación con IA...' : 'Cargando estado...'}
          </p>
        </div>
      )}

      {/* Error State */}
      {(error || analysisError) && (
        <div
          className={`p-3 rounded-md ${darkMode ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'} border`}
        >
          <p className={`text-sm ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
            {analysisError || error}
          </p>
        </div>
      )}

      {/* Main Content */}
      {conversationMemory && !loading && !isAnalyzing && (
        <>
          {/* Current Phase Indicator */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span
                className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
              >
                Fase Actual
              </span>
              <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {currentPhase}/5
              </span>
            </div>

            <div className="flex items-center gap-2">
              {phaseConfig.icon && (
                <phaseConfig.icon className={`w-4 h-4 text-${phaseConfig.color}-500`} />
              )}
              <div>
                <p className={`font-medium text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {phaseConfig.name}
                </p>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {phaseConfig.description}
                </p>
              </div>
            </div>

            {/* Phase Progress Bar */}
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(phase => (
                <div
                  key={phase}
                  className={`flex-1 h-2 rounded-full ${
                    phase <= currentPhase
                      ? `bg-${phaseConfig.color}-500`
                      : darkMode
                        ? 'bg-gray-700'
                        : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Qualification Score */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span
                className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
              >
                Puntuación de Cualificación
              </span>
              <span
                className={`text-xs px-2 py-1 rounded-full ${scoreLevel.bgColor} ${scoreLevel.textColor}`}
              >
                {scoreLevel.level}
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span
                  className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}
                >
                  {(qualificationScore * 100).toFixed(1)}%
                </span>
                <TrendingUp className={`w-4 h-4 text-${scoreLevel.color}-500`} />
              </div>

              {/* Score Progress Bar */}
              <div
                className={`w-full h-2 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}
              >
                <div
                  className={`h-2 rounded-full bg-${scoreLevel.color}-500 transition-all duration-300`}
                  style={{ width: `${qualificationScore * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Expanded Details */}
          {isExpanded && (
            <div className="space-y-4 pt-2 border-t border-gray-200 dark:border-gray-700">
              {/* Score Breakdown */}
              {scoreBreakdown && (
                <div className="space-y-2">
                  <h4
                    className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
                  >
                    Desglose de Puntuación
                  </h4>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                        Progreso de Fase
                      </span>
                      <span className={darkMode ? 'text-white' : 'text-gray-900'}>
                        {(scoreBreakdown.phase_score * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                        Participación
                      </span>
                      <span className={darkMode ? 'text-white' : 'text-gray-900'}>
                        {(scoreBreakdown.engagement_score * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                        Información Recolectada
                      </span>
                      <span className={darkMode ? 'text-white' : 'text-gray-900'}>
                        {(scoreBreakdown.info_completeness * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Lead Profile Information */}
              {conversationMemory.lead_profile &&
                Object.keys(conversationMemory.lead_profile).length > 0 && (
                  <div className="space-y-2">
                    <h4
                      className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
                    >
                      Información Recolectada
                    </h4>
                    <div className="space-y-1">
                      {Object.entries(conversationMemory.lead_profile).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-xs">
                          <span
                            className={`capitalize ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                          >
                            {key.replace(/_/g, ' ')}
                          </span>
                          <span
                            className={`max-w-32 truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}
                          >
                            {Array.isArray(value) ? value.join(', ') : String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Conversation Summary */}
              {conversationMemory.conversation_summary && (
                <div className="space-y-2">
                  <h4
                    className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
                  >
                    Resumen de Conversación
                  </h4>
                  <p
                    className={`text-xs leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                  >
                    {conversationMemory.conversation_summary}
                  </p>
                </div>
              )}

              {/* Next Steps */}
              {conversationMemory.next_steps && conversationMemory.next_steps.length > 0 && (
                <div className="space-y-2">
                  <h4
                    className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
                  >
                    Próximos Pasos
                  </h4>
                  <ul className="space-y-1">
                    {conversationMemory.next_steps.map((step, index) => (
                      <li
                        key={index}
                        className={`text-xs flex items-start gap-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                      >
                        <span className="w-1 h-1 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Last Interaction */}
              <div className="flex items-center gap-2 text-xs text-gray-500 pt-2">
                <Clock className="w-3 h-3" />
                <span>
                  Última interacción:{' '}
                  {new Date(conversationMemory.last_interaction).toLocaleString('es-ES')}
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

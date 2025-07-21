import React, { useState } from 'react';
import {
  RefreshCw,
  Clock,
  AlertTriangle,
  CheckCircle,
  Circle,
  Target,
  Lightbulb,
  BarChart3,
  Eye,
  EyeOff,
} from 'lucide-react';

interface PhaseProgress {
  completed: boolean;
  progress: number;
  key_info: string[];
  missing_info: string[];
}

interface ConversationStatus {
  current_phase: number;
  phase_progress: Record<number, PhaseProgress>;
  sentiment_scores: {
    overall: number;
    by_message: Array<{ message_id: string; score: number; emotion: string }>;
  };
  key_insights: string[];
  warnings: string[];
  action_threads: string[];
  urgency_score: number;
  capacity_score: number;
  engagement_score: number;
  updated_at: string;
}

interface ConversationStatusCardProps {
  status: ConversationStatus | null;
  isLoading: boolean;
  onRefresh: () => void;
  isRefreshing: boolean;
  darkMode?: boolean;
  leadName?: string;
}

export const ConversationStatusCard: React.FC<ConversationStatusCardProps> = ({
  status,
  isLoading,
  onRefresh,
  isRefreshing,
  darkMode = false,
  leadName = 'Lead',
}) => {
  const [expandedPhase, setExpandedPhase] = useState<number | null>(null);
  const [showAllInsights, setShowAllInsights] = useState(false);

  const phaseNames = {
    1: 'Situación Actual',
    2: 'Dolor',
    3: 'Situación Deseada',
    4: 'Obstáculo',
    5: 'Oferta',
  };

  const getSentimentIcon = (score: number) => {
    if (score > 0.3) return '😊';
    if (score > -0.3) return '😐';
    return '😟';
  };

  const getSentimentColor = (score: number) => {
    if (score > 0.3) return 'text-green-600';
    if (score > -0.3) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBar = (score: number, max: number = 10, color: string = 'blue') => {
    const percentage = (score / max) * 100;
    const colorClass =
      {
        blue: 'bg-blue-500',
        green: 'bg-green-500',
        yellow: 'bg-yellow-500',
        red: 'bg-red-500',
      }[color] || 'bg-gray-500';

    return (
      <div className="flex items-center gap-2 text-sm">
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${colorClass}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
        <span className="text-xs font-medium w-8">
          {score}/{max}
        </span>
      </div>
    );
  };

  const formatLastUpdate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'Hace menos de 1 min';
    if (minutes < 60) return `Hace ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Hace ${hours}h`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div
        className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
      >
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-300 rounded w-3/4"></div>
          <div className="h-3 bg-gray-300 rounded w-1/2"></div>
          <div className="space-y-2">
            <div className="h-2 bg-gray-300 rounded"></div>
            <div className="h-2 bg-gray-300 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div
        className={`p-4 rounded-lg border-2 border-dashed text-center ${darkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-gray-50'}`}
      >
        <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm text-gray-500 mb-2">Sin análisis disponible</p>
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="text-xs bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isRefreshing ? 'Analizando...' : 'Generar Análisis'}
        </button>
      </div>
    );
  }

  return (
    <div
      className={`rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} overflow-hidden`}
    >
      {/* Header con actualización */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className={`font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
            Estado de {leadName}
          </h3>
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className={`
              p-1.5 rounded transition-all
              ${isRefreshing ? 'animate-spin' : 'hover:bg-gray-100'}
              ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}
            `}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Clock className="w-3 h-3" />
          Actualizado: {formatLastUpdate(status.updated_at)}
        </div>
      </div>

      {/* Fase actual y métricas principales */}
      <div className="p-4 space-y-4">
        {/* Fase actual */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">FASE ACTUAL</span>
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              {status.current_phase}/5
            </span>
          </div>
          <div className="text-lg font-semibold text-blue-600 mb-1">
            {status.current_phase} - {phaseNames[status.current_phase as keyof typeof phaseNames]}
          </div>
          <div className="text-xs text-gray-600">
            Progreso: {status.phase_progress[status.current_phase]?.progress || 0}% completado
          </div>
        </div>

        {/* Métricas de sentimiento y scoring */}
        <div className="grid grid-cols-1 gap-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium">SENTIMIENTO</span>
              <span className={`text-sm ${getSentimentColor(status.sentiment_scores.overall)}`}>
                {getSentimentIcon(status.sentiment_scores.overall)}
                {status.sentiment_scores.overall > 0.3
                  ? 'Positivo'
                  : status.sentiment_scores.overall > -0.3
                    ? 'Neutro'
                    : 'Preocupado'}
              </span>
            </div>
          </div>

          <div>
            <div className="text-xs font-medium mb-2">MÉTRICAS CLAVE</div>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>🔥 Urgencia</span>
                  <span>{status.urgency_score}/10</span>
                </div>
                {getScoreBar(status.urgency_score, 10, 'red')}
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>💰 Capacidad</span>
                  <span>{status.capacity_score}/10</span>
                </div>
                {getScoreBar(status.capacity_score, 10, 'green')}
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>⚡ Engagement</span>
                  <span>{status.engagement_score}/10</span>
                </div>
                {getScoreBar(status.engagement_score, 10, 'blue')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progreso por fases */}
      <div className="border-t border-gray-200 p-4">
        <div className="text-sm font-medium mb-3">PROGRESO POR FASES</div>
        <div className="space-y-2">
          {Object.entries(phaseNames).map(([phaseNum, phaseName]) => {
            const phase = parseInt(phaseNum);
            const progress = status.phase_progress[phase];
            const isExpanded = expandedPhase === phase;
            const hasInfo =
              progress && (progress.key_info.length > 0 || progress.missing_info.length > 0);

            return (
              <div key={phase} className="border border-gray-200 rounded">
                <button
                  onClick={() =>
                    hasInfo ? setExpandedPhase(isExpanded ? null : phase) : undefined
                  }
                  className={`
                    w-full p-2 text-left flex items-center justify-between text-xs
                    ${hasInfo ? 'hover:bg-gray-50 cursor-pointer' : 'cursor-default'}
                  `}
                >
                  <div className="flex items-center gap-2">
                    {progress?.completed ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : phase === status.current_phase ? (
                      <Circle className="w-4 h-4 text-blue-500" />
                    ) : (
                      <Circle className="w-4 h-4 text-gray-300" />
                    )}
                    <span className={progress?.completed ? 'text-green-600 font-medium' : ''}>
                      {phase}. {phaseName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {progress && (
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {progress.progress}%
                      </span>
                    )}
                    {hasInfo &&
                      (isExpanded ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />)}
                  </div>
                </button>

                {isExpanded && progress && (
                  <div className="border-t border-gray-200 p-2 bg-gray-50 text-xs space-y-2">
                    {progress.key_info.length > 0 && (
                      <div>
                        <div className="font-medium text-green-600 mb-1">
                          ✅ Información obtenida:
                        </div>
                        <ul className="list-disc list-inside space-y-1 text-gray-600">
                          {progress.key_info.map((info, idx) => (
                            <li key={idx}>{info}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {progress.missing_info.length > 0 && (
                      <div>
                        <div className="font-medium text-orange-600 mb-1">⏳ Falta obtener:</div>
                        <ul className="list-disc list-inside space-y-1 text-gray-600">
                          {progress.missing_info.map((info, idx) => (
                            <li key={idx}>{info}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Key Insights */}
      {status.key_insights.length > 0 && (
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium">🎯 KEY INSIGHTS</div>
            {status.key_insights.length > 3 && (
              <button
                onClick={() => setShowAllInsights(!showAllInsights)}
                className="text-xs text-blue-600 hover:underline"
              >
                {showAllInsights ? 'Ver menos' : `Ver todos (${status.key_insights.length})`}
              </button>
            )}
          </div>
          <div className="space-y-2">
            {(showAllInsights ? status.key_insights : status.key_insights.slice(0, 3)).map(
              (insight, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs">
                  <Lightbulb className="w-3 h-3 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">{insight}</span>
                </div>
              ),
            )}
          </div>
        </div>
      )}

      {/* Action Threads */}
      {status.action_threads.length > 0 && (
        <div className="border-t border-gray-200 p-4">
          <div className="text-sm font-medium mb-2">🧵 HILOS PARA EXPLOTAR</div>
          <div className="space-y-2">
            {status.action_threads.map((thread, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs">
                <Target className="w-3 h-3 text-blue-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-600">{thread}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warnings */}
      {status.warnings.length > 0 && (
        <div className="border-t border-gray-200 p-4 bg-red-50">
          <div className="text-sm font-medium mb-2 text-red-800">⚠️ WARNINGS</div>
          <div className="space-y-2">
            {status.warnings.map((warning, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs">
                <AlertTriangle className="w-3 h-3 text-red-500 mt-0.5 flex-shrink-0" />
                <span className="text-red-700">{warning}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Response validation constants and configuration

import type { ValidationConfig } from './types';

// Default configuration - Ajustado para permitir respuestas más naturales
export const DEFAULT_VALIDATION_CONFIG: ValidationConfig = {
  minScore: 0.5, // Reducido para permitir más flexibilidad
  keyPhraseWeight: 0.6, // Menos énfasis en coincidencias exactas
  strictMode: false,
  regenerateThreshold: 0.3, // Solo regenerar si es muy malo
  maxRegenerationAttempts: 1, // Menos intentos para evitar sobre-optimización
};

// Synonym mapping for flexible matching - Expandido con lenguaje informal
export const SYNONYM_MAP: Record<string, string[]> = {
  problema: [
    'dificultad',
    'inconveniente',
    'reto',
    'desafío',
    'obstáculo',
    'lio',
    'rollo',
    'tema',
    'movida',
  ],
  objetivo: [
    'meta',
    'propósito',
    'finalidad',
    'intención',
    'lo que quieres',
    'lo que buscas',
    'tu plan',
  ],
  negocio: ['empresa', 'emprendimiento', 'proyecto', 'compañía', 'curro', 'tu rollo', 'lo tuyo'],
  youtube: ['canal', 'contenido', 'videos', 'plataforma', 'yt', 'el tubo'],
  ayudar: ['asistir', 'apoyar', 'colaborar', 'contribuir', 'echar una mano', 'darle', 'meter caña'],
  entender: ['comprender', 'entiendo', 'comprendo', 'pillo', 'capto', 'te sigo', 'claro'],
  hola: ['hey', 'que tal', 'buenas', 'que pasa', 'como va', 'ey'],
  gracias: ['grax', 'thanks', 'genial', 'top', 'guay', 'de puta madre'],
};

// Phase-specific validation rules - Más flexible para lenguaje natural
export const PHASE_VALIDATION_RULES: Record<
  number,
  {
    requiredElements: string[];
    forbiddenElements: string[];
    maxLength: number;
  }
> = {
  1: {
    requiredElements: [], // No forzar palabras específicas
    forbiddenElements: ['precio', '5000', '€', 'euros', 'coste'], // Solo evitar hablar de dinero
    maxLength: 250, // Más espacio para conversación natural
  },
  2: {
    requiredElements: [], // Permitir flexibilidad en cómo expresar dolor
    forbiddenElements: ['precio', '5000', '€', 'euros'],
    maxLength: 300,
  },
  3: {
    requiredElements: [], // No forzar frases específicas
    forbiddenElements: ['precio exacto', 'coste específico'],
    maxLength: 350,
  },
  4: {
    requiredElements: [], // Flexibilidad total en la negociación
    forbiddenElements: [],
    maxLength: 300,
  },
  5: {
    requiredElements: [], // Permitir cerrar de forma natural
    forbiddenElements: [],
    maxLength: 250,
  },
};
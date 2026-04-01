// Phase analysis module - handles sales phase detection and progress

import { PhaseDetail } from './types';

const phaseNames = {
  1: 'Situación Actual',
  2: 'Dolor',
  3: 'Situación Deseada',
  4: 'Obstáculo',
  5: 'Oferta',
};

export function getPhaseName(phase: number): string {
  return phaseNames[phase as keyof typeof phaseNames] || 'Desconocida';
}

export function generatePhaseDetails(
  _messages: any[],
  currentPhase: number,
): Record<number, PhaseDetail> {
  const phases: Record<number, PhaseDetail> = {};

  for (let i = 1; i <= 5; i++) {
    phases[i] = {
      name: getPhaseName(i),
      status: i < currentPhase ? 'completed' : i === currentPhase ? 'in_progress' : 'not_started',
      progress: i < currentPhase ? 100 : i === currentPhase ? 50 : 0,
      information_gathered: [],
      next_steps: [],
    };
  }

  return phases;
}

export function generatePhaseProgress(_messages: any[], currentPhase: number): any {
  const progress: any = {};

  for (let i = 1; i <= 5; i++) {
    progress[i] = {
      completed: i < currentPhase,
      progress: i < currentPhase ? 100 : i === currentPhase ? 50 : 0,
      key_info: [],
      missing_info: [],
    };
  }

  return progress;
}

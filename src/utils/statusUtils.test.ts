import { describe, it, expect } from 'vitest';
import { getStatusClasses, STATUS_COLORS } from './statusUtils';

describe('getStatusClasses', () => {
  it('should return the correct classes for "Open" status in light mode', () => {
    const classes = getStatusClasses('Open', false);
    expect(classes).toBe('bg-green-100 text-green-700 border-green-200');
  });

  it('should return the correct classes for "Open" status in dark mode', () => {
    const classes = getStatusClasses('Open', true);
    expect(classes).toBe('bg-green-600/20 text-green-400 border-green-500/30');
  });

  it('should return the correct classes for "Freeze" status in light mode', () => {
    const classes = getStatusClasses('Freeze', false);
    expect(classes).toBe('bg-gray-100 text-gray-700 border-gray-200');
  });

  it('should return the correct classes for "Freeze" status in dark mode', () => {
    const classes = getStatusClasses('Freeze', true);
    expect(classes).toBe('bg-gray-600/20 text-gray-400 border-gray-500/30');
  });

  it('should return gray classes for an unknown status', () => {
    const classes = getStatusClasses('UnknownStatus', false);
    expect(classes).toBe('bg-gray-100 text-gray-700 border-gray-200');
  });

  it('should return dark gray classes for an unknown status in dark mode', () => {
    const classes = getStatusClasses('UnknownStatus', true);
    expect(classes).toBe('bg-gray-600/20 text-gray-400 border-gray-500/30');
  });

  // Test all defined statuses to ensure they map to a color class
  Object.keys(STATUS_COLORS).forEach(status => {
    it(`should return a valid class string for "${status}" in light mode`, () => {
      const classes = getStatusClasses(status, false);
      expect(typeof classes).toBe('string');
      expect(classes.length).toBeGreaterThan(0);
    });

    it(`should return a valid class string for "${status}" in dark mode`, () => {
      const classes = getStatusClasses(status, true);
      expect(typeof classes).toBe('string');
      expect(classes.length).toBeGreaterThan(0);
    });
  });
});

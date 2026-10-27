/**
 * Prefs helpers are pure enough to unit-test without AudioContext.
 * Run: npx vitest run src/lib/sounds.spec.ts  (if vitest configured)
 * or:  node --experimental-vm-modules … — here we use a tiny assert script via jest-free checks.
 */
import { getOrderSoundPrefs, setOrderSoundPrefs, stopOrderAlert } from './sounds';

describe('order sound prefs', () => {
  beforeEach(() => {
    localStorage.clear();
    stopOrderAlert();
  });

  it('defaults to unmuted with volume', () => {
    expect(getOrderSoundPrefs()).toEqual({ muted: false, volume: 0.85 });
  });

  it('persists mute and volume', () => {
    setOrderSoundPrefs({ muted: true, volume: 0.4 });
    expect(getOrderSoundPrefs()).toEqual({ muted: true, volume: 0.4 });
  });

  it('clamps volume to 0..1', () => {
    setOrderSoundPrefs({ volume: 2 });
    expect(getOrderSoundPrefs().volume).toBe(1);
    setOrderSoundPrefs({ volume: -1 });
    expect(getOrderSoundPrefs().volume).toBe(0);
  });
});

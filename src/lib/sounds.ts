let shared: AudioContext | null = null;
let orderGen = 0;
const activeOrderOsc: OscillatorNode[] = [];
let unlockBound = false;

const PREFS_KEY = 'rs-order-sound';

export type OrderSoundPrefs = { muted: boolean; volume: number };

export function getOrderSoundPrefs(): OrderSoundPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return { muted: false, volume: 0.85 };
    const parsed = JSON.parse(raw) as Partial<OrderSoundPrefs>;
    const volume = Math.min(1, Math.max(0, Number(parsed.volume ?? 0.85)));
    return { muted: Boolean(parsed.muted), volume: Number.isFinite(volume) ? volume : 0.85 };
  } catch {
    return { muted: false, volume: 0.85 };
  }
}

export function setOrderSoundPrefs(next: Partial<OrderSoundPrefs>) {
  const current = getOrderSoundPrefs();
  const volume = Math.min(1, Math.max(0, next.volume ?? current.volume));
  const muted = next.muted ?? current.muted;
  localStorage.setItem(PREFS_KEY, JSON.stringify({ muted, volume }));
  window.dispatchEvent(new CustomEvent('rs-order-sound-prefs'));
  return { muted, volume };
}

function AudioCtx(): typeof AudioContext | null {
  return window.AudioContext
    || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    || null;
}

function context() {
  const Ctx = AudioCtx();
  if (!Ctx) return null;
  shared ??= new Ctx();
  return shared;
}

/** iOS/Android: silent buffer + resume so later alerts can play without another tap. */
async function unlockContext(ac: AudioContext) {
  if (ac.state === 'suspended') {
    try { await ac.resume(); } catch { /* gesture may still be required */ }
  }
  try {
    const buffer = ac.createBuffer(1, 1, ac.sampleRate || 22050);
    const source = ac.createBufferSource();
    source.buffer = buffer;
    source.connect(ac.destination);
    source.start(0);
  } catch { /* ignore */ }
  return ac.state === 'running' ? ac : null;
}

async function ready() {
  const ac = context();
  if (!ac) return null;
  return unlockContext(ac);
}

export function unlockSound() {
  void ready();
}

/** Bind unlock to common mobile gestures (safe to call once). */
export function bindSoundUnlock() {
  if (unlockBound || typeof window === 'undefined') return;
  unlockBound = true;
  const unlock = () => { void ready(); };
  const opts: AddEventListenerOptions = { capture: true, passive: true };
  window.addEventListener('touchstart', unlock, opts);
  window.addEventListener('pointerdown', unlock, opts);
  window.addEventListener('click', unlock, opts);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void ready();
  });
}

function beep(ac: AudioContext, freq: number, duration: number, type: OscillatorType, gain: number, delay = 0, track?: OscillatorNode[]) {
  const osc = ac.createOscillator();
  const amp = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const start = ac.currentTime + delay;
  amp.gain.setValueAtTime(0, start);
  amp.gain.linearRampToValueAtTime(gain, start + 0.015);
  amp.gain.linearRampToValueAtTime(0, start + duration);
  osc.connect(amp);
  amp.connect(ac.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
  track?.push(osc);
  osc.onended = () => {
    const index = track?.indexOf(osc) ?? -1;
    if (index >= 0) track?.splice(index, 1);
  };
}

function play(notes: { freq: number; duration: number; type: OscillatorType; gain: number; delay?: number }[]) {
  void ready().then((ac) => {
    if (!ac) return;
    notes.forEach((note) => beep(ac, note.freq, note.duration, note.type, note.gain, note.delay || 0));
  });
}

export function playSpin() {
  play([
    { freq: 220, duration: 0.12, type: 'triangle', gain: 0.22 },
    { freq: 330, duration: 0.14, type: 'triangle', gain: 0.16, delay: 0.1 },
    { freq: 494, duration: 0.18, type: 'sine', gain: 0.14, delay: 0.2 },
  ]);
}

export function playTick() {
  play([{ freq: 740, duration: 0.045, type: 'square', gain: 0.05 }]);
}

export function playScratch() {
  play([{ freq: 140, duration: 0.06, type: 'sawtooth', gain: 0.08 }]);
}

export function playGift() {
  play([
    { freq: 392, duration: 0.1, type: 'square', gain: 0.1 },
    { freq: 784, duration: 0.2, type: 'sine', gain: 0.16, delay: 0.08 },
  ]);
}

export function playSlot() {
  play([{ freq: 180, duration: 0.06, type: 'square', gain: 0.1 }]);
}

export function playWin() {
  play([
    { freq: 523, duration: 0.12, type: 'sine', gain: 0.18 },
    { freq: 659, duration: 0.14, type: 'sine', gain: 0.16, delay: 0.1 },
    { freq: 784, duration: 0.24, type: 'sine', gain: 0.16, delay: 0.2 },
  ]);
}

/** Short UI ping (toasts / light alerts). */
export function playNotify() {
  play([
    { freq: 880, duration: 0.12, type: 'sine', gain: 0.16 },
    { freq: 1175, duration: 0.2, type: 'sine', gain: 0.14, delay: 0.14 },
  ]);
}

export function stopOrderAlert() {
  orderGen += 1;
  while (activeOrderOsc.length) {
    const osc = activeOrderOsc.pop();
    try { osc?.stop(); } catch { /* already stopped */ }
  }
}

/** Android Chrome supports this; iOS Safari does not — fail quietly. */
export function buzzOrderAlert() {
  try {
    if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
    navigator.vibrate([220, 120, 220, 120, 320, 160, 220, 120, 220]);
  } catch { /* unsupported */ }
}

/**
 * Counter order alert — ~5s kitchen-bell style, respects mute/volume.
 * Works on Android Chrome + iOS Safari after a prior user gesture (bindSoundUnlock).
 */
export function playOrderAlert() {
  const prefs = getOrderSoundPrefs();
  if (prefs.muted) return;
  stopOrderAlert();
  const gen = orderGen;
  const scale = 0.35 + prefs.volume * 0.65;
  buzzOrderAlert();
  void ready().then((ac) => {
    if (!ac || gen !== orderGen) return;
    for (let i = 0; i < 5; i += 1) {
      const t = i * 1.0;
      beep(ac, 830, 0.22, 'triangle', 0.22 * scale, t, activeOrderOsc);
      beep(ac, 1660, 0.16, 'sine', 0.1 * scale, t + 0.02, activeOrderOsc);
      beep(ac, 1108, 0.3, 'triangle', 0.2 * scale, t + 0.22, activeOrderOsc);
      beep(ac, 2216, 0.18, 'sine', 0.08 * scale, t + 0.24, activeOrderOsc);
    }
  });
}

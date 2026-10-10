let shared: AudioContext | null = null;

function context() {
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  shared ??= new Ctx();
  return shared;
}

async function ready() {
  const ac = context();
  if (!ac) return null;
  if (ac.state === 'suspended') await ac.resume();
  return ac.state === 'running' ? ac : null;
}

function beep(ac: AudioContext, freq: number, duration: number, type: OscillatorType, gain: number, delay = 0) {
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
}

function play(notes: { freq: number; duration: number; type: OscillatorType; gain: number; delay?: number }[]) {
  void ready().then((ac) => {
    if (!ac) return;
    notes.forEach((note) => beep(ac, note.freq, note.duration, note.type, note.gain, note.delay || 0));
  });
}

export function unlockSound() { void ready(); }

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

export function playNotify() {
  play([
    { freq: 880, duration: 0.1, type: 'sine', gain: 0.16 },
    { freq: 1175, duration: 0.18, type: 'sine', gain: 0.14, delay: 0.12 },
  ]);
}

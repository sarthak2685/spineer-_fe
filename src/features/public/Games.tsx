import { PointerEvent, ReactNode, useEffect, useRef, useState } from 'react';
import { playGift, playScratch, playSlot, playSpin, playTick, playWin } from '../../lib/sounds';

export type PrizeSlice = { name: string; coins: number };
export type PlayResult = { prizeName: string; coins: number; segmentIndex: number; prizes?: PrizeSlice[] };

const colors = ['#ea580c', '#0f766e', '#d97706', '#7c3aed', '#e11d48', '#1d4ed8', '#65a30d', '#c2410c'];

export function GameStage({
  game, prizes, busy, onPlay, onReveal, accent = '#ea580c',
}: {
  game: string;
  prizes: PrizeSlice[];
  busy: boolean;
  onPlay: () => Promise<PlayResult>;
  onReveal: (result: PlayResult) => void;
  accent?: string;
}) {
  if (game === 'ScratchCard') return <Scratch busy={busy} onPlay={onPlay} onReveal={onReveal} accent={accent} />;
  if (game === 'MysteryGiftBox') return <Gift busy={busy} onPlay={onPlay} onReveal={onReveal} />;
  if (game === 'SlotMachine') return <Slots busy={busy} onPlay={onPlay} onReveal={onReveal} accent={accent} />;
  return <Wheel prizes={prizes} busy={busy} onPlay={onPlay} onReveal={onReveal} accent={accent} />;
}

function easeWheel(t: number) {
  return 1 - (1 - t) ** 3;
}

function mix(hex: string, amount: number) {
  const n = Number.parseInt(hex.slice(1), 16);
  const channel = (shift: number) => {
    const value = (n >> shift) & 255;
    return Math.round(value + (255 - value) * amount);
  };
  return `rgb(${channel(16)}, ${channel(8)}, ${channel(0)})`;
}

function Cabinet({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="w-full max-w-[22rem] rounded-[28px] bg-gradient-to-b from-stone-800 to-stone-950 p-3 text-center shadow-[0_24px_50px_rgba(28,25,23,.28)] ring-1 ring-amber-100/15 sm:max-w-sm sm:p-4">
      <div className="mb-3 flex items-center justify-center gap-1.5" aria-hidden="true">
        {Array.from({ length: 7 }, (_, index) => <span key={index} className={`h-1.5 w-1.5 rounded-full ${index % 2 ? 'bg-amber-300' : 'bg-orange-500'}`} />)}
      </div>
      <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-amber-200">{title}</p>
      <div className="mt-3">{children}</div>
      {action}
    </div>
  );
}

function RimLights({ on }: { on: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10" aria-hidden="true">
      {Array.from({ length: 14 }, (_, index) => {
        const angle = ((index / 14) * 360 - 90) * (Math.PI / 180);
        return (
          <span
            key={index}
            className={`absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full ${on ? 'bg-white shadow-[0_0_8px_#fff]' : 'bg-amber-200'} ${on && index % 2 === 0 ? 'animate-pulse' : ''}`}
            style={{ left: `${50 + Math.cos(angle) * 47}%`, top: `${50 + Math.sin(angle) * 47}%`, animationDelay: `${index * 70}ms` }}
          />
        );
      })}
    </div>
  );
}

function Wheel({ prizes, busy, onPlay, onReveal, accent }: { prizes: PrizeSlice[]; busy: boolean; onPlay: () => Promise<PlayResult>; onReveal: (result: PlayResult) => void; accent: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const pointer = useRef<HTMLDivElement>(null);
  const angleRef = useRef(0);
  const frameRef = useRef(0);
  const spinningRef = useRef(false);
  const [locked, setLocked] = useState(false);
  const slices = prizes.length ? prizes : [
    { name: 'Try again', coins: 0 }, { name: '10 coins', coins: 10 }, { name: '25 coins', coins: 25 },
    { name: '50 coins', coins: 50 }, { name: '5 coins', coins: 5 }, { name: '100 coins', coins: 100 },
  ];
  const sliceKey = slices.map((slice) => `${slice.coins}|${slice.name}`).join('||');

  function draw(drawn: PrizeSlice[]) {
    const node = canvas.current;
    const ctx = node?.getContext('2d');
    if (!node || !ctx || !drawn.length) return;
    const size = 360;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    node.width = Math.round(size * dpr);
    node.height = Math.round(size * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const arc = (Math.PI * 2) / drawn.length;
    const cx = size / 2;
    ctx.beginPath();
    ctx.arc(cx, cx, 176, 0, Math.PI * 2);
    ctx.fillStyle = '#1c1917';
    ctx.fill();
    drawn.forEach((slice, index) => {
      const start = index * arc - Math.PI / 2;
      const end = start + arc;
      const mid = start + arc / 2;
      const tone = colors[index % colors.length];
      const gradient = ctx.createLinearGradient(cx + Math.cos(mid) * 30, cx + Math.sin(mid) * 30, cx + Math.cos(mid) * 160, cx + Math.sin(mid) * 160);
      gradient.addColorStop(0, mix(tone, 0.28));
      gradient.addColorStop(1, tone);
      ctx.beginPath();
      ctx.moveTo(cx, cx);
      ctx.fillStyle = gradient;
      ctx.arc(cx, cx, 160, start, end);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.72)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.save();
      ctx.translate(cx, cx);
      ctx.rotate(mid);
      ctx.fillStyle = '#fff';
      ctx.shadowColor = 'rgba(0,0,0,.35)';
      ctx.shadowBlur = 4;
      ctx.textAlign = 'left';
      const title = slice.coins > 0 ? String(slice.coins) : 'Try';
      ctx.font = `700 ${drawn.length > 8 ? 15 : 18}px Plus Jakarta Sans, sans-serif`;
      ctx.fillText(title, 68, -2);
      ctx.font = '600 11px Plus Jakarta Sans, sans-serif';
      ctx.fillText(slice.coins > 0 ? 'coins' : 'again', 68, 14);
      ctx.restore();
    });
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(cx, cx, 48, 0, Math.PI * 2);
    ctx.fillStyle = '#fbbf24';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cx, 40, 0, Math.PI * 2);
    ctx.fillStyle = '#1c1917';
    ctx.fill();
  }

  useEffect(() => {
    if (spinningRef.current) return;
    const drawn = sliceKey.split('||').map((part) => {
      const splitAt = part.indexOf('|');
      return { coins: Number(part.slice(0, splitAt)), name: part.slice(splitAt + 1) };
    });
    draw(drawn);
  }, [sliceKey]);

  useEffect(() => () => cancelAnimationFrame(frameRef.current), []);

  function nudge() {
    pointer.current?.animate(
      [{ transform: 'rotate(0deg)' }, { transform: 'rotate(16deg)' }, { transform: 'rotate(0deg)' }],
      { duration: 90, easing: 'ease-out' },
    );
  }

  async function spin() {
    if (busy || locked || spinningRef.current) return;
    setLocked(true);
    spinningRef.current = true;
    playSpin();
    try {
      const result = await onPlay();
      const board = result.prizes?.length ? result.prizes : slices;
      const nextKey = board.map((slice) => `${slice.coins}|${slice.name}`).join('||');
      if (nextKey !== sliceKey) draw(board);
      const arc = 360 / board.length;
      const index = result.segmentIndex % board.length;
      const target = (360 - (index * arc + arc / 2) + 360) % 360;
      const from = angleRef.current;
      const normalized = ((from % 360) + 360) % 360;
      let delta = target - normalized;
      if (delta < 1) delta += 360;
      const distance = 360 * 5 + delta;
      const duration = 4800;
      const start = performance.now();
      let lastSlice = Math.floor(from / arc);
      let lastTick = 0;
      const node = canvas.current;
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        const angle = from + distance * easeWheel(t);
        angleRef.current = angle;
        if (node) node.style.transform = `translate3d(0,0,0) rotate(${angle}deg)`;
        const crossed = Math.floor(angle / arc);
        if (crossed !== lastSlice) {
          lastSlice = crossed;
          if (now - lastTick > 70) {
            lastTick = now;
            playTick();
            nudge();
          }
        }
        if (t < 1) {
          frameRef.current = requestAnimationFrame(step);
          return;
        }
        if (node) node.style.transform = `translate3d(0,0,0) rotate(${from + distance}deg)`;
        angleRef.current = from + distance;
        spinningRef.current = false;
        setLocked(false);
        playWin();
        onReveal(result);
      };
      frameRef.current = requestAnimationFrame(step);
    } catch {
      spinningRef.current = false;
      setLocked(false);
    }
  }

  return (
    <div className="relative grid place-items-center py-3">
      <div className="absolute left-1/2 top-1 z-20 -translate-x-1/2">
        <div ref={pointer} className="origin-top drop-shadow">
          <svg viewBox="0 0 36 42" className="h-9 w-8" aria-hidden="true">
            <path d="M18 40 6 12c4 4 8 5 12 5s8-1 12-5L18 40z" fill="#fbbf24" stroke="#fff" strokeWidth="2" />
          </svg>
        </div>
      </div>
      <div className="relative w-[min(17rem,92%)] rounded-full bg-gradient-to-b from-stone-700 to-stone-950 p-2 shadow-[0_24px_50px_rgba(28,25,23,.35)] sm:w-[min(20rem,100%)] sm:p-3">
        <RimLights on={locked} />
        <div className="flex aspect-square w-full items-center justify-center rounded-full border-[7px] border-amber-300 shadow-[inset_0_0_0_3px_rgba(28,25,23,.65)] sm:border-[10px]">
          <canvas ref={canvas} className="h-full w-full rounded-full will-change-transform" style={{ transform: 'translate3d(0,0,0)' }} />
        </div>
      </div>
      <button type="button" disabled={busy || locked} onClick={spin} className="absolute z-20 grid h-16 w-16 place-items-center rounded-full text-xs font-bold tracking-[0.16em] text-white shadow-[0_10px_24px_rgba(0,0,0,.28)] ring-4 ring-amber-200 disabled:opacity-70 sm:h-[4.5rem] sm:w-[4.5rem] sm:text-sm" style={{ background: accent }}>{busy || locked ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-r-transparent" /> : 'SPIN'}</button>
    </div>
  );
}

function Scratch({ busy, onPlay, onReveal, accent }: { busy: boolean; onPlay: () => Promise<PlayResult>; onReveal: (result: PlayResult) => void; accent: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [prize, setPrize] = useState<PlayResult | null>(null);
  const [preparing, setPreparing] = useState(false);
  const started = useRef(false);
  const arming = useRef(false);
  const revealed = useRef(false);
  const strokes = useRef(0);
  const held = useRef<PlayResult | null>(null);
  useEffect(() => { paint(); }, []);

  function paint() {
    const node = canvas.current;
    const ctx = node?.getContext('2d');
    if (!node || !ctx) return;
    const width = 360;
    const height = 208;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    node.width = Math.round(width * dpr);
    node.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#fde68a');
    gradient.addColorStop(0.45, '#f59e0b');
    gradient.addColorStop(1, '#d97706');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = 'rgba(255,255,255,.28)';
    for (let y = 8; y < height; y += 16) {
      for (let x = (y / 16) % 2 ? 8 : 0; x < width; x += 16) {
        ctx.beginPath();
        ctx.arc(x, y, 1.3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    const shine = ctx.createLinearGradient(0, 0, width, height);
    shine.addColorStop(0, 'rgba(255,255,255,0)');
    shine.addColorStop(0.42, 'rgba(255,255,255,.45)');
    shine.addColorStop(0.58, 'rgba(255,255,255,0)');
    ctx.fillStyle = shine;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = 'rgba(120,53,15,.8)';
    ctx.font = '700 22px Plus Jakarta Sans, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SCRATCH', width / 2, height / 2 - 4);
    ctx.font = '600 12px Plus Jakarta Sans, sans-serif';
    ctx.fillText('Rub the gold foil', width / 2, height / 2 + 18);
  }

  async function scratch(event: PointerEvent<HTMLCanvasElement>) {
    const node = canvas.current;
    const ctx = node?.getContext('2d');
    if (!node || !ctx || busy || revealed.current || preparing) return;
    if (event.type === 'pointerdown') node.setPointerCapture(event.pointerId);
    if (!started.current) {
      if (arming.current) return;
      arming.current = true;
      setPreparing(true);
      try {
        const result = await onPlay();
        started.current = true;
        held.current = result;
        setPrize(result);
      } catch {
        arming.current = false;
        setPreparing(false);
        return;
      } finally {
        setPreparing(false);
      }
    }
    const rect = node.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 360;
    const y = ((event.clientY - rect.top) / rect.height) * 208;
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineWidth = 34;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(0,0,0,1)';
    ctx.fillStyle = 'rgba(0,0,0,1)';
    if (!last.current || event.type === 'pointerdown') {
      ctx.beginPath();
      ctx.arc(x, y, 17, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(last.current.x, last.current.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
    last.current = { x, y };
    strokes.current += 1;
    if (strokes.current % 5 === 1) playScratch();
    if (revealed.current || !held.current || strokes.current % 4 !== 0) return;
    const sample = ctx.getImageData(0, 0, node.width, node.height).data;
    let clear = 0;
    let total = 0;
    for (let index = 3; index < sample.length; index += 64) {
      total += 1;
      if (sample[index] < 24) clear += 1;
    }
    if (total && clear / total >= 0.42) {
      revealed.current = true;
      playWin();
      onReveal(held.current);
    }
  }

  return (
    <Cabinet title="Scratch card" action={<p className="mt-3 text-xs text-stone-400">Rub the foil until your coins show through.</p>}>
      <div className="relative h-44 overflow-hidden rounded-2xl shadow-inner ring-2 ring-white/70 sm:h-52" style={{ boxShadow: `inset 0 0 0 3px ${accent}` }}>
        <div className="grid h-full place-items-center bg-[radial-gradient(circle_at_top,#fff7ed,#ffedd5_46%,#fdba74)] px-4 text-center text-stone-950">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-orange-800">Your prize</p>
            <p className="mt-1 font-display text-4xl font-semibold">{prize ? prize.coins : '—'}</p>
            <p className="text-sm font-semibold text-stone-700">{prize ? prize.prizeName : 'Hidden under the foil'}</p>
          </div>
        </div>
        <canvas ref={canvas} onPointerDown={scratch} onPointerMove={(event) => { if (event.buttons) scratch(event); }} onPointerUp={() => { last.current = null; }} className="absolute inset-0 h-full w-full touch-none" />
        {preparing && (
          <div className="absolute inset-0 z-10 grid place-items-center bg-stone-950/45 text-sm font-semibold text-white" aria-live="polite">
            Preparing…
          </div>
        )}
      </div>
    </Cabinet>
  );
}

const wraps = [
  { body: 'from-orange-500 to-orange-700', ribbon: 'bg-amber-100' },
  { body: 'from-rose-500 to-rose-800', ribbon: 'bg-orange-100' },
  { body: 'from-amber-400 to-amber-600', ribbon: 'bg-white' },
];

function Gift({ busy, onPlay, onReveal }: { busy: boolean; onPlay: () => Promise<PlayResult>; onReveal: (result: PlayResult) => void }) {
  const [open, setOpen] = useState<number | null>(null);
  const [pending, setPending] = useState<number | null>(null);
  const [prize, setPrize] = useState<PlayResult | null>(null);
  async function choose(index: number) {
    if (busy || open !== null || pending !== null) return;
    setPending(index);
    try {
      playGift();
      const result = await onPlay();
      setOpen(index);
      setPrize(result);
      window.setTimeout(() => { playWin(); onReveal(result); }, 700);
    } catch { setPending(null); }
  }
  return (
    <Cabinet title="Mystery box" action={<p className="mt-3 text-xs text-stone-400">{open === null ? 'Pick one box. The other two stay shut.' : 'That box is open.'}</p>}>
      <div className="flex items-end justify-center gap-3 sm:gap-4">
        {wraps.map((wrap, index) => {
          const chosen = open === index;
          const dim = open !== null && !chosen;
          return (
            <button key={index} type="button" disabled={busy || open !== null || pending !== null} onClick={() => choose(index)} aria-label={chosen ? `Opened, ${prize?.coins ?? 0} coins` : `Pick box ${index + 1}`} className={`w-[5.1rem] text-center transition duration-300 disabled:opacity-100 sm:w-[6.5rem] ${dim ? 'scale-95 opacity-35' : ''}`}>
              <span className={`relative mx-auto mb-1 block h-6 w-full transition duration-500 ${chosen ? '-translate-y-2 -rotate-6' : ''}`}>
                <span className="absolute left-1/2 top-1 h-4 w-4 -translate-x-[130%] rounded-full border-[3px] border-amber-100" />
                <span className="absolute left-1/2 top-1 h-4 w-4 translate-x-[30%] rounded-full border-[3px] border-amber-100" />
                <span className={`absolute left-1/2 top-2.5 h-3 w-3 -translate-x-1/2 rounded-full ${wrap.ribbon}`} />
              </span>
              <span className={`relative mx-auto grid h-[6.5rem] w-full place-items-center overflow-hidden rounded-2xl bg-gradient-to-b shadow-[0_16px_28px_rgba(0,0,0,.28)] transition duration-300 sm:h-32 ${chosen ? 'from-amber-200 to-amber-400 text-stone-950' : `${wrap.body} text-white ${open === null ? 'hover:-translate-y-1' : ''}`}`}>
                <span className={`absolute inset-y-0 left-1/2 w-3 -translate-x-1/2 ${chosen ? 'bg-white/70' : wrap.ribbon}`} />
                <span className={`absolute inset-x-3 top-1/2 h-3 -translate-y-1/2 ${chosen ? 'bg-white/70' : wrap.ribbon}`} />
                <span className="relative z-10 font-display text-xl font-semibold">{chosen ? prize?.coins : pending === index ? <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" /> : '?'}</span>
              </span>
              <span className="mt-2 block text-[11px] font-semibold uppercase tracking-wide text-stone-300">{chosen ? 'Opened' : `Box ${index + 1}`}</span>
            </button>
          );
        })}
      </div>
    </Cabinet>
  );
}

const slotSymbols = [
  { glyph: '7', color: '#ea580c' },
  { glyph: '★', color: '#d97706' },
  { glyph: '◆', color: '#e11d48' },
  { glyph: '●', color: '#0f766e' },
];

function Reel({ symbol, spinning }: { symbol: string; spinning: boolean }) {
  const track = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = track.current;
    if (!node || !spinning) return undefined;
    const anim = node.animate(
      [{ transform: 'translateY(0)' }, { transform: 'translateY(-50%)' }],
      { duration: 280, iterations: Infinity, easing: 'linear' },
    );
    return () => anim.cancel();
  }, [spinning]);
  const tone = slotSymbols.find((item) => item.glyph === symbol)?.color || '#1c1917';
  const loop = [...slotSymbols, ...slotSymbols];
  return (
    <div className="relative h-24 overflow-hidden rounded-xl bg-gradient-to-b from-stone-100 via-white to-stone-200 shadow-[inset_0_8px_16px_rgba(28,25,23,.12)] sm:h-32">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-5 bg-gradient-to-b from-stone-900/25 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-5 bg-gradient-to-t from-stone-900/20 to-transparent" />
      {spinning ? (
        <div ref={track}>
          {loop.map((item, index) => <div key={index} className="grid h-24 place-items-center text-4xl font-black sm:h-32 sm:text-5xl" style={{ color: item.color }}>{item.glyph}</div>)}
        </div>
      ) : (
        <div className="grid h-full place-items-center text-4xl font-black sm:text-5xl" style={{ color: tone }}>{symbol}</div>
      )}
    </div>
  );
}

function pause(ms: number) {
  return new Promise((resolve) => { window.setTimeout(resolve, ms); });
}

function Slots({ busy, onPlay, onReveal, accent }: { busy: boolean; onPlay: () => Promise<PlayResult>; onReveal: (result: PlayResult) => void; accent: string }) {
  const symbols = slotSymbols.map((item) => item.glyph);
  const [reels, setReels] = useState(['7', '★', '◆']);
  const [spinning, setSpinning] = useState(false);
  const [hold, setHold] = useState(3);
  const [landed, setLanded] = useState<PlayResult | null>(null);

  async function pull() {
    if (busy || spinning) return;
    setSpinning(true);
    setHold(0);
    setLanded(null);
    playSlot();
    try {
      const result = await onPlay();
      const symbol = symbols[result.segmentIndex % symbols.length];
      const next = result.coins > 0
        ? [symbol, symbol, symbol]
        : [symbol, symbols[(result.segmentIndex + 1) % symbols.length], symbols[(result.segmentIndex + 2) % symbols.length]];
      setReels(next);
      await pause(620);
      setHold(1);
      playTick();
      await pause(460);
      setHold(2);
      playTick();
      await pause(520);
      setHold(3);
      setSpinning(false);
      setLanded(result);
      playWin();
      onReveal(result);
    } catch {
      setHold(3);
      setSpinning(false);
    }
  }

  return (
    <Cabinet
      title="Lucky reels"
      action={(
        <button type="button" disabled={spinning} onClick={pull} className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full text-sm font-bold text-white shadow-lg disabled:opacity-60" style={{ background: accent }}>
          {spinning && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />}
          {spinning ? 'Spinning…' : 'Spin'}
        </button>
      )}
    >
      <div className="grid grid-cols-3 gap-2 rounded-2xl bg-stone-950 p-2 ring-1 ring-white/10">
        {reels.map((symbol, index) => <Reel key={index} symbol={symbol} spinning={spinning && index >= hold} />)}
      </div>
      {landed && !spinning && <p className="mt-3 text-sm font-semibold text-amber-200">{landed.coins} coins · {landed.prizeName}</p>}
    </Cabinet>
  );
}

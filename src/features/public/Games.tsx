import { useEffect, useRef, useState } from 'react';
import { playGift, playScratch, playSlot, playSpin, playTick, playWin } from '../../lib/sounds';

export type PrizeSlice = { name: string; coins: number };
export type PlayResult = { prizeName: string; coins: number; segmentIndex: number; prizes?: PrizeSlice[] };

const colors = ['#2563eb', '#f59e0b', '#7c3aed', '#06b6d4', '#ef4444', '#22c55e', '#f97316', '#e11d48'];

export function GameStage({
  game, prizes, busy, onPlay, onReveal,
}: {
  game: string;
  prizes: PrizeSlice[];
  busy: boolean;
  onPlay: () => Promise<PlayResult>;
  onReveal: (result: PlayResult) => void;
}) {
  if (game === 'ScratchCard') return <Scratch busy={busy} onPlay={onPlay} onReveal={onReveal} />;
  if (game === 'MysteryGiftBox') return <Gift busy={busy} onPlay={onPlay} onReveal={onReveal} />;
  if (game === 'SlotMachine') return <Slots busy={busy} onPlay={onPlay} onReveal={onReveal} />;
  return <Wheel prizes={prizes} busy={busy} onPlay={onPlay} onReveal={onReveal} />;
}

function Wheel({ prizes, busy, onPlay, onReveal }: { prizes: PrizeSlice[]; busy: boolean; onPlay: () => Promise<PlayResult>; onReveal: (result: PlayResult) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [turn, setTurn] = useState(0);
  const [locked, setLocked] = useState(false);
  const slices = prizes.length ? prizes : [
    { name: 'Try again', coins: 0 }, { name: '10 coins', coins: 10 }, { name: '25 coins', coins: 25 },
    { name: '50 coins', coins: 50 }, { name: '5 coins', coins: 5 }, { name: '100 coins', coins: 100 },
  ];
  const sliceKey = slices.map((slice) => slice.name).join('|');

  useEffect(() => {
    if (!locked) return undefined;
    const timer = window.setInterval(() => playTick(), 160);
    return () => window.clearInterval(timer);
  }, [locked]);

  useEffect(() => {
    const node = canvas.current;
    const ctx = node?.getContext('2d');
    if (!node || !ctx) return;
    const size = 360;
    node.width = size;
    node.height = size;
    const drawn = sliceKey.split('|');
    const arc = (Math.PI * 2) / drawn.length;
    const cx = size / 2;
    ctx.beginPath();
    ctx.arc(cx, cx, 174, 0, Math.PI * 2);
    ctx.fillStyle = '#111827';
    ctx.fill();
    drawn.forEach((name, index) => {
      ctx.beginPath();
      ctx.moveTo(cx, cx);
      ctx.fillStyle = colors[index % colors.length];
      ctx.arc(cx, cx, 158, index * arc - Math.PI / 2, (index + 1) * arc - Math.PI / 2);
      ctx.fill();
      ctx.save();
      ctx.translate(cx, cx);
      ctx.rotate(index * arc + arc / 2 - Math.PI / 2);
      ctx.fillStyle = '#fff';
      ctx.font = '700 13px Plus Jakarta Sans, sans-serif';
      ctx.fillText(name.slice(0, 14), 58, 5);
      ctx.restore();
    });
    ctx.beginPath();
    ctx.arc(cx, cx, 42, 0, Math.PI * 2);
    ctx.fillStyle = '#0c0a09';
    ctx.fill();
  }, [sliceKey]);

  async function spin() {
    if (busy || locked) return;
    setLocked(true);
    playSpin();
    try {
      const result = await onPlay();
      const board = result.prizes?.length ? result.prizes : slices;
      const arc = 360 / board.length;
      const index = result.segmentIndex % board.length;
      const target = (360 - (index * arc + arc / 2) + 360) % 360;
      setTurn((current) => {
        const normalized = ((current % 360) + 360) % 360;
        let delta = target - normalized;
        if (delta < 1) delta += 360;
        return current + 360 * 5 + delta;
      });
      window.setTimeout(() => { setLocked(false); playWin(); onReveal(result); }, 4200);
    } catch { setLocked(false); }
  }

  return (
    <div className="relative grid place-items-center">
      <div className="absolute -top-1 z-10 h-0 w-0 border-x-[10px] border-t-[22px] border-x-transparent border-t-amber-400 drop-shadow" />
      <div className="w-[min(14.5rem,86%)] rounded-full bg-gradient-to-b from-slate-700 to-slate-950 p-2 shadow-[0_20px_50px_rgba(0,0,0,.35)] sm:w-[min(18.5rem,100%)] sm:p-3 sm:shadow-[0_30px_80px_rgba(0,0,0,.45)] md:w-[min(20.5rem,100%)]">
        <div className="flex aspect-square w-full items-center justify-center rounded-full border-[6px] border-amber-400/80 sm:border-[10px]">
          <canvas ref={canvas} className="h-full w-full rounded-full" style={{ transform: `rotate(${turn}deg)`, transition: turn ? 'transform 4.2s cubic-bezier(.12,.7,.08,1)' : undefined }} />
        </div>
      </div>
      <button type="button" disabled={busy || locked} onClick={spin} className="absolute grid h-14 w-14 place-items-center rounded-full bg-white text-xs font-bold tracking-wide text-slate-900 shadow-xl disabled:opacity-60 sm:h-[4.5rem] sm:w-[4.5rem] sm:text-sm">{busy ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-900 border-r-transparent" /> : 'SPIN'}</button>
    </div>
  );
}

function Scratch({ busy, onPlay, onReveal }: { busy: boolean; onPlay: () => Promise<PlayResult>; onReveal: (result: PlayResult) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [prize, setPrize] = useState<PlayResult | null>(null);
  const started = useRef(false);
  const revealed = useRef(false);
  const strokes = useRef(0);
  const held = useRef<PlayResult | null>(null);
  useEffect(() => { paint(); }, []);

  function paint() {
    const node = canvas.current;
    const ctx = node?.getContext('2d');
    if (!node || !ctx) return;
    node.width = 360;
    node.height = 200;
    const gradient = ctx.createLinearGradient(0, 0, 360, 200);
    gradient.addColorStop(0, '#cbd5e1');
    gradient.addColorStop(0.5, '#94a3b8');
    gradient.addColorStop(1, '#64748b');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 360, 200);
    ctx.fillStyle = '#334155';
    ctx.font = '700 18px Plus Jakarta Sans, sans-serif';
    ctx.fillText('Scratch to reveal', 96, 108);
  }

  async function scratch(event: React.PointerEvent<HTMLCanvasElement>) {
    const node = canvas.current;
    const ctx = node?.getContext('2d');
    if (!node || !ctx || busy) return;
    if (!started.current) {
      try {
        const result = await onPlay();
        started.current = true;
        held.current = result;
        setPrize(result);
      } catch {
        return;
      }
    }
    const rect = node.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * node.width;
    const y = ((event.clientY - rect.top) / rect.height) * node.height;
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fill();
    strokes.current += 1;
    if (strokes.current % 4 === 1) playScratch();
    if (!revealed.current && strokes.current >= 8 && held.current) {
      revealed.current = true;
      playWin();
      onReveal(held.current);
    }
  }

  return (
    <div className="relative h-36 w-full max-w-[16.5rem] overflow-hidden rounded-[24px] bg-gradient-to-br from-amber-300 via-yellow-400 to-orange-500 shadow-2xl sm:h-48 sm:max-w-sm sm:rounded-[28px]">
      <div className="grid h-full place-items-center text-center text-slate-900">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em]">Prize</p>
          <p className="mt-1 text-3xl font-semibold">{prize?.prizeName || ' '}</p>
          <p className="text-sm">{prize ? `${prize.coins} coins` : 'Rub the foil'}</p>
        </div>
      </div>
      <canvas ref={canvas} onPointerDown={scratch} onPointerMove={(event) => { if (event.buttons) scratch(event); }} className="absolute inset-0 h-full w-full touch-none" />
    </div>
  );
}

function Gift({ busy, onPlay, onReveal }: { busy: boolean; onPlay: () => Promise<PlayResult>; onReveal: (result: PlayResult) => void }) {
  const [open, setOpen] = useState<number | null>(null);
  const [prize, setPrize] = useState<PlayResult | null>(null);
  async function choose(index: number) {
    if (busy || open !== null) return;
    try {
      playGift();
      const result = await onPlay();
      setOpen(index);
      setPrize(result);
      window.setTimeout(() => { playWin(); onReveal(result); }, 700);
    } catch { /* the page shows the error and the boxes stay closed */ }
  }
  return (
    <div className="flex justify-center gap-2 sm:gap-4">
      {[0, 1, 2].map((index) => (
        <button key={index} type="button" disabled={busy || open !== null} onClick={() => choose(index)} className="group w-16 text-center disabled:opacity-70 sm:w-24">
          <span className={`mx-auto mb-1 block h-2.5 w-12 rounded-sm sm:h-3 sm:w-16 ${open === index ? 'bg-amber-200' : 'bg-amber-400'}`} />
          <span className={`relative mx-auto grid h-24 w-full place-items-center rounded-2xl shadow-xl transition sm:h-36 ${open === index ? 'bg-amber-400 text-slate-900' : 'bg-gradient-to-b from-rose-500 to-rose-800 text-white group-hover:-translate-y-2'}`}>
            <span className="absolute inset-x-0 top-1/3 h-1 bg-white/30" />
            <span className="absolute left-1/2 top-0 h-full w-1 -translate-x-1/2 bg-white/30" />
            <span className="relative z-10 text-sm font-bold">{open === index ? `${prize?.coins}` : busy ? <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" /> : '?'}</span>
          </span>
          <span className="mt-2 block text-xs font-semibold text-slate-500">{open === index ? 'Opened' : 'Pick a box'}</span>
        </button>
      ))}
    </div>
  );
}

function Slots({ busy, onPlay, onReveal }: { busy: boolean; onPlay: () => Promise<PlayResult>; onReveal: (result: PlayResult) => void }) {
  const symbols = ['7', '★', '◆', '●'];
  const [reels, setReels] = useState(['7', '7', '7']);
  const [spinning, setSpinning] = useState(false);
  async function pull() {
    if (busy || spinning) return;
    setSpinning(true);
    playSlot();
    const timer = window.setInterval(() => {
      playSlot();
      setReels(symbols.map(() => symbols[Math.floor(Math.random() * symbols.length)]));
    }, 140);
    try {
      const result = await onPlay();
      window.setTimeout(() => {
        window.clearInterval(timer);
        const symbol = symbols[result.segmentIndex % symbols.length];
        setReels(result.coins > 0 ? [symbol, symbol, symbol] : [symbol, symbols[(result.segmentIndex + 1) % 4], symbols[(result.segmentIndex + 2) % 4]]);
        setSpinning(false);
        playWin();
        onReveal(result);
      }, 1600);
    } catch {
      window.clearInterval(timer);
      setSpinning(false);
    }
  }
  return (
    <div className="w-full max-w-[17rem] rounded-[24px] bg-gradient-to-b from-zinc-800 to-black p-4 text-center shadow-2xl ring-1 ring-white/10 sm:max-w-sm sm:rounded-[28px] sm:p-5">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-amber-400">Lucky reels</p>
      <div className="flex justify-center gap-2 rounded-2xl bg-black/40 p-2 sm:p-3">
        {reels.map((symbol, index) => <div key={index} className="grid h-20 w-14 place-items-center rounded-xl bg-white text-3xl font-bold text-slate-900 sm:h-28 sm:w-[4.5rem] sm:text-4xl">{symbol}</div>)}
      </div>
      <button type="button" disabled={spinning} onClick={pull} className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-amber-400 text-sm font-bold text-slate-900 disabled:opacity-60">{spinning && <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900 border-r-transparent" />}{spinning ? 'Spinning…' : 'Pull lever'}</button>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';

export type PrizeSlice = { name: string; coins: number };
export type PlayResult = { prizeName: string; coins: number; segmentIndex: number };

const colors = ['#2563eb', '#f59e0b', '#7c3aed', '#06b6d4', '#ef4444', '#22c55e', '#f97316', '#e11d48'];

export function GameStage({
  game, prizes, busy, onPlay,
}: {
  game: string;
  prizes: PrizeSlice[];
  busy: boolean;
  onPlay: () => Promise<PlayResult>;
}) {
  if (game === 'ScratchCard') return <Scratch busy={busy} onPlay={onPlay} />;
  if (game === 'MysteryGiftBox') return <Gift busy={busy} onPlay={onPlay} />;
  if (game === 'SlotMachine') return <Slots busy={busy} onPlay={onPlay} />;
  return <Wheel prizes={prizes} busy={busy} onPlay={onPlay} />;
}

function Wheel({ prizes, busy, onPlay }: { prizes: PrizeSlice[]; busy: boolean; onPlay: () => Promise<PlayResult> }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [turn, setTurn] = useState(0);
  const [locked, setLocked] = useState(false);
  const slices = prizes.length ? prizes : [
    { name: 'Try again', coins: 0 }, { name: '10 coins', coins: 10 }, { name: '25 coins', coins: 25 },
    { name: '50 coins', coins: 50 }, { name: '5 coins', coins: 5 }, { name: '100 coins', coins: 100 },
  ];
  const sliceKey = slices.map((slice) => slice.name).join('|');

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
    try {
      const result = await onPlay();
      const arc = 360 / slices.length;
      setTurn((current) => current + 360 * 6 + (360 - ((result.segmentIndex % slices.length) * arc + arc / 2)));
      window.setTimeout(() => setLocked(false), 4300);
    } catch { setLocked(false); }
  }

  return (
    <div className="relative grid place-items-center">
      <div className="absolute -top-1 z-10 h-0 w-0 border-x-[10px] border-t-[22px] border-x-transparent border-t-amber-400 drop-shadow" />
      <div className="w-[min(18.5rem,100%)] rounded-full bg-gradient-to-b from-slate-700 to-slate-950 p-3 shadow-[0_30px_80px_rgba(0,0,0,.45)] sm:w-[min(20.5rem,100%)]">
        <div className="flex aspect-square w-full items-center justify-center rounded-full border-[10px] border-amber-400/80">
          <canvas ref={canvas} className="h-full w-full rounded-full" style={{ transform: `rotate(${turn}deg)`, transition: turn ? 'transform 4.2s cubic-bezier(.12,.7,.08,1)' : undefined }} />
        </div>
      </div>
      <button type="button" disabled={busy || locked} onClick={spin} className="absolute grid h-[4.5rem] w-[4.5rem] place-items-center rounded-full bg-white text-sm font-bold tracking-wide text-slate-900 shadow-xl disabled:opacity-60">{busy ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-900 border-r-transparent" /> : 'SPIN'}</button>
    </div>
  );
}

function Scratch({ busy, onPlay }: { busy: boolean; onPlay: () => Promise<PlayResult> }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [prize, setPrize] = useState<PlayResult | null>(null);
  const started = useRef(false);
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
  }

  return (
    <div className="relative h-48 w-full max-w-sm overflow-hidden rounded-[28px] bg-gradient-to-br from-amber-300 via-yellow-400 to-orange-500 shadow-2xl">
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

function Gift({ busy, onPlay }: { busy: boolean; onPlay: () => Promise<PlayResult> }) {
  const [open, setOpen] = useState<number | null>(null);
  const [prize, setPrize] = useState<PlayResult | null>(null);
  async function choose(index: number) {
    if (busy || open !== null) return;
    try {
      const result = await onPlay();
      setOpen(index);
      setPrize(result);
    } catch { /* the page shows the error and the boxes stay closed */ }
  }
  return (
    <div className="flex justify-center gap-3 sm:gap-4">
      {[0, 1, 2].map((index) => (
        <button key={index} type="button" disabled={busy || open !== null} onClick={() => choose(index)} className="group w-[4.75rem] text-center disabled:opacity-70 sm:w-24">
          <span className={`mx-auto mb-1 block h-3 w-16 rounded-sm ${open === index ? 'bg-amber-200' : 'bg-amber-400'}`} />
          <span className={`relative mx-auto grid h-32 w-full place-items-center rounded-2xl shadow-xl transition sm:h-36 ${open === index ? 'bg-amber-400 text-slate-900' : 'bg-gradient-to-b from-rose-500 to-rose-800 text-white group-hover:-translate-y-2'}`}>
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

function Slots({ busy, onPlay }: { busy: boolean; onPlay: () => Promise<PlayResult> }) {
  const symbols = ['7', '★', '◆', '●'];
  const [reels, setReels] = useState(['7', '7', '7']);
  const [spinning, setSpinning] = useState(false);
  async function pull() {
    if (busy || spinning) return;
    setSpinning(true);
    const timer = window.setInterval(() => setReels(symbols.map(() => symbols[Math.floor(Math.random() * symbols.length)])), 70);
    try {
      const result = await onPlay();
      window.setTimeout(() => {
        window.clearInterval(timer);
        const symbol = symbols[result.segmentIndex % symbols.length];
        setReels(result.coins > 0 ? [symbol, symbol, symbol] : [symbol, symbols[(result.segmentIndex + 1) % 4], symbols[(result.segmentIndex + 2) % 4]]);
        setSpinning(false);
      }, 1500);
    } catch {
      window.clearInterval(timer);
      setSpinning(false);
    }
  }
  return (
    <div className="w-full max-w-sm rounded-[28px] bg-gradient-to-b from-zinc-800 to-black p-5 text-center shadow-2xl ring-1 ring-white/10">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-amber-400">Lucky reels</p>
      <div className="flex justify-center gap-2 rounded-2xl bg-black/40 p-3">
        {reels.map((symbol, index) => <div key={index} className="grid h-28 w-[4.5rem] place-items-center rounded-xl bg-white text-4xl font-bold text-slate-900">{symbol}</div>)}
      </div>
      <button type="button" disabled={spinning} onClick={pull} className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-amber-400 text-sm font-bold text-slate-900 disabled:opacity-60">{spinning && <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900 border-r-transparent" />}{spinning ? 'Spinning…' : 'Pull lever'}</button>
    </div>
  );
}

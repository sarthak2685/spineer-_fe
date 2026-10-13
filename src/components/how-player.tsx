import { ReactNode, useEffect, useRef, useState } from 'react';

function clock(value: number) {
  if (!Number.isFinite(value) || value < 0) return '0:00';
  const total = Math.floor(value);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function Mark({ children, fill = false }: { children: ReactNode; fill?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill={fill ? 'currentColor' : 'none'} stroke={fill ? 'none' : 'currentColor'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

export function HowPlayer({ src, autoPlay = false }: { src: string; autoPlay?: boolean }) {
  const shell = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [full, setFull] = useState(false);

  useEffect(() => {
    const node = video.current;
    if (!node || !autoPlay) return;
    node.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }, [autoPlay, src]);

  useEffect(() => {
    function onFull() { setFull(document.fullscreenElement === shell.current); }
    document.addEventListener('fullscreenchange', onFull);
    return () => document.removeEventListener('fullscreenchange', onFull);
  }, []);

  function toggle() {
    const node = video.current;
    if (!node) return;
    if (node.paused) {
      node.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    } else {
      node.pause();
      setPlaying(false);
    }
  }

  function seek(next: number) {
    const node = video.current;
    if (!node) return;
    node.currentTime = next;
    setTime(next);
  }

  function setLevel(next: number) {
    const node = video.current;
    if (!node) return;
    node.volume = next;
    node.muted = next === 0;
    setVolume(next);
    setMuted(next === 0);
  }

  function toggleMute() {
    const node = video.current;
    if (!node) return;
    node.muted = !node.muted;
    setMuted(node.muted);
  }

  async function toggleFull() {
    const node = shell.current;
    if (!node) return;
    if (document.fullscreenElement === node) await document.exitFullscreen();
    else await node.requestFullscreen();
  }

  function onKey(event: React.KeyboardEvent) {
    const node = video.current;
    if (!node) return;
    if (event.key === ' ' || event.key === 'k') {
      event.preventDefault();
      toggle();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      seek(Math.min(node.duration || 0, node.currentTime + 5));
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      seek(Math.max(0, node.currentTime - 5));
    } else if (event.key === 'm' || event.key === 'M') {
      toggleMute();
    } else if (event.key === 'f' || event.key === 'F') {
      toggleFull();
    }
  }

  const span = duration || 0;
  const progress = span ? (time / span) * 100 : 0;

  return (
    <div ref={shell} tabIndex={0} onKeyDown={onKey} onContextMenu={(event) => event.preventDefault()} className="group relative overflow-hidden rounded-2xl bg-stone-950 text-white outline-none focus-visible:ring-4 focus-visible:ring-orange-600/30">
      <video
        ref={video}
        src={src}
        playsInline
        autoPlay={autoPlay}
        controls={false}
        controlsList="nodownload"
        disablePictureInPicture
        onContextMenu={(event) => event.preventDefault()}
        onClick={toggle}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={() => setTime(video.current?.currentTime || 0)}
        onDurationChange={() => setDuration(video.current?.duration || 0)}
        onProgress={() => {
          const node = video.current;
          if (!node || !node.buffered.length) return;
          setBuffered(node.buffered.end(node.buffered.length - 1));
        }}
        onVolumeChange={() => {
          const node = video.current;
          if (!node) return;
          setMuted(node.muted);
          setVolume(node.volume);
        }}
        className="max-h-[70dvh] w-full bg-stone-950"
      />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-stone-950/90 via-stone-950/45 to-transparent px-3 pb-3 pt-10">
        <div className="relative h-1.5">
          <div className="absolute inset-0 rounded-full bg-white/20" />
          <div className="absolute inset-y-0 left-0 rounded-full bg-white/35" style={{ width: `${span ? (buffered / span) * 100 : 0}%` }} />
          <div className="pointer-events-none absolute inset-y-0 left-0 rounded-full bg-orange-600" style={{ width: `${progress}%` }} />
          <input aria-label="Seek" type="range" min={0} max={span || 0} step={0.1} value={Math.min(time, span || 0)} onChange={(event) => seek(Number(event.target.value))} className="absolute inset-0 h-1.5 w-full cursor-pointer appearance-none bg-transparent accent-orange-600" />
        </div>
        <div className="mt-2 flex items-center gap-2">
          <button type="button" aria-label={playing ? 'Pause' : 'Play'} onClick={toggle} className="grid h-9 w-9 place-items-center rounded-full bg-orange-600 text-white">
            <Mark fill>{playing ? <><path d="M7 5h3.5v14H7z" /><path d="M13.5 5H17v14h-3.5z" /></> : <path d="M8 5.5v13l11-6.5z" />}</Mark>
          </button>
          <span className="min-w-16 font-mono text-[11px] text-white/80">{clock(time)} / {clock(span)}</span>
          <button type="button" aria-label={muted || volume === 0 ? 'Unmute' : 'Mute'} onClick={toggleMute} className="grid h-9 w-9 place-items-center rounded-full text-white/90 hover:bg-white/10">
            <Mark>{muted || volume === 0 ? <><path d="M4 10v4h3l4 3V7L7 10H4z" /><path d="M16 10l4 4M20 10l-4 4" /></> : <><path d="M4 10v4h3l4 3V7L7 10H4z" /><path d="M16 9.5a4 4 0 0 1 0 5" /></>}</Mark>
          </button>
          <input aria-label="Volume" type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume} onChange={(event) => setLevel(Number(event.target.value))} className="h-1 w-20 cursor-pointer accent-orange-600" />
          <button type="button" aria-label={full ? 'Exit fullscreen' : 'Fullscreen'} onClick={toggleFull} className="ml-auto grid h-9 w-9 place-items-center rounded-full text-white/90 hover:bg-white/10">
            <Mark>{full ? <><path d="M9 5H5v4" /><path d="M15 5h4v4" /><path d="M9 19H5v-4" /><path d="M15 19h4v-4" /></> : <><path d="M5 9V5h4" /><path d="M15 5h4v4" /><path d="M5 15v4h4" /><path d="M15 19h4v-4" /></>}</Mark>
          </button>
        </div>
      </div>
    </div>
  );
}

export function HowVideoModal({ videos, onClose }: { videos: { id: string; title: string; src: string }[]; onClose: () => void }) {
  const [current, setCurrent] = useState(0);
  const clip = videos[current] || videos[0];
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function onKey(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      if (document.fullscreenElement) document.exitFullscreen().catch(() => undefined);
      closeRef.current();
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', onKey);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => undefined);
    };
  }, []);
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center p-4 sm:p-6">
      <button type="button" className="absolute inset-0 bg-stone-950/70" aria-label="Close video" onClick={onClose} />
      <div className="relative z-10 w-full max-w-4xl rounded-3xl bg-white p-3 shadow-2xl sm:p-4">
        <div className="mb-3 flex items-center justify-between gap-3 px-1">
          <p className="font-display text-lg font-semibold text-stone-950">{videos.length > 1 && clip ? clip.title : 'How it works'}</p>
          <button type="button" onClick={onClose} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full bg-stone-100 text-lg text-stone-600 hover:bg-stone-200">×</button>
        </div>
        {videos.length > 1 && (
          <div className="mb-3 flex gap-2 overflow-x-auto px-1 pb-1">
            {videos.map((video, index) => (
              <button key={video.id} type="button" onClick={() => setCurrent(index)} className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold ${index === current ? 'bg-orange-600 text-white' : 'bg-orange-50 text-stone-700'}`}>
                {video.title}
              </button>
            ))}
          </div>
        )}
        {clip && <HowPlayer key={clip.id} src={clip.src} autoPlay />}
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Alert, Modal } from '../../components/ui';
import { useInstallApp } from '../../lib/use-install';

function shopPath(value: string) {
  try {
    const url = value.startsWith('http') ? new URL(value) : new URL(value, window.location.origin);
    const match = url.pathname.match(/^\/(play|menu|bill|review)\/([^/]+)/);
    return match ? `/${match[1]}/${decodeURIComponent(match[2])}` : null;
  } catch {
    return null;
  }
}

export function ScanQr({ compact = false }: { compact?: boolean }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (!open) return;
    let stop = false;
    let stream: MediaStream | null = null;
    const Detector = (window as unknown as { BarcodeDetector?: new (options: { formats: string[] }) => { detect: (source: HTMLVideoElement) => Promise<{ rawValue?: string }[]> } }).BarcodeDetector;
    if (!Detector || !navigator.mediaDevices?.getUserMedia) {
      setError('This browser cannot use the camera. Open this page in Chrome or Edge.');
      return;
    }
    const detector = new Detector({ formats: ['qr_code'] });
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }).then(async (next) => {
      stream = next;
      if (!videoRef.current) return;
      videoRef.current.srcObject = next;
      await videoRef.current.play();
      const tick = async () => {
        if (stop || !videoRef.current) return;
        try {
          const codes = await detector.detect(videoRef.current);
          const raw = codes[0]?.rawValue;
          if (raw) {
            const path = shopPath(raw);
            if (path) {
              stop = true;
              stream?.getTracks().forEach((track) => track.stop());
              setOpen(false);
              navigate(path);
              return;
            }
            setError('This is not a Repeat Mate QR.');
          }
        } catch { /* the next frame may be readable */ }
        if (!stop) window.setTimeout(() => { void tick(); }, 250);
      };
      void tick();
    }).catch(() => setError('Allow the camera to scan a shop QR.'));
    return () => {
      stop = true;
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [open, navigate]);
  return (
    <>
      {compact ? (
        <button type="button" className="flex min-w-0 flex-1 flex-col items-center gap-1 px-1 py-1 text-[11px] font-semibold text-stone-500" onClick={() => { setError(''); setOpen(true); }}>
          <span className="grid h-11 w-11 place-items-center rounded-full bg-white text-stone-700 ring-1 ring-stone-200">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2v6h-6v-2h4z" /></svg>
          </span>
          Scan QR
        </button>
      ) : (
        <button type="button" className="w-full rounded-3xl border border-stone-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-orange-600 hover:shadow-lg" onClick={() => { setError(''); setOpen(true); }}>
          <p className="font-semibold text-stone-950">Scan QR</p>
          <p className="mt-1 text-sm text-stone-500">Point the camera at any shop QR to open its game and menu.</p>
        </button>
      )}
      {open && (
        <Modal title="Scan a shop QR" text="The code on a poster, table, or screen." onClose={() => setOpen(false)}>
          {error && <Alert text={error} />}
          <video ref={videoRef} className="mt-3 aspect-square w-full rounded-2xl bg-stone-950 object-cover" muted playsInline />
        </Modal>
      )}
    </>
  );
}

export function CustomerDock() {
  const { install } = useInstallApp();
  return createPortal(
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-white/95 px-3 pt-2 shadow-[0_-8px_24px_rgba(28,25,23,0.08)] backdrop-blur xl:hidden" style={{ paddingBottom: 'max(0.45rem, env(safe-area-inset-bottom))' }} aria-label="Customer">
      <div className="mx-auto flex w-full max-w-lg items-end justify-around">
        <button type="button" className="flex min-w-0 flex-1 flex-col items-center gap-1 px-1 py-1 text-[11px] font-semibold text-stone-500" onClick={() => { void install(); }}>
          <span className="grid h-11 w-11 place-items-center rounded-full bg-orange-600 text-white shadow-md shadow-orange-600/25">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M12 4v9M8.5 10.5 12 14l3.5-3.5M6 19h12" /></svg>
          </span>
          Download app
        </button>
        <ScanQr compact />
      </div>
    </nav>,
    document.body,
  );
}

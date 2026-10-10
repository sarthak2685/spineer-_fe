import { createContext, FormEvent, ReactNode, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, NavLink, useLocation, useParams } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { api, asset, client } from '../../api/client';
import { useAuth } from '../../app/auth';
import { Alert, Button, Field, Form, Modal } from '../../components/ui';
import { digitsOnly, isTenDigitMobile } from '../../lib/mobile';
import { toastErr, toastInfo, toastOk } from '../../lib/toast';
import { GameStage, PrizeSlice, PlayResult } from './Games';

export function brandColor(value?: string) {
  return value && /^#[0-9a-fA-F]{6}$/.test(value) ? value : '#ea580c';
}

const DEFAULT_KEYWORDS = ['friendly staff', 'great food', 'quick service', 'clean place', 'good value', 'tasty', 'cozy', 'worth visiting'];

type GuestTab = 'play' | 'menu' | 'bill' | 'review';
type GuestHub = Record<string, any>;

type GuestPlaceContext = {
  token: string;
  hub: GuestHub;
  setHub: React.Dispatch<React.SetStateAction<GuestHub | null>>;
  color: string;
  business: Record<string, any>;
};

const GuestCtx = createContext<GuestPlaceContext | null>(null);

function useGuestPlace() {
  const ctx = useContext(GuestCtx);
  if (!ctx) throw new Error('Guest place context missing.');
  return ctx;
}

export function GuestSkeleton() {
  return (
    <div className="public-enter min-h-screen bg-orange-50" aria-busy="true" aria-label="Loading shop">
      <div className="h-52 animate-pulse bg-stone-200 sm:h-64" />
      <div className="mx-auto -mt-16 max-w-xl px-4">
        <div className="h-80 animate-pulse rounded-[28px] bg-white shadow" />
      </div>
    </div>
  );
}

export function GuestError({ message }: { message: string }) {
  return (
    <div className="public-enter grid min-h-screen place-items-center bg-orange-50 px-4 py-12">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-xl shadow-stone-950/10">
        <p className="text-lg font-semibold">This shop link did not open</p>
        <p className="mt-2 text-sm text-stone-500">{message}</p>
        <Link to="/" className="mt-6 inline-flex min-h-11 items-center rounded-full bg-orange-600 px-5 text-sm font-semibold text-white">Back home</Link>
      </div>
    </div>
  );
}

function Icon({ children }: { children: ReactNode }) {
  return <span className="grid h-9 w-9 place-items-center rounded-full bg-stone-100 ring-1 ring-stone-100">{children}</span>;
}

function tabFromPath(pathname: string): GuestTab {
  if (pathname.includes('/menu/')) return 'menu';
  if (pathname.includes('/bill/')) return 'bill';
  if (pathname.includes('/review/')) return 'review';
  return 'play';
}

const tabOrder: GuestTab[] = ['play', 'menu', 'bill', 'review'];

export function PlaceFrame({ business, token, current, children }: { business: Record<string, any>; token?: string; current: GuestTab; children: ReactNode }) {
  const color = brandColor(business.themecolor);
  const whatsapp = String(business.whatsappnumber || '').replace(/\D/g, '');
  const wa = whatsapp.length === 10 ? `91${whatsapp}` : whatsapp;
  const link = (href: string, label: string, icon: ReactNode) => (
    <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" className="grid justify-items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-stone-500">
      {icon}{label}
    </a>
  );
  const tabClass = (id: GuestTab) =>
    `shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${current === id ? 'text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`;
  return (
    <div className="public-enter min-h-screen bg-orange-50 text-stone-900">
      <div className="h-52 sm:h-64" style={{ background: `linear-gradient(120deg, ${color}, #0c0a09)` }}>
        {business.bannerimagepath && <img alt="" src={asset(business.bannerimagepath)} className="h-full w-full object-cover" />}
      </div>
      <div className="relative z-10 mx-auto -mt-16 max-w-xl px-3 pb-28 sm:px-4">
        <div className="relative rounded-[28px] bg-white px-5 pb-8 pt-14 shadow-xl shadow-stone-950/10">
          <div className="absolute left-1/2 top-0 grid h-20 w-20 -translate-x-1/2 -translate-y-1/2 place-items-center overflow-hidden rounded-full bg-white shadow-lg ring-4 ring-white">
            {business.logoimagepath ? <img alt="" src={asset(business.logoimagepath)} className="h-full w-full object-cover" /> : <span className="text-xs font-bold text-stone-400">LOGO</span>}
          </div>
          <h1 className="truncate text-center text-2xl font-bold" title={business.businessname || 'RewardSpinner'}>{business.businessname || 'RewardSpinner'}</h1>
          <p className="mt-1 text-center text-sm text-stone-500">{business.tagline || business.description || 'Play, order, and review in one place.'}</p>
          {business.address && <p className="mt-2 text-center text-sm text-stone-600">{business.address}</p>}
          <div className="mt-5 flex flex-wrap justify-center gap-6">
            {business.phone && link(`tel:${business.phone}`, 'Call', <Icon><svg viewBox="0 0 24 24" className="h-4 w-4 fill-stone-700"><path d="M6.6 10.8a15 15 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11 11 0 0 0 3.5.55 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 7a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11 11 0 0 0 .55 3.5 1 1 0 0 1-.25 1L6.6 10.8z" /></svg></Icon>)}
            {wa && link(`https://wa.me/${wa}`, 'WhatsApp', <Icon><svg viewBox="0 0 24 24" className="h-4 w-4 fill-emerald-600"><path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.7-1.2A9 9 0 1 0 12 3zm5 12.4c-.2.6-1.2 1.1-1.7 1.1-.4.1-.9.2-3-.8-2.5-1.2-4.1-3.6-4.2-3.8-.2-.2-1.2-1.6-1.2-3s.7-2.1 1-2.4c.2-.2.5-.3.8-.3h.6c.2 0 .4 0 .6.5.2.6.8 2 .8 2.1.1.1 0 .3-.1.5l-.4.5c-.1.2-.3.3-.1.6.2.3.7 1.2 1.5 1.9 1 .9 1.8 1.2 2.1 1.3.3.1.4.1.6-.1l.7-.8c.2-.2.4-.2.6-.1l2 .9c.2.1.4.2.4.4.1.2 0 .8-.2 1.3z" /></svg></Icon>)}
            {business.instagramurl && link(business.instagramurl, 'Instagram', <Icon><svg viewBox="0 0 24 24" className="h-4 w-4 fill-pink-600"><path d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zm5 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm6.2-.9a1 1 0 1 0 0 2 1 1 0 0 0 0-2zM12 10a2 2 0 1 1 0 4 2 2 0 0 1 0-4z" /></svg></Icon>)}
            {business.facebookurl && link(business.facebookurl, 'Facebook', <Icon><svg viewBox="0 0 24 24" className="h-4 w-4 fill-blue-600"><path d="M14 9h3V6h-3c-2.2 0-4 1.8-4 4v2H8v3h2v7h3v-7h2.6l.4-3H13v-2c0-.6.4-1 1-1z" /></svg></Icon>)}
          </div>
          <div className="mt-5 flex gap-2 overflow-x-auto sm:justify-center">
            <NavLink to={`/play/${token}`} className={tabClass('play')} style={current === 'play' ? { background: color } : undefined}>Play</NavLink>
            <NavLink to={`/menu/${token}`} className={tabClass('menu')} style={current === 'menu' ? { background: color } : undefined}>Menu</NavLink>
            <NavLink to={`/bill/${token}`} className={tabClass('bill')} style={current === 'bill' ? { background: color } : undefined}>Bill</NavLink>
            <NavLink to={`/review/${token}`} className={tabClass('review')} style={current === 'review' ? { background: color } : undefined}>Review</NavLink>
          </div>
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}

type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };

function GetAppCard() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(() => window.matchMedia('(display-mode: standalone)').matches);
  const [hint, setHint] = useState('');
  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPrompt(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);
  if (installed) return null;
  async function install() {
    if (prompt) {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice.outcome === 'accepted') setInstalled(true);
      setPrompt(null);
    } else {
      const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
      setHint(ios ? 'On iPhone, tap Share, then Add to Home Screen.' : 'Open the browser menu and choose Install app or Add to Home Screen.');
    }
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const { enableBrowserPush } = await import('../../lib/push');
        await enableBrowserPush().catch(() => undefined);
      }
    }
  }
  return (
    <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-stone-950">Get the app</p>
        <p className="mt-0.5 text-xs text-stone-500">{hint || 'Add RewardSpinner to your home screen so offers can reach this phone.'}</p>
      </div>
      <button type="button" className="shrink-0 rounded-full bg-orange-600 px-4 py-2 text-sm font-semibold text-white" onClick={install}>Install</button>
    </div>
  );
}

/** Shared shell: banner/logo stay mounted; only the inner panel slides. */
export function GuestPlaceShell() {
  const { token = '' } = useParams();
  const location = useLocation();
  const reduce = useReducedMotion();
  const tab = tabFromPath(location.pathname);
  const prevTab = useRef(tab);
  const direction = tabOrder.indexOf(tab) - tabOrder.indexOf(prevTab.current);
  useEffect(() => { prevTab.current = tab; }, [tab]);

  const [hub, setHub] = useState<GuestHub | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (!token) return;
    let alive = true;
    setLoading(true);
    setLoadError('');
    // One catalog call covers play + menu + review (keywords, games, items).
    api(`/public/menu/${token}`)
      .then((data) => { if (alive) setHub(data); })
      .catch((err) => { if (alive) setLoadError(err instanceof Error ? err.message : 'This link is not available.'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [token]);

  if (loading) return <GuestSkeleton />;
  if (loadError || !hub) return <GuestError message={loadError || 'This link is not available.'} />;

  const business = hub.business || {};
  const color = brandColor(business.themecolor);
  const ctx: GuestPlaceContext = { token, hub, setHub, color, business };

  return (
    <GuestCtx.Provider value={ctx}>
      <PlaceFrame business={business} token={token} current={tab}>
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={tab}
            custom={direction}
            initial={reduce ? false : { opacity: 0, x: direction >= 0 ? 36 : -36 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduce ? undefined : { opacity: 0, x: direction >= 0 ? -28 : 28 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
          >
            {tab === 'play' && <PlayPanel />}
            {tab === 'menu' && <MenuPanel />}
            {tab === 'bill' && <BillPanel />}
            {tab === 'review' && <ReviewPanel />}
          </motion.div>
        </AnimatePresence>
      </PlaceFrame>
    </GuestCtx.Provider>
  );
}

type PricedOption = { optionid: number; optionname: string; price: string | number };
type PricedAddon = { addonid: number; addonname: string; price: string | number };

function ItemSheet({
  item, color, optionId, addonIds, onOption, onToggleAddon, onClose, onAdd,
}: {
  item: any;
  color: string;
  optionId: number | null;
  addonIds: number[];
  onOption: (id: number) => void;
  onToggleAddon: (id: number) => void;
  onClose: () => void;
  onAdd: () => void;
}) {
  const options = (item.options || []) as PricedOption[];
  const addons = (item.addons || []) as PricedAddon[];
  const option = options.find((row) => Number(row.optionid) === optionId);
  const extra = addons.filter((row) => addonIds.includes(Number(row.addonid))).reduce((sum, row) => sum + Number(row.price), 0);
  const total = Number(option?.price ?? item.price) + extra;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-stone-950/50 sm:items-center" onClick={onClose}>
      <div className="flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl" onClick={(event) => event.stopPropagation()}>
        <div className="relative">
          {item.imagepath ? <img alt="" src={asset(item.imagepath)} className="h-44 w-full object-cover" /> : <div className="h-28" style={{ background: color }} />}
          <button type="button" className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white text-lg shadow" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <h2 className="text-xl font-bold">{item.itemname}</h2>
          {item.description && <p className="mt-1 text-sm text-stone-500">{item.description}</p>}
          {options.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-semibold">Choose option</p>
              <div className="mt-2 space-y-2">
                {options.map((row) => (
                  <label key={row.optionid} className={`flex cursor-pointer items-center justify-between rounded-2xl border px-3 py-3 ${optionId === Number(row.optionid) ? 'border-orange-500 bg-orange-50' : 'border-stone-200'}`}>
                    <span className="flex items-center gap-2 text-sm font-medium"><input type="radio" name="menu-option" checked={optionId === Number(row.optionid)} onChange={() => onOption(Number(row.optionid))} />{row.optionname}</span>
                    <span className="text-sm font-semibold" style={{ color }}>{rupee(Number(row.price))}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          {addons.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-semibold">Add-ons</p>
              <div className="mt-2 space-y-2">
                {addons.map((row) => (
                  <label key={row.addonid} className="flex cursor-pointer items-center justify-between rounded-2xl border border-stone-200 px-3 py-3">
                    <span className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={addonIds.includes(Number(row.addonid))} onChange={() => onToggleAddon(Number(row.addonid))} />{row.addonname}</span>
                    <span className="text-sm font-semibold text-emerald-600">+{rupee(Number(row.price))}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-stone-100 bg-white px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <p className="text-2xl font-bold">{rupee(total)}</p>
          <button type="button" className="rounded-full px-6 py-3 text-sm font-semibold text-white shadow-md" style={{ background: color }} onClick={onAdd}>Add to cart</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function QtyControl({ color, qty, onChange }: { color: string; qty: number; onChange: (qty: number) => void }) {
  if (!qty) {
    return (
      <button
        type="button"
        className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-semibold text-white shadow-md transition hover:brightness-110 active:scale-[0.98]"
        style={{ background: color }}
        onClick={() => onChange(1)}
      >
        <span className="text-base leading-none">+</span>
        Add
      </button>
    );
  }
  return (
    <div className="inline-flex h-10 items-center gap-1 rounded-full border border-stone-200 bg-white p-1 shadow-sm">
      <button type="button" className="grid h-8 w-8 place-items-center rounded-full bg-stone-100 text-base font-bold text-stone-700" onClick={() => onChange(Math.max(0, qty - 1))} aria-label="Decrease">−</button>
      <span className="min-w-6 text-center text-sm font-bold text-stone-950">{qty}</span>
      <button type="button" className="grid h-8 w-8 place-items-center rounded-full text-base font-bold text-white" style={{ background: color }} onClick={() => onChange(qty + 1)} aria-label="Increase">+</button>
    </div>
  );
}

const gameNames: Record<string, string> = { SpinWheel: 'Spin wheel', ScratchCard: 'Scratch card', MysteryGiftBox: 'Mystery box', SlotMachine: 'Slots' };

function SaveCoinsModal({ onClose, token }: { onClose: () => void; token: string }) {
  const auth = useAuth();
  const [mode, setMode] = useState<'create' | 'login'>('create');
  const [error, setError] = useState('');

  async function onLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const result = await client.login({ mobile: form.get('mobile'), password: form.get('password'), remember: true });
      auth.setSession(result.user, result.accessToken);
      toastOk('Coins saved to your wallet.');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed.');
    }
  }

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const guestId = auth.user?.name?.startsWith('Guest_') ? auth.user.id : undefined;
      const result = await client.registerCustomer({ name: form.get('name'), mobile: form.get('mobile'), password: form.get('password'), token, guestId });
      auth.setSession(result.user, result.accessToken);
      toastOk('Account created. Coins are saved.');
      onClose();
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not register.'); }
  }

  return (
    <Modal title="Save these coins" text="Keep the prize in a wallet, or sign in if you already have one." onClose={onClose}>
      <div className="mb-4 grid grid-cols-2 rounded-xl bg-stone-100 p-1">
        <button type="button" className={`h-10 rounded-lg text-sm font-semibold ${mode === 'create' ? 'bg-white shadow-sm' : 'text-stone-500'}`} onClick={() => { setMode('create'); setError(''); }}>Create account</button>
        <button type="button" className={`h-10 rounded-lg text-sm font-semibold ${mode === 'login' ? 'bg-white shadow-sm' : 'text-stone-500'}`} onClick={() => { setMode('login'); setError(''); }}>Already exist? Login</button>
      </div>
      {error && <Alert text={error} />}
      {mode === 'create' ? (
        <Form onSubmit={onCreate} className="space-y-3">
          <Field label="Full name" name="name" required />
          <Field label="Mobile" name="mobile" inputMode="numeric" maxLength={10} pattern="[6-9][0-9]{9}" required />
          <Field label="Password" name="password" type="password" required />
          <Button type="submit" className="w-full">Create and save</Button>
        </Form>
      ) : (
        <Form onSubmit={onLogin} className="space-y-3">
          <Field label="Mobile" name="mobile" inputMode="numeric" maxLength={10} pattern="[6-9][0-9]{9}" required />
          <Field label="Password" name="password" type="password" required />
          <Button type="submit" className="w-full">Sign in and save</Button>
        </Form>
      )}
    </Modal>
  );
}

export function PlayPanel() {
  const { token, hub, color, business } = useGuestPlace();
  const auth = useAuth();
  const [game, setGame] = useState('SpinWheel');
  const [prizes, setPrizes] = useState<PrizeSlice[]>([]);
  const [result, setResult] = useState<PlayResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saveOpen, setSaveOpen] = useState(false);

  async function play() {
    setError('');
    setResult(null);
    setBusy(true);
    try {
      const data = await api<PlayResult & { prizes?: PrizeSlice[]; accessToken?: string; user?: typeof auth.user }>(`/public/play`, { method: 'POST', body: JSON.stringify({ token, gameCode: game }) });
      if (data.prizes?.length) setPrizes(data.prizes);
      if (data.accessToken && data.user) auth.setSession(data.user, data.accessToken);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Play failed.');
      throw err;
    } finally { setBusy(false); }
  }

  const signedIn = auth.user && !auth.user.name.startsWith('Guest_');
  const games = (hub?.games?.length ? hub.games : [{ gamecode: 'SpinWheel' }, { gamecode: 'ScratchCard' }, { gamecode: 'MysteryGiftBox' }, { gamecode: 'SlotMachine' }]) as { gamecode: string }[];

  useEffect(() => {
    if (result && !signedIn) setSaveOpen(true);
  }, [result, signedIn]);

  return (
    <>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {games.map((item) => (
          <button key={item.gamecode} type="button" className="whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold" style={game === item.gamecode ? { background: color, color: '#fff' } : { background: '#f1f5f9', color: '#475569' }} onClick={() => { setGame(item.gamecode); setResult(null); }}>
            {gameNames[item.gamecode] || item.gamecode}
          </button>
        ))}
      </div>
      <section className="mt-4 grid place-items-center overflow-visible rounded-3xl bg-stone-100 px-2 py-5 sm:mt-5 sm:px-4 sm:py-6">
        <GameStage key={game} game={game} prizes={prizes} busy={busy} onPlay={play} onReveal={setResult} />
      </section>
      {error && <p className="mt-4 rounded-2xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      {result && (
        <div className="mt-5 rounded-2xl bg-amber-50 p-5 text-center ring-1 ring-amber-100">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-500">You won</p>
          <p className="mt-1 text-3xl font-semibold">{result.prizeName}</p>
          <p className="text-sm font-semibold text-amber-500">{result.coins} coins</p>
        </div>
      )}
      {result && signedIn && <p className="mt-4 text-center text-sm text-stone-500">Saved to your wallet. <Link className="font-semibold text-orange-600" to="/customer/wallet">Open wallet</Link></p>}
      {result && !signedIn && !saveOpen && <button type="button" className="mx-auto mt-4 block text-sm font-semibold text-orange-600" onClick={() => setSaveOpen(true)}>Sign in to keep these coins</button>}
      {saveOpen && !signedIn && <SaveCoinsModal token={token} onClose={() => setSaveOpen(false)} />}
      <OffersList />
      {!business && null}
    </>
  );
}

function OffersList() {
  const { hub } = useGuestPlace();
  const offers = (hub?.offers || []) as { rewardid: number; rewardname: string; description?: string; coinsrequired: number; imagepath?: string }[];
  return (
    <>
    <section className="mt-8 border-t border-stone-100 pt-5">
      <h2 className="text-base font-bold">Current offers</h2>
      <p className="mt-1 text-xs text-stone-400">Rewards this shop has switched on.</p>
      {!offers.length && <p className="mt-3 text-sm text-stone-400">No active offers right now.</p>}
      <div className="mt-3 space-y-2">
        {offers.map((offer) => (
          <article key={offer.rewardid} className="flex items-center gap-3 rounded-2xl border border-stone-100 bg-stone-50 p-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-amber-100 text-lg">
              {offer.imagepath ? <img alt="" src={asset(offer.imagepath)} className="h-full w-full object-cover" /> : '🎁'}
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold text-stone-950">{offer.rewardname}</p>
              {offer.description && <p className="line-clamp-2 text-xs text-stone-500">{offer.description}</p>}
              <p className="mt-0.5 text-xs font-semibold text-amber-600">{offer.coinsrequired} coins</p>
            </div>
          </article>
        ))}
      </div>
    </section>
    <GetAppCard />
    </>
  );
}

type CartLine = {
  key: string;
  itemId: number;
  name: string;
  optionId?: number;
  optionName?: string;
  addons: { id: number; name: string; price: number }[];
  unitPrice: number;
  qty: number;
};

function rupee(value: number) {
  return `₹${Math.round(value)}`;
}

function cartKey(itemId: number, optionId?: number, addonIds: number[] = []) {
  return `${itemId}:${optionId || 0}:${[...addonIds].sort((a, b) => a - b).join('.')}`;
}

export function MenuPanel() {
  const { token, hub, color, business } = useGuestPlace();
  const auth = useAuth();
  const [filter, setFilter] = useState<number | 'all'>('all');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [fulfillment, setFulfillment] = useState<'DineIn' | 'Delivery' | 'Pickup'>('DineIn');
  const [station, setStation] = useState('');
  const [address, setAddress] = useState('');
  const [guestName, setGuestName] = useState('');
  const [mobile, setMobile] = useState('');
  const [note, setNote] = useState('');
  const [whatsappUrl, setWhatsappUrl] = useState('');
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [custom, setCustom] = useState<any | null>(null);
  const [pickedOption, setPickedOption] = useState<number | null>(null);
  const [pickedAddons, setPickedAddons] = useState<number[]>([]);

  const categories = (hub?.categories || []) as any[];
  const items = (hub?.items || []) as any[];
  const visible = filter === 'all' ? items : items.filter((item) => item.categoryid === filter);
  const grouped = useMemo(() => {
    const map = new Map<number, any[]>();
    visible.forEach((item) => {
      const key = item.categoryid || 0;
      map.set(key, [...(map.get(key) || []), item]);
    });
    return map;
  }, [visible]);
  const count = cart.reduce((sum, line) => sum + line.qty, 0);
  const total = cart.reduce((sum, line) => sum + line.unitPrice * line.qty, 0);

  function setQty(key: string, qty: number) {
    setCart((current) => current.flatMap((line) => (line.key === key ? (qty > 0 ? [{ ...line, qty }] : []) : [line])));
  }

  function addLine(line: CartLine) {
    setCart((current) => {
      const found = current.find((row) => row.key === line.key);
      if (!found) {
        toastInfo(`${line.name} added to cart`);
        return [...current, line];
      }
      return current.map((row) => (row.key === line.key ? { ...row, qty: row.qty + line.qty } : row));
    });
  }

  function openItem(item: any) {
    const options = (item.options || []) as PricedOption[];
    setCustom(item);
    setPickedOption(options[0] ? Number(options[0].optionid) : null);
    setPickedAddons([]);
  }

  function confirmCustom() {
    if (!custom) return;
    const options = (custom.options || []) as PricedOption[];
    const addons = (custom.addons || []) as PricedAddon[];
    const option = options.find((row) => Number(row.optionid) === pickedOption);
    if (options.length && !option) { toastErr('Choose an option.'); return; }
    const chosen = addons.filter((row) => pickedAddons.includes(Number(row.addonid)));
    const unit = Number(option?.price ?? custom.price) + chosen.reduce((sum, row) => sum + Number(row.price), 0);
    addLine({
      key: cartKey(custom.itemid, option ? Number(option.optionid) : undefined, chosen.map((row) => Number(row.addonid))),
      itemId: Number(custom.itemid),
      name: custom.itemname,
      optionId: option ? Number(option.optionid) : undefined,
      optionName: option?.optionname,
      addons: chosen.map((row) => ({ id: Number(row.addonid), name: row.addonname, price: Number(row.price) })),
      unitPrice: unit,
      qty: 1,
    });
    setCustom(null);
  }

  async function place() {
    if (sending) return;
    if (!cart.length) { toastErr('Add something from the menu first.'); return; }
    if (!isTenDigitMobile(mobile)) { toastErr('Enter a 10-digit mobile number.'); return; }
    if (fulfillment === 'DineIn' && !station.trim()) { toastErr('Table or room number is required for dine in.'); return; }
    if (fulfillment === 'Delivery' && !address.trim()) { toastErr('Delivery address is required.'); return; }
    setSending(true);
    const popup = window.open('', '_blank');
    try {
      const result = await api<{ message: string; orderNumber: string; whatsappUrl?: string | null; accessToken?: string; user?: NonNullable<typeof auth.user> }>('/public/orders', {
        method: 'POST',
        body: JSON.stringify({
          token,
          fulfillment,
          tableNumber: station,
          deliveryAddress: address,
          customerName: guestName,
          customerMobile: mobile,
          remarks: note,
          items: cart.map((line) => ({ itemId: line.itemId, qty: line.qty, optionId: line.optionId, addonIds: line.addons.map((addon) => addon.id) })),
        }),
      });
      if (result.accessToken && result.user && auth.user?.role !== 'BusinessAdmin' && auth.user?.role !== 'SuperAdmin') auth.setSession(result.user, result.accessToken);
      if (result.whatsappUrl) {
        if (popup) popup.location.href = result.whatsappUrl;
        setWhatsappUrl(result.whatsappUrl);
        toastOk(`Order ${result.orderNumber} placed. Send it on WhatsApp too.`);
      } else {
        popup?.close();
        setWhatsappUrl('');
        toastOk(`Order ${result.orderNumber} is in the shop queue.`);
      }
      setCart([]);
      setNote('');
      setOpen(false);
    } catch {
      popup?.close();
    } finally { setSending(false); }
  }

  const chip = (active: boolean) => active ? { background: color, color: '#fff' } : { background: '#f1f5f9', color: '#475569' };

  return (
    <>
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button type="button" className="whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold" style={chip(filter === 'all')} onClick={() => setFilter('all')}>All items</button>
        {categories.map((category) => (
          <button key={category.categoryid} type="button" className="whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold" style={chip(filter === category.categoryid)} onClick={() => setFilter(category.categoryid)}>{category.categoryname}</button>
        ))}
      </div>
      {whatsappUrl && (
        <p className="mt-4 rounded-2xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Order sent to the queue. <a className="font-semibold underline" href={whatsappUrl} target="_blank" rel="noreferrer">Open WhatsApp</a>
        </p>
      )}
      <div className={`mt-4 space-y-8 ${count ? 'pb-28' : ''}`}>
        {[...grouped.entries()].map(([categoryId, rows]) => (
          <section key={categoryId}>
            <h2 className="text-lg font-bold">{categories.find((category) => category.categoryid === categoryId)?.categoryname || 'Menu'}</h2>
            <div className="mt-3 space-y-3">
              {rows.map((item) => {
                const options = (item.options || []) as PricedOption[];
                const addons = (item.addons || []) as PricedAddon[];
                const configurable = options.length > 0 || addons.length > 0;
                const simpleKey = cartKey(item.itemid);
                const simple = cart.find((line) => line.key === simpleKey);
                const from = options.length ? Math.min(...options.map((option) => Number(option.price))) : Number(item.price);
                return (
                  <article key={item.itemid} className="flex items-center gap-3 rounded-2xl border border-stone-100 bg-white p-3 shadow-sm">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                      {item.imagepath ? (
                        <img alt="" src={asset(item.imagepath)} className="h-full w-full object-cover" />
                      ) : (
                        <div className="grid h-full w-full place-items-center text-lg font-semibold text-white" style={{ background: color }}>{String(item.itemname || '?').slice(0, 1)}</div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-stone-950">{item.itemname}</p>
                      {item.description && <p className="line-clamp-2 text-sm text-stone-500">{item.description}</p>}
                      <p className="mt-1 text-sm font-bold" style={{ color }}>{options.length ? `From ${rupee(from)}` : rupee(from)}</p>
                      {(options.length > 0 || addons.length > 0) && (
                        <p className="mt-1 flex flex-wrap gap-1 text-[11px] font-semibold">
                          {options.length > 0 && <span className="rounded-full bg-violet-50 px-2 py-0.5 text-violet-600">Options</span>}
                          {addons.length > 0 && <span className="rounded-full bg-sky-50 px-2 py-0.5 text-sky-600">Add-ons</span>}
                        </p>
                      )}
                    </div>
                    {configurable ? (
                      <button type="button" className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-lg font-bold text-white shadow-md" style={{ background: color }} onClick={() => openItem(item)} aria-label={`Customize ${item.itemname}`}>+</button>
                    ) : (
                      <QtyControl color={color} qty={simple?.qty || 0} onChange={(qty) => {
                        if (!simple && qty > 0) addLine({ key: simpleKey, itemId: item.itemid, name: item.itemname, unitPrice: Number(item.price), qty, addons: [] });
                        else setQty(simpleKey, qty);
                      }} />
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        ))}
        {!items.length && <p className="py-16 text-center text-stone-400">No menu items yet.</p>}
        <OffersList />
      </div>

      {count > 0 && !custom && createPortal(
        <div className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 sm:px-4">
          <button
            type="button"
            className="mx-auto flex w-full max-w-xl items-center justify-between gap-3 rounded-2xl px-5 py-3.5 text-left text-white shadow-2xl shadow-stone-950/30"
            style={{ background: color }}
            onClick={() => setOpen(true)}
          >
            <span>
              <span className="block text-sm font-semibold">View cart · {count} item{count === 1 ? '' : 's'}</span>
              <span className="text-xs text-white/80">Dine in, delivery, or pickup</span>
            </span>
            <span className="rounded-xl bg-white/20 px-3 py-1.5 text-sm font-bold">{rupee(total)}</span>
          </button>
        </div>,
        document.body,
      )}
      {custom && (
        <ItemSheet
          item={custom}
          color={color}
          optionId={pickedOption}
          addonIds={pickedAddons}
          onOption={setPickedOption}
          onToggleAddon={(id) => setPickedAddons((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id])}
          onClose={() => setCustom(null)}
          onAdd={confirmCustom}
        />
      )}
      {open && createPortal(
        <div className="fixed inset-0 z-50 flex items-end bg-stone-900/40 sm:items-center sm:justify-center" onClick={() => { if (!sending) setOpen(false); }}>
          <div className="public-sheet flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl bg-white sm:rounded-3xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
              <h2 className="text-lg font-bold">Checkout · {rupee(total)}</h2>
              <button type="button" className="text-sm font-semibold text-stone-500" onClick={() => setOpen(false)}>Close</button>
            </div>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
              {cart.map((line) => (
                <div key={line.key} className="flex items-center justify-between gap-3 rounded-2xl border border-stone-100 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{line.name}</p>
                    <p className="text-sm text-stone-500">{[line.optionName, ...line.addons.map((addon) => addon.name)].filter(Boolean).join(' · ') || rupee(line.unitPrice)} · {rupee(line.unitPrice)} each</p>
                  </div>
                  <QtyControl color={color} qty={line.qty} onChange={(qty) => setQty(line.key, qty)} />
                </div>
              ))}
              <div>
                <p className="text-sm font-semibold text-stone-700">How should we serve this?</p>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {([['DineIn', 'Dine in'], ['Delivery', 'Delivery'], ['Pickup', 'Pickup']] as const).map(([value, label]) => (
                    <button key={value} type="button" className={`rounded-2xl border px-2 py-3 text-sm font-semibold ${fulfillment === value ? 'border-transparent text-white' : 'border-stone-200 bg-stone-50 text-stone-600'}`} style={fulfillment === value ? { background: color } : undefined} onClick={() => setFulfillment(value)}>{label}</button>
                  ))}
                </div>
              </div>
              {fulfillment === 'DineIn' && (
                <label className="block text-sm">
                  <span className="mb-1.5 block font-medium">{hub?.settings?.stationlabel || 'Table / room'}</span>
                  <input value={station} onChange={(event) => setStation(event.target.value)} placeholder={hub?.settings?.stationplaceholder || 'Table 4'} className="h-11 w-full rounded-xl border border-stone-200 px-3" />
                </label>
              )}
              {fulfillment === 'Delivery' && (
                <label className="block text-sm">
                  <span className="mb-1.5 block font-medium">Delivery address</span>
                  <textarea value={address} onChange={(event) => setAddress(event.target.value)} rows={3} placeholder="House, street, landmark" className="w-full rounded-xl border border-stone-200 px-3 py-2" />
                </label>
              )}
              {fulfillment === 'Pickup' && <p className="rounded-2xl bg-stone-50 px-3 py-2 text-sm text-stone-500">We’ll keep this ready at the counter. Share the mobile so the shop can call you.</p>}
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium">Your name</span>
                <input value={guestName} onChange={(event) => setGuestName(event.target.value)} placeholder="So the shop knows who ordered" className="h-11 w-full rounded-xl border border-stone-200 px-3" />
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium">Mobile number</span>
                <input value={mobile} onChange={(event) => setMobile(digitsOnly(event.target.value))} inputMode="numeric" maxLength={10} placeholder="10-digit mobile" className="h-11 w-full rounded-xl border border-stone-200 px-3" />
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium">Special instructions</span>
                <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} placeholder="Less spicy, no onion, call on arrival…" className="w-full rounded-xl border border-stone-200 px-3 py-2" />
              </label>
            </div>
            <div className="shrink-0 border-t border-stone-100 bg-white px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <Button className="w-full" busy={sending} onClick={place}>{hub?.type?.actionbuttontext || 'Place order'}</Button>
            </div>
          </div>
        </div>,
        document.body,
      )}
      {!business && null}
    </>
  );
}

export function BillPanel() {
  const { token } = useGuestPlace();
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [amount, setAmount] = useState('');
  const [invoice, setInvoice] = useState('');
  const [note, setNote] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState('');

  async function submit() {
    if (!name.trim()) { toastErr('Enter your name.'); return; }
    if (!isTenDigitMobile(mobile)) { toastErr('Enter a 10-digit mobile number.'); return; }
    if (!(Number(amount) > 0)) { toastErr('Enter the bill amount.'); return; }
    setBusy(true);
    try {
      const body = new FormData();
      body.set('token', token);
      body.set('customerName', name.trim());
      body.set('mobile', mobile);
      body.set('amount', amount);
      if (invoice.trim()) body.set('invoiceNumber', invoice.trim());
      if (note.trim()) body.set('remarks', note.trim());
      if (file) body.set('file', file);
      const result = await api<{ message: string }>('/public/claims', { method: 'POST', body });
      setDone(result.message);
      toastOk(result.message);
    } finally { setBusy(false); }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold">Bill payment</h2>
        <p className="mt-1 text-sm text-stone-500">Paid at the counter? Send the bill here. The shop confirms it and adds the coins.</p>
      </div>
      {done ? <p className="rounded-2xl bg-emerald-50 px-3 py-3 text-sm text-emerald-700">{done}</p> : (
        <div className="space-y-3">
          <label className="block text-sm"><span className="mb-1.5 block font-medium">Name</span><input value={name} onChange={(event) => setName(event.target.value)} className="h-11 w-full rounded-xl border border-stone-200 px-3" /></label>
          <label className="block text-sm"><span className="mb-1.5 block font-medium">Mobile</span><input value={mobile} onChange={(event) => setMobile(digitsOnly(event.target.value))} inputMode="numeric" maxLength={10} placeholder="10-digit mobile" className="h-11 w-full rounded-xl border border-stone-200 px-3" /></label>
          <label className="block text-sm"><span className="mb-1.5 block font-medium">Bill amount</span><input value={amount} onChange={(event) => setAmount(event.target.value.replace(/[^\d.]/g, ''))} inputMode="decimal" placeholder="₹" className="h-11 w-full rounded-xl border border-stone-200 px-3" /></label>
          <label className="block text-sm"><span className="mb-1.5 block font-medium">Invoice number</span><input value={invoice} onChange={(event) => setInvoice(event.target.value)} className="h-11 w-full rounded-xl border border-stone-200 px-3" /></label>
          <label className="block text-sm"><span className="mb-1.5 block font-medium">Note</span><textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} className="w-full rounded-xl border border-stone-200 px-3 py-2" /></label>
          <label className="block text-sm"><span className="mb-1.5 block font-medium">Bill photo</span><input type="file" accept="image/png,image/jpeg,image/webp" className="block w-full text-sm" onChange={(event) => setFile(event.target.files?.[0] || null)} /></label>
          <Button className="w-full" busy={busy} onClick={submit}>Submit bill</Button>
        </div>
      )}
      <OffersList />
    </div>
  );
}

const stars = [1, 2, 3, 4, 5];

export function ReviewPanel() {
  const { token, hub, setHub, color, business } = useGuestPlace();
  const [rating, setRating] = useState(0);
  const [picked, setPicked] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [reviews, setReviews] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [phone, setPhone] = useState('');
  const [done, setDone] = useState('');
  const [busy, setBusy] = useState(false);

  const keywords = useMemo(() => {
    const fromHub = Array.isArray(hub?.keywords) ? hub.keywords.filter((w: unknown) => typeof w === 'string' && w.trim()) : [];
    return fromHub.length ? fromHub : DEFAULT_KEYWORDS;
  }, [hub?.keywords]);

  function toggle(word: string) {
    setPicked((current) => {
      if (current.includes(word)) return current.filter((item) => item !== word);
      if (current.length >= 3) {
        toastInfo('Pick up to 3 words.');
        return current;
      }
      return [...current, word];
    });
  }

  async function generate() {
    if (!name.trim()) { toastErr('Add your name first.'); return; }
    if (!rating) { toastErr('Tap a star rating first.'); return; }
    setBusy(true);
    setDone('');
    setReviews([]);
    try {
      const words = picked.length ? picked : keywords.slice(0, 3);
      const result = await api<{ reviews: string[]; googleReviewUrl?: string; keywords?: string[] }>('/public/reviews/generate', {
        method: 'POST',
        body: JSON.stringify({ token, customerName: name, keywords: words, rating }),
      });
      const drafts = (result.reviews || []).filter(Boolean);
      if (!drafts.length) {
        toastErr('Could not write reviews. Try again.');
        return;
      }
      setReviews(drafts);
      if (result.googleReviewUrl) {
        setHub((current) => current ? ({ ...current, business: { ...business, googlereviewurl: result.googleReviewUrl } }) : current);
      }
      toastOk('Pick a draft to copy and post.');
    } catch {
      /* api toasts */
    } finally { setBusy(false); }
  }

  async function useReview(text: string) {
    let copied = true;
    try { await navigator.clipboard.writeText(text); } catch { copied = false; }
    await api('/public/reviews', { method: 'POST', body: JSON.stringify({ token, rating, customerName: name, body: text }) }).catch(() => undefined);
    const url = business.googlereviewurl;
    if (url) window.open(url, '_blank');
    const msg = copied
      ? (url ? 'Copied. Paste it into Google Reviews.' : 'Copied. Add a Google review URL on the shop profile to open it automatically.')
      : 'Saved. Copy the review by hand, then paste it into Google.';
    setDone(msg);
    toastOk(msg);
  }

  async function sendFeedback() {
    if (!name.trim()) { toastErr('Add your name first.'); return; }
    if (!note.trim()) { toastErr('Tell the shop what could be better.'); return; }
    if (phone && !isTenDigitMobile(phone)) { toastErr('Mobile must be 10 digits, or leave it blank.'); return; }
    setBusy(true);
    try {
      await api('/public/feedback', { method: 'POST', body: JSON.stringify({ token, rating, customerName: name, phone, message: note }) });
      setDone('Thanks. This stays with the shop and is not posted publicly.');
      toastOk('Feedback sent to the shop.');
      setNote('');
    } catch {
      /* api toasts */
    } finally { setBusy(false); }
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-center text-sm font-medium text-stone-600">How was your visit?</p>
        <div className="mt-2 flex justify-center gap-2">
          {stars.map((star) => (
            <button key={star} type="button" aria-label={`${star} star${star === 1 ? '' : 's'}`} className={`min-h-11 min-w-11 text-4xl transition ${star <= rating ? 'text-amber-400' : 'text-stone-200'}`} onClick={() => { setRating(star); setReviews([]); setDone(''); setPicked([]); }}>★</button>
          ))}
        </div>
      </div>
      <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" className="h-11 w-full rounded-xl border border-stone-200 px-3 text-sm" />

      {rating >= 4 && (
        <div>
          <p className="text-sm font-medium text-stone-600">Pick up to 3 words for your review</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {keywords.map((word: string) => (
              <button
                key={word}
                type="button"
                className={`min-h-11 rounded-full px-3 text-sm font-semibold transition ${picked.includes(word) ? 'text-white shadow-sm' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
                style={picked.includes(word) ? { background: color } : undefined}
                onClick={() => toggle(word)}
              >
                {word}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-stone-400">{picked.length ? `${picked.length}/3 selected` : 'Or skip — we will use a few defaults.'}</p>
          <Button className="mt-4 w-full" busy={busy} onClick={generate}>{busy ? 'Writing with AI…' : 'Write my review with AI'}</Button>
          <div className="mt-4 space-y-3">
            {reviews.map((text) => (
              <button key={text} type="button" className="w-full rounded-2xl border border-stone-200 p-4 text-left text-sm leading-relaxed transition hover:border-orange-400 hover:bg-orange-50/50" onClick={() => useReview(text)}>
                <p>{text}</p>
                <p className="mt-2 text-xs font-semibold text-orange-600">Tap to copy & open Google</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {rating > 0 && rating < 4 && (
        <div className="space-y-3">
          <p className="text-sm text-stone-500">This goes only to the shop — not posted publicly.</p>
          <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={4} placeholder="What should they improve?" className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm" />
          <input value={phone} onChange={(event) => setPhone(digitsOnly(event.target.value))} inputMode="numeric" maxLength={10} placeholder="10-digit mobile, if you want a reply" className="h-11 w-full rounded-xl border border-stone-200 px-3 text-sm" />
          <Button className="w-full" busy={busy} onClick={sendFeedback}>Send private feedback</Button>
        </div>
      )}

      {!rating && <p className="text-center text-sm text-stone-400">Tap the stars to continue.</p>}
      {done && <p className="rounded-2xl bg-stone-100 px-3 py-2 text-sm text-stone-600">{done}</p>}
      <OffersList />
    </div>
  );
}

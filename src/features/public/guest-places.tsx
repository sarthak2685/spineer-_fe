import { createContext, FormEvent, ReactNode, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, NavLink, useLocation, useParams } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { api, asset, client } from '../../api/client';
import { useAuth } from '../../app/auth';
import { ActionIcon, Alert, Button, Field, Form, IconButton, Modal } from '../../components/ui';
import { catalogCopy } from '../../lib/catalog';
import { digitsOnly, isTenDigitMobile } from '../../lib/mobile';
import { scrollToShopContent, scrollToShopContentLater } from '../../lib/scroll';
import { useInstallApp } from '../../lib/use-install';
import { toastErr, toastInfo, toastOk } from '../../lib/toast';
import { GameStage, PrizeSlice, PlayResult } from './Games';

export function brandColor(value?: string) {
  return value && /^#[0-9a-fA-F]{6}$/.test(value) ? value : '#ea580c';
}

const DEFAULT_KEYWORDS = ['friendly staff', 'quick service', 'clean place', 'good value', 'professional', 'on time', 'comfortable', 'worth visiting'];

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
  const pulse = 'animate-pulse motion-reduce:animate-none';
  return (
    <div className="public-enter min-h-screen bg-orange-50" aria-busy="true" aria-label="Loading shop">
      <div className={`flex min-h-[100dvh] flex-col items-center justify-center bg-orange-200/80 px-6 pb-28 ${pulse}`}>
        <div className="h-24 w-24 rounded-full bg-white/80" />
        <div className="mt-4 h-7 w-40 rounded-full bg-white/70" />
        <div className="mt-3 h-3 w-56 max-w-full rounded-full bg-white/50" />
      </div>
      <div className="fixed inset-x-0 bottom-0 z-30 px-2 pt-2" style={{ paddingBottom: 'max(0.55rem, env(safe-area-inset-bottom))' }}>
        <div className="mx-auto flex max-w-md items-end justify-between rounded-[1.75rem] bg-white px-2 py-3 shadow-[0_-8px_30px_rgba(28,25,23,0.12)] ring-1 ring-stone-200">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="flex flex-1 flex-col items-center gap-1">
              <div className={`h-8 w-8 rounded-full ${index === 0 ? 'bg-orange-200' : 'bg-stone-100'} ${pulse}`} />
              <div className={`h-2 w-8 rounded-full bg-stone-100 ${pulse}`} />
            </div>
          ))}
        </div>
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

function shopFrame(play: boolean, height = typeof window === 'undefined' ? 720 : window.innerHeight, width = typeof window === 'undefined' ? 1200 : window.innerWidth) {
  // Compact sticky bar for every tab — game picker lives in the play panel, not the header.
  const bar = play ? 168 : 136;
  return {
    height,
    width,
    bar,
    banner: 40,
    logoEnd: 44,
  };
}
function Icon({ children, className = 'h-9 w-9' }: { children: ReactNode; className?: string }) {
  return <span className={`grid place-items-center rounded-full bg-stone-100 ring-1 ring-stone-100 ${className}`}>{children}</span>;
}

function tabFromPath(pathname: string): GuestTab {
  if (pathname.includes('/menu/')) return 'menu';
  if (pathname.includes('/bill/')) return 'bill';
  if (pathname.includes('/review/')) return 'review';
  return 'play';
}

const tabOrder: GuestTab[] = ['play', 'menu', 'bill', 'review'];

export function PlaceFrame({ business, token, current, children }: { business: Record<string, any>; token?: string; current: GuestTab; children: ReactNode }) {
  const auth = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const [wifiOpen, setWifiOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const signedIn = Boolean(auth.user && !auth.user.name.startsWith('Guest_'));
  useEffect(() => {
    const open = () => setLoginOpen(true);
    window.addEventListener('rs-open-shop-signin', open);
    return () => window.removeEventListener('rs-open-shop-signin', open);
  }, []);
  const color = brandColor(business.themecolor);
  const shopName = business.businessname || 'Repeat Mate';
  const shopMark = String(shopName).trim().slice(0, 1).toUpperCase() || 'R';
  const heroRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const playTab = current === 'play';
  const frame = useRef(shopFrame(playTab));
  const { scrollY } = useScroll();
  const scrollToContent = (smooth = true) => {
    const full = heroRef.current?.offsetHeight || window.innerHeight;
    frame.current = shopFrame(playTab, full, window.innerWidth);
    scrollToShopContent(panelRef.current, smooth);
  };
  useEffect(() => {
    const onScrollRequest = () => {
      // Wait for route + layout (header bar height differs on play vs menu).
      scrollToShopContentLater(panelRef.current, true, 80);
    };
    window.addEventListener('rs-scroll-shop-content', onScrollRequest);
    return () => window.removeEventListener('rs-scroll-shop-content', onScrollRequest);
  }, []);
  useEffect(() => {
    // Land on the shop panel for every tab, including play (collapsed header + content).
    const id = window.setTimeout(() => scrollToContent(true), 120);
    return () => window.clearTimeout(id);
  }, [current]);
  useLayoutEffect(() => {
    const measure = () => {
      const height = heroRef.current?.offsetHeight || window.innerHeight;
      frame.current = shopFrame(playTab, height, window.innerWidth);
      const current = scrollY.get();
      scrollY.set(current + 0.01);
      scrollY.set(current);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [scrollY, playTab]);
  const collapse = (value: number) => {
    const full = frame.current.height || window.innerHeight;
    const bar = frame.current.bar || Math.round(full * 0.33);
    return Math.min(1, Math.max(0, value / Math.max(full - bar, 1)));
  };
  const headerHeight = useTransform(scrollY, (value) => {
    const full = frame.current.height || window.innerHeight;
    const bar = frame.current.bar || Math.round(full * 0.33);
    return Math.max(bar, full - value);
  });
  const logoSize = useTransform(scrollY, (value) => {
    const end = frame.current.logoEnd || 44;
    return 96 - collapse(value) * (96 - end);
  });
  const logoLeft = useTransform(scrollY, (value) => {
    const end = frame.current.logoEnd || 44;
    const size = 96 - collapse(value) * (96 - end);
    const width = frame.current.width || window.innerWidth;
    const centered = width / 2 - size / 2;
    const sheet = Math.min(width, 576);
    const parked = (width - sheet) / 2 + 12;
    const t = collapse(value);
    return centered * (1 - t) + parked * t;
  });
  const logoTop = useTransform(scrollY, (value) => {
    const full = frame.current.height || window.innerHeight;
    const t = collapse(value);
    const banner = frame.current.banner || 44;
    return full * 0.32 * (1 - t) + (banner + 6) * t;
  });
  const coverTop = useTransform(scrollY, (value) => {
    const t = collapse(value);
    const full = frame.current.height || window.innerHeight;
    const end = frame.current.logoEnd || 44;
    const size = 96 - t * (96 - end);
    const banner = frame.current.banner || 44;
    const top = full * 0.32 * (1 - t) + (banner + 6) * t;
    return top + size + 14;
  });
  const identityHeight = useTransform(scrollY, (value) => {
    const shown = Math.min(1, Math.max(0, (collapse(value) - 0.62) / 0.38));
    const bar = frame.current.bar || Math.round(window.innerHeight * 0.33);
    const banner = frame.current.banner || Math.round(bar * 0.2);
    return shown * (bar - banner);
  });
  const coverOpacity = useTransform(scrollY, (value) => Math.max(0, 1 - collapse(value) / 0.42));
  const hintOpacity = useTransform(scrollY, (value) => Math.max(0, 1 - collapse(value) / 0.18));
  const hintPointer = useTransform(hintOpacity, (value) => (value > 0.25 ? 'auto' : 'none'));
  const whatsapp = String(business.whatsappnumber || '').replace(/\D/g, '');
  const wa = whatsapp.length === 10 ? `91${whatsapp}` : whatsapp;
  const link = (href: string, label: string, icon: ReactNode) => (
    <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" aria-label={label} title={label} className="relative z-20 shrink-0 pointer-events-auto">
      {icon}
    </a>
  );
  const web = (value?: string) => {
    const text = String(value || '').trim();
    if (!text) return '';
    return /^https?:\/\//i.test(text) ? text : `https://${text}`;
  };
  const wifiName = String(business.wifiname || '').trim();
  const wifiPassword = String(business.wifipassword || '').trim();
  const menuLabel = catalogCopy(business.businesstype).tab;
  const compactIcon = 'h-8 w-8 [&_svg]:h-4 [&_svg]:w-4';
  return (
    <div className="public-enter min-h-screen bg-orange-50 text-stone-900">
      <div ref={heroRef} className="h-[100dvh]" aria-hidden="true" />
      {createPortal(
        <motion.header style={{ height: headerHeight }} className="fixed inset-x-0 top-0 z-20">
          <div className="absolute inset-0 overflow-hidden" style={{ background: `linear-gradient(160deg, ${color}, #7c2d12 55%, #0c0a09)` }}>
            {business.bannerimagepath && <img alt="" src={asset(business.bannerimagepath)} className="h-full w-full object-cover" />}
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/20 to-black/25" />
          </div>
          <motion.div style={{ height: identityHeight }} className="pointer-events-none absolute inset-x-0 bottom-0 z-20 overflow-hidden bg-orange-50">
            <div className="pointer-events-auto mx-auto flex h-full max-w-xl flex-col bg-white px-3 pb-2 pt-1.5 sm:rounded-t-[28px]">
              <div className="flex min-h-11 shrink-0 items-center pl-14">
                <div className="min-w-0 text-left">
                  <h1 className="truncate text-base font-bold leading-tight text-stone-950">{shopName}</h1>
                  <p className="truncate text-xs leading-tight text-stone-500">{business.tagline || business.description || 'Play, order, and review in one place.'}</p>
                </div>
              </div>
              <div className="relative z-20 mt-2 flex shrink-0 flex-nowrap justify-center gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {business.phone && link(`tel:${String(business.phone).replace(/\D/g, '')}`, 'Call', <Icon className={compactIcon}><svg viewBox="0 0 24 24" className="h-4 w-4 fill-stone-700"><path d="M6.6 10.8a15 15 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11 11 0 0 0 3.5.55 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 7a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11 11 0 0 0 .55 3.5 1 1 0 0 1-.25 1L6.6 10.8z" /></svg></Icon>)}
                {wa && link(`https://wa.me/${wa}`, 'WhatsApp', <Icon className={compactIcon}><svg viewBox="0 0 24 24" className="h-4 w-4 fill-emerald-600"><path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.7-1.2A9 9 0 1 0 12 3zm5 12.4c-.2.6-1.2 1.1-1.7 1.1-.4.1-.9.2-3-.8-2.5-1.2-4.1-3.6-4.2-3.8-.2-.2-1.2-1.6-1.2-3s.7-2.1 1-2.4c.2-.2.5-.3.8-.3h.6c.2 0 .4 0 .6.5.2.6.8 2 .8 2.1.1.1 0 .3-.1.5l-.4.5c-.1.2-.3.3-.1.6.2.3.7 1.2 1.5 1.9 1 .9 1.8 1.2 2.1 1.3.3.1.4.1.6-.1l.7-.8c.2-.2.4-.2.6-.1l2 .9c.2.1.4.2.4.4.1.2 0 .8-.2 1.3z" /></svg></Icon>)}
                {business.instagramurl && link(web(business.instagramurl), 'Instagram', <Icon className={compactIcon}><svg viewBox="0 0 24 24" className="h-4 w-4 fill-pink-600"><path d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zm5 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm6.2-.9a1 1 0 1 0 0 2 1 1 0 0 0 0-2zM12 10a2 2 0 1 1 0 4 2 2 0 0 1 0-4z" /></svg></Icon>)}
                {business.facebookurl && link(web(business.facebookurl), 'Facebook', <Icon className={compactIcon}><svg viewBox="0 0 24 24" className="h-4 w-4 fill-blue-600"><path d="M14 9h3V6h-3c-2.2 0-4 1.8-4 4v2H8v3h2v7h3v-7h2.6l.4-3H13v-2c0-.6.4-1 1-1z" /></svg></Icon>)}
                {business.twitterurl && link(web(business.twitterurl), 'X', <Icon className={compactIcon}><svg viewBox="0 0 24 24" className="h-4 w-4 fill-stone-950"><path d="M14.7 4h2.4l-5.2 6 6.1 8h-4.8l-3.8-5-4.3 5H2.7l5.6-6.4L2.5 4h4.9l3.4 4.5L14.7 4zm-.8 12.6h1.3L7.2 5.3H5.8l8.1 11.3z" /></svg></Icon>)}
                {business.youtubeurl && link(web(business.youtubeurl), 'YouTube', <Icon className={compactIcon}><svg viewBox="0 0 24 24" className="h-4 w-4 fill-red-600"><path d="M23 12.2s0-3.2-.4-4.6c-.2-.9-.9-1.6-1.8-1.8C19.2 5.4 12 5.4 12 5.4s-7.2 0-8.8.4c-.9.2-1.6.9-1.8 1.8C1 9 1 12.2 1 12.2s0 3.2.4 4.6c.2.9.9 1.6 1.8 1.8 1.6.4 8.8.4 8.8.4s7.2 0 8.8-.4c.9-.2 1.6-.9 1.8-1.8.4-1.4.4-4.6.4-4.6zM9.8 15.5v-6.6l6.2 3.3-6.2 3.3z" /></svg></Icon>)}
                {business.website && link(web(business.website), 'Website', <Icon className={compactIcon}><svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-orange-600" strokeWidth="1.8"><circle cx="12" cy="12" r="8" /><path d="M4 12h16M12 4c2.5 2.8 2.5 13.2 0 16M12 4c-2.5 2.8-2.5 13.2 0 16" /></svg></Icon>)}
                {(wifiName || wifiPassword) && (
                  <button type="button" onClick={() => setWifiOpen((open) => !open)} className="relative z-20 shrink-0 pointer-events-auto" aria-label="Wi-Fi" title="Wi-Fi" aria-expanded={wifiOpen}>
                    <Icon className={compactIcon}><svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-orange-600" strokeWidth="1.8" strokeLinecap="round"><path d="M5 12.5a10 10 0 0 1 14 0M8 15.2a6 6 0 0 1 8 0" /><circle cx="12" cy="18" r="1" fill="currentColor" stroke="none" /></svg></Icon>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
          <motion.div style={{ width: logoSize, height: logoSize, left: logoLeft, top: logoTop }} className="pointer-events-none absolute z-10 grid place-items-center overflow-hidden rounded-full bg-white shadow-lg ring-4 ring-white">
            {business.logoimagepath ? <img alt="" src={asset(business.logoimagepath)} className="h-full w-full object-cover" /> : <span className="font-display text-[1.6rem] font-semibold text-orange-600">{shopMark}</span>}
          </motion.div>
          <motion.div style={{ top: coverTop, opacity: coverOpacity }} className="pointer-events-none absolute inset-x-6 text-center text-white">
            <h1 className="text-[1.7rem] font-bold leading-tight">{shopName}</h1>
            <p className="mt-2 text-sm leading-relaxed text-white/85">{business.tagline || business.description || 'Play, order, and review in one place.'}</p>
          </motion.div>
          <motion.button
            type="button"
            style={{ opacity: hintOpacity, pointerEvents: hintPointer }}
            onClick={() => scrollToContent()}
            className="absolute bottom-[5.75rem] left-1/2 -translate-x-1/2 text-white/90"
            aria-label="Scroll to content"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.button>
        </motion.header>,
        document.body,
      )}
      <div className="relative z-10 mx-auto max-w-xl pb-52 sm:px-4">
        <div
          id="shop-panel"
          ref={panelRef}
          className="relative scroll-mt-28 bg-white px-5 pb-8 pt-3 shadow-xl shadow-stone-950/10 sm:rounded-b-[28px]"
        >
          {business.address && <p className="mb-3 text-center text-sm text-stone-500">{business.address}</p>}
          {wifiOpen && (wifiName || wifiPassword) && (
            <div className="mx-auto mb-3 max-w-xs rounded-2xl bg-orange-50 px-4 py-3 text-left text-sm text-stone-700">
              {wifiName && <p>Network <span className="font-semibold text-stone-950">{wifiName}</span></p>}
              {wifiPassword && <p className="mt-1">Password <span className="font-semibold text-stone-950">{wifiPassword}</span></p>}
              <button type="button" className="mt-2 text-xs font-semibold text-orange-600" onClick={() => { void navigator.clipboard?.writeText([wifiName, wifiPassword].filter(Boolean).join('\n')).then(() => setCopied(true)); }}>{copied ? 'Copied' : 'Copy details'}</button>
            </div>
          )}
          {children}
        </div>
      </div>
      <ShopDock token={token} current={current} menuLabel={menuLabel} />
      {loginOpen && !signedIn && token && <SaveCoinsModal token={token} onClose={() => setLoginOpen(false)} />}
    </div>
  );
}

function DockGlyph({ name }: { name: 'play' | 'calendar' | 'list' | 'bill' | 'review' | 'app' | 'user' }) {
  const common = { viewBox: '0 0 24 24', className: 'h-5 w-5', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (name === 'play') return <svg {...common}><path d="M9 6.5v11l9-5.5z" /></svg>;
  if (name === 'bill') return <svg {...common}><path d="M8 3.5h8a1 1 0 0 1 1 1V20l-2.2-1.4L12.5 20l-2.3-1.4L8 20l-2.2-1.4L3.5 20V4.5a1 1 0 0 1 1-1H8z" /><path d="M8 8h8M8 12h8" /></svg>;
  if (name === 'review') return <svg {...common}><path d="M12 4.2 13.8 8l4.2.4-3.2 2.8.9 4.1L12 13.4 8.3 15.3l.9-4.1L6 8.4 10.2 8z" /></svg>;
  if (name === 'app') return <svg {...common}><path d="M12 4v9M8.5 10.5 12 14l3.5-3.5M6 19h12" /></svg>;
  if (name === 'calendar') return <svg {...common}><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3.5v3M16 3.5v3M4 10h16" /></svg>;
  if (name === 'user') return <svg {...common}><circle cx="12" cy="8" r="3" /><path d="M5.5 19a6.5 6.5 0 0 1 13 0" /></svg>;
  return <svg {...common}><path d="M6 7h12M6 12h12M6 17h8" /></svg>;
}

function catalogGlyph(label: string): 'calendar' | 'list' {
  return /^menu$/i.test(label) ? 'list' : 'calendar';
}

function ShopDock({ token, current, menuLabel }: { token?: string; current: GuestTab; menuLabel: string }) {
  const auth = useAuth();
  const signedIn = Boolean(auth.user && auth.user.role === 'Customer' && !auth.user.name.startsWith('Guest_'));
  const { install } = useInstallApp();
  const scrollIntoShop = () => window.dispatchEvent(new Event('rs-scroll-shop-content'));
  const item = (active: boolean) => `flex min-w-0 flex-1 flex-col items-center gap-0.5 px-0.5 py-1 text-[9px] font-semibold leading-none sm:text-[11px] ${active ? 'text-orange-600' : 'text-stone-400'}`;
  const bubble = (active: boolean) => `grid h-8 w-8 place-items-center rounded-full sm:h-10 sm:w-10 ${active ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30' : 'bg-stone-100 text-stone-500'}`;
  return createPortal(
    <nav className="fixed inset-x-0 bottom-0 z-30 px-2 pt-2" style={{ paddingBottom: 'max(0.55rem, env(safe-area-inset-bottom))' }} aria-label="Shop">
      <div className="mx-auto flex w-full max-w-md items-end justify-between rounded-[1.75rem] bg-white px-1 py-2 shadow-[0_-8px_30px_rgba(28,25,23,0.12)] ring-1 ring-stone-200">
        <NavLink to={`/play/${token}`} onClick={scrollIntoShop} className={item(current === 'play')}><span className={bubble(current === 'play')}><DockGlyph name="play" /></span><span className="max-w-full truncate">Play</span></NavLink>
        <NavLink to={`/menu/${token}`} onClick={scrollIntoShop} className={item(current === 'menu')}><span className={bubble(current === 'menu')}><DockGlyph name={catalogGlyph(menuLabel)} /></span><span className="max-w-full truncate">{menuLabel}</span></NavLink>
        <NavLink to={`/bill/${token}`} onClick={scrollIntoShop} className={item(current === 'bill')}><span className={bubble(current === 'bill')}><DockGlyph name="bill" /></span><span className="max-w-full truncate">Bill</span></NavLink>
        <NavLink to={`/review/${token}`} onClick={scrollIntoShop} className={item(current === 'review')}><span className={bubble(current === 'review')}><DockGlyph name="review" /></span><span className="max-w-full truncate">Review</span></NavLink>
        <button type="button" className={item(false)} onClick={() => { void install(); }}><span className={bubble(false)}><DockGlyph name="app" /></span><span className="max-w-full truncate">Get app</span></button>
        {signedIn ? (
          <NavLink to="/customer/dashboard" className={item(false)}><span className={bubble(false)}><DockGlyph name="user" /></span><span className="max-w-full truncate">Account</span></NavLink>
        ) : (
          <button type="button" className={item(false)} onClick={() => window.dispatchEvent(new Event('rs-open-shop-signin'))}><span className={bubble(false)}><DockGlyph name="user" /></span><span className="max-w-full truncate">Sign in</span></button>
        )}
      </div>
    </nav>,
    document.body,
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

  // Always full-bleed shop UI (no wallet sidebar) so the hero/dock layout stays correct.
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
  item, color, optionId, addonIds, onOption, onToggleAddon, onClose, onAdd, optionLabel, addonLabel, addLabel,
}: {
  item: any;
  color: string;
  optionId: number | null;
  addonIds: number[];
  onOption: (id: number) => void;
  onToggleAddon: (id: number) => void;
  onClose: () => void;
  onAdd: () => void;
  optionLabel: string;
  addonLabel: string;
  addLabel: string;
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
          <IconButton label="Close" kind="ghost" className="absolute right-3 top-3 !bg-white shadow" onClick={onClose}><ActionIcon name="close" /></IconButton>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <h2 className="text-xl font-bold">{item.itemname}</h2>
          {item.description && <p className="mt-1 text-sm text-stone-500">{item.description}</p>}
          {options.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-semibold">{optionLabel}</p>
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
              <p className="text-sm font-semibold">{addonLabel}</p>
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
          <button type="button" className="rounded-full px-6 py-3 text-sm font-semibold text-white shadow-md" style={{ background: color }} onClick={onAdd}>{addLabel}</button>
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

function SaveCoinsModal({ onClose, token, coins = 0, prizeName = '' }: { onClose: () => void; token: string; coins?: number; prizeName?: string }) {
  const auth = useAuth();
  const [mode, setMode] = useState<'create' | 'login'>('create');
  const [error, setError] = useState('');

  async function onLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const result = await client.login({ mobile: form.get('mobile'), password: form.get('password'), email: String(form.get('email') || '').trim() || undefined, remember: true });
      auth.setSession(result.user, result.accessToken);
      toastOk('Coins saved to your Repeat Mate wallet.');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed.');
    }
  }

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const email = String(form.get('email') || '').trim();
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setError('Enter a valid email, or leave it blank.');
        return;
      }
      const guestId = auth.user?.name?.startsWith('Guest_') ? auth.user.id : undefined;
      const result = await client.registerCustomer({ name: form.get('name'), mobile: form.get('mobile'), email: email || undefined, password: form.get('password'), token, guestId });
      auth.setSession(result.user, result.accessToken);
      toastOk('Account created. Coins are saved.');
      onClose();
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not register.'); }
  }

  return (
    <Modal title={coins > 0 ? `Save ${coins} coins` : 'Save these coins'} text={prizeName ? `${prizeName}. Keep it in a wallet, or sign in if you already have one.` : 'Keep the prize in a wallet, or sign in if you already have one.'} onClose={onClose}>
      <div className="mb-4 grid grid-cols-2 rounded-xl bg-stone-100 p-1">
        <button type="button" className={`h-10 rounded-lg text-sm font-semibold ${mode === 'create' ? 'bg-white shadow-sm' : 'text-stone-500'}`} onClick={() => { setMode('create'); setError(''); }}>Create account</button>
        <button type="button" className={`h-10 rounded-lg text-sm font-semibold ${mode === 'login' ? 'bg-white shadow-sm' : 'text-stone-500'}`} onClick={() => { setMode('login'); setError(''); }}>Already exist? Login</button>
      </div>
      {error && <Alert text={error} />}
      {mode === 'create' ? (
        <Form onSubmit={onCreate} className="space-y-3">
          <Field label="Full name" name="name" required />
          <Field label="Mobile" name="mobile" inputMode="numeric" maxLength={10} pattern="[6-9][0-9]{9}" required />
          <Field label="Email (optional)" name="email" type="email" autoComplete="email" />
          <Field label="Password" name="password" type="password" required />
          <Button type="submit" className="w-full">Create and save</Button>
        </Form>
      ) : (
        <Form onSubmit={onLogin} className="space-y-3">
          <Field label="Mobile" name="mobile" inputMode="numeric" maxLength={10} pattern="[6-9][0-9]{9}" required />
          <Field label="Email (optional)" name="email" type="email" autoComplete="email" />
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
  const reduce = useReducedMotion();
  const [game, setGame] = useState('SpinWheel');
  const [prizes, setPrizes] = useState<PrizeSlice[]>([]);
  const [result, setResult] = useState<PlayResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saveOpen, setSaveOpen] = useState(false);
  const [winOpen, setWinOpen] = useState(false);

  async function play() {
    setError('');
    setResult(null);
    setSaveOpen(false);
    setWinOpen(false);
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
  const gameOrder = ['SpinWheel', 'ScratchCard', 'MysteryGiftBox', 'SlotMachine'];
  const available = new Set(((hub?.games || []) as { gamecode: string }[]).map((item) => item.gamecode));
  const games = (available.size ? gameOrder.filter((code) => available.has(code)) : gameOrder).map((gamecode) => ({ gamecode }));

  return (
    <>
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {games.map((item) => {
          const active = game === item.gamecode;
          return (
            <button key={item.gamecode} type="button" className={`relative w-full rounded-full px-3 py-2.5 text-xs font-semibold leading-none shadow-sm transition-colors duration-200 ${active ? 'text-white delay-100' : 'bg-white text-stone-600 ring-1 ring-stone-200'}`} onClick={() => { setGame(item.gamecode); setResult(null); setSaveOpen(false); setWinOpen(false); }}>
              {active && (
                <motion.span
                  layoutId={reduce ? undefined : 'play-game-choice'}
                  className="absolute inset-0 rounded-full"
                  style={{ background: color }}
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                />
              )}
              <span className="relative">{gameNames[item.gamecode] || item.gamecode}</span>
            </button>
          );
        })}
      </div>
      <section className="mb-4 overflow-visible rounded-[28px] bg-[radial-gradient(ellipse_at_top,#fff,#fafaf9_46%,#e7e5e4)] px-3 py-6 shadow-[inset_0_1px_0_rgba(255,255,255,.9)] sm:px-6 sm:py-8">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={game}
            className="grid place-items-center"
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <GameStage game={game} prizes={prizes} busy={busy} onPlay={play} onReveal={(value) => { setResult(value); setWinOpen(true); }} accent={color} />
          </motion.div>
        </AnimatePresence>
      </section>
      {error && <p className="mt-4 rounded-2xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      {winOpen && result && !saveOpen && (
        <Modal title="You won" text={result.prizeName} onClose={() => { setWinOpen(false); if (!signedIn) setSaveOpen(true); }}>
          <p className="text-center text-4xl font-semibold text-amber-600">{result.coins} coins</p>
          {signedIn ? (
            <p className="mt-4 text-center text-sm text-stone-500">Saved to your Repeat Mate wallet. <Link className="font-semibold text-orange-600" to="/customer/wallet">Open wallet</Link></p>
          ) : (
            <Button type="button" className="mt-5 w-full" onClick={() => { setWinOpen(false); setSaveOpen(true); }}>Save these coins</Button>
          )}
        </Modal>
      )}
      {saveOpen && result && !signedIn && <SaveCoinsModal token={token} coins={result.coins} prizeName={result.prizeName} onClose={() => setSaveOpen(false)} />}
      <OffersList />
      {!business && null}
    </>
  );
}

function offerLabel(status?: string) {
  if (status === 'Pending') return 'Pending';
  if (status === 'Approved') return 'Redeemed';
  if (status === 'Rejected') return 'Redeem again';
  return 'Redeem';
}

function OfferMark({ image }: { image?: string }) {
  return (
    <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-amber-100 text-amber-700">
      {image ? <img alt="" src={asset(image)} className="h-full w-full object-cover" /> : (
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <rect x="3" y="10" width="18" height="10" rx="2" />
          <path d="M3 14h18M12 10v10M12 10c-2-3-6-3.5-6-1s4 1 6 1 6-1.5 6-1-4-2-6 1z" />
        </svg>
      )}
    </div>
  );
}

function OffersList() {
  const { hub, business } = useGuestPlace();
  const location = useLocation();
  const auth = useAuth();
  const signedIn = Boolean(auth.user && auth.user.role === 'Customer' && !auth.user.name.startsWith('Guest_'));
  const offers = (hub?.offers || []) as { rewardid: number; rewardname: string; description?: string; coinsrequired: number; imagepath?: string }[];
  const [statuses, setStatuses] = useState<Record<number, string>>({});
  const businessId = business?.businessid;
  useEffect(() => {
    if (!signedIn || !businessId) return;
    api<{ rewards?: { rewardid: number; redemptionstatus?: string }[] }>(`/customer/rewards?businessId=${businessId}`, { quiet: true })
      .then((data) => {
        const next: Record<number, string> = {};
        (data.rewards || []).forEach((reward) => { if (reward.redemptionstatus) next[reward.rewardid] = reward.redemptionstatus; });
        setStatuses(next);
      })
      .catch(() => undefined);
  }, [signedIn, businessId]);
  useEffect(() => {
    if (location.hash !== '#offers') return;
    document.getElementById('offers')?.scrollIntoView({ block: 'start' });
  }, [location.hash, offers.length]);
  async function redeem(offer: { rewardid: number }) {
    const status = statuses[offer.rewardid];
    if (status === 'Pending' || status === 'Approved') return;
    if (!signedIn) {
      window.dispatchEvent(new Event('rs-open-shop-signin'));
      return;
    }
    const result = await api<{ message?: string }>(`/customer/rewards/${offer.rewardid}/redeem`, { method: 'POST' });
    toastOk(result.message || 'This offer is pending until the shop approves it.');
    setStatuses((current) => ({ ...current, [offer.rewardid]: 'Pending' }));
  }
  const scroller = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  function onScroll() {
    const node = scroller.current;
    if (!node || !node.clientWidth) return;
    const next = Math.round(node.scrollLeft / node.clientWidth);
    setIndex(Math.min(offers.length - 1, Math.max(0, next)));
  }
  function go(next: number) {
    const node = scroller.current;
    if (!node) return;
    node.scrollTo({ left: next * node.clientWidth, behavior: 'smooth' });
  }
  return (
    <section id="offers" className="mt-8 scroll-mt-6 border-t border-stone-100 pt-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-bold">Current offers</h2>
        {offers.length > 1 && <p className="text-xs font-semibold text-stone-400">{index + 1} of {offers.length}</p>}
      </div>
      <p className="mt-1 text-xs text-stone-400">Tap an offer to redeem it at this shop.</p>
      {!offers.length && <p className="mt-3 rounded-2xl bg-stone-50 px-3 py-4 text-sm text-stone-400">No active offers right now.</p>}
      {offers.length > 0 && (
        <div className="mt-3">
          <div ref={scroller} onScroll={onScroll} className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {offers.map((offer) => {
              const status = statuses[offer.rewardid];
              const closed = status === 'Pending' || status === 'Approved';
              return (
                <div key={offer.rewardid} className="w-full shrink-0 snap-start">
                  <button type="button" disabled={closed} className="flex h-[6.5rem] w-full items-center gap-3 rounded-2xl border border-amber-100 bg-amber-50/70 p-3 text-left disabled:opacity-70" onClick={() => redeem(offer)}>
                    <OfferMark image={offer.imagepath} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold leading-snug text-stone-950">{offer.rewardname}</p>
                      {offer.description && <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-stone-500">{offer.description}</p>}
                      <p className="mt-1 text-xs font-semibold text-amber-700">{offer.coinsrequired} coins</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${closed ? 'bg-stone-200 text-stone-600' : 'bg-orange-600 text-white'}`}>{offerLabel(status)}</span>
                  </button>
                </div>
              );
            })}
          </div>
          {offers.length > 1 && (
            <div className="mt-3 flex justify-center gap-1.5" aria-label="Offer slides">
              {offers.map((offer, dot) => (
                <button key={offer.rewardid} type="button" aria-label={`Show offer ${dot + 1}`} className={`h-1.5 rounded-full ${dot === index ? 'w-4 bg-orange-600' : 'w-1.5 bg-stone-300'}`} onClick={() => go(dot)} />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
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
  const [fulfillment, setFulfillment] = useState<'DineIn' | 'Delivery' | 'Pickup'>(catalogCopy('').modes[0][0]);
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

  const copy = catalogCopy(hub?.type?.typename || hub?.type?.typecode || business?.businesstype);
  useEffect(() => {
    if (!copy.modes.some(([value]) => value === fulfillment)) setFulfillment(copy.modes[0][0]);
  }, [copy.kind]);
  useEffect(() => {
    const preset = String(hub?.settings?.stationplaceholder || '').trim();
    if (!preset) return;
    setStation((current) => (current.trim() ? current : preset));
  }, [hub?.settings?.stationplaceholder]);
  const categories = (hub?.categories || []) as any[];
  const items = (hub?.items || []) as any[];
  const visible = filter === 'all' ? items : items.filter((item) => item.categoryid === filter);
  const grouped = useMemo(() => {
    const map = new Map<number, any[]>();
    visible.forEach((item) => {
      const key = item.categoryid || 0;
      map.set(key, [...(map.get(key) || []), item]);
    });
    const order = new Map(categories.map((category, index) => [category.categoryid, index]));
    return [...map.entries()].sort((a, b) => (order.get(a[0]) ?? 99) - (order.get(b[0]) ?? 99));
  }, [visible, categories]);
  const count = cart.reduce((sum, line) => sum + line.qty, 0);
  const total = cart.reduce((sum, line) => sum + line.unitPrice * line.qty, 0);

  function setQty(key: string, qty: number) {
    setCart((current) => current.flatMap((line) => (line.key === key ? (qty > 0 ? [{ ...line, qty }] : []) : [line])));
  }

  function addLine(line: CartLine) {
    setCart((current) => {
      const found = current.find((row) => row.key === line.key);
      if (!found) {
        toastInfo(`${line.name} · ${copy.added.toLowerCase()}`);
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
    if (!cart.length) { toastErr(`Add something from the ${copy.tab.toLowerCase()} list first.`); return; }
    if (!isTenDigitMobile(mobile)) { toastErr('Enter a 10-digit mobile number.'); return; }
    if (fulfillment === 'Delivery' && !address.trim()) { toastErr('Delivery address is required.'); return; }
    setSending(true);
    const popup = window.open('', '_blank');
    try {
      const result = await api<{ message: string; orderNumber: string; whatsappUrl?: string | null; accessToken?: string; user?: NonNullable<typeof auth.user> }>('/public/orders', {
        method: 'POST',
        body: JSON.stringify({
          token,
          fulfillment,
          tableNumber: station.trim() || '0',
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
      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button type="button" className="whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold" style={chip(filter === 'all')} onClick={() => setFilter('all')}>{copy.guestAll}</button>
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
        {grouped.map(([categoryId, rows]) => (
          <section key={categoryId}>
            <h2 className="text-lg font-bold">{categories.find((category) => category.categoryid === categoryId)?.categoryname || copy.pageTitle}</h2>
            <div className="mt-3 space-y-3">
              {rows.map((item) => {
                const options = (item.options || []) as PricedOption[];
                const addons = (item.addons || []) as PricedAddon[];
                const configurable = options.length > 0 || addons.length > 0;
                const simpleKey = cartKey(item.itemid);
                const simple = cart.find((line) => line.key === simpleKey);
                const from = options.length ? Math.min(...options.map((option) => Number(option.price))) : Number(item.price);
                return (
                  <article key={item.itemid} className="flex items-start gap-3 rounded-2xl border border-stone-100 bg-white p-3 shadow-sm">
                    {item.imagepath ? (
                      <div className="relative mt-0.5 h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-stone-100">
                        <img alt="" src={asset(item.imagepath)} className="h-full w-full object-cover" />
                      </div>
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold leading-snug text-stone-950">{item.itemname}</p>
                      {item.description && <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-stone-500">{item.description}</p>}
                      <p className="mt-1.5 text-sm font-bold" style={{ color }}>{options.length ? `From ${rupee(from)}` : rupee(from)}</p>
                      {(options.length > 0 || addons.length > 0) && (
                        <p className="mt-1 flex flex-wrap gap-1 text-[11px] font-semibold">
                          {options.length > 0 && <span className="rounded-full bg-violet-50 px-2 py-0.5 text-violet-600">{copy.optionLabel}</span>}
                          {addons.length > 0 && <span className="rounded-full bg-sky-50 px-2 py-0.5 text-sky-600">{copy.addonLabel}</span>}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 self-center">
                      {configurable ? (
                        <button type="button" className="grid h-10 w-10 place-items-center rounded-full text-lg font-bold text-white shadow-md" style={{ background: color }} onClick={() => openItem(item)} aria-label={`Customize ${item.itemname}`}>+</button>
                      ) : (
                        <QtyControl color={color} qty={simple?.qty || 0} onChange={(qty) => {
                          if (!simple && qty > 0) addLine({ key: simpleKey, itemId: item.itemid, name: item.itemname, unitPrice: Number(item.price), qty, addons: [] });
                          else setQty(simpleKey, qty);
                        }} />
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
        {!items.length && <p className="py-16 text-center text-stone-400">{copy.emptyGuest}</p>}
        <OffersList />
      </div>

      {count > 0 && !custom && createPortal(
        <div className="fixed inset-x-0 z-40 px-3 pt-2 sm:px-4" style={{ bottom: 'calc(6.75rem + env(safe-area-inset-bottom))' }}>
          <button
            type="button"
            className="mx-auto flex w-full max-w-xl items-center justify-between gap-3 rounded-2xl px-5 py-3.5 text-left text-white shadow-2xl shadow-stone-950/30"
            style={{ background: color }}
            onClick={() => setOpen(true)}
          >
            <span>
              <span className="block text-sm font-semibold">{copy.action} · {count}</span>
              <span className="text-xs text-white/80">{copy.cartHint}</span>
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
          optionLabel={copy.optionLabel}
          addonLabel={copy.addonLabel}
          addLabel={copy.addButton}
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
                <p className="text-sm font-semibold text-stone-700">{copy.serveTitle}</p>
                <div className={`mt-2 grid gap-2 ${copy.modes.length > 1 ? 'grid-cols-3' : 'grid-cols-1'}`}>
                  {copy.modes.map(([value, label]) => (
                    <button key={value} type="button" className={`rounded-2xl border px-2 py-3 text-sm font-semibold ${fulfillment === value ? 'border-transparent text-white' : 'border-stone-200 bg-stone-50 text-stone-600'}`} style={fulfillment === value ? { background: color } : undefined} onClick={() => setFulfillment(value)}>{label}</button>
                  ))}
                </div>
              </div>
              {fulfillment === 'DineIn' && (
                <label className="block text-sm">
                  <span className="mb-1.5 block font-medium">{hub?.settings?.stationlabel || 'Table / room'}</span>
                  <input value={station} onChange={(event) => setStation(event.target.value)} placeholder="e.g. 12" className="h-11 w-full rounded-xl border border-stone-200 px-3" />
                  <span className="mt-1.5 block text-xs font-normal text-stone-400">{copy.stationNote}</span>
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
                <input value={guestName} onChange={(event) => setGuestName(event.target.value)} placeholder="Your name" className="h-11 w-full rounded-xl border border-stone-200 px-3" />
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium">Mobile number</span>
                <input value={mobile} onChange={(event) => setMobile(digitsOnly(event.target.value))} inputMode="numeric" maxLength={10} placeholder="10-digit mobile" className="h-11 w-full rounded-xl border border-stone-200 px-3" />
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium">{copy.noteLabel}</span>
                <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} placeholder={copy.notePlaceholder} className="w-full rounded-xl border border-stone-200 px-3 py-2" />
              </label>
            </div>
            <div className="shrink-0 border-t border-stone-100 bg-white px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <Button className="w-full" busy={sending} onClick={place}>{copy.action}</Button>
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
          <label className="flex h-11 cursor-pointer items-center justify-center rounded-xl border border-dashed border-stone-300 bg-stone-50 px-3 text-sm font-medium text-stone-600">
            <span className="truncate">{file ? file.name : 'Add a bill photo'}</span>
            <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(event) => setFile(event.target.files?.[0] || null)} />
          </label>
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
    if (!rating) { toastErr('Tap a star rating first.'); return; }
    setBusy(true);
    setDone('');
    setReviews([]);
    try {
      const words = picked.length ? picked : keywords.slice(0, 3);
      const result = await api<{ reviews: string[]; googleReviewUrl?: string; keywords?: string[] }>('/public/reviews/generate', {
        method: 'POST',
        body: JSON.stringify({ token, customerName: name, keywords: words, rating, variety: Date.now() ^ (Math.random() * 1e9 | 0) }),
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
      toastOk('Pick a draft to copy and post.', { id: 'review-drafts' });
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

  function reviewWithoutAi() {
    const url = business.googlereviewurl;
    if (!url) {
      toastInfo('Ask the shop to add their Google review link on the profile.');
      return;
    }
    window.open(url, '_blank');
    setDone('Opened Google — write your review there.');
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
      <label className="block text-sm">
        <span className="mb-1.5 block font-medium text-stone-600">Your name <span className="font-normal text-stone-400">(optional)</span></span>
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Leave blank to stay unnamed" className="h-11 w-full rounded-xl border border-stone-200 px-3 text-sm" />
      </label>

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
          <Button className="mt-2 w-full" kind="ghost" type="button" onClick={reviewWithoutAi}>Review without AI</Button>
          {!!reviews.length && (
            <p className="mt-3 text-xs text-stone-400">You can edit the text on Google before posting — avoid adding dish or service names.</p>
          )}
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

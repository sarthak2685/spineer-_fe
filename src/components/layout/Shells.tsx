import { Link, NavLink, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ReactNode, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Rise } from '../motion';
import { Brand, PageMeta, PageMetaContext } from '../ui';
import { homeFor, useAuth } from '../../app/auth';
import { api } from '../../api/client';
import { catalogCopy } from '../../lib/catalog';
import { DemoModalHost, openDemo } from '../../features/public/demo-request';
import { legalNav } from '../../features/public/legal-nav';
import { playNotify, unlockSound } from '../../lib/sounds';
import { toastInfo } from '../../lib/toast';
import { InboxCountProvider, useInboxCount } from '../../features/customer/inbox';

export type NavItem = { to: string; label: string; match?: string };
export type NavGroup = { heading: string; items: NavItem[] };

const productLinks = [
  { hash: 'what', label: 'Product' },
  { hash: 'features', label: 'Features' },
  { hash: 'how', label: 'How it works' },
  { hash: 'pricing', label: 'Pricing' },
  { hash: 'faq', label: 'FAQ' },
];

function SectionLink({ hash, children, className, onNavigate, light = false, solid = false, current = '', rail = false }: { hash: string; children: ReactNode; className?: string; onNavigate?: () => void; light?: boolean; solid?: boolean; current?: string; rail?: boolean }) {
  const location = useLocation();
  const active = location.pathname === '/' && (current ? current === hash : location.hash === `#${hash}`);
  const tone = solid ? '' : light ? (active ? 'text-orange-400' : 'text-white/70 hover:text-white') : (active ? 'bg-orange-50 text-orange-600' : 'text-stone-600 hover:bg-orange-50 hover:text-orange-600');
  return (
    <Link
      to={{ pathname: '/', hash }}
      className={`${className ?? ''} ${tone}`}
      onClick={() => {
        onNavigate?.();
        if (location.pathname === '/') {
          const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          document.getElementById(hash)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
        }
      }}
    >
      {rail && active && <span className="mr-2 h-4 w-0.5 rounded-full bg-orange-600" aria-hidden="true" />}
      {children}
    </Link>
  );
}

export function Marketing({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const member = Boolean(auth.ready && auth.user && !auth.user.name.startsWith('Guest_'));
  const deskTo = member ? homeFor(auth.user?.role) : '/login';
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  useEffect(() => { setOpen(false); }, [location.pathname, location.hash]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [open]);
  useEffect(() => {
    if (location.pathname !== '/') return undefined;
    const nodes = [...productLinks.map((link) => link.hash), 'demo'].map((id) => document.getElementById(id)).filter((node): node is HTMLElement => Boolean(node));
    if (!nodes.length) return undefined;
    const observer = new IntersectionObserver((entries) => {
      const seen = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (seen?.target.id) setVisible(seen.target.id);
    }, { rootMargin: '-20% 0px -55% 0px', threshold: [0.15, 0.4] });
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [location.pathname]);
  const desk = 'inline-flex h-9 items-center rounded-full px-3 text-sm font-medium transition';
  const item = 'relative flex min-h-11 items-center rounded-xl px-3 text-sm font-medium';
  const pageLink = ({ isActive }: { isActive: boolean }) => `${desk} ${isActive ? 'bg-orange-50 text-orange-600' : 'text-stone-600 hover:bg-orange-50 hover:text-orange-600'}`;
  const menuLink = ({ isActive }: { isActive: boolean }) => `${item} ${isActive ? 'bg-orange-50 text-orange-700 before:absolute before:bottom-2 before:left-0 before:top-2 before:w-0.5 before:rounded-full before:bg-orange-600' : 'text-stone-600 hover:bg-orange-50 hover:text-orange-600'}`;
  return (
    <div className="min-h-screen bg-orange-50">
      <header className={`sticky top-0 z-20 border-b transition ${scrolled || open ? 'border-stone-200 bg-white/95 shadow-sm shadow-stone-950/5 backdrop-blur' : 'border-transparent bg-orange-50/80 backdrop-blur'}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-5">
          <Brand />
          <nav className="hidden items-center gap-1 lg:flex">
            {productLinks.map((link) => <SectionLink key={link.hash} hash={link.hash} current={visible} className={desk}>{link.label}</SectionLink>)}
            <NavLink to="/about" className={pageLink}>About</NavLink>
            <SectionLink hash="demo" current={visible} className={desk}>Contact</SectionLink>
          </nav>
          <div className="flex items-center gap-2">
            <NavLink to={deskTo} className="inline-flex h-9 items-center rounded-full px-3 text-sm font-semibold text-stone-600 transition hover:bg-orange-50 hover:text-orange-600">{member ? 'Dashboard' : 'Sign in'}</NavLink>
            <button type="button" className="hidden h-9 items-center rounded-full bg-orange-600 px-4 text-sm font-semibold text-white shadow-lg shadow-orange-600/20 transition hover:bg-orange-700 lg:inline-flex" onClick={openDemo}>Book a Free Demo</button>
            <button type="button" className="grid h-11 w-11 place-items-center rounded-full border border-stone-200 bg-white lg:hidden" aria-expanded={open} aria-controls="marketing-menu" aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen((value) => !value)}>
              <span className="relative block h-3.5 w-4" aria-hidden="true">
                <span className={`absolute left-0 h-0.5 w-4 bg-stone-950 transition ${open ? 'top-1.5 rotate-45' : 'top-0'}`} />
                <span className={`absolute left-0 top-1.5 h-0.5 w-4 bg-stone-950 transition ${open ? 'opacity-0' : ''}`} />
                <span className={`absolute left-0 h-0.5 w-4 bg-stone-950 transition ${open ? 'top-1.5 -rotate-45' : 'top-3'}`} />
              </span>
            </button>
          </div>
        </div>
        {open && (
          <nav id="marketing-menu" className="grid gap-1 border-t border-stone-100 px-4 py-3 lg:hidden">
            <button type="button" className="inline-flex min-h-11 items-center justify-center rounded-full bg-orange-600 px-4 text-sm font-semibold text-white" onClick={() => { setOpen(false); openDemo(); }}>Book a Free Demo</button>
            {productLinks.map((link) => <SectionLink key={link.hash} hash={link.hash} current={visible} rail className={item} onNavigate={() => setOpen(false)}>{link.label}</SectionLink>)}
            <NavLink to="/about" className={menuLink} onClick={() => setOpen(false)}>About</NavLink>
            <SectionLink hash="demo" current={visible} rail className={item} onNavigate={() => setOpen(false)}>Contact</SectionLink>
            <NavLink to={deskTo} className={menuLink} onClick={() => setOpen(false)}>{member ? 'Dashboard' : 'Sign in'}</NavLink>
            <NavLink to="/customer-register" className={menuLink} onClick={() => setOpen(false)}>Customer signup</NavLink>
          </nav>
        )}
      </header>
      <DemoModalHost />
      <main>{location.pathname === '/' ? children : <Rise key={location.pathname}>{children}</Rise>}</main>
      <footer className="bg-stone-950 text-sm text-stone-300">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
          <div className="grid gap-10 lg:grid-cols-[1.25fr_0.8fr_0.9fr_0.7fr]">
            <div>
              <Brand light />
              <p className="mt-4 max-w-xs leading-relaxed text-stone-400">One QR for the menu, games, coins, coupons, reviews, and the next visit. Built for counters, tables, and chairs.</p>
              <button type="button" className="mt-6 inline-flex min-h-11 items-center rounded-full bg-orange-600 px-5 text-sm font-semibold text-white shadow-lg shadow-orange-600/20 transition hover:bg-orange-700" onClick={openDemo}>Book a Free Demo</button>
              <p className="mt-6 space-y-1 text-sm">
                <a href="mailto:repeatmate@gmail.com" className="block hover:text-white">repeatmate@gmail.com</a>
                <a href="tel:+919296756289" className="block hover:text-white">+91 92967 56289</a>
              </p>
            </div>
            <FooterColumn title="Product">
              {productLinks.map((link) => <SectionLink key={link.hash} hash={link.hash} light current={visible} className="block py-1">{link.label}</SectionLink>)}
            </FooterColumn>
            <FooterColumn title="Accounts">
              <Linkish to={deskTo} light>{member ? 'Dashboard' : 'Sign in'}</Linkish>
              <Linkish to="/register" light>Business signup</Linkish>
              <Linkish to="/customer-register" light>Customer signup</Linkish>
            </FooterColumn>
            <FooterColumn title="Company">
              <Linkish to="/about" light>About</Linkish>
              <SectionLink hash="demo" light current={visible} className="block py-1">Contact</SectionLink>
            </FooterColumn>
          </div>
          <div className="mt-12 border-t border-white/10 pt-6">
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-orange-300">Policies</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {legalNav.slice(0, 4).map((link) => <Link key={link.to} to={link.to} className="rounded-full border border-white/10 px-3 py-1.5 text-stone-300 transition hover:border-orange-600 hover:text-white">{link.label}</Link>)}
            </div>
            <details className="group mt-4">
              <summary className="inline-flex cursor-pointer list-none items-center gap-2 font-medium text-white [&::-webkit-details-marker]:hidden">
                All policies
                <svg viewBox="0 0 20 20" className="h-4 w-4 transition duration-200 group-open:rotate-180" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M5 8l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </summary>
              <div className="mt-3 flex flex-wrap gap-2">
                {legalNav.slice(4).map((link) => <Link key={link.to} to={link.to} className="rounded-full border border-white/10 px-3 py-1.5 text-stone-300 transition hover:border-orange-600 hover:text-white">{link.label}</Link>)}
              </div>
            </details>
          </div>
          <p className="mt-8 text-xs text-stone-500">Repeat Mate · WebGrow.store · One QR. Four games. One wallet.</p>
        </div>
      </footer>
    </div>
  );
}

function FooterColumn({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-orange-300">{title}</p>
      <div className="mt-4 flex flex-col gap-1">{children}</div>
    </div>
  );
}

function Linkish({ to, children, light = false }: { to: string; children: ReactNode; light?: boolean }) {
  return <NavLink to={to} className={light ? 'block py-1 text-white/70 hover:text-white' : 'hover:text-orange-600'}>{children}</NavLink>;
}

function accountName(name?: string) {
  if (!name || name.startsWith('Guest_')) return 'Guest';
  return name;
}

function roleLabel(role?: string, title?: string) {
  if (role === 'BusinessAdmin') return 'Store';
  if (role === 'SuperAdmin') return 'Platform';
  if (role === 'Customer') return title === 'Wallet' ? 'Wallet' : 'Customer';
  return title || '';
}

function RailIcon({ to }: { to: string }) {
  const common = { viewBox: '0 0 24 24', className: 'h-5 w-5', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (to.includes('business-types')) return <svg {...common}><path d="M8 7h11M8 12h11M8 17h11" /><circle cx="4.5" cy="7" r="1" fill="currentColor" stroke="none" /><circle cx="4.5" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="4.5" cy="17" r="1" fill="currentColor" stroke="none" /></svg>;
  if (to.includes('dashboard')) return <svg {...common}><path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" /></svg>;
  if (to.includes('explore') || to.includes('businesses')) return <svg {...common}><path d="M4 10h16v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" /><path d="M3 10 5 5h14l2 5" /></svg>;
  if (to.includes('wallet')) return <svg {...common}><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M3 10h18M16 15h2" /></svg>;
  if (to.includes('offers')) return <svg {...common}><path d="M4 12V6h6l10 10-6 6z" /><circle cx="8.5" cy="8.5" r="1" fill="currentColor" stroke="none" /></svg>;
  if (to.includes('rewards') || to.includes('redemption')) return <svg {...common}><path d="M12 3 14.2 7.6 19 8.2l-3.5 3.4.8 4.9L12 14.8 7.7 16.5l.8-4.9L5 8.2l4.8-.6z" /></svg>;
  if (to.includes('how-video')) return <svg {...common}><path d="M8 5.5v13l11-6.5z" /></svg>;
  if (to.includes('prizes') || to.includes('plays') || to.includes('games')) return <svg {...common}><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" /></svg>;
  if (to.includes('orders')) return <svg {...common}><path d="M6 7h15l-1.5 9H8L6 7z" /><path d="M6 7 5 4H2" /></svg>;
  if (to.includes('menu')) return <svg {...common}><path d="M6 7h12M6 12h12M6 17h8" /></svg>;
  if (to.includes('claim')) return <svg {...common}><path d="M7 3h10v18l-2-1.5L13 21l-2-1.5L9 21l-2-1.5L5 21V3h2z" /></svg>;
  if (to.includes('history')) return <svg {...common}><path d="M4 12a8 8 0 1 0 2-5.3" /><path d="M4 4v4h4M12 8v5l3 2" /></svg>;
  if (to.includes('notification') || to.includes('demos')) return <svg {...common}><path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2H4.5z" /><path d="M10 19a2 2 0 0 0 4 0" /></svg>;
  if (to.includes('profile')) return <svg {...common}><circle cx="12" cy="8" r="3" /><path d="M5 19a7 7 0 0 1 14 0" /></svg>;
  if (to.includes('qr')) return <svg {...common}><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2v6h-6v-2h4z" /></svg>;
  if (to.includes('review')) return <svg {...common}><path d="M12 4 14 9h5l-4 3 1.5 5L12 14l-4.5 3L9 12 5 9h5z" /></svg>;
  if (to.includes('push')) return <svg {...common}><path d="M4 12h10M12 8l4 4-4 4M18 6v12" /></svg>;
  if (to.includes('customer')) return <svg {...common}><circle cx="9" cy="8" r="3" /><path d="M3 19a6 6 0 0 1 12 0M17 8a3 3 0 1 1 0 6" /></svg>;
  return <svg {...common}><circle cx="12" cy="12" r="3" /></svg>;
}

export function Workspace({ groups, children, title, variant = 'default' }: { groups: NavGroup[]; children?: ReactNode; title?: string; variant?: 'default' | 'platform' }) {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const platform = variant === 'platform';
  const [meta, setMeta] = useState<PageMeta | null>(null);
  const current = groups.flatMap((group) => group.items)
    .filter((item) => location.pathname === item.to || location.pathname.startsWith(`${item.to}/`))
    .sort((a, b) => b.to.length - a.to.length)[0];
  const heading = meta?.title || current?.label || 'Repeat Mate';
  const name = accountName(auth.user?.name);
  const inboxTo = groups.flatMap((group) => group.items).some((item) => item.to === '/customer/notifications') ? '/customer/notifications' : '';
  const inbox = useInboxCount();
  const reduceMotion = useReducedMotion();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const profileTo = groups.flatMap((group) => group.items).find((item) => item.to.endsWith('/profile'))?.to || '';
  useEffect(() => { setMenuOpen(false); setAccountOpen(false); }, [location.pathname]);
  useEffect(() => {
    if (!accountOpen) return;
    function shut(event: MouseEvent) {
      if (accountRef.current?.contains(event.target as Node)) return;
      setAccountOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setAccountOpen(false);
    }
    document.addEventListener('mousedown', shut);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', shut);
      document.removeEventListener('keydown', onKey);
    };
  }, [accountOpen]);
  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [menuOpen]);
  function Sidebar() {
    return (
    <>
      <div className="flex items-center justify-between px-5 pb-2 pt-6">
        <Brand />
        <button type="button" className="grid h-10 w-10 place-items-center rounded-full border border-stone-200 text-stone-600 lg:hidden" aria-label="Close menu" onClick={() => setMenuOpen(false)}>
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      </div>
      <nav className="mt-4 min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-3 pb-4">
        {groups.map((group) => (
          <div key={group.heading}>
            <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-400">{group.heading}</p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink key={item.to} to={item.to} end={!item.match} onClick={() => setMenuOpen(false)} className={({ isActive }) => {
                  const active = item.match ? location.pathname.startsWith(item.match) : isActive;
                  return `relative flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition ${active ? 'bg-orange-50 text-orange-700 before:absolute before:bottom-2 before:left-0 before:top-2 before:w-0.5 before:rounded-full before:bg-orange-600' : 'text-stone-600 hover:bg-orange-50 hover:text-stone-950'}`;
                }}>
                  <RailIcon to={item.to} />
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
        </nav>
    </>
    );
  }
  return (
    <PageMetaContext.Provider value={setMeta}>
      <div className="min-h-screen bg-orange-50 lg:grid lg:grid-cols-[240px_1fr]">
        <aside className="sticky top-0 hidden h-dvh min-h-0 flex-col border-r border-stone-200 bg-white lg:flex">
          <Sidebar />
        </aside>
        {menuOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button type="button" className="absolute inset-0 bg-stone-950/40" aria-label="Close menu" onClick={() => setMenuOpen(false)} />
            <aside className="relative flex h-dvh w-[min(20rem,88vw)] flex-col bg-white shadow-2xl">
              <Sidebar />
            </aside>
          </div>
        )}
        <div className="min-w-0">
          <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/95 px-4 py-2.5 shadow-[0_1px_0_rgba(0,0,0,0.04)] backdrop-blur sm:px-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <button type="button" className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-stone-200 bg-white text-stone-700 lg:hidden" aria-label="Open menu" onClick={() => { setAccountOpen(false); setMenuOpen(true); }}>
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
                </button>
                {current && <span className="hidden text-orange-600 lg:grid"><RailIcon to={current.to} /></span>}
                <h1 className="truncate font-display text-lg font-semibold tracking-tight text-stone-950 sm:text-xl">{heading}</h1>
                {meta?.gold && meta.text && <p className="hidden truncate text-sm font-semibold text-amber-500 sm:block">{meta.text}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {meta?.actions}
                {inboxTo && (
                  <Link to={inboxTo} aria-label={inbox.count ? `Inbox, ${inbox.count} unread` : 'Inbox'} title="Inbox" className={`relative grid h-10 w-10 place-items-center rounded-full ${location.pathname.startsWith(inboxTo) ? 'bg-orange-50 text-orange-700' : 'text-stone-600 hover:bg-orange-50'}`}>
                    <RailIcon to={inboxTo} />
                    {inbox.count > 0 && (
                      <motion.span key={inbox.bump} initial={reduceMotion ? false : { scale: 0.6 }} animate={{ scale: 1 }} className="absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-orange-600 px-1 text-[10px] font-semibold leading-4 text-white">
                        {inbox.count > 9 ? '9+' : inbox.count}
                      </motion.span>
                    )}
                  </Link>
                )}
                <div ref={accountRef} className="relative">
                  <button type="button" aria-label="Account" aria-expanded={accountOpen} className={`grid h-10 w-10 place-items-center rounded-full text-sm font-semibold text-white ${accountOpen ? 'bg-orange-700 ring-2 ring-orange-200' : 'bg-orange-600'}`} onClick={() => setAccountOpen((value) => !value)}>
                    {(name.slice(0, 1) || 'R').toUpperCase()}
                  </button>
                  {accountOpen && (
                    <div className="absolute right-0 z-30 mt-2 w-56 rounded-2xl border border-stone-200 bg-white p-2 shadow-xl shadow-stone-950/10">
                      <div className="mb-1 flex items-center gap-3 border-b border-stone-100 px-2 py-3">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-orange-600 text-sm font-semibold text-white">{(name.slice(0, 1) || 'R').toUpperCase()}</span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-stone-950">{name}</p>
                          <p className="truncate text-xs text-stone-500">{roleLabel(auth.user?.role, title)}</p>
                        </div>
                      </div>
                      {profileTo && <Link to={profileTo} className="block rounded-xl px-3 py-2.5 text-sm font-medium text-stone-800 hover:bg-orange-50" onClick={() => setAccountOpen(false)}>Profile</Link>}
                      <button type="button" className="flex w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium text-rose-600 hover:bg-rose-50" onClick={() => { setAccountOpen(false); void auth.clear().then(() => navigate('/login')); }}>Sign out</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>
          <main className={platform ? 'px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6 sm:px-6' : 'mx-auto max-w-6xl px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6 sm:px-8'}><Rise key={location.pathname}>{children ?? <Outlet />}</Rise></main>
        </div>
      </div>
    </PageMetaContext.Provider>
  );
}

export const businessGroups: NavGroup[] = [
  { heading: 'Overview', items: [{ to: '/business/dashboard', label: 'Dashboard' }] },
  { heading: 'Guests', items: [{ to: '/business/customers', label: 'Customers' }, { to: '/business/plays', label: 'Who played' }, { to: '/business/rewards', label: 'Rewards' }, { to: '/business/redemptions', label: 'Redemptions' }, { to: '/business/purchase-claims', label: 'Claims' }] },
  { heading: 'Counter', items: [{ to: '/business/menu', label: 'Menu' }, { to: '/business/menu/orders', label: 'Orders' }, { to: '/business/games/SpinWheel', label: 'Games', match: '/business/games' }, { to: '/business/qr', label: 'QR & poster' }] },
  { heading: 'Grow', items: [{ to: '/business/reviews', label: 'Reviews' }, { to: '/business/push', label: 'Push' }, { to: '/business/profile', label: 'Profile' }] },
];

export const customerGroups: NavGroup[] = [
  { heading: 'Home', items: [{ to: '/customer/dashboard', label: 'Home' }, { to: '/customer/explore', label: 'Explore' }] },
  { heading: 'Wallet', items: [{ to: '/customer/wallet', label: 'Wallet' }, { to: '/customer/rewards', label: 'Rewards' }, { to: '/customer/offers', label: 'Offers' }, { to: '/customer/my-prizes', label: 'Prizes' }] },
  { heading: 'Visits', items: [{ to: '/customer/my-orders', label: 'Orders' }, { to: '/customer/purchase-claims', label: 'Claims' }, { to: '/customer/history', label: 'History' }] },
  { heading: 'Account', items: [{ to: '/customer/notifications', label: 'Inbox' }, { to: '/customer/profile', label: 'Profile' }] },
];

export const superGroups: NavGroup[] = [
  { heading: 'Platform', items: [{ to: '/super/dashboard', label: 'Overview' }, { to: '/super/businesses', label: 'Businesses' }, { to: '/super/demos', label: 'Demo requests' }, { to: '/super/business-types', label: 'Business types' }, { to: '/super/how-video', label: 'How it works' }] },
];

export const businessNav = businessGroups.flatMap((group) => group.items);
export const customerNav = customerGroups.flatMap((group) => group.items);
export const superNav = superGroups.flatMap((group) => group.items);

function OrderChime() {
  const seen = useRef<number | null>(null);
  useEffect(() => {
    const unlock = () => unlockSound();
    window.addEventListener('pointerdown', unlock, { once: true });
    async function tick() {
      try {
        const data = await api<{ total: number }>('/business/menu/orders?status=Pending&pageSize=1', { quiet: true });
        const total = Number(data.total || 0);
        if (seen.current !== null && total > seen.current) {
          playNotify();
          toastInfo('A new order just arrived.', 'new-order', { title: 'New order', href: '/business/menu/orders' });
        }
        seen.current = total;
      } catch { /* a missed poll should not interrupt the desk */ }
    }
    tick();
    const timer = window.setInterval(tick, 12000);
    return () => { window.clearInterval(timer); window.removeEventListener('pointerdown', unlock); };
  }, []);
  return null;
}

export function StoreShell() {
  const [kind, setKind] = useState('');
  useEffect(() => {
    api<any>('/business/profile').then((profile) => setKind(profile?.typename || profile?.businesstype || '')).catch(() => undefined);
  }, []);
  const label = catalogCopy(kind).nav;
  const groups = businessGroups.map((group) => ({
    ...group,
    items: group.items.map((item) => (item.to === '/business/menu' ? { ...item, label } : item)),
  }));
  return <><OrderChime /><Workspace groups={groups} title="Store" /></>;
}

function CustomerAlerts() {
  const auth = useAuth();
  const inbox = useInboxCount();
  const seen = useRef<Set<number> | null>(null);
  const recent = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (auth.user?.role !== 'Customer') return;
    import('../../lib/push').then(({ getPushPermission, enableBrowserPush }) => {
      getPushPermission().then((permission) => {
        if (permission === 'granted') enableBrowserPush().catch(() => undefined);
      });
    });
    function announce(title: string, message: string, id?: number, href = '/customer/notifications') {
      const textKey = `${title}|${message}`;
      if (recent.current.has(textKey)) return;
      if (id && recent.current.has(`id:${id}`)) return;
      recent.current.add(textKey);
      if (id) recent.current.add(`id:${id}`);
      toastInfo(message || title, id ? `note-${id}` : textKey, { title, detail: message, href });
    }
    function onMessage(event: MessageEvent) {
      if (event.data?.type !== 'push') return;
      announce(String(event.data.title || 'New update'), String(event.data.body || ''), undefined, String(event.data.url || '/customer/notifications'));
    }
    navigator.serviceWorker?.addEventListener('message', onMessage);
    async function tick() {
      try {
        const rows = await api<{ customernotificationid: number; title: string; message: string; notificationtype?: string }[]>('/customer/notifications?filter=Unread', { quiet: true });
        inbox.setCount(rows.length);
        if (seen.current === null) {
          seen.current = new Set(rows.map((row) => row.customernotificationid));
          return;
        }
        rows.forEach((row) => {
          if (seen.current?.has(row.customernotificationid)) return;
          seen.current?.add(row.customernotificationid);
          announce(row.title, row.message, row.customernotificationid, '/customer/notifications');
        });
      } catch { /* a missed poll should not interrupt the wallet */ }
    }
    tick();
    const timer = window.setInterval(tick, 12000);
    return () => {
      window.clearInterval(timer);
      navigator.serviceWorker?.removeEventListener('message', onMessage);
    };
  }, [auth.user?.role, inbox.setCount]);
  return null;
}

export function WalletShell() {
  return <InboxCountProvider><CustomerAlerts /><Workspace groups={customerGroups} title="Wallet" /></InboxCountProvider>;
}

export function PlatformShell() {
  return <Workspace groups={superGroups} title="Platform" variant="platform" />;
}

export function GuestShell({ children, color = '#ea580c', name }: { children: ReactNode; color?: string; name?: string }) {
  const { token } = useParams();
  const location = useLocation();
  const tab = (to: string, label: string) => (
    <NavLink to={to} className={({ isActive }) => `rounded-full px-3 py-1.5 ${isActive ? 'bg-white text-stone-900' : 'text-white/75 hover:text-white'}`}>
      {label}
    </NavLink>
  );
  return (
    <div className="relative min-h-screen overflow-hidden bg-stone-950 text-white">
      <div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(900px 420px at 50% -10%, ${color}66, transparent 55%)` }} />
      <div className="pointer-events-none absolute inset-0 opacity-[0.22]" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,.55) 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(12,10,9,.15),rgba(12,10,9,.82))]" />
      <div className="relative mx-auto max-w-lg px-4 pb-10 pt-5">
        <nav className="mb-5 flex items-center justify-between gap-3">
          <p className="truncate text-sm font-semibold">{name || 'Repeat Mate'}</p>
          <div className="flex shrink-0 rounded-full bg-white/10 p-1 text-xs font-semibold backdrop-blur">
            {tab(`/play/${token}`, 'Play')}
            {tab(`/menu/${token}`, 'Menu')}
            {tab(`/review/${token}`, 'Review')}
          </div>
        </nav>
        <Rise key={location.pathname}>{children}</Rise>
      </div>
    </div>
  );
}


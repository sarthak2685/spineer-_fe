import { Link, NavLink, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ReactNode, useEffect, useState } from 'react';
import { Rise } from '../motion';
import { Brand, PageMeta, PageMetaContext } from '../ui';
import { useAuth } from '../../app/auth';

export type NavItem = { to: string; label: string; match?: string };
export type NavGroup = { heading: string; items: NavItem[] };

const productLinks = [
  { hash: 'how', label: 'How it works' },
  { hash: 'games', label: 'Games' },
  { hash: 'pricing', label: 'Pricing' },
];

function SectionLink({ hash, children, className, onNavigate, light = false }: { hash: string; children: ReactNode; className?: string; onNavigate?: () => void; light?: boolean }) {
  const location = useLocation();
  const active = location.pathname === '/' && location.hash === `#${hash}`;
  const tone = light ? (active ? 'text-orange-400' : 'text-white/70 hover:text-white') : (active ? 'text-orange-600' : 'text-stone-600 hover:text-orange-600');
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
      {children}
    </Link>
  );
}

export function Marketing({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  useEffect(() => { setOpen(false); }, [location.pathname, location.hash]);
  const item = 'flex min-h-11 items-center rounded-xl px-3 text-sm font-medium hover:bg-stone-100 hover:text-orange-600';
  return (
    <div className="min-h-screen bg-orange-50">
      <header className="sticky top-0 z-20 border-b border-stone-200 bg-orange-50/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3">
          <Brand />
          <nav className="hidden items-center gap-5 text-sm font-medium text-stone-600 md:flex">
            {productLinks.map((link) => <SectionLink key={link.hash} hash={link.hash} className="inline-flex min-h-11 items-center">{link.label}</SectionLink>)}
            <NavLink to="/about" className="inline-flex min-h-11 items-center transition hover:text-orange-600">About</NavLink>
            <NavLink to="/contact" className="inline-flex min-h-11 items-center transition hover:text-orange-600">Contact</NavLink>
          </nav>
          <div className="flex items-center gap-2">
            <NavLink to="/login" className="inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold text-stone-600 transition hover:text-orange-600">Sign in</NavLink>
            <NavLink to="/register" className="hidden min-h-11 items-center rounded-full bg-orange-600 px-4 text-sm font-semibold text-white transition hover:bg-orange-700 md:inline-flex">Start your business</NavLink>
            <button type="button" className="grid h-11 w-11 place-items-center rounded-full border border-stone-200 md:hidden" aria-expanded={open} aria-controls="marketing-menu" aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen((value) => !value)}>
              <span className="flex w-4 flex-col gap-1" aria-hidden="true"><span className="h-0.5 bg-stone-950" /><span className="h-0.5 bg-stone-950" /><span className="h-0.5 bg-stone-950" /></span>
            </button>
          </div>
        </div>
        {open && (
          <nav id="marketing-menu" className="grid gap-1 border-t border-stone-100 px-4 py-3 md:hidden">
            {productLinks.map((link) => <SectionLink key={link.hash} hash={link.hash} className={item} onNavigate={() => setOpen(false)}>{link.label}</SectionLink>)}
            <NavLink to="/about" className={`${item} text-stone-600`} onClick={() => setOpen(false)}>About</NavLink>
            <NavLink to="/contact" className={`${item} text-stone-600`} onClick={() => setOpen(false)}>Contact</NavLink>
            <NavLink to="/login" className={`${item} text-stone-600`} onClick={() => setOpen(false)}>Sign in</NavLink>
            <NavLink to="/register" className={`${item} text-stone-600`} onClick={() => setOpen(false)}>Start your business</NavLink>
            <NavLink to="/customer-register" className={`${item} text-stone-600`} onClick={() => setOpen(false)}>Customer signup</NavLink>
          </nav>
        )}
      </header>
      <main>{location.pathname === '/' ? children : <Rise key={location.pathname}>{children}</Rise>}</main>
      <footer className="border-t border-stone-200 bg-white px-5 py-12 text-sm text-stone-500">
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-4">
          <div>
            <Brand />
            <p className="mt-3 max-w-xs leading-relaxed">Gamified loyalty for restaurants, salons, gyms, clinics, and shops. One QR. Four games. One wallet.</p>
          </div>
          <div className="space-y-2"><p className="font-semibold text-stone-950">Product</p>{productLinks.map((link) => <span key={link.hash}><SectionLink hash={link.hash}>{link.label}</SectionLink><br /></span>)}</div>
          <div className="space-y-2"><p className="font-semibold text-stone-950">Accounts</p><Linkish to="/login">Sign in</Linkish><br /><Linkish to="/register">Business signup</Linkish><br /><Linkish to="/customer-register">Customer signup</Linkish></div>
          <div className="space-y-2"><p className="font-semibold text-stone-950">Company</p><Linkish to="/about">About</Linkish><br /><Linkish to="/contact">Contact</Linkish></div>
        </div>
        <p className="mx-auto mt-10 max-w-6xl border-t border-stone-200 pt-6 text-xs text-stone-400">One QR. Four games. One wallet.</p>
      </footer>
    </div>
  );
}

function Linkish({ to, children, light = false }: { to: string; children: ReactNode; light?: boolean }) {
  return <NavLink to={to} className={light ? 'text-white/70 hover:text-white' : 'hover:text-orange-600'}>{children}</NavLink>;
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

function NavGlyph({ name }: { name: 'overview' | 'shops' | 'types' }) {
  const common = { viewBox: '0 0 24 24', className: 'h-4 w-4', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (name === 'overview') return <svg {...common}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>;
  if (name === 'shops') return <svg {...common}><path d="M4 10h16v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-9z" /><path d="M3 10l2-5h14l2 5" /><path d="M9 20v-6h6v6" /></svg>;
  return <svg {...common}><path d="M8 7h11M8 12h11M8 17h11" /><circle cx="4" cy="7" r="1" fill="currentColor" stroke="none" /><circle cx="4" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="4" cy="17" r="1" fill="currentColor" stroke="none" /></svg>;
}

function platformIcon(to: string): 'overview' | 'shops' | 'types' {
  if (to.includes('business-types')) return 'types';
  if (to.includes('businesses')) return 'shops';
  return 'overview';
}

export function Workspace({ groups, children, title, mobile, variant = 'default' }: { groups: NavGroup[]; children?: ReactNode; title?: string; mobile?: NavItem[]; variant?: 'default' | 'platform' }) {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const platform = variant === 'platform';
  const [meta, setMeta] = useState<PageMeta | null>(null);
  const items = groups.flatMap((group) => group.items);
  const current = items
    .filter((item) => location.pathname === item.to || location.pathname.startsWith(`${item.to}/`))
    .sort((a, b) => b.to.length - a.to.length)[0];
  const heading = meta?.title || current?.label || 'RewardSpinner';
  const name = accountName(auth.user?.name);
  return (
    <PageMetaContext.Provider value={setMeta}>
      <div className={`min-h-screen bg-orange-50 lg:grid ${platform ? 'lg:grid-cols-[240px_1fr]' : 'lg:grid-cols-[248px_1fr]'}`}>
        <aside className={`sticky top-0 hidden h-screen flex-col border-r border-stone-200 lg:flex ${platform ? 'bg-white' : 'bg-stone-100'}`}>
          <div className="px-5 pb-2 pt-6"><Brand /></div>
          <nav className="mt-4 flex-1 space-y-6 overflow-y-auto px-3 pb-4">
            {groups.map((group) => (
              <div key={group.heading}>
                <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-400">{group.heading}</p>
                <div className="space-y-0.5">
                  {group.items.map((item) => (
                    <NavLink key={item.to} to={item.to} end={!item.match} className={({ isActive }) => {
                      const active = item.match ? location.pathname.startsWith(item.match) : isActive;
                      const on = platform ? 'bg-orange-100 text-orange-700' : 'bg-white text-orange-700 shadow-sm';
                      const off = platform ? 'text-stone-600 hover:bg-orange-50 hover:text-stone-950' : 'text-stone-600 hover:bg-stone-200/80 hover:text-stone-950';
                      return `flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition ${active ? on : off}`;
                    }}>
                      {platform && <NavGlyph name={platformIcon(item.to)} />}
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </nav>
          <div className={`sticky bottom-0 mt-auto border-t border-stone-200 px-4 py-4 ${platform ? 'bg-white' : 'bg-stone-100'}`}>
            <p className="truncate text-sm font-semibold text-stone-950">{name}</p>
            <p className="text-xs text-stone-500">{roleLabel(auth.user?.role, title)}</p>
            <button className="mt-3 text-sm font-medium text-stone-500 transition hover:text-orange-600" onClick={() => auth.clear().then(() => navigate('/login'))}>Sign out</button>
          </div>
        </aside>
        <div className="min-w-0">
          <header className={`sticky top-0 z-20 border-b border-stone-200 px-4 backdrop-blur sm:px-6 ${platform ? 'bg-white py-3' : 'bg-stone-100/95 py-4 sm:px-8'}`}>
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-medium text-stone-500 lg:hidden">{name}</p>
                {meta?.kicker && <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-600">{meta.kicker}</p>}
                <h1 className="truncate font-display text-2xl font-semibold tracking-tight text-stone-950">{heading}</h1>
                {meta?.text && <p className={`mt-0.5 max-w-2xl text-sm ${meta.gold ? 'font-semibold text-amber-500' : 'text-stone-500'}`}>{meta.text}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {meta?.actions}
                {platform && (
                  <div className="hidden items-center gap-2 rounded-full bg-orange-50 py-1 pl-1 pr-3 sm:flex">
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-orange-600 text-xs font-semibold text-white">{name.slice(0, 1)}</span>
                    <span className="max-w-[9rem] truncate text-sm font-semibold text-stone-950">{name}</span>
                  </div>
                )}
                <button className="rounded-full border border-stone-300 bg-stone-50 px-3 py-1.5 text-sm font-semibold text-stone-600 lg:hidden" onClick={() => auth.clear().then(() => navigate('/login'))}>Sign out</button>
              </div>
            </div>
          </header>
          <main className={platform ? 'px-4 py-6 pb-24 sm:px-6' : 'mx-auto max-w-6xl px-4 py-6 pb-24 sm:px-8'}><Rise key={location.pathname}>{children ?? <Outlet />}</Rise></main>
          <MobileBar items={mobile || items} />
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
  { heading: 'Platform', items: [{ to: '/super/dashboard', label: 'Overview' }, { to: '/super/businesses', label: 'Businesses' }, { to: '/super/business-types', label: 'Business types' }] },
];

export const businessNav = businessGroups.flatMap((group) => group.items);
export const customerNav = customerGroups.flatMap((group) => group.items);
export const superNav = superGroups.flatMap((group) => group.items);

export const businessMobile: NavItem[] = [
  { to: '/business/dashboard', label: 'Home' },
  { to: '/business/customers', label: 'Guests' },
  { to: '/business/menu', label: 'Menu' },
  { to: '/business/menu/orders', label: 'Orders' },
  { to: '/business/rewards', label: 'Rewards' },
];

export const customerMobile: NavItem[] = [
  { to: '/customer/dashboard', label: 'Home' },
  { to: '/customer/explore', label: 'Menu' },
  { to: '/customer/my-orders', label: 'Orders' },
  { to: '/customer/wallet', label: 'Wallet' },
  { to: '/customer/notifications', label: 'Alerts' },
];

export function StoreShell() {
  return <Workspace groups={businessGroups} title="Store" mobile={businessMobile} />;
}

export function WalletShell() {
  return <Workspace groups={customerGroups} title="Wallet" mobile={customerMobile} />;
}

export const superMobile: NavItem[] = [
  { to: '/super/dashboard', label: 'Overview' },
  { to: '/super/businesses', label: 'Businesses' },
  { to: '/super/business-types', label: 'Types' },
];

export function PlatformShell() {
  return <Workspace groups={superGroups} title="Platform" mobile={superMobile} variant="platform" />;
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
          <p className="truncate text-sm font-semibold">{name || 'RewardSpinner'}</p>
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

export function MobileBar({ items }: { items: NavItem[] }) {
  return (
    <nav className={`fixed inset-x-0 bottom-0 z-20 grid border-t border-stone-200 bg-white/95 px-1 py-2 backdrop-blur lg:hidden ${items.length <= 3 ? 'grid-cols-3' : items.length === 4 ? 'grid-cols-4' : 'grid-cols-5'}`}>
      {items.slice(0, 5).map((item) => <NavLink key={item.to} to={item.to} className={({ isActive }) => `truncate px-1 text-center text-[11px] font-medium ${isActive ? 'text-orange-600' : 'text-stone-500'}`}>{item.label}</NavLink>)}
    </nav>
  );
}
